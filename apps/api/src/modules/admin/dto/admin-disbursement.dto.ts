import { IsString, IsUUID, IsNumberString, IsNotEmpty, IsAlphanumeric } from 'class-validator';

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
    @IsAlphanumeric(undefined, { message: 'Reference must be alphanumeric' })
    reference!: string; // Bank/Payment reference for reconciliation
}