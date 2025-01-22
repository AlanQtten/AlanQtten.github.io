<script setup>
import {
  QuizProvider,
  Quiz,
  Checkbox,
  Option,
  IsCompileText,
  IsCompile,
} from "../../components/quiz"
</script>

# 使用Trait对象来传递不同类型的值

在第8章我们提过，集合的限制之一就是它们只能存储单一类型的值。当时我们定义了`SpreadSheet`枚举，用不同的变体存储整数，浮点数和文本。这样我们就可以在每个单元格里存储不同类型的数据，且仍然使用一个集合来表示一行单元格。这种处理对于元素可以互换，且类型数量在编译时已知的情况来说非常完美。

然而，有时候我们希望库的使用者根据特定的情况来选择使用的类型集合。比如，我们现在想要开发一个图形用户界面（graphical user interface，GUI）工具，该工具会迭代元素列表，调用每一个元素的`draw`方法，并将结果输出到屏幕上————一种GUI工具的常见技术。我们来创建一个库crate，名为`gui`，其中包括GUI库的结构。这个crate可能包括一些供人使用的类型，比如`Button`或者`TextField`。此外，`gui`的用户可能有添加自定义绘制类型的需求：比如，一个用户可能想要添加`Image`，另一个用户可能想添加`SelectBox`。

我们不会在本例中会实现一个功能完整的GUI库，但我们会展示这些片段是如何互相配合的。在我们开发这个库时，我们无法预测和定义所有用户想要的类型。但我们知道`gui`需要追踪许多不同类型的值，且需要调用这些类型的`draw`方法。它不需要关注`draw`方法的执行会产生什么结果，只需要知道这个方法是可执行的即可。

在有继承功能的语言里，我们可能会定义一个类，名为`Component`，然后在它上面定义一个`draw`方法。其他的类，比如`Button`，`Image`和`SelectBox`，都可以继承`Component`，同时继承`draw`方法。它们可以重写`draw`方法，定义各自的自定义行为，而框架可以将这些类型全部看做`Component`，调用它们的`draw`方法。但是由于Rust没有继承，我们需要其他办法来结构化`gui`库，允许用户扩展新类型。

## 为通用行为定义Trait

要为`gui`实现我们想要的功能，我们可以定义一个`Draw`trait，它包含一个`draw`方法。然后我们可以定义一个接收*trait对象（trait object）*的集合。特征对象同时指向实现了指定特征的类型实例和一个用于在运行时查找该类型的特征方法的表。我们可以通过指定某种指针，比如`&`引用或`Box<T>`智能指针，以及`dyn`关键字，配合某些行为创建trait对象。（我们会在第19章讨论为什么trait对象必须使用指针）我们可以在任何泛型或特定类型可以使用的地方使用trait对象类型。在我们使用trait对象时，Rust的类型系统会在编译期保证任何在这个上下文里使用的值都实现了trait对象的trait。最终，我们也不需要在编译时明确所有可能的类型。

我们曾经提过，在Rust中，为了和其他语言的对象有所区分，我们尽量避免把结构体和枚举成为“对象”。在结构体或枚举中，结构体字段中的数据和`impl`代码块实现的行为是分离的，然而在其他语言里，数据和行为通常会被捆绑在一起，成为对象。然而，trait对象*更像是*其他语言的对象，因为它的数据和行为是合并起来的。但是trait对象和传统的对象不同，我们无法给其添加数据。trait对象的用法也不像其他语言：它们的目的就是为了对通用行为进行抽象。

下面的代码展示了如何定义一个trait`Draw`，其包含一个`draw`方法：

```rust
pub trait Draw {
    fn draw(&self);
}
```

这里的语法看起来和第10章讨论的trait定义非常像。然而下面的代码有一些新语法：我们定义了一个名为`Screen`的结构体，它存储了一个名为`components`的集合。这个集合的类型为`Box<dyn Draw>`，即trait对象；它允许`Box`内的类型为任何实现了`Draw`trait的类型：

```rust
pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,
}
```

基于`Screen`结构体，我们定义一个方法`run`，它会调用`components`里每个元素的`draw`方法，代码如下：

```rust
impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}
```

这跟使用泛型类型参数和trait边界来定义结构体并不一样。一个泛型类型参数只能被替换为一个具体的类型，而trait对象在运行时允许多个具体的类型。比如，我们可以使用泛型类型参数和trait边界来定义`Screen`：

```rust
pub struct Screen<T: Draw> {
    pub components: Vec<T>,
}

impl<T> Screen<T>
where
    T: Draw,
{
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}
```

