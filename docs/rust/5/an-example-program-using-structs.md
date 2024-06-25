<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  RadioHolder,
  Radio
} from "../../components/quiz"

</script>

# 一个使用结构体的例子

为了理解结构体的使用时机，我们会尝试开发一个计算长方形面积的程序。我们会先使用单独的变量，然后逐步重构成结构体。

新建一个项目叫做*rectangles*，定义长方形的宽、高（单位：像素），并进行面积计算：

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;

    println!(
        "The area of the rectangle is {} square pixels.",
        area(width1, height1)
    );
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

使用`cargo run`运行程序，输出如下：

```
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/rectangles`
The area of the rectangle is 1500 square pixels.
```

调用`area`成功计算了长方形的面积，但我们可以提高这段代码的清晰度和可读性。

首先一个比较明显的问题就是`area`函数的签名：

```rust
fn area(width: u32, height: u32) -> u32 {
```

`area`函数应该计算一个长方形的面积，然后这个函数接收了两个参数。程序中并没有表面它们是相关联的。如果将他们打包组合，那么代码的可读性会更高。这部分原因我们在介绍元组类型时已经解释过。

## 使用元组重构

```rust
fn main() {
    let rect1 = (30, 50);

    println!(
        "The area of the rectangle is {} square is pixels",
        area(rect1)
    );
}

fn area(dimension: (u32, u32)) -> u32 {
    dimension.0 * dimension.1
}
```

一方面来说，这个程序更好了。元组让我们的程序增加了解构性，只需要传递一个参数。但另一方面来说，这个版本也不够清晰：元组的元素没有名字，我们只能使用下标来访问，它们的计算看起来不太明显。

将宽和高混合成一个类型不会影响面积计算，可是如果我们需要在屏幕上绘制长方形，那么就很有影响了！我们需要时刻记住`width`在元组下标`0`，`height`在元组下标`1`。这会增加我们的心智负担，且对其他人来说可读性也不高。因为我们没有在代码中表达数据的含义，这样的代码非常易错。

## 使用结构体重构：增加含义

我们可以使用结构体来为数据增加含义。将上面程序中的元组使用结构体稍加转换并增加名字，代码如下：

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        area(&rect1)
    )
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

这里我们定义了一个叫做`Rectangle`的结构体。在结构体内部，我们定义了字段`width`和`height`，它们的类型都是`u32`。然后，在`main`函数中，我们创建了一个`Rectangle`的实例，它的`width`值为`30`，`height`为`50`。

我们的`area`函数现在只有一个名字叫做`rectangle`的参数。它的类型是对`Rectangle`实例的不可变引用。就像第四章中提到的一样，我们只希望借用结构体，而不希望挪用其所有权。这样，`main`保留了它的所有权，可以继续使用`rect1`，这就是函数的签名和调用使用了`&`的原因。

`area`函数访问了`Rectangle`实例的`width`和`height`字段（对借用结构体的字段访问不会移动字段值，这也是为什么结构体总是被借用）。`area`函数的签名准确描述地函数的行为：使用`width`和`height`字段计算`Rectangle`的面积。这样的代码表达了宽高之间的关系，又给了它们名字而不是下标。代码清晰度大大提升了。

## 使用派生特性添加实用功能

在我们调试程序时，如果我们能直接打印`Rectangle`实例并直接看到它的所有字段值，那绝对是十分有用的。下面的代码使用了我们一直在用的`println!``宏`，但它并不生效：

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {}", rect1);
}
```

当我们运行这段代码时候，会看到如下报错：

```
error[E0277]: `Rectangle` doesn't implement `std::fmt::Display`
```

`println!`宏可以进行各种各样的格式化，默认来说，大括号告诉`println!`使用`Display`特性提供的格式来进行格式化，并输出供用户查看。我们见过的基础类型都已经默认实现了`Display`，因为对`1`来说，只有一种展示形式，其他的基础类型同理。可是对于结构体，`println!`应该将结果格式化成什么形式呢？结果需要用逗号隔开吗？要打印大括号吗？所有的字段都要打印吗？由于这些存在争议的问题，Rust不会视图去猜测用户的想法，结构体不提供对`Display`的默认实现，使用`println!`和`{}`占位符也是无效的。

如果我们继续阅读错误信息，我们会发现有用的内容：

```
    = help: the trait `std::fmt::Display` is not implement for `Rectangle`
    = note: in format strings you may be able to use `{:?}` ( or {:#?} for pretty-print) instead
```

让我们试试看！`println!`宏的调用回改为`println!("rect1 is {:?}", rec1);`。在大括号内加入`:?`旨在告诉`println!`我们希望使用`Debug`来格式化输出。`Debug`特性支持使用一种方式来打印结构体，但仅供开发者调试代码使用。

编译这段代码。见鬼！怎么还有报错：

```
error[E0277]: `Rectangle` doesn't implement `Debug`
```

但是，编辑器也给出了解决建议：

```
    = help: the trait `Debug` is not implemented for `Rectangle`
    = note: add `#[derive(Debug)]` to `Rectangle` or manually `impl Debug for Rectangle`
```

Rust*不会*内置打印调试信息的功能，但我们可以通过明确指定的方式来让那些功能适用于我们的结构体。我们需要添加`#[derive(Debug)]`到结构体的定义上：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {:?}", rect1);
}
```

现在当我们运行程序，就不会有任何错误了，程序输出如下：

```
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle { width: 30, height: 50 }
```

太棒了！这样的输出可能不是最完美的，但它展示了实例中所有的值，它绝对可以对调试的过程产生帮助。当我们的结构体更大时，可以在`println!`中使用`{:#?}`而不是`{:?}`来让输出结果的可读性提高。如下例：

```
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished dev [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle {
    width: 30,
    height: 50,
}
```

另一种使用`Debug`格式来打印值的方式是使用`dbg!``宏`，它会获取表达式的所有权（相反，`println!`只会获取引用），打印`dbg!`调用的文件和行号，以及表达式的输出结果，返回值的所有权。

> [!NOTE]
> 调用`dbg!`宏会使用标准的错误输出流（`stderr`），而`println!`则使用标准的输出流（`stdout`）。我们会在第十二章讨论`stderr`和`stdout`的更多情况。

在下面的例子里，我们希望了解到`width`字段被赋予的值，以及整个`rect1`结构体的情况：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let scale = 2;
    let rect1 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };

    dbg!(&rect1);
}
```

我们使用了`dbg!`来包裹表达式`30 * scale`，由于`dbg!`会返回表达式值的所有权，所以`width`字段会被赋予相同的值，不管有没有被`dbg!`包裹。我们不希望`dbg!`获取`rect1`的所有权，所以我们使用了`rect1`的引用。下面是这个例子的输出：

```
$ cargo run
    Compiling rectangle v0.1.0 (file:///projects/rectangle)
      Finished dev [unoptimized + debuginfo] target(s) in 0.61s
        Running `target/debug/rectangles`
[src/main.rs:10] 30 * scale = 60
[src/main.rs:14] &rect1 = Rectangle {
    width: 60,
    height: 50,
}
```

我们可以看到第一部分输出来自*src/main.rs*的第十行对`30 * scale`表达式的调试，结果为`60`（整数已经默认实现了`Debug`特性，会输出它自身）。*src/main.rs*第14行的`dbg!`调用输出了`&rect1`的值，也就是`Rectangle`结构体。这次输出使用了`Rectangle`类型的`Debug`格式。`dbg!`宏在你调试代码的过程中是十分有帮助的！

除了`Debug`特性外，Rust提供了一系列的特性，我们可以通过`derive`属性来为我们的自定义类型添加各种各样有用的行为。这些特性和它们的行为被记录在了附录C中。我们会在第十章中讨论如何实现这些特性的自定义行为，以及如何创建属于你自己的特性。除了`derive`外还有很多属性。

我们的`area`函数已经十分明确了：它只会计算长方形的面积。它会把这个行为紧紧地和`Rectangle`结构体绑定，不会生效于其他类型。让我们继续，将`area`函数重构成`Rectangle`类型的`area`方法：

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`area`函数移动了参数`rectangle`的所有权。调用`area(rect1)`后，无法继续使用`rect1`。

</template>
<template #quiz>
<IsCompileText />

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    let a = area(rect1);
    println!("{} * {} = {}", rect1.width, rect1.height, a);
}

fn area(rectangle: Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #quiz>

下面哪一个选项对`Display`和`Debug`特性的区别描述的最正确？

<RadioHolder>
<Radio label="Display不能被结构体实现，而Debug可以" />
<Radio label="Display供最终用户使用，而Debug供内部用户使用" answer />
<Radio label="没有区别，Display和Debug是同一个特性的不同别名" />
<Radio label="Display是为了将内容输出到终端，而Debug是为了在调试器中看到值" />
</RadioHolder>
</template>
</Quiz>
</QuizProvider>
:::
