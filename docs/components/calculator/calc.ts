import Big from 'big.js';

const calcSymbolTest = /^[*/+-]*$/;
const splitAsNumAndCalcSymbol = (str) => {
  const list = [];
  let temp = '';
  const _splitList = str.split('');
  const l = _splitList.length;

  for (let i = 0; i < l; i++) {
    if (calcSymbolTest.test(_splitList[i])) {
      list.push(temp);
      list.push(_splitList[i]);

      temp = '';
    } else {
      temp += _splitList[i];
    }
  }

  list.push(temp);

  return list;
};

const add = (a, b) => new Big(a).add(new Big(b));
const reduce = (a, b) => new Big(a).minus(new Big(b));
const divide = (a, b) => new Big(a).div(new Big(b));
const times = (a, b) => new Big(a).times(new Big(b));

const calcPureFormula = (formula) => {
  const _arr = splitAsNumAndCalcSymbol(formula);

  const handler = (index, f) => {
    _arr.splice(index - 1, 3, f(_arr[index - 1], _arr[index + 1]));
  };

  while (_arr.length > 1) {
    const indexOfTimeSymbol = _arr.indexOf('*');
    const indexOfDivideSymbol = _arr.indexOf('/');
    if (indexOfTimeSymbol !== -1 || indexOfDivideSymbol !== -1) {
      if (
        indexOfDivideSymbol === -1 ||
        (indexOfTimeSymbol !== -1 && indexOfTimeSymbol < indexOfDivideSymbol)
      ) {
        // 乘法
        handler(indexOfTimeSymbol, times);
        continue;
      } else if (
        indexOfTimeSymbol === -1 ||
        (indexOfDivideSymbol !== -1 && indexOfDivideSymbol < indexOfTimeSymbol)
      ) {
        // 除法
        handler(indexOfDivideSymbol, divide);
        continue;
      }
    }

    // 加法
    const indexOfAddSymbol = _arr.indexOf('+');
    if (indexOfAddSymbol !== -1) {
      handler(indexOfAddSymbol, add);
    }

    // 减法
    const indexOfReduceSymbol = _arr.indexOf('-');
    if (indexOfReduceSymbol !== -1) {
      handler(indexOfReduceSymbol, reduce);
    }
  }

  return _arr[0].toString();
};

const countOf = (str, searchValue) => {
  return str
    .split('')
    .reduce((count, letter) => (count + searchValue === letter ? 1 : 0), 0);
};

const calc = (str) => {
  let _str = str;
  if (countOf(_str, '(') !== countOf(_str, ')')) {
    return '';
  }

  while (_str.indexOf(')') !== -1) {
    const indexOfRightBracket = _str.indexOf(')');
    let indexOfLeftBracket = -1;
    for (let i = indexOfRightBracket - 1; i >= 0; i--) {
      if (_str[i] === '(') {
        indexOfLeftBracket = i;
        break;
      }
    }

    _str = `${_str.slice(0, indexOfLeftBracket)}${calcPureFormula(
      _str.slice(indexOfLeftBracket + 1, indexOfRightBracket)
    )}${_str.slice(indexOfRightBracket + 1)}`;
  }

  return calcPureFormula(_str);
};

export default calc
