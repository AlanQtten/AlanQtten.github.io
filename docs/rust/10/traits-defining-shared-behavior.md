<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  CheckboxHolder,
  Checkbox,
  RadioHolder,
  Radio
} from "../../components/quiz"

</script>

# Traits: 定义共享行为

一个*trait*可以给一个特定类型定义一些功能，且这些功能可以分享给其他类型。我们可以使用trait来定义抽象行为。我们可以使用*trait约束（trait bounds）*来定义泛型类型的行为。

> trait和其他语言中的*接口*功能很相似，但也有一些不同

## 定义一个Trait

一个类型的行为包括了我们对这个类型使用的方法。不同的类型也可以有一些相同的方法。Trait定义了一种方式来将这些方法的签名进行组织，从而获得一组方法，进而实现某些目的。

比如，如果我们现在有若干结构体，它们存储了数量、类型不同的文本：`NewsArticle`结构体存储着特定位置的新闻，`Tweet`结构体最多可以存储280个字符长度的数据，不管是新的推文，转发，还是回复其他推文。

现在我们想书写一个聚合媒体的crate，叫做`aggregator`，它能显示数据的摘要，不管它们被存储在`NewsArticle`还是`Tweet`实例中。要实现这个功能，我们需要对每个类型进行摘要功能的实现，这个方法我们称为`summarize`，下面的代码久定义了一个公共的`Summary`trait来表示这种行为：

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

这里，我们通过`trait`关键字加一个名字（也就是`Summary`）定义了一个trait。我们将这个`trait`声明为`pub`，来便于其他crate进行依赖。就像我们之前看到过的例子一样，在大括号里面，我们定义了一个方法的签名，它描述了类型实现这个trait时的行为，即`fn summarize(&self) -> String`。

在方法定义后，我们用一个分号结尾。每一个实现这个trait的类型必须实现这个trait的所有方法。编译器会强制要求任何有`Summary`特性（trait）的类型都必须实现和这里定义的`summarize`方法签名完全一致的方法。

一个trait体内可以定义多个方法：函数签名逐行向下，每一行用分号结尾。

## 给一个类型实现Trait

现在我们已经定义好了`Summary`trait的方法，我们可以为我们的媒体聚合功能的相关类型实现这个方法了。下面的代码展示了对`Summary`trait的实现，对于`NewsArticle`来说，它使用头条、作者和地址来作为`summarize`的返回。对`Tweet`来说，它使用用户名和整个推文作为摘要，毕竟推文的字数已经被限制在了280字。

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

为一个类型实现一个来自trait的方法和实现一个普通的方法很像。不同点在于，在`impl`关键字后，我们加上了trait的名字，然后使用了`for`关键字，最后是我们要实现的类型。在`impl`块内，我们书写trait内定义的方法签名，和trait内部不同的是，这一次不使用分号，而是书写大括号和函数的实现。

现在这个库已经为`NewsArticle`和`Tweet`类型实现了`Summary`trait，这个crate的使用者可以对`NewsArticle`和`Tweet`实例调用trait上的方法。但是使用者必须将这个trait也引入作用域中。下面的例子就是一个使用`aggregator`的例子：

```rust
use aggregator::{Summary, Tweet};

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, so you probably already know, people",
        ),
        reply: false,
        retweet: false,
    };

    println!("1 new tweet: {}", tweet.summarize());
}
```

这段代码的打印结果是`1 new tweet: of course, as you probably already know, people`。

其他依赖了`aggregator`crate的crate也可以引入`Summary`trait来为它们的类型实现`Summary`。一个值得注意的限制就是我们要实现的trait和类型至少其中之一必须是来自crete本地的。比如，我们可以给自定义类型`Tweet`实现一个标准库的trait，比如`Display`，作为我们`aggregator`的一部分功能，因为`Tweet`类型对`aggregator`来说是本地的。我们也可以给`Vec<T>`实现`Summary`，因为`Summary`trait对`aggregator`来说也是本地的。

但我们不能给外部的类型实现外部的trait，比如，我们不能在`aggregator`内给`Vec<T>`实现`Display`trait。因为`Display`和`Vec<T>`都是标准库中定义的，它们对于`aggregator`来说都不是本地的。这样的限制是*连贯性（coherence）*的一部分，也被叫做*孤儿规则（orphan rule）*，这样命名的原因是因为父类型没有被展示。这样的规则保证了其他人不会破坏你的代码，反之亦然。如果没有这些规则，那么两个crate可能会为一些类型实现同样的trait，Rust无法确定该使用哪一个实现。

## 默认实现

有时候，给一些方法添加一些默认实现，而不是要求trait的使用者来实现全部方法也是很实用的。这种情况下，trait的实现者仍然可以选择覆盖默认方法。

