<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  Input
} from "../../components/quiz"

</script>

# 模块树元素的引用路径

为了展示Rust如何在模块树中找到一个元素，我们使用和文件系统定位路径相同的方式。要调用一个函数，我们需要知道它的路径：

一个路径会以下面两种形式出现：
- *绝对路径*是从crate根开始的完整路径；对于外部crate的代码，绝对路径从crate的名字开始，而对当前crate的代码，使用`crate`开始、
- *相对路径*是从当前的模块开始，使用`self`，`super`，或当前模块的标识符。

绝对路径和相对路径都使用被双冒号（`::`）分割的标识符组成。

回到上一节的结尾，假设我们想调用`add_to_waitlist`函数。就等同于在问：`add_to_waitlist`函数的路径是什么？下面的代码包括了之前代码中提及的模块，但移除了一些不相干的函数。

我们会展示两种在`eat_at_restaurant`（定义在crate根中的函数）中调用`add_to_waitlist`函数的方式。这些路径都是正确的，但还是会有阻碍编译的问题，我们等下会讨论。

`eat_at_restaurant`函数是这个crate库的公共API之一，所以我们要使用`pub`关键字标识。后面我们会深入讨论`pub`关键字：

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

`eat_at_restaurant`中对`add_to_waitlist`的第一次调用，我们使用了绝对路径。`add_to_waitlist`和`eat_at_restaurant`定义在了一个crate中，也就是说我们可以使用`crate`关键字作为绝对路径的开头。然后我们会按路径书写模块，直到找到`add_to_waitlist`。你可以想象一个类似结构的文件系统：我们要使用`/front_of_house/hosting/add_to_waitlist`来运行`add_to_waitlist`程序；使用`crate`来开始就像使用文件系统的`/`一样。

`eat_at_restaurant`中对`add_to_waitlist`的第二次调用，我们使用了相对路径。这个路径开始于`front_of_house`，即模块的名字，它和`eat_at_restaurant`定义在模块树的同一级。类似模块系统中使用`front_of_house/hosting/add_to_waitlist`。使用模块的名字作为开始意味着这个路径是相对路径。

相对、绝对路径的选择取决于你的工程，也取决于你更希望将代码定义和使用分离还是放置在一起。比如，如果我们把`front_of_house`和`eat_at_restaurant`模块移动到`customer_experience`模块中，我们就需要更新`add_to_waitlist`的绝对路径，但相对路径仍然是有效的。然而，如果我们把`eat_at_restaurant`移动到一个不同的模块`dining`，那么`add_to_waitlist`的绝对路径仍然是保持不变的，但相对路径就需要更新了。通常来说，我们更倾向于绝对路径，因为我们希望保持代码定义和调用的独立性。

尝试编译上面的代码，我们会看到下面的报错：

```
$ cargo build
    Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: module `hosting` is private
 --> src/lib.rs:9:28
  |
9 |    crate::front_of_house::hosting::add_to_waitlist();
  |                           ^^^^^^^ private module
  |
note: the module `hosting` is defined here
 --> src/lib.rs:2:5
  |
2 |    mod hosting {
  |    ^^^^^^^^^^^

error[E0603]: module `hosting` is private
 --> src/lib.rs:12:21
   |
12 |    front_of_house::hosting::add_to_waitlist();
   |                    ^^^^^^^ private module
   |
note: the module `hosting` is defined here
 --> src/lib.rs:2:5
   |
2  |    mod hosting {
   |    ^^^^^^^^^^^
For more information about this error, try `rustc --explain E0603`.
error: could not compile `restaurant` due to 2 previous errors
```

报错信息说`hosting`是私有的。换句话说，我们对`hosting`模块和`add_to_waitlist`函数使用了正确的路径，但Rust不允许我们使用它们，因为我们没有权利访问私有的部分。在Rust中，所有的元素（函数、方法、结构体、枚举、模块、常量）都对其父模块默认私有。如果你希望让一个类似函数或者结构体私有，你可以将它们放入模块。

父模块中的元素无法使用子模块中的私有元素，但子模块中的元素可以使用其祖先模块的元素。因为子模块折叠、隐藏了它们的实现细节，但子模块能看到它们被定义位置的上下文。顺着我们的比喻思考，权限规则就好像餐厅后厨的办公室：这里发生的事对顾客是保密的，但办公室经理可以掌握和操作餐厅里发生的所有事。

Rust选择这么实现模块系统是为了使内部的实现默认就是隐藏的。这样，你就能在不破坏外侧代码的情况下修改内侧的逻辑。然而，Rust也给予了暴露子模块内部代码给其祖先模块的能力，即使用`pub`关键字来使元素公开。

## 使用`pub`关键字暴露路径

回到上面代码的错误，它告诉我们`hosting`是私有的。如果我们希望父模块的`eat_at_restaurant`方法能够访问子模块的`add_to_waitlist`函数，我们就可以使用`pub`关键字对`hosting`模块进行标记：

