import {describe, expect, it} from 'vitest';
import { cloneDeep } from 'lodash-es';
import {
    ParsedSchemaData,
    toJsonData,
    validateAndParseSchema,
    ValidationError,
    ValidationResult,
} from './schema-parser';

// ---------- Fixtures ----------
const validSchema: ParsedSchemaData = {
    entityName: 'TestEntity',
    tableName: 'test_entities',
    primaryKey: {
        name: 'uuid',
        type: 'string',
        options: {strategy: 'uuid'},
    },
    properties: {
        name: {type: 'string', length: 255},
        isActive: {type: 'boolean', nullable: true},
    },
};

// ---------- Helpers ----------

const expectOk = <T>(res: ValidationResult<T>, data?: T) => {
    expect(res.success).toBe(true);
    expect(res.failure).toBe(false);
    expect(res.errors).toEqual([]);
    if (data) expect(res.data).toEqual(data);
    else expect(res.data).toBeDefined();
};

const expectFail = <T>(res: ValidationResult<T>) => {
    expect(res.success).toBe(false);
    expect(res.failure).toBe(true);
    expect(res.data).toBeUndefined();
    expect(res.errors.length).toBeGreaterThan(0);
};

const errorMessageFor = (errors: ValidationError[], key: string): string | undefined => {
    const hit = errors.find((e) => Object.prototype.hasOwnProperty.call(e, key));
    return hit ? (hit as any)[key] : undefined;
};

const expectFailure = (res: ReturnType<typeof toJsonData>, match: RegExp) => {
    expect(res.success).toBe(false);
    expect(res.failure).toBe(true);
    expect(res.data).toBeUndefined();
    expect(res.errors.length).toBeGreaterThan(0);

    const first = res.errors[0]!;
    const keys = Object.keys(first);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe('base');
    expect(first.base).toMatch(match);
};

