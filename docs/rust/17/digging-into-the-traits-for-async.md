<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"
</script>

# 深入`Async`相关Trait

在本章的过程中，我们用各种方式接触了`Future`，`Pin`，`Unpin`，`Stream`和`StreamExt`trait。但是目前为止，我们刻意避开了它们的实现细节，以及如何互相兼容的问题。在书写Rust代码的大部分时间里，这样是没问题的。然而在某些情况下，你会发现是否理解这些细节非常关键。本章，我们会挖掘*足够的*细节来处理这些情况————但*真正*深入的细节会留给其他文档！

## Future

回顾前文，我们了解到了`Future`是一个trait。我们来深入看看它是如何工作的。下面是Rust中对于`Future`的定义：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

这个trait的定义包括了一些新类型和一些我们还没有见过的语法，我们会一一解释。

首先，`Future`的关联类型`Output`表示了future被解析为的类型。这个关系和`Item`对于`Iterator`的关系很相似。其次，`Future`也有`poll`方法，它接受一个对`self`参数的`Pin`引用和一个`Context`类型的可变引用，并返回`Poll<Self::Output>`。本章我们会花一些时间解释`Pin`和`Context`。现在，我们先来看看方法的返回值，即`Poll`类型：

```rust
enum Poll<T> {
    Ready(T),
    Pending
}
```

`Poll`类型和`Option`类型很像：它的一个变体持有了一个值（`Ready(T)`），另一个变体没有（`Pending`）。但它们的含义很不同！`Pending`变体表示future还有工作要做，调用者需要等下再来检查。而`Ready`变体表示future已经完成，其存储的值`T`是可用状态。

> [!NOTE]
> 对于大多数future来说，调用者不应该在其返回`Ready`后再继续调用`poll`方法。很多future会在这种情况下panic！如果future在返回`Ready`后可以继续安全调用，那么其文档中会明确说明。这和`Iterator::next`的行为类似！

当你调用`.await`时，Rust会将代码编译为对`poll`的调用，有点类似（但不完全一样）如下代码：

```rust
match hello("async").poll() {
    Ready(_) => {
        // 完成了！
    }
    Pending() {
        // 这里做什么呢？
    }
}
```

如果`Future`仍然是`Pending`的情况下我们该做什么呢？我们需要不停地重试...重试重试再重试，直到future准备好。换句话说，一个循环：

```rust
let hello_fut = hello("async");
loop {
    match hello_fut.poll() {
        Ready(_) => {
            break;
        }
        Pending => {
            // continue
        }
    }
}
```

如果Rust编译出如上代码，那么每一次`.await`都会阻塞————和我们的本意恰恰相反！因此，Rust需要保证这个循环可以随时将控制权交给那些可以暂停这个future、切换到其他future并在一段时间后再回来检查的东西。这个“东西”就是async运行时，这些协调和调度就是运行时的主要工作之一。

回顾我们对于`rx.recv`等待时的描述。`recv`的调用会返回一个`Future`，并等待其拉取。在我们初期的讨论里，我们说明了运行时会暂停future，直到其用一个`Some(message)`或标识通道关闭的`None`来表示其准备好了。而带着我们现在对`Future`更深入的理解，特别是`Future::poll`，我们就明白这是怎么一回事了。运行时知道future在返回`Poll::Pending`时表示其没有完成。反过来，运行时也知道future的`poll`返回`Poll::Ready(Some(message))`或`Poll::Ready(None)`时就表示其已经准备好了。

真实的细节即便对于本章这种深入章节来说也太过深入了。关键在于了解future的运作结构：运行时会对其负责的future进行不断地*拉取*，并在其没有准备好时让它休眠。

## 固定和`Pin`、`Unpin`trait

当我们引入固定地概念时，我们看到了一个很粗糙的错误信息。下面是其中有关的一部分：

