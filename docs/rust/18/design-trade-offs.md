<script setup>
import {
  QuizProvider,
  Quiz,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 设计的权衡

这一节是有关Rust里的**设计权衡**。要成为一个高效的Rust开发者，只了解Rust是如何工作的是不够的。你需要决定在对应场景下该使用Rust的哪些特性。这一节，我们设计了一系列的谜题来帮助你理解Rust中的设计权衡。在完成这些测试后，我们会逐一深入解释。

下面是一个问题的例子。首先我们会描述一个留有设计空间的软件的场景，

> 上下文：你在开发一个具有全局配置的软件，包括命令行的参数。
> 功能：这个应用需要在整个环境里传递对配置的不可变的引用。
> 设计：下面是一些实现这个功能的设计。
> ```rust
> use std::rc::Rc;
> use std::sync::Arc;
>
> struct Config {
>     flags: Flags,
>     // .. 其他字段 ..
> }
>
> // 选项1：使用引用
> struct ConfigRef<'a>(&'a Config);
>
> // 选项2：使用引用计数指针
> struct ConfigRef(Rc<Config>);
>
> // 选项3：使用原子引用计数指针
> struct ConfigRef(Arc<Config>);

考虑上下文和关键功能，三种设计都是可行的。我们需要更多信息来决定使用哪个方案更合理。因此，我们提出一个新的需求

> 选择能满足以下要求的设计模式：
>
> 要求：配置需要在多个线程中共享。
>
> 答案：
> - [x] 选项1
> - [ ] 选项2
> - [x] 选项3

在正式情况下，这意味着`ConfigRef`需要实现`Send`和`Sync`。假设`Config: Send + Sync`，那么`&Config`和`Arc<Config>`都能满足要求，而`Rc`不满足（因为非原子化的引用计数不具备线程安全）。所以选项2不满足要求，而选项3满足。

你可能觉得选项1不满足要求，因为`thread::spawn`这样的方法要求所有移入线程的数据都只能包含`'static`生命周期的引用。然而，选项1出于以下两点并没有违反规则：

1. `Config`可以存储在一个全局的静态变量里（比如使用`OnceLock`），这样我们就能构造出`&'static Config`了。
2. 并不是所有的并发场景都要求`'static`生命周期，比如`thread::scope`。

因此，我们只能排除非`Send`类型的场景，所以选项1和选项3都可以看作正确答案。

---

现在你可以尝试下面的问题了！每一个小节包含了针对单一场景的问题。完成测试，且确保你阅读了问题的解释。这些问题都是实验性的，且都是主观的————如果你觉得它们有问题，欢迎提出建议。

在每个问题前，我们也附上了启发这些问题诞生的crate的链接。

## 引用

启发：[Bevy assets](https://docs.rs/bevy/0.11.2/bevy/asset/struct.Assets.html)，[Petgraph node indices](https://docs.rs/petgraph/0.6.4/petgraph/graph/struct.NodeIndex.html)，[Cargo units](https://docs.rs/cargo/0.73.1/cargo/core/compiler/struct.Unit.html)

::: details 小测（3）
<QuizProvider>

<div>

**问题1有很多个部分**。下面的部分是多个部分共享的上下文。

上下文：你要为一个游戏引擎开发一个简单的资源管理。

功能：API使用者会提供一系列需要加载的资源路径，API会返回对载入资源的访问。

假设：你可以认为这些加载都是同步且瞬间发生的。

设计：下面是一些实现这个功能的设计。

```rust
pub struct AssetManger {
    // ...
}

// 选项1：返回引用
impl AssetManager {
    pub fn load(&mut self, path: PathBuf) -> &Asset;
}

// 选项2：返回动态引用
impl AssetManager {
    pub fn load(&mut self, path: PathBuf) -> &mut Asset;
}

// 选项3：返回一个引用计数指针
impl AssetManager {
    pub fn load(&mut self, path: PathBuf) -> Rc<Asset>;
}

// 选项4：返回一个可以被转为引用的可复制的句柄
#[derive(Copy, Clone)]
pub struct AssetHandle(usize);

impl AssetManager {
    pub fn load(&mut self, path: PathBuf) -> AssetHandle;
    pub fn get(&self, handle: AssetHandle) -> &Asset;
}
```

</div>

<Quiz>
<template #description>

解析：资源的不可变性是由不允许修改操作的类型保证的。不可变引用`&Asset`和不可变智能指针`Rc`都不允许可变操作。因此，选项1、3、4都满足这个要求。选项2返回了一个可变借用，它不满足要求。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：一旦加载，资源应该永久不可变。

<Checkbox>
<Option label="1" answer />
<Option label="2" />
<Option label="3" answer />
<Option label="4" answer />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：“保持对资产的访问”意味着客户端会想要开发类似如下的程序：

```rust
let asset = {
    let manager = get_manager();
    manager.load("some/path")
};
process_asset(asset);
let another_asset = {
    let manager = get_manager();
    manager.load("another/path")
};
```

这种情况下，`load`返回值的生命周期没有和`AssetManager`的生命周期绑定。选项1、2都只要求`&Asset`和`&mut Asset`的存活时长和`&mut self`一样。因此借用检查器会拒绝类似上面这个程序，因为资源的存活已经超出了管理器的引用。选项1、2都不符合要求。

选项3、4都满足要求。`Rc<Asset>`的生命周期没有和`&mut self`的生命周期绑定。类似的，`AssetHandle`的生命周期也没有和`&mut self`的生命周期绑定。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：资源管理器的客户端需要在多次短期借用资产管理器的过程中保持对资产的访问。

<Checkbox>
<Option label="1" answer />
<Option label="2" answer />
<Option label="3" />
<Option label="4" answer />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：要在单一时间释放所有的资源，`AssetManager`需要保留所有权。这样在`AssetManager`被销毁时（或者指定地销毁资源），所有的资源被安全地销毁是有保障的。选项1、2、4都可以满足这个需求。选项4的情况下，如果客户端在资源被释放后调用`manager.get(handle)`（AssetManager::get），程序会崩溃。如果真实存在这种可能性，那么`get`最好返回`Option<&Asset>`。

选项3不符合要求。引用计数指针被所有的`Rc<Asset>`所共有。`AssetManger`没有什么好办法来保证所有的资源在销毁时没有其他的所有者了。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：所有资源都需要在单一的、可预测的时间被释放，这件事很重要。

<Checkbox>
<Option label="1" answer />
<Option label="2" answer />
<Option label="3" />
<Option label="4" answer />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::

## Trait树

启发：[Yew components](https://docs.rs/yew/0.20.0/yew/html/trait.Component.html)，[Druid widgets](https://docs.rs/druid/0.8.3/druid/trait.Widget.html)

::: details 小测（3）
<QuizProvider>

<div>

**问题1有很多个部分**。下面的部分是多个部分共享的上下文。

上下文：你要设计一个简单的用户界面框架，它包括了一系列组件的树，比如文本和按钮。

功能：API需要提供一个`Widget`trait，定义组件的工作原理。API使用者会实现`Widget`trait，然后调用它来渲染界面。

设计：下面是一些实现这个功能的设计。

```rust
// 选项1：子必须为 Self
pub trait Widget: Sized {
    fn render(&self) -> Vec<Self>;
}

// 选项2：子是trait的参数
pub trait Widget<Children> {
    fn render(&self) -> Vec<Children>;
}

// 选项3：子是一个关联类型
pub trait Widget {
    type Children: Widget;
    fn render(&self) -> Vec<Self::Children>;
}

// 选项4：子是一个trait对象的引用
pub trait Widget {
    fn render(&self) -> Vec<&dyn Widget>;
}

// 选项5：子是一个封装的trait对象
pub trait Widget {
    fn render(&self) -> Vec<Box<dyn Widget>>;
}
```

</div>

<Quiz>
<template #description>

解析：如果我们想将所有的组件列入一个单一的枚举，比如：

```rust
enum WidgetImpl {
    Button { /* .. */ },
    Text { /* .. */ },
    // ..
}

impl Widget for WidgetImpl { /* .. */ }
```

此时我们就拥有了一个“与世隔绝”的系统，因为我们无法扩展组件的类型。`Widget`的实现只有一种，不需要动态派发。因此选项1是可行的，因为`render`只会返回`WidgetImpl`类型。其他的设计都包含了不必要的复杂度。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：API使用者期望有一个单一的`WidgetImpl`枚举来列出所有可能的组件，然后给`WidgetImpl`实现`Widget`。

<Checkbox>
<Option label="1" answer />
<Option label="2" />
<Option label="3" />
<Option label="4" />
<Option label="5" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：和前面的问题不同的是，现在我们希望每一个组件都有独特的类型，比如：

```rust
struct Button { /* .. */ }
impl Widget for Button { /* .. */ }

struct Text { /* .. */ }
impl Widget for Text { /* .. */ }
```

因此集合中的组件需要具备异质特点，即，它需要包含不同类型的组件。选项1、2、3中的`Widget::render`都只能返回单一类型的组件。而选项4、5通过trait对象实现了动态派发，进而实现了组件集合的异质。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：API使用者期望每一种组件都有一个独特的结构体来表示，每个结构体都实现了`Widget`trait。每个组件可以返回一个包含可能类型的集合。

<Checkbox>
<Option label="1" />
<Option label="2" />
<Option label="3" />
<Option label="4" answer />
<Option label="5" answer />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：选项2里的`Widget`trait没有约束`Children: Widget`。其他的选都保证了`Vec<W>`中的`W`满足`W: Widget`。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：只有实现了`Widget`的trait可以被`render`返回。

<Checkbox>
<Option label="1" answer />
<Option label="2" />
<Option label="3" answer />
<Option label="4" answer />
<Option label="5" answer />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::

## 派发

启发：[Bevy systems](https://docs.rs/bevy_ecs/0.11.2/bevy_ecs/system/trait.IntoSystem.html)，[Diesel queries](https://docs.diesel.rs/2.1.x/diesel/query_dsl/trait.BelongingToDsl.html)，[Axum handlers](https://docs.rs/axum/0.6.20/axum/handler/trait.Handler.html)

::: details 小测（3）
<QuizProvider>
<div>

**问题1有很多个部分**。下面的部分是多个部分共享的上下文。

上下文：你在设计一个简单的事件系统，它会在事件的响应中调用回调。

功能：一个`Events`结构体提供了注册回调的函数。回调可能是并行的（跨线程执行）或串行的（必须在主线程里执行）。

设计：下面是一些实现这个功能的设计。

```rust
pub struct Events {
    // ...
}

// 选项1：并行和串行是分开的方法
impl Events {
    pub fn register<E, F: Fn(E)>(&mut self, f: F) { /* .. */ }
    pub fn register_sequential<E, F: Fn(E)>(&mut self, f: F) { /* .. */ }
}

// 选项2：并行和串行是枚举的两个变体
pub enum Callback<F> {
    Parallel(F),
    Sequential(F),
}
impl Events {
    pub fn register<E, F: Fn(E)>(&mut self, f: Callback<F>) { /* .. */ }
}

// 选项3：并行和串行是trait方法的标记
pub trait Register<Marker, F, E> {
    fn register(&mut self, f: F);
}
pub struct Parallel;
pub struct Sequential;
impl<F, E> Register<Parallel, F, E> for Events
where F: Fn(E) {
    fn register(&mut self, f: F) { /* .. */ }
}
impl<F, E> Register<Sequential, F, E> for Events
where F: Fn(Sequential, E) {
    fn register(&mut self, f: F) { /* .. */ }
}
```

</div>

<Quiz>
<template #description>

解析：首先，我们来想象一下针对每种设计的回调调用是什么样子的：

```rust
// 选项1
events.register(|e: OnClick| { /* .. */ });
events.register_sequential(|e: OnClick| { /* .. */ });

// 选项2
events.register(Callback::Parallel(|e: OnClick| { /* .. */ }));
events.register(Callback::Sequential(|e: OnClick| { /* .. */ }));

// 选项3
events.register(|e: OnClick| { /* .. */ });
events.register(|_: Sequential, e: OnClick| { /* .. */ });
```

可以看到，选项1、3都会在最简单的默认情况下采用并行的回调。如果希望采用串行的回调，那么需要使用更长的方法名（`_sequential`）或者标记类型（`_: Sequential`）。

选项2并没有明显的标记并行模式为默认，因为`Parallel`和`Sequential`都需要传入给`register`。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：回调默认是并行的，且API应该可以反映这种情况。

<Checkbox>
<Option label="1" answer />
<Option label="2" />
<Option label="3" answer />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：选项2、3都只导出了一个`register`方法。而选项1导出了两个名称不同的方法。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：API应该尽可能少地导出方法。

<Checkbox>
<Option label="1" />
<Option label="2" answer />
<Option label="3" answer />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：选项1和选项2并没有要求很多针对函数`F`的类型推导。

选项3使用`Register`trait以及参数化的“标记”类型完成了一次巧妙的函数的重载。其调用为：

```rust
events.register(|e: OnClick| { /* .. */ })
events.register(|_: Sequential, e: OnClick| { /* .. */ })
```

它们看起来好像使用了相同的实现，但其实指向了同一个方法的不同实现。这样的实现依赖于编译器对于`Marker`类型的推导，进而决定该使用`Register`上的哪一个`.register(..)`调用。而我们的目标是*减少*类型推导，因此选项3是不合适的。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：API应该尽可能少地依赖编译器的类型推导。

<Checkbox>
<Option label="1" answer />
<Option label="2" answer />
<Option label="3" />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::

## 中间体

启发：[Serde](https://docs.rs/serde/1.0.188/serde/trait.Serialize.html)和[miniserde](https://docs.rs/miniserde/0.1.34/miniserde/trait.Serialize.html)

::: details 小测（3）
<QuizProvider>

<div>

**问题1有很多个部分**。下面的部分是多个部分共享的上下文。

上下文：你在设计一个序列化库，它可以将Rust的数据类型转换为类似JSON的格式。

功能：可序列化的类型应该实现`Serialize`trait，且提供一个`to_json`函数，转化序列化类型为JSON。

设计：下面是一些实现这个功能的设计。

```rust
// 选项1：类型序列化为`Value`枚举
pub enum Value {
    String(String),
    Number(isize)
}

pub trait Serialize {
    fn serialize(&self) -> Value;
}

fn value_to_json(value: Value) -> String {
    /* .. */
}

pub fn to_json(data: impl Serialize) -> String {
    let value = data.serialize();
    value_to_json(value)
}

// 选项2：类型通过调用`Serializer`接口进行序列化
pub trait Serialize {
    fn serialize<S: Serializer>(&self, serializer: &mut S);
}

pub trait Serializer {
    fn serialize_string(&mut self, s: &str);
    fn serialize_number(&mut self, n: isize);
}

struct JsonSerializer { buffer: String };
impl Serializer for JsonSerializer {
    /* .. */
}

pub fn to_json(data: impl Serialize) -> String {
    let mut serializer = JsonSerializer { buffer: String::new() };
    data.serialize(&mut serializer);
    serializer.buffer
}
```

</div>

<Quiz>
<template #description>

解析：两种设计都充分地解耦了，因此数据格式和`Serialize`的实现都是独立的。对于选项1，每种数据格式都将`Value`转为其他类型。`Value`就是模块的边界。

对于选项2，没有显式地表示出序列化值的类型，但`Serialize`的实现已经泛型化，所以任何实现了`Serializer`的类型都可以支持这个功能。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：不需要修改`Serialize`trait的实现代码就可以添加新的数据格式化。

<Checkbox>
<Option label="1" />
<Option label="2" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：选项1首先将将数据结构转为了一个中间态，`Value`，然后再将`Value`转为最终类型。这样的中间态需要额外的内存，而选项2则不需要，它的数据直接转为最终类型。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：序列化的过程应该尽可能少地使用内存。

<Checkbox>
<Option label="1" />
<Option label="2" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：对于选项1，`Serialize`只会有一种实例化，即将类型`T`转为`Value`。而选项2通过`s`实现了泛型化，所以每一次`T::serialize`的调用都会伴随一个新的`s`，Rust编译器会记录每一个`T::serialize`的新实例，这会比导致其编译产物更大。

</template>
<template #quiz>

选择能满足以下要求的设计：

要求：当同一份数据类型被序列化为多种类型时，应该尽可能少增加代码编译产物的大小。

<Checkbox>
<Option label="1" />
<Option label="2" />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
