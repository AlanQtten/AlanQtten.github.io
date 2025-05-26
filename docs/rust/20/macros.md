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

# 宏

在本书中，我们一直在使用`println!`宏，但我们还没有介绍过什么是宏，以及它是如何工作的。*宏*这个术语在Rust里可以引申出一系列特性：使用`macro_rules!`的*陈述性*宏和三种*程序性*宏：

- 自定义的`#[derive]`宏用于在结构体和枚举上使用`derive`属性时，指定要自动添加的代码。
- 类属性的宏可以定义在任何元素上使用的属性。
- 类函数的宏看起来像函数调用，但它们操作的是作为参数传入的标记。

我们会按照顺序逐个介绍它们，但是首先，我们来看看为什么在已经有了函数的情况下，我们还需要宏。

## 宏和函数的不同

从本质上讲，宏是一种编写会生成其他代码的代码方式，这被称为*元编程（metaprogramming）*。在附录C，我们讨论了`derive`属性，它会帮你生成一系列的trait实现。我们在全书中还大量使用了`println!`和`vec!`。这些宏都会*展开*为更多代码，这些代码你也可以手写。

元编程对于减少需要手写和维护的代码量来说很有用，这些也是函数的职责。然而，宏有一些函数没有的能力。

一个函数签名必须定义其参数的数量和类型。而宏则可以接收可变数量的参数：我们可以传入一个参数调用`println!("hello")`，也可以传入两个参数调用`println!("hello {}", name)`。其次，宏还可以在编译器介入前展开，比如说，它可以为一个指定类型实现某个trait。而函数则不可以，因为它是在运行时被调用的，而trait需要在编译时实现。

宏对比函数有一个劣势，就是它要更加复杂，因为你基本上是在开发一些生成Rust代码的Rust代码。受此影响，宏的定义也比函数更难阅读、理解和维护。

宏和函数还有一个很重要的不同点：你必须在调用宏之*前*定义或引入它们，而函数的定义和调用可以在任何位置。

## 使用`macro_rules!`定义用于通用元编程的声明式宏

Rust里使用最广泛的就是*声明式宏*。它们有时候也被称呼为“举例来说的宏”，“`marco_rules!`宏”或者简单的“宏”。它们的核心是，声明式宏允许你写一些和Rust`match`表达式类似的东西。在第6章我们讨论过，`match`表达式是一种流程控制结构，它接收一个表达式，和模式表达式的结果比较，然后运行匹配分支里的代码。宏也会用值和特地代码相关联的模式进行匹配：在这种情况下，值就是指原始的Rust源码；而模式的关联代码，如果匹配成功，就会取代传入宏的代码。这个过程完全发生在编译时。

要定义一个宏，你需要使用`marco_rules!`结构。我们来看看如何使用`marco_rules!`定义`vec!`宏。在第8章我们介绍了如何使用`vec!`来创建一个包含特定值的集合。比如，下面的代码就创建了一个包含三个整数的集合：

```rust
let v: Vec<u32> = vec![1, 2, 3];
```

我们也可以使用`vec!`宏来创建一个包含两个整数的集合，或者包含五个字符串切片的集合。用函数无法实现类似的效果，因为我们无从知道入参的数量和类型。

下面就是一个简化版的`vec!`宏的定义：

```rust
#[marco_export]
marco_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

> [!NOTE]
> 标准库中实际的`vec!`定义包含一些预分配内存的代码。这里为了举例，我们简化了那部分代码。

`#[marco_export]`声明暗示了这个宏在其所属crate被引入的域内是可用的。没有这个声明，宏就不能被引入其他域。

然后我们使用了`marco_rules!`和宏的名字来定义宏，宏的名字*不包括*感叹号。这里的名字也就是`vec`，后面则是大括号包裹的宏的具体定义。

`vec!`内的结构和`match`的结构类似。这里我们只有一个模式，即`( $( $x:expr ),* )`，然后是`=>`以及一个和这个模式关联的代码块。如果模式匹配，那么关联的代码块会被执行。考虑到这个宏内只有一个模式，所以只有一种情况会被匹配；其他任何的模式都会报错。其他复杂的宏可能会有更多分支。

