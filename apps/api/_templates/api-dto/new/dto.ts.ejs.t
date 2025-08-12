---
    to: src/<%= plural %>/dto.ts
---
import { <%- validatorImports.sort().join(', ') %> } from 'class-validator'

export class Create<%= name %>Dto {
    <%_ const IND = '  '; _%>
    <%_ for (let i = 0; i < fields.length; i++) {
        const { name: field, dtoType, isOptional, validators } = fields[i];
        const decos = [];
        if (isOptional) decos.push('@IsOptional()');
        validators
                .filter(v => v !== 'IsOptional')
                .forEach(v => {
                    if (v.startsWith('Length:')) decos.push(`@Length(${v.split(':')[1].replace(',', ', ')})`);
                    else decos.push(`@${v}()`);
                });
        const __lines = decos.map(l => IND + l);
        __lines.push(`${IND}${field}${isOptional ? '?' : '!'}: ${dtoType}`);
        if (i < fields.length - 1) __lines.push('');
    -%>
    <%- __lines.join('\n') %>
    <%_ } _%>
}

export class Update<%= name %>Dto {
    <%_ for (let i = 0; i < fields.length; i++) {
        const { name: field, dtoType, validators } = fields[i];
        const decos = ['@IsOptional()'];
        validators
                .filter(v => v !== 'IsOptional')
                .forEach(v => {
                    if (v.startsWith('Length:')) decos.push(`@Length(${v.split(':')[1].replace(',', ', ')})`);
                    else decos.push(`@${v}()`);
                });
        const __lines = decos.map(l => IND + l);
        __lines.push(`${IND}${field}?: ${dtoType}`);
        if (i < fields.length - 1) __lines.push('');
    -%>
    <%- __lines.join('\n') %>
    <%_ } _%>
}