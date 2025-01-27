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
import { CodexNotebookAsJSONData } from "shared-types";
import {
  Saveable,
  SaveableSource,
  Navigatable,
  StatefulWidget,
  ExtractableWidget,
} from "@theia/core/lib/browser";
import { Event, Emitter } from "@theia/core";
import { Message } from "@theia/core/lib/browser";
// import { Button } from "shared-ui";

import "./style/index.css";
export interface FileToEdit {
  name: string;
  path: string;
}

@injectable()
export class ContextEditorWidget
  extends ReactWidget
  implements SaveableSource, Navigatable, StatefulWidget, ExtractableWidget
{
  static readonly ID = "context-editor:widget";
  static readonly LABEL = "Context Editor";

  @inject(MessageService)
  protected readonly messageService!: MessageService;

  @inject(FileService)
  protected readonly fileService!: FileService;

  protected currentFile: FileToEdit | null = null;
  protected content: CodexNotebookAsJSONData | undefined;

  // ExtractableWidget-related
  isExtractable = true;
  secondaryWindow: Window | undefined;

  // Keep track of whether we are "dirty." This might be updated when the user modifies the editor content.
  protected dirtyFlag = false;

  // You can emit an event if external components need to react to "dirty" changes
  protected readonly onDirtyChangedEmitter = new Emitter<void>();
  get onDirtyChanged(): Event<void> {
    return this.onDirtyChangedEmitter.event;
  }

  // Implement SaveableSource
  get saveable(): Saveable {
    return {
      // Tells Theia how or whether auto-save is handled.
      // Could be: 'off', 'on', 'onFocusChange', etc.
      // autoSave: "off",
      // Let Theia know whether our editor is dirty
      onContentChanged: new Emitter<void>().event,
      dirty: this.dirtyFlag,
      onDirtyChanged: this.onDirtyChanged,
      // The method Theia will call when a "save" is triggered
      save: async () => {
        if (!this.currentFile) {
          return;
        }
        try {
          const uri = new URI(this.currentFile.path);
          await this.fileService.write(
            uri,
            JSON.stringify(this.content, null, 2)
          );
          this.messageService.info(`Saved ${this.currentFile.name}`);
          this.setDirty(false);
        } catch (error) {
          this.messageService.error(`Error saving file: ${error}`);
        }
      },
    };
  }

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
      console.log({ content });
      this.content = JSON.parse(content.value) as CodexNotebookAsJSONData;
      this.currentFile = file;
      this.title.label = `${file.name} - Context Editor`;
      this.setDirty(false);
      this.update();
    } catch (error) {
      this.messageService.error(`Error opening file ${file.name}: ${error}`);
    }
  }

  // Navigatable
  getResourceUri(): URI | undefined {
    if (this.currentFile) {
      return new URI(this.currentFile.path);
    }
    return undefined;
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    // Decide how to change the URI if "save as" or move is requested
    return resourceUri;
  }

  // StatefulWidget
  storeState(): object | undefined {
    // For UTITLED_SCHEME or ephemeral data, you may choose to skip
    // Return an object representing widget state
    if (!this.currentFile) {
      return undefined;
    }
    return {
      filePath: this.currentFile.path,
      // If you have editor scroll positions, selections, etc., store them here
    };
  }

  restoreState(oldState: object): void {
    // If your widget is being "restored," re-open or re-apply those states
    const state = oldState as { filePath: string };
    if (state.filePath) {
      // Possibly re-open
      this.openFile({ name: state.filePath, path: state.filePath });
    }
  }

  protected setDirty(newValue: boolean) {
    if (this.dirtyFlag !== newValue) {
      this.dirtyFlag = newValue;
      this.onDirtyChangedEmitter.fire(undefined);
    }
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    // Focus widgets or subviews if necessary
  }

  // ExtractableWidget methods
  // Typically, you'd have logic here to open this widget in a new window, or
  // handle it if the user drags it out as a standalone panel.

  protected handleEditorChange = (content: string, cellId: string) => {
    if (!this.content) return;

    this.content = {
      ...this.content,
      cells: this.content.cells.map((cell) => {
        if (cell.metadata.id === cellId) {
          return {
            ...cell,
            value: content,
          };
        }
        return cell;
      }),
    };

    this.setDirty(true);
  };

  render(): React.ReactElement {
    return (
      <div className="context-editor-container">
        {/* <Button>Click me</Button> */}
        {this.currentFile ? (
          <>
            <div className="editor-header">
              <h3>{this.currentFile.name}</h3>
              <button
                className="theia-button primary"
                onClick={() => this.saveable.save()}
                title="Save File"
              >
                Save
              </button>
            </div>
            <div className="flex items-center justify-center bg-gray-100 p-4">
              <h1 className="text-2xl font-bold text-red-700">
                {this.content?.metadata.title}
              </h1>
            </div>
            {this.content &&
              this.content.cells.slice(0, 10).map((cell) => (
                <ReactQuill
                  key={cell.metadata.id}
                  theme="snow"
                  value={cell.value}
                  onChange={(content: string) =>
                    this.handleEditorChange(content, cell.metadata.id)
                  }
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
