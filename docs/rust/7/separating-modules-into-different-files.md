<script setup>
import {
  QuizProvider,
  Quiz,
  Input
} from "../../components/quiz"

</script>

# 将模块分割为多个文件

到目前为止，这一章的所有例子都是在单个文件中定义了多个模块。但是，当模块的体积愈来愈大时，你可能希望将其拆分为多个文件，让代码更方便定位。

例如，对于我们上一节提到的餐厅中的多个模块。我们可以将他们分离为多个文件，而不是全部定义在crate根中。这种情况下，crate根文件是*src/lib.rs*，但是这种工作针对二进制crate的crate根*src/main.rs*来说也是生效的。

首先，我们希望将`front_of_house`模块分离成单独的文件。移除掉`front_of_house`大括号内的代码，只保留`mod front_of_house;`声明，所以*src/lib.rs*里应如下（注意这段代码目前是无法编译的）：

```rust
mod front_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

然后，将大括号内的代码移动到一个新文件*src/front_of_house.rs*内。编译器明白该扫描这个文件，因为它已经在crate根中看到了`front_of_house`的模块声明。

```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

请注意你只需要使用`mod`声明*一次*来让文件加入你的模块树。一旦编译器知道这个文件是项目的一部分（也会根据`mod`声明的位置理解它在模块树中的位置），你项目中的其他文件就可以使用路径来引用到这些模块了，就像我们前面提到的一样。换句话说，`mod`*不是*一个你可能在其他语言见过的“包含”操作。

接着，我们来分离`hosting`模块。这个过程略有不同，因为`hosting`是`front_of_house`的子模块，并不是根模块。我们需要在*src/front_of_house/*下创建属于它的新文件。

要开始移动`hosting`，我们需要先修改*src/front_of_house.rs*文件：

```rust
pub mod hosting;
```

接着我们创建*src/front_of_house*目录和一个*hosting.rs*文件来包含`hosting`模块的内容：

```rust
pub fn add_to_waitlist() {}
```

如果我们将*hosting.rs*文件直接放置在*src*目录下，编译器就会将`hosting`模块看做一个根模块，而不是`front_of_house`的子模块。编译器对于文件结构的规则意味着目录和文件必须和文件树保持一致。

> #### 备用文件路径
>
> 目前为止我们一直在用Rust最流行的方式命名文件路径，但Rust也支持一些更老风格的文件路径。对于一个`front_of_house`模块，编译器会在如下位置扫描模块代码：
> - *src/front_of_house.rs*（我们已经提过的）
> - *src/front_of_house/mod.rs*（更老的风格，但仍被支持）
>
> 对于`front_of_house`的子模块`hosting`，编译器会在如下位置扫描模块代码：
>
> - *src/front_of_house/hosting.rs*（我们已经提过的）
> - *src/front_of_house/hosting/mod.rs*（更老的风格，但仍被支持）
>
> 如果你混用了这两种风格，你会看到一个编译器错误。在同个项目内混用这两种风格是可行的，但可能会使代码的维护成本增加。
>
> 旧风格的问题在于，你的项目最终可能会存在多个*mod.rs*文件，如果同时在编辑器中打开它们，很容易会搞混。

我们将每个模块的代码都移动到单独的文件里了，而模块树的结构保持不变。尽管这些定义放置在了不同的文件里，但函数`eat_at_restaurant`不需要任何改动就能跟以前一样正常工作。这种技术允许你在模块内容增多时灵活移动它们。

请注意*src/lib.rs*文件中`pub use crate::front_of_house::hosting`声明也没有变化，`use`并不会影响哪些文件被编译为`crate`的一部分。`mod`关键字声明了模块，Rust就会检查对应文件的代码，将它们看做模块的一部分。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：这个项目的模块树如下：

```
foobar
└── engine
    └── run
```

所以调用`run`的路径是`foobar::engine::run`。

</template>
<template #quiz>

现有Rust包目录如下：

```
foobar
├── Cargo.toml
└── src/
    ├── lib.rs
    ├── engine.rs
    └── engine/
        └── analysis.rs
```

文件的内容为：

```rust
// engine/analysis.rs
pub fn run() {}

// engine.rs
mod analysis;
pub use analysis::*;

// lib.rs
pub mod engine;
```

如果你是`foobar`库的使用者，你希望调用`run`函数，该如何书写路径？

<Input answer="foobar::engine::run" />

</template>
</Quiz>
</QuizProvider>
:::

## 总结

Rust允许你将包分解为多个crate，而crate又可以分解为多个模块，每个模块都可以引用其他模块的元素。你可以使用绝对和相对路径。这些路径可以使用`use`声明来引入，这样可以使用更短的路径。模块的代码默认是私有的，但你可以使用`pub`关键字来使其公开定义。

下一章，我们会看一些标准库中的集合数据结构，你可以把它们用在你整洁的代码里。
