<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  IsCompile,
  IsCompileText
} from "../../components/quiz"

</script>

# 流程控制

在特定情况下（`true`/`false`）执行特定代码是大多数编程语言的基本能力。Rust最常见的流程控制是`if`表达式和循环。

## `if`表达式

`if`表达式允许你根据条件来为代码创造分支。你可以提供一个条件和一个代码块，如果条件成立，运行这个代码块，如果不成立，不运行这个代码块。

创建一个名字叫做`branches`的项目来探索`if`表达式，输入下面的代码：

```rust
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    }else {
        println!("condition was false");
    }
}
```

所有的`if`表达式由关键字`if`开始，后面跟随者条件。在上面的代码里，这个条件是检查变量`number`的值是否小于5。我们在条件后的代码块里放置的代码会在条件为`true`时立刻执行。`if`表达式后面的代码块有时会被叫做*arms*，就像第二章参数游戏中，`match`后面的arms一样。

根据具体的需要，我们也可以添加`else`表达式，就像上面的代码，给予程序一个不同指向的代码块，在表达式为`false`时执行。如果没有`else`表达式且条件为`false`，那么程序会跳过`if`块继续执行后续代码。

运行这段代码，可以得到如下输出：

```
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/branches`
condition was true
```

如果我们改变`number`的值使表达式不成立：

```rust
    let number = 7;
```

运行程序，输出如下：

```
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/branches`
condition was false
```

值得注意的是条件的类型*必须*是`bool`。如果不是，那么程序会抛出错误：

```rust
fn main() {
    let number = 3;

    if number {
        println!("number was three");
    }
}
```

Rust编译器会抛出异常：

```
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
error[E0308]: mismatched types
 --> src/main.rs:4:8
  |
4 |     if number {
  |        ^^^^^^ expected `bool`, found integer

For more information about this error, try `rustc --explain E0308`.
error: could not compile `branches` due to previous error
```

错误表示Rust期望收到一个`bool`类型，却获取到了一个数字。和Ruby或Javascript那种语言不一样的是，Rust不会自动把非布尔值的类型转为布尔值。你必须为`if`表达式提供明确的布尔值。如果你希望代码在数字不为`0`时运行，可以做如下改变：

```rust
fn main() {
    let number = 3;

    if number != 0 {
        println!("number was something other than zero");
    }
}
```

运行这段代码会输出`number was something other than zero`。

## 使用`else if`控制多条件

你可以使用`else if`来控制多条件表达式，比如：

```rust
fn main() {
    let number = 0;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    }else if number % 3 == 0 {
        println!("number is divisible by 3");
    }else if number % 2 == 0 {
        println!("number is divisible by 2");
    }else {
        println!("number is divisible by 4, 3, or 2");
    }
}
```

这段代码有四种路径，运行后输出如下：

```
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/branches`
number is divisible by 3
```

当这段代码运行时，会按照顺序逐个检查`if`表达式，并执行第一个条件为`true`的代码块。请注意虽然6可以被2整除，但与之匹配的代码块并没有执行。这是因为Rust只会执行第一个条件为`true`的代码块，其他的甚至都不会继续检查。

过度使用`else if`会使你的代码杂乱不堪，所以如果你使用的次数超过了一次，那么你可能需要重构你的代码。第6章会讨论Rust中的分支结构`match`。

## 在`let`声明中使用`if`

由于`if`是一个表达式，所以可以在`let`声明的右侧使用，比如：

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("The value of number is: {number}");
}
```

变量`number`会被绑定为到`if`表达式的结果。运行代码输出如下：

