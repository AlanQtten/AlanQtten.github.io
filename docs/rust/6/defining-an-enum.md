<script setup>
import {
  Wrapper,
  MemoryGraph
} from "../../components/memory-graph"
import {
  QuizProvider,
  Quiz,
  IsCompile,
  IsCompileText,
  Radio,
  Option
} from "../../components/quiz"
</script>

# 定义枚举

结构体给予了开发者聚合字段和数据的能力，比如`Rectangle`聚合了`width`和`height`，而枚举则是一种表述值的所有可能性的方式。比如，`Rectangle`就是图案的一种，而`Circle`，`Triangle`也是。Rust允许开发者将这些可能性穷举为枚举。

让我们来看一个枚举可能比结构体更加合适的情况。假设我们需要对IP地址进行某种开发。当前，主流的IP地址格式是IPV4和IPV6。由于它们是我们的代码需要处理的IP地址的所有可能性，我们可以*穷举*所有可能的变体，也就是枚举项的名字。

任何的IP地址要么是IPV4，要么是IPV6，但不会同时是两种格式。IP地址的这种属性使得枚举结构更加合适，因为一个枚举的值只能是其唯一变体。而这两种格式都是基本的IP地址格式，所以它们应该被看做是相同的类型，当程序要处理IP地址时，它应当能够各种类型的IP地址。

我们可以定义一个名为`IpAddrKind`的枚举，并穷举所有的可能性：`V4`和`V6`：

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

现在，`IpAddrKind`是一个自定义类型了，我们可以在其他地方使用它。

## 枚举值

我们可以创建两个`IpAddrKind`的实例：

```rust
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
```

注意枚举的变体是处在其定义者的命名空间下的，我们使用两个冒号来分割它们。现在，`IpAddrKind::V4`和`IpAddrKind::V6`都是`IpAddKind`类型了。后续我们可以定义接收`IpAddrKind`类型的函数了：

```rust
fn route(ip_kind: IpAddrKind) {}
```

在调用这个函数时，我们可以使用变体：

```rust
    route(IpAddrKind::V4);
    route(IpAddrKind::V6);
```

使用枚举的好处非常多。继续思考我们的IP地址类型，现在我们暂时没有存储实际的IP地址*数据*，我们只是知道了IP地址的*类型*。假如你已经学过了第5张的结构体，你可能会写出下面的代码来解决问题：

<Wrapper>
<template #code>

```rust
enum IpAddrKind {
    V4,
    V6,
}

struct IpAddr {
    kind: IpAddrKind,
    address: String,
}

let home = IpAddr {
    kind: IpAddrKind::V4,
    address: String::from("127.0.0.1"),
};

let loopback = IpAddr {
    kind: IpAddrKind::V6,
    address: String::from("::1");
}; /*[!flag L1]*/
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'home',
            point2: 0,
            forceShowDetail: true,
            detail: {
              title: 'IpAddr',
              body: [
                { name: 'kind', value: 'V4' },
                { name: 'address', point2: 0 },
              ]
            }
          },
          {
            key: 'home',
            point2: 1,
            forceShowDetail: true,
            detail: {
              title: 'IpAddr',
              body: [
                { name: 'kind', value: 'V6' },
                { name: 'address', point2: 1 },
              ]
            }
          }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1','2','7','.','0','.','0','.','1'] },
      { id: 1, value: [':', ':', '1'] }
    ]
  }"
/>
</template>
</Wrapper>

这里我们定义了一个结构体`IpAddr`，它有两个字段；`kind`的类型是`IpAddrKind`（我们之前定义的枚举），而`address`的类型是`String`。然后我们基于这个结构体创建了两个实例。第一个是`home`，它的`kind`为`IpAddrKind::V4`，`address`值绑定为了`127.0.0.1`。第二个实例是`loopback`，它的`kind`事`IpAddrKind`的另一个变体，`V6`，而它的`address`值为`::1`。我们使用了结构体来将`kind`和`address`数据进行了捆绑，现在变体和值有所关联了。

然而，如果能仅使用枚举就表示这些概念，不是更简便吗？比起在结构体中实例化枚举，我们可以直接在每个枚举变体中声明数据。这个新的枚举定义，`IpAddr`，表示了`V4`、`V6`变体和`String`值的关联关系：

<Wrapper>
<template #code>

```rust
enum IpAddr {
    V4(String),
    V6(String),
}

