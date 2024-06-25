<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompile,
  IsCompileText,
  RadioHolder,
  Radio,
  Input
} from '../components/quiz'
</script>

# 函数

函数在Rust代码中也是十分流行的。你已经见过了Rust中最重要的函数之一：`main`函数，它是许多程序的入口。你也已经见过了`fn`关键字，它可以用来定义新函数。

Rust代码推荐使用蛇行命名来命名函数和变量，即全部使用下划线分割的小写字母。下面是一个函数定义的例子：

```rust
fn main() {
    println!("Hello, world!");

    another_function();
}

fn another_function() {
    println!("Another function.")
}
```

我们使用`fn`关键字、函数名字和一对小括号来定义了函数，而大括号则告诉编译器函数体的开始和结束。

我们可以使用函数名加一对小括号来调用任何已定义的函数。因为`another_function`已定义，它可以在`main`函数中调用。请注意在源码中，`another_function`的定义在`main`函数的后面，这里我们也可以在前面定义。Rust不关心函数定义的位置，只要调用者能够在一个区域中看到即可。

我们可以启动一个名字叫作*functions*的新项目来探索函数的种种。将上面的例子放入其中并运行，输出如下：

```
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.28s
     Running `target/debug/functions`
Hello, world!
Another function.
```

`main`函数中的代码顺序执行，首先输出了“Hello, world!”，然后`another_function`被调用，其中的信息也被打印。

## 参数

我们可以为函数增加参数，参数是特殊的变量，它们是函数签名的一部分。当一个函数拥有参数时，你可以为它们提供具体的值。从技术角度来说，这些具体的值称为*实参*，但日常来说，人们对*参数*和*实参*在函数签名和函数调用中的叫法不会那么严谨。

下面我们为`another_function`增加参数：

```rust
fn main() {
    another_function(5);
}

fn another_function(x: i32) {
    println!("The value of x is: {x}");
}
```

运行程序，输出如下：

```
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 1.21s
     Running `target/debug/functions`
The value of x is: 5
```

`another_function`的声明有一个参数`x`，它的类型是`i32`。当我们给`another_function`传`5`时，`println!`宏会格式输出`x`的字符串形式，也就是`5`。

在函数签名中，你必须为每一个参数声明类型。这是Rust故意设计的：在函数中必含参数类型声明意味着编译器无需在其他任何地方揣测你使用函数时的想法。且函数也能给出更有用的错误提示信息。

当定义多个参数时，使用逗号分隔，如下：

```rust
fn main() {
    print_labeled_measurement(5, 'h');
}

fn print_labeled_measurement(value: i32, unit_label: char) {
    println!("The measurement is: {value}{unit_label}");
}
```

这个例子创建了一个名字叫`print_labeled_measurement`、带有两个参数的函数。第一个参数`value`是`i32`类型，第二个参数`unit_label`是`char`类型。函数的打印包括了两个参数。

运行这段代码，可以得到如下输出：

```
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/functions`
The measurement is: 5h
```

由于调用函数时传入了`5`对应`value`，`h`对应`unit_label`，所以程序的输出包含了它们。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #quiz>

Rust中，声明新函数的关键字是：

<Input answer="fn" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：函数的参数必须标注类型。

</template>
<template #quiz>

<IsCompileText />

```rust
fn f(x) {
    println!("{x}");
}