describe('schema-parser', () => {
    describe('toJsonData', () => {
        describe('with valid data', () => {
            it('returns success with data when given a ParsedSchemaData object', () => {
                const res = toJsonData(validSchema);
                expect(res.success).toBe(true);
                expect(res.failure).toBe(false);
                expect(res.errors).toEqual([]);
                expect(res.data).toEqual(validSchema);
            });

            it('returns success with data when given a valid JSON string', () => {
                const json = JSON.stringify(validSchema);
                const res = toJsonData(json);
                expect(res.success).toBe(true);
                expect(res.failure).toBe(false);
                expect(res.errors).toEqual([]);
                expect(res.data).toEqual(validSchema);
            });
        });

        describe('with invalid data', () => {
            describe('toJsonData error cases', () => {
                it('returns failure with errors when given invalid JSON string', () => {
                    const res = toJsonData('{"entityName": "Broken",'); // malformed JSON
                    expectFailure(res, /invalid json|unexpected end of json input/i);
                });

                it('fails gracefully on unsupported input type', () => {
                    const weird: any = 12345;
                    const res = toJsonData(weird);
                    expectFailure(res, /unsupported input type/i);
                });
            });
        });
    })

    describe('validateAndParseSchema', () => {
        describe('happy paths', () => {
            it('returns success + data for a valid ParsedSchemaData object', () => {
                const res = validateAndParseSchema(validSchema);
                expectOk(res, validSchema);
            });

            it('returns success + data for a valid JSON string', () => {
                const res = validateAndParseSchema(JSON.stringify(validSchema));
                expectOk(res, validSchema);
            });
        });

        describe('parsing', () => {
            it('returns failure with base parse error for malformed JSON', () => {
                const res = validateAndParseSchema('{"entityName": "Broken",');
                expectFail(res);
                const msg = errorMessageFor(res.errors, 'base');
                expect(msg).toMatch(/invalid json|unexpected end of json input/i);
            });

            it('returns failure with base error for unsupported input type', () => {
                const res = validateAndParseSchema(12345 as any);
                expectFail(res);
                const msg = errorMessageFor(res.errors, 'base');
                expect(msg).toMatch(/unsupported input type/i);
            });
        });

        describe('schema sections', () => {
            describe('entityName', () => {
                describe('required', () => {
                    it('missing → required error at base', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.entityName;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'base'); // AJV required on root → base
                        expect(msg).toMatch(/required property 'entityName'|required property/i);
                    });
                });

                describe('constraints', () => {
                    it('empty string → minLength error on key', () => {
                        const bad = cloneDeep(validSchema);
                        bad.entityName = '';
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'entityName');
                        expect(msg).toMatch(
                            /minlength|must\s+not\s+have\s+fewer\s+than\s+\d+\s+characters/i
                        );
                    });
                });
            });

            describe('tableName', () => {
                describe('required', () => {
                    it('missing → required error at base', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.tableName;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'base');
                        expect(msg).toMatch(/required property 'tableName'|required property/i);
                    });
                });

                describe('constraints', () => {
                    it('empty string → minLength error on key', () => {
                        const bad = cloneDeep(validSchema);
                        bad.tableName = '';
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'tableName');
                        expect(msg).toMatch(
                            /minlength|must\s+not\s+have\s+fewer\s+than\s+\d+\s+characters/i
                        );
                    });
                });
            });

            describe('primaryKey', () => {
                describe('required', () => {
                    it('missing → required error at base', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.primaryKey;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'base');
                        expect(msg).toMatch(/required property 'primaryKey'|required property/i);
                    });

                    it('missing name → required error at primaryKey', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.primaryKey.name;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'primaryKey');
                        expect(msg).toMatch(/required property 'name'|required property/i);
                    });

                    it('missing type → required error at primaryKey', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.primaryKey.type;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'primaryKey');
                        expect(msg).toMatch(/required property 'type'|required property/i);
                    });

                    it('missing options → required error at primaryKey', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.primaryKey.options;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'primaryKey');
                        expect(msg).toMatch(/required property 'options'|required property/i);
                    });
                });

                describe('options.strategy enum', () => {
                    it('invalid strategy → enum error at primaryKey/options/strategy', () => {
                        const bad = cloneDeep(validSchema) as any;
                        bad.primaryKey.options.strategy = 'invalid-strategy';
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'primaryKey/options/strategy');
                        expect(msg).toMatch(/must be equal to one of the allowed values|enum/i);
                    });

                    it('valid "increment" strategy passes', () => {
                        const good = cloneDeep(validSchema);
                        good.primaryKey.options.strategy = 'increment';
                        const res = validateAndParseSchema(good);
                        expectOk(res, good);
                    });
                });
            });

            describe('properties', () => {
                describe('container', () => {
                    it('missing → required error at base', () => {
                        const bad = cloneDeep(validSchema) as any;
                        delete bad.properties;
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'base');
                        expect(msg).toMatch(/required property 'properties'|required property/i);
                    });

                    it('empty object → minProperties error at properties', () => {
                        const bad = cloneDeep(validSchema);
                        bad.properties = {};
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'properties');
                        expect(msg).toMatch(/must NOT have fewer than|minproperties/i);
                    });

                    it('key not matching pattern → additionalProperties error at properties', () => {
                        const bad = cloneDeep(validSchema) as any;
                        bad.properties['bad-key!'] = {type: 'string'};
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'properties');
                        expect(msg).toMatch(/must NOT have additional properties|additionalproperties/i);
                    });
                });

                describe('field objects', () => {
                    it('missing required "type" → required error at properties/<field>', () => {
                        const bad = cloneDeep(validSchema) as any;
                        bad.properties.name = {}; // remove type
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'properties/name');
                        expect(msg).toMatch(/required property 'type'|required property/i);
                    });

                    it('"length" wrong type → type error at properties/<field>/length', () => {
                        const bad = cloneDeep(validSchema) as any;
                        bad.properties.name = {type: 'string', length: '10'}; // should be number
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'properties/name/length');
                        expect(msg).toMatch(/must be number/i);
                    });

                    it('"nullable" wrong type → type error at properties/<field>/nullable', () => {
                        const bad = cloneDeep(validSchema) as any;
                        bad.properties.isActive = {type: 'boolean', nullable: 'yes'}; // should be boolean
                        const res = validateAndParseSchema(bad);
                        expectFail(res);
                        const msg = errorMessageFor(res.errors, 'properties/isActive/nullable');
                        expect(msg).toMatch(/must be boolean/i);
                    });
                });
            });
        });
    })
});