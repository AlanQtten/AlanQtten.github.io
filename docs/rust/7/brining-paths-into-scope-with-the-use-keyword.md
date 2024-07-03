<script setup>
import {
  QuizProvider,
  Quiz,
  RadioHolder,
  Radio,
  Input
} from "../../components/quiz"

</script>

# 使用`use`关键字将路径引入作用域

用路径来调用函数非常的不方便，且存在大量的重复内容。在之前的代码中，不管我们用绝对路径还是相对路径来调用`add_to_waitlist`，每一次调用时，我们必须书写`front_of_house`和`hosting`。幸运的是，有一种办法可以简化这个流程：我们可以使用`use`关键字创建一个访问路径的捷径，然后在作用域内使用捷径。

下面的代码中，我们引入了`crate::front_of_house::hosting`模块到`eat_at_restaurant`所在作用域中，我们只需要使用`hosting::add_to_waitlist`就可以访问`add_to_waitlist`函数：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

使用`use`的过程很像文件系统中的软链接。通过在crate根中添加`use crate::front_of_house::hosting`，`hosting`在这个作用域里就是一个合法的名字了，就好像它在这里被定义了一样。`use`带入的路径也一样会检查权限。

请注意`use`只会为特定的作用域创建它所提及捷径。下面的代码将`eat_at_restaurant`函数移动到了一个新的`customer`子模块中，它和`use`的位置处在不同的作用域，所以代码无法编译：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

mod customer {
    pub fn eat_at_restaurant() {
        hosting::add_to_waitlist();
    }
}
```

编译器抛出的错误如下：

```
$ cargo build
    Compiling restaurant v0.1.0 (file:///projects/restaurant)
warning: unused import `crate::front_of_house::hosting`
 --> src/lib.rs:7:5
  |
7 | use crate::front_of_house::hosting;
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` on by default

error[E0433]: failed to resolve: use of undeclared crate or module `hosting`
 --> src/lib.rs:11:9
   |
11 |         hosting::add_to_waitlist();
   |         ^^^^^^^ use of undeclared crate or module `hosting`

For more information about this error, try `rustc --explain E0433`.
warning: `restaurant` (lib) generated 1 warning
error: could not compile `restaurant` due to previous error; 1 warning emitted
```

请注意这里还有一个`use`没有被使用的警告。要修复这个问题，将`use`移动到`customer`模块内即可，也可以在`customer`块中使用`super::hosting`。

## 使用`use`创建符合使用习惯的路径

在上面的代码中，你可能会疑惑为什么我们声明了`use crate::front_of_house::hosting`然后在`eat_at_restaurant`调用了`hosting::add_to_waitlist`，而不是直接声明对于`add_to_waitlist`的路径，比如下面的代码：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting::add_to_waitlist;

pub fn eat_at_restaurant() {
    add_to_waitlist();
}
```

尽管这样的代码也能够完成功能，但我们之前的方式才是更合理在作用域中使用`use`引入函数的方式。引入函数的父级以为着在调用时我们必须通过它来调用。这样的调用方式使得代码非常清晰，且明确表示了函数不是在本地声明的，同时它仍然减少了路径的长度。而直接引入的方式可能会让人混淆`add_to_waitlist`定义的位置。

另一方面来说，当我们使用`use`引入结构体、枚举和其他元素时，使用完整的路径是更符合语义的。下面的代码就是一段引入`HashMap`的代码：

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

这种风格的背后没有什么严肃的理由：它们只是逐渐形成的惯例，大家都会这么写、读Rust代码。

这种风格也有例外，当我们需要引入两个同名元素时，Rust不允许那种事发生。下面的代码就展示了通过父路径引入了两个相同的`Result`类型：

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    // 略
}

fn function2() -> io::Result<()> {
    // 略
}
```

如你所见，引入的两个父模块定义了两个`Result`类型。如果我们声明了`use std::fmt::Result`和`use std::io::Result`，那么这个作用域里就有两个`Result`类型，Rust无法明确该使用哪一个。

## 使用`as`关键字为引用提供重命名

另一个使用`use`引入同名路径的办法是，在路径后，我们可以提供`as`关键字和一个新名字，或者说*别名*。下面的代码展示了如何使用这种方式来为`Result`重命名：

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    // 略
}

