import { injectable, inject } from "@theia/core/shared/inversify";
import { MenuModelRegistry } from "@theia/core";
import { FilePickerWidget } from "./file-picker-widget";
import { ContextEditorWidget } from "./codex-widget";
import {
  AbstractViewContribution,
  OpenHandler,
  Widget,
} from "@theia/core/lib/browser";
import { CommandRegistry } from "@theia/core/lib/common/command";
import URI from "@theia/core/lib/common/uri";
import { WidgetManager } from "@theia/core/lib/browser";
import { MaybePromise } from "@theia/core/lib/common/types";

export const ContextEditorCommands = {
  toggleFilePicker: {
    id: "file-picker.toggle",
    label: "Toggle Workspace Files",
    category: "Context Editor",
  },
} as const;

@injectable()
export class ContextEditorWidgetContribution
  extends AbstractViewContribution<FilePickerWidget>
  implements OpenHandler
{
  @inject(WidgetManager)
  protected readonly widgetManager: WidgetManager;

  readonly id = "context-editor-opener";

  constructor() {
    super({
      widgetId: FilePickerWidget.ID,
      widgetName: FilePickerWidget.LABEL,
      defaultWidgetOptions: { area: "left" },
      toggleCommandId: ContextEditorCommands.toggleFilePicker.id,
    });
  }

  canHandle(uri: URI): MaybePromise<number> {
    // Return a positive number if we can handle this URI
    // Higher numbers indicate higher priority
    return 10;
  }

  async open(uri: URI): Promise<Widget | undefined> {
    const widget = await this.getOrCreateEditorWidget();
    await widget.openFile({
      name: uri.path.base,
      path: uri.toString(),
    });
    return widget;
  }

  protected async getOrCreateEditorWidget(): Promise<ContextEditorWidget> {
    const widget =
      await this.widgetManager.getOrCreateWidget<ContextEditorWidget>(
        ContextEditorWidget.ID
      );
    if (!widget.isAttached) {
      this.shell.addWidget(widget, { area: "main" });
    }
    this.shell.activateWidget(widget.id);
    return widget;
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(ContextEditorCommands.toggleFilePicker, {
      execute: () => super.openView({ activate: true, reveal: true }),
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
