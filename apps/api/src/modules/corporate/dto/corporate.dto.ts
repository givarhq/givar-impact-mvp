import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class CreateCorporateEnquiryDto {
    @IsString()
    @IsNotEmpty({ message: 'Company name is required' })
    companyName!: string;

    @IsString()
    @IsNotEmpty({ message: 'Contact name is required' })
    name!: string;

    @IsString()
    @IsNotEmpty({ message: 'Role/title is required' })
    role!: string;

    @IsEmail({}, { message: 'Please provide a valid work email address' })
    @IsNotEmpty({ message: 'Work email is required' })
    email!: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsArray()
    @ArrayNotEmpty({ message: 'Please select at least one area of interest' })
    @IsString({ each: true })
    areas!: string[];

    @IsOptional()
    @IsString()
    notes?: string;
}