let home = IpAddr::V4(String::from("127.0.0.1"));

let loopback = IpAddr::V6(String::from("::1")); /*[!flag L1]*/
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'home', point2: 0, pointerWrap: ['V4(', ')'] },
          { key: 'loopback', point2: 1, pointerWrap: ['V6(', ')'] },
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1','2','7','.','0','.','0','.','1'] },
      { id: 1, value: [':',':','1'] }
    ]
  }"
/>
</template>
</Wrapper>

我们将数据直接附近在了枚举的变体上，无需定义额外的结构体。这里也能看到另一个枚举工作原理的细节：枚举变体的名字也会变成函数，用来构造枚举实例。也就是说，`IpAddr::V4()`是一个函数，它接收一个`String`类型的参数，返回一个`IpAddr`实例。定义枚举时，我们就可以自动获得这种构造器。

枚举对比结构体还有另一个优势：每一个变体可以拥有不同的类型，持有不同的数据。比如，IPV4总是由四个0~255的数字组成。如果我们希望将`V4`的地址以四个`u8`值的形式存储，而`V6`仍然使用`String`值，我们无需使用结构体，枚举就能处理这种情况：

<Wrapper>
<template #code>

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);

let loopback = IpAddr::V6(String::from("::1")); /*[!flag L1]*/
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'home',
            forceShowDetail: true,
            detail: {
              title: 'V4',
              body: [{ value: ['127','0','0','1'] }]
            }
          },
          {
            key: 'loopback',
            point2: 0,
            pointerWrap: ['V6(', ')']
          }
        ]
      }
    ],
    heap: [
      { id: 0, value: [':',':','1'] }
    ]
  }"
/>
</template>
</Wrapper>

我们已经展示了不少定义数据结构并存储IPV4和IPV6的地址的方法了。实际上，存储IP地址非常常见，所以有一个标准库可以直接使用！让我们来看看标准库是如何定义`IpAddr`的：它定义的枚举和变体跟我们定义的类似，但它将地址使用不同的结构体包裹，然后在嵌入不同的变体中：

```rust
struct Ipv4Addr {
    // 略
}

struct Ipv4Addr {
    // 略
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

以上代码说明了你可以在枚举变体中放置任何类型的数据：字符串、数字、结构体，等等等等。你甚至可以放入另一个枚举！同时，标准库其实并没有你想象的那么复杂。

尽管标准库包含了对`IpAddr`的定义，我们仍然可以自己创建并使用，因为我们没有在域中导入标准库的类型。这部分我们会在第七章讨论。

让我们再看一个枚举的例子：这个枚举的类型非常多样：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

这个枚举的四个变体有四种类型：

- `Quit`没有绑定任何数据。
- `Move`绑定了具名字段，类似结构体。
- `Write`包括了字符串`String`。
- `ChangeColor`包括了三个`i32`值。

定义多个变体的枚举和定义多个结构体没什么不一样，只是枚举不用`struct`关键字，且所有的变体都在`Message`类型下进行聚合。下面就是和`Message`枚举具备相同功能的结构体定义：

```rust
struct QuitMessage; // 单元结构体
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // 元组结构体
struct ChangeColorMessage(i32, i32, i32); // 元组结构体
```

但如果我们使用了结构体，它们就是四个不同的类型，我们无法定义一个可以轻松接受所有类型通知的函数，而`Message`枚举是一个单一类型，它就可以做到。

结构体和枚举还有一个相似的点：就像我们能够使用`impl`来为结构体定义方法一样，我们也可以为枚举定义方法。下面就是为`Message`枚举定义`call`方法的过程：

```rust
    impl Message {
        fn call(&self) {
            // 方法体
        }
    }

    let m = Message::Write(String::from("hello"));
    m.call();
