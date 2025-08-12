import { IsDateString, IsOptional, IsString } from 'class-validator'

export class CreateMetricDto {
@IsString()
name!: string
@IsString()
value!: string
@IsOptional()
@IsString()
unit?: string
@IsDateString()
recorded_at!: string
}

export class UpdateMetricDto {
  @IsOptional()
@IsString()
name?: string
  @IsOptional()
@IsString()
value?: string
  @IsOptional()
@IsString()
unit?: string
  @IsOptional()
@IsDateString()
recorded_at?: string
}