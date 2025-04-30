<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
} from "../../components/quiz"
</script>

# 类型进阶

Rust的类型系统有一些我们还未提及的特性。我们会讨论新特性的一些情况，并讨论为什么新类型作为类型来说是有用的。然后我们会讲解类型别名，一种类似新类型的特性，但语义上略有不同。我们还会讨论`!`类型和动态容量类型。

## 使用新类型模式来保证类型安全和抽象

> [!NOTE]
> 这一节预设你已经读过了前一节的“使用新类型模式来在外部类型上实现外部Traits”

新类型模式的能力并不局限于我们已经讨论过的话题，包括在编译期强制确保值不会被混淆，以及用于指示某个值的单位。你在上一节已经看过了一个使用新类型来指示单位的例子：回顾`Millimeters`和`Meters`结构体使用新类型包裹的`u32`值。如果我们写了一个函数，它的参数类型为`Millimeters`，那么不小心传入`Meters`和`u32`值的代码就是无法编译通过的。

我们还可以使用新类型模式来抽象化一些类型细节：新类型可以暴露一个公共的API，它和内部类型的私有API不同。

新类型模式还可以隐藏内部的实现细节。比如，我们可以提供一个包裹`HashMap<i32, String>`的`People`类型，它存储了用户的ID和用户名的关联关系。使用了`People`的代码只能使用我们提供的公共API，比如一个把名称添加到`People`集合里的方法；使用侧的代码无需知道我们在内部使用了`i32`的ID来关联名称。新类型模式是一种轻量化地实现封装内部实现细节的方法，我们已经在第18章讨论过了。

## 使用类型别名创建类型同义词

Rust提供了*类型别名（type alias）*来给予一个已有类型别名。通过使用`type`关键字。比如，我们可以创建一个`Kilometers`类型作为`i32`的别名：

```rust
    type Kilometers = i32;
```

这种情况下，`Kilometers`就是`i32`的*别名（synonym）*；但它与`Millimeters`和`Meters`类型的情况不同，`Kilometers`并不是一个单独的新类型。使用了`Kilometers`的值会被作为`i32`类型对待：

```rust
    type Kilometers = i32;

    let x: i32 = 5;
    let y: Kilometers = 5;

    println!("x + y = {}", x + y);
```

因为`Kilometers`和`i32`是同一个类型，我们可以将它们直接相加，也可以将`Kilometers`类型的值传递给接收`i32`类型参数的函数。然而，这种情况下，我们无法受益于我们之前讨论的来自新类型模式的类型检查。换句话说，如果我们在某些地方混用了`Kilometers`和`i32`，编译器是不会抛出错误的。

类型别名的主要用途是减少重复。比如，我们可能会有如下这种冗长的定义：

```rust
Box<dyn Fn() + Send + 'static>
```

如果在各种地方书写这样冗长的定义，会让人感觉很繁琐，也容易出错。你可以想象一下如下代码：

```rust
    let f: Box<dyn Fn() + Send + 'static> = Box::new(|| println!("Hello, world!"));

    fn takes_long_type(f: Box<dyn Fn() + Send + 'static>) {
        // 略
    }

    fn returns_long_type() -> Box<dyn Fn() + Send + 'static> {
        // 略
    }
```

一个类型别名可以让这段代码减少重复，更好管理。在下面的代码里，我们抽取了一个类型`Thunk`来代表那段繁琐的类型，然后替换了所有使用的地方：

```rust
    type Thunk = Box<dyn Fn() + Send + 'static>;

    let f: Thunk = Box::new(|| println!("Hello, world!"));

    fn takes_long_type(f: Thunk) {
        // 略
    }

    fn returns_long_type() -> Thunk {
        // 略
    }
```

这样的代码不敢写起来还是读起来都更加方便！为类型选择一个合适的别名可以更好地表达你的意图（thunk指稍后才会执行的代码，因此它非常适合用来命名被存储起来的闭包）。

类型别名也常常和`Result<T, E>`类型一起使用来减少重复。比如标准库的`std::io`模块。I/O操作常常返回`Result<T, E>`来处理操作失败的情况。而`std::io::Error`结构体表示所有可能的I/O错误。很多`std::io`里定义的函数会返回`Result<T, E>`，且`E`为`std::io::Error`，比如这些`Write`trait里定义的方法：

