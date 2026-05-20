import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Infrastructure Security & Payload Penetration (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Critical: Enable exact production validation rules
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true, // Strips non-whitelisted properties
            forbidNonWhitelisted: true, // Throws error if payload is polluted
            transform: true
        }));

        // Required to test the Throttler (Rate Limiting) module correctly using Supertest
        app.getHttpAdapter().getInstance().set('trust proxy', 1);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('Pen-Test: Defends against Payload Pollution and Over-posting', async () => {
        // Attack: Send a signup payload with injected, unauthorized database fields
        const response = await request(app.getHttpServer())
            .post('/auth/signup')
            .send({
                email: `hacker-${Date.now()}@givarapp.com`,
                password: 'SecurePassword123!',
                confirmPassword: 'SecurePassword123!',
                firstName: 'Hacker',
                lastName: 'User',
                acceptTerms: true,
                // INJECTED PAYLOADS: Attempting to elevate privileges during account creation
                role: 'SUPERADMIN',
                accountType: 'ORGANIZER',
                emailVerified: true
            });

        // Assertion: The ValidationPipe MUST reject the request entirely because forbidNonWhitelisted is true
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('property role should not exist');
    });

    it('Pen-Test: Defends against API DDoS via Global Rate Limiting (Throttler)', async () => {
        // Attack: Spam a public endpoint faster than the Throttler limit (60 requests per minute)
        let finalStatus = 200;

        // Fire 65 rapid requests to the health check endpoint
        for (let i = 0; i < 65; i++) {
            const res = await request(app.getHttpServer()).get('/health');
            if (res.status === 429) {
                finalStatus = res.status;
                break;
            }
        }

        // Assertion: The ThrottlerGuard must intercept and return 429 Too Many Requests
        expect(finalStatus).toBe(429);
    });
});