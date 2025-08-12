# 附录A：关键字

下面的列表包含了Rust语言中使用或可能使用的关键字和保留字。所以，它们都不能用作标识符（原始标识符除外）。标识符就是函数、变量、参数、结构体字段、模块、crate、常量、宏、静态值、属性、类型、trait和生命周期的名字。

## 当前使用的关键字

下面是当前使用的关键字列表以及它们的功能：

- `as` - 执行原始类型转换，消除指定trait包含元素的歧义，或重命名`use`声明引入的元素
- `async` - 返回一个`Future`而不是阻塞当前线程
- `await` - 暂停操作，知道等待的`Future`结果准备好
- `break` - 立刻退出循环
- `const` - 定义一个常量，或常量原始指针
- `continue` - 进入下一次循环迭代
- `crate` - 在模块路径中，指向根crate
- `dyn` - 动态分配trait object
- `else` - `if`和`if let`流程控制的回退
- `enum` - 定义枚举
- `extern` - 链接一个外部函数或变量
- `false` - 布尔值false的字面量
- `fn` - 定义一个函数或函数指针类型
- `for` - 对一个迭代器进行循环，实现一个trait，或者指定一个更高位的生命周期
- `if` - 根据条件判断表达式决定是否执行代码分支
- `impl` - 实现固有的或来自trait的功能
- `in` - `for`循环语法的一部分
- `let` - 绑定变量
- `loop` - 无条件的循环
- `match` - 对一个值进行模式匹配
- `mode` - 定义一个模块
- `move` - 让闭包拥有其捕获的全部所有权
- `mut` - 表示引用的可变性，原始指针或者模式绑定
- `pub` - 表示结构体字段、`impl`代码块或模块的公共可见性
- `ref` - 绑定引用
- `return` - 从函数返回
- `Self` - 对当前定义或实现类型的类型别名
- `self` - 方法对象或当前模块
- `static` - 存在于整个项目执行周期里的全局变量或生命周期
- `struct` - 定义结构体
- `super` - 当前模块的父模块
- `trait` - 定义trait
- `true` - 布尔值true的字面量
- `type` - 定义类型别名或关联类型
- `union` - 定义联合类型；仅用于定义联合类型的关键字
- `unsafe` - 表示不安全的代码，函数，trait或实现
- `use` - 向作用域引入内容；指定泛型和生命周期的精确边界
- `where` - 表示类型的约束条款
- `while` - 根据表达式的结果有条件地循环

## 为未来功能预留的保留字

下面的关键字目前不涉及任何功能，但为Rust可能存在的功能所保留：

- `abstract`
- `become`
- `box`
- `do`
- `final`
- `gen`
- `macro`
- `override`
- `priv`
- `try`
- `typeof`
- `unsized`
- `virtual`
- `yield`

## 原始标识符

*原始标识符*是一种可以让你使用通常不允许使用的关键字的语法。你可以通过`r#`前缀来使用原始标识符。

比如，`match`是一个关键字。如果你尝试编译下面的函数：

```rust
fn match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}
```

你会看到如下报错：

```
error: expected identifier, found keyword `match`
 --> src/main.rs:4:4
  |
4 | fn match(needle: &str, haystack: &str) -> bool {
  |    ^^^^^ expected identifier, found keyword
```

这个错误说明了你不能使用`match`作为函数标识符。如果想要使用`match`作为函数名，你需要使用原始标识符语法，如下：

```rust
fn r#match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}

fn main() {
    assert!(r#match("foo", "foobar"));
}
```

这段代码可以成功编译。注意函数定义名称的`r#`前缀在定义和调用的地方都需要添加。

Rust标识符允许你使用任何单词来作为标识符，即便那个单词是一个保留字。这样的特性给予了你最大的自由来选择标识符名称，同时也便捷了与其他没有使用那些关键字的语言进行整合的过程。此外，原始标识符允许你使用一个和你当前crate使用的Rust合集不同的库。比如，`try`在2015合集里不是一个关键字，但在2018、2021和2024合集里是一个关键字。如果你依赖了一个使用2015合集开发的库，而其中有一个`try`函数，你就需要使用原始标识符语法，也就是`r#try`，从而实现在更新的版本里调用那些函数的功能。附录E介绍了有关合集的更多功能。