import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, AccountType, ProjectStatus, ProposalStatus, VerificationStatus, Currency } from '@givar/database';

describe('Privacy, Limits & State Machines (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let config: ConfigService;

    let testUserId: string;
    let userToken: string;
    let testProjectSlug: string;

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

        // 1. Seed Organizer User
        const user = await prisma.user.create({
            data: {
                email: `states-${Date.now()}@givar.local`,
                firstName: 'State',
                lastName: 'Tester',
                passwordHash: 'hashed',
                role: UserRole.USER,
                accountType: AccountType.CORPORATE,
                emailVerified: true,
                organization: {
                    create: {
                        legalName: 'State Test Org',
                        kycType: 'ORGANIZATION',
                        status: VerificationStatus.VERIFIED
                    }
                }
            }
        });
        testUserId = user.id;

        userToken = jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        }, { secret: config.get<string>('JWT_SECRET') });

        // 2. Seed a Live Project with Waitlist Emails (Simulating PII)
        const project = await prisma.project.create({
            data: {
                userId: user.id,
                title: 'Data Privacy Cause',
                slug: `privacy-test-${Date.now()}`,
                description: 'Testing PII leakage.',
                targetAmount: 100000n,
                raisedAmount: 0n,
                currency: Currency.NGN,
                status: ProjectStatus.ACTIVE,
                isActive: true,
                waitlistEmails: ['hidden.donor@example.com', 'secret@givar.local'] // Sensitive PII
            }
        });
        testProjectSlug = project.slug;

        // 3. Seed a Submitted Proposal
        await prisma.projectProposal.create({
            data: {
                userId: user.id,
                title: 'State Machine Test Proposal',
                status: ProposalStatus.SUBMITTED, // Waiting for admin review
                currency: Currency.NGN
            }
        });
    });

    afterAll(async () => {
        await prisma.project.deleteMany({ where: { userId: testUserId } });
        await prisma.projectProposal.deleteMany({ where: { userId: testUserId } });
        await prisma.organizationProfile.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
        await app.close();
    });

    it('Defends against Database OOM via Query Parameter Exhaustion (Ledger Limit Cap)', async () => {
        // Attack: Attempt to pull 500,000 ledger records to crash the server RAM
        const response = await request(app.getHttpServer())
            .get('/projects/ledger/global?limit=500000');

        // Assertion: ValidationPipe MUST block this based on the @Max(100) DTO rule
        expect(response.status).toBe(400);
        expect(response.body.message[0]).toContain('Limit cannot exceed 100');
    });

    it('Enforces Data Privacy: Ensures Waitlist Emails (PII) never leak on public routes', async () => {
        // Fetch the project publicly
        const response = await request(app.getHttpServer())
            .get(`/projects/${testProjectSlug}`);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('Data Privacy Cause');

        // Assertion: The waitlistEmails array MUST be completely scrubbed from the response
        expect(response.body.waitlistEmails).toBeUndefined();

        // Ensure the raw PII strings are nowhere in the JSON payload
        const rawJson = JSON.stringify(response.body);
        expect(rawJson).not.toContain('hidden.donor@example.com');
    });

    it('Enforces State Machine Integrity: Downgrading account reverts SUBMITTED proposals to DRAFT', async () => {
        // Setup: Delete the active project so the backend doesn't block the downgrade attempt
        await prisma.project.deleteMany({ where: { userId: testUserId } });

        // Attack/Edge-Case: The user drops their verified Organizer status to Individual
        const response = await request(app.getHttpServer())
            .post('/auth/account-type/switch')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ type: 'INDIVIDUAL' });

        expect(response.status).toBe(201);

        // Verification: The system should have identified the KYC tier mismatch and pulled the active proposal back to DRAFT
        const proposals = await prisma.projectProposal.findMany({
            where: { userId: testUserId }
        });

        expect(proposals.length).toBe(1);

        // Assertion: The proposal MUST no longer be in the SUBMITTED queue awaiting admin approval
        expect(proposals[0].status).toBe(ProposalStatus.DRAFT);
        expect(proposals[0].adminFeedback).toContain('System Reset: Account type changed');
    });
});