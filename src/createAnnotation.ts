import { Monaco } from "./index";
import { editor as Editor, IDisposable } from "monaco-editor";
let activeEditor: Editor.IStandaloneCodeEditor | null = null;
let disposeMap = new WeakMap<Editor.IStandaloneCodeEditor, IDisposable[]>();
let keyMap = new Map<
  Editor.IStandaloneCodeEditor,
  Editor.IStandaloneCodeEditor
>();
export function functionAnnotation(monaco: Monaco) {
  console.log(activeEditor);
}

export function listenerCreate(monaco: Monaco) {
  let create = monaco.editor.create;
  monaco.editor.create = function (...params) {
    const editor = create(...params);
    const disposeF1 = editor.onDidFocusEditorWidget(() =>
      setActiveEditor(editor)
    );
    const disposeF2 = editor.onDidBlurEditorWidget(() => setActiveEditor(null));
    keyMap.set(editor, editor);
    disposeMap.set(editor, [disposeF1, disposeF2]);
    editor.onDidDispose(() => {
      disposeF1.dispose();
      disposeF2.dispose();
      keyMap.delete(editor);
    });
    return editor;
  };
  return () => {
    for (const [key, _] of keyMap) {
      const value = disposeMap.get(key);
      if (value !== undefined) {
        value.forEach((item) => item.dispose());
      }
    }
    monaco.editor.create = create;
  };
}

function setActiveEditor(editor: Editor.IStandaloneCodeEditor | null) {
  activeEditor = editor;
}