这样的代码限制一个`Screen`实例只能有一组`Button`类型的元素或一组`TextField`类型的元素。如果你需要同质的集合，使用泛型和trait边界就很合适，因为类型会在运行时单态化，确定为一个具体的类型。

从另一个角度来说，使用trait对象的方法，一个`Screen`实例可以在`Box<T>`内存储`Box<Button>`，或者`Box<TextFiled>`。我们来看看这是如何实现的，然后我们再来讨论对于运行时性能的影响。

## 实现Trait

现在我们来添加一些实现了`Draw`trait的类型。我们先提供一个`Button`类型。再次提示，实现一个GUI库不在本书的讨论范畴内，所以`draw`方法的方法体不会提供任何实质性的实现。我们只需要想象一下大致的实现，一个`Button`结构体可能需要`width`、`height`和`label`字段，代码如下：

```rust
pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        // 渲染一个按钮的代码
    }
}
```

`Button`的`width`、`height`和`label`字段和其他组件的字段不同；比如，一个`TextField`类型可能也有这些字段，再加一个`placeholder`字段。这些类型都希望渲染到屏幕上，所以他们都会实现`Draw`trait，但它们`draw`方法的代码是各不相同的，它们定义了如何绘制特定的类型，比如这里的`Button`（正如前面提到的，这里并没有具体的代码）。`Button`类型可能还会有其他和它功能相关的`impl`代码块，比如定义用户点击按钮时发生的事。这类方法显然并不适用于`TextField`。

如果使用我们库的人想要实现一个`SelectBox`结构体，其包含字段`width`、`height`和`options`，那么它们也可以用类似的方式实现`Draw`trait：

```rust
use gui::Draw;

struct SelectBox {
    width: u32,
    height: u32,
    options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        // 渲染一个下拉选择器的代码
    }
}
```

## 使用Trait

我们库的用户现在可以在他们的`main`函数中创建`Screen`实例了。对于`Screen`实例，他们可以添加`SelectBox`和`Button`，只要将它们放入到`Box<T>`中，成为一个trait对象即可。它们也可以调用`Screen`实例的`run`方法，它会负责调用每个组件的`draw`方法。下面的代码展示了如何实现：

```rust
use gui::{Button, Screen};

fn main() {
    let screen = Screen {
        components: vec![
            Box::new(SelectBox {
                width: 75,
                height: 10,
                options: vec![
                    String::from("Yes"),
                    String::from("Maybe"),
                    String::from("No"),
                ],
            }),
            Box::new(Button {
                width: 50,
                height: 10,
                label: String::from("OK"),
            }),
        ],
    };

    screen.run();
}
```

当我们开发这个库时，我们无法预知有人会添加`SelectBox`类型，但是我们的`Screen`实现可以操作这个新类型，并且渲染它，因为`SelectBox`实现了`Draw`trait，也就表面其含有`draw`方法。

这个概念————只关心值是否响应了消息，而不关心其真实类型————有点像动态类型语言里的*鸭式辨形（duck typing）*：如果一个东西走起来像鸭子，叫起来像鸭子，那么它就是一只鸭子！在`Screen`的`run`实现中，`run`不需要关注每一个组件的具体类型。它也不会检查组件是否为`Button`或`SelectBox`，只需要调用组件上的`draw`方法即可。通过指定`components`集合中的类型为`Box<dyn Draw>`，我们等同于约束了`Screen`需要可以调用`draw`方法的值。

使用trait对象结合Rust的类型系统来开发代码的好处和使用鸭式辨形很相似，我们不需要在运行时检查一个值是否实现了一个特定的方法，也不需要担心我们调用了一个值没有实现的方法，进而导致了报错。Rust不会允许那些没有实现trait对象所要求trait的代码通过编译。

比如，下面的代码就是我们给`Screen`实例中插入一个`String`时的情况：

```rust
use gui::Screen;

fn main() {
    let screen = Screen {
        components: vec![Box::new(String::from("Hi"))],
    };

    screen.run();
}
```

我们会看到如下报错，因为`String`没有实现`Draw`trait：

```
$ cargo run
   Compiling gui v0.1.0 (file:///projects/gui)
error[E0277]: the trait bound `String: Draw` is not satisfied
 --> src/main.rs:5:26
  |
5 |         components: vec![Box::new(String::from("Hi"))],
  |                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the trait `Draw` is not implemented for `String`
  |
  = help: the trait `Draw` is implemented for `Button`
  = note: required for the cast from `Box<String>` to `Box<dyn Draw>`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `gui` (bin "gui") due to 1 previous error
```

这个错误告诉我们问题出在我们传递给`Screen`的东西是不符合预期的，或者我们可以给`String`实现`Draw`，这样`Screen`就可以调用它的`draw`方法了。

