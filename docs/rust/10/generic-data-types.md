# 泛型数据类型

我们可以在函数的签名、或者结构体的定义中使用泛型，它可以表示各种不同的类型。让我们来看看如何在函数、结构体、枚举和方法中使用泛型。然后我们会讨论泛型是如何提高代码的表现的。

## 定义函数时

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

## 定义结构体时

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
