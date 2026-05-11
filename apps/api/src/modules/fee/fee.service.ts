import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, TransactionFeeRule } from '@givar/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FeeService {
    constructor(private prisma: PrismaService, private audit: AuditService) { }

    /**
     * Resolves the currently active transaction fee rule hierarchically.
     * Order of Precedence: PROJECT -> SUBCATEGORY -> CATEGORY -> GLOBAL
     */
    async getActiveRule(categoryId?: string, subcategoryId?: string, projectId?: string): Promise<TransactionFeeRule> {
        let rule = null;

        // 1. Check for active Project-specific override
        if (projectId) {
            rule = await this.prisma.transactionFeeRule.findFirst({
                where: { projectId, isActive: true },
                orderBy: { activeFrom: 'desc' }
            });
        }

        // 2. Check for active Subcategory override
        if (!rule && subcategoryId) {
            rule = await this.prisma.transactionFeeRule.findFirst({
                where: { subcategoryId, isActive: true },
                orderBy: { activeFrom: 'desc' }
            });
        }

        // 3. Check for active Category override
        if (!rule && categoryId) {
            rule = await this.prisma.transactionFeeRule.findFirst({
                where: { categoryId, isActive: true },
                orderBy: { activeFrom: 'desc' }
            });
        }

        // 4. Fallback to active Global rule
        if (!rule) {
            rule = await this.prisma.transactionFeeRule.findFirst({
                where: { appliesGlobally: true, isActive: true },
                orderBy: { activeFrom: 'desc' }
            });
        }

        // 5. Absolute Failsafe: Prevent ledger blockage if no rules exist
        if (!rule) {
            return {
                id: 'fallback-0',
                percentage: 0,
                appliesGlobally: true,
                categoryId: null,
                subcategoryId: null,
                projectId: null,
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
     */
    async calculateFee(baseAmountMinor: bigint, categoryId?: string, subcategoryId?: string, projectId?: string) {
        const rule = await this.getActiveRule(categoryId, subcategoryId, projectId);
        // Formula: (Base * (Percentage * 100)) / 10000
        const feeAmountMinor = (baseAmountMinor * BigInt(Math.round(rule.percentage * 100))) / 10000n;
        return {
            feeAmountMinor,
            rule
        };
    }

    /**
     * SuperAdmin Protocol: Append-Only Rule Creation with Scope Targeting
     */
    async createRule(
        adminId: string,
        percentage: number,
        tipEnabled: boolean,
        password: string,
        targetType: 'GLOBAL' | 'CATEGORY' | 'SUBCATEGORY' | 'PROJECT',
        targetId?: string
    ) {
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!admin) throw new ForbiddenException('Admin identity not found');

        // Step-Up Authentication Guard
        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) throw new ForbiddenException('Invalid credentials for financial mutation');

        if (percentage < 0 || percentage > 20) {
            throw new BadRequestException('Fee percentage must be between 0 and 20');
        }

        return this.prisma.$transaction(async (tx) => {
            // Deactivate the current active rule for this specific scope
            const whereClause: any = { isActive: true };
            if (targetType === 'GLOBAL') whereClause.appliesGlobally = true;
            else if (targetType === 'CATEGORY') whereClause.categoryId = targetId;
            else if (targetType === 'SUBCATEGORY') whereClause.subcategoryId = targetId;
            else if (targetType === 'PROJECT') whereClause.projectId = targetId;

            const currentRule = await tx.transactionFeeRule.findFirst({
                where: whereClause
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
                    appliesGlobally: targetType === 'GLOBAL',
                    categoryId: targetType === 'CATEGORY' ? targetId : null,
                    subcategoryId: targetType === 'SUBCATEGORY' ? targetId : null,
                    projectId: targetType === 'PROJECT' ? targetId : null,
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
                    targetType,
                    targetId,
                    previousPercentage: currentRule?.percentage ?? 0,
                    newPercentage: percentage,
                    tipEnabled
                }
            }, tx);

            return newRule;
        });
    }

    async getFeeHistory() {
        const history = await this.prisma.transactionFeeRule.findMany({
            orderBy: { activeFrom: 'desc' },
            include: { creator: { select: { firstName: true, lastName: true, email: true } } }
        });

        // Enrich with human-readable target names for the Admin UI
        return Promise.all(history.map(async (rule) => {
            let targetName = 'Global Base Rate';
            if (rule.projectId) {
                const p = await this.prisma.project.findUnique({ where: { id: rule.projectId }, select: { title: true } });
                targetName = p ? `Cause: ${p.title}` : 'Unknown Cause';
            } else if (rule.subcategoryId) {
                const s = await this.prisma.subcategory.findUnique({ where: { id: rule.subcategoryId }, select: { name: true } });
                targetName = s ? `Focus: ${s.name}` : 'Unknown Focus Area';
            } else if (rule.categoryId) {
                const c = await this.prisma.category.findUnique({ where: { id: rule.categoryId }, select: { name: true } });
                targetName = c ? `Sector: ${c.name}` : 'Unknown Sector';
            }
            return { ...rule, targetName };
        }));
    }
}