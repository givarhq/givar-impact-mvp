import { IsString, IsNotEmpty, IsEmail, IsNumberString, IsOptional, IsUrl, Matches } from 'class-validator';

export class LogCorporateSponsorshipDto {
    @IsString()
    @IsNotEmpty({ message: 'Sponsor name is required' })
    sponsorName!: string;

    @IsEmail({}, { message: 'Please provide a valid sponsor email address' })
    @IsNotEmpty({ message: 'Sponsor email is required' })
    sponsorEmail!: string;

    @IsNumberString({ no_symbols: true }, { message: 'Amount must be a numeric string representing minor units' })
    @IsNotEmpty({ message: 'Amount is required' })
    amount!: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9/\-_]+$/, {
        message: 'Reference must be alphanumeric and can only include / - or _'
    })
    reference?: string;

    @IsOptional()
    @IsUrl({}, { message: 'Please provide a valid URL for the sponsor logo' })
    sponsorLogoUrl?: string;
}