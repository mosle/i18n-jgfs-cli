#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const clear_1 = __importDefault(require("clear"));
const figlet_1 = __importDefault(require("figlet"));
const commander_1 = require("commander");
const ajv_1 = __importDefault(require("ajv"));
const json5_1 = __importDefault(require("json5"));
const googleapis_1 = require("googleapis");
const sync_1 = require("csv-parse/sync");
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fsExtra = __importStar(require("fs-extra"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const jsonSchema_1 = __importDefault(require("./jsonSchema"));
(0, clear_1.default)();
console.log(chalk_1.default.blue(figlet_1.default.textSync("i18n-jgfs-cli", { horizontalLayout: "full" })));
commander_1.program
    .version("0.0.1")
    .description("i18n json generator from spreadsheet")
    .option("-s, --setting <setting.json(5)?>", "specify setting json(5) path.", "./i18n-jgfs-cli-settings.json5")
    .option("-c, --credential <credential.json>", "specify credential file for google api.(required)")
    .parse(process.argv);
const option = commander_1.program.opts();
console.log(option);
if (!option.credential) {
    commander_1.program.help();
}
const jsonString = fs_1.default.readFileSync(option.setting, "utf-8");
const setting = json5_1.default.parse(jsonString);
const ajv = new ajv_1.default();
const validate = ajv.compile(jsonSchema_1.default);
if (!validate(setting)) {
    console.error(chalk_1.default.bgRedBright(`[ERROR]`), `${option.setting} is not valid`);
    (_a = validate.errors) === null || _a === void 0 ? void 0 : _a.forEach((error) => {
        if (error.message)
            console.error(chalk_1.default.red(error.keyword, error.message));
    });
    process.exit();
}
if (!fs_1.default.existsSync(setting.output)) {
    try {
        fs_1.default.mkdirSync(setting.output);
    }
    catch (e) {
        console.error(chalk_1.default.bgRedBright(e));
        process.exit();
    }
}
if (setting.clearOutput) {
    fsExtra.emptyDirSync(setting.output);
}
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const auth = yield googleapis_1.google.auth.getClient({
        keyFile: option.credential,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = googleapis_1.google.sheets({ version: "v4", auth });
    const res = yield sheets.spreadsheets.get({
        spreadsheetId: setting.targetSpreadSheetId,
    });
    const sheetProps = ((_b = res === null || res === void 0 ? void 0 : res.data) === null || _b === void 0 ? void 0 : _b.sheets) === undefined
        ? []
        : res.data.sheets.map((s) => { var _a, _b; return (((_a = s.properties) === null || _a === void 0 ? void 0 : _a.title) && ((_b = s.properties) === null || _b === void 0 ? void 0 : _b.sheetId) ? { title: s.properties.title, id: s.properties.sheetId } : undefined); }).filter((prop) => prop !== undefined);
    const all = [];
    const csvColumnIndexMap = Object.assign(Object.assign({}, setting.targetLangsWithColumnIndex), setting.columnIndexOfKey);
    for (const s of sheetProps) {
        const url = `https://docs.google.com/spreadsheets/d/${setting.targetSpreadSheetId}/export?format=csv&gid=${s.id}`;
        //console.log(url);
        const r = yield (0, node_fetch_1.default)(url);
        console.log(chalk_1.default.blue(`[fetched] ${s.title}`));
        const csv = yield r.text();
        //console.log(csv);
        const data = yield (0, sync_1.parse)(csv, { skip_empty_lines: true, from_line: 2 /* skip header */ });
        data.forEach((r) => {
            const chunks = Object.fromEntries(setting.targetLangs.map((lang) => [lang, r[csvColumnIndexMap[lang]]]));
            const row = Object.assign({ page: s.title, key: r[csvColumnIndexMap.base], "special-key": r[csvColumnIndexMap["special"]] }, chunks);
            //      console.log(row);
            all.push(row);
        });
    }
    const pageTitles = Array.from(new Set(all.map((row) => row.page)));
    setting.targetLangs.forEach((lang) => {
        const translationData = {};
        pageTitles.forEach((title) => {
            const arrayForPage = all.filter((row) => row.page === title);
            const array = arrayForPage.map((row) => ({ key: row.key, value: row[lang] }));
            const specialArray = arrayForPage.filter((row) => row["special-key"]).map((row) => ({ key: row["special-key"], value: row[lang] }));
            const data = new Map([...array, ...specialArray].filter((a) => a.value && a.key).map((a) => [a.key, a.value]));
            translationData[title] = Object.fromEntries(data);
        });
        if (setting.outputFileType === "json")
            fs_1.default.writeFileSync(path_1.default.resolve(setting.output, `${lang}.json`), JSON.stringify(translationData, null, "\t"));
        else
            fs_1.default.writeFileSync(path_1.default.resolve(setting.output, `${lang}.yaml`), js_yaml_1.default.dump(translationData));
        console.log(chalk_1.default.green `[generated] ${lang}.json on ${setting.output}`);
    });
});
main().catch(console.error);
