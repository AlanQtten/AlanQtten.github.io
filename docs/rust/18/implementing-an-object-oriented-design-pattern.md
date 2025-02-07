<script setup>
import {
  QuizProvider,
  Quiz,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 实现一个面向对象的设计模式

*状态模式*是一种面向对象的设计模式。该模式的目的是创建一个内部包含一系列状态的值。状态也可以被表示为一系列的*状态对象*，而值的行为基于其状态而变化。我们来看一个博客发布结构体的例子，它有一个存储状态的字段，其状态可能为“draft”（草稿），“review”（已审批）和“published”（已发布）。

状态对象共享功能：当然了，在Rust里，我们会使用结构体和trait来替代对象和继承。每一个状态对象都为相应的行为负责，同时也会监控其何时应该变为其他状态。持有状态对象的值并不知道其不同行为，以及如何在状态间切换。

使用状态模式的好处是，如果业务要求程序进行调整，我们不需要修改值持有状态的代码和使用值的代码。我们只需要更新某一个状态内部的行为，改变一些规则，或者添加更多的状态即可。

首先，我们来用更加传统的面向对象的方式实现状态模式，然后我们再使用更“Rust”的方式。我们来一步步挖掘如何使用状态模式开发一个博客。

最终的功能清单如下：

1. 一个博客最开始是一个空的草稿。
2. 当草稿完成时，需要对博客进行审批。
3. 当审批通过后，博客会被发布。
4. 只有已发布博客会返回内容以供打印，避免未通过审批的博客被意外发布。

任何其他操作都不应该产生影响。比如，如果你尝试发布一个草稿状态、未审核的博客，那么博客仍应保持为一个未发布的草稿。

下面的代码展示了一个完整的工作流：这里使用了我们之后会实现的crate`blog`。这段代码当然是无法编译的，因为我们还没有实现`blog`crate。

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");
    assert_eq!("", post.content());

    post.request_review();
    assert_eq!("", post.content());

    post.approve();
    assert_eq!("I ate a salad for lunch today", post.content());
}
```

我们希望用户可以通过`Post::new`来创建一个新的博客草稿。然后用户可以添加文字。如果我们在审核前立刻尝试获取博客的内容，我们应该什么都获取不到，因为此时博客仍为草稿。出于验证的目的，我们在代码里添加了`assert_eq!`。我们可以通过断言草稿博客文章的`content`方法返回空字符串来实现一个优秀的单元测试，但在这个例子中我们不会编写测试。

接着，我们发起了一次审批，在等待审批完成期间，`content`方法仍应返回空字符串。当博客被批准后，它应该被发布，也就是说调用`content`方法可以获取博客的内容。

注意我们目前为止只使用了这个crate里的`Post`类型。这个类型会使用状态模式，同时会存储一个值为以下三者之一的状态————草稿，等待审批，或者已发布。状态之间的变化会在`Post`类型内部进行管理。状态的更改会发生在库用户对`Post`实例方法的调用中，但用户无法直接修改状态。同时，用户也无法搞错状态，比如在审批前发布博客。

## 定义`Post`，创建一个草稿状态的新实例

我们先来实现这个库！我们已经知道了需要一个公共的`Post`结构体来存储博客内容，所以我们首先定义结构体，以及其关联的公共方法`new`，用于创建`Post`实例。我们同时创建了一个私有的`State`trait，它用于定义所有状态拥有的行为。

接着，`Post`会存储一个私有的类型为`Box<dyn State>`的trait对象`state`，包裹在`Option<T>`中。你会在后面看到为什么要使用`Option<T>`。

```rust
pub struct Post {
    state: Option<Box<dyn State>>,
    content: String,
}

impl Post {
    pub fn new() -> Post {
        Post {
            state: Some(Box::new(Draft {})),
            content: String::new(),
        }
    }
}

trait State {}

struct Draft {}