fn main() {
    f(0);
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>
</QuizProvider>
:::

## 声明和表达式

函数体由一系列的声明和结尾的可选的表达式组成。目前为止，我们看到的函数都不包括结尾的表达式，但已经看过了表达式作为声明的一部分存在。因为Rust是一门基于表达的编程语言，所以二者的差别一定要理解。其他语言没有类似的理解，所以让我们来看看声明和表达式是什么，以及它们在函数体中表现的差异：

- **声明**是一些动作的指导，无返回值。
- **表达式**会通过计算产生值。

让我们看些例子。我们其实已经使用过声明和表达式了。使用`let`关键字创建一个变量并赋值就是一个声明。比如下面的`let y = 6;`就是一个声明。

```rust
fn main() {
    let y = 6;
}
```

函数的定义也是声明；上面的整个例子就是一个声明。

声明没有返回值。因此，你不能把`let`声明赋值给其他变量，比如下面的代码，会报错：

```rust
fn main() {
    let x = (let y = 6);
}
```

运行下面的代码，编译器会抛出如下错误：

```
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error: expected expression, found `let` statement
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^

error: expected expression, found statement (`let`)
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^^^^^^^
  |
  = note: variable declaration using `let` is a statement

error[E0658]: `let` expressions in this position are unstable
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^^^^^^^
  |
  = note: see issue #53667 <https://github.com/rust-lang/rust/issues/53667> for more information

warning: unnecessary parentheses around assigned value
 --> src/main.rs:2:13
  |
2 |     let x = (let y = 6);
  |             ^         ^
  |
  = note: `#[warn(unused_parens)]` on by default
help: remove these parentheses
  |
2 -     let x = (let y = 6);
2 +     let x = let y = 6;
  |

For more information about this error, try `rustc --explain E0658`.
warning: `functions` (bin "functions") generated 1 warning
error: could not compile `functions` due to 3 previous errors; 1 warning emitted
```

`let y = 6`声明没有返回值，因此没有任何东西让`x`来绑定。这点和诸如C、Ruby等语言不一样，它们的声明会返回声明的值。在那些语言里，你可以写`x = y = 6`然后同时赋值`6`给`x`和`y`；这种情况在Rust中不存在。

表达式会进行求值，并构成了Rust世界大部分其他的代码。比如数学运算，`5 + 6`，这就是一个计算结果为`11`的表达式。表达式也可以是声明的一部分，比如前面的程序里，`6`就是一个结果为`6`的表达式，它是声明`let y = 6;`的一部分。函数的调用、宏的调用也是表达式。使用大括号创建的代码块也是表达式，比如：

```rust
fn main() {
    let y = {
        let x = 3;
        x + 1
    };

    println!("The value of y is: {y}");
}
```

表达式：

```rust
{
    let x = 3;
    x + 1
}
```

是一个代码块，这种情况下，值为`4`。这个值会被绑定给`y`，整体作为`let`声明的一部分。注意`x + 1`和其他语句不一样，没有结尾的分号。表达式是不包括结尾的分号的。如果你给结尾加了分号，你就会把表达式变成一个声明，这个代码块也就没有了返回值。在探索函数返回值和表达式的同时要牢记这点。

## 函数的返回值

函数的调用可以返回值。我们无需为返回值命名，但必须使用箭头（`->`）和类型来进行标注。在Rust中，函数体的最后一个表达式就是函数的返回值。你也可以使用`return`关键字来提前让函数返回某个值，但大部分的函数采用隐式地在最后一行返回值的方式。下面是一个例子：

```rust
fn five() -> i32 {
    5
}

fn main() {
    let x = five();

    println!("The value of x is: {x}");
}
```

`five`函数中，没有调用其他函数或宏，甚至都没有使用`let`声明————只有数字`5`。在Rust里这是一个完全合法的函数。请注意函数返回值的类型也标注了`-> i32`。运行这段代码，输出如下：

```
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/functions`
The value of x is: 5
```

`5`是函数`five`的返回值，也是函数的返回值类型是`i32`的原因。让我们来检查更多细节。有两个比较重要的点：首先，`let x = five();`表示我们使用了函数的返回值来初始化了一个变量。因为`five`返回了`5`，所以这一行和下面的代码作用相同：

```rust
let x = 5;
```

第二，`five`函数没有参数且定义了返回值的类型，但函数体只有一个不带分号的`5`，因为它就是一个表达式，它的值就是函数希望返回的值。

让我们再看一个例子：

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {x}");
}

fn plus_one(x: i32) -> i32 {
    x + 1
}
```

运行这段代码会输出`The value of x is: 6`。如果我们给`x + 1`加上了分号，将它从表达式改为了声明：

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {x}");
}

fn plus_one(x: i32) -> i32 {
    x + 1;
}
```

Rust编译器会抛出如下报错：

```
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error[E0308]: mismatched types
 --> src/main.rs:7:24
  |
7 | fn plus_one(x: i32) -> i32 {
  |    --------            ^^^ expected `i32`, found `()`
  |    |
  |    implicitly returns `()` as its body has no tail or `return` expression
8 |     x + 1;
  |          - help: remove this semicolon to return this value

For more information about this error, try `rustc --explain E0308`.
error: could not compile `functions` due to previous error
```

这里面主要的错误信息，`mismatch types`（类型不匹配），揭示了这段代码的问题。函数`plus_one`的定义指明其返回类型为`i32`，但其函数体只有声明，没有返回值，所以其返回值为`()`，单元类型。因此，没有任何内容返回，和函数的定义产生了矛盾，导致了报错。在这段输出里，Rust提供了可能有帮助的信息；它建议去掉分号，修复这个问题。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：一个代码块是一个表达式，它的内部可以包括声明。它也创建了一个语法块，内部可以使用`let`绑定。

</template>
<template #quiz>

在Rust里，一个大括号代码块 { /* ... */ } 是：

1. 表达式
2. 声明
3. 语法块

<RadioHolder>
<Radio label="只有2" />
<Radio label="2和3" />
<Radio label="只有1" />
<Radio label="1和3" answer />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #quiz>

<IsCompileText />

```rust
fn f(x: i32) -> i32 { x + 1 }
fn main() {
  println!("{}", f({
    let y = 1;
    y + 1
  }))
}
```

<IsCompile
  :answer="{ compiled: true, result: '3' }"
/>

</template>
</Quiz>
</QuizProvider>
:::
