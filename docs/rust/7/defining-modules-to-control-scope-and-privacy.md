<script setup>
import {
  QuizProvider,
  Quiz,
  RadioHolder,
  Radio
} from "../../components/quiz"

</script>

# 通过模块定义控制作用域和私有权

在这一节中，我们会讨论模块，以及模块系统的其他部分，具名的*路径*允许你为元素命名；`use`关键字可以让你将路径引入作用域；`pub`关键字可以创建公开的元素。我们也会讨论`as`关键字，外部依赖，以及通配符操作符。

首先，我们看看一些规则，在你未来的代码中，它们可以起到很大帮助。然后我们再逐条解析规则的细节。

## 模块速查表

这里我们会提供一个速查表：包括模块，路径，`use`，`pub`在编译器中的工作原理，以及大多数开发者组织代码的方式。这一大章我们会逐条讨论这些规则，但这里是一个速查的好地方。

- **从crate根出发**：当编译一个crate时，编译器会从crate的根（入口）文件出发（通常来说，crate库的入口文件时*src/lib.rs*，而二进制crate的入口是*src/main.rs*）进行编译。
- **声明模块**：在crate的根文件里，你可以声明一个新的模块；比如，你可以使用`mod garden`来定义一个“garden”模块。编译器会在以下位置检查模块的代码：
  - 行内，即`mod garden`跟随的大括号内的代码
  - 文件*src/garden.rs*
  - 文件*src/garden/mod.rs*
- **声明子模块**：在除了crate根外的其他文件里，你可以声明子模块。比如，你可能会在*src/garden.rs*中定义`mod vegetables;`。编译器会在以下位置检查子模块的代码：
  - 行内，即`mod vegetables`跟随的大括号内的代码
  - 文件*src/garden/vegetables.rs*
  - 文件*src/garden/vegetables/mod.rs*
- **模块中的代码路径**：当你的crate包含模块时，你可以在crate中任何位置引用、使用模块中的代码，只要权限允许。比如，garden模块，vegetables子模块中的`Asparagus`类型可以使用如下路径`crate::garden::vegetables::Asparagus`。
- **私有vs公有**：模块中的代码默认是私有的。如果你希望设置为公有，那么你需要使用`pub mod`而不是`mod`来定义模块。要使模块中的成员公有，在它们的定义前增加`pub`关键字。
- **`use`关键字**：在作用域内，`use`关键字可以创建对模块成员的捷径，省去了完整的长路径。在任何你能引用到`crate::garden::vegetables::Asparagus`的地方，你可以使用`use crate::garden::vegetables::Asparagus;`来创建捷径，之后你要使用时，只需要书写`Asparagus`即可。

下面我们创建了一个二进制的crate，名字叫做`backyard`，验证上述规则。crate的目录，也命名为`backyard`，包含了这些文件和目录：

```
backyard
├── Cargo.lock
├── Cargo.toml
└── src
    ├── garden
    │   └── vegetables.rs
    ├── garden.rs
    └── main.rs
```

crate的根文件是*src/main.rs*，它的内容如下：

```rust
use crate::garden::vegetables::Asparagus;

pub mod garden;

fn main() {
    let plant = Asparagus {};
    println("I'm growing {:?}!", plant);
}
```

`pub mod garden;`告诉编译器去寻找*src/garden.rs*里的代码，其中的代码如下：

```rust
pub mod vegetables;
```

这里，`pub mod vegetables;`表示*src/garden/vegetables.rs*里的代码也要被包含进来，其中的代码如下：

```rust
#[derive(Debug)]
pub struct Asparagus {}
```

下面我们来逐条审视这些规则，并展示它们的实际用途！

## 使用模块来组合关联代码

*模块*是我们有效组织crate中的代码，使其可读性、可复用性增加的方式。模块允许我们控制成员的*权限*，因为模块中的代码默认是私有的。私有的内容是不对外开放使用的内部实现细节。我们可以选择让模块或其成员变为公有，这样会让外部的代码使用它们，产生依赖。

举个例子，让我们实现一个crate库，它包含了一个各种餐厅服务的功能。我们会定义函数签名，但它们的函数体均为空，我们只关注代码的组织，不关心实现细节。

在餐饮行业，餐厅的一部分被称为*前厅*（front of house），其他部分称为*后厨*（back of house）。前厅是顾客所在的地方；包括服务生给顾客安置座位，上菜和结账，酒保也会在这里调酒。后厨是主厨和厨师们工作的地方，也别叫做厨房，这里也负责清理盘子，经理也会在这里进行一些行政工作。

为了使我们的crate变得更有条理，我们将这些函数定义在一个嵌套的模块里。使用`cargo new restaurant --lib`创建一个新的crate库，它的名字是`restaurant`；然后在*src/lib.rs*中输入代码来定义模块和函数，下面是前厅的部分：

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}

        fn seat_at_table() {}
    }
    mod serving {
        fn table_order() {}

        fn serve_order() {}

        fn table_payment() {}
    }
}
```

我们使用`mod`关键字和模块名（即`front_of_house`）定义了一个模块。模块的内容在大括号内。在模块内，我们放置了其他模块，即`hosting`和`serving`。这里也可以放置其他定义，比如结构体，枚举，常量，特性，当然还有上面的例子中出现的————函数。

通过使用模块，我们可以将相关联的定义加以组织，同时给给予名称来说明它们为什么有关联。使用这些代码的开发者可以根据组织结构来快速定位到代码，而不是通读整篇定义。维护这些代码的开发者也可以了解该如何放置新的功能，保持代码的有组织性。

之前，我们提到了*src/main.rs*和*src/lib.rs*被称为crate根。这样称呼它们的原因是它们形成了一个模块，位于`crate`这个模块的根部，也被称为*模块树*。

```
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment

```

这棵树展示了模块间的嵌套关系；比如，`hosting`就位于`front_of_house`内部。这棵树也展示了模块间的*相邻*关系，即它们位于同一模块下；`hosting`和`serving`就是相邻的，它们都定义在`front_of_house`内部。如果模块A在模块B内，我们会说模块A是模块B的*子模块*，模块B是模块A的*父模块*。请注意整个模块树都定义在内置模块`crate`下。

模块树可能会让你想起电脑中文件系统的目录树，这个比较非常恰当！就像文件系统的目录一样，你可以使用模块来组织代码。就像文件系统的文件一样，我们需要一种方式来找到我们的模块。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：模块在运行时没有任何作用，它们纯粹是为了编译时的代码组织。

</template>
<template #quiz>

以下哪一项**不是**使用模块的好处？

<RadioHolder>
<Radio label="模块包含了无需被使用者了解的实现细节" />
<Radio label="模块提供了作用域来避免各个代码片段间的命名冲突" />
<Radio label="模块提高了同一模块中相互依赖代码的性能" answer />
<Radio label="模块将代码按照关联性分组，使得开发者可以更容易地在大型项目中工作" />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