impl State for Draft {}
```

`State`trait定义了不同博客状态共享的行为。状态对象为`Draft`，`PendingReview`和`Published`，它们都会实现`State`trait。现在，这个trait还没有任何方法，我们先定义了`Draft`状态，因为这是我们希望的博客初始状态。

当我们创建一个新的`Post`时，我们给`state`字段设置为了持有`Box`的`Some`值。这个`Box`指向一个新的`Draft`实例。这样就保证了当我们创建`Post`的新实例时，它会初始设置为草稿状态。由于`Post`的`state`字段是私有的，我们无法创建其他状态的`Post`！在`Post::new`函数里，我们将`content`字段设置为了一个新的，空的`String`。

## 在博客内存储文本

我们已经看到了前面调用`add_text`并传入`&str`可以将文本添加到博客中。我们来实现这个方法，我们不会将`content`字段设置为`pub`，这样后续我们可以控制它的读取。`add_text`方法很直接，我们直接将它添加到`impl Post`代码块中：

```rust
impl Post {
    // 略
    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }
}
```

`add_text`方法接受一个`self`的可变引用，因为我们会在调用它时修改`Post`。我们调用了`String`的`push_str`方法，将传入的`text`存储到了`content`中。这个行为不会涉及博客的状态，所以这里没有什么状态模式。`add_text`方法根本不会和`state`字段交互，但它也是功能的一部分。

## 保证一个草稿状态的博客内容为空

即使我们调用了`add_text`，给博客添加了一些内容，我们仍然希望`content`方法返回空字符串切片，因为博客本身还是处于草稿状态。现在我们来实现一个简单的`content`方法：永远返回一个空的字符串切片。我们会在后面修改这部分实现，让博客可以在被发布后返回内容。目前，博客只能是草稿状态，所以博客的内容只能返回空，代码如下：

```rust
impl Post {
    // 略
    pub fn content(&self) -> &str {
        ""
    }
}
```

这样，我们又完成了一部分。

## 请求审批

接着，我们来添加博客请求审批的功能，它会将博客的状态从`Draft`变为`PendingReview`，代码如下：

```rust
impl Post {
    // 略
    pub fn request_review(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.request_review())
        }
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
}

struct Draft {}

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        Box::new(PendingReview {})
    }
}

struct PendingReview {}

impl State for PendingReview {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }
}
```

我们给`Post`创建了一个公共方法，名为`request_review`，他接受一个`self`的可变引用，然后调用当前`Post`状态的`request_review`方法，这个方法会消费当前的状态，并返回一个新的状态。

我们给`State`trait添加了一个`request_review`方法；所有实现了这个trait的类型都需要实现这个方法。注意这里的第一个参数不是`self`，`&self`或`&mut self`，而是`self: Box<Self>`。这种语法意味着这个方法仅支持被`Box`包裹的类型调用。且这种语法会获取`Box<Self>`的所有权，让老状态无效，这样`Post`的状态值可以转为新状态。

为了消费掉旧的状态，`request_review`方法需要获取状态值的所有权。这就是为什么`Post`的`state`字段是一个`Option`：我们可以调用`state`字段的`take`方法来获取`Some`值，将`None`留在原地，因为Rust不允许空的字段。这样我们就可以将`state`移出`Post`，而不是借用它。然后我们会将博客的`state`值设置为本次操作的结果。

我们需要临时把`state`设置为`None`，而不是通过类似`self.state = self.state.request_review();`这样的代码直接设置它，这样才能获取`state`值的所有权。也保证了`Post`无法使用旧的状态值，因为我们已经将它转为了新的值。

`Draft`的`request_review`方法会返回一个新的，包装的`PendingReview`实例，他代表了博客等待被审核的状态。`PendingReview`结构体也实现了`request_review`方法，但其中不会进行任何的转换。它只会返回自身，因为当我们对一个已经为`PendingReview`状态的博客进行请求审批操作时，它应当停留在`PendingReview`状态。

现在我们可以看到状态模式的优势了：不管状态如何，`Post`的`request_review`方法始终是同一个。而每一个状态负责自己的逻辑。

我们先不处理`Post`的`content`方法，让它继续返回空的字符串切片。现在我们可以有`PendingReview`状态的和`Draft`状态的`Post`了，但是其行为却不同。

## 添加`approve`方法来修改`content`的行为

`approve`方法和`request_review`方法类似：它会将`state`字段设置为某个期望的状态，代码如下：

```rust
impl Post {
    // 略
    pub fn approve(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.approve())
        }
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
    fn approve(self: Box<Self>) -> Box<dyn State>;
}

struct Draft {}

impl State for Draft {
    // 略
    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
}

struct PendingReview {}

impl State for PendingReview {
    // 略
    fn approve(self: Box<Self>) -> Box<dyn State> {
        Box::new(Published {})
    }
}

struct Published {}

