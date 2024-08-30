<script setup>
import {
  QuizProvider,
  Quiz,
  Input,
  IsCompileText,
  IsCompile
} from "../../components/quiz"

</script>

# 泛型数据类型

我们可以在函数的签名、或者结构体的定义中使用泛型，它可以表示各种不同的类型。让我们来看看如何在函数、结构体、枚举和方法中使用泛型。然后我们会讨论泛型是如何提高代码的表现的。

## 在函数中使用

当使用泛型定义函数时，我们需要将泛型写在函数的签名中，也就是我们书写参数和返回值的地方。这样做可以让我们的代码更灵活，也能为调用者提供更多的功能，减少重复性的代码。

继续我们的`largest`函数，下面是两个类似的函数实现。我们要使用泛型来用一个函数替代它们：

```rust
fn largest_i32(list: &[i32]) -> &i32 {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn largest_char(list: &[char]) -> &char {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest_i32(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest_char(&char_list);
    println!("The largest char is {}", result);
}
```

`largest_i32`函数就是我们之前抽离的函数。而`largest_char`函数时用于查找切片中最大的`char`的。它们的函数实现是相同的，所以我们可以引入泛型类型来减少重复性代码。

要在新的函数中将类型参数化，我们需要先起一个名字，就像我们给函数的值参数起名一样。你可以使用任何标识作为类型参数的名字。但我们用`T`来表示，因为这是一个约定俗成的写法，Rust里的类型参数通常是单个的大写字母。`T`可以看成是“type”的缩写，它是大部分Rust开发者的第一选择。

当我们在函数体中使用参数时，我们必须在函数签名中声明它的名字，以便编译器知道它的含义。类似的，当我们要使用函数签名中定义的类型参数时，我们必须在使用前进行声明。要定义`largest`函数，我们要在尖括号`<>`中添加类型参数名，然后将它放置在函数名和参数列表之间：

```rust
fn largest<T>(list: &[T]) -> &T {
```

这段定义可以看做：`largest`函数有一个类型参数`T`，它接受一个切片类型`list`，它是对`T`的切片。`largest`函数会返回一个`T`类型值的引用。

下面的代码展示了泛型函数`largest`的使用，我们可以使用`i32`的切片调用，或是`char`的切片调用。请注意下面的代码无法编译，但我们会在后面进行修复：

```rust
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("The largest char is {}", result);
}
```

如果我们试图编译这段代码，我们会收到如下报错：

```
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0369]: binary operation `>` cannot be applied to type `&T`
 --> src/main.rs:5:17
  |
5 |         if item > largest {
  |            ---- ^ ------- &T
  |            |
  |            &T
  |
help: consider restricting type parameter `T`
  |
1 | fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
  |             ++++++++++++++++++++++

For more information about this error, try `rustc --explain E0369`.
error: could not compile `chapter10` due to previous error
```

问题在于`largest`函数接收了一个切片类型`&[T]`作为输入，函数无法确定`T`的*任何信息*。它可以是`i32`，可以是`String`，也可以是`File`。然而，`largest`要求`T`的类型是可以使用`>`进行比较的类型（也就是说，T需要实现`PartialOrd`类型，关于Trait我们会在下一章讨论）。某些类型，比如`i32`，`String`，是可以比较的，但是其他类型，比如`File`，是无法比较的。

在一些拥有**模版(Templates)**的语言，比如C++里，编译器不会对`largest`这样的实现有什么意见，反之，他们会在`largest`被用`&[File]`调用时抛出错误。Rust则要求你对泛型进行提前的预期管理。如果`T`要被比较，那么`largest`必须指明这一点。因此编译器会说除非`T`受到限制，否则将无法编译。

在类似Java的语言中，所有的对象都有一系列的内置方法，比如`Object.toString()`，Rust中没有任何的核心方法。没有限制，泛型就没有任何能力：它不能被打印，克隆，或者修改（尽管它可以被销毁）。

## 在结构体中使用

我们也可以使用一个或多个泛型参数来定义结构体，同样使用`<>`语法，下面的代码就是一个存储了任意类型值`x`和`y`的结构体`Point<T>`：

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}
```

在结构体中使用泛型的语法和函数中类似。首先我们需要在结构体名后的尖括号内声明泛型参数，然后我们就可以在结构体的定义中使用它了。

注意，由于我们使用了一个泛型参数来定义结构体`Point<T>`，这个定义表示了`Point<T>`在某些类型T上是通用的，且不管我们传入的类型是什么，`x`和`y`必须是同一种类型。如果我们使用不同类型的值实例化了`Point<T>`，那么无法通过编译：

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let wont_work = Point { x: 5, y: 4.0 };
}
```