fn function2() -> IoResult<()> {
    // 略
}
```

在第二个`use`声明中，我们为`std::io::Result`类型选择了`IoResult`这个新名字，它不会和`std::fmt`的`Result`冲突，这种方式也是符合语义的，选择这种方式还是用父模块引用取决于你！

## 使用`pub use`来重复导出

当我们使用`use`关键字为一个作用域引入某些元素时，它在这个新作用域中是私有的。如果希望调用我们代码的人用和我们一样的方式调用这些代码，我们需要结合`pub`和`use`。这种技术叫做*重导出*，因为我们不仅将元素引入了作用域，还允许它被其他作用域引用。

下面的代码展示了将根模块中的`use`改为了`pub use`：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

在这个改动前，外部的代码必须使用`restaurant::front_of_house::hosting::add_to_waitlist()`来调用`add_to_waitlist`。但现在，`hosting`已经在根模块中被重新导出了，所以外侧的代码可以使用`restaurant::hosting::add_to_waitlist()`来调用。

当你代码的内部结构和调用者所期望的结构不一致时，重导出是十分有用的。比如，在这个餐厅的例子里，我们一直在讨论“前厅”和“后厨”。但餐厅的真正顾客可能并不会从那些角度看待餐厅。使用了`pub use`，我们可以使用一种结构来组织代码，使用另一种结构来导出。这样的方式使得代码对维护者和调用者来说都是很有组织的。我们会在第十四章讨论`pub use`对crate文档的影响。

## 使用外部包

在第二章，我们开发了一个猜数游戏，它使用了一个外部的包来获取随机数，名字叫做`rand`。要使用`rand`，你需要在*Cargo.toml*中加入下面的代码：

```rust
rand = "0.8.5"
```

在*Cargo.toml*中将`rand`添加为依赖告诉Cargo去下载指定版本的`rand`包（或者任何carte.io提供的依赖）供我们的代码使用。

然后，要将`rand`的定义带入我们包的作用域中，我们可以使用`use`和包名，即`rand`，然后列出我们想要使用的元素。回顾第二章的内容，我们引入了`Rng`特性来调用`rand::thread_rng`函数：

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
}
```

Rust社区的用户创建了许多有用的包，它们都在crate.io这个网站，引入任何一个包的步骤都是如此：在*Cargo.toml*中列出，然后使用`use`引入。

请注意`std`标准库也是一个外部的包。因为标准库会随Rust语言一起发布，所以我们不需要在*Cargo.toml*中引入`std`。但我们还是需要使用`use`来引入它们到我们包的作用域中。比如，如果我们想要使用`HashMap`：

```rust
use std::collections::HashMap;
```

这是一个绝对路径，使用`std`开头，也就是标准crate库的名字。

## 使用嵌套路径来缩减庞大的`use`列表

如果我们使用了同一个crate或同一个模块的多个元素，将它们一一列出会占据很大的纵向空间。比如，猜数游戏中我们就引入了两个标准库的元素：

```rust
// 略
use std::cmp::Ordering;
use std::io;
// 略
```

其实，我们可以使用嵌套的路径来在一行引入同一个域下的元素。我们可以声明它们相同的部分，然后使用双冒号，最后使用大括号列出不同的部分，比如：

```rust
// 略
use std::{cmp::Ordering, io};
// 略
```

在大型项目中，使用嵌套路径来导入同一crate或模块中的不同元素比起多个`use`能省去大量的空间！

我们可以在路径的任意级别使用嵌套路径，这种方式在分享子路径时十分有用。比如，下面的代码就是两个对`std::io`和`std::io::Write`的不同引用。

```rust
use std::io;
use std::io::Write;
```

这两段路径的共同部分是`std::io`，那就可以作为完整的第一段路径。要合并这两段声明，我们可以使用`self`：

```rust
use std::io::{self, Write};
```

这样就引入了`std::io`和`std::io::Write`。

## 通配符操作

如果你想引入*所有*公共的元素，那么你可以使用通配符：

```rust
use std::collections::*;
```

这样的`use`声明引入了`std::collections`中定义的所有公共元素。但请小心使用这种语法！通配符很容易导致作用域中的名字和引入的名字产生混淆。

通配符常常在导入测试模块`tests`时使用。我们会在第11章讨论。这种语法也常常用在预引入匹配中，可以查看标准库定义来获取更多内容。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`use`允许缩减不使用`use`时的路径，避免冗长的引用。

</template>
<template #quiz>

以下哪一条对`use`关键字的描述最准确？

<RadioHolder>
<Radio label="use告诉编译器要使用什么元素，应该对其进行优化" />
<Radio label="use缩减了元素冗长的引用路径" answer />
<Radio label="use允许元素避开正常的权限规则" />
<Radio label="use将一个元素的内容从一个模块复制到另一个" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：针对`a`有两条路径：`parent::a`和`a`。针对`b`没有路径，因为它是私有的。针对`c`有三条路径：`parent::child::c`、`child::c`、`alias::c`。

</template>
<template #quiz>

考虑下面的模块和`use`声明：

```rust
pub mod parent {
    pub fn a() {}
    fn b() {}
    pub mod child {
        pub fn c() {}
    }
}

fn main() {
    use parent::{*, child as alias};
    // ...
}
```

在`main`函数内，可以引用到`a`、`b`、`c`的路径数量是多少（不包括使用`self`、`super`、`crate`关键字的引用）？

<Input answer="5" />

</template>
</Quiz>
</QuizProvider>
:::