impl State for Published {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
}
```

我们给`State`trait添加了`approve`方法，然后添加了一个新的实现了`State`的结构体，`Published`。

就像`PendingReview`的`request_review`方法一样，如果我们调用了`Draft`的`approve`方法，它不会产生任何影响，因为其`approve`方法会返回`self`。如果我们调用`PendingReview`的`approve`方法，它会返回一个新的、被包装的`Published`实例。`Published`结构体实现了`State`trait，它也实现了`request_review`方法和`approve`方法，它们都会返回自身，因为`Published`状态的博客应该在那些情况下停留在当前状态。

现在我们需要更新`Post`的`content`方法了。我们希望`content`方法依赖`Post`当前的状态，所以我们会将方法委托给`Post`的`state`上的`content`方法：

```rust
impl Post {
    // 略
    pub fn content(&self) -> &str {
        self.state.as_ref().unwrap().content(self)
    }
    // 略
}
```

因为我们的目标是将所有的逻辑放在实现了`State`的结构体中，所以我们之间调用了`state`的`content`方法，并传入了博客的实例（也就是`self`）作为参数。然后我们返回了`state`的`content`方法返回的内容。

我们使用了`Option`的`as_ref`方法，因为我们想获取一个对`Option`内部值的引用，而不是值的所有权。由于`state`是一个`Option<Box<dyn State>>`，当我们调用了`as_ref`时，会返回一个`Option<&Box<dyn State>>`。如果我们没有调用`as_ref`，我们就会看到报错，因为我们无法将`state`从一个借用的`&self`函数参数中移出。

然后我们调用了`unwrap`方法，我们可以判断这个方法永远不会panic，因为我们知道`Post`上的方法保证了`state`永远会在方法完成后包含一个`Some`。这一部分我们在第九章讨论过，我们可以知道值不可能为`None`，即使编译器并不理解。

现在，当我们调用`&Box<dyn State>`的`content`方法时，强制解引用会处理`&`和`Box`，这样最终调用的是实现了`State`trait的类型上的`content`方法。所以我们需要给`State`trait的定义添加`content`方法，这就是为什么我们将返回什么内容的逻辑设置为与状态相关，代码如下：

```rust
trait State {
    // 略
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        ""
    }
}

// 略
struct Published {}

impl State for Published {
    // 略
    fn content<'a>(&self, post: &'a Post) -> &'a str {
        &post.content
    }
}
```

我们给`content`方法添加了一个默认实现，返回一个空的字符串切片。这样我们就无需为`Draft`和`PendingReview`实现`content`方法了。而`Published`结构体会覆盖`content`方法，返回`post.content`存储的值。

注意，正如我们在第10章中讨论过的一样，我们需要给这个方法添加生命周期标注。因为我们接收了`post`的引用作为参数，且返回了它的一部分，所以返回值的生命周期需要和`post`参数的生命周期相关联。

我们完成了————全部的代码都可以正常运行了！我们实现了状态模式下的博客发布工作流。和这个工作流相关的规则放置在各个状态对象里，而不是分散在`Post`中。

> #### 为什么不用枚举
> 你可能好奇为什么我们不用`enum`，通过变体来表示不同的状态。那样的方式绝对是可行的，你可以尝试一下，看看哪种形式更合你的口味！使用枚举有一个很明显的缺陷就是我们需要在每一个地方使用`match`来处理各种可能的变体。这样会造成比trait对象更冗余的代码。

## 状态模式的取舍

我们已经展示了Rust可以实现面向对象的状态模式，进而完成给每个状态内封装博客的各种行为。`Post`上的方法对各种行为并不了解。通过我们对代码的组织，我们只需要看一个地方就可以了解到已发布博客的行为：`Published`结构体对`State`trait的实现。

如果我们不使用状态模式来实现，我们可能需要在`Post`的方法里，甚至是`main`函数里使用`match`表达式来检查博客的状态，并且在对应的位置修改行为。我们就必须查看多个位置来理解一个已发布博客的完整行为！这样也会导致我们添加的状态增多：每一个`match`表达式都需要分支。

而在状态模式下，`Post`的方法和我们使用`Post`的地方都不需要`match`表达式，也不需要添加新的状态，我们只需要添加新的结构体，在那个结构里实现trait的方法即可。

使用了状态模式的代码很容易就可以扩展更多的灵活性。如果你想看看维护使用了状态模式的代码有多容易，你可以试试如下的改动：

- 给`PendingReview`添加一个`reject`方法，使其返回`Draft`状态。
- `approve`方法被调用2次后，博客的状态才能修改为`Published`。
- 只允许用户在`Draft`状态下给博客添加内容。提示：让状态对象负责内容的修改，但不要负责博客本身的修改。

使用状态模式的缺点是，由于状态之间实现了过渡，某些状态可能会互相耦合。如果我们给`PendingReview`和`Published`之间添加一个状态，比如`Scheduled`，我们就得修改`PendingReview`，使其过渡到`Scheduled`状态。如果`PendingReview`不需要知道额外的新状态就可以修改，那么可以减少一些工作，但是那需要其他的设计模式。

另一个缺点是一些重复性的代码。要减少重复，我们需要给`State`trait的`request_review`和`approve`方法添加默认的实现，使其返回`self`；然而，这会违反对象的安全，因为trait并不知道确切的`self`。我们希望能将`State`作为一个trait对象来使用，所以我们需要它的方法是对象安全的。

另一点重复就是`Post`的`request_review`和`approve`方法的实现。它们都进行了类似的操作：获取`Option`类型的`state`字段，将`state`字段设置为对应方法返回的结果。如果我们的`Post`有很多类似模式的方法，我们可能需要考虑定义一个宏来减少重复性（我们会在第19章讨论宏）。

### 将状态和行为编码为类型

我们将向你展示如何重新思考状态模式，以获得一些不同的取舍。与其将状态和转换完全封装起来，使外部代码对它们一无所知，不如将状态编码为不同的类型。因此，Rust的类型检查系统将通过发出编译器错误来防止在只允许发布文章的地方尝试使用草稿文章：

```rust
fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");
    assert_eq!("", post.content());
}
```

我们仍然使用`Post::new`来创建一个新的博客，同时保留给博客添加内容的能力。但是我们不会再让草稿状态的博客的`content`方法返回一个空的字符串，我们会使其完全没有`content`方法。这样，如果我们尝试获取草稿类型博客的内容，我们就会收到一个编译错误，告诉我们这个方法并不存在。最终，就不存在生产环境下意外暴露草稿博客内容的风险了，因为那样的代码甚至无法通过编译。下面的代码展示了`Post`结构体的定义，以及一个`DraftPost`及其方法：

```rust
pub struct Post {
    content: String,
}

