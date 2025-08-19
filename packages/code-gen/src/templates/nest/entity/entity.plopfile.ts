import { toTypeOrmTemplateVM } from '@utils/schema-parser-util/support/typeorm.mapper';
import { NodePlopAPI } from 'plop';

import type { EntityGen } from '../schemas/entity-gen.schema';

import { validateEntityGen } from './entity-gen-validator'; // ← updated path

export default function (plop: NodePlopAPI): void {
    plop.setHelper('eq', (a, b) => a === b);

    plop.setGenerator('entity', {
        description: 'Generates a new TypeORM entity file from a JSON schema.',
        prompts: [{ type: 'input', name: 'schema', message: 'Enter the JSON schema for your entity:' }],
        actions: [
            async (answers) => {
                // Run validation (returns ApplicationContext)
                const ctx = await validateEntityGen(String(answers.schema));
                const s = ctx.state;

                if (ctx.failure || !s.data) {
                    const details = s.messages.join('\n') || 'Invalid schema';
                    throw new Error(`Invalid JSON schema:\n${details}`);
                }

                // Build the TypeORM template VM from the validated data
                const vm = toTypeOrmTemplateVM(s.data as EntityGen);

                // Make VM fields available to templates
                Object.assign(answers, vm);

                return `Schema for entity '${(s.data as EntityGen).entityName}' validated successfully.`;
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