## Trait对象和类型推导

使用trait对象的劣势之一就是它们和类型推导之间的交互。比如，假设我们推导一个`Vec<T>`的类型。当`T`不是一个trait对象时，Rust只需要集合中任意一个元素就可以推导出`T`的类型。所以一个空的结合会引发类型推导错误：

```rust
let v = vec![];
// error[E0282]: type annotations needed for `Vec<T>`
```

给其中插入一个元素，就可以启用Rust的类型推导：

```rust
let v = vec!["Hello world"];
// ok，v: Vec<&str>
```

而trait对象的类型推导更为棘手。比如，如果我们尝试把前面的代码进行一点点结构上的调整，将`components`的构建分开，代码如下：

```rust
fn main() {
    let components = vec![
        Box::new(SelectBox { /* .. */ }),
        Box::new(Button { /* .. */ })
    ];
    let screen = Screen { components };
    screen.run();
}
```

这样的重构居然会导致程序无法编译！编译器抛出的错误如下：

```
error[E0308]: mismatched types
   --> test.rs:55:14
    |
55  |       Box::new(Button {
    |  _____--------_^
    | |     |
    | |     arguments to this function are incorrect
56  | |       width: 50,
57  | |       height: 10,
58  | |       label: String::from("OK"),
59  | |     }),
    | |_____^ expected `SelectBox`, found `Button`
```

在之前的代码里，编译器理解`components`集合的类型必须为`Vec<Box<dyn Draw>>`，因为它在`Screen`结构体的定义中被定义。但在本小节的代码里，编译器丢失了`components`定义的信息。要修复这个问题，你需要手动对推导算法进行提示。这可以通过对向量中任意元素的显式转换来实现，例如：

```rust
let components = vec![
    Box::new(SelectBox { /* .. */ }) as Box<dyn Draw>,
    Box::new(Button { /* .. */ }) as Box<dyn Draw>,
];
```

或者为整个变量添加类型声明，比如：

```rust
let components: Vec<Box<dyn Draw>> = vec![
    Box::new(SelectBox { /* .. */ }),
    Box::new(Button { /* .. */ }),
];
```

一般来说，开发者最好提前意识到，由于类型推导的问题，使用trait对象会导致API使用端的用户的开发体验大幅下降。

## Trait对象执行动态分发

回顾我们第10章讨论过的使用泛型对性能的影响，我们明白了编译器会对使用了trait边界的泛型进行单态化处理：编译器会基于每一个可能的确定类型生成无泛型的函数和方法，并且替换我们使用的地方。这种将代码进行单态化处理的方式通常称为*静态分发（static dispatch）*，即编译器在编译时就已经知道了你要调用的方法。与之相反的是*动态分发（dynamic dispatch）*，即编译器无法在编译时判断你要调用的方法。对于动态分发的情况，编译器会将代码提交，等到运行时再判断该执行哪个方法。

当我们使用trait对象时，Rust必须使用动态分发。编译器无法提前预知使用了trait对象的代码中存在多少种类型，所以它也不知道对应的方法是什么。反之，Rust会在运行时使用trait对象内的指针来判断该执行的方法。这样的处理必然会导致动态分发的性能不如静态分发。动态分发也阻止了编译器将方法行内化处理，这也进一步阻碍了一些优化。然而，我们得确获得了额外的灵活性，所以这是一种权衡。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：和其他的OOP语言不同的是，一个trait对象无法“向下转换”为一个具体类型（除非是`Any`trait的情况）。

</template>
<template #quiz>

<IsCompileText />

```rust
use std::fmt::Debug;
fn main() {
    let n = 1;
    let s = String::from("Hello");
    let v: Vec<&dyn Debug> = vec![&n, &s];
    let n_ref = v[0] as &i32;
    println!("{}", n_ref + 1);
}
```

<IsCompile
  :answer="{
    compiled: false,
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：由于无需单态化，trait对象版本的函数的编译速度会更快，产物也会更小。但是，其运行时消耗会增大。trait对象也不会比trait边界带来更好的开发体验。

</template>
<template #quiz>

以下是两种泛型函数的不同实现：

```rust
fn f_opt1<T: SomeTrait>(t: &T) { /* ... */ }
fn f_opt2(t: &dyn SomeTrait) { /* ... */ }
```

在大部分情况下，以下哪些是选择`f_opt2`的理由？

<Checkbox>
<Option label="更小的产物体积" answer />
<Option label="更好的开发体验" />
<Option label="更快的编译时间" answer />
<Option label="更好的运行时性能" />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