pub struct DraftPost {
    content: String,
}

impl Post {
    pub fn new() -> DraftPost {
        DraftPost {
            content: String::new(),
        }
    }

    pub fn content(&self) -> &str {
        &self.content
    }
}

impl DraftPost {
    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }
}
```

`Post`和`DraftPost`结构体都有一个私有的`content`字段，存储博客的内容。结构体不再拥有`state`字段，因为我们将状态的编码转为了结构体类型。`Post`结构体就代表一个已经发布的博客，其`content`方法会返回`content`。

我们仍然使用`Post::new`方法，但它并不会返回一个`Post`实例，而是一个`DraftPost`实例。因为`content`是私有的且没有任何方法返回`Post`，我们目前无法创建`Post`实例。

`DraftPost`结构体有一个`add_text`方法，所以我们可以给`content`添加文本，但是注意，`DraftPost`并没有定义`content`方法！所以现在程序保证了所有的博客都会以一个草稿状态开始，而草稿状态的博客无法显示其内容。任何违背这些规则的操作都会引发编译错误。

### 将状态转换实现为向不同类型的转变

那么我们如何获得一个已发布的博客呢？我们希望强制草稿状态的博客需要被审核和通过后才能被发布。一个等待审核的草稿不应该展示任何内容。我们通过添加一个新的结构体实现这些限制，`PendingReviewPost`，我们给`DraftPost`定义一个`request_review`方法，它会返回一个`PendingReviewPost`，然后我们给`PendingReviewPost`定义一个`approve`方法，它会返回一个`Post`，代码如下：

```rust
impl DraftPost {
    // 略
    pub fn request_review(self) -> PendingReviewPost {
        PendingReviewPost {
            content: self.content,
        }
    }
}

pub struct PendingReviewPost {
    content: String,
}

