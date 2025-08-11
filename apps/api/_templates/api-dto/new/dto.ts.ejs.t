---
to: src/<%= plural %>/dto.ts
---
import {IsOptional, IsString, Length} from 'class-validator';

export class Create<%= name %>Dto {
    @IsString()
    @Length(2, 120)
    name!: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    size?: string;
}

export class Update<%= name %>Dto {
    @IsOptional()
    @IsString()
    @Length(2, 120)
    name?: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    size?: string;
}