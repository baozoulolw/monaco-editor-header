import { config } from "../config/config";
import global from "../util/CONST";

/**
 * 以哪种形式生成注释
 * 项目使用特殊库/规则，导致文件语言跟注释形式不匹配情况
 * 1. 用户定义的语言符号
 * 2. 插件自带的语言符号
 * 3. 无法识别的语言 默认的注释符号
 */
export const fileEndMatch = (fileEnd: string) => {
  //  匹配用户自定义语言
  // 支持语言
  const obj = {
    "/^java$|^javascript$|^typescript$|^javascriptreact$|^typescriptreact$|^go$|^cpp$|^php$|^rust$|^dart$|^c$/":
      "javascript",
    "/^python$/": "python",
    "/^lua$/": "lua",
    "/^vb$/": "vb",
    "/^vue$|^html$|^markdown$/": "html",
    "/^shellscript$/": "shellscript",
  };
  return matchProperty(obj, fileEnd);
};

// 正则匹配对象中的属性
function matchProperty(matchObj: any, matchStr: string) {
  for (const key in matchObj) {
    // 属性即正则
    // eslint-disable-next-line no-eval
    const reg = eval(key);
    const isMatch = reg.test(matchStr);
    if (isMatch) {
      return matchObj[key];
    }
  }
  // 默认注释符号
  return global.NoMatchLanguage;
}
/**
 * 函数注释，更改值,
 * @Created_time: 2019-05-07 19:36:20
 * @return {Object} 更换字段后的对象
 */
export const cursorOptionHandleFn = () => {
  let data = {};
  const userObj = config.cursorMode;
  if (Object.keys(userObj).length === 0) {
    data = {
      description: "",
      param: "",
      return: "",
    };
  } else {
    // 如果用户设置了模板，那将默认根据用户设置模板
    data = Object.assign({}, userObj); // 复制对象，否则对象不能更改值
  }
  if (data.Date !== undefined) {
    data.Date = new Date().format();
  }
  data = logicUtil.changePrototypeNameFn(data, config);
  data = changeTplValue(data, config); // 修改模板设置的值
  data = logicUtil.sameLengthFn(data, "function"); // 将字段弄得一样长
  return data;
};

/**
 * 使用空格填充字符
 */
export const spaceStringFn = (oldStr: string, maxNum: number) => {
  if (!config.configObj.wideSame) return oldStr; // 不改变长度
  if (maxNum === 0) return oldStr; // 不改变长度
  if (typeof maxNum !== "number") {
    // 不为数字默认为13
    maxNum = 13;
  }
  const diffNum = maxNum - oldStr.length;
  if (diffNum < 0) return oldStr;
  const spaceStr = "".padStart(diffNum);
  return `${oldStr}${spaceStr}`;
};