impl PendingReviewPost {
    pub fn approve(self) -> Post {
        Post {
            content: self.content,
        }
    }
}
```

`request_review`和`approve`方法会获取`self`的所有权，因此也就消耗了`DraftPost`和`PendingReviewPost`实例，将它们分别转为了`PendingReviewPost`和`Post`。这样，我们就不需要在调用`request_review`后再考虑`DraftPost`实例了，以此类推。`PendingReviewPost`结构体也没有任何的`content`方法定义，所以尝试从它上面读取博客的内容也会导致编译错误，和`DraftPost`一样。由于获取拥有`content`方法的`Post`实例的唯一方法是调用`PendingReviewPost`的`approve`方法，正如唯一获取`PendingReviewPost`实例的方法是调用`DraftPost`的`request_review`方法一样，我们已经将博客的工作流编码为了类型系统。

我们仍然需要对`main`方法进行一些调整。`request_review`和`approve`方法会返回新的实例，而不是修改原来的结构体，所以我们需要添加更多的`let post =`来进行遮挡声明，保存最新返回的实例。我们也不能断言草稿和待审核的博客内容为空了，我们也不需要它们了：我们无法编译在那些状态下尝试访问内容的代码。`main`函数调整后如下：

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");

    let post = post.request_review();

    let post = post.approve();

    assert_eq!("I ate a salad for lunch today", post.content());
}
```

我们对`main`函数中进行的修改，即对`post`的重新赋值也意味着此实现不再遵循面向对象的状态模式了：状态之间的变形不再被封装在`Post`的实现中。然而，我们也有所收获，现在无效的状态不存在了，因为类型系统和类型检查都在编译时完成了检查！这样的代码保证了一些特定的漏洞不会出现，比如展示一个未发布博客的内容，它们都会在发布到生产前被发现。

尝试在本节开头建议的任务中使用完整的`blog`crate，看看你对这个版本代码设计的看法。请注意，某些任务可能已经在这个设计中完成了。

我们已经看到了，即便Rust可以实现一些面向对象的设计模式，另一些模式，比如将状态编码到类型系统中，也是同样可行的。这些模式各有各的取舍。即使你对面向对象的设计模式很熟悉，重新思考这些问题如何与Rust的特性相配合也能提供额外的好处，比如在编译时避免一些漏洞。因为Rust种存在一些其他面向对象语言没有的特性，比如所有权，因此面向对象的设计模式并不永远是Rust中最好的策略。

## 总结

不管你在阅读本章后是否认为Rust是一门面向对象语言，你现在都应该了解如何使用trait对象来在Rust中获得一些面向对象的特性了。动态的派发可以给予代码灵活性，但要牺牲一些运行时的性能。你也能使用这些灵活性来实现一些面向对象的设计模式，进而对你的代码产生帮助。Rust也有一些其他的面向对象语言没有的特性，比如所有权。一个面向对象的设计模式在Rust中不一定是最优解，但一定是一个可选项。

下面，我们来看看模式匹配，这是Rust中另一个强大的特性。我们在本书中的很多位置见过它，但还没有完整地介绍过。我们出发吧！

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：结构体/trait的方法对于API使用者意图添加新状态（比如`Retracted`）的场景是更好的，且这种情况下也无需调整任何的核心API功能。当添加这个状态时，其他状态的方法无需调整。而如果使用枚举，使用者无法为枚举添加新的变体。而且，添加新的状态后，所有的`match`表达式都需要更新。

`match`并不会比动态派发更慢。一个match就是一个基于枚举的分支，而动态分派则需要通过特征对象的虚拟表进行一层间接访问，并通过非内联的函数调用实现。

对于结构体/trait的情况，API的使用者不可以为现有状态添加新的*方法*，他们只能添加新的状态。方法已经被API的作者通过trait的定义限制死了。注意你只能通过扩展trait来基于已有方法添加新的方法，比如：

```rust
trait StateExt {
    fn request_review_twice(self: Box<Self>) -> Box<dyn State>;
}

impl<S: State> StateExt for S {
    fn request_review_twice(self: Box<Self>) -> Box<dyn State> {
        self.request_review().request_review()
    }
}
```

但这些扩展无法读取状态的私有数据。

</template>
<template #quiz>

在本节的例子里，一个博客可以有三种状态：`Draft`，`PendingReview`和`Published`。每一个状态都表示为一个结构体，且状态的转换被表示为返回trait对象的trait方法。

另一种实现是枚举，代码如下：

```rust
enum BlogState {
    Draft,
    PendingReview,
    Published
}

impl Post {
    fn request_review(&mut self) {
        use BlogState::*;
        self.state = match self.state {
            Draft => PendingReview,
            PendingReview => PendingReview,
            Published => Published,
        }
    }
}
```

以下哪些选项是结构体/trait对比枚举的优势？

<Checkbox>
<Option label="API使用者可以给这个系统添加新的状态" answer />
<Option label="在运行时，match比动态派发的速度慢" />
<Option label="API使用者可以给系统重的所有状态添加新的方法" />
<Option label="添加新状态无需调整所有其他状态的方法" answer />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