```rust
use std::fmt;
use std::io::Error;

pub trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize, Error>;
    fn flush(&mut self) -> Result<(), Error>;

    fn write_all(&mut self, buf: &[u8]) -> Result<(), Error>;
    fn write_fmt(&mut self, fmt: fmt::Arguments) -> Result<(), Error>;
}
```

`Result<..., Error>`重复了很多次，因此，`std::io`定义了如下类型别名：

```rust
type Result<T> = std::result::Result<T, std::io::Error>;
```

由于这个定义是定义在`std::io`模块里的，我们可以使用完全限定语法`std::io::Result<T>`；这种情况下，`Result<T, E>`的`E`会自动补全为`std::io::Error`。`Write`trait函数的定义最终可以简化为：

```rust
pub trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize>;
    fn flush(&mut self) -> Result<()>;

    fn write_all(&mut self, buf: &[u8]) -> Result<()>;
    fn write_fmt(&mut self, fmt: fmt::Arguments) -> Result<()>;
}
```

类型别名改进了两方面：它让代码更易于书写了，且它给了我们一个在`std::io`里可以随处使用的接口。由于它是一个别名，即它只是一个`Result<T, E>`，我们可以使用任何定义在`Result<T, E>`上的方法，也可以使用`?`操作符。

## 永不返回的never类型

Rust有一个特殊的类型`!`，用类型技术的术语来说，它是一个*空类型（empty type）*，因为它没有任何值。我们更倾向于称呼其为*never类型*，因为它表示一个函数永远不会返回的地方。比如下面的例子：

```rust
fn bar() -> ! {
    // 略
}
```

这个函数被读作“函数`bar`返回了never”。返回never的函数被称为*发散函数（diverging functions）*。我们无法基于`!`类型创建值，所以`bar`无法真的返回。

但是一个永远无法创建值的类型有什么用呢？回顾之前猜数程序里的代码；我们摘取了一部分放在下面：

```rust
        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        }
```

当时，我们跳过了一些代码细节。在第六章介绍流程控制时，我们讨论了`match`的分支必须返回的类型。所以，类似下面的代码无法运行：

```rust
    let guess = match guess.trim().parse() {
        Ok(num) => num,
        Err(_) => "hello",
    };
```

`guess`的类型需要是整数和字符串，而Rust要求`guess`只能为一个类型。那么`continue`返回了什么？为什么之前的代码里我们允许了一个分支返回`u32`，一个分支用`continue`结束呢？

你可能已经猜到了，`continue`表达式的类型为`!`。因此，当Rust计算`guess`的类型时，它会检查所有分支，前一个分支的返回值是`u32`，而后一个分支的返回值为`!`。由于`!`永远无法创建值，Rust就确定了`guess`的类型为`u32`。

对这种行为正式的描述是，类型`!`可以强制转换为任何其他类型。我们之所以允许这个`match`分支用`continue`结尾就是因为`continue`不返回值；反之，它将控制权移回了循环顶部，所以在`Err`的情况在，我们不需要给`guess`赋值。

never类型对于`panic!`宏来说也很有用。回顾我们调用`Option<T>`值上的`unwrap`函数来获取值或者panic：

```rust
impl<T> Option<T> {
    pub fn unwrap(self) -> T {
        match self {
            Some(val) => val,
            None => panic!("called `Option::unwrap()` on a `None` value"),
        }
    }
}
```

这段代码和之前的`match`类似：Rust看到了`val`的类型可能为类型`T`和`panic!`的返回类型`!`，所以`match`表达式的返回值类型就是`T`。这段代码是可以正常运行的，因为`panic!`没有返回值；它会结束整个程序。在`None`的情况下，我们不会获得来自`unwrap`的返回值，所以这段代码是合法的。

还有一个表达式的返回值为`!`，那就是`loop`：

```rust
    println!("forever");

    loop {
        println!("and ever ");
    }
```

这里，循环永远不会结束，所以表达式的返回值就是`!`。然而，如果我们在循环内使用了`break`，那么它的返回值就不是never了，因为循环会在`break`处停止。

