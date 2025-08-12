import { IsDateString, IsOptional, IsString, Length } from 'class-validator'

export class CreateMetricDto {
  @IsString()
  @Length(2, 255)
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
  @Length(2, 255)
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
