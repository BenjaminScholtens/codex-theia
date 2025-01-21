import * as React from "react";
import {
  injectable,
  postConstruct,
  inject,
} from "@theia/core/shared/inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { MessageService } from "@theia/core";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import URI from "@theia/core/lib/common/uri";
const ReactQuill = require("react-quill");
import "react-quill/dist/quill.snow.css";
import { CodexNotebookAsJSONData } from "../types";

export interface FileToEdit {
  name: string;
  path: string;
}

@injectable()
export class ContextEditorWidget extends ReactWidget {
  static readonly ID = "context-editor:widget";
  static readonly LABEL = "Context Editor";

  @inject(MessageService)
  protected readonly messageService!: MessageService;

  @inject(FileService)
  protected readonly fileService!: FileService;

  protected currentFile: FileToEdit | null = null;
  protected content: CodexNotebookAsJSONData | undefined;

  @postConstruct()
  protected init(): void {
    this.id = ContextEditorWidget.ID;
    this.title.label = ContextEditorWidget.LABEL;
    this.title.caption = ContextEditorWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = "fa fa-edit";
    this.update();
  }

  async openFile(file: FileToEdit): Promise<void> {
    try {
      const uri = new URI(file.path);
      const content = await this.fileService.read(uri);
      this.content = JSON.parse(content.value) as CodexNotebookAsJSONData;
      this.currentFile = file;
      this.title.label = `${file.name} - Context Editor`;
      this.update();
    } catch (error) {
      this.messageService.error(`Error opening file ${file.name}: ${error}`);
    }
  }

  protected async saveFile(): Promise<void> {
    if (!this.currentFile) return;

    try {
      const uri = new URI(this.currentFile.path);
      await this.fileService.write(uri, JSON.stringify(this.content));
      this.messageService.info(`Saved ${this.currentFile.name}`);
    } catch (error) {
      this.messageService.error(`Error saving file: ${error}`);
    }
  }

  protected handleEditorChange = (content: CodexNotebookAsJSONData) => {
    this.content = content;
  };

  render(): React.ReactElement {
    return (
      <div className="context-editor-container">
        {this.currentFile ? (
          <>
            <div className="editor-header">
              <h3>{this.currentFile.name}</h3>
              <button
                className="theia-button primary"
                onClick={() => this.saveFile()}
                title="Save File"
              >
                Save
              </button>
            </div>
            {this.content &&
              this.content.cells.slice(0, 10).map((cell) => (
                <ReactQuill
                  theme="snow"
                  value={cell.value}
                  onChange={this.handleEditorChange}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike", "blockquote"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "code-block"],
                      ["clean"],
                    ],
                  }}
                />
              ))}
          </>
        ) : (
          <div className="no-file-selected">
            Select a file from the Workspace Files panel to edit
          </div>
        )}
      </div>
    );
  }
}
