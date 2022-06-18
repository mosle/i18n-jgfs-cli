export declare type SheetPropType = {
    title: string;
    id: number;
};
export declare type CsvContentType = {
    [key: string]: string;
} & {
    page: string;
    key: string;
    "special-key": string;
};
export declare type TranslateDataType = {
    [key: string]: string | TranslateDataType | undefined;
};
