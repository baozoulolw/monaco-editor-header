import Mon from "monaco-editor";
import { functionAnnotation, listenerCreate } from "./createAnnotation";

export type Monaco = typeof Mon;
export type Editor = typeof Mon.editor;
export function registerCommand(monaco: Monaco) {
  const dispose = listenerCreate(monaco);
  monaco.editor.registerCommand("header-cursorTip", () =>
    functionAnnotation(monaco)
  );
  return () => {
    dispose()
  }
}
