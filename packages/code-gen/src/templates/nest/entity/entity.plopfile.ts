import { NodePlopAPI } from 'plop';

import { EntityGenSchema, type EntityGen } from '../schemas/entity-gen.schema';
import { SchemaValidator } from '../schemas/schema-validator';

export default function (plop: NodePlopAPI): void {
    plop.setHelper('eq', (a, b) => a === b);

    plop.setGenerator('entity', {
        description: 'Generates a new TypeORM entity file from a JSON schema.',
        prompts: [
            { type: 'input', name: 'schema', message: 'Enter the JSON schema for your entity:' },
        ],
        actions: [
            async (answers) => {
                const validator = new SchemaValidator<EntityGen>(EntityGenSchema);
                const res = validator.validate(answers.schema);

                if (res.failure || !res.data) {
                    // Use the precomputed friendly messages
                    const details = res.messages.join('\n');
                    throw new Error(`Invalid JSON schema:\n${details}`);
                }

                Object.assign(answers, res.typeOrmTemplateVM);
                return `Schema for entity '${res.data.entityName}' validated successfully.`;
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