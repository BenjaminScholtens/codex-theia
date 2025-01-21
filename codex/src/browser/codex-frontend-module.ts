import { ContainerModule } from "@theia/core/shared/inversify";
import { FilePickerWidget } from "./file-picker-widget";
import { ContextEditorWidget } from "./codex-widget";
import { ContextEditorWidgetContribution } from "./codex-contribution";
import {
  bindViewContribution,
  FrontendApplicationContribution,
  WidgetFactory,
} from "@theia/core/lib/browser";

import "../../src/browser/style/index.css";

export default new ContainerModule((bind) => {
  console.log("context-editor-widget-frontend-module bindings");

  // Bind the widget contribution
  bindViewContribution(bind, ContextEditorWidgetContribution);
  bind(FrontendApplicationContribution).toService(
    ContextEditorWidgetContribution
  );

  // Bind the file picker widget
  bind(FilePickerWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: FilePickerWidget.ID,
      createWidget: () => ctx.container.get<FilePickerWidget>(FilePickerWidget),
    }))
    .inSingletonScope();

  // Bind the editor widget
  bind(ContextEditorWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: ContextEditorWidget.ID,
      createWidget: () =>
        ctx.container.get<ContextEditorWidget>(ContextEditorWidget),
    }))
    .inSingletonScope();

  // Bind the editor opener
  bind("context-editor-opener").toService(ContextEditorWidgetContribution);
});
