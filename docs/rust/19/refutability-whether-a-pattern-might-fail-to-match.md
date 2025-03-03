<script setup>
import {
  QuizProvider,
  Quiz,
  Checkbox,
  Radio,
  Option
} from "../../components/quiz"
</script>

# 可反驳性：模式是否可能匹配失败

模式有两种形式：可反驳和不可反驳。可以匹配任何可能的值的模式是*不可反驳的（irrefutable）*。比如`let x = 5;`里的`x`，因为`x`可以匹配任何内容，这个匹配不可能匹配失败。而在某种情况下可能失败的模式是*可反驳的（refutable）*。比如下面的例子：

- 在`if let Some(x) = a_value`表达式里，`Some(x)`是可反驳的。如果`a_value`的值是`None`而不是`Some`，那么`Some(x)`就无法匹配。
- 在`if let &[x, ..] = a_slice`表达式里，`&[x, ..]`是可反驳的。如果`a_slice`的元素数量为0，那么`&[x, ..]`就无法匹配。

函数参数，`let`声明和`for`循环都只能接收不可反驳的模式，因为这些程序在不匹配的场景下毫无意义。而`if let`和`while let`表达式可以接收可反驳的模式和不可反驳的模式，但编译器会对不可反驳的模式给出警告，因为这些表达式本身的意义就是处理潜在的错误：条件的功能就是在成功和失败的情况下表现出不一样的行为。

通常来说，你无需担心可反驳模式和不可反驳模式的区别；然而，你需要熟悉可反驳性的概念，这样才能看懂一些错误信息。在发生错误时，你需要调整模式或结构，具体的方式取决于具体代码。

我们来看一个例子，这个例子中Rust需要一个不可反驳的模式，而我们却尝试使用了一个可反驳的模式。下面的代码展示了一个`let`声明配合了一个`Some(x)`的模式，一个可反驳的模式。你可能已经想到了，这样的代码无法通过编译。

```rust
    let Some(x) = some_option_value;
```

如果`some_option_value`的值为`None`，那么它就无法匹配`Some(x)`，这也是可反驳模式的定义。然而，`let`声明只能接收不可反驳的模式，因为对于`None`值的情况来说，它什么都做不了。在编译时，Rust会解释这一点，如果我们尝试混淆可反驳模式和不可反驳模式：

```
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
error[E0005]: refutable pattern in local binding
 --> src/main.rs:3:9
  |
3 |     let Some(x) = some_option_value;
  |         ^^^^^^^ pattern `None` not covered
  |
  = note: `let` bindings require an "irrefutable pattern", like a `struct` or an `enum` with only one variant
  = note: for more information, visit https://doc.rust-lang.org/book/ch18-02-refutability.html
  = note: the matched value is of type `Option<i32>`
help: you might want to use `let else` to handle the variant that isn't matched
  |
3 |     let Some(x) = some_option_value else { todo!() };
  |                                     ++++++++++++++++

For more information about this error, try `rustc --explain E0005`.
error: could not compile `patterns` (bin "patterns") due to 1 previous error
```

由于我们没有覆盖（也没有办法覆盖）模式`Some(x)`所对应的所有合法值，Rust抛出了一个编译错误。

如果我们在应该使用不可反驳模式的地方使用了可反驳模式，我们可以通过修改代码来修复：使用`if let`替换`let`。这样，如果模式没有匹配，那么程序就会跳过大括号里的代码，让代码可以合法地继续。下面是修复后的代码：

```rust
    if let Some(x) = some_option_value {
        println!("{x}");
    }
```

这样就可以了！这段代码可以完美的运行。然而，如果我们给了`if let`一个不可反驳的模式（也就是永远会匹配的模式），比如`x`，类似下面的代码，那么编译器会给出警告：

```rust
    if let x = 5 {
        println!("{x}");
    }
```

Rust会抱怨这样的代码不符合逻辑，因为`if let`使用了不可反驳的模式：

```
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
warning: irrefutable `if let` pattern
 --> src/main.rs:2:8
  |
2 |     if let x = 5 {
  |        ^^^^^^^^^
  |
  = note: this pattern will always match, so the `if let` is useless
  = help: consider replacing the `if let` with a `let`
  = note: `#[warn(irrefutable_let_patterns)]` on by default

warning: `patterns` (bin "patterns") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.39s
     Running `target/debug/patterns`
5
```

出于这个原因，`match`的分支必须使用可反驳的模式，除了其最后一个分支，它可以使用不可反驳的模式来匹配所有剩余的情况。Rust只允许我们在这一个`match`分支里使用不可反驳的模式，但是这样的语法其实并不是那么的有用，大部分情况下可以用`let`来代替。

现在你了解了在哪里使用模式和可反驳模式、不可反驳模式之间的区别了，我们来看看所有我们可以使用的模式语法。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：如果期望类型的某些值无法被模式匹配，那么模式就是可反驳的。

</template>
<template #quiz>

假设现有针对类型`T`进行的模式匹配。以下哪一点对于可反驳模式和不可反驳模式的区别描述地最正确？

<Radio>
<Option label="可反驳模式不会匹配类型T的一部分值，而不可反驳模式匹配类型T所有可能的值" answer />
<Option label="可反驳模式可以匹配一个不同类型s的值，而不可反驳模式只能匹配类型T的值" />
<Option label="可反驳模式不会匹配类型T的任何值，而不可反驳模式匹配类型T的一部分值" />
<Option label="可反驳模式匹配T为枚举的情况，而不可反驳模式匹配T不是枚举的情况" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：一个切片的长度是不固定的，所以任何断言`x`至少包含一个元素的模式都是可反驳的。

</template>
<template #quiz>

对于如下程序：

```rust
let x: &[(i32, i32)] = &[(0, 1)];
```

以下哪一个是针对`x`的可反驳模式？

<Checkbox>
<Option label="_" />
<Option label="&[(x, y), ..]" answer />
<Option label="&[..]" />
<Option label="&[(x, y)]" answer />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
