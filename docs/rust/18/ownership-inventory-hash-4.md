<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 所有权之旅 #4

所有权之旅是一个系列的测试，检查你对所有权在实际情景中的理解。这些情景都是源自StackOverflow上有关Rust的问题。你可以用这些问题测试自己目前对所有权的理解。

::: details 小测（6）
<QuizProvider>
<Quiz>
<template #description>

解析：字符串引用`s`存在隐式的生命周期`'a`。而传给`iter.map(..)`的闭包捕获了这个字符串引用，但`impl Iterator<Item = String>`并没有提及`'a`。因此迭代器捕获了一个不在其范围内的生命周期。

</template>
<template #quiz>

```rust
/// 为输入迭代器的每一个元素添加字符串 `s`
fn concat_all(
    iter: impl Iterator<Item = String>,
    s: &str
) -> impl Iterator<Item = String> {
    iter.map(move |s2| s2 + s)
}
```

如果你试图编译这段代码，你会收到以下哪一个错误？

<Radio>
<Option answer>

函数的迭代器捕获的生命周期不在`impl Iterator<Item = String>`的范围里

</Option>
<Option>

`s2 + s`是无效的，因为`s`和`s2`的生命周期不同

</Option>
<Option>

闭包`|s| s2 + s`无法移动一个分享引用

</Option>
<Option>

`iter.map(..)`没有实现trait`Iterator<Item = String>`

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：如果返回的迭代器和`s`的生命周期没有关联，那么内存安全会在以下情况下被违反：

1. `s`存活的时长不够（即，它不是`&'static str`这样的字符串字面量）。
2. `concat_all`的返回值在`s`被销毁后被使用了。

`s2 + s`会解引用`s`，读取已销毁的内存。

</template>
<template #quiz>

```rust
/// 为输入迭代器的每一个元素添加字符串 `s`
fn concat_all(
    iter: impl Iterator<Item = String>,
    s: &str
) -> impl Iterator<Item = String> {
    iter.map(move |s2| s2 + s)
}
```

如果你试图编译这段代码，你会看到如下错误

```
error[E0700]: hidden type for `impl Iterator<Item = String>` captures lifetime that does not appear in bounds
 --> test.rs:7:5
  |
5 |     s: &str
  |        ---- hidden type `Map<impl Iterator<Item = String>, [closure@test.rs:7:14: 7:23]>` captures the anonymous lifetime defined here
6 | ) -> impl Iterator<Item = String> {
7 |     iter.map(move |s2| s2 + s)
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<Checkbox>
<Option label="都不满足" />
<Option answer>

```rust
let v = vec![String::from("Rust")];
let it = {
    let s = String::from("Yes");
    concat_all(v.into_iter(), &s)
};
it.collect::<Vec<_>>();
```

</Option>
<Option>

```rust
let v = vec![String::from("Rust")];
let s = String::from("Yes");
concat_all(v.into_iter(), &s);
println!("{}", s);
```

</Option>
<Option>

```rust
let v = vec![String::from("Rust")];
concat_all(v.into_iter(), "Yes")
    .collect::<Vec<_>>();
