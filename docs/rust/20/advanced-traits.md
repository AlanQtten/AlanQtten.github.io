<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  Checkbox,
  Radio,
  Option
} from "../../components/quiz"
</script>

# Traits进阶

我们在第十章介绍了Traits的基本概念和用法，但我们没有讨论更多进阶的细节。现在你对Rust有了更多了解，我们可以深入挖掘一下Trait了。

## 在包含关联类型的Trait定义中声明占位类型

*关联类型（Associated type）*将类型占位符和trait连接了起来，从而使trait的方法定义可以在它们的签名中使用这些占位类型。trait的实现者会指定一个确定的类型供特定的实现使用。通过这种方式，我们就能定义一个支持一部分未知的、直到实现时才会确定类型的trait了。

本章中讨论的大部分内容都很少用到。而关联类型大概属于中部区域：它的使用频率比本书中讨论的大部分特性都要低，但比本章中讨论的特性要高。

一个典型的在trait里使用关联类型的例子就是标准库提供的`Iterator`trait。它的关联类型名为`Item`，表示`Iterator`迭代元素的类型。`Iterator`trait的定义如下：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

`Item`类型是一个占位符，而`next`方法的定义表示了其返回类型为`Option<Self::Item>`。`Iterator`trait的实现者会指定`Item`为一个确定类型，`next`方法会返回一个包裹了这个确定类型的`Option`。

关联类型看起来可能很像泛型，的确泛型允许我们定义一个函数而不指定其可以处理的具体类型。为了阐述清楚这两个概念的区别，我们来看一个例子，下面是为`Counter`实现`Iterator`trait且指定`Item`为`u32`的代码：

```rust
impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        // 略
```

这些语法似乎和泛型很类似，那我们何不将`Iterator`trait直接改为泛型的格式呢？代码如下：

```rust
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}
```

区别在于，在使用泛型时，我们需要为各个实现注明类型；由于我们可以实现`Iterator<String> for Counter`或者其他任何类型，`Counter`就有了个多个版本的`Iterator`实现。换句话说，当一个trait有泛型参数时，它可以为一个类型实现多次，每一次使用不同的确定类型来作为泛型类型参数。当我们使用`Counter`的`next`方法时，我们需要提供类型标注来明确我们希望使用哪个`Iterator`实现。

而使用关联类型时，我们不需要类型标注，因为我们无法多次实现包含关联类型的trait。在上面这种使用了关联类型的代码里，我们只能选择一次`Item`的类型，因为我们只能进行一次`impl Iterator for Counter`。所以我们不需要在每次调用`Counter`的`next`方法时都标注`u32`类型。

关联类型也变为了trait合约的一部分：trait的实现者必须提供一个类型来插入关联类型槽。关联类型通常有一个名字来描述类型是如何被使用的，在API文档里对关联类型进行标准说明也是好的实践。

## 默认泛型类型参数和运算符重载

在我们使用泛型类型参数时，我们可以为泛型类型指定一个默认的类型。这样如果默认类型满足，实现者就可以省去类型的指定。你可以使用类似`<PlaceholderType=ConcreteType>`这样的语法。

一个这种方式很实用的例子就是*运算符重载（operator overloading）*，即你可以自定义运算符的行为（比如`+`）。

Rust不允许你创建自己的运算符，或者重载抽象运算符。但是你可以通过实现和运算符关联的trait重载其操作和列在`std::ops`里的trait。比如，下面的代码里我们通过给`Point`结构体实现了`Add`trait重载了`+`操作符，让两个`Point`实例可以相加：

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    assert_eq!(
        Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
        Point { x: 3, y: 3 }
    )
}
```

`add`方法将连个`Point`实例的`x`和`y`分别相加，创建了一个新的`Point`。`Add`trait有一个名为`Output`的关联类型，它明确了`add`方法的返回类型。

在`Add`trait的声明里设置了默认泛型类型，代码如下：

```rust
trait Add<Rhs=Self> {
    type Output;

