import { Static, Type } from '@sinclair/typebox';

export const EntityGenSchema = Type.Object({
    entityName: Type.String({ minLength: 1 }),
    tableName:  Type.String({ minLength: 1 }),
    primaryKey: Type.Object({
        name: Type.String(),
        type: Type.String(),
        options: Type.Object({
            strategy: Type.Union([Type.Literal('uuid'), Type.Literal('increment')]),
        }),
    }),
    properties: Type.Record(
        Type.RegExp(/^[a-zA-Z0-9_]+$/),
        Type.Object({
            type:     Type.String(),
            nullable: Type.Optional(Type.Boolean({ default: false })),
            length:   Type.Optional(Type.Number()),
        }),
        { minProperties: 1 }
    ),
}, { additionalProperties: false });

export type EntityGen = Static<typeof EntityGenSchema>;