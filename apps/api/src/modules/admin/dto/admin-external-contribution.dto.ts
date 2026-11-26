import { IsString, IsNotEmpty, IsEmail, IsNumberString, IsOptional, Matches } from 'class-validator';

export class LogExternalContributionDto {
    @IsString()
    @IsNotEmpty({ message: 'Donor name is required' })
    donorName!: string;

    @IsEmail({}, { message: 'Please provide a valid donor email address' })
    @IsNotEmpty({ message: 'Donor email is required' })
    donorEmail!: string;

    @IsNumberString({ no_symbols: true }, { message: 'Amount must be a numeric string representing minor units' })
    @IsNotEmpty({ message: 'Amount is required' })
    amount!: string;

    @IsString()
    @IsNotEmpty({ message: 'Proof document receipt key is required' })
    receiptKey!: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9/\-_]+$/, {
        message: 'Reference must be alphanumeric and can only include / - or _'
    })
    reference?: string;

    @IsOptional()
    @IsString()
    donorCurrency?: string;

    @IsOptional()
    @IsNumberString({ no_symbols: true })
    donorAmount?: string;
}