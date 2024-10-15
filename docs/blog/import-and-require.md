# `import`和`require`

## 需求

在封装一些`js-entry`的库时，遇到一个值得思考的问题：**这个库要支持哪些模块化方式呢？**

很自然而然地会想到`esm`和`cjs`，期望最终的效果是
```js
// usage in esm
import { a as ma, b as mb } from 'lib'

// usage in cjs
const { a, b } = require('lib')
```

## 实现

在寻找技术实现中，发现了`package.json`中关于[`exports`](https://nodejs.org/api/packages.html#packages_conditional_exports)的配置
```json
{
  "name": "lib",
  "main": "./dist/index.js",
  "exports": {
    "import": "./dist/index.js",
    "require": "./dist/index.umd.cjs"
  }
}
```
此时似乎方案已经比较明了，任何主流的打包工具都有将源代码输出成多种模块化格式代码的能力，但是似乎事情并没有那么简单

## .default

如果利用类似`rollup`的工具打包后，那么此时的情况如下
```js
// source code
export function a() {}
export function b() {}
export default function dft() {}
```

```js
// usage in esm
import mDft, { a as ma, b as mb } from 'lib'

// usage in cjs
const { default: dft, a, b } = require('lib')
```

这样的写法倒也说不上麻烦，但是似乎和我对常见库的印象有些不相符，比如`dayjs`这个库, 我记得他的使用方式是十分一致的
```js
// usage in esm
import mDayjs from 'dayjs'

// usage in cjs
const dayjs = require('dayjs')
// why not `const { default: dayjs } = require('dayjs')`
```

## dayjs的打包方式

研究了下`dayjs`的源码打包方式，这才真相大白

首先，dayjs的源码虽然使用esm进行开发且代码打包成了两种格式，但它的`package.json`中既没有`exports`的配置，也没有`"type": "module"`

```json
{
  "name": "dayjs",
  "main": "index.min.js" // point to cjs file
}
```

而在我们使用`esm`的`import`导入`module.exports=xxx`的cjs代码时是完全行得通的（仅限在含非esm`package.json`的包下），`import`兼容了`require`的部分功能

## 结论

综上而言，如果你的`lib`最终打包的结果像`dayjs`一样，没有任何的具名导出，所有的成员都挂在一个对象上，那么最好的方式就是**将你的源码打包成cjs格式，且`packages.json`不要指定`"type": "module"`**

而如果你的`lib`提供了`default`和多个具名的导出，那么此时还是乖乖的使用`exports`配置，接收使用处没有那么一致的代码吧

## 其他

1. 感觉`import`兼容`require`部分功能的这点似乎极不利于`esm`的发展呢...

2. 在研究`dayjs`打包时也研究了一下以前作为初学者望而生怯的那段代码，现在理解起来也感觉十分简单了😎不过还是惊叹于这段代码的才华，就放在下面让自己时常看看吧
```js
/* eslint-disable no-restricted-globals */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (
          global = typeof globalThis !== 'undefined'
            ? globalThis
            : global || self,
          global.dayjs = factory()
        )
}(this, () => {
  // ...
}))
```
