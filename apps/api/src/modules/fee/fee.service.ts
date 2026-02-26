import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, TransactionFeeRule } from '@givar/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FeeService {
    constructor(private prisma: PrismaService, private audit: AuditService) { }

    /**
     * Resolves the currently active transaction fee rule.
     * Prioritizes category-specific overrides before falling back to the global rule.
     */
    async getActiveRule(categoryId?: string): Promise<TransactionFeeRule> {
        let rule = null;

        // 1. Check for active category-specific override
        if (categoryId) {
            rule = await this.prisma.transactionFeeRule.findFirst({
                where: { categoryId, isActive: true },
                orderBy: { activeFrom: 'desc' }
            });
        }

        // 2. Fallback to active global rule
        if (!rule) {
            rule = await this.prisma.transactionFeeRule.findFirst({
                where: { appliesGlobally: true, isActive: true },
                orderBy: { activeFrom: 'desc' }
            });
        }

        // 3. Absolute Failsafe: Prevent ledger blockage if no rules exist
        if (!rule) {
            return {
                id: 'fallback-0',
                percentage: 0,
                appliesGlobally: true,
                categoryId: null,
                optionalTipEnabled: false,
                activeFrom: new Date(),
                activeUntil: null,
                createdById: 'system',
                isActive: true,
            } as TransactionFeeRule;
        }

        return rule;
    }

    /**
     * Deterministic Server-Side Fee Calculation (BigInt)
     * Calculates the exact minor unit cut based on the active rule.
     */
    async calculateFee(baseAmountMinor: bigint, categoryId?: string) {
        const rule = await this.getActiveRule(categoryId);
        // Formula: (Base * (Percentage * 100)) / 10000
        // Prevents floating point issues while maintaining precision up to 2 decimal places in percentages.
        const feeAmountMinor = (baseAmountMinor * BigInt(Math.round(rule.percentage * 100))) / 10000n;
        return {
            feeAmountMinor,
            rule
        };
    }

    /**
     * SuperAdmin Protocol: Append-Only Rule Update
     * Deactivates the current rule and appends a new one to preserve historical immutability.
     */
    async updateGlobalRule(adminId: string, percentage: number, tipEnabled: boolean, password: string) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new ForbiddenException('Admin identity not found');

        // Step-Up Authentication Guard
        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) throw new ForbiddenException('Invalid credentials for financial mutation');

        if (percentage < 0 || percentage > 20) {
            throw new BadRequestException('Fee percentage must be between 0 and 20');
        }

        return this.prisma.$transaction(async (tx) => {
            const currentRule = await tx.transactionFeeRule.findFirst({
                where: { appliesGlobally: true, isActive: true }
            });

            if (currentRule) {
                await tx.transactionFeeRule.update({
                    where: { id: currentRule.id },
                    data: { isActive: false, activeUntil: new Date() }
                });
            }

            const newRule = await tx.transactionFeeRule.create({
                data: {
                    percentage,
                    appliesGlobally: true,
                    optionalTipEnabled: tipEnabled,
                    createdById: adminId,
                    isActive: true
                }
            });

            await this.audit.log({
                userId: adminId,
                action: AuditAction.FEE_RULE_CREATED,
                entityId: newRule.id,
                entityType: 'TransactionFeeRule',
                metadata: {
                    previousPercentage: currentRule?.percentage ?? 0,
                    newPercentage: percentage,
                    tipEnabled
                }
            }, tx);

            return newRule;
        });
    }

    async getFeeHistory() {
        return this.prisma.transactionFeeRule.findMany({
            where: { appliesGlobally: true },
            orderBy: { activeFrom: 'desc' },
            include: { creator: { select: { firstName: true, lastName: true, email: true } } }
        });
    }
}