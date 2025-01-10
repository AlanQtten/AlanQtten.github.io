<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 所有权之旅 #1

所有权之旅是一个系列的测试，检查你对所有权在实际情景中的理解。这些情景都是源自StackOverflow上有关Rust的问题。你可以用这些问题测试自己目前对所有权的理解。

::: details 小测（6）
<QuizProvider>
<Quiz>
<template #description>

解析：由于`default`存储在`make_separator`的栈中，它会在`make_separator`调用结束时销毁。这样`&default`会指向废弃内存。Rust因此抛出了无法返回本地变量引用的错误。

</template>
<template #quiz>

程序1：

```rust
// 使用字符串创建一个行分割字符串
// 如果提供的字符串是空的，那么返回默认字符串
fn make_separator(user_str: &str) -> &str {
    if user_str == "" {
        let default = "=".repeat(10);
        &default
    } else {
        user_str
    }
}
```

如果你试图编译这段代码，你会收到以下哪一个错误？

<Radio>
<Option label="函数make_separator不能返回两个不同的引用" />
<Option label="不能返回对本地变量default的引用" answer />
<Option label="函数make_separator不能返回对&str的引用" />
<Option label="user_str的生命周期不够长" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：首先，调用者必须传递一个空串来触发问题。这种情况下会返回一个空指针。然后，调用者需要使用`make_separator`的结果，也就是`println`。

</template>
<template #quiz>

程序1：

```rust
// 使用字符串创建一个行分割字符串
// 如果提供的字符串是空的，那么返回默认字符串
fn make_separator(user_str: &str) -> &str {
    if user_str == "" {
        let default = "=".repeat(10);
        &default
    } else {
        user_str
    }
}
```

如果你试图编译这段代码，你会看到如下错误

