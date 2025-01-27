import type * as vscode from '@theia/plugin';

type CodexNotebookAsJSONData = {
    cells: CustomNotebookCellData[];
    metadata: CustomNotebookMetadata;
};

type CustomNotebookCellData = vscode.NotebookCellData & {
    metadata: CustomCellMetaData;
};

type CustomCellMetaData = {
    id: string;
    type: import("./enums").CodexCellTypes;
    data?: CodexData;
    edits?: EditHistory[];
    attachments?: {
        [key: string]: {
            url: string;
            type: string;
        };
    };
    cellLabel?: string;
};