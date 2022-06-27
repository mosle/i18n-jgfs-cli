#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { program } from "commander";
import Ajv from "ajv";
import JSON5 from "json5";

import { google } from "googleapis";
import { parse } from "csv-parse/sync";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import * as fsExtra from "fs-extra";
import yaml from "js-yaml";

import jsonSchema, { Setting } from "./jsonSchema";
import { SheetPropType, TranslateDataType, CsvContentType } from "./settings";

type Option = {
  setting: string;
  credential: string;
};

clear();
console.log(chalk.blue(figlet.textSync("i18n-jgfs-cli", { horizontalLayout: "full" })));

program
  .version("0.0.1")
  .description("i18n json generator from spreadsheet")
  .option("-s, --setting <setting.json(5)?>", "specify setting json(5) path.", "./i18n-jgfs-cli-settings.json5")
  .option("-c, --credential <credential.json>", "specify credential file for google api.(required)")
  .parse(process.argv);

const option: Option = program.opts();
console.log(option);
if (!option.credential) {
  program.help();
}

const jsonString = fs.readFileSync(option.setting, "utf-8");
const setting = JSON5.parse(jsonString);

const ajv = new Ajv();
const validate = ajv.compile(jsonSchema);
if (!validate(setting)) {
  console.error(chalk.bgRedBright(`[ERROR]`), `${option.setting} is not valid`);

  validate.errors?.forEach((error) => {
    if (error.message) console.error(chalk.red(error.keyword, error.message));
  });
  process.exit();
}

if (!fs.existsSync(setting.output)) {
  try {
    fs.mkdirSync(setting.output);
  } catch (e) {
    console.error(chalk.bgRedBright(e));
    process.exit();
  }
}

if (setting.clearOutput) {
  fsExtra.emptyDirSync(setting.output);
}

const main = async () => {
  const auth = await google.auth.getClient({
    keyFile: option.credential,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.get({
    spreadsheetId: setting.targetSpreadSheetId,
  });

  console.log(res?.data?.sheets);
  const sheetProps: Array<SheetPropType> =
    res?.data?.sheets === undefined
      ? []
      : res.data.sheets.map((s) => (s.properties?.title && s.properties?.sheetId !== undefined ? { title: s.properties.title, id: s.properties.sheetId } : undefined)).filter((prop): prop is SheetPropType => prop !== undefined);

  const all: Array<CsvContentType> = [];

  const csvColumnIndexMap: Setting["targetLangsWithColumnIndex"] & Setting["columnIndexOfKey"] = { ...setting.targetLangsWithColumnIndex, ...setting.columnIndexOfKey };
  for (const s of sheetProps) {
    const url = `https://docs.google.com/spreadsheets/d/${setting.targetSpreadSheetId}/export?format=csv&gid=${s.id}`;

    //console.log(url);
    const r = await fetch(url);
    console.log(chalk.blue(`[fetched] ${s.title}`));
    const csv = await r.text();
    //console.log(csv);
    const data = await parse(csv, { skip_empty_lines: true, from_line: 2 /* skip header */ });
    data.forEach((r: Array<string>) => {
      const chunks = Object.fromEntries(setting.targetLangs.map((lang) => [lang, r[csvColumnIndexMap[lang]]])) as { [key: string]: string };

      const row: CsvContentType = {
        page: s.title,
        key: r[csvColumnIndexMap.base],
        "special-key": r[csvColumnIndexMap["special"]],
        ...chunks,
      };
      //      console.log(row);
      all.push(row);
    });
  }

  const pageTitles = Array.from(new Set(all.map((row) => row.page)));

  setting.targetLangs.forEach((lang) => {
    const translationData: TranslateDataType = {};
    pageTitles.forEach((title) => {
      const arrayForPage = all.filter((row) => row.page === title);
      const array = arrayForPage.map((row) => ({ key: row.key, value: row[lang] }));
      const specialArray = arrayForPage.filter((row) => row["special-key"]).map((row) => ({ key: row["special-key"], value: row[lang] }));
      const data = new Map<string, TranslateDataType | string>([...array, ...specialArray].filter((a) => a.value && a.key).map((a) => [a.key, a.value]));
      translationData[title] = Object.fromEntries(data);
    });
    if (setting.outputFileType === "json") fs.writeFileSync(path.resolve(setting.output, `${lang}.json`), JSON.stringify(translationData, null, "\t"));
    else fs.writeFileSync(path.resolve(setting.output, `${lang}.yaml`), yaml.dump(translationData));

    console.log(chalk.green`[generated] ${lang}.json on ${setting.output}`);
  });
};

main().catch(console.error);
