import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ProjectStatus, Currency, UserRole, AccountType } from '@givar/database';

describe('Financial Mathematics & Limits (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let config: ConfigService;
    let jwtService: JwtService;

    let testUserId: string;
    let testProjectId: string;
    let feeRuleId: string;
    let userToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication({ rawBody: true });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

        (BigInt.prototype as any).toJSON = function () {
            return this.toString();
        };

        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
        config = app.get<ConfigService>(ConfigService);
        jwtService = app.get<JwtService>(JwtService);

        // 1. Seed Isolated Target Data
        const admin = await prisma.user.create({
            data: {
                email: `fin-admin-${Date.now()}@givar.local`,
                firstName: 'Fin',
                lastName: 'Admin',
                passwordHash: 'hashed',
                role: UserRole.SUPERADMIN,
            }
        });

        const user = await prisma.user.create({
            data: {
                email: `fin-donor-${Date.now()}@givar.local`,
                firstName: 'Fin',
                lastName: 'Donor',
                passwordHash: 'hashed',
                role: UserRole.USER,
                accountType: AccountType.INDIVIDUAL,
                emailVerified: true,
            }
        });
        testUserId = user.id;

        userToken = jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        }, { secret: config.get<string>('JWT_SECRET') });

        const rule = await prisma.transactionFeeRule.create({
            data: {
                percentage: 2.5,
                appliesGlobally: true,
                optionalTipEnabled: true,
                createdById: admin.id,
                isActive: true,
            }
        });
        feeRuleId = rule.id;

        // Phase 1 is exactly 10,000 NGN (1,000,000 minor units)
        const project = await prisma.project.create({
            data: {
                userId: user.id,
                title: 'Financial Limits Cause',
                slug: `fin-test-${Date.now()}`,
                description: 'Testing phase allocation limits.',
                targetAmount: 5000000n, // 50,000 NGN
                raisedAmount: 0n,
                currency: Currency.NGN,
                status: ProjectStatus.ACTIVE,
                isActive: true,
                currentPhaseIndex: 0,
                budgetBreakdown: [
                    { id: 'b1', description: 'Phase 1 Items', amount: 10000, costType: 'SERVICE', stage: 'Early Stage', vendorId: 'v1', vendorSubaccount: 'ACCT_TEST' },
                    { id: 'b2', description: 'Phase 2 Items', amount: 40000, costType: 'SERVICE', stage: 'Main Stage', vendorId: 'v1', vendorSubaccount: 'ACCT_TEST' }
                ],
                vendors: [
                    { id: 'v1', name: 'Test Vendor', subaccountCode: 'ACCT_TEST1234' }
                ],
                executionTimeline: [
                    { id: 't1', phase: 'Early Stage', status: 'PENDING', deliverables: 'Test 1' },
                    { id: 't2', phase: 'Main Stage', status: 'PENDING', deliverables: 'Test 2' }
                ]
            }
        });
        testProjectId = project.id;
    });

    afterAll(async () => {
        // Teardown: Self-healing cleanup for orphaned records from prior crashed runs
        await prisma.donation.deleteMany({ where: { transaction: { reference: { contains: 'FIN-TEST' } } } });
        await prisma.donation.deleteMany({ where: { projectId: testProjectId } });
        await prisma.walletTransaction.deleteMany({ where: { reference: { contains: 'FIN-TEST' } } });
        await prisma.project.delete({ where: { id: testProjectId } });
        await prisma.transactionFeeRule.delete({ where: { id: feeRuleId } });
        await prisma.wallet.deleteMany({ where: { user: { email: { contains: 'fin-' } } } });
        await prisma.user.deleteMany({ where: { email: { contains: 'fin-' } } });
        await app.close();
    });

    it('Rejects donations below the platform minimum threshold (100 NGN)', async () => {
        const response = await request(app.getHttpServer())
            .post('/donations/direct')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                projectId: testProjectId,
                amount: '5000', // 50 NGN
                currency: 'NGN'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Minimum donation');
    });

    it('Rejects donations that exceed the current execution phase cap', async () => {
        // Attack: Attempt to donate 20,000 NGN when Phase 1 is capped at 10,000 NGN
        const response = await request(app.getHttpServer())
            .post('/donations/direct')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                projectId: testProjectId,
                amount: '2000000', // 20,000 NGN
                currency: 'NGN'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('exceeds the remaining capacity');
    });

    it('Accurately processes financial splits upon successful webhook verification', async () => {
        const testReference = `FIN-TEST-${Date.now()}`;

        // Simulating a 5,000 NGN donation (500,000 kobo)
        const baseAmount = 500000n;
        const feeAmount = 12500n; // 2.5% of 5,000 = 125 NGN
        const tipAmount = 5000n; // 50 NGN tip
        const totalAmount = baseAmount + feeAmount + tipAmount;

        const payload = {
            event: 'charge.success',
            data: {
                reference: testReference,
                amount: Number(totalAmount),
                currency: 'NGN',
                channel: 'card',
                metadata: {
                    donationType: 'DIRECT',
                    userId: testUserId,
                    projectId: testProjectId,
                    baseAmount: baseAmount.toString(),
                    feeAmount: feeAmount.toString(),
                    tipAmount: tipAmount.toString(),
                    feePercentage: 2.5,
                    feeRuleId: feeRuleId
                }
            }
        };

        const rawPayload = JSON.stringify(payload);
        const secret = config.get<string>('PAYSTACK_SECRET_KEY') || 'sk_test_mock';
        const signature = crypto.createHmac('sha512', secret).update(rawPayload).digest('hex');

        const response = await request(app.getHttpServer())
            .post('/wallet/webhook')
            .set('x-paystack-signature', signature)
            .set('Content-Type', 'application/json')
            .send(rawPayload);

        expect(response.status).toBe(200);

        // Verify the math on the database ledger
        const donation = await prisma.donation.findFirst({
            where: { transaction: { reference: testReference } }
        });

        expect(donation).toBeDefined();
        expect(donation!.baseAmount.toString()).toBe(baseAmount.toString());
        expect(donation!.feeAmount.toString()).toBe(feeAmount.toString());
        expect(donation!.tipAmount.toString()).toBe(tipAmount.toString());

        // Verify the project was only credited the base amount
        const project = await prisma.project.findUnique({ where: { id: testProjectId } });
        expect(project!.raisedAmount.toString()).toBe(baseAmount.toString());
    });
});