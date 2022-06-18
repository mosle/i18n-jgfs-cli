export type SheetPropType = {
  title: string;
  id: number;
};

export type CsvContentType = { [key: string]: string } & { page: string; key: string; "special-key": string };

export type TranslateDataType = {
  [key: string]: string | TranslateDataType | undefined;
};
