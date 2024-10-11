import { Monaco } from "./index";
import { editor as Editor, IDisposable } from "monaco-editor";
import { fileEndMatch } from "./util/utils";
import { lineSpaceFn } from "./util/logicUtil";
import { config } from "./config/config";

let listenerActive: boolean = true;
let hasReg = false;
let activeEditor: Editor.IStandaloneCodeEditor | null = null;
let disposeMap = new WeakMap<
  Editor.IStandaloneCodeEditor | Editor.ICodeEditor,
  IDisposable[]
>();

export function functionAnnotation(monaco: Monaco) {
  if (!activeEditor) return;
  const languageId = activeEditor.getModel()?.getLanguageId();
  if (!languageId) return;
  const fileEnd = fileEndMatch(languageId);
  const [lineSpace, line, nextLine, lineProperty] = lineSpaceFn(activeEditor);
  console.log(monaco, fileEnd);
  const model = activeEditor.getModel();
  if (!model) return;
  const insertEdit = {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  };
}

export function listenerCreate(monaco: Monaco) {
  listenerActive = true;
  if (hasReg === true) return;
  let create = monaco.editor.create;
  monaco.editor.create = function (...params) {
    const editor = create(...params);
    if (listenerActive) {
      const disposeF1 = editor.onDidFocusEditorWidget(() =>
        setActiveEditor(editor)
      );
      const disposeF2 = editor.onDidBlurEditorWidget(() =>
        setActiveEditor(null)
      );
      disposeMap.set(editor, [disposeF1, disposeF2]);
    }
    return editor;
  };
  hasReg = true;
  return () => {
    listenerActive = false;
    monaco.editor.getEditors().forEach((editor) => {
      disposeMap.get(editor)?.forEach((item) => item.dispose());
      disposeMap.delete(editor);
    });
  };
}

function setActiveEditor(editor: Editor.IStandaloneCodeEditor | null) {
  activeEditor = editor;
}