```
error[E0277]: `{async block@src/main.rs:8:23: 20:10}` cannot be unpinned
  --> src/main.rs:46:33
   |
46 |         trpl::join_all(futures).await;
   |                                 ^^^^^ the trait `Unpin` is not implemented for `{async block@src/main.rs:8:23: 20:10}`, which is required by `Box<{async block@src/main.rs:8:23: 20:10}>: std::future::Future`
   |
   = note: consider using the `pin!` macro
           consider using `Box::pin` if you need to access the pinned value outside of the current scope
   = note: required for `Box<{async block@src/main.rs:8:23: 20:10}>` to implement `std::future::Future`
note: required by a bound in `JoinAll`
  --> /Users/chris/.cargo/registry/src/index.crates.io-6f17d22bba15001f/futures-util-0.3.30/src/future/join_all.rs:29:8
   |
27 | pub struct JoinAll<F>
   |            ------- required by a bound in this struct
28 | where
29 |     F: Future,
   |        ^^^^^^ required by this bound in `JoinAll`

Some errors have detailed explanations: E0277, E0308.
For more information about an error, try `rustc --explain E0277`.
```

当我们仔细阅读这条错误信息时，会发现它不仅仅告诉我们需要固定值，它还告诉了我们为什么固定是必要的。`trpl::join_all`函数会返回一个`JoinAll`的结构体。这个结构体拥有泛型`F`，它被约束为要实现`Future`trait。最终，直接等待一个future要求它实现了`Unpin`trait。好复杂！但我们可以继续挖掘`Future`类型的工作原理，即*固定*。

我们来再看看`Future`的定义，特别是`poll`方法的`self`类型：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    // 必需的方法
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

这是我们第一次看到一个方法的`self`拥有这样的类型。当`self`的类型是这样时，我们就是告诉Rust什么样的`self`才能调用这个方法。这类的`self`定义很类似于其他函数的参数，但有限制：类型注解必须是方法实现的类型，或该类型的引用、智能指针，或者是`Pin`包裹的该类型的引用。这部分语法我们会在第18章介绍。现在，我们只需要了解如果我们想要拉一个future（检查其是`Pending`还是`Ready(Output)`），我们就需要一个被`Pin`包裹的可变引用类型。

`Pin`是一个包裹类型。在某种程度上，它和`Box`，`Rc`，以及其他我们在第15章见过的智能指针类型很像，它们也都是包裹类型。然而，和它们不同的是，`Pin`只能作用与*其他指针类型*，比如引用（`&`和`&mut`）和智能指针（`Box`，`Rc`等等）。准确来说，`Pin`只能作用与实现了`Deref`和`DerefMut`trait的类型。你可以把这个限制看做它只能作用于指针，因为实现了`Deref`和`DerefMut`也就表面你的类型和指针的行为类似。`Pin`本身不是一个指针，它也没有类似`Rc`或`Arc`那样的行为。它纯粹是编译器用类型包裹指针来确保相关保证的一种工具。

既然`.await`的实现是对于`poll`的调用，那么我们看到的错误信息也就不难理解了————但那是`Unpin`，不是`Pin`。所以到底什么是`Pin`和`Unpin`，它们是如何关联的，以及为什么`Future`需要`self`表现为`Pin`才能调用`poll`呢？

在我们的第一个异步程序里，我们描述了一个future里的一系列await点会被编译为一个状态机————编译器会帮忙确保状态机遵循了所有Rust有关安全的基础规则，包括借用和所有权。要达成这样的目的，Rust需要了解await点之间（或await点和async代码块结尾之间）所需要的数据。这样它就能在它创建的状态机里创建对应的变体。每一个变体都有权限访问对应的数据，不管是获取数据的所有权，还是获取其可变或不可变引用。

到目前为止一切都很好：如果我们在给定的async代码块中发生了所有权或者引用错误，借用检查器会告诉我们。但如果我们想把future移出其关联的代码块时————比如将它插入一个`Vec`中传递给`join_all`————事情就变得有趣了。

当我们移动一个future————不管是为了将它像迭代器一样使用而插入到一个数据结构里，还是从一个函数返回他————意味着我们要移动Rust帮我们创建的状态机。不像Rust中的其他大部分类型，Rust为async代码块创建的future可以在任何给定变体中引用自身。移动对其自身有引用的对象是不安全的，因为引用指向的内存地址就是其寄存的地方。如果你移动数据结构本身，你*必需*更新其引用，否则它们的引用就会指向移动前的地址。

在实践中，你可以让Rust编译器在每一次移动时帮你更新每一个引用。但这样会造成大量的性能损耗，特别是需要更新的是一个引用网络时。另一方面，如果我们可以保证数据结构*不会在内存中移动*，那么我们就不需要更新任何的引用了。这其实是Rust的借用检查器已经保证了的：如果一个事物存在激活的引用，那么你就不能移动它，否则不安全。

