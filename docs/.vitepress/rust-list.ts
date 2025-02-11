import type { Route } from './types'

function beautifyText(text: string) {
  if (text.includes('<T>')) {
    return text.replace('<T>', '&lt;T&gt;')
  }

  return text
}

function folder(_f: Route, folderIndex: number, subIndex?: number) {
  const newF = {
    ..._f,
    text: `${folderIndex ? `${folderIndex}.` : ''}${subIndex !== undefined ? subIndex + 1 : ''} ${beautifyText(_f.text)}`,
    link: `${folderIndex}/${_f.link}`,
  }

  if (_f.items?.length) {
    return {
      ...newF,
      items: _f.items.map((_f2, _si) => folder(_f2, folderIndex, _si)),
    }
  }

  return newF
}

// 🚧
// start at commit in Mar 22,2024 #6f8d38c
export const rustList = [
  // folder({
  //   text: '实验介绍',
  //   link: 'experiment-introduction',
  // }, 0),
  // folder({
  //   text: 'Rust 程序设计语言',
  //   link: 'the-rust-programming-language',
  // }, 0),
  // folder({
  //   text: '前言',
  //   link: 'foreword',
  // }, 0),
  // folder({
  //   text: '介绍',
  //   link: 'introduction',
  // }, 0),
  // folder({
  //   text: '开始',
  //   link: 'getting-started',
  //   items: [
  //     { text: '安装', link: 'installation' },
  //     { text: 'Hello, World', link: 'hello-world' },
  //     { text: 'Hello, Cargo', link: 'hello-cargo' },
  //   ],
  // }, 1),
  // folder({
  //   text: '开发一个猜数游戏',
  //   link: 'programming-a-guessing-game',
  // }, 2),
  folder({
    text: '常规编程概念',
    link: 'common-programming-concepts',
    items: [
      { text: '变量和可变性', link: 'variables-and-mutability' },
      { text: '数据类型', link: 'data-types' },
      { text: '函数', link: 'functions' },
      { text: '注释', link: 'comments' },
      { text: '流程控制', link: 'control-flow' },
    ],
  }, 3),
  folder({
    text: '理解所有权',
    link: 'understanding-ownership',
    items: [
      { text: '什么是所有权？', link: 'what-is-ownership' },
      { text: '引用和借用', link: 'references-and-borrowing' },
      { text: '修复错误的所有权', link: 'fixing-ownership-errors' },
      { text: '切片类型', link: 'the-slice-type' },
      { text: '所有权回顾', link: 'ownership-recap' },
    ],
  }, 4),
  folder({
    text: '使用结构体存储相关联的数据',
    link: 'using-structs-to-structure-related-data',
    items: [
      { text: '定义和实例化结构体', link: 'defining-and-instantiating-structs' },
      { text: '一个使用结构体的例子', link: 'an-example-program-using-structs' },
      { text: '方法', link: 'method-syntax' },
    ],
  }, 5),
  folder({
    text: '枚举和模式匹配',
    link: 'enums-and-pattern-matching',
    items: [
      { text: '定义枚举', link: 'defining-an-enum' },
      { text: 'match: 流程控制结构', link: 'the-match-control-flow-construct' },
      { text: '使用`if let`简化流程控制', link: 'concise-control-flow-with-if-let' },
      { text: '所有权之旅 #1', link: 'ownership-inventory-hash-1' },
    ],
  }, 6),
  folder({
    text: '使用包、库和模块来管理不断增长的项目',
    link: 'manage-growing-projects-with-packages-crates-and-modules',
    items: [
      { text: '包和库', link: 'packages-and-crates' },
      { text: '通过模块定义控制作用域和私有权', link: 'defining-modules-to-control-scope-and-privacy' },
      { text: '模块树元素的引用路径', link: 'paths-for-referring-to-an-item-in-the-module-tree' },
      { text: '使用`use`关键字将路径引入作用域', link: 'brining-paths-into-scope-with-the-use-keyword' },
      { text: '将模块分割为多个文件', link: 'separating-modules-into-different-files' },
    ],
  }, 7),
  folder({
    text: '常用集合',
    link: 'common-collections',
    items: [
      { text: '使用Vector创建强大的值列表', link: 'strong-lists-of-values-with-vectors' },
      { text: '使用String创建强大的UTF-8字符串', link: 'strong-utf-8-encoded-text-with-strings' },
      { text: '使用Hash Map创建强大的kv结构', link: 'strong-keys-with-associated-values-in-hash-maps' },
      { text: '所有权之旅 #2', link: 'ownership-inventory-hash-2' },
    ],
  }, 8),
  folder({
    text: '错误处理',
    link: 'error-handling',
    items: [
      { text: '对不可恢复的错误panic!', link: 'unrecoverable-errors-with-panic' },
      { text: '对可恢复的错误使用Result', link: 'recoverable-errors-with-result' },
      { text: 'panic还是不panic', link: 'to-panic-or-not-to-panic' },
    ],
  }, 9),
  folder({
    text: '泛型，特性和生命周期',
    link: 'generic-types-traits-and-lifetimes',
    items: [
      { text: '泛型数据类型', link: 'generic-data-types' },
      { text: '特性：定义共享行为', link: 'traits-defining-shared-behavior' },
      { text: '通过生命周期校验引用', link: 'validating-references-with-lifetimes' },
      { text: '所有权之旅 #3', link: 'ownership-inventory-hash-3' },
    ],
  }, 10),
  folder({
    text: '书写自动维护的测试',
    link: 'writing-automated-tests',
    items: [
      { text: '如何编写测试', link: 'how-to-write-tests' },
      { text: '控制测试的运行', link: 'controlling-how-tests-are-run' },
      { text: '组织测试结构', link: 'test-organization' },
    ],
  }, 11),
  folder({
    text: '一个IO项目：构建一个命令行程序',
    link: 'an-io-project-building-a-command-line-program',
    items: [
      { text: '接收命令行参数', link: 'accepting-command-line-arguments' },
      { text: '读取一个文件', link: 'reading-a-file' },
      { text: '提高模块化程序和错误处理', link: 'refactoring-to-improve-modularity-and-error-handling' },
      { text: '通过测试驱动来开发功能', link: 'developing-the-library-s-functionality-with-test-driven-development' },
      { text: '添加环境变量', link: 'working-with-environment-variables' },
      { text: '用标准错误流取代标准输出流', link: 'writing-error-messages-to-standard-error-instead-of-standard-output' },
    ],
  }, 12),
  folder({
    text: '函数式编程：迭代器和闭包',
    link: 'functional-language-features-iterators-and-closures',
    items: [
      { text: '闭包：捕获环境的匿名函数', link: 'closures-anonymous-functions-that-capture-their-environment' },
      { text: '使用迭代器处理一系列元素', link: 'processing-a-series-of-items-with-iterators' },
      { text: '优化I/O工程', link: 'improving-our-io-project' },
      { text: '性能比较：循环 vs 迭代器', link: 'comparing-performance-loops-vs-iterators' },
    ],
  }, 13),
  folder({
    text: '更多关于Cargo和Crates.io的内容',
    link: 'more-about-cargo-and-crates-io',
    items: [
      { text: '通过配置文件来定制化构建', link: 'customizing-builds-with-release-profiles' },
      { text: '将Crate发布到crates.io', link: 'publishing-a-crate-to-crates-io' },
      { text: 'Cargo工作空间', link: 'cargo-workspaces' },
      { text: '使用cargo install从Crates.io安装二进制文件', link: 'installing-binaries-from-crates-io-with-cargo-install' },
      { text: '使用自定义命令扩展Cargo', link: 'extending-cargo-with-custom-commands' },
    ],
  }, 14),
  folder({
    text: '智能指针',
    link: 'smart-pointers',
    items: [
      { text: '使用Box<T>来引用堆内数据', link: 'using-box-t-to-point-to-data-on-the-heap' },
      { text: '通过 Deref Trait将普通引用变为智能指针', link: 'treating-smart-pointers-like-regular-references-with-the-deref-trait' },
      { text: '通过 Drop Trait来运行清理代码', link: 'running-code-on-cleanup-with-the-drop-trait' },
      { text: 'Rc<T>，引用计数指针', link: 'rc-t-the-reference-counted-smart-pointer' },
      { text: 'RefCell<T>和内部可变性模式', link: 'ref-cell-t-and-the-interior-mutability-pattern' },
      { text: '循环引用有内存泄露的风险', link: 'references-circular-can-leak-memory' },
    ],
  }, 15),
  folder({
    text: '无畏并发',
    link: 'fearless-concurrency',
    items: [
      { text: '使用线程来同时运行代码', link: 'using-threads-to-run-code-simultaneously' },
      { text: '使用信息传递在线程间传递数据', link: 'using-message-passing-to-transfer-data-between-threads' },
      { text: '并发中的状态共享', link: 'shared-state-concurrency' },
      { text: '通过 Sync 和 Send Traits实现可扩展的并发', link: 'extensible-concurrency-with-the-sync-and-send-traits' },
    ],
  }, 16),
  folder({
    text: 'Async和Await',
    link: 'async-and-await',
    items: [
      { text: 'Futures和Async语法', link: 'futures-and-async-syntax' },
      { text: '使用Async处理并发', link: 'concurrency-with-async' },
      { text: '处理任意数量的Futures', link: 'working-with-any-number-of-futures' },
      { text: '流', link: 'streams' },
      { text: '深入Async相关Trait', link: 'digging-into-the-traits-for-async' },
      { text: 'Futures，Tasks和Threads', link: 'futures-tasks-and-threads' },
    ],
  }, 17),
  folder({
    text: 'Rust中的面向对象编程',
    link: 'object-oriented-programming-features-of-rust',
    items: [
      { text: '面向对象语言特性', link: 'characteristics-of-object-oriented-languages' },
      { text: '使用Trait对象来传递不同类型的值', link: 'using-trait-objects-that-allow-for-values-of-different-types' },
      { text: '实现一个面向对象的设计模式', link: 'implementing-an-object-oriented-design-pattern' },
      { text: '所有权之旅 #4', link: 'ownership-inventory-hash-4' },
      { text: '设计的权衡', link: 'design-trade-offs' },
    ],
  }, 18),
  folder({
    text: '模式匹配',
    link: 'patterns-and-matching',
    items: [
      { text: '所有可以使用模式的地方', link: 'all-the-places-patterns-can-be-used' },
      // { text: '可反驳性：模式是否可能匹配失败', link: 'refutability-whether-a-pattern-might-fail-to-match' },
      // { text: '模式语法', link: 'pattern-syntax' },
    ],
  }, 19),
  // folder({
  //   text: '高级特性',
  //   link: 'advanced-features',
  //   items: [
  //     { text: '不安全的Rust', link: 'unsafe-rust' },
  //     { text: 'Traits增强', link: 'advanced-traits' },
  //     { text: '类型增强', link: 'advanced-types' },
  //     { text: '闭包和函数增强', link: 'advanced-functions-and-closures' },
  //     { text: '宏', link: 'macros' },
  //   ],
  // }, 20),
  // folder({
  //   text: '最后的项目：构建一个多线程Web服务器',
  //   link: 'final-project-building-a-multithreaded-web-server',
  //   items: [
  //     { text: '构建一个单线程Web服务器', link: 'building-a-single-threaded-web-server' },
  //     { text: '将单线程服务器转换为多线程服务器', link: 'turning-our-single-threaded-server-into-a-multithreaded-server' },
  //     { text: '优雅的终止和清理', link: 'graceful-shutdown-and-cleanup' },
  //   ],
  // }, 21),
  // folder({
  //   text: '实验结束',
  //   link: 'end-of-experiment',
  // }, 22),
  // folder({
  //   text: '附录',
  //   link: 'appendix',
  //   items: [
  //     { text: '关键字', link: 'keywords' },
  //     { text: '运算符和符号', link: 'operators-and-symbols' },
  //     { text: '可派生的Traits', link: 'derivable-traits' },
  //     { text: '实用工具', link: 'useful-development-tools' },
  //     { text: '版本', link: 'editions' },
  //     { text: '翻译', link: 'translations-of-the-book' },
  //     { text: 'Rust的诞生和“Nightly Rust”', link: 'how-rust-is-made-and-nightly-rust' },
  //   ],
  // }, 23),
]
