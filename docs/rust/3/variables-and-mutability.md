<script setup>
import {
  QuizProvider,
  Quiz,
  RadioHolder,
  Radio,
  IsCompile,
  IsCompileText,
  Input
} from "../../components/quiz"

</script>

# 变量和可变性

正如前文提到的一样，变量默认是不可变的。这是Rust的众多推手之一，旨在你利用Rust的安全性和可并发性来书写代码。然而，你当然仍可以让你的变量可变。让我们来探索为什么Rust鼓励你偏向不可变性，以及为什么你偶尔会选择放弃它。

当一个变量不可变时，一旦一个值绑定了，那么就不能再改变了。为了举例说明，你可以使用`cargo new variables`生成一个新的项目，名字叫做`variables`。

然后，在你的项目下，打开*src/main.rs*并使用如下代码替换：

```rust
fn main() {
    let x = 5;
    println!("The value of x is {x}");
    x = 6;
    println!("The value of x is {x}");
}
```

保存代码并使用`cargo run`运行。你会看到如下报错：

```
$ cargo run
    Compiling variables v0.1.0 (file:///projects/variables)
error[E0384]: cannot assign twice to immutable variable `x`
--> src/main.rs:4:5
 |
2|    let x = 5;
 |        -
 |        |
 |        first assignment to `x`
 |        help: consider making this binding mutable: `mut x`
3|    println!("The value of x is {x}");
4|    x = 6;
 |    ^^^^^ cannot assign twice to immutable variable

For more information about this error, try `rustc --explain E0384`.
error could not compile `variables` due to previous error
```

这个例子展示了编译器如何帮助你查找代码中的问题，编译错误是十分烦人的，但它们只是为了指出你程序中的不安全行为，并不是为了嘲笑你不是一个好的开发者！经验丰富的Rust开发者也常常会经历编译错误。

由于你尝试给一个不可变变量`x`重复赋值，你会收到错误信息``cannot assign twice to immutable variable `x` ``。

这种情况下抛出错误是十分重要的，因为修改一个命名为不可变的变量会导致程序错误。如果程序的一部分运行在此值不可变的基础上，然而其他部分程序修改了它，那么第一部分程序的原意就可能会被改变。这类型的漏洞有时候很难跟踪，尤其是如果第二部分代码对值的修改是不固定的。Rust编译器保证了当你声明了值不会被修改，它就真的不会被修改，因此你不必自行追踪。代码的可读性也会提高。

但可比性也是十分有用的，同时也能让代码的开发更加简便。尽管变量默认是不可变的，你仍然可以通过在变量名前添加`mut`来使其可变。添加`mut`也给代码未来的读者传达了信息：变量的值可能会被代码的其他部分修改。

比如，我们可以把*src/main.rs*做如下修改：

```rust
fn main() {
    let mut x = 5;
    println!("The value of x is: {x}");
    x = 6;
    println!("The value of x is: {x}");
}
```

当我们运行时，输出如下：

```
$ cargo run
    Compiling variables v0.1.0 (file:///projects/variables)
      Finished dev [unoptimized + debuginfo] targets(s) in 0.30s
        Running `target/debug/variables`
The value of x is: 5
The value of x is: 6
```

当使用了`mut`后，编译器允许将`x`的绑定值从`5`修改到`6`。使用可变还是不可变的最终选择权在于你具体开发的程序。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：不可变表示“不能变化”或者不能改变。

</template>
<template #quiz>

以下哪一项对“变量x是不可变的”的描述最正确？

<RadioHolder>
<Radio label="x在赋值后不能被修改" answer />
<Radio label="在定义后，x最多只能被修改一次" />
<Radio label="x储存在内存中一片不可被修改的区域" />
<Radio label="你不能创建x的引用" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：比如，你可以使用如下代码创建一个可变变量：`let mut x = 1`。

</template>
<template #quiz>

在`let`后要使用什么关键字来标识一个变量是可变的？

<Input answer="mut" />

</template>
</Quiz>