`Pin`基于这一点给予了我们需要地保障。当我们使用`Pin`来*固定*一个值时，它就不能再移动了。因此，如果你创建了`Pin<Box<SomeType>>`，你实际上固定了`SomeType`值，*而不是*`Box`指针。实际上，被固定的box指针可以自由地移动。记住：我们关注的是最终引用的数据是否在其原来的位置。如果指针四处移动，而其指向的数据仍在原来的位置，那么就没有任何的问题。

然而，大部分类型移动起来都是安全的，即使它们被`Pin`包裹了。我们需要考虑固定的是存在内部引用的元素。类似数字或布尔值一类的原始值不存在任何内部引用的结构，所以显而易见，它们是安全的。而你接触的大部分Rust类型也都没有内部引用结构。比如，`Vec`没有任何需要追踪的内部引用，所以你可以无忧无虑地移动它。如果你有一个`Pin<Vec<String>>`，你就只能通过`Pin`的安全但限制颇多的API来操作它，即便`Vec<String>`在没有其他引用时移动起来永远是安全的。这种情况下，我们需要一种方式来告诉编译器，移动它们是安全的。这就是`Unpin`的作用。

`Unpin`是一个标记trait，就像我们第16章见过的`Send`和`Sync`一样。回顾前文，标记trait自身没有任何的作用。它们只是为了告诉编译器在特定的上下文中使用时限了给定trait的类型。`Unpin`就是告诉编译器，给定类型*不*需要任何特定的保障，其持有的值可以自由移动。

就像`Send`和`Sync`一样，编译器自动为所有它能证明是安全的类型实现了`Unpin`。手动实现`Unpin`是不安全的，因为对于具有内部引用的类型，它要求你自行确保所有使`Pin`和`Unpin`安全的保证。在实践中，手动实现它们非常少见！

现在你理解`join_all`调用所抛出错误的含义了。我们原本希望将异步代码块提供的future移动到`Vev<Box<dyn Future<Output = ()>>>`中，但就像我们看到的一样，这些future可能存在内部引用，所以它们没有实现`Unpin`。它们需要被固定，然后我们可以将`Pin`类型插入到`Vec`中，保证了future中潜在的类型*不会*被移动。

`Pin`和`Unpin`对于构建底层库、或者自己实现运行时来说格外重要，它们并不大会出现在日常的Rust代码中。但如果你看到了它们，你需要明白它们在做什么！

> [!NOTE]
> `Pin`和`Unpin`的结合实际上允许了完整的一类复杂类型在Rust中的安全，否则就很难实现，因为他们存在自引用。要求实现`Pin`在今天的异步Rust中*最*常见，但你可能————很少！————在其它的上下文中看到它们。
>
> `Pin`和`Unpin`底层特定的实现都被囊括在了`std::pin`下定义的丰富的API，如果你想深入了解它们，这些文档是绝佳的起点。
>
> 如果你想了解“底层”的更多细节，官方的[Asynchronous Programming in Rust](https://rust-lang.github.io/async-book/)中的第2、4章可能有你想了解的知识。

## `Stream`trait

现在我们深入了解了`Future`，`Pin`和`Unpin`trait，我们可以转头来看看`Stream`trait了。就像我们一开始介绍的那样，流就是异步的迭代器。不像`Iterator`和`Future`一样，现在的标准库并没有提供`Stream`，但社区中有很常见的定义。

我们来回顾`Iterator`和`Future`trait的定义，好明白`Stream`是如何结合它们产生定义的。对于`Iterator`，我们有序列的概念：其`next`方法会返回`Option<Self::Item>`。而对于`Future`，我们有了一段时间的准备状态的概念：其`poll`方法会返回`Poll<Self::Output>`。要表示一系列的存在准备状态的值，我们可以像这样定义`Stream`trait：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

trait Stream {
    type Item;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>
    ) -> Poll<Option<<Self::Item>;
}
```

`Stream`trait定义了一个关联类型`Item`，即流内元素的类型。这和`Iterator`很像：可能有零个或多个值；与`Future`不同的是，`Future`总是有且仅有一个`Output`（即使是元类型`()`）。

`Stream`也定义了获取元素的方法。我们将其命名为`poll_next`，为了表面它拉取元素的方式和`Future::poll`类似，而提供序列元素的方式和`Iterator::next`类似。其返回值为`Poll`包裹的`Option`。外侧的类型为`Poll`，因为它需要检查准备状态，就像`Future`一样。内侧类型为`Option`，因为它需要一个信号来标识是否还有更多消息，就像迭代器一样。

未来，类似这样的API可能会标准化，并最终作为Rust标准库的一部分。但现在，它只是作为大部分运行时工具的一部分，所以你可以依赖它，而我们介绍的一些概念也是通用的！

在我们前一章看到流的例子里，我们并没有使用`Stream`的`poll_next`方法，而是使用了`StreamExt`的`next`方法。我们当然*可以*直接使用`Stream`开发状态机，并手动调用`poll_next`方法，就像我们*可以*直接调用future的`poll`方法一样。但使用`await`更好，因为`StreamExt`会提供更实用的`next`方法：

```rust
trait StreamExt: Stream {
    async fn next(&mut self) -> Option<Self::Item>
    where
        Self: Unpin;

