import * as React from "react";
import {
  injectable,
  postConstruct,
  inject,
} from "@theia/core/shared/inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { MessageService } from "@theia/core";
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { Message } from "@theia/core/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import URI from "@theia/core/lib/common/uri";
import { OpenHandler } from "@theia/core/lib/browser";

interface WorkspaceFile {
  name: string;
  path: string;
}

@injectable()
export class FilePickerWidget extends ReactWidget {
  static readonly ID = "file-picker:widget";
  static readonly LABEL = "Workspace Files";

  @inject(MessageService)
  protected readonly messageService!: MessageService;

  @inject(WorkspaceService)
  protected readonly workspaceService!: WorkspaceService;

  @inject(FileService)
  protected readonly fileService!: FileService;

  @inject("context-editor-opener")
  protected readonly editorOpener!: OpenHandler;

  protected files: WorkspaceFile[] = [];
  protected selectedFile: WorkspaceFile | null = null;

  @postConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    this.id = FilePickerWidget.ID;
    this.title.label = FilePickerWidget.LABEL;
    this.title.caption = FilePickerWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = "fa fa-folder-open";
    await this.refreshWorkspaceFiles();
    this.update();
  }

  protected async refreshWorkspaceFiles(): Promise<void> {
    const root = this.workspaceService.tryGetRoots()[0];
    if (!root) {
      this.messageService.warn("No workspace root found");
      return;
    }

    try {
      const stat = await this.fileService.resolve(root.resource);
      if (stat) {
        const files: WorkspaceFile[] = [];
        const traverse = async (uri: URI) => {
          const stat = await this.fileService.resolve(uri);
          if (!stat) return;

          if (stat.children) {
            for (const child of stat.children) {
              if (!child.isDirectory) {
                files.push({
                  name: child.name,
                  path: child.resource.toString(),
                });
              }
              await traverse(child.resource);
            }
          }
        };

        await traverse(root.resource);
        this.files = files;
        this.update();
      }
    } catch (error) {
      this.messageService.error("Error loading workspace files: " + error);
    }
  }

  protected async openFile(file: WorkspaceFile): Promise<void> {
    try {
      this.selectedFile = file;
      await this.editorOpener.open(new URI(file.path));
      this.update();
    } catch (error) {
      this.messageService.error(`Error opening file ${file.name}: ${error}`);
    }
  }

  render(): React.ReactElement {
    return (
      <div className="workspace-files-container" tabIndex={0}>
        <div className="files-header">
          <h3>Workspace Files</h3>
          <button
            className="theia-button secondary"
            onClick={() => this.refreshWorkspaceFiles()}
            title="Refresh Files"
          >
            Refresh
          </button>
        </div>
        <div className="files-list">
          {this.files.length === 0 ? (
            <div className="no-files">No files found in workspace</div>
          ) : (
            <ul>
              {this.files.map((file, index) => (
                <li
                  key={index}
                  title={file.path}
                  onClick={() => this.openFile(file)}
                  className={
                    this.selectedFile?.path === file.path ? "active" : ""
                  }
                >
                  <span className="file-name">{file.name}</span>
                  <span className="file-path">{file.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    const container = document.querySelector(".workspace-files-container");
    if (container instanceof HTMLElement) {
      container.focus();
    }
  }
}