```rust
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

不幸的是，这样的代码仍然会收到报错：

```
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: function `add_to_waitlist` is private
 --> src/lib.rs:9:37
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                                     ^^^^^^^^^^^^^^^ private function
  |
note: the function `add_to_waitlist` is defined here
 --> src/lib.rs:3:9
  |
3 |         fn add_to_waitlist() {}
  |         ^^^^^^^^^^^^^^^^^^^^

error[E0603]: function `add_to_waitlist` is private
  --> src/lib.rs:12:30
   |
12 |     front_of_house::hosting::add_to_waitlist();
   |                              ^^^^^^^^^^^^^^^ private function
   |
note: the function `add_to_waitlist` is defined here
  --> src/lib.rs:3:9
   |
3  |         fn add_to_waitlist() {}
   |         ^^^^^^^^^^^^^^^^^^^^

For more information about this error, try `rustc --explain E0603`.
error: could not compile `restaurant` due to 2 previous errors
```

发生了什么？在给`mod hosting`添加了`pub`关键字后，这个模块是公开的了。随着这个改变，如果我们可以访问`front_of_house`，那么我们就能访问`hosting`。但`hosting`的*内容*仍是私有的；将模块公开并不会自动使其内容公开。模块声明上的`pub`关键字只是允许模块被其祖先模块引用了，它的内部代码仍不允许访问。因为模块就是容器，让模块本身变为公开往往没什么意义；我们需要更进一步，选择具体的一个或多个需要公开的元素。

上面的错误说`add_to_waitlist`是私有的。权限的规则适用于结构体、枚举、函数和方法，作用方式和模块相同。

我们可以在`add_to_waitlist`的定义前添加`pub`关键字来让其公开：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist()
}
```

现在代码可以正常编译了！为了了解为什么增加`pub`关键字可以使`add_to_waitlist`被正常访问，让我们来看看绝对路径和相对路径。

在绝对路径中，我们使用`crate`开头，它是crate模块树的根。`front_of_house`在crate根中被定义了。当`front_of_house`设置为公开时，由于`eat_at_restaurant`函数和它定义在了相同的模块中（也就是说，`eat_at_restaurant`和`front_of_house`是相邻的），我们可以在`eat_at_restaurant`中引用`front_of_house`。接着是使用`pub`标记的`hosting`模块。我们可以访问到`hosting`的父模块，所以我们可以访问到`hosting`。最后，`add_to_waitlist`函数使用`pub`标记了，且我们可以访问到它的父模块，所以函数的调用是成功的。

在绝对路径中，逻辑和相对路径类似，只有第一步略有不同：它并不是从crate根开始，而是从`front_of_house`开始。`front_of_house`模块和`eat_at_restaurant`定义在了相同的模块中，所以相对路径使用`eat_at_restaurant`定义的位置作为开始是可以的。然后，因为`hosting`和`add_to_waitlist`都使用`pub`标记了，所以剩余的路径也是可访问的，因此整个函数的调用都是有效的。

如果你想分享你的crate库供其他人调用，你的公共API就是你和用户的合约，它们对代码如何使用进行了说明。如何妥善的修改API来让依赖你代码的用户使用起来更加便捷是一个值得考虑的问题。但它们超出了本教程的范围；如果你对这个话题有兴趣，可以查看Rust风格指南。

> ### 包含二进制文件和库的包的最佳实践
>
> 我们之前提到过，一个包可以同时包含*src/main.rs*作为二进制crate根和*src/lib.rs*作为crate库根，且它们的名字都和包名相同。通常来说，这种同时包含二进制crate和crate库的包会同时包含能够调用crate库的可执行文件。这样可以最大程度上让其他人享受到这个包的功能，因为crate库的代码已经被分享了。
>
> 模块树应该在*src/lib.rs*中被定义。然后，任何公共的元素都可以在二进制crate中通过包名开头的路径被使用。二进制crate变为了一个crate库的使用者，就想完全独立的外部代码在使用一样：它只能使用公共API。这种方式可以帮助你设计一个优秀的API；你不仅是作者，也是使用者。
>
> 在第十二章，我们会示范如何用这种组织来开发一个命令行程序，它包括了一个二进制crate和一个crate库。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：比如，对a模块中的元素b进行绝对路径引用，应为`crate::a::b`。

</template>
<template #quiz>

在当前crate下使用绝对路径访问元素时，开头的关键字是什么？

<Input answer="crate" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：`b`对`main`是不可访问的，因为模块`bar`没有被标记为公开。

</template>
<template #quiz>
<IsCompileText />