    fn add(self, rhs: Rhs) -> Self::Output;
}
```

这段代码看起来应该很熟悉：一个只有一个方法和一个关联类型的trait。新的部分是`Rhs=Self`：这种语法被称为*默认类型参数*。`Rhs`泛型类型参数（是“right hand side”的缩写）用在了`add`方法的`rhs`参数上。如果我们没有为`Rhs`指定类型，那么我们实现`Add`时`Rhs`的类型就是`Self`，也就是我们要实现`Add`的类型。

当我们给`Point`实现`Add`时，我们使用了`Rhs`的默认值，因为我们希望实现的是两个`Point`实例的相加。我们来再看一个实现`Add`且自定义`Rhs`类型的例子。

假设我们有两个结构体，`Millimeters`和`Meters`，它们分别持有不同单位的数据。这种将现有类型薄薄地包装在另一个结构体中的做法称为*新类型模式（newtype pattern）*，我们会在后面讲到。我们希望将毫米值和米值进行相加，且将具体的转化交给`Add`实现。我们可以为`Millimeters`实现`Add`，然后给`Rhs`赋值为`Meters`，代码如下：

```rust
use std::ops::Add;

struct Millimeters(u32);
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
```

要将`Millimeters`和`Meters`相加，我们需要指定`impl Add<Meters>`，这样就可以手动设置`Rhs`的值，而非使用默认的`Self`。

默认的类型参数主要在以下两种情况下有用：

- 不破坏原有代码的情况下扩展类型
- 允许在少数极端情况下的自定义行为

标准库的`Add`trait就是符合第二条目的的例子：通常来说，你会选择相加两个相同的类型，但`Add`trait允许你自定义更复杂的行为。`Add`trait中定义默认类型参数确保了你在大部分情况下无需指定类型。换句话说，一些模板化的代码就不需要了，trait的使用变得更加简单。

第一个目的和第二个目的相似又相反：如果你想给现有trait添加类型参数，你可以给其添加一个默认值，这样现有的代码就可以保持现状。

## 消除歧义的完全限定语法：调用同名方法

Rust中没有任何设计来避免一个trait的方法名和其他trait重复，Rust也不会阻止你为同一个类型实现这样的两个trait。在类型上直接添加一个和已实现trait方法同名的方法也不会有任何问题。

在调用同名方法时，你需要告诉Rust你要调用的是哪个方法。如下代码中定义了两个trait，`Pilot`和`Wizard`，它们都有`fly`方法。接着我们给`Human`实现了这两个trait，且`Human`已经定义了`fly`方法。每一个`fly`方法的行为都各不相同。

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}
```

当我们调用`Human`实例的`fly`方法时，编译器会默认调用直接实现在类型本身上的方法，代码如下：

```rust
fn main() {
    let person = Human;
    person.fly();
}
```

运行这段代码会打印`*waving arms furiously*`，也就表示Rust调用了直接实现在`Human`上的`fly`方法。

要调用`Pilot`或`Wizard`trait上的`fly`方法，我们需要使用更显式的语法来指明我们想要调用的是哪一个`fly`方法，下面就是这种语法的展示：

```rust
fn main() {
    let person = Human;
    Pilot::fly(&person);
    Wizard::fly(&person);
    person.fly();
}
```

在方法名前指定trait的名字可以让Rust明确该调用的是哪个`fly`的实现。我们也可以写`Human::fly(&person)`，它和`person.fly()`是等价的，但这样会有点啰嗦，因为对于这种调用并没有歧义。

运行这段代码，输出如下：

```
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.46s
     Running `target/debug/traits-example`
This is your captain speaking.
Up!
*waving arms furiously*
```

由于`fly`方法接收一个`self`作为参数，如果我们有两个实现了同一个trait的类型，Rust就可以根据`self`的类型来推导出应该调用哪一个trait实现。

