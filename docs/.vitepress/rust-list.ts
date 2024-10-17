interface Route {
  text: string
  link: string
  items?: Route[]
}

function folder(_f: Route, folderIndex: number) {
  const newF = {
    ..._f,
    link: `${folderIndex}/${_f.link}`,
  }

  if (_f.items?.length) {
    return {
      ...newF,
      items: _f.items.map(_f2 => folder(_f2, folderIndex)),
    }
  }

  return newF
}

// 🚧
// start at commit in Mar 22,2024 #6f8d38c
export const rustList = [
  folder({
    text: '3. 常规编程概念',
    link: 'common-programming-concepts',
    items: [
      { text: '3.1 变量和可变性', link: 'variables-and-mutability' },
      { text: '3.2 数据类型', link: 'data-types' },
      { text: '3.3 函数', link: 'functions' },
      { text: '3.4 注释', link: 'comments' },
      { text: '3.5 流程控制', link: 'control-flow' },
    ],
  }, 3),
  folder({
    text: '4. 理解所有权',
    link: 'understanding-ownership',
    items: [
      { text: '4.1 什么是所有权？', link: 'what-is-ownership' },
      { text: '4.2 引用和借用', link: 'references-and-borrowing' },
      { text: '4.3 修复错误的所有权', link: 'fixing-ownership-errors' },
      { text: '4.4 切片类型', link: 'the-slice-type' },
      { text: '4.5 所有权回顾', link: 'ownership-recap' },
    ],
  }, 4),
  folder({
    text: '5. 使用结构体存储相关联的数据',
    link: 'using-structs-to-structure-related-data',
    items: [
      { text: '5.1 定义和实例化结构体', link: 'defining-and-instantiating-structs' },
      { text: '5.2 一个使用结构体的例子', link: 'an-example-program-using-structs' },
      { text: '5.3 方法', link: 'method-syntax' },
    ],
  }, 5),
  folder({
    text: '6. 枚举和模式匹配',
    link: 'enums-and-pattern-matching',
    items: [
      { text: '6.1 定义枚举', link: 'defining-an-enum' },
      { text: '6.2 match: 流程控制结构', link: 'the-match-control-flow-construct' },
      { text: '6.3 使用`if let`简化流程控制', link: 'concise-control-flow-with-if-let' },
      { text: '6.4 所有权之旅 #1', link: 'ownership-inventory-hash-1' },
    ],
  }, 6),
  folder({
    text: '7. 使用包、库和模块来管理不断增长的项目',
    link: 'manage-growing-projects-with-packages-crates-and-modules',
    items: [
      { text: '7.1 包和库', link: 'packages-and-crates' },
      { text: '7.2 通过模块定义控制作用域和私有权', link: 'defining-modules-to-control-scope-and-privacy' },
      { text: '7.3 模块树元素的引用路径', link: 'paths-for-referring-to-an-item-in-the-module-tree' },
      { text: '7.4 使用`use`关键字将路径引入作用域', link: 'brining-paths-into-scope-with-the-use-keyword' },
      { text: '7.5 将模块分割为多个文件', link: 'separating-modules-into-different-files' },
    ],
  }, 7),
  folder({
    text: '8. 常用集合',
    link: 'common-collections',
    items: [
      { text: '8.1 使用Vector创建强大的值列表', link: 'strong-lists-of-values-with-vectors' },
      { text: '8.2 使用String创建强大的UTF-8字符串', link: 'strong-utf-8-encoded-text-with-strings' },
      { text: '8.3 使用Hash Map创建强大的kv结构', link: 'strong-keys-with-associated-values-in-hash-maps' },
      { text: '8.4 所有权之旅 #2', link: 'ownership-inventory-hash-2' },
    ],
  }, 8),
  folder({
    text: '9. 错误处理',
    link: 'error-handling',
    items: [
      { text: '9.1 对不可恢复的错误panic!', link: 'unrecoverable-errors-with-panic' },
      { text: '9.2 对可恢复的错误使用Result', link: 'recoverable-errors-with-result' },
      { text: '9.3 panic还是不panic', link: 'to-panic-or-not-to-panic' },
    ],
  }, 9),
  folder({
    text: '10. 泛型，特性和生命周期',
    link: 'generic-types-traits-and-lifetimes',
    items: [
      { text: '10.1 泛型数据类型', link: 'generic-data-types' },
      { text: '10.2 特性：定义共享行为', link: 'traits-defining-shared-behavior' },
      { text: '10.3 通过生命周期校验引用', link: 'validating-references-with-lifetimes' },
      { text: '10.4 所有权之旅 #3', link: 'ownership-inventory-hash-3' },
    ],
  }, 10),
  folder({
    text: '11. 书写自动维护的测试',
    link: 'writing-automated-tests',
    items: [
      { text: '11.1 如何编写测试', link: 'how-to-write-tests' },
      { text: '11.2 控制测试的运行', link: 'controlling-how-tests-are-run' },
      // { text: '11.3 测试的文件结构', link: 'test-organization' },
    ],
  }, 11),
]
