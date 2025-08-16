import { NodePlopAPI } from 'plop';
import { validateAndParseSchema, ParsedSchemaData } from '../schemas/schema-parser';

function mapJsonType(type: string) {
    switch ((type || '').toLowerCase()) {
        case 'string':
        case 'varchar':
            return { columnType: 'varchar', tsType: 'string' };
        case 'text':
            return { columnType: 'text', tsType: 'string' };
        case 'int':
        case 'integer':
            return { columnType: 'int', tsType: 'number' };
        case 'uuid':
            return { columnType: 'uuid', tsType: 'string' };
        case 'datetime':
        case 'timestamp':
            return { columnType: 'datetime', tsType: 'Date' };
        case 'boolean':
            return { columnType: 'boolean', tsType: 'boolean' };
        default:
            return { columnType: type || 'varchar', tsType: 'any' };
    }
}

export default function (plop: NodePlopAPI): void {
    plop.setHelper('eq', (v1, v2) => v1 === v2);

    plop.setGenerator('entity', {
        description: 'Generates a new TypeORM entity file from a JSON schema.',
        prompts: [
            { type: 'input', name: 'schema', message: 'Enter the JSON schema for your entity:' },
        ],
        actions: [
            async (answers: any) => {
                const validationResult = validateAndParseSchema(answers.schema);
                if (validationResult.failure) {
                    throw new Error('Invalid JSON schema provided.');
                }

                const parsedData = validationResult.data as ParsedSchemaData;

                const propertiesArray = Object.entries(parsedData.properties)
                    .filter(([name]) => name !== 'createdAt' && name !== 'updatedAt')
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

                const primary = {
                    name: parsedData.primaryKey.name,
                    strategy: parsedData.primaryKey.options.strategy,
                    tsType: mapJsonType(parsedData.primaryKey.type).tsType,
                };

                Object.assign(answers, {
                    entityName: parsedData.entityName,
                    tableName: parsedData.tableName,
                    primary,
                    properties: propertiesArray,
                });

                return `Schema for entity '${parsedData.entityName}' validated successfully.`;
            },
            {
                type: 'add',
                path: 'src/entities/{{kebabCase entityName}}.entity.ts',
                templateFile: 'entity.ts.hbs',
                abortOnFail: true,
            },
        ],
    });
}