然而，关联函数和方法不同，它们没有`self`参数。如果有多个类型或trait使用相同的名字定义了非方法的函数，Rust并不总能推断出你表达的意思，除非你使用*完全限定语法（fully qualified syntax）*。比如，下面的代码我们为一个动物庇护所创建了一个trait，它想要将所有的小狗都叫做*Spot*。所以我们创建一个`Animal`trait，它有一个关联的非方法函数`baby_name`。而结构体`Dog`实现了`Animal`trait，它也有一个关联的非方法函数`baby_name`。

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", Dog::baby_name());
}
```

我们实现这段代码的目的是通过`Dog`的关联函数`baby_name`来将所有小狗命名为Spot。而`Dog`实现了`Animal`trait，后者用于描述所有动物都有的性格。根据`Animal`trait的关联函数`baby_name`，一群小狗可以被叫做*puppies*。

在`main`函数里，我们调用了`Dog::baby_name`函数，它被直接定义在了`Dog`上。代码输出如下：

```
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.54s
     Running `target/debug/traits-example`
A baby dog is called a Spot
```

这样的输出和预期不符。我们原以为会被调用的`Dog`实现的`Animal`trait上的方法`baby_name`，打印`A baby dog is called a puppy`。指定trait名的技术在这里没有任何帮助；如果我们把代码改为如下形式，我们会看到一个编译错误：

```rust
fn main() {
    println!("A baby dog is called a {}", Animal::baby_name());
}
```

由于`Animal::baby_name`没有`self`参数，且有可能存在其他类型实现了`Animal`trait，Rust无法推断出我们想找的是哪一个`Animal::baby_name`实现。我们会看到如下编译错误：

```
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
error[E0790]: cannot call associated function on trait without specifying the corresponding `impl` type
  --> src/main.rs:20:43
   |
2  |     fn baby_name() -> String;
   |     ------------------------- `Animal::baby_name` defined here
...
20 |     println!("A baby dog is called a {}", Animal::baby_name());
   |                                           ^^^^^^^^^^^^^^^^^^^ cannot call associated function of trait
   |
help: use the fully-qualified path to the only available implementation
   |
20 |     println!("A baby dog is called a {}", <Dog as Animal>::baby_name());
   |                                           +++++++       +

For more information about this error, try `rustc --explain E0790`.
error: could not compile `traits-example` (bin "traits-example") due to 1 previous error
```

为了消除歧义，告诉Rust我们想要使用的是`Dog`的`Animal`实现，而不是其他类型，我们需要使用完全限定语法。下面的代码展示了如何使用完全限定语法：

```rust
fn main() {
    println!("A baby dog is called a {}", <Dog as Animal>::baby_name());
}
```

我们给Rust提供了尖括号包裹的类型标注，表示了我们想要在这个函数调用里将`Dog`类型看作`Animal`类型，进而使用`Dog`实现的`Animal`trait的`baby_name`方法。这段代码会按我们希望的方式打印：

```
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/traits-example`
A baby dog is called a puppy
```

总得来说，完全限定语法可以定义为如下格式：

```rust
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

对于非方法的关联函数来说，不会有`receiver`：只有参数列表。你可以在任何你想调用函数或者方法的地方使用完全限定语法。然而，你可以省去任何Rust可以通过程序的其他部分推导得出的部分。你只需要在对同一个名称存在多个实现的地方使用这种啰嗦的语法，以帮助Rust明确你要调用是哪个实现。

## 使用supertrait来要求一个trait包含另一个trait的功能

有时候，你可能需要开发一个依赖其他trait的trait：对那些实现你trait的类型，你希望它们也实现了第二个trait。这样你的trait定义就可以使用第二个trait关联的元素了。你的trait所依赖的trait被称为你的trait的*supertrait*。

比如，我们希望开发一个包含`outline_print`方法的`OutlinePrint`trait，它会将给定参数的格式化用星号装饰后打印。比如，一个实现了标准库`Display`trait的`Point`结构体会打印为`(x, y)`，如果我们调用`Point`实例的`outline_print`方法时，`x`为`1`，`y`为`3`，打印出的结果为：

```
**********
*        *
* (1, 3) *
*        *
**********
```

在`outline_print`方法的实现里，我们想使用`Display`trait的功能。因此，我们需要指定`OutlinePrint`trait只能作用于那些同时实现了`Display`的类型。我们可以通过在trait的定义里指定`Outline: Display`来确保这一点。这种方式和给trait添加trait边界类似。下面的代码展示了`OutlinePrint`trait的实现：

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {output} *");
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}
```

