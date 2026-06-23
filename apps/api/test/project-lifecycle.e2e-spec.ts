import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, AccountType, ProposalStatus, VerificationStatus, ProjectStatus } from '@givar/database';

describe('Project Lifecycle & Vendor Binding (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let config: ConfigService;
    let jwtService: JwtService;

    let organizerToken: string;
    let adminToken: string;
    let testProposalId: string;
    let categoryId: string;
    let subcategoryId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
        config = app.get<ConfigService>(ConfigService);
        jwtService = app.get<JwtService>(JwtService);

        const category = await prisma.category.create({
            data: { name: `TestCat-${Date.now()}`, slug: `test-cat-${Date.now()}` }
        });
        categoryId = category.id;

        const subcategory = await prisma.subcategory.create({
            data: { name: 'TestFocus', slug: `test-focus-${Date.now()}`, categoryId }
        });
        subcategoryId = subcategory.id;

        const organizer = await prisma.user.create({
            data: {
                email: `org-${Date.now()}@givar.local`,
                firstName: 'Org',
                lastName: 'Test',
                passwordHash: 'hashed',
                role: UserRole.USER,
                accountType: AccountType.CORPORATE,
                emailVerified: true,
                organization: {
                    create: {
                        legalName: 'Test Org',
                        status: VerificationStatus.VERIFIED // Required to submit proposals
                    }
                }
            }
        });

        organizerToken = jwtService.sign({ sub: organizer.id, role: organizer.role }, { secret: config.get('JWT_SECRET') });

        const admin = await prisma.user.create({
            data: {
                email: `sysadmin-${Date.now()}@givar.local`,
                firstName: 'Sys',
                lastName: 'Admin',
                passwordHash: 'hashed',
                role: UserRole.ADMIN,
            }
        });

        adminToken = jwtService.sign({ sub: admin.id, role: admin.role }, { secret: config.get('JWT_SECRET') });
    });

    afterAll(async () => {
        await prisma.project.deleteMany({ where: { proposalId: testProposalId } });
        await prisma.projectProposal.deleteMany({ where: { id: testProposalId } });
        await prisma.subcategory.delete({ where: { id: subcategoryId } });
        await prisma.category.delete({ where: { id: categoryId } });
        await prisma.organizationProfile.deleteMany({ where: { user: { email: { contains: '@givar.local' } } } });
        await prisma.user.deleteMany({ where: { email: { contains: '@givar.local' } } });
        await app.close();
    });

    it('Creates a draft successfully', async () => {
        const response = await request(app.getHttpServer())
            .post('/proposals')
            .set('Authorization', `Bearer ${organizerToken}`)
            .send({
                title: 'Lifecycle Test Cause',
                categoryId,
                subcategoryId
            });

        expect(response.status).toBe(201);
        testProposalId = response.body.id;
        expect(response.body.status).toBe(ProposalStatus.DRAFT);
    });

    it('Rejects submission if missing strict content requirements', async () => {
        // Proposal currently lacks a cover image, detailed description, and budget
        const response = await request(app.getHttpServer())
            .patch(`/proposals/${testProposalId}/submit`)
            .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('description');
    });

    it('Successfully submits the proposal after requirements are met', async () => {
        // Inject valid payload directly to bypass multi-step UI operations
        await prisma.projectProposal.update({
            where: { id: testProposalId },
            data: {
                description: 'This is a sufficiently long description that satisfies the twenty character rule.',
                coverImage: 'valid-s3-key.jpg',
                location: 'Test City',
                targetAmount: 1000000n, // 10,000
                kycDocuments: ['doc.pdf'],
                vendors: [{ id: 'v1', name: 'Unbound Vendor' }],
                budgetBreakdown: [{
                    id: 'b1', description: 'Test Item', amount: 10000, costType: 'SERVICE', stage: 'Main Stage', vendorId: 'v1'
                }]
            }
        });

        const response = await request(app.getHttpServer())
            .patch(`/proposals/${testProposalId}/submit`)
            .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(ProposalStatus.SUBMITTED);
    });

    it('Rejects administrative approval if vendor routing is unbound', async () => {
        const response = await request(app.getHttpServer())
            .patch(`/admin/proposals/${testProposalId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);

        // The budget item exists, but the vendor lacks a 'subaccountCode'
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Strict Non-Custodial Policy');
    });

    it('Successfully launches the project after admin binds the vendor subaccount', async () => {
        // Admin manually injects the missing subaccount code to bind the vendor
        const proposal = await prisma.projectProposal.findUnique({ where: { id: testProposalId } });
        const vendors = (proposal!.vendors as any[]);
        vendors[0].subaccountCode = 'ACCT_MOCK_ROUTING';

        await prisma.projectProposal.update({
            where: { id: testProposalId },
            data: { vendors }
        });

        const response = await request(app.getHttpServer())
            .patch(`/admin/proposals/${testProposalId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(ProjectStatus.ACTIVE);

        // Assert the new live project was generated
        const liveProject = await prisma.project.findUnique({ where: { proposalId: testProposalId } });
        expect(liveProject).toBeDefined();
        expect(liveProject!.slug).toBeDefined();
    });
});