```

</Option>
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：要解决这个问题，我们需要表达`iter`、`s`和函数返回类型之间的关系。最好的方法就是添加生命周期参数`<'a>`，且要求`iter`、`s`和函数返回值都至少存活`'a`。

</template>
<template #quiz>

```rust
/// 为输入迭代器的每一个元素添加字符串 `s`
fn concat_all(
    iter: impl Iterator<Item = String>,
    s: &str
) -> impl Iterator<Item = String> {
    iter.map(move |s2| s2 + s)
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<Radio>
<!-- TODO: highlight word in some line -->
<Option>

```rust /s: String/ /&s/
fn concat_all(
    iter: impl Iterator<Item = String>,
    s: String
) -> impl Iterator<Item = String> {
    iter.map(move |s2| s2 + &s)
}
```

</Option>
<Option>

```rust /'static/
fn concat_all(
    iter: impl Iterator<Item = String>,
    s: &'static str
) -> impl Iterator<Item = String> {
    iter.map(move |s2| s2 + s)
}
```

</Option>
<Option answer>

```rust /'a/
fn concat_all<'a> {
    iter: impl Iterator<Item = String> + 'a,
    s: &'a str
} -> impl Iterator<Item = String> + 'a {
    iter.map(move |s2| s2 + s)
}
```

</Option>
<Option>

```rust /'a/ /'b/
fn concat_all<'a, 'b>(
    iter: impl Iterator<Item = String> + 'a,
    s: &'b str
) -> impl Iterator<Item = String> + 'a + 'b {
    iter.map(move |s2| s2 + s)
}
```

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：在将`Box<T>`转为`Box<dyn Display>`时（也就是`v.push(..)`隐式发生的情况），Rust要求trait对象`dyn Display`的存活必须久于集合。然而，`T`的生命周期是不明确的，所以它有可能存活的不够久。

</template>
<template #quiz>

```rust
/// 将一个可显示的对象插入到一个实现了Display trait的对象集合中
use std::fmt::Display;
fn add_displayable<T: Display>(
    v: &mut Vec<Box<dyn Display>>,
    t: T
) {
    v.push(Box::new(t));
}
```

如果你试图编译这段代码，你会收到以下哪一个错误？

<Radio>
<Option>

类型`T`的生命周期短于引用`&mut Vec<..>`

</Option>
<Option>

类型`T`的大小是不确定的，无法转化为一个trait对象

</Option>
<Option answer>

类型`T`的存活时长不够，无法转为一个trait对象

</Option>
<Option>

类型`T`无法被`Box`包裹，因为它可能包含引用

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这个程序是内存安全的。要创造一个违反内存安全的场景，`T`需要包含存活时长短于集合的引用。比如，`&n`的`n`会在作用域结束时被销毁，而之后`v[0]`的访问会访问被销毁的内存。

</template>
<template #quiz>

```rust
/// 将一个可显示的对象插入到一个实现了Display trait的对象集合中
use std::fmt::Display;
fn add_displayable<T: Display>(
    v: &mut Vec<Box<dyn Display>>,
    t: T
) {
    v.push(Box::new(t));
}
```

如果你试图编译这段代码，你会看到如下错误

```
error[E0310]: the parameter type `T` may not live long enough
 --> test.rs:6:12
  |
6 |     v.push(Box::new(t));
  |            ^^^^^^^^^^^
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<Checkbox>
<Option label="都不满足" />
<Option>

```rust
let mut v: Vec<Box<dyn Display>> = Vec::new();
add_displayable(&mut v, 5);
```

</Option>
<Option>

```rust
let mut v: Vec<Box<dyn Display>> = Vec::new();
{
    let s = String::from("Hello world");
    add_displayable(&mut v, s);
}
println!("{}", v[0]);
```

</Option>
<Option>

```rust
let mut v: Vec<Box<dyn Display>> = Vec::new();
{
    let n = 0;
    add_displayable(&mut v, &n);
}
println!("{}", v[0]);
```

</Option>
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：最理想的修复方式就是指明`T`的生命周期和`dyn Display`trait对象生命周期的关系。在此处，也就是添加生命周期参数`'a`，表面`T`和trait对象的生命周期至少为`'a`。

使用`'static`也能达到同样的目的，但是不太好：它表达的效果很差，禁止了trait对象持有引用。而将`'a`分配给`&'a mut Vec<..>`也是不正确的，这无法修复编译错误。

</template>
<template #quiz>

```rust
/// 将一个可显示的对象插入到一个实现了Display trait的对象集合中
use std::fmt::Display;
fn add_displayable<T: Display>(
    v: &mut Vec<Box<dyn Display>>,
    t: T
) {
    v.push(Box::new(t));
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<Radio>
<Option>

```rust /+ 'static/
fn add_displayable<T: Display + 'static>(
    v: &mut Vec<Box<dyn Display>>,
    t: T
) {
    v.push(Box::new(t));
}
```

</Option>
<Option>

```rust /+ Clone/ /t.clone()/
fn add_displayable<T: Display + Clone>(
    v: &mut Vec<Box<dyn Display>>,
    t: T
) {
    v.push(Box::new(t.clone()));
}
```

</Option>
<Option>

```rust /'a/ /+ /
fn add_displayable<'a, T: Display + 'a>(
    v: &mut Vec<Box<dyn Display + 'a>>,
    t: T
) {
    v.push(Box::new(t));
}
```

</Option>
<Option>

```rust /'a/
fn add_displayable<'a, T: Display + 'a>(
    v: &'a mut Vec<Box<dyn Display>>,
    t: T
) {
    v.push(Box::new(t));
}
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
