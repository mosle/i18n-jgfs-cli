import { JSONSchemaType } from "ajv";

const outputType = ["yaml", "json", "yml"] as const;

export type Setting = {
  targetSpreadSheetId: string;
  output: string;
  targetLangs: string[];
  //  csvColumnIndexMap: { [key: string]: number } & { key: number } & { "special-key": number };
  targetLangsWithColumnIndex: { [key: string]: number };
  columnIndexOfKey: { [key in "base" | "special"]: number };
  outputFileType: typeof outputType[number];
  clearOutput: boolean;
};

const schema: JSONSchemaType<Setting> = {
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

export default schema;
