import global from "../util/CONST";
import _ from "lodash";
import { config } from "../config/config";
import { editor, editor as Editor, Selection } from "monaco-editor";

/**
 * 更改字段，不改变他们的顺序
 * @Created_time: 2019-05-07 19:36:20
 * @return {Object} 更换字段后的对象
 */
export const changePrototypeNameFn = (data: any): object => {
  const keysArr = Object.keys(data);
  const objData: any = {};
  const specialArr = [
    // 没有操作
    global.SPECIAL_AUTHOR,
    global.SPECIAL_DATE,
    global.SPECIAL_HEAD_DESCRIPTION,
    global.SPECIAL_FN_DESCRIPTION,
    // 需要变更
    global.SPECIAL_LAST_EDIT_TIME,
    global.SPECIAL_LAST_EDITORS,
    global.SPECIAL_FILE_PATH,
  ];
  keysArr.forEach((item) => {
    // 特殊字段 且 有设置特殊字段
    const specialItem = getSpecialOptionName(item, true);
    if (specialArr.includes(item) && specialItem) {
      objData[specialItem] = data[item];
    } else if (item.indexOf(global.specialString) !== -1) {
      // 更改用户自定义输出字段 后期需要切割它
      if (item === `${global.specialString}1_copyright`) {
        objData[global.customStringCopyRight] = data[item];
      } else if (item === `${global.specialString}1_date`) {
        objData[global.customStringTime] = data[item];
      } else {
        objData[`symbol_${item}`] = data[item];
      }
    } else {
      objData[item] = data[item];
    }
  });
  return objData;
};

/**
 * @description: 获取某个key的特殊字段，可以根据语言单独配置
 * @param {type} key 获取哪个特殊字段的key
 * @param {type} isHas 是否存在
 * @return {type}
 */
function getSpecialOptionName(key: string, isHas: boolean): any {
  // 获取用户语言特殊字符、或者整体的特殊字符
  const specialOptions = {};
  const specialOptionsDefault = config.configObj.specialOptions;
  // 合并配置项，默认配置与单独配置结合。
  const options: any = Object.assign(
    _.cloneDeep(specialOptionsDefault),
    _.cloneDeep(specialOptions)
  );
  if (isHas) {
    return options[key];
  }
  return options[key] ? options[key] : key;
}

/**
 * @description: 函数注释前面的长度
 * @param {Object} editor 当前激活文件
 * @return: lineSpace：前面的长度 line:当前行(数字)，nextLine 激活行的下一行是否有内容
 */
export const lineSpaceFn = (editor: Editor.IStandaloneCodeEditor) => {
  const moreLineObj = isMoreLine(editor);
  const cursorModeInternal = false;
  if (moreLineObj) {
    // 函数参数注释多行逻辑
    return getMoreLine(cursorModeInternal, editor, moreLineObj);
  } else {
    // 函数注释单行逻辑
    let activeLine = editor.getPosition()?.lineNumber as number; // 激活行 行号
    let lineProperty = editorLineAt(editor, activeLine); // 激活行内容
    let lineSpace = lineProperty.firstNonWhitespaceCharacterIndex; // 激活行前面的空格
    let nextLine;
    // 判断当前行有没有内容 决定选择当前行还是下一行的长度
    if (
      lineProperty.isEmptyOrWhitespace &&
      editor.getModel()?.getLineCount() !== activeLine + 1
    ) {
      // 选择下一行
      nextLine = activeLine + 1;
      lineProperty = editorLineAt(editor, nextLine);
      lineSpace = lineProperty.firstNonWhitespaceCharacterIndex;
    } else {
      // 当前行有内容 是否想生成在函数内部
      if (cursorModeInternal) {
        activeLine = activeLine + 1;
      }
    }
    return [lineSpace, activeLine, nextLine, lineProperty];
  }
};

// 多行的生成行号，多行文本合并
function getMoreLine(
  cursorModeInternal: boolean,
  editor: Editor.IStandaloneCodeEditor,
  moreLineObj: MoreLineObj
) {
  const lineProperty = getMultilineText(editor, moreLineObj);
  let activeLine = getFirstLineNoEmpty(editor, moreLineObj);
  let lineSpace = editorLineAt(
    editor,
    activeLine
  ).firstNonWhitespaceCharacterIndex;
  // 函数内生成 获取最后一行的行号和前面的空格 用于生成
  if (cursorModeInternal) {
    const endLineNoEmpty = getEndLineNoEmpty(editor, moreLineObj);
    activeLine = endLineNoEmpty + 1;
    // 最后一行的前面空格
    lineSpace = editor
      .getModel()
      ?.getLineFirstNonWhitespaceColumn(endLineNoEmpty) as number;
  }
  return [lineSpace, activeLine, undefined, lineProperty];
}
type MoreLineObj = NonNullable<ReturnType<typeof isMoreLine>>;

// 获取第一行不为空的行数
function getFirstLineNoEmpty(
  editor: Editor.IStandaloneCodeEditor,
  moreLineObj: MoreLineObj
) {
  const { startObj, endObj } = moreLineObj;
  const lineNumber = startObj.line;
  for (let i = startObj.line; i <= endObj.line; i++) {
    const lineProperty = editorLineAt(editor, i);
    if (!lineProperty.isEmptyOrWhitespace) return i;
  }
  return lineNumber;
}

// 获取最后一行不为空的行数
function getEndLineNoEmpty(
  editor: Editor.IStandaloneCodeEditor,
  moreLineObj: MoreLineObj
) {
  const { startObj, endObj } = moreLineObj;
  const lineNumber = endObj.line;
  for (let i = endObj.line; i >= startObj.line; i--) {
    const lineProperty = editorLineAt(editor, i);
    if (!lineProperty.isEmptyOrWhitespace) return i;
  }
  return lineNumber;
}

// 多行合并成一行
function getMultilineText(
  editor: Editor.IStandaloneCodeEditor,
  moreLineObj: MoreLineObj
) {
  const { startObj, endObj } = moreLineObj;
  let text = "";
  for (let i = startObj.line; i <= endObj.line; i++) {
    const lineProperty = editorLineAt(editor, i);
    text += lineProperty.text;
  }
  return {
    text: text,
  };
}

// 选择多行判断
function isMoreLine(editor: Editor.IStandaloneCodeEditor) {
  const selectionsArr = editor.getSelections() as Selection[];
  const selectItem = selectionsArr[0];
  const startObj = { line: selectItem.startLineNumber };
  const endObj = { line: selectItem.endLineNumber };
  // 多行返回对象
  if (startObj.line !== endObj.line) {
    return { startObj, endObj };
  }
}

function editorLineAt(
  editor: Editor.IStandaloneCodeEditor,
  lineNumber: number
) {
  const model = editor.getModel() as editor.ITextModel;
  let content = model.getLineContent(lineNumber);
  return {
    text: content,
    isEmptyOrWhitespace: _.isEmpty(content?.trim()),
    firstNonWhitespaceCharacterIndex:
      model.getLineFirstNonWhitespaceColumn(lineNumber),
    lastNonWhitespaceCharacterIndex:
      model.getLineLastNonWhitespaceColumn(lineNumber),
  };
}