    // 其他方法
}
```

> [!NOTE]
> 实际的定义和我们这里看到的略有不同，因为它需要支持不同版本的Rust，其中一些版本不支持trait定义async函数，所以它实际的代码为：
>
> ```rust
> fn next(&mut self) -> Next<'_, Self> where Self: Unpin;
> ```
>
> `Next`类型就是一个简单的实现了`Future`的`struct`，它定义了`self`和`Next<'_, Self>`的生命周期，所以`.await`可以和它配合使用！

`StreamExt`trait也定义了关于流的各种各样的有趣方法。`StreamExt`会为实现了`Stream`的类型自动实现，但它们被分开是为了让社区能够独立改进基础特征，而无需影响便利的API。

在我们使用的`trpl`crate提供的`StreamExt`版本中，它不仅定义了`next`方法，还提供了`next`的实现，它能正确地处理`Stream::poll_next`调用中的各种细节。也就是说即使你想自定义流数据类型，你也*只*需要实现`Stream`，然后任何使用你的类型的人都天然地可以使用`StreamExt`和它提供的方法。

这就是我们要讲的关于这些trait的所有底层细节。为了总结，我们来看看future（也包括流），任务和线程是如何互相兼容的！

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：Rust会使用基于拉取的模型执行future。一个await点会被编译为一个对`.poll()`方法的无限调用，它会在每一次不成功的拉取后将控制权交给运行时，允许其他async代码执行。运行时会在一段时间后“唤醒”`f.await`代码，对`f`进行再次拉取。

</template>
<template #quiz>

假设有future`f`，以下哪一个选项对`f.await`的工作原理描述是最准确的？

<Radio>
<Option>

它调用了一次`f.push(...)`，其会在`f`准备好后调用一个包括`f.await`后续代码的回调函数

</Option>
<Option>

它调用了一次`f.poll()`，他会阻塞代码，直到`f`准备好

</Option>
<Option answer>

它会在循环中调用`f.poll()`，如果`f`准备好，循环会退出，如果没有，那么它会将控制权返回给async运行时

</Option>
<Option>

它会在循环中调用`f.poll()`，如果`f`准备好，循环会推出，如果没有，那么它会立刻再次调用

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：固定要解决的核心问题在于自引用，或者包含对自身指针的future。即async代码块包含了一个本地变量，引用了另一个本地变量的情况。这里，即`y = &x`。

</template>
<template #quiz>

接入Rust不要求future在调用poll时被固定。以下哪一个async函数会在不固定的情况下潜在地造成未定义行为？

<Radio>
<Option>

```rust
async fn example() -> i32 {
    let x = 0;
    sleep(Duration::from_secs(1)).await;
    x
}
```

</Option>
<Option>

```rust
async fn example(x: Vec<i32>) -> i32 {
    sleep(Duration::from_secs(1)).await;
    x[0]
}
```

</Option>
<Option>

```rust
async fn example(x: &i32) -> i32 {
    sleep(Duration::from_secs(1)).await;
    *y
}
```

</Option>
<Option answer>

```rust
async fn example(x: i32) -> i32 {
    let y = &x;
    sleep(Duration::from_secs(1)).await;
    *y
}
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
