import { IsString, IsUUID, IsNumberString, IsNotEmpty, IsAlphanumeric, IsOptional, Matches } from 'class-validator';

export class RecordDisbursementDto {
    @IsUUID()
    @IsNotEmpty()
    milestoneId!: string; // The specific phase being paid for

    @IsNumberString({ no_symbols: true })
    @IsNotEmpty()
    amount!: string; // Minor units string (e.g., "100000" for 1000.00)

    @IsString()
    @IsNotEmpty()
    vendorName!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9/\-_]+$/, {
        message: 'Reference must be alphanumeric and can only include / - or _'
    })
    reference!: string; // Bank/Payment reference for reconciliation

    @IsOptional()
    @IsString()
    receiptKey?: string;
}