## 动态尺寸类型和`Sized`trait

Rust需要了解类型特定的具体信息，比如要分配多少内存给一个特定类型的值。这样的设计对于类型系统最初设计的一员来说有点困惑：它就是*动态尺寸类型（dynamically sized types）*。有时候也被称为*DSTs*或者*无尺寸类型*，这些类型可以让我们使用那些运行时才能确定尺寸的值。

我们来深入挖掘动态尺寸类型`str`的细节，我们在本书中已多次涉及。对，不是`&str`，是单独的`str`是一个无尺寸类型。我们无法在运行前明确字符串的长度，也就是说我们无法创建类型为`str`的变量，也无法接收`str`类型的参数。假设有如下代码，它们无法运行：

```rust
    let s1: str = "Hello there!";
    let s2: str = "How's it going?";
```

Rust需要明确需要为任何特定类型的值分配多少内存，且一个类型的所有值都需要分配相同的内存。如果Rust允许了上述代码通过，那么这两个`str`值会占用一模一样大小的内存。但它们的长度却是不同的：`s1`的长度为12，而`s2`的长度为15。这就是为什么创造一个动态尺寸的变量是不可能的。

那么我们应该做什么呢？在这种情况下，你已经知道了答案：我们把`s1`和`s2`的类型从`str`改为`&str`。回顾第四章关于切片类型的定义，切片数据只存储开始的位置和切片的长度。所以`&T`是一个单一的存储了`T`存储地址的值，而`&str`表示两个值：`str`的地址和长度。这样，我们永远都可以知道`&str`的大小，不管其指向的字符串有多长。通常来说，这就是Rust里使用动态尺寸类型的方式：它们有一些额外的元信息存储了动态信息。动态尺寸类型的黄金准则就是我们必须永远将动态尺寸类型的值放在一个指针或者类似的类型后面。

你可以将`str`和任何指针结合：比如，`Box<str>`或者`Rc<str>`。实际上，你已经见过了动态尺寸类型：trait。每一个trait都是一个动产尺寸类型，我们可以使用trait的名字来使用。在第18章中，我们提到过在使用trait对象的情况下，我们必须使用指针，比如`&dyn Trait`或者`Box<dyn Trait>`（`Rc<dyn Trait>`同理）。

为了处理DSTs，Rust提供了`Sized`trait来决定类型的尺寸是否在编译期确定。这个trait会自动为所有编译器能确定尺寸的类型实现。此外，Rust隐式地给每个泛型函数添加了`Sized`限制。比如，假设一个泛型函数的定义如下：

```rust
fn generic<T>(t: T) {
    // 略
}
```

它实际上会被看作：

```rust
fn generic<T: Sized>(t: T) {
    // 略
}
```

默认情况下，泛型函数只能用于在编译期已知尺寸的类型。然而，你可以使用如下语法来解除这个限制：

```rust
fn generic<T: ?Sized>(t: &T) {
    // 略
}
```

`?Sized`这个类型边界表示“T可能有也可能没有`Sized`”，这样的注解会覆盖掉默认的泛型函数必须用于已知尺寸类型的行为。`?Trait`语法只能用于`Sized`，不能用于其他任何traits。

同时注意我们把`t`的类型从`T`改为了`&T`。因为类型可能不是`Sized`，我们需要借用指针来使用它。这种情况下，我们选择了引用。

接着，我们来聊聊函数和闭包。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`!`类型对这个函数来说不是一个合适的返回类型，因为他只在部分情况在panic，并非所有情况。

</template>
<template #quiz>

<IsCompileText />

```rust
fn expect_none(x: Option<i32>) -> ! {
    match x {
        Some(n) => panic!("Expected none, fount Some(n)"),
        None => ()
    }
}

fn main() {
    println!("{:?}", expect_one(None));
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：对`is_equal`的调用传入了`&str`，也就是说`T = str`。然而，`str`只允许在`T`被标记为`?Sized`的泛型函数里使用。

</template>
<template #quiz>

<IsCompileText />

```rust
fn is_equal<T: Eq>(t1: &T, t2: &T) -> bool {
    t1 == t2
}

fn main() {
    println!("{}", is_equal("Hello", "world"));
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>
</QuizProvider>
:::
