<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile
} from "../../components/quiz"
</script>

# 通过`Deref`Trait将普通引用变为智能指针

通过实现`Deref`trait，你可以自定义*解引用操作符（dereference operator）*`*`的行为（不要和乘操作或者通配符混淆）。通过实现`Deref`，一个智能指针也可以被看做普通的引用，你为普通引用开发的代码也适用于智能指针了。

我们先来看看解引用操作符在普通引用上是如何工作的。然后我们再来尝试定义类似`Box<T>`这样的自定义类型，并了解为什么解引用运算符在我们新定义的类型上无法像引用一样工作。我们也会探索如何通过实现`Deref`trait来让智能指针像引用一样工作。接着我们会讨论Rust的*强制解引用（deref coercion）*特性，以及它和普通引用或智能指针的配合。

> [!NOTE]
> 我们即将创建的类型`MyBox<T>`和实际的`Box<T>`有一个很大的不同：我们的版本不会将数据存入堆内。由于本例中我们着重讨论的是`Deref`，所以数据被存储在哪里并不是我们关注的重点，我们更需要关心的是类指针的行为。

## 跟随指针获取值

一个常规引用就是一种指针，你可以将其想象成一个箭头，指向一个存储在某处的值。下面的代码里，我们创建了一个`i32`值的引用，然后使用解引用操作符来获取了其中的值：

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

变量`x`持有一个`i32`类型的值`5`。我们给`y`设置了对`x`的引用。我们可以断言`x`等于`5`。然而，如果我们想要断言`y`中的值，我们就得使用`*y`和引用来追踪到其指向的值（也就是*解引用（dereference）*）来让编译器进行其和实际值的比较。一旦我们解引用了`y`，我们就可以访问到`y`指向的整数，并将其和`5`进行比较。

如果我们写了`assert_eq!(5, y)`，我们会看到编译错误：

```
$ cargo run
   Compiling deref-example v0.1.0 (file:///projects/deref-example)
error[E0277]: can't compare `{integer}` with `&{integer}`
 --> src/main.rs:6:5
  |
6 |     assert_eq!(5, y);
  |     ^^^^^^^^^^^^^^^^ no implementation for `{integer} == &{integer}`
  |
  = help: the trait `PartialEq<&{integer}>` is not implemented for `{integer}`
  = note: this error originates in the macro `assert_eq` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0277`.
error: could not compile `deref-example` (bin "deref-example") due to 1 previous error
```

将一个数字和一个对数字的引用进行比较时不被允许的，因为它们是不同的类型。我们必须使用解引用操作符来追踪到引用指向的值。

## 像引用一样使用`Box<T>`

我们可以使用`Box<T>`替换上面代码中的引用；对`Box<T>`使用解引用操作符和对引用是一样的：

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

这段代码和之前代码的不同在于，我们给`y`赋值了一个`Box<T>`的实例，它指向`x`的副本，而不是`x`所存储的值。在最后一行的断言中，我们可以使用解引用操作符来获取`Box<T>`所指向的内容，和`y`一样。接下来，我们将通过定义自己的类型，探索`Box<T>`为什么这么特殊，能允许我们使用解引用运算符。

## 自定义智能指针

我们来自定义一个和标准库提供的`Box<T>`类似的智能指针，体验一下智能指针和普通引用默认的不同点。然后我们来看看如何给它添加支持解引用操作符的能力。

`Box<T>`类型是作为一个元组结构体定义的，所以下面的代码`MyBox<T>`也一样。我们给也给他添加了一个`new`函数，和`Box<T>`上定义的`new`保持一致。

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}
```

我们定义了结构体`MyBox`，并声明了一个泛型参数`T`，因为我们的类型可以持有任何类型的值。`MyBox<T>`是一个元组结构体，它仅有一个元素，类型为`T`。`MyBox::new`函数接收一个类型为`T`的参数，并返回一个存储了这个值的`MyBox`实例。

我们可以尝试将之前代码`main`函数中的`Box<T>`替换为我们的`MyBox<T>`。下面的代码是无法编译通过的，因为Rust不知道该如何解引用`MyBox`。

