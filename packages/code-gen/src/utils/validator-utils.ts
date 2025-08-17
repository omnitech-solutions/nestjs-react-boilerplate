import Ajv, {ErrorObject} from "ajv";
import addFormats from "ajv-formats";

export const createAjv = (options?: ConstructorParameters<typeof Ajv>[0]) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: true,
        useDefaults: true,
        removeAdditional: false,
        ...options,
    });
    addFormats(ajv);
    return ajv;
};

export const toBaseErrorObject = (key: string, message: string): ErrorObject => {
    return {
        instancePath: key || 'base',
        schemaPath: '',
        keyword: 'base',
        params: {},
        message: message,
    } as ErrorObject
}
