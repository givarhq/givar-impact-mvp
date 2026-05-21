import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@givar/database';
import * as bcrypt from 'bcrypt';

describe('Administrative Governance & Security (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let config: ConfigService;
    let jwtService: JwtService;

    let standardAdminToken: string;
    let superadminToken: string;
    const superadminPass = 'RootAccess123!';

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

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(superadminPass, salt);

        const sAdmin = await prisma.user.create({
            data: {
                email: `root-${Date.now()}@givar.local`,
                firstName: 'Super',
                lastName: 'Admin',
                passwordHash: hash,
                role: UserRole.SUPERADMIN,
            }
        });

        const stdAdmin = await prisma.user.create({
            data: {
                email: `ops-${Date.now()}@givar.local`,
                firstName: 'Standard',
                lastName: 'Admin',
                passwordHash: 'hashed',
                role: UserRole.ADMIN,
            }
        });

        superadminToken = jwtService.sign({ sub: sAdmin.id, role: sAdmin.role }, { secret: config.get('JWT_SECRET') });
        standardAdminToken = jwtService.sign({ sub: stdAdmin.id, role: stdAdmin.role }, { secret: config.get('JWT_SECRET') });
    });

    afterAll(async () => {
        await prisma.transactionFeeRule.deleteMany({ where: { creator: { email: { contains: 'root-' } } } });
        await prisma.auditLog.deleteMany({ where: { user: { email: { contains: '@givar.local' } } } });
        await prisma.user.deleteMany({ where: { email: { contains: '@givar.local' } } });
        await app.close();
    });

    it('Rejects global fee modifications from standard administrators', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/fees/update')
            .set('Authorization', `Bearer ${standardAdminToken}`)
            .send({
                percentage: 3.5,
                optionalTipEnabled: false,
                targetType: 'GLOBAL',
                password: 'any_password'
            });

        // The RolesGuard should block standard ADMINs because the endpoint requires SUPERADMIN
        expect(response.status).toBe(403);
    });

    it('Allows superadmins to modify global fees via Step-Up Authentication', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/fees/update')
            .set('Authorization', `Bearer ${superadminToken}`)
            .send({
                percentage: 3.5, // Changing fee to 3.5%
                optionalTipEnabled: false,
                targetType: 'GLOBAL',
                password: superadminPass // Providing the required step-up auth password
            });

        expect(response.status).toBe(201);
        expect(response.body.percentage).toBe(3.5);

        // Verify the old rule was archived and the new rule is active
        const activeRules = await prisma.transactionFeeRule.findMany({ where: { appliesGlobally: true, isActive: true } });
        expect(activeRules.length).toBe(1);
        expect(activeRules[0].percentage).toBe(3.5);
    });

    it('Rejects Dust Sweep protocol execution from standard administrators', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/ledger/sweep')
            .set('Authorization', `Bearer ${standardAdminToken}`);

        // Dust Sweep requires SUPERADMIN access inside the controller
        expect(response.status).toBe(403);
    });

    it('Successfully authorizes Dust Sweep protocol for superadmins', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/ledger/sweep')
            .set('Authorization', `Bearer ${superadminToken}`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('swept');
    });
});