```
error[E0515]: cannot return a reference to local variable `default`
 --> test.rs:6:9
  |
6 |        &default
  |        ^^^^^^^^ return a reference to data owned by the current function
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<Checkbox>
<Option answer>

```rust
let s = make_separator("");
```

</Option>
<Option answer>

```rust
println!("{}", make_separator("Hello world!"));
```

</Option>
<Option answer>

```rust
let s = make_separator("");
println!("{s}");
```

</Option>
<Option label="都不满足" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：没有任何办法来返回一个分配在栈的变量的指针。最简单的办法就是修改返回值为`String`，且复制输入的字符串到一个含所有权的新字符串中。然而，要求`user_str`是一个`String`会破坏API的灵活度，调用者可能在一个大字符串的子串（切片）上调用`make_separator`。而且还会要求调用者创建堆内字符串，因此，它们无法使用字符串字面量，比如`make_separator("Rust")`。

这个问题最符合语义的解法是使用一个你还没有见过的结构体：`Cow`。写时复制智能指针能够让这个函数返回字符串或者字符串引用，且不会产生类型错误。

</template>
<template #quiz>

程序1：

```rust
// 使用字符串创建一个行分割字符串
// 如果提供的字符串是空的，那么返回默认字符串
fn make_separator(user_str: &str) -> &str {
    if user_str == "" {
        let default = "=".repeat(10);
        &default
    } else {
        user_str
    }
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<Radio>
<Option answer>

<!-- TODO: highlight word in some line -->
```rust {4} /String/ /user_str.to_string()/
fn make_separator(user_str: &str) -> String {
    if user_str == "" {
        let default = "=".repeat(10);
        default
    } else {
        user_str.to_string()
    }
}
```

</Option>
<Option>

```rust /&user_str/
fn make_separator(user_str: &str) -> &str {
    if user_str == "" {
        let default = "=".repeat(10);
        &default
    } else {
        &user_str
    }
}
```

</Option>
<Option>

```rust
fn make_separator(user_str: String) -> String {
    if user_str == "" {
        let default = "=".repeat(10);
        default
    } else {
        user_str
    }
}
```

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：函数`Option::unwrap`需要传入`self`，它会消耗`arg`的所有权。然而`arg`是一个option的不可变引用，它无法提供所有权。因此Rust编译器会抛出无法通过`unwrap`移动所有权的错误。

</template>
<template #quiz>

程序2：

```rust
// 如果参数有值，获取其中的字符串
// 否则，返回默认值
fn get_or_default(arg: &Option<String>) -> String {
    if arg.is_none() {
        return String::new();
    }
    let s = arg.unwrap();
    s.clone()
}
```

如果你试图编译这段代码，你会收到以下哪一个错误？

<Radio>
<Option label="无法在不解引用arg的情况下调用arg.is_none()" />
<Option label="arg的生命周期不够长" />
<Option label="s.clone()的生命周期不够长，不能被返回" />
<Option label="不能通过arg.unwrap()移动arg的所有权" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这些程序都会触发重复释放，违反内存安全。如果允许`arg.unwrap()`执行，那么`String::from("Rust")`的所有权就会被`s`消费。在`get_or_default`返回后，字符串会被销毁。然而，`opt`仍然认为它有字符串的所有权，所以字符串会被重复释放。

</template>
<template #quiz>

程序2：

```rust
// 如果参数有值，获取其中的字符串
// 否则，返回默认值
fn get_or_default(arg: &Option<String>) -> String {
    if arg.is_none() {
        return String::new();
    }
    let s = arg.unwrap();
    s.clone()
}
```

如果你试图编译这段代码，你会看到如下报错：

```
error[E0507]: cannot move out of `*arg` which is behind a shared reference
 ---> test.rs:7:13
  |
7 |    let s = arg.unwrap();
  |            ^^^^--------
  |            |   |
  |            |   `*arg` moved due to this method call
  |            help: consider calling `.as_ref()` or `.as_mut()` to borrow type's contents
  |            move occurs because `*arg` has type `Option<String>`, which does not implement the `Copy` trait
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<Checkbox>
<Option answer>

```rust
let opt = Some(String::from("Rust"));
get_or_default(&opt);
```

</Option>
<Option answer>

```rust
let opt = Some(String::from("Rust"));
get_or_default(&opt);
println!("{:?}", opt);
```

</Option>
<Option answer>

```rust
let opt = Some(String::from("Rust"));
let s = get_or_default(&opt);
println!("{}", s);
```

</Option>
<Option label="都不满足" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`is_none`和`unwrap`的组合使用并不符合Rust的开发模式，而`match`结合了功能性，它还能自动从`&Option`中弹出`&String`供分支内部使用。因此`match`是最理想的解决方法，它无需修改程序原本的意图或签名，就能通过编译。

将`&Option`改为`Option`的方式是不可取的，因为它需要调用者提供这个option的所有权，这样的API是非常死板的。

</template>
<template #quiz>

程序2：

```rust
// 如果参数有值，获取其中的字符串
// 否则，返回默认值
fn get_or_default(arg: &Option<String>) -> String {
    if arg.is_none() {
        return String::new();
    }
    let s = arg.unwrap();
    s.clone()
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<Radio>
<Option>

```rust /&str/ /s.to_string()/
fn get_or_default(arg: &Option<&str>) -> String {
    if arg.is_none() {
        return String::new();
    }
    let s = arg.unwrap();
    s.to_string()
}
```

</Option>
<Option>

```rust /&mut Option<String>/ /.as_mut()/
fn get_or_default(arg: &mut Option<String>) -> String {
    if arg.is_none() {
        return String::new();
    }
    let s = arg.as_mut().unwrap();
    s.clone()
}
```

</Option>
<Option>

```rust /Option<String>/
fn get_or_default(arg: Option<String>) -> String {
    if arg.is_none() {
        return String::new();
    }
    let s = arg.unwrap();
    s.clone()
}
```

</Option>
<Option answer>

```rust {2-4}
fn get_or_default(arg: &Option<String>) -> String {
    match arg {
        None => String::new(),
        Some(s) => s.clone()
    }
}
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