```
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished dev [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/branches`
The value of number is: 5
```

请记住代码块的值等于它们中最后的表达式，且数字本身也是表达式。在这种情况下，`if`表达式的值取决于它执行的分支。也就是说，`if`每个分支的返回值类型必须一致。在上面的例子里，`if`和`else`的返回值都是`i32`。如果类型不一致，编译器会抛出异常：

```rust
fn main() {
    let condition = true;

    let number = if condition { 5 } else { "six" };

    println!("The value of number is: {number}");
}
```

如果我们试图编译这段代码，会看到报错。`if`和`else`的类型无法兼容，Rust会指出问题：

```
$ cargo run
    Compiling branched v0.1.0 (file:///projects/branches)
error[E0308]: `if` and `else` have incompatible types
 --> src/main.rs:4:44
  |
4 |    let number = if condition { 5 } else { "six" };
  |                                -          ^^^^^ expected integer, found `&str`
  |                                |
  |                                expected because of this
For more information about this error, try `rustc --explain E0308`.
error: could not compile `branches` due to previous error
```

`if`代码块返回了整数，而`else`返回了字符串。由于Rust必须在运行时确定变量的类型，而变量只能有一个单一的类型，所以这段代码无法通过。确定数字的类型使得编译器在数字使用的时候可以进行验证。如果变量在运行时才能被确定为是数字，那么Rust就做不到这些验证了；跟踪任何变量的不确定类型都会使编译器的复杂度大大上升，对代码的保护也会减少。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：第一个表达式只是第二个表达式的简写形式。

请注意第二段代码中Rust**并没有**要求`x`被初始化为`let mut`。因为Rust已经检测到`x`只被初始化了一次。

</template>
<template #quiz>

请判断：这两段代码中`x`的值相同。

代码1：

```rust
let x = if cond { 1 } else { 2 };
```

代码2：

```rust
let x;
if cond {
  x = 1
}else {
  x = 2;
}
```

<Radio>
<Option label="是" answer />
<Option label="否" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`if`表达式的条件必须为布尔类型。Rust并没有“真值”或者“假值”这种概念。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let x = 1;
    let y = if x { 0 } else { 1 };
    println!("{y}");
}
```

<IsCompile :answer="{ compiled: false, }" />

</template>
</Quiz>
</QuizProvider>
:::

## 循环

重复执行一段代码是十分有用的。对于这种情况，Rust提供了几种*循环*，它们会在循环执行循环体内的代码。为了测试循环，我们可以创建一个新的项目，loops。

Rust有三种循环：`loops`，`whiles`和`for`。让我们逐个尝试。

## `loop`循环

`loop`关键字告诉Rust无限执行一段代码，直到你告诉它停止。例如：

```rust
fn main() {
    loop {
        println!("again!");
    }
}
```

当我们运行这段程序时候，我们会看到`again!`被无限地打印。大部分终端工具支持使用ctrl + c来中断陷入无限循环的程序：

```
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished dev [unoptimized + debuginfo] target(s) in 0.29s
     Running `target/debug/loops`
again!
again!
again!
again!
^Cagain!
```

`^C`表示用户按下了ctrl + c。在按下按键后你可能会看到其后再次打印`again!`（也可能不会），取决于程序在收到终止信号时循环运行到了哪个流程。

幸运的是，Rust提供了使用代码来跳出循环的方式。你可以使用`break`关键字来终止循环。可以回顾第二章的代码，在用户猜测到正确的数字后跳出循环的方式。

在猜数游戏里我们也使用了`continue`，它可以跳过后面的代码直接进入下一次循环。

## 循环的返回值

`loop`的使用场景之一就是重复你认为可能会失败的操作，比如检查一个线程是否完成了它的工作。你可能需要将结果送出循环供后续代码使用。这种时候只需要将需要传递的值写在`break`表达式的后面：

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };

    println!("The result is {result}");
}
```

在循环前，我们定义了一个变量`counter`并初始化为`0`。然后我们定义了一个变量`result`来接收循环的返回值。每一次循环都会给`counter`的值加`1`，然后检查其值是否为`10`。如果是，那么循环会结束，返回`counter * 2`。在循环后，我们使用了分号来结束这个声明，将其返回值赋值给`result`。最后，我们打印了`result`的值，结果为`20`。

> [!NOTE]
> `break counter * 2`后面的分号从技术角度来说是可有可无的。`break`和`return`很相似，它们都接收一个表达式作为参数，也都会触发控制流的改变。写在`break`或`return`后的代码永远不会被执行，所以Rust编译器认为`break`表达式和`return`表达式的值为单元`()`。

## 使用标签消除多循环嵌套的歧义

如果你的循环存在嵌套，`break`和`continue`会作用于离它们最近的循环。你也可以使用*循环标签*来指明`break`和`continue`希望作用的循环。循环标签必须用单引号开头，比如：

```rust
fn main() {
    let mut count = 0;
    'counting_up: loop {
        println!("count = {count}");
        let mut remaining = 10;

        loop {
            println("remaining = {remaining}");
            if remaining == 9 {
                break;
            }
            if count == 2 {
                break 'counting_up;
            }
            remaining -= 1;
        }

        count += 1;
    }
    println!("End count = {count}");
}
```

外层循环注明了标签`'counting_up`，它会从0计数到2。内层循环没有标签，他会从10倒数到9。第一个`break`没有注明标签，所以它只会退出内层循环。而`break 'counting_up;`声明则会退出外层循环。整段代码输出如下：

```
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished dev [unoptimized + debuginfo] target(s) in 0.58s
     Running `target/debug/loops`