下面的代码中，我们为`Summary`trait的`summarize`方法添加了默认实现：

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("Read more...")
    }
}
```

要在`NewsArticle`上使用这个默认实现，我们可以声明一个空的`impl`体，即`impl Summary for NewsArticle {}`。

尽管我们没有再给`NewsArticle`直接定义`summarize`方法，我们仍然可以享受`Summary`trait提供的默认实现：

```rust
    let article = NewsArticle {
        headline: String::from("Penguins win the Stanley Cup Championship!"),
        location: String::from("Pittsburgh, PA, USA"),
        author: String::from("Iceburgh"),
        content: String::from(
            "The Pittsburgh Penguins once again are the best \
             hockey team in the NHL.",
        )
    };

    println!("News article available! {}", article.summarize());
```

这段代码的打印结果是`News article available! (Read more...)`。

为trait实现默认方法完全不影响之前`Tweet`对`Trait`的实现。原因在于，不管你实现的trait有没有提供方法的默认实现，实现它的语法都是一样的。

默认实现也可以调用这个trait上的其他方法，不管那些方法有没有默认实现。通过这种方式，trait可以提供很多有用的功能，且仅仅要求你手动实现其中的一部分。比如，我们可以为`Summary`trait实现一个`summarize_author`方法，它没有默认实现，然后在`summarize`方法内调用这个方法：

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("Read more from {}...", self.summarize_author())
    }
}
```

要使用这一版`Summary`，我们只需要在实现这个trait的地方添加`summarize_author`的具体实现：

```rust
impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

在我们定义`summarize_author`后，我们可以对`Tweet`结构体调用`summarize`方法，然后`summarize`方法的默认实现会调用我们提供的`summarize_author`方法。由于我们自己实现了`summarize_author`方法，`Summary`trait就给予了我们`summarize`方法的能力，而无需我们再书写更多代码：

```rust
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        retweet: false,
    };

    println!("1 new tweet: {}", tweet.summarize());
```

这段代码的打印结果是`1 new tweet: Read more from @horse_ebooks...`。

请注意，你无法在一个方法的自定义实现中调用它的默认实现。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`Dog`对`MakeNoise`的方法提供了具体实现，而`Cat`使用了实现，因此它们对`make_noise`方法的调用分别输出了`bark`和`(silence)`。

</template>
<template #quiz>

<IsCompileText />

```rust
trait MakeNoise {
    fn make_noise(&self) {
        println!("(silence)");
    }
}

struct Dog {}
struct Cat {}

impl MakeNoise for Dog {
    fn make_noise(&self) {
        println!("bark");
    }
}

impl MakeNoise for Cat {}

fn main() {
    let dog = Dog {};
    let cat = Cat {};
    dog.make_noise();
    cat.make_noise();
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: 'bark\n(silence)'
  }"
  textarea
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：“孤儿规则”限制了我们不能为一个外部的类型实现一个外部的trait，从而保证不会有两个crate提供互相冲突的实现。

</template>
<template #quiz>

请选择下面哪些对trait实现说法是正确的

<CheckboxHolder>
<Checkbox label="你可以为一个本地类型实现一个外部trait" answer />
<Checkbox label="你可以为一个外部类型实现一个外部trait" />
<Checkbox label="你可以为一个本地类型实现一个本地trait" answer />
<Checkbox label="你可以为一个外部类型实现一个本地trait" answer />
</CheckboxHolder>

</template>
</Quiz>
</QuizProvider>
:::

## Trait作为参数

现在你知道了如何定义和实现trait，我们可以探索如何使用trait来让函数接收多种类型。我们可以继续使用`Summary`trait来定义一个`notify`方法，它调用了传入实例的`summarize`方法，也就是我们在`Summary`trait上必须实现的方法，要完成这样的功能，我们要使用`impl Trait`语法：

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}"， item.summarize());
}
```

我们使用了`impl`关键字和trait的名字来指定`item`参数的类型，而不是具体的类型。这样的参数可以接收任何实现了指定trait的类型。在`notify`函数体内，我们可以调用任何`Summary`trait的方法，比如`summarize`。我们可以给`notify`方法传入`NewsArticle`或者`Tweet`实例。而传入其他类型，比如`String`或`i32`，代码就会报错，因为那些类型没有实现`Summary`。

### Trait约束语法

`impl Trait`语法其实是对*trait约束*的语法糖；完整的代码如下：

```rust
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

完整的版本和我们上一节看到的例子一样，但更繁琐。我们将trait的名字书写在泛型参数后面，用冒号隔开。

`impl Trait`语法更加方便，它能让我们书写更简洁的代码，而完整的trait约束语法在某些复杂情况下更有用。比如，如果我们有两个参数，使用`impl Trait`的代码如下：

```rust
pub fn notify(item1: &impl Summary, item2: &impl Summary) {
```

使用`impl Trait`允许`item1`和`item2`拥有不同的类型（尽管它们都实现了`Summary`）。如果我们希望两个参数拥有相同的类型，那么我们必须使用trait约束：

```rust
pub fn notify<T: Summary>(item1: &T, item2: &T) {
```

泛型决定了传递给这个函数的两个参数必须是相同类型。

### 使用+指定多个Trait约束

我们可以指定多个trait约束。假设我们希望`notify`函数使用标准的格式化，同时也希望调用`item`的`summarize`方法：即`item`必须实现`Display`和`Summary`，我们可以使用`+`语法：

```rust
pub fn notify(item: &(impl Summary + Display)) {
```