```rust
pub mod foo {
    fn a() { println!("a"); }
    mod bar {
        pub fn b() { println!("b"); }
    }
}

fn main() {
    foo::bar::b();
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：在`foo`中使用`bar`的相对路径时合法的。

</template>
<template #quiz>
<IsCompileText />

```rust
pub mod foo {
    pub mod bar {
        pub fn b() { println!("b"); }
    }
    pub fn a() { bar::b(); }

fn main() {
    foo::a();
}
```

<IsCompile :answer="{ compiled: true, result: 'b' }" />
</template>
</Quiz>
</QuizProvider>
:::

## `super`开头的相对路径

我们可以以父模块开始构造相当路径，不用当前的模块或crate根，而是使用`super`作为路径的开始。这就好像在文件系统中使用`..`语法一样。使用`super`可以引用到父模块中已知的元素，因为它是相对于父模块定位的，我们也可以更方便地组织代码，比如将父模块移动到其他地方。

查看下面的代码，它抽象了一个场景：一位主厨修正了一个不正确的顺序，且亲自把菜端给了顾客。`back_of_house`中定义的函数`fix_incorrect_order`调用了父模块的`deliver_order`函数，且使用`super`作为开头：

```rust
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();
    }

    fn cook_order() {}
}
```

`fix_incorrect_order`函数在`back_of_house`模块中，所以我们可以使用`super`来访问`back_of_house`的父模块，这种情况下就是`crate`，根模块。在这里，我们找到了`deliver_order`，成功！我们会把`back_of_house`模块和`deliver_order`函数看为相对静止的位置关系，如果我们决定调整模块树，它们也应该被一起移动。因此，我们可以使用`super`关键字，如果我们有一天移动代码，这些位置可以省去一些改动量。

## 创建公共的结构体和枚举

我们可以使用`pub`来创建公共的结构体和枚举，但这里有一些细节。如果我们在结构体的定义前使用了`pub`，那么这个结构体是公开的，但结构体的字段仍然是私有的。我们可以根据具体情况决定每个字段是否公开。在下面的代码中，我们定义了公共的`back_of_house::Breakfast`结构体，它的`toast`字段是公开的，但`seasonal_fruit`字段是不公开的。这种情况描述了在餐厅里，客人可以挑选早饭面包的类型，但是主厨才能决定和早餐搭配的时令水果。水果可能会发生变化，所以客人不能选择，甚至看不到他们即将享用的水果：

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // 在夏天，来一份包含黑麦（rye）吐司的早餐
    let mut meal = back_of_house::Breakfast::summer("Rye");
    // 改主意了，想更换面包的种类
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);

    // 下面的代码是无法通过编译的
    // meal.seasonal_fruit = String::from("blueberries");
}
```

由于`back_of_house::Breakfast`结构体的`toast`字段是公有的，所以在`eat_in_restaurant`函数内我们可以使用点语法来访问和修改它。注意我们不能在`eat_in_restaurant`内使用`seasonal_fruit`字段，因为它是私有的。取消掉注释，你就能看到其报错！

同时，因为`back_of_house::Breakfast`拥有私有字段，所以它需要提供一个公有的关联函数来构造`Breakfast`实例（这里我们命名为`summer`）。如果`Breakfast`没有这样一个函数，那么我们就无法创建它的实例，因为我们无法为私有字段赋值。

相反，如果我们将一个枚举设置为公开的，那么它所有的变体都是公开的。我们只需要在`enum`关键字前使用`pub`：

```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,
        Salad,
    }
}

pub fn eat_at_restaurant() {
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

因为我们创建了一个公共的枚举`Appetizer`，我们可以在`eat_at_restaurant`中自由使用`Soup`和`Salad`。

如果枚举的变体不是都公开，那么它就没那么有用了；给枚举的每个变体加上`pub`关键字又会很烦人，所以枚举的变体默认就是公开的。而结构体在他们的字段没有公开的情况下也是十分有用的，所以结构体的字段遵循了通用的规则：默认为私有，除非增加`pub`声明。

还有一个包含了`pub`的情况我们没有讨论，就是我们的类型系统最后的功能：`use`关键字。我们会先介绍`use`，再展示它和`pub`的结合使用。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`entry`在模块`a`内使用了路径`super::b::c::f.entry`，所以`super`指向了`a`的父模块，即crate根。`b`指向了最外层的模块`b`，它的子模块`c`包含了函数`f`，打印了“c2”。

</template>
<template #quiz>
<IsCompileText />

```rust
pub mod a {
    pub mod b {
        pub fn f() { println!("b1"); }
        pub mod c {
            pub fn f() { println!("c1"); }
        }
    }
    pub fn entry() { super::b::c::f(); }
}

pub mod b {
    pub fn f() { println!("b2"); }
    pub mod c {
        pub fn f() { println!("c2"); }
    }
}

fn main() {
    crate::a::entry();
}
```

<IsCompile :answer="{ compiled: true, result: 'c2' }"/>
</template>
</Quiz>

<Quiz>
<template #description>

解析：`Point`结构体本身和静态方法`origin`都是公开的，但字段`i32`没有被标记为公开。因此直接在`point`模块外使用`p.0`进行访问是不被允许的。如果希望程序通过编译，可以将第三行修改为`pub struct Point(pub i32, pub i32)`。

</template>
<template #quiz>
<IsCompileText />

```rust
pub mod point {
    #[derive(Debug)]
    pub struct Point(i32, i32);

    impl Point {
        pub fn origin() -> Self { Point(0, 0) }
    }
}

fn main() {
    let mut p = point::Point::origin();
    p.0 += 1;
    println!("{p:?}");
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::
