// EntityGenService.xstate.ts
import { SchemaValidator } from '@utils/schema-parser-util/schema-validator';
import { toTypeOrmTemplateVM } from '@utils/schema-parser-util/support/typeorm.mapper';
import { createAjv } from '@utils/validator-utils';
import Ajv from 'ajv';
import { createMachine, createActor } from 'xstate';

import { ApplicationContext } from '../../../application-context.xstate';
import { EntityGenSchema, type EntityGen } from '../schemas/entity-gen.schema';

export type EntityGenInput = string | { schema: string };

export class EntityGenService {
    private readonly ajv: Ajv;
    private readonly validator: SchemaValidator<EntityGen>;
    private readonly ctx: ApplicationContext<Record<string, unknown>, EntityGen>;

    constructor() {
        this.ajv = createAjv();
        this.validator = new SchemaValidator<EntityGen>(EntityGenSchema, this.ajv);
        this.ctx = new ApplicationContext<Record<string, unknown>, EntityGen>({});
    }

    validate(input: EntityGenInput): ApplicationContext<Record<string, unknown>, EntityGen> {
        const normalized = typeof input === 'string' ? { schema: input } : input;

        // Minimal XState: single state, do work in entry, then final.
        const machine = createMachine({
            id: 'entityGen.validate',
            initial: 'run',
            states: {
                run: {
                    entry: () => {
                        const v = this.validator.validate(normalized.schema);
                        this.ctx.merge(v);

                        if (this.ctx.success && this.ctx.state.data) {
                            this.ctx.setResource(toTypeOrmTemplateVM(this.ctx.state.data as EntityGen));
                        } else {
                            this.ctx.setResource(null);
                        }
                    },
                    type: 'final',
                },
            },
        });

        const actor = createActor(machine).start();
        actor.stop();

        return this.ctx;
    }
}

export async function validateEntityGen(
    input: EntityGenInput
): Promise<ApplicationContext<Record<string, unknown>, EntityGen>> {
    const service = new EntityGenService();
    return service.validate(input);
}