<Quiz>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let x = 1;
    println!("{x}");
    x += 1;
    println!("{x}");
}
```

<IsCompile
  :answer="{ compiled: false }"
/>

</template>
</Quiz>
</QuizProvider>
:::

## 常量

就像不可变变量，常量也是绑定后不允许修改，但它和变量仍有几点不同。

首先，常量不允许使用`mut`标志。常量不仅仅是默认不可变————它们永远都是不可变的。你可以使用`const`而不是`let`来定义常量，且其类型必须注明。我们会在下一节讨论数据类型，所以无需担心那些细节。只要知道你必须注明类型。

常量可以在任何域中被声明，包括全局，所以对于某些需要被多个代码模块共享的值来说很实用。

最后一个不同点事常量只能赋予确定的表达式，不能使用运行时才能确定的计算值。

下面是一个常量声明的例子：

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

常量的名字是`THREE_HOURS_IN_SECONDS`，它的值是60（一分钟的秒数）乘60（一小时的分钟数）乘3（需要计算的小时数）。Rust中常量习惯使用全大写字母和下划线命名。编译器能够在编译时对一系列的操作进行计算，因此我们可以使用最易于理解和检查的方式给常量赋值，而不是直接赋值为10,800。

只要在其声明的域里，常量在整个程序的运行期间都是有效的。这些特性使常量很适合作为一些程序多个部分都需要了解的值，比如游戏玩家可获取的最大积分，或者光速。

硬编码的变量使用常量来声明对未来的维护者也是十分友好的。如果未来常量的值需要修改，也只需要修改一个地方。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #quiz>

下面对于`let`和`const`的区别的描述哪一个最正确？

<RadioHolder>
<Radio label="如果一个常量没有使用大写蛇形命名法，编译器会报错" />
<Radio label="它们只是声明变量的不同方式，语义相同" />
<Radio label="const可以在全局声明，let只能在函数中声明" />
<Radio label="const只能赋值为字面量，不能用表达式赋值" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`const`可以在函数外、使用规定的计算生命。

</template>
<template #quiz>

<IsCompileText />

```rust
const TWO: u32 = 1 + 1;
fn main() {
    println!("{TWO}");
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: '2'
  }"
/>

</template>
</Quiz>
</QuizProvider>
:::

## 遮挡

就像在第二章中看到的一样，你可以使用重复的名字声明变量。Rust程序员会说第一个变量被第二个变量*遮挡*了，也就是当你用这个名字使用变量时，说第二个变量才是此时编译器看到的变量。实际上，第二个变量确实会遮挡第一个变量，直到它被其他值遮挡或者它所在的域结束。我们可以使用同一个名字和`let`关键字来遮挡变量：

```rust
fn main() {
    let x = 5;

    let x = x + 1;

    {
        let x = x * 2;
        println!("The value of x in the inner scope is: {x}");
    }

    println!("The value of x is: {x}");
}
```

这个程序首先给`x`绑定了值`5`。然后使用`let x =`重复创建了变量，使用原先的变量加上`1`，所以`x`为`6`。接着，在一个内部的域里，第三个`let`声明也遮挡了`x`，使用之前的`x`乘`2`创建了新的变量得到`12`。当这个内部的域结束时，内部的遮挡也结束了，`x`的值回到了`6`。当我们运行这个程序时，输入如下：

```
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/variables`
The value of x in the inner scope is: 12
The value of x is: 6
```

遮挡和给变量声明加上`mut`不同的是，后者在遗漏的情况下会抛出一个编译时的错误。而使用`let`和遮挡，我们可以对一个值进行一系列的变形，且在这些变形完成后，值仍保持不可变的特性。

另一个不同点在于，当我们使用遮挡时，我们高效地创建了一个新变量，我们可以修改值的类型，而保持名字不变。比如，如果我们的程序是查找输入字符串的空格，我们可能需要将那个值存储为数字：

```rust
let spaces = "   ";
let spaces = spaces.len();
```

第一个`spaces`是字符串类型而第二个`spaces`是数字类型。遮挡让我们无需思考新变量的名字（比如`spaces_str`或者`spaces_num`）。取而代之的是重复利用`spaces`这个名字。然而，如果我们使用`mut`来完成，编译器会报错：

```rust
let mut spaces = "   ";
spaces = spaces.len();
```

抛出的错误是我们不能修改变量类型：

```
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
error[E0308]: mismatched types
 --> src/main.rs:3:14
  |
2 |     let mut spaces = "   ";
  |                      ----- expected due to this value
3 |     spaces = spaces.len();
  |              ^^^^^^^^^^^^ expected `&str`, found `usize`

For more information about this error, try `rustc --explain E0308`.
error: could not compile `variables` due to previous error
```

既然我们了解了变量是如何工作的，让我们看看它们的数据类型吧。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`x += 2`只影响到了内部域的遮挡了外部变量的`x`，没有影响到第二行的`x`。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut x: u32 = 1;
    {
        let mut x = x;
        x += 2;
    }
    println!("{x}");
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: '1'
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：变量不能被赋予和初始类型不同的值。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut x: u32 = 1;
    x = "Hello world";
    println!("{x}");
}
```

<IsCompile
  :answer="{
    compiled: false,
  }"
/>

</template>
</Quiz>
</QuizProvider>
:::