由于我们已经指定了`OutlinePrint`依赖`Display`trait，我们就可以像任何实现了`Display`的类型一样使用其自动实现的`to_string`函数了。如果我们没有在trait名后添加冒号和`Display`trait而强行使用`to_string`方法，我们就会看到一个报错表示当前作用域下的类型`&Self`不存在`to_string`方法。

让我们看看如果我们试图给一个没有实现`Display`的类型实现`OutlinePrint`trait会发生什么，比如`Point`结构体：

```rust
struct Point {
    x: i32,
    y: i32,
}

impl OutlinePrint for Point {}
```

我们会看到一个需要`Display`但其未实现的报错：

```
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
error[E0277]: `Point` doesn't implement `std::fmt::Display`
  --> src/main.rs:20:23
   |
20 | impl OutlinePrint for Point {}
   |                       ^^^^^ `Point` cannot be formatted with the default formatter
   |
   = help: the trait `std::fmt::Display` is not implemented for `Point`
   = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
note: required by a bound in `OutlinePrint`
  --> src/main.rs:3:21
   |
3  | trait OutlinePrint: fmt::Display {
   |                     ^^^^^^^^^^^^ required by this bound in `OutlinePrint`

error[E0277]: `Point` doesn't implement `std::fmt::Display`
  --> src/main.rs:24:7
   |
24 |     p.outline_print();
   |       ^^^^^^^^^^^^^ `Point` cannot be formatted with the default formatter
   |
   = help: the trait `std::fmt::Display` is not implemented for `Point`
   = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
note: required by a bound in `OutlinePrint::outline_print`
  --> src/main.rs:3:21
   |
3  | trait OutlinePrint: fmt::Display {
   |                     ^^^^^^^^^^^^ required by this bound in `OutlinePrint::outline_print`
4  |     fn outline_print(&self) {
   |        ------------- required by a bound in this associated function

For more information about this error, try `rustc --explain E0277`.
error: could not compile `traits-example` (bin "traits-example") due to 2 previous errors
```

要修复这一点，我们就需要给`Point`实现`Display`，满足`OutlinePrint`的约束，代码如下：

```rust
use std::fmt;

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
```

然后给`Point`实现`OutlinePrint`的代码就可以正常编译了，我们就可以调用`Point`实例的`outline_print`方法来显示一个星号包围的输出。

## 使用新类型模式来在外部类型上实现外部Traits

在第十章，我们提到过孤儿规则，即我们只允许在trait或类型存在于我们的crate本地时为一个类型实现trait。但其实使用*新类型模式（newtype pattern）*可以绕开这个限制，它使用的方法是创建一个元组结构体包裹的新类型（我们在第五章介绍过元组结构体。）元组结构体只有一个字段，它会给我们想要实现的类型进行一层薄薄的包裹。*新类型*是一个源自Haskell的术语。由于包裹类型会在编译时被移出，所以这样的模式不会造成任何潜在的运行时性能损耗。

举个例子来说，假设我们想给`Vec<T>`实现`Display`，而孤儿规则禁止我们直接这么做，因为`Display`trait和`Vec<T>`都是在我们的crate外被定义的。我们可以创建一个`Wrapper`结构体，它会持有`Vec<T>`实例；然后我们可以为`Wrapper`实现`Display`，并且使用`Vec<T>`的值，代码如下：

```rust
use std::fmt;

struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {w}");
}
```

