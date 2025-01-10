<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"
</script>

# Futures和Async语法

Rust中异步编程的关键是*futures*和`async`、`await`关键字。

*future*就是一个现在还没有准备好，但未来的某个节点会准备好的值。（很多的语言中都有类似的概念，有时候会使用“task”或“promise”这样的名字。）Rust提供了`Future`trait作为最小单元，这样不同的async操作可以实现不同的数据结构，但它们暴露相同的接口。在Rust中，我们可以说实现了`Future`的类型就是futures。每一个实现了`Future`的类型都存储了独有的关于进度，已经如何定义“准备好”的相关信息。

`async`关键字适用于代码块和函数，指定它们可以暂停和恢复。在async的代码块或函数中，你可以使用`await`关键字来等待一个future准备好，即*等待一个future（awaiting a future）*。在async的代码块或函数中的每一个等待future的操作都有可能会暂停和恢复。

很多编程语言都在异步编程中引入了`async`和`await`关键字。如果你对熟悉那些语言，你可能会发现Rust中的版本有很重要的不同，包括语法。这些都有很合理的原因，你会在后面看到！

Rust中的异步编程大部分情况下都使用了`async`和`await`关键字。Rust会使用`Future`trait来编译它们，就像把`for`循环编译为`Iterator`trait一样。由于Rust也暴露了`Future`trait，你也可以为你的数据结构手动实现它，我们会在本章看到很多函数的返回值实现了`Future`。在本章的结尾我们会回到trait的定义，来深入了解它的工作原理，但目前先抛开不谈。

上面谈及的内容可能有点抽象。我们来写我们的第一个异步程序：一个小的网络爬虫。我们会用命令行传入两个路径，同时下载它们两个，然后返回第一个完成的结果。这个例子会有一些新语法，但是别担心。我们会一步步解释一切。

## 第一个异步程序

为了聚焦本章学习异步编程的主题而不跑题，我们创建了`trpl`crate（`trpl`是“The Rust Programming Language”的缩写）。它会重新导出所有你需要的类型，traits和函数，主要来自`futures`和`tokio`crate。

- `future`crate是Rust为异步代码提供的实验库，也是`Future`被原始定义的地方。
- Tokio是目前Rust生态中被使用最广泛的异步运行时，特别是（当然它不是唯一的选择！）对于网络应用。社区中还有很多很棒的运行时，它们可能更适合你的目的。我们这里使用Tokio作为`trpl`的底层是因为它很不错且被广泛使用。