在这个例子里，我们给`x`赋值了`5`，就是通知了编译器泛型类型`T`在`Point<T>`实例中是一个整数类型。然后我们给`y`赋值了`4.0`，而根据我们的定义，它们的类型应该是相同的，我们会看到如下报错：

```
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0308]: mismatched types
 --> src/main.rs:7:38
  |
7 |     let wont_work = Point { x: 5, y: 4.0 };
  |                                      ^^^ expected integer, found floating-point number

For more information about this error, try `rustc --explain E0308`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error

```

要定义`x`和`y`均为泛型类型，且拥有不同类型的结构体，我们可以使用多个泛型参数。比如，在下面的代码里，我们修改了`Point`的定义，`x`的类型为泛型类型`T`，而`y`的类型为泛型类型`U`：

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}
```

这样子，所有`Point`的实例都是合法的！你可以使用随意数量的泛型参数，但过度地使用可能会让你的代码难以阅读。如果你发现你的代码存在大量的泛型参数，那么可能有重构成更细粒度的空间。

## 在枚举中使用

就像结构体一样，枚举也可以持有泛型参数来在变体中使用。让我们再回头看看标准库中的枚举`Option<T>`：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

你现在应该能明白这样的代码了。正如你所看到的一样，`Option<T>`枚举持有一个泛型类型`T`和两个变体：`Some`会存储类型为`T`的值，而`None`则不会持有任何值。使用`Option<T>`，我们就可以表示可选值的抽象概念，由于`Option<T>`是泛型的，我们可以在任何可选值上使用它。

枚举类型也可以使用多个泛型类型。第九章中我们使用过的`Result`枚举就是一个很好的例子：

```rust
enum Result<T, E> {
    Ok<T>,
    Err(E),
}
```

`Result`枚举拥有两个泛型类型，`T`和`E`，它也有两个变体：`Ok`变体使用了类型`T`，而`Err`变体则使用了类型`E`。这样的定义使得`Result`类型对于任何可能成功（返回类型`T`）或失败（返回错误`E`）的操作来说都很实用。实际上，我们在第九章中用它开启了文件，成功开启时`T`的类型是`std::fs::File`，开启失败时`E`的类型则是`std::io::Error`。

当你发现你的代码中有大量结构重复、类型不同的结构体和枚举时，你可以使用泛型来减少重复代码。

## 在方法中使用

在第五章中，我们介绍了在结构体和枚举上实现方法的情况，泛型也可以用在它们的定义中。下面的代码就是给结构体`Point<T>`实现方法`x`的过程：

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };

    println!("p.x = {}", p.x());
}
```

这里，我们给结构体`Point<T>`定义了方法`x`，它返回了对字段`x`的引用。

请注意我们在`impl`关键字后面定义了`T`，来指明我们在给`Point<T>`实现方法的过程中使用了`T`。在`impl`后面声明了`T`后，Rust可以识别到`Point`后面的尖括号内的类型不是一个实际类型，而是一个泛型类型。我们可以使用和结构体中泛型不同的名字，但使用相同的名字更方便。在一个`impl`内部编写的方法，将定义在该类型的任何实例上，不管最终使用的类型是什么。

我们也可以在定义方法时指明类型，比如，使用`Point<f32>`而不是`Point<T>`，这种情况下我们无需在`impl`后声明泛型参数：

```rust
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

这样的类型意味着`Point<f32>`会拥有`distance_from_origin`方法，其他`T`非`f32`的`Point<T>`实例不会拥有这个实例。这个方法测量了点和原点（0.0，0.0）之间的距离，使用了一个浮点数才能使用的数学方法。

你不能使用同一个名字来实现具体的和泛型的方法。比如，如果你为泛型类型`T`实现了`distance_from_origin`方法，然后又给`f32`实现了`distance_from_origin`方法，编译器会拒绝编译你的程序：Rust无法确定类似`Point<f32>::distance_from_origin`这样的操作该使用哪种实现。更普遍地来说，Rust没有类似其他面向对象语言中的继承机制，当然有一个例外（trait的默认方法），我们下一章会讨论。

结构体定义中的泛型和使用方法时的类型并不总是相同的，比如，下面的结构体`Point`使用了泛型`X1`和`Y1`，而给它实现的方法`mixup`签名则使用了`X2`和`Y2`（只是为了让这个例子更清晰）。这个方法创造了一个新的`Point`实例，它的`x`值来自`self``Point`（类型为`X1`），`y`来自传入的`Point`（类型为`Y2`）。

```rust
struct Point<X1, Y1> {
    x: X1,
    y: Y1,
}

