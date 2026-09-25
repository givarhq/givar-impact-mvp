import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { CreateCorporateEnquiryDto } from './dto/corporate.dto';
import { AuditAction } from '@givar/database';
import { Request } from 'express';

@Injectable()
export class CorporateService {
    private readonly logger = new Logger(CorporateService.name);

    constructor(
        private prisma: PrismaService,
        private audit: AuditService,
        private emailService: EmailService,
    ) { }

    async createEnquiry(dto: CreateCorporateEnquiryDto, req?: Request) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const enquiry = await tx.corporateEnquiry.create({
                    data: {
                        companyName: dto.companyName,
                        contactName: dto.name,
                        role: dto.role,
                        email: dto.email.toLowerCase().trim(),
                        phone: dto.phone,
                        areasOfInterest: dto.areas,
                        notes: dto.notes,
                    },
                });

                await this.audit.log(
                    {
                        action: AuditAction.CORPORATE_ENQUIRY_RECEIVED,
                        entityId: enquiry.id,
                        entityType: 'CorporateEnquiry',
                        metadata: {
                            companyName: dto.companyName,
                            email: dto.email,
                        },
                        req,
                    },
                    tx,
                );

                return enquiry;
            });

            // Fire and forget transactional emails
            this.emailService
                .sendCorporateEnquiryNotification(result)
                .catch((err) =>
                    this.logger.error(`Failed to send internal enquiry notification: ${err.message}`),
                );

            this.emailService
                .sendCorporateEnquiryConfirmation(result.email, result.contactName)
                .catch((err) =>
                    this.logger.error(`Failed to send enquiry confirmation to lead: ${err.message}`),
                );

            return { success: true, message: 'Enquiry submitted successfully' };
        } catch (error) {
            this.logger.error('Failed to create corporate enquiry', error);
            throw new InternalServerErrorException('Unable to submit enquiry at this time.');
        }
    }
}