---
    to: src/<%= plural %>/dto.ts
---
import { <%- validatorImports.sort().join(', ') %> } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

<%_
// small helpers to build swagger options inline
const buildSwaggerOptions = (field, dtoType, validators) => {
    const opts = []
    // Examples by type
    if (dtoType === 'string') {
        if (field === 'recorded_at') opts.push(`format: 'date-time'`, `example: '2025-01-01T00:00:00.000Z'`)
        else if (field === 'value')   opts.push(`example: '123.45'`)
        else if (field === 'unit')    opts.push(`example: 'USD'`)
        else if (field === 'name')    opts.push(`example: 'Example Name'`)
        else                          opts.push(`example: 'text'`)
    } else if (dtoType === 'number') {
        opts.push(`example: 123`)
    } else if (dtoType === 'boolean') {
        opts.push(`example: true`)
    } else if (dtoType.includes('Record<')) {
        opts.push(`example: {}`)
    }

    // Length validator (if present)
    const len = validators.find(v => v.startsWith('Length:'))
    if (len) {
        const [min, max] = len.split(':')[1].split(',').map(s => s.trim())
        if (min) opts.push(`minLength: ${min}`)
        if (max) opts.push(`maxLength: ${max}`)
    }

    return opts.length ? `{ ${opts.join(', ')} }` : `{}`
}
_%>

export class Create<%= name %>Dto {
    <%_ const IND = '  '; _%>
    <%_ for (let i = 0; i < fields.length; i++) {
        const { name: field, dtoType, isOptional, validators } = fields[i];
        const decos = [];
        // OpenAPI decorator
        const swaggerOpts = buildSwaggerOptions(field, dtoType, validators)
        decos.push(`${isOptional ? '@ApiPropertyOptional' : '@ApiProperty'}(${swaggerOpts})`)
        // class-validator decorators
        if (isOptional) decos.push('@IsOptional()')
        validators
                .filter(v => v !== 'IsOptional')
                .forEach(v => {
                    if (v.startsWith('Length:')) decos.push(`@Length(${v.split(':')[1].replace(',', ', ')})`)
                    else decos.push(`@${v}()`)
                });
        const __lines = decos.map(l => IND + l);
        __lines.push(`${IND}${field}${isOptional ? '?' : '!'}: ${dtoType}`);
        if (i < fields.length - 1) __lines.push('');
    _%>
    <%- __lines.join('\n') %>
    <%_ } _%>
}

export class Update<%= name %>Dto {
    <%_ for (let i = 0; i < fields.length; i++) {
        const { name: field, dtoType, validators } = fields[i];
        const decos = [];
        // OpenAPI decorator (optional in update)
        const swaggerOpts = buildSwaggerOptions(field, dtoType, validators)
        decos.push(`@ApiPropertyOptional(${swaggerOpts})`)
        // class-validator decorators (updates are optional by design)
        decos.push('@IsOptional()')
        validators
                .filter(v => v !== 'IsOptional')
                .forEach(v => {
                    if (v.startsWith('Length:')) decos.push(`@Length(${v.split(':')[1].replace(',', ', ')})`)
                    else decos.push(`@${v}()`)
                });
        const __lines = decos.map(l => IND + l);
        __lines.push(`${IND}${field}?: ${dtoType}`);
        if (i < fields.length - 1) __lines.push('');
    _%>
    <%- __lines.join('\n') %>
    <%_ } _%>
}