count = 0
remaining = 10
remaining = 9
count = 1
remaining = 10
remaining = 9
count = 2
remaining = 10
End count = 2
```

## `while`条件循环

一个程序经常会使用条件来执行循环。当条件为`true`，循环会执行。当条件为`true`，程序会执行。当条件不再为`true`，程序就会调用`break`，终止循环。使用`loop`、`if`、`else`也是可以实现这种行为的；你可以在程序中尝试。然而，这种行为十分常见，所以Rust内置了语言结构来实现，也就是`while`循环。下面的代码就是使用`while`循环来循环程序三次进行倒计时，然后打印结果并退出：

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{number}");

        number -= 1;
    }

    println!("LIFTOFF!!!");
}
```

这种结构相比于使用`loop`、`if`、`else`和`break`来说少了很多嵌套，更加清晰。当条件为`true`，循环执行，否则，循环结束。

## 使用`for`循环遍历集合

你可以使用`while`结构来对遍历集合元素，比如：

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];
    let mut index = 0

    while index < 5 {
        println!("the value is: {}", a[index]);

        index += 1;
    }
}
```

代码会通过递增的数字来遍历数组中的元素。从0开始，直到数组的最后一个元素（也就是`index < 5`不再为`true`）。运行代码输出如下：

```
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32s
     Running `target/debug/loops`
the value is: 10
the value is: 20
the value is: 30
the value is: 40
the value is: 50
```

数组的5个元素全部在终端中出现了。尽管`index`最终会变成`5`，但那时循环已经停止，不会再尝试获取数组的第六个元素。

然而，这样的代码也很容易出错；如果条件语句里的下标书写错误，那么程序很可能崩溃。比如，如果你移除了数组中的一个元素，却忘记了更新条件为`while index < 4`，程序就会崩溃。这样的代码运行效率也很低，因为编译器需要添加检查，来确定循环中的下标是否已经超出数组下标。

更便捷的方式是使用`for`循环来遍历集合：

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("the value is: {element}");
    }
}
```

当我们运行这段代码，我们会看到和之前一样的输出。更重要的是，代码的安全性大大提升了，减少了漏洞出现的可能性。

使用`for`循环，在数组变化时也不需要再对代码进行更新。

`for`循环的安全性和简洁性让它成为了Rust里最常用的代码结构。甚至对于一些你希望执行特定次数的代码，比如之前用`while`循环进行的倒计时，Rust爱好者也会选择使用`for`。方法是使用`Range`，由标准库提供，它可以根据开始数字和结束数字按顺序生成一段数字。

下面就是一个例子，使用了`for`循环和`rev`（使范围逆转）:

```rust
fn main() {
    for number in (1..4).rev() {
        println!("{number}");
    }
    println!("LIFTOFF!!!");
}
```

这样的代码更好，不是吗？

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：实际上，这段代码在第一次外层循环结束后就会终止。

</template>
<template #quiz>

判断是否正确：这段代码会终止（如果不会，则表示代码会无限循环）。

```rust
fn main() {
    let mut x = 0;
    'a: loop {
        x += 1;
        'b: loop {
            if x > 10 {
                continue 'a;
            }else {
                break 'b;
            }
        }
        break
    }
}
```

<Radio>
<Option label="会" answer />
<Option label="不会" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`a`中有个10个值为`5`的元素，因此`sum`的值为`50`。答案不是`15`————请注意`[5; 10]`和`[5, 10]`的区别。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let a = [5; 10];
    let mut sum = 0;
    for x in a {
        sum += x;
    }
    println!("{sum}");
}
```

<IsCompile :answer="{ compiled: true, result: '50' }" />

</template>
</Quiz>
</QuizProvider>
:::

## 总结

你做到了！这一章的内容相当多：你学到了变量、基础类型和符合类型、函数、注释、`if`表达式和循环！为了练习本章讨论的概念，你可以尝试自己开发下面的程序：

- 华氏度和摄氏度的互相转换。
- 生成第n个斐波那契数。
- 打印圣诞颂歌《圣诞十二日》的歌词，利用歌曲中的重复。

当你准备好继续，我们会在下一章讨论一个其他语言中一般不存在的概念：所有权。