```rust
fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

编译代码报错如下：

```
$ cargo run
   Compiling deref-example v0.1.0 (file:///projects/deref-example)
error[E0614]: type `MyBox<{integer}>` cannot be dereferenced
  --> src/main.rs:14:19
   |
14 |     assert_eq!(5, *y);
   |                   ^^

For more information about this error, try `rustc --explain E0614`.
error: could not compile `deref-example` (bin "deref-example") due to 1 previous error
```

我们的`MyBox<T>`类型暂时还不支持解引用，因为我们还没有为它实现这项能力。要想让它支持使用`*`操作符进行解引用，我们需要为它实现`Deref`trait。

# 通过实现`Deref`Trait将普通引用变为智能指针

在第十章中我们讨论过，要实现一个trait，我们需要提供这个trait要求的所有方法。对于标准库提供的`Deref`trait来说，我们需要实现一个`deref`方法，它接收一个借用的`self`作为参数，并返回一个对内部数据的引用。下面的代码就是为`MyBox`实现`Deref`的过程：

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

`type Target = T;`语法定义了一个关联类型，这个类型专供`Deref`使用。关联类型和泛型参数略有不同，但你现在暂时不需要考虑它们，我们会在第19章深入讨论。

在`deref`方法的方法体内，我们写了`&self.0`，这样当我们通过`*`操作符访问时，`deref`会返回一个对值的引用；回顾第五章中的内容，`.0`会访问元组结构中的第一个值。这样前面代码的`main`函数对`MyBox<T>`使用`*`的操作就可以正常编译了，后续的断言自然也可以通过了！

没有`Deref`trait，编译器只能对`&`引用的内容进行解引用。`deref`方法给予了编译器从任何实现了`Deref`的类型中获取值的能力，它会调用`deref`方法来获取一个`&`引用的内容。

当我们输入`*y`时，Rust实际上会按照下面的格式运行代码：

```rust
*(y.deref())
```

Rust会将`*`操作符后的内容替换为`deref`方法的调用，然后返回一个字面上的引用，这样我们就无需思考我们是否需要调用`deref`方法。Rust的这个特性让我们可以更自由地开发，不管对象是普通引用还是实现了`Deref`的自定义类型。

`deref`方法返回一个引用，并且`*(y.deref())`外侧的括号是很有必要的，原因和所有权系统有关。如果`deref`返回了值，而不是对值的引用，那么这个值会被移出`self`。而这种情况下我们并不希望获取`MyBox<T>`中的值，和大多数情况下我们使用解引用操作符时一样。

注意每一次我们使用`*`时，它会被替换为对`deref`方法的调用，然后仅调用一次`*`。由于对`*`的替换并不是无限的，我们最终获取到了值`i32`，`assert_eq!`将它和`5`的比较是通过的。

# 函数和方法中的隐式`Deref`强制转换

*Deref 强制转换（Deref coercion）*会将实现了`Deref`特性的类型的引用转换为对另一种类型的引用。比如，deref强制转换会将`&String`转换为`&str`，因为`String`对`Deref`的实现中返回了`&str`。Deref强制转换是一种便捷的Rust对函数和方法参数的操作，且它只对实现了`Deref`trait的类型生效。当我们将特定类型的值的引用传递给函数或方法，且与其参数签名不匹配时，就会发生转换。调用`deref`后，我们提供的类型就会转为目标方法需要的类型。

Rust提供的Deref强制转换可以让开发者书写函数和方法时无需频繁地显式添加`&`和`*`。Deref强制转换功能也让我们的代码兼容普通引用和智能指针。

为了看看真正的deref强制转换，我们来使用一下我们定义的实现了`Deref`的`MyBox<T>`类型。下面的代码展示了一个函数，它接收一个字符串切片作为参数：

```rust
fn hello(name: &str) {
    println!("Hello, {name}!");
}
```

我们可以调用`hello`函数并传入一个字符串切片，比如`hello("Rust");`。Deref强制转换使得调用`hello`并传入`MyBox<String>`也是可行的，代码如下：

```rust
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m);
}
```

这里我们调用了`hello`函数，传入了参数`&m`，他是对`MyBox<String>`的引用。由于我们为`MyBox<T>`实现了`Deref`trait，Rust可以调用`deref`方法将`&MyBox<String>`转换为`&String`。而标准库为`String`实现的`Deref`返回了一个字符串切片，这部分写在了`Deref`的API文档里。Rust会再次调用`deref`，将`&String`转换为`&str`，也就是`hello`函数所要求的类型。

如果Rust没有实现deref强制转换，我们手动对`&MyBox<String>`进行处理来适配`hello`，代码如下：

```rust
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&(*m)[..]);
}
```

`*(m)`将`MyBox<String>`解引用为了`String`。而`&`和`[..]`获取了一个`String`的切片，也就是`hello`函数要求的类型。没有了deref强制转换，这样的代码很难开发，逐一分析这些符号各自的作用也导致代码的可读性很差。Deref强制转换可以让Rust来自动处理这些转换。

当遇到实现了`Deref`trait的类型时，Rust会分析这个类型，并且尽最大限度调用`Deref::deref`来获取和参数匹配的类型。`Deref::deref`方法需要被调用的次数会在编译时就解析好，所以deref强制转换特性不会对运行时的性能有任何的影响！

## Deref强制转换如何和可变性相互作用

就像你使用`Deref`trait来覆写不可变引用的`*`操作一样，你可以使用`DerefMut`trait来覆写可变引用的`*`操作。

Rust会在以下三种情况下进行Deref强制转换：

- 从`&T`转换到`&U`且`T: Deref<Target = U>`
- 从`&mut T`转换到`&mut U`且`T: DerefMut<Target = U>`
- 从`&mut T`转换到`&U`且`T: Deref<Target = U>`

前两种情况很相似，只是第二种情况实现了可变性。在第一种情况下，如果你有一个`&T`且`T`实现了`Deref`到某类型`U`，那么你就可以得到`&U`。第二种情况也是一样的，只是针对的是可变引用。

第三种情况很特别：Rust会强制一个可变引用转为不可变。但是反过来是*不*可能的：不可变引用永远也无法强制变化为可变引用。由于借用规则的存在，如果你有一个可变引用，那么这个可变引用必须是针对这个数据的唯一引用（否则，程序无法编译通过）。将一个可变引用转为一个不可变引用不会破坏借用规则。而将一个不可变引用转为一个可变引用却要求不可变引用是针对数据唯一的不可变引用，但借用规则并没有限制这一点。因此，Rust无法保证从不可变引用到可变引用转换的可能性。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：`AccessLogger`会在每一次`n`被解引用时打印“deref”，也就是2次。注意复制`n`到`n2`不会触发`n`的解引用。

</template>
<template #quiz>
<IsCompileText />

```rust
use std::ops::Deref;

#[derive(Clone, Copy)]
struct AccessLogger(i32);

impl Deref for AccessLogger {
    type Target = i32;
    fn deref(&self) -> &Self::Target {
        println!("deref");
        &self.0
    }
}

fn main() {
    let n = AccessLogger(-1);
    let x = *n + 1;
    let n2 = n;
    println!("{} {}", x, *n);
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: 'deref\nderef\n0 -1'
  }"
  textarea="{
    rows: 3
  }"
/>
</template>
</Quiz>
</QuizProvider>
:::