```

方法体可以使用`self`来访问调用方法的实例。在这个例子里，我们创建了变量`m`，它的值为`Message::Write(String::from("hello"))`，也就是我们调用`m.call()`时`self`的值。

让我们再看一个标准库中十分实用的枚举：`Option`。

## `Option`枚举和它对于空值的优势

这一节会讨论和学习`Option`，这也是一个标准库提供的枚举。`Option`类抽象了一种十分常见的情景：一个值可能为某值或什么也不是。

比如，如果你想访问一个非空列表的第一个元素，你会得到值。但如果你访问一个空列表的第一个元素，你什么也得不到。这个概念的简化使得编译器可以协助检查你有没有处理你应该考虑到的所有情况；这样的功能可以极大程度地避免其他编程语言中常见的一些bug。

编程语言的设计常常关注在包含那些特性，但排除哪些特性也是十分重要的。Rust不包含许多语言有的null功能。*Null*表示没有任何值的值。在那些包含null的语言中，变量可以处于两种状态：null（空）和not-null（非空）。

Tony Hoare在他2009年的文章“Null References: The Billion Dollar Mistake”（空引用：一个价值十亿美元的设计失误）中写道：

> 我把它叫做浪费了十亿美元的设计失误。那时，我希望能为面向对象语言设计第一个面面俱到的类型系统。我的目标是通过编译器的自动检查来确保所有引用的使用都是绝对安全的。但我没有抵挡住设计一个空引用的诱惑，仅仅只是因为它太好实现了。这个设计最终导致了数不尽的错误、黑客估计和系统崩溃，我想大概花费了十亿美元，在过去的四十年里造成了数不尽的破坏。

null值的问题在于，如果你把一个空值当做非空值来使用，你会收到各种各样的错误。因为这种空/非空问题在代码中十分常见，随之而来的就是极易引发的错误。

然而，null视图表达的概念还是有用的：null表示值当前无效或者由于某种原因暂时为空。

这种概念并不是真正的问题，问题在于实现。因此，Rust没有引入null值，但它拥有能够用枚举来表示值有无得的概念。这个枚举就是`Option<T>`，下面是它在标准库中的定义：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`Option<T>`常用到它已经被预置在了Rust上下文中；你不需要引入它。它的变体也被预置了；你可以直接使用`Some`或`None`，无需增加`Option::`前缀。`Option<T>`枚举仍然是一个普通的枚举，`Some<T>`和`None`也仍是它的变体。

`<T>`是一部分还没有被讨论到的话题。它是一个泛型参数，这部分我们会在第十章讨论。现在，你只需要知道`<T>`表示`Option`枚举的`Some`变体可以持有任意类型的数据，实际使用时的类型会取代`T`的位置，让`Option<T>`变为一个不同的类型。下面是一些使用`Option`持有数字和字符串的例子:

<Wrapper>
<template #code>

```rust
let some_number = Some(5);
let some_char = Some('e');

let absent_number: Option<i32> = None; /*[!flag L1]*/
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'some_number', value: 'Some / 5' },
          { key: 'some_char', value: 'Some / e' },
          { key: 'absent_number', value: 'None' },
        ]
      }
    ]
  }"
/>
</template>
</Wrapper>

`some_number`的类型是`Option<i32>`。`some_char`的类型是`Option<char>`，它们是不同的类型。Rust可以推断出这些类型，因为我们在`Some`变体内部声明了变量。对应`absent_number`，Rust要求注明`Option`的类型：由于它只持有了`None`值，编译器无法推断出它对应的`Some`变体的类型。本例中，我们告诉Rust`absent_number`的类型为`Option<i32>`。

当我们有了一个`Some`值，我们就知道这个值是非空的，且它的值被`Some`所持有。当我们有一个`None`值，某种意义上它和null的含义相同：此值无效。那么`Option<T>`比null好在哪里呢？