这里`Display`的实现使用`self.0`来访问内部的`Vec<T>`，因为`Wrapper`是一个元组结构体，而`Vec<T>`就是元组内下标为0位置的元素。然后我们就可以使用`Wrapper`所实现的`Display`trait的功能了

使用这种模式的劣势是由于`Wrapper`是一个新类型，所以它没有其持有类型的方法。我们得在`Wrapper`上直接实现所有`Vec<T>`的方法，将其托管给`self.0`，这样我们才能像对待`Vec<T>`一样对待`Wrapper`。如果我们希望新的类型拥有其内部类型的所有方法，我们可以在`Wrapper`上实现`Deref`trait，然后返回内部类型。如果我们不希望`Wrapper`类型拥有内部类型的所有方法————比如，`Wrapper`类型的行为需要被限制————我们就需要手动地一一实现我们想要的方法。

这种新类型模式对于非当前域的trait来说也很有用。我们来换个视角，看一些高级地和Rust的类型系统交互的方式。

::: details 小测（4）
<QuizProvider>
<Quiz>
<template #description>

解析：关联类型现在是无法有默认值的，但那并不是Rhs在Add内作为类型参数存在的主要影响因素。

</template>
<template #quiz>

回顾`Add`trait的定义：

```rust
trait Add<Rhs=Self> {
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

以下哪一个描述最好地解释了为什么`Output`是一个关联类型，而`Rhs`是一个类型参数

<Radio>
<Option label="类型T可以和很多其他的类型S进行相加，但给定的T + S的操作返回值类型是单一的" answer />
<Option label="一个trait只能有一个关联类型，所以Rhs必须是Add的类型参数" />
<Option label="关联类型不能有默认值，而trait的类型参数可以有默认值" />
<Option label="相加操作接收一个Rhs作为输入，然后提供一个Output作为输出，而类型参数作为输入，关联类型作为输出" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这样的设计并不合理，因为`add<Rhs>`没有任何关于Rhs结构的信息，自然也就无法基于此开发任何关联的相加函数。

</template>
<template #quiz>

回顾`Add`trait的定义：

```rust
trait Add<Rhs=Self> {
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

以下哪一个描述最好地解释了为什么`Output`是一个关联类型，而`Rhs`是一个类型参数？即`Add`为什么没有被设计为如下格式？

```rust
trait Add {
    type Output;
    fn add<Rhs>(self, rhs: Rhs) -> Self::Output;
}
```

<Radio>
<Option label="当Rhs是一个trait层级的类型参数而不是一个函数层级的类型参数时，借用检查器的执行效率更高" />
<Option label="Rhs作为函数层级的类型参数不能有默认值" />
<Option label="对于add函数，函数层级的类型参数需要额外的时间来生成单态化代码" />
<Option label="如果Rhs是一个函数层级的类型参数，那么add的定义就无法推断Rhs的任何结构" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：当两个重名函数所属的trait只有一个被导入时，Rust会使用被导入的那个实现。完全限定语法在这里是不需要的。

</template>
<template #quiz>

<IsCompileText />

```rust
mod inner {
    pub trait A {
        fn f(&self) -> usize { 0 }
    }
    pub trait B {
        fn f(&self) -> usize { 1 }
    }
    pub struct P;
    impl A for P {}
    impl B for P {}
}
fn main() {
    use inner::{P, B};
    println!("{}", P.f());
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

解析：孤儿原则规定在trait和类型均为外部时，无法为这个类型实现这个trait，因此才需要新类型模式。如果trait和类型任一被定义在本地，那么就无需使用新类型模式。

</template>
<template #quiz>

如果我们要为一个类型`T`实现trait`Trait`，以下哪些情况下我们需要将`T`包裹入新类型？

<Checkbox>
<Option label="Trait被定义在本地crate里，T被定义在本地crate里" />
<Option label="Trait被定义在本地crate里，T被定义在外部crate里" />
<Option label="Trait被定义在外部crate里，T被定义在外部crate里" answer />
<Option label="Trait被定义在外部crate里，T被定义在本地crate里" />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
