import { useMemo, useState } from "react";
import { calculate, preCheck } from "simple-calculate";

const replaceTextList = [
  ["x", "*"],
  ["÷", "/"],
  ["（", "("],
  ["）", ")"],
  [" ", ""],
];

export default function Calculator() {
  const [value, setValue] = useState<string>();

  const result = useMemo(() => {
    let _inputValue = value;
    if (!_inputValue) {
      return;
    }

    // 替换特殊字符
    _inputValue = replaceTextList.reduce<string>((_str, [searchValue, replaceValue]) => {
      return _str.replaceAll(searchValue, replaceValue);
    }, _inputValue);

    if (!preCheck(_inputValue)) {
      return "请勿输入特殊字符";
    }

    try {
      return calculate(_inputValue);
    } catch (error) {
      console.error(error);
      return "";
    }
  }, [value]);

  return (
    <div className="pt-8">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full text-3xl"
        placeholder="输入算式"
      />

      <hr />

      <span>结果: {result}</span>
    </div>
  );
}