在某些情况下，`trpl`也会重命名或包装原始的API来让我们更加聚焦本章的主题。如果你想了解这些crate的细节，我们鼓励你去看一看[它的源码](https://github.com/rust-lang/book/tree/main/packages/trpl)。你可以看到crate是如何重新导出的，我们也在代码中留下了丰富的说明来帮助你理解。

现在将`trpl`crate加入你的`hello-async`工程吧：

```bash
$ cargo add trpl
```

现在我们可以使用`trpl`提供的公众内容来完成我们的第一个异步程序了。我们会创建一个小的命令行程序来获取两个网页，从中提取`<title>`元素，并打印第一个完成的结果。

```rust
use trpl::Html;

async fn page_title(url: &str) -> Option<String> {
    let response = trpl::get(url).await;
    let response_text = response.text().await;
    Html::parse(&response_text)
        .select_first("title")
        .map(|title_element| title_element.inner_html())
}
```

在上面的代码里，我们定义了名字叫做`page_title`的函数，然后使用`async`关键字标记了它。让我们使用`trpl::get`方法来获取指定网络路径里的内容，然后，我们使用`await`关键字获取了响应对象。然后我们调用了`text`方法，且再次使用了`await`关键字获取了响应的文字。这些步骤都是异步的。对于`get`方法，我们需要等待服务器响应并返回响应对象，包括HTTP头，cookies等等。响应体和响应头可能会分别返回。尤其是响应体非常大的情况，可能会消耗大量时间返回。因此，我们需要等待响应*整体*返回，所以`text`方法也是异步的。

我们必须显式地对这些future进行await，因为future在Rust中是*惰性的*：它们不会做任何事，直到你使用`await`来请求。（实际上，如果你没有使用`future`，Rust会显示一个编译器警告。）你也许会回忆起我们在第13章中对迭代器的介绍。接待器不会在你调用`next`方法前做任何事————不管是直接使用，还是使用`for`循环，或者类似`map`这些方法，它们的底层也调用了`next`。对于futures，基本的规则是类似的：它们不会在你显式调用前做任何事。惰性使得Rust不会在有需要前运行任何异步代码。

> [!NOTE]
> 这跟我们前一章使用的`thread::spawn`是不一样的，那里我们传入的闭包会立即执行。这也跟大部分语言中的异步代码都不一样！但这对于Rust来说很重要。我们之后会介绍为什么。

当我们拿到了`response_text`后，我们可以使用`Html`类型上定义的方法`Html::parse`来解析它。对比原始的字符串，我们现在有了一个更丰富的HTML数据结构。特别是我们可以使用`select_first`方法传入CSS选择器查找指定实例。通过传入字符串`“title”`，我们可以拿到文档中的第一个`<title>`元素，如果其存在的话。由于有可能匹配不到元素，所以`select_first`返回的是`Option<ElementRef>`。最终，我们可以使用`Option::map`方法，它允许我们在`Option`有值时使用其中的元素，无值时什么都不做。（我们这里也可以使用`match`表达式，但`map`更符合语义。）在我们传入`map`的闭包函数中，我们调用了`title_element`的`inner_html`方法来获取它的内容，其类型为`String`。当整个任务完成时，我们会获得一个`Option<String>`。

注意Rust的`await`关键字是跟随在你要异步操作的表达式后的，而不是在前面。因此，它是一个*后置关键字（postfix keyword）*。这可能和你在其他语言中见到的不太一样。Rust这么设计的原因是为了优化链式调用。比如，我们可以将`page_title`的函数体改为`trpl::get`和`text`夹带着`await`的链式调用，代码如下：

```rust
    let response_text = trpl::get(url).await.text().await;
```

这样，我们就成功地开发了我们的第一个异步函数！在我们在`main`函数中插入调用它的代码之前，我们再来多聊一点我们目前开发的代码以及其含义。

当Rust看到了一个使用`async`关键字标记的代码块，它会将它编译成一个独立的、匿名的实现了`Future`的数据类型。当Rust看到了一个使用`async`关键字标记的函数，它会将它编译成一个包含了一个async代码块的非async函数。因此，async函数的返回值就是内部async代码块的编译结果。

因此，写下`async fn`和开发一个返回*future*类型的函数是一样的。当编译器看到`async fn page_title`这样的代码，它等同于看到了如下代码：

```rust
use std::future::Future;
use trpl::Html;

fn page_title(url: &str) -> impl Future<Output = Option<String>> + '_ {
    async move {
        let text = trpl::get(url).await.text().await;
        Html::parse(&text)
            .select_first("title")
            .map(|title_element| title_element.inner_html())
    }
}
```

我们来看看转换的版本每一步都做了些什么：

- 它使用了我们第十章讨论的`impl Trait`语法。
- 返回的trait是`Future`，其关联类型为`Output`。注意`Output`的类型为`Option<String>`，和原来`async fn`版本的`page_title`返回值一致。
- 所有原始函数中的代码都被包裹在了`async move`代码块中。记住这是一个表达式。整个代码块都作为一个表达式被函数返回。
- async代码块返回了一个`Option<String>`类型的值，和之前讨论的一样。这个值和`Output`类型匹配。和你看到的普通代码块没有差别。
- 新的函数使用了`async move`，因为它使用`url`参数的方式。（我们会在这一章的后面讨论`async`和`async move`的区别）
- 新的函数使用了一种我们没有见过的生命周期：`'_`。因为这个函数返回了`Future`，它代表了一个引用类型————本例中来自`url`参数的引用————我们需要告诉Rust引用的生命周期。我们没有为这个生命周期命名，因为Rust足够聪明，它知道只有一个引用能与之关联。但我们*需要*显式地声明返回的`Future`被这个生命周期约束了。

现在我们可以在`main`函数中调用`page_title`了。我们先来获取一个简单页面的标题。下面的代码里，我们使用了类似第12章中的代码模式来获取一个命令行参数。然后我们传给了`page_title`，并等待结果。由于future提供的值是一个`Option<String>`，我们需要使用`match`表达式来处理标题存在和不存在的场景：

```rust
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let url = &args[1];
    match page_title(url).await {
        Some(title) => println!("The title for {url} was {title}"),
        None => println!("{url} had no title"),
    }
}
```

不幸的是，这段代码无法编译。我们能使用`await`关键字的地方只有在async函数或代码块里，所以Rust不允许我们将`main`函数标记为`async`：

```
error[E0752]: `main` function is not allowed to be `async`
 --> src/main.rs:6:1
  |
6 | async fn main() {
  | ^^^^^^^^^^^^^^^ `main` function is not allowed to be `async`
```

原因是异步代码需要*运行时*：一个管理了异步代码执行细节的Rust crate。一个程序的`main`函数可以初始化运行时，但它不可以是运行时本身。（这部分我们后面会继续讨论。）每一个异步程序都至少需要一个地方来准备运行时或执行future。

许多语言支持将异步功能打包在语言本体中。而Rust不支持。反之，Rust社区有各种各样的异步运行时，它们都在各个方面有取舍。比如，一个运行在多核CPU、RAM很大的机器上的高吞吐的网络服务器和一个运行在单核CPU、RAM很小且无法进行堆内存分配的机器上的微控制器的需求很不一样。为它们提供运行时的crate通常也会提供其他场景的函数功能，比如文件或者I/O。

这里，以及本章的其余部分，我们会使用来自`trpl`crate的`run`函数，它会接收一个future作为参数，并等待它完成。在底层，运行`run`设置好了一个使用传入future的运行环境。当future完成后，`run`会返回future提供的内容。

我们可以将`page_title`返回的future直接传给`run`。当它完成后，我们就可以使用match来处理其结果`Option<String>`，就像我们之前做的一样。然而，在本章中的大部分例子（以及真实世界的大部分async场景）里，我们面对的都不是一个async函数的调用，所以我们会使用一个`async`代码块来显式地等待`page_title`的结果，代码如下：

```rust
    trpl::run(async {
        let url = &args[1];
        match page_title(url).await {
            Some(title) => println!("The title for {url} was {title}"),
            None => println!("{url} had no title"),
        }
    })
```

当我们运行这段代码时，我们会看到跟我们预期相符的输出：

```
$ cargo run "http://www.rust-lang.org"
The title for http://www.rust-lang.org was
            Rust Programming Language
```

终于，我们有了一些异步代码！这段代码可以正常编译，我们也可以运行它。你可以在命令行里尝试不同的网络路径。你可能会发现一些网站比其他快得多，而有些网站偶尔能“赢”。我们来简短地回头看看future是如何工作的。

每一个*等待点（await point）*————即每个使用了`await`关键字的代码————表示了控制权交给运行时的地方。要让这些代码工作，Rust需要跟踪async代码块里的状态，这样运行时就可以开始其他工作，并在准备好时回来继续运行。这是一个隐形的状态机，你可以看做下面的代码：

```rust
enum PageTitleFuture<'a> {
    GetAwaitPoint {
        url: &'a str,
    },
    TextAwaitPoint {
        response: trpl::Response,
    },
}
```

手写这样的代码很无聊，也很容易出错，特别是后续维护代码时。所以，Rust编译器会为async代码自动创建和管理这样的状态机数据结构。我知道你在想什么：是的，常规的借用规则和所有权规则也是适用于这些数据结构的。皆大欢喜，编译器会处理这些检查，我们还能看到友好的错误信息。我们会在这一章后续继续讨论这些内容！

最终，总要有人去运行状态机。这个“人”就是运行时。（这就是为什么你在查看运行时的内容时会看到类似*执行器（executors）*的说法：执行器就是运行时里负责执行异步代码的东西。）

现在我们可以理解为什么编译器禁止我们将`main`函数变为异步函数。如果`main`是一个异步函数，那么就需要有人来处理`main`返回的future的状态机，可是`main`是程序的起点！因此，我们使用`trpl::run`函数，他会设置好运行时，并等待`page_title`函数返回的future`Ready`。

> [!NOTE]
> 一些运行时提供了宏，它们*可以*让你写异步`main`函数。这些宏会将`async fn main() { ... }`重写为`fn main`，最终的效果和我们上面写的代码一样：调用一个`trpl::run`方式的函数来完成future。

我们将这些片段整合一下，看看我们如何写异步代码，调用`page_title_for`来处理命令行传入的两个网络路径：

```rust
use trpl::{Either, Html};

fn main() {
    let args: Vec<String> = std::env::args().collect();

    trpl::run(async {
        let title_fut_1 = page_title(&args[1]);
        let title_fut_2 = page_title(&args[2]);

        let (url, maybe_title) =
            match trpl::race(title_fut_1, title_fut_2).await {
                Either::Left(left) => left,
                Either::Right(right) => right
            };

        println!("{url} returned first");
        match maybe_title {
            Some(title) => println!("Its page title is: '{title}'"),
            None => println!("Its title could not be parsed."),
        }
    })
}

async fn page_title(url: &str) -> (&str, Option<String>) {
    let text = trpl::get(url).await.text().await;
    let title = Html::parse(&text)
        .select_first("title")
        .map(|title_element| title_element.inner_html());
    (url, title)
}
```

这次，我们用用户传入的两个路径调用了`page_title`。将`page_title`返回的future存入了`title_fut_1`和`title_fut_2`。别忘了，它们还什么都没做，因为future是惰性的，我们还没有await它们。接着我们将它们传入了`trpl::race`，它会返回首先完成的future。

两个future都可以合法地“赢”，所以这里返回一个`Result`是不合理的。而`race`返回的是我们还没有见过的类型，`trpl::Either`。`Either`就像`Result`，它存在两种情况。和`Result`不同的是，`Either`不存在成功或失败的情况。它只会使用`Left`和`Right`来表示“一个或另一个”。

```rust
enum Either<A, B> {
    Left(A),
    Right(B)
}
```

`race`函数会在第一个参数先完成时返回`Left`，以及对应future的输出，如果第二个参数先完成，那么它会返回`Right`，包含其future的输出。这符合我们调用函数时的参数顺序：第一个参数在第二个参数的左边。

我们也更新了`page_title`方法来返回我们传入的路径。这样，如果第一个完成的页面没有可解析的`<title>`，我们也可以打印实用的信息。有了这些信息，我们可以使用`println!`将先完成的网络路径和对应的`<title>`（如果存在的话）打印出来。

你已经构建了一个小小的网络爬虫，我们可以向许多方向进行扩展。更重要的是，你学到了future的基本工作原理，接下来我们就可以深入挖掘异步代码可以*做*什么了。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：Rust不允许在`async`代码块和函数之外使用`.await`。Rust也没有内置的async运行时。你需要使用第三方的async运行时，比如`tokio`或者`trpl`。

</template>
<template #quiz>

如果你想在一个非async的代码中等待一个future，你需要做什么？

<Radio>
<Option label="将这个future传递给Rust内置的async运行时" />
<Option label="将这个future包裹在async代码块中并使用.await" />
<Option label="直接在这个future后使用.await" />
<Option label="将这个future传递给第三方的async运行时" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：一个async函数会返回一个实现了`Future`trait且输出为函数返回值的类型。所以这里，函数的返回表示为`impl Future<Output = i32>`。future会捕获函数参数的生命周期。因此返回的类型约束为了`+ 'a`，而输入参数类型变为`&'a [i32]`。这样就表面了切片的长度至少需要和捕获它的future一样长。

</template>
<template #quiz>

这个async函数会变编译为？

```rust
async fn calculate(nums: &[i32]) -> i32 {
    /* ... */
}
```

<Radio>
<Option answer>

```rust
fn calculate<'a>(nums: &'a [i32]) -> impl Future<Output = i32> + 'a;
```

</Option>

<Option>

```rust
fn calculate<'a>(nums: &'a [i32], output: &mut impl Future<Output = i32> + 'a);
```

</Option>

<Option>

```rust
fn calculate() -> impl for<'a> Future<Input = &'a [i32], Output = i32> + 'a;
```

</Option>

<Option>

```rust
fn calculate(nums: &'_ [i32]) -> i32 as Future;
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
