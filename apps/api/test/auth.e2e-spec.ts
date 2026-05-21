import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { UserRole, AccountType } from '@givar/database';

describe('Authentication & Identity Protocols (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    const testEmail = `brute-force-${Date.now()}@givarapp.com`;
    const testPassword = 'SecurePassword123!';
    let testUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.getHttpAdapter().getInstance().set('trust proxy', 1);
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Seed test user via the actual API to ensure password hashing is applied correctly
        const res = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: testEmail,
                password: testPassword,
                confirmPassword: testPassword,
                firstName: 'Target',
                lastName: 'User',
                acceptTerms: true,
            });

        testUserId = res.body.user.id;
    });

    afterAll(async () => {
        await prisma.wallet.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
        await app.close();
    });

    it('Pen-Test: Defends against brute-force login attacks (Progressive Lockout)', async () => {
        // Attack: Attempt 5 consecutive failed logins with wrong passwords
        for (let i = 0; i < 5; i++) {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .set('x-forwarded-for', `192.168.1.${i}`)
                .send({
                    email: testEmail,
                    password: 'WrongPassword123!',
                });
            expect(response.status).toBe(401);
        }

        // Assertion: The 6th attempt should return a specific Account Locked error, even if the password is correct!
        const lockedResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .set('x-forwarded-for', `192.168.1.5`)
            .send({
                email: testEmail,
                password: testPassword, // Using the CORRECT password now
            });

        expect(lockedResponse.status).toBe(401);
        expect(lockedResponse.body.message).toContain('Account temporarily locked');

        // Cleanup: Manually unlock for next tests
        await prisma.user.update({
            where: { id: testUserId },
            data: { accountLockedUntil: null, failedLoginAttempts: 0 }
        });
    });

    it('Pen-Test: Blocks 2FA bypass attempts', async () => {
        // Setup: Force 2FA on the user
        await prisma.user.update({
            where: { id: testUserId },
            data: { twoFactorEnabled: true, twoFactorSecret: 'MOCK_SECRET' }
        });

        // Attack: Send correct credentials but omit the 2FA code
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .set('x-forwarded-for', `192.168.1.6`)
            .send({
                email: testEmail,
                password: testPassword,
            });

        // Assertion: API must return a 200 OK with an MFA requirement flag, BUT NO JWT TOKEN.
        expect(response.status).toBe(200);
        expect(response.body.mfaRequired).toBe(true);
        expect(response.body.accessToken).toBeUndefined(); // Token must strictly be withheld
    });
});