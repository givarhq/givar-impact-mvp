import { IsArray, IsString, IsUUID, MinLength } from 'class-validator';

export class SubmitMilestoneProofDto {
    @IsUUID()
    milestoneId!: string;

    @IsString()
    @MinLength(20, { message: 'Please provide a detailed description of the progress (min 20 chars)' })
    description!: string;

    @IsArray()
    @IsString({ each: true })
    imageKeys!: string[];
}