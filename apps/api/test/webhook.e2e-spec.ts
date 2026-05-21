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

describe('Financial engine and security protocols (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let config: ConfigService;
    let jwtService: JwtService;

    let testUserId: string;
    let testAdminId: string;
    let testProjectId: string;
    let feeRuleId: string;

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

        // Seed Isolated Test Data
        const user = await prisma.user.create({
            data: {
                email: `donor-${Date.now()}@test.com`,
                firstName: 'Test',
                lastName: 'Donor',
                passwordHash: 'hashed',
                role: UserRole.USER,
                accountType: AccountType.INDIVIDUAL,
                emailVerified: true,
            }
        });
        testUserId = user.id;

        const admin = await prisma.user.create({
            data: {
                email: `admin-${Date.now()}@test.com`,
                firstName: 'Test',
                lastName: 'Admin',
                passwordHash: 'hashed',
                role: UserRole.SUPERADMIN,
                accountType: AccountType.INDIVIDUAL,
                emailVerified: true,
            }
        });
        testAdminId = admin.id;

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

        const project = await prisma.project.create({
            data: {
                userId: user.id,
                title: 'Concurrency Test Cause',
                slug: `race-test-${Date.now()}`,
                description: 'Testing the ledger locks.',
                targetAmount: 5000000n,
                raisedAmount: 0n,
                currency: Currency.NGN,
                status: ProjectStatus.ACTIVE,
                isActive: true,
                currentPhaseIndex: 0,
                budgetBreakdown: [
                    { id: 'b1', description: 'Phase 1', amount: 50000, costType: 'SERVICE', stage: 'Main Stage', vendorId: 'v1' }
                ],
                vendors: [
                    { id: 'v1', name: 'Test Vendor', subaccountCode: 'ACCT_TEST1234' }
                ],
                executionTimeline: [
                    { id: 't1', phase: 'Main Stage', status: 'PENDING', deliverables: 'Test' }
                ]
            }
        });
        testProjectId = project.id;
    });

    afterAll(async () => {
        // Teardown
        await prisma.donation.deleteMany({ where: { projectId: testProjectId } });
        await prisma.walletTransaction.deleteMany({ where: { reference: { contains: 'RACE-REF' } } });
        await prisma.project.delete({ where: { id: testProjectId } });
        await prisma.transactionFeeRule.delete({ where: { id: feeRuleId } });
        await prisma.wallet.deleteMany({ where: { userId: { in: [testUserId, testAdminId] } } });
        await prisma.user.deleteMany({ where: { id: { in: [testUserId, testAdminId] } } });
        await app.close();
    });

    it('Defends against unauthorized webhook signatures', async () => {
        const payload = { event: 'charge.success', data: { reference: 'RACE-REF-BAD' } };
        const rawPayload = JSON.stringify(payload);

        // Attack: Forged signature using wrong secret
        const forgedSignature = crypto.createHmac('sha512', 'wrong_secret').update(rawPayload).digest('hex');

        const response = await request(app.getHttpServer())
            .post('/wallet/webhook')
            .set('x-paystack-signature', forgedSignature)
            .set('Content-Type', 'application/json')
            .send(rawPayload);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid webhook signature');
    });

    it('Prevents race conditions and duplicate crediting on concurrent webhooks', async () => {
        const testReference = `RACE-REF-${Date.now()}`;
        const baseAmount = 1000000n; // 10,000 NGN
        const feeAmount = 25000n; // 2.5% fee
        const totalAmount = baseAmount + feeAmount;

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
                    tipAmount: '0',
                    feePercentage: 2.5,
                    feeRuleId: feeRuleId
                }
            }
        };

        const rawPayload = JSON.stringify(payload);
        const secret = config.get<string>('PAYSTACK_SECRET_KEY') || 'sk_test_mock';
        const signature = crypto.createHmac('sha512', secret).update(rawPayload).digest('hex');

        // Attack: Fire 20 identical webhook requests simultaneously to simulate severe network concurrency
        const requests = Array.from({ length: 20 }).map(() =>
            request(app.getHttpServer())
                .post('/wallet/webhook')
                .set('x-paystack-signature', signature)
                .set('Content-Type', 'application/json')
                .send(rawPayload)
        );

        const responses = await Promise.all(requests);

        // All responses should be 200 OK (idempotency catches the duplicates and returns success without crashing)
        responses.forEach(res => {
            expect(res.status).toBe(200);
        });

        // CRITICAL ASSERTION: Ensure the project was only credited exactly ONCE
        const project = await prisma.project.findUnique({ where: { id: testProjectId } });
        expect(project!.raisedAmount.toString()).toBe(baseAmount.toString());

        // CRITICAL ASSERTION: Ensure only ONE donation record was created
        const donationCount = await prisma.donation.count({ where: { transaction: { reference: testReference } } });
        expect(donationCount).toBe(1);
    });

    it('Blocks mutations during forensic impersonation sessions', async () => {
        // Generate a valid JWT with the 'isImpersonating' flag set to true
        const proxyToken = jwtService.sign({
            sub: testUserId,
            email: 'donor@test.com',
            role: UserRole.USER,
            isImpersonating: true,
            adminId: testAdminId
        }, { secret: config.get<string>('JWT_SECRET') });

        // Attack: Attempt to update user preferences while impersonating
        const response = await request(app.getHttpServer())
            .patch('/auth/preferences')
            .set('Authorization', `Bearer ${proxyToken}`)
            .send({ marketing: true });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('READ_ONLY_MODE_ACTIVE');
    });

    it('Blocks direct donations exceeding high-capital limit', async () => {
        // Generate standard user token
        const token = jwtService.sign({
            sub: testUserId,
            email: 'donor@test.com',
            role: UserRole.USER,
        }, { secret: config.get<string>('JWT_SECRET') });

        // Attack: Attempt to donate 500,000,000 NGN (Exceeds 100m NGN limit)
        const response = await request(app.getHttpServer())
            .post('/donations/direct')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectId: testProjectId,
                amount: '50000000000', // 500M in kobo
                currency: 'NGN'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('exceeds high-capital threshold');
    });
});