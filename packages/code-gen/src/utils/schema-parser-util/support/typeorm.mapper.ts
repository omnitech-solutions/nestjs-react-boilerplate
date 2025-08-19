import type { EntityGen } from '../../../templates/nest/schemas/entity-gen.schema';

type MappedField = {
    name: string;
    columnType: string;
    tsType: string;
    length?: number;
    nullable: boolean;
};

export type TypeOrmTemplateVM = {
    entityName: string;               // original (for pascalCase in hbs)
    tableName:  string;
    primary: {
        name: string;
        strategy: 'uuid' | 'increment';
        tsType: 'string' | 'number';
    };
    properties: MappedField[];
};

function mapJsonType(t: string): { columnType: string; tsType: string } {
    switch ((t || '').toLowerCase()) {
        case 'string':
        case 'varchar':   return { columnType: 'varchar',  tsType: 'string' };
        case 'text':      return { columnType: 'text',     tsType: 'string' };
        case 'int':
        case 'integer':   return { columnType: 'int',      tsType: 'number' };
        case 'uuid':      return { columnType: 'uuid',     tsType: 'string' };
        case 'datetime':
        case 'timestamp': return { columnType: 'datetime', tsType: 'Date'   };
        case 'boolean':   return { columnType: 'boolean',  tsType: 'boolean'};
        default:          return { columnType: t || 'varchar', tsType: 'any' };
    }
}

export function toTypeOrmTemplateVM(input: EntityGen): TypeOrmTemplateVM {
    const primaryTs = mapJsonType(input.primaryKey.type).tsType;
    const fields: MappedField[] = Object.entries(input.properties)
        .filter(([n]) => n !== 'createdAt' && n !== 'updatedAt')
        .map(([name, def]) => {
            const m = mapJsonType(def.type);
            return {
                name,
                columnType: m.columnType,
                tsType: m.tsType,
                length: def.length,
                nullable: !!def.nullable,
            };
        });

    return {
        entityName: input.entityName,
        tableName:  input.tableName,
        primary: {
            name: input.primaryKey.name,
            strategy: input.primaryKey.options.strategy,
            tsType: primaryTs === 'number' ? 'number' : 'string',
        },
        properties: fields,
    };
}