简单来说，因为`Option<T>`和`T`（`T`可以是任何类型）是不同的类型，编译器不会允许我们像实际的值那样使用`Option<T>`。比如，下面的代码无法编译，因为它试图将`Option<i8>`和`i8`类型相加：

```rust
    let x: i8 = 5;
    let y: Option<i8> = Some(5);

    let sum = x + y;
```

运行代码，报错如下

```
$ cargo run
    Compiling enums v0.1.0 (file:///projects/enums)
error[E0277]: cannot add `Option<i8>` to `i8`
--> src/main.rs:5:17
  |
5 |    let sum = x + y;
  |                ^ no implementation for `i8 + Option<i8>`
  |
  = help: the trait `Add<Option<i8>>` is not implemented for `i8`
  = help: the following other types implement trait `Add<Rhs>`:
             <&'a i8 as Add<i8>>
             <&i8 as Add<&i8>>
             <i8 as Add<&i8>>
             <i8 as Add>

For more information about this error, try `rustc --explain E0277`.
error: could not compile `enums` due to previous error
```

尴尬了！实际上，这些错误信息表示了Rust无法明确该怎么将`i8`和`Option<i8>`进行相加，因为它们是不同的类型。当我们声明了一个`i8`时，编译器会明确知道它是一个确定的值。我们不需要检查它是否为null就可以继续使用。可是当我们声明了一个`Option<i8>`（或其他被`Option`包裹的类型），我们就需要考虑值为空的情况，编译器会保证我们在使用值前进行了处理。

换句话说，在你进行`T`才能进行的操作前，你必须将`Option<T>`转换为`T`。通常来说，这种处理能够捕获大部分常见的null值错误：即将一个空值当作非空值来对待。

排除掉非空值的影响能让你对你的代码更加自信。为了持有一个可能为null的值，你必须显式地指明它的类型为`Option<T>`。然后，在你使用的地方，你必须显式地处理它为空的情况。每一个值不为`Option<T>`的地方，你*可以*放心地使用值，它们都不为null。这是Rust的刻意设计，以此限制null的泛滥，提升代码安全性。

那么如何从一个类型为`Option<T>`的值的`Some`变体中获取`T`呢？`Option<T>`拥有大量的方法来应对各种各样的情况：你可以直接访问它的文档。熟悉`Option<T>`的方法能为你的Rust之旅提供很大帮助。

通常来说，为了使用`Option<T>`，你要为各种变体提供处理。某些代码只有在值为`Some(T)`时运行，这些代码可以使用`T`。某些代码在值为`None`时运行，它们没有使用`T`的权限。`match`就是一种为了枚举而生的流程控制结构：它会根据枚举不同的变体运行不同的代码，这些代码也可以使用匹配到的值。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：Rust没有null指针，所以`null`关键字也是不存在的。如果需要表示存在null的可能性，应使用`Option`。

</template>
<template #quiz>
<IsCompileText />

```rust
fn foo(x: &i32) {
    println!("{x}");
}

fn main() {
    let x = null;
    foo(x);
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：结构体持有`Option`类型的字段是完全合法的（问题问的是**不是**合理的原因）。但是，如果你的数据结构有类似于“两个可选字段中的一个应该是 Some”的不变量，那么使用枚举更能确保这个不变量。

</template>
<template #quiz>

下面是两种`Result`类型的表达，如果包含`T`那么计算成功，否则存在错误`E`，表示失败：

```rust
struct Result1<T, E> {
    ok: Option<T>,
    err: Option<E>,
}

enum Result2<T, E> {
    Ok(T),
    Err(E)
}
```

枚举`Result2`更符合Rust的语言习惯，下面哪一项声明**不是**合理的原因？

<Radio>
<Option label="结构体的ok和err可能同时为None，而枚举至少有一个不为None" />
<Option label="结构体包括了Option类型，其目的仅为包裹结构体" />
<Option label="语法上来说，枚举比结构体更简洁" />
<Option label="结构体在运行时使用的内存比枚举多" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