宏定义的模式语法和第19章讨论的模式语法不同，因为宏匹配的是Rust代码，而不是值。比如，声明式宏可以匹配表达式（`expr`），类型（`ty`），甚至整个元素（`item`）。我们会一一讲解这些部分的含义；如果想了解完整的宏匹配语法，可以查看[Rust 引用文档](https://doc.rust-lang.org/reference/macros-by-example.html)。

首先，我们使用了一对括号来包含整个模式。然后我们使用了美元符号（`$`）来表示一个宏系统里的变量，它包含了和模式匹配的Rust代码。美元符号会将宏变量和普通的Rust变量区分开来。接着是一组括号，用于捕获与括号内模式匹配的值，以便在替换代码中使用。在`$()`内的是`$x:expr`，它会匹配任何的Rust表达式，并命名为`$x`。

`$()`后面跟随的逗号代表一个真实的逗号，即在`$()`匹配的代码后可能会出现一个逗号分隔符。而`*`则表示该模式可以匹配零个或多个出现在`*`前面的内容。

当我们使用`vec![1, 2, 3];`调用这个宏时，`$x`模式会匹配到三个元素，也就是`1`，`2`和`3`。

然后我们来看看这个模式匹配到后运行的分支代码：`$()*`会逐个为`$()`匹配到的内容生成`temp_vec.push()`，其数量取决于真实匹配到的数量。`$x`会被替换为每个表达式匹配到的内容。当我们调用`vec![1, 2, 3];`时，宏会自动生成如下代码并进行替换：

```rust
{
    let mut temp_vec = Vec::new();
    temp_vec.push(1);
    temp_vec.push(2);
    temp_vec.push(3);
    temp_vec
}
```

我们定义了一个接收任意数量、任意类型参数的宏，且它能够生成创建包含指定元素集合的代码。

要了解更多宏开发的内容，你可以查看在线文档或者其他资源，比如Daniel Keep创建，Lukas Wirth贡献的[Rust宏小册（The Little Book of Rust Macros）](https://veykril.github.io/tlborm/)。

## 过程宏：从属性生成代码

第二种宏是*过程宏（procedural macro）*，它的行为更像函数（函数也是一种过程）。过程宏接收一部分代码作为入参，操作那部分代码，并生成一些代码作为输出，而不是像声明式宏那样匹配一些代码并替换。有三种声明式宏：自定义派生、类属性和类函数，它们的工作方式类似。

在创建过程宏时，它们必须被定义在单独的crate里，且其类型也需要很特殊。这里的技术原因很复杂，我们希望有一天能够克服。在下面的代码里，我们展示了如何定义一个过程宏，`some_attribute`是使用这种宏的占位符：

```rust
use proc_macro;

#[some_attribute]
pub fn some_name(input: TokenStream) -> TokenStream {
}
```

定义过程宏的函数需要接收一个`TokenStream`作为入参，且提供一个`TokenStream`作为返回值。`TokenStream`类型由Rust自带的`proc_macro`crate定义，用于表示一系列的标记（tokens）序列。这是宏的核心：宏所处理的源代码构成输入的`TokenStream`，而宏生成的代码则构成输出的`TokenStream`。该函数还带有一个属性，用于指定我们要创建的过程宏的类型。同一个crate中可以包含多种类型的过程宏。

我们来看看不同类型的过程宏。我们先来讲解一个自定义的派生宏，然后再解释它和其他形式间的细微差异。

## 如何开发一个自定义的`derive`宏

我们来开发一个名为`hello_macro`的crate，它定义了一个名为`HelloMacro`的trait，其包含一个名为`hello_macro`的关联函数。为了方便用户使用，无需为他们的每个类型实现`HelloMacro`trait，我们提供一个过程宏，这样用户可以在它们的类型上书写`#[derive(HelloMacro)]`来获取一个`hello_macro`函数的默认实现。它的默认实现会打印`Hello, Macro! My name is TypeName!`，`TypeName`就是这个trait定义类型的类型名。换句话说，我们开发的crate可以让开发者书写如下代码来使用：

```rust
use hello_macro::HelloMacro;
use hello_macro_derive::HelloMacro;

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro();
}
```

在我们完成后，运行这段代码会打印`Hello, Macro! My name is Pancakes!`。首先，我们需要创建一个新的crate库：

```bash
$ cargo new hello_macro --lib
```

接着，我们定义一个`HelloMacro`trait及其关联函数：

```rust
pub trait HelloMacro {
    fn hello_macro();
}
```

我们有了trait和函数。现在，用户可以实现这个trait来完成一些功能，比如：

```rust
use hello_macro::HelloMacro;

struct Pancakes;

impl HelloMacro for Pancakes {
    fn hello_macro() {
        println!("Hello, Macro! My name is Pancakes!");
    }
}

fn main() {
    Pancakes::hello_macro();
}
```

然而，用户需要在每一次想要使用`hello_macro`的类型上都写一些这样的实现；我们希望可以减轻这部分工作。

此外，我们也没有办法给`hello_macro`函数实现一个打印trait所属类型名的功能：Rust没有反射机制，所以我们无法在运行时查看类型名。我们需要宏来帮我们在编译时生成这部分代码。

下面我们来定义一个过程宏。目前，过程宏需要有独立的crate。我们最终会移除这个限制。结构化的crate和宏crate的命名习惯如下：对于一个名为`foo`的crate，其自定义的派生过程宏crate就会名为`foo_derive`。我们可以在`hello_macro`工程里创建一个新的crate，名为`hello_macro_derive`：

```bash
$ cargo new hello_macro_derive --lib
```

我们的两个crate关系紧密，因此我们把过程宏的crate放置在了`hello_macro`的目录下。如果我们修改`hello_macro`中的trait定义，我们也需要修改`hello_macro_derive`中的过程宏实现。这两个crate需要被单独发布，使用它们的开发者也需要分别引入。我们也可以直接让`hello_macro`依赖`hello_macro_derive`，并在其中重新导出过程宏。但是，我们这样做给予了用户选择不使用`derive`功能的权利。

要把`hello_macro_derive`定义为一个过程宏crate，需要`syn`和`quote`这两个crate的功能，所以我们需要将它们加入依赖。也就是`hello_macro_derive`的*Cargo.toml*文件：

```toml
[lib]
proc-macro = true

[dependencies]
syn = "2.0"
quote = "1.0"
```

要开始定义过程宏，将下面的代码放置在`hello_macro_derive`crate的*src/lib.rs*文件中。注意这段代码暂时无法编译，直到我们实现`impl_hello_macro`函数：

```rust
use proc_macro::TokenStream;
use quote::quote;

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    // 将Rust代码构造为语法树，方便后续操作
    let ast = syn::parse(input).unwrap();

    // 创建trait实现
    impl_hello_macro(&ast)
}
```

注意我们拆分了`hello_macro_derive`函数的代码，让它只负责转换`TokenStream`和对`impl_hello_macro`函数的调用，而`impl_hello_macro`函数则负责语法树的转换：这样可以让过程宏的开发更加便捷。外侧函数（也就是`hello_macro_derive`）的代码在你见过或写过的每个过程宏里几乎都一样。而内测函数（也就是`impl_hello_macro`）内的代码则取决于过程宏的具体目的。

我们这里涉及了三个新的crate：`proc_macro`，[`syn`](https://crates.io/crates/syn)和[`quote`](https://crates.io/crates/quote)。`proc_macro`来自Rust，所以我们无需在*Cargo.toml*中添加依赖。它是一些编译器的API，方便我们在代码中读写Rust代码。

`syn`crate由于将Rust代码由字符串转为我们可以操作的结构。`quote`crate可以将`syn`数据结构转换为Rust代码。这些crate让我们进行任何的代码处理都变得容易了许多：要知道，书写一个完整的Rust代码解析器可不简单。

`hello_macro_derive`函数会在用户为类型标注`#[derive(HelloMacro)]`时被调用。原因在于我们为`hello_macro_derive`函数添加了`proc_macro_derive`，且声明其名字为`HelloMacro`，对应我们的trait名；这是过程宏最流行的格式。

`hello_macro_derive`函数首先会将`input`从`TokenStream`转换为我们可以拦截和操作的数据结构。也就是`syn`发挥的作用。`syn`的`parse`函数接收一个`TokenStream`，然后返回一个`DeriveInput`，表示被转换的Rust代码。下面的代码展示了`struct Pancakes;`字符串被转换为`DeriveInput`后相关联的部分：

```rust
DeriveInput {
    // 略

    ident: Ident {
        ident: "Pancakes",
        span: #0 bytes(95..103)
    },
    data: Struct(
        DataStruct {
            struct_token: Struct,
            fields: Unit,
            semi_token: Some(
                Semi
            )
        }
    )
}
```

这个结构体的字段明确了，我们转换的Rust代码是一个元结构体，其标识`ident`（也就是标识符*identifier*的缩写，这里指结构体的名字）为`Pancakes`。这个结构体里还有各种各样的字段来描述各种各样的Rust代码；你可以在[`syn`文档里对`DeriveInput`的定义](https://docs.rs/syn/2.0.101/syn/struct.DeriveInput.html)中了解更多信息。

很快我们就会定义`impl_hello_macro`函数，也就是我们创建新的Rust代码的地方。但在那之前，注意派生宏的输出也是`TokenStream`。返回的`TokenStream`会作为新的代码插入到用户的代码里，当它们编译代码时，就可以获取来自被调整过的`TokenStream`里的功能。

你也许注意到了我们调用了`unwrap`函数来触发`hello_macro_derive`函数的崩溃，如果其对`syn::parse`的调用发生了错误。过程宏在适当情况下崩溃出错是很有必要的，因为`proc_macro_derive`，过程宏函数API规定其必须返回`TokenStream`，而不是`Result`。我们使用了`unwrap`来简化这个例子；在生产级的代码里，你应当使用`panic!`或`expect`来提供更具体的错误信息。

现在我们已经有了可以将Rust代码从`TokenStream`转换为`DeriveInput`实例的代码，我们来开发自动为标注类型实现`HelloMacro`的代码：

```rust
fn impl_hello_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let gen = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}!", stringify!(#name));
            }
        }
    };
    gen.into()
}
```

我们使用`ast.ident`获取了包含指定类型名（标识符）的`Ident`结构体实例。通过之前的代码我们可以得知，这里的`ident`的`ident`值为`"Pancakes"`。因此，`name`变量会包含一个`Ident`结构体实例，它在打印时就是`"Pancakes"`，也就是被标注结构体的名字。

`quote!`结构体也提供了一些非常酷的模版机器：我们可以使用`#name`，`quote!`会将其替换为`name`变量的值。你甚至可以像常规宏一样进行一些重复操作。你可以查看[`quote`的文档](https://docs.rs/quote/latest/quote/)来了解详细信息。

我们希望我们的过程宏能为用户标注的类型实现`HelloMacro`trait，也就是我们用`#name`获取的名字。trait的实现包括一个函数`hello_macro`，它的函数体包括了我们想要提供的功能：打印`Hello, Macro! My name is`，然后拼接上标注类型的名字。

这里使用的`stringify!`宏是Rust内置的。它接收一个Rust表达式，比如`1 + 2`，在编译时，这个表达式会被转化为一个字符串字面量，比如`"1 + 2"`。它和`format!`或者`println!`不同，这些字符串会运行表达式，并将其结果转为`String`。`#name`输入有可能是一个要原样打印的表达式，因此我们使用`stringify!`。使用`stringify!`还能在编译期将`#name`转换为字符串字面量，从而避免一次内存分配。

到了这个节点，对`hello_macro`和`hello_macro_derive`的`cargo build`都可以完全成功了。我们可以把这些crate关联起来，来看看过程宏的工作方式！你可以在你的*projects*目录下使用`cargo new pancakes`目录创建一个新的二进制工程。我们需要把`hello_macro`和`hello_macro_derive`作为依赖放置在`pancakes`的*Cargo.toml*文件里。如果你把你的`hello_macro`和`hello_macro_derive`版本发布到了[crates.io](https://crates.io/)上，那么它们就是常规的依赖；如果没有，那么你需要手动指定目录：

```toml
hello_macro = { path = "../hello_macro" }
hello_macro_derive = { path = "../hello_macro/hello_macro_derive" }
```

将之前的代码放置在*src/main.rs*里，然后运行`cargo run`：它应该会打印`Hello, Macro! My name is Pancakes!`。`HelloMacro`trait的实现会自动实现，无需`pancakes`crate实现它；`#[derive(HelloMacro)]`添加了trait的实现。

下面，我们来看看其它的过程宏和自定义派生宏的不同点。

## 类属性宏

类属性宏和自定义派生宏类似，但它不是用于为`derive`属性生成代码，而是允许你创建新的属性。它们也更加灵活：`derive`只能作用于结构体和枚举；属性则适用于其他元素，比如函数。下面是一些使用类属性宏的例子：假设你有一个属性`route`，它用于一些网络框架的函数：

```rust
#[route(GET, "/")]
fn index() {
```

`#[route]`属性会被框架定义为一个过程宏。宏的函数签名类似下面的结构：

```rust
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
```

这里，我们有两个`TokenStream`类型的参数。第一个是属性的内容，也就是`GET, "/"`的部分。第二个则是属性标注的元素内容，也就是`fn index() {}`及其函数体。

除此以外，类属性宏的工作方式和自定义派生宏完全一样：你可以使用`proc-macro`crate来自由生成你想要的代码！

## 类函数宏

类函数宏定义的宏和函数的调用很像。和`macro_rules!`类似，它们比普通的函数更加灵活；比如，它们可以接受不定数量的参数。然而，`macro_rules!`宏只能使用类似match的语法来定义，这一点我们在前面介绍过。而类函数的宏接收一个`TokenStream`作为入参，同时也可以像其他两种过程宏一样操作Rust代码。下面就是一个类函数宏`sql!`的例子：

```rust
let sql = sql!(SELECT * FROM posts WHERE id=1);
```

这个宏会转换其中的SQL语句，检查其语法是否正确，这可比`macro_rules!`要复杂的多。`sql!`宏的定义类似下面的结构：

```rust
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
```

这个定义类似于自定义派生宏的签名：我们接收了代码，并返回了我们想要生成的代码。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：`manylet`宏的语法会重复表达式`e`，将其绑定给等号左侧的每个变量。然而，`s`是一个含所有权的字符串，第一次绑定会将`x`移动到`s`，第二次绑定就是无效的。

</template>
<template #quiz>

<IsCompileText />

```rust
macro_rules! manylet {
    ( $( $i:ident ),* = $e:expr ) => {
        $(
            let mut $i = $e;
        )*
    }
}

fn main() {
    let mut s = String::from("A");
    manylet!(x, y = s);
    x.push_str("B");
    println!("{x}{y}");
}
```

<IsCompile
  :answer="{
    compiled: false
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：过程宏是唯一一种创建自定义派生的方式。过程宏对于需要分析宏使用者的语法的场景来说也很有用————声明式宏只能对输入进行永久性的混淆，无法进行大小的计算。

声明式宏可以生成不定长度的代码，它也可以包含/处理完整元素，而不仅仅是表达式。

</template>
<template #quiz>

以下哪些选项是使用过程宏而不是声明式宏的原因？

<Checkbox>
<Option label="你想生成可变长度的代码" />
<Option label="你想和Rust的派生系统整合" answer />
<Option label="你的宏需要一整个元素作为输入，而不是一个表达式" />
<Option label="你的宏需要和宏使用者的语法不同的分析语法" answer />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：过程宏接收的输出（以及输出）都是标记流。你可以使用类似`syn`这样的crate来将其转为语法树。

</template>
<template #quiz>

以下那个选项对过程宏的输入描述得最准确？

<Radio>
<Option label="其入参是抽象语法树" />
<Option label="其入参是字节码" />
<Option label="其入参是一系列标记" answer />
<Option label="其入参是有类型的流程控制图" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::

## 总结

呼！现在你有了一些你可能不会经常使用，但在特殊情况下十分有用的Rust特性了。我们介绍了许多复杂的场景，这样当你在错误信息的建议或者其他人的代码里看到它们时，你就有能力识别这些概念和语法了。这一章可以作为你解决问题的索引。

下面，我们将本书中介绍过的所有内容付诸实践，再来做一个项目！