impl<X, Y> Point<X1, Y1> {
    fn mixup<X2, Y2>(self, other: Point<X2, Y2>) -> Point<X1, Y2> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

在`main`函数中，我们定义了一个`x`为`i32`类型、值为`5`，`y`为`f64`类型、值为`10.4`的`Point`，`p2`则是一个`x`为字符串切片、值为`"Hello"`，`y`为`char`类型，值为`c`的`Point`。对`p1`调用`mixup`方法，传入`p2`，我们得到了`p3`，它的`x`类型为`i32`，来自`p1`，`y`类型为`char`，来自`p2`。`println!`宏会打印`p3.x = 5, p3.y = c`。

这个例子是为了展示泛型参数在`impl`以及其方法上使用的情况。这里，`X1`和`X2`在`impl`后书写，以为它们会传入结构体的定义。而`X2`和`Y2`在`mixup`后书写，它们只和方法本身有关。

## 使用了泛型的代码性能

你可能会好奇使用了泛型类型参数的代码在运行时的消耗。好消息是使用泛型不会让你的代码比使用了实际类型的代码慢一丝一毫。

Rust通过在编译时使用泛型对代码进行单态化来实现这一点。*单态化*就是一个将使用泛型时候的具体类型注入的过程。这个过程中，编译器做了和我们上面进行的事情恰好相反的事，它会检查使用了泛型的代码，然后生成使用具体类型的代码。

让我们来看一段使用了标准库中`Option<T>`枚举的代码：

```rust
let integer = Some(5);
let float = Some(5.0);
```

当Rust编译这段代码时，它会运行单态化。这个过程中，编译器会读取到`Option<T>`的两种使用形式：`i32`和`f64`。这样，它就会展开所有的类型定义，将其声明为使用了`i32`和`f64`的具体类型，接着替换使用。

单态化版本的代码可以看作下面的代码（实际上编译的名字会和这里不同）：

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

对`Option<T>`的使用被编译器替换为了更具体的类型。正因为Rust将类型转化为了具体的类型，使用泛型才不会带来任何的性能消耗。当代码运行时，它和我们手写重复的定义效率完全一样。单态化让Rust的泛型在运行时达到了无与伦比的性能。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：对于签名为`T -> T`的函数来说，唯一的可能性就是下面的实现（前提是不使用unsafe的代码）：

```rust
fn mystery<T>(x: T) -> T {
    x
}
```

函数当然有可能panic或者打印，但它的返回值只能是其输入。`mystery`无法了解`T`的类型是什么，自然也没办法生成或者修改`T`的值。

</template>
<template #quiz>

想象你使用一个第三方的函数，它的实现你并不了解，它的类型签名如下：

```rust
fn mystery<T>(x: T) -> T {
    // ????
}
```

然后你调用了`mystery`：

```rust
let y = mystery(3);
```

假设`mystery`没有使用任何`unsafe`的代码，那么`y`的值是？

<Input answer='3' />

</template>
</Quiz>

<Quiz>
<template #description>

解析：如果一个类型是泛型（比如`T`），我们就无法了解它的任何事，包括它是否有转化为字符串的能力，因此`println!("{x}")`对于`x: &T`类型来说是无效的。

</template>
<template #quiz>

<IsCompileText />

```rust
fn print_slice<T>(v: &[T]) {
    for x in v {
        println!("{x}");
    }
}

fn main() {
    print_slice(&[1, 2, 3]);
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：`f`的定义冲突了，Rust无法决定`p.f()`该调用哪一个`f`，因此会抛出一个编译错误。

</template>
<template #quiz>

<IsCompileText />

```rust
struct Point<T> { x: T, y: T }

impl Point<i32> {
    fn f(&self) -> &i32 { &self.y }
}

impl<T> Point<T> {
    fn f(&self) -> &T { &self.x }
}

fn main() {
    let p: Point<i32> = Point { x: 1, y: 2 };
    println!("{}", p.f());
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>
</QuizProvider>
:::
