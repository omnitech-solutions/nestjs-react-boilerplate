import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsOptional, IsString, Length } from 'class-validator'

export class CreateMetricDto {
  @ApiProperty({ example: 'Example Name', minLength: 2, maxLength: 255 })
  @IsString()
  @Length(2, 255)
  name!: string

  @ApiProperty({ example: '123.45' })
  @IsString()
  value!: string

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  unit?: string

  @ApiProperty({ format: 'date-time', example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  recorded_at!: string
}

export class UpdateMetricDto {
  @ApiPropertyOptional({ example: 'Example Name', minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string

  @ApiPropertyOptional({ example: '123.45' })
  @IsOptional()
  @IsString()
  value?: string

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  unit?: string

  @ApiPropertyOptional({ format: 'date-time', example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  recorded_at?: string
}
