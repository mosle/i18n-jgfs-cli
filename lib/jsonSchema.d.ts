import { JSONSchemaType } from "ajv";
declare const outputType: readonly ["yaml", "json", "yml"];
export declare type Setting = {
    targetSpreadSheetId: string;
    output: string;
    targetLangs: string[];
    targetLangsWithColumnIndex: {
        [key: string]: number;
    };
    columnIndexOfKey: {
        [key in "base" | "special"]: number;
    };
    outputFileType: typeof outputType[number];
    clearOutput: boolean;
};
declare const schema: JSONSchemaType<Setting>;
export default schema;