`+`对于泛型来说也是一样的：

```rust
pub fn notify<T: Summary + Display>(item: &T) {
```

这样，`notify`的函数体内就即可以调用`summarize`方法，也可以使用`{}`来格式化`item`了。

### 使用where来声明更清晰的Trait约束

过度地使用trait约束也有坏处。如果每个泛型参数都有约束，那么函数地名字和参数列表之间需要书写大量的代码，这样的函数签名可读性并不好，出于这个原因，Rust提供了`where`关键字。所以对于下面的代码：

```rust
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 {
```

我们可以使用`where`：

```rust
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
```

函数的签名就没有那么杂乱了，函数的名字、参数列表和返回值书写在了一起，和没有使用trait约束的函数一样。

## 返回实现了trait的类型

我们也可以使用`impl Trait`语法来约束函数的返回值：

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        retweet: false,
    }
}
```

通过使用`impl Summary`来约束返回值，我们指定了`returns_summarizable`函数必须返回一个实现了`trait`的类型，而不是某一个具体类型。这种情况下，`returns_summarizable`返回了`Tweet`，但调用这个函数的代码无需了解这一点。

对于闭包和迭代器来说（第十三章我们会讨论到），要求返回值必须实现某种trait的能力是十分有用的。闭包和迭代器创建的类型只有编译器菜知道，或者那些类型需要特别长的代码才能指定。`impl Trait`语法让你可以简洁地指定某个函数返回一个实现了`Iterator`trait的类型即可，无需书写冗长的类型代码。

然而，即使使用了`impl Summary`，你也只能返回单一的类型，比如，下面的代码返回了`NewsArticle`或`Tweet`，这样的代码是无法通过编译的：

```rust
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle {
            headline: String::from(
                "Penguins win the Stanley Cup Championship!",
            ),
            location: String::from("Pittsburgh, PA, USA"),
            author: String::from("Iceburgh"),
            content: String::from(
                "The Pittsburgh Penguins once again are the best \
                 hockey team in the NHL.",
            ),
        }
    } else {
        Tweet {
            username: String::from("horse_ebooks"),
            content: String::from(
                "of course, as you probably already know, people",
            ),
            reply: false,
            retweet: false,
        }
    }
}
```

根据`impl Trait`语法在编译器内部的实现，这样的代码无法通过编译。我们会在第十七章讨论如何返回不同的类型。

## 使用Trait约束有条件地实现方法

通过在`impl`块内使用泛型类型，我们可以为一些实现了某个特定trait地类型实现某些方法。比如`Pair<T>`总会包含`new`方法，它会返回一个`Pair<T>`实例（我们在第五章提到过，`Self`在`impl`块中是一个特殊的类型别名，这里它就指代`Pair<T>`）。但在下一个`impl`块中，`Pair<T>`只在`T`实现了`PartialOrd`和`Display`trait的情况下实现了`cmp_display`方法：

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmd_display(&self) {
        if self.x > self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest number is y = {}", self.y);
        }
    }
}
```

我们也可以为任何满足trait约束的类型实现某个trait，这样的代码叫做*通用实现（blanket implementations）*，它在Rust标准库中被大量使用。比如，标准库为所有实现了`Display`trait的类型实现了`ToString`trait，代码如下：

```rust
impl<T: Display> ToString for T {
    // 略
}
```

因为标准库有这个通用实现，我们可以对任何实现了`Display`trait的类型调用`ToString`trait定义的`to_string`方法。比如，我们可以把整数转为字符串，因为它们实现了`Display`：

```rust
let s = 3.to_string();
```

通用实现在trait的文档`Implementors`中有做介绍。

trait和trait约束能让我们使用泛型来减少重复代码，同时告诉编译器我们希望泛型拥有某种能力。编译器可以使用约束信息来检查我们使用的具体类型是否满足条件。在动态类型语言里，如果我们调用了一个类型上不存在的方法，我们会看到运行时报错。但Rust将这些错误转移到了编译时，强制我们修复这些问题。此外，我们也不需要书写检查代码来进行运行时的检查，也进一步提高了代码的性能，同时没有损失泛型的灵活度。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：由于`displayable`返回了`impl Display`，我们只能确定`s2`是*某种*实现了`Display`的类型，无法确定它有没有`String`上的`push_str`方法。因此我们不能调用`s2.push_str(...)`。如果`displayable`返回了`-> T`，那么程序可以正常编译。

</template>
<template #quiz>

<IsCompileText />

```rust
use std::fmt::Display;
fn displayable<T: Display>(t: T) -> impl Display { t }

fn main() {
    let s = String::from("hello");
    let mut s2 = displayable(s);
    s2.push_str(" world");
    println!("{s2}");
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

解析：因为方法调用了`clone`方法，且使用了`{}`来格式化，所以`T`必须实现`Clone`和`Display`。

</template>
<template #quiz>

如果书写下面的泛型约束，来获得应有的类型检查？

<RadioHolder>
<Radio label="不需要约束" />
<Radio label="Clone + Display + Debug" />
<Radio label="Clone" />
<Radio label="Clone + Display" answer />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
