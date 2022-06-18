"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const outputType = ["yaml", "json", "yml"];
const schema = {
    type: "object",
    properties: {
        targetSpreadSheetId: { type: "string" },
        output: { type: "string" },
        targetLangs: { type: "array", items: { type: "string" }, uniqueItems: true },
        // csvColumnIndexMap: {
        //   type: "object",
        //   patternProperties: {
        //     "^.+$": { type: "number", minimum: 1 },
        //   },
        //   required: ["key", "special-key"],
        // },
        targetLangsWithColumnIndex: {
            type: "object",
            patternProperties: {
                "^.+$": { type: "number", minimum: 1 },
            },
            required: [],
        },
        columnIndexOfKey: {
            type: "object",
            properties: {
                base: { type: "number", minimum: 1 },
                special: { type: "number", minimum: 1 },
            },
            required: ["base"],
        },
        outputFileType: {
            type: "string",
            enum: outputType,
        },
        clearOutput: {
            type: "boolean",
        },
    },
    //required: ["targetSpreadSheetId", "output", "targetLangs", "csvColumnIndexMap"],
    required: ["targetSpreadSheetId", "output", "targetLangs", "targetLangsWithColumnIndex", "columnIndexOfKey", "outputFileType"],
    additionalProperties: false,
};
exports.default = schema;
