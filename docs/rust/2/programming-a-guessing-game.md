<script setup>
import Keyboard from '../../components/keyboard/Keyboard.vue'
</script>

# 开发一个猜数游戏

我们来通过一起直接上手开发一个项目快速进入Rust！这一章会通过展示真实的项目实践，为你介绍一系列常见的Rust概念。你可以学习到`let`，`match`，方法，关联函数，外部crate等等！在后面的章节里，我们会仔细探索这些概念。但在本章，你只会进行一些基本操作。

我们会实现一个经典的初学者项目：一个猜数游戏。它的规则如下：程序会生成一个1到100之间的随机数。然后它会提示用户输入一个数字。在数字被输入后，程序会告诉用户跟答案相比是太大了还是太小了。如果用户猜对了，那么程序会打印一句恭喜的话然后结束。

> [!NOTE]
> 由于本章旨在给予你一个语言的初体验，所以没有任何测试。

## 开始一个新项目

要开始一个新项目，进入第一章创建的*projects*目录，然后使用Cargo创建一个新的工程：

```bash
$ cargo new guessing_game
$ cd guessing_game
```

第一个命令，`cargo new`，会接收项目名（`guessing_game`）作为第一个参数。第二个命令则是切换到当前的工程目录。

查看生成的*Cargo.toml*文件：

```toml
[package]
name = "guessing_game"
version = "0.1.0"
edition = "2024"

[dependencies]
```

和你在第一章看到的一样，`cargo new`生成了一个“Hello, world!”程序，检查*src/main.rs*文件：

```rust
fn main() {
    println!("Hello, world!");
}
```

现在我们来编译这个“Hello, world”程序，并和之前一样，使用`cargo run`来运行它：

```bash
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.08s
     Running `target/debug/guessing_game`
Hello, world!
```

`run`命令会在你不断迭代项目的过程中派上用场，就像我们当前的游戏一样，记得在每一步后快速地测试一下。

重新打开*src/main.rs*文件。你的代码之后都会写在这个文件里。

## 处理猜测

猜数游戏的第一部分是要求用户的输入，处理那个输入，然后检查输入的内容是否是期望的格式。作为开始，我们会允许玩家来输入一个猜测。代码如下：

```rust
use std::io;

fn main() {
    println!("猜一个数字！");

    println!("请输入你的猜测：");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("读取行内容失败");

    println!("你的猜测是：{guess}");
}
```

这段代码包含了许多信息，我们来逐行分析。为了接收用户的输入并把它作为结果来输出，我们需要引入`io`库。`io`库来自标准库，也就是`std`：

```rust
use std::io;
```

默认情况下，Rust会将一个提供了各种预定义功能的标准库引入到每个程序里。这个过程也被称为*预引入（prelude）*，你可以查看[文档](https://doc.rust-lang.org/std/prelude/index.html)来了解预引入的内容。

如果你使用的类型没有被预引入，那么你就需要使用`use`声明来显式地引入它。`std::io`提供了丰富的功能，其中就包括接收用户输入。

和你在第一章看到的一样，`main`函数作为每个程序的入口：

```rust
fn main() {
```

`fn`语法用于声明一个新函数；而括号`()`则表示没有任何参数；大括号`{`则表示函数的开始。

和第一章介绍的一样，`println!`是一个可以打印内容的宏：

```rust
    println!("猜一个数字！");

    println!("请输入你的猜测：");
```

这段代码会打印一些提示信息，告诉用户游戏的内容以及需要的输入。

### 将值存入变量

接着，我们会创建一个*变量*来存储用户的输入，即：

```rust
    let mut guess = String::new();
```

现在程序变得有趣了！这短短的一行包含了许多内容。我们使用了`let`声明来创建一个变量。下面是一个例子：

```rust
let apples = 5;
```

这行代码创建了一个新的变量名为`apples`，并将其绑定了值`5`。在Rust里，变量默认是不可变的，也就是说一旦我们赋予了变量值，它就是不可变的了。我们会在第三章讨论变量和可变性的更多细节。为了让变量可变，我们需要在变量名前添加一个`mut`：

```rust
let apples = 5; // 不可变
let mut bananas = 5; // 可变
```

> [!NOTE]
> `//`语法开始直到行结束表示注释。Rust会忽略注释里的一切内容。我们会在第三章讨论注释的更多内容。

回到我们的猜数游戏。你现在知道`let mut guess`会引入一个新的可变变量`guess`。等号符号`=`告诉Rust我们希望给这个变量绑定一些内容。在等号的右侧就是`guess`绑定的值，也就是`String::new()`的调用结果，这是一个会返回`String`实例的函数。[String](https://doc.rust-lang.org/std/string/struct.String.html)是标准库提供的可变字符串类型，使用UTF-8编码。

`::new`行里的`::`语法表示`new`是`String`类型的关联函数。*关联函数*是一种在类型上实现的函数，在这个情境里，这个类型就是`String`。`new`函数创建了一个新的空字符串。你可以在许多类型上看到`new`函数，因为这是一个常用的名字，用于创建某种类型的新实例。

完整来讲的话，`let mut guess = String::new();`创建了一个可变的变量，现在绑定到了一个新的空的`String`实例。

### 接收用户输入

回顾我们程序的第一行代码，也就是通过`use std::io;`从标准库引入输入/输出功能的操作。现在我们可以调用`io`模块的`stdin`函数，它会帮助我们处理用户输入：

```rust
    io::stdin()
        .read_line(&mut guess)
```

如果我们没有在程序的开始使用`use std::io`引入`io`模块，我们还是可以通过书写`std::io::stdin`这样的代码来调用函数。`stdin`函数会返回一个[std::io::Stdin](https://doc.rust-lang.org/std/io/struct.Stdin.html)实例，它代表命令行标准输入的句柄类型。

接着，`.read_line(&mut guess)`调用了标准输入句柄的[read_line](https://doc.rust-lang.org/std/io/struct.Stdin.html#method.read_line)方法来获取用户的输入。我们同时传入了`&mut guess`作为`read_line`的参数，告诉它我们希望将用户的输入存放在何处。`read_line`的全部工作就是接收用户的标准输入，并将其添加到字符串里（注意是添加而不是覆写），所以我们需要传入一个字符串作为参数。字符串参数必须是可变的，这样这个方法才能够修改它的内容。

`&`符号表示这个参数是一个*引用*，这是一种允许多个代码片段访问同一片内存，且无需在内存中复制其真实数据的功能。引用是一个复杂的功能，Rust的优势之一就是可以既安全又便捷地使用引用。你不需要知道那么多细节来完成这个项目。现在，你只需要知道，和变量一样，引用默认也是不可修改的。因此，你需要在这里写`&mut guess`而不是`&guess`来让其可变。（第四章会详细地解释关于引用的种种）

### 使用`Result`来处理潜在的错误

我们继续分析这些代码。现在来到代码的第三行，注意这部分仍然是属于一片代码逻辑。这是一个方法：

```rust
        .expect("读取行内容失败");
```

这行代码可以写成：

```rust
io.stdin().read_line(&mut guess).expect("读取行内容失败");
```

然而，一个很长的行读起来非常困难，所以最好将其划分。习惯上在`.method_name()`语法前使用一个换行并用空格对齐是更聪明的做法。现在我们来讨论这行代码的功能。

正如之前提到的，`read_line`会将任何用户的输入放置到我们传入的字符串内，但它会返回一个`Result`值。[Result](https://doc.rust-lang.org/std/result/enum.Result.html)是一个枚举（enumeration），也被叫做*enum*，这是一种表示多个可能状态的类型。每一种可能的状态都可以称为一种*变体*。

我们会在第六章讨论枚举的具体细节。`Result`类型旨在编码化错误处理信息。

`Result`的变体是`Ok`和`Err`。`Ok`变体表示操作成功，它包含了成功操作产生的值。而`Err`变体表示操作失败，它包含操作失
败的过程和原因。

`Result`类型，和其他的类型一样，也有定义的方法。`Result`实例类型上实现了[expect](https://doc.rust-lang.org/std/result/enum.Result.html#method.expect)方法。如果`Result`为`Err`值，那么`expect`的调用会让程序崩溃，并显示你传递给`expect`的参数作为信息。如果`read_line`方法返回`Err`，这个错误很有可能来自底层的操作系统。如果`Result`是`Ok`，`expect`会获取`Ok`持有的值，并将其作为函数本身的返回值。在本例中，这个值就是用户输入的字节数。

如果你没有调用`expect`，程序还是可以正常编译，但你会看到一个警告：

```bash
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
warning: unused `Result` that must be used
  --> src/main.rs:10:5
   |
10 |     io::stdin().read_line(&mut guess);
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: this `Result` may be an `Err` variant, which should be handled
   = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
   |
10 |     let _ = io::stdin().read_line(&mut guess);
   |     +++++++

warning: `guessing_game` (bin "guessing_game") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.59s
```

Rust会警告你没有使用`read_line`返回的`Result`值，这意味着程序没有处理潜在的错误。

去除这种警告的正确方式是开发错误处理的代码，但是在我们的例子里我们希望在错误出现时让程序崩溃，所以我们使用了`expect`。第九章会介绍关于错误处理的细节。

### 使用`println!`及占位符打印值内容

在大括号的结束行前，还有一行值得我们拿出来讨论的代码：

```rust
    println!("你的猜测是：{guess}");
```

这一行会打印一个包含用户输入的字符串。`{}`表示一个占位符：你可以把`{}`想象成小小的螃蟹钳子，在对应的位置拿着你的值。在打印变量的值时，在括号内填入变量名。在打印表达式的结果时，格式化字符串中可以为空，然后传入用逗号隔开的一系列表达式，其顺序和占位符一致。在同一个`println!`内打印变量和表达式的结构如下：

```rust
let x = 5;
let y = 10;

println!("x = {x} and y + 2 = {}", y + 2);
```

这段代码会打印`x = 5 and y + 2 = 12`。

### 测试第一部分的代码

我们来测试一下第一部分代码。运行`cargo run`：

```bash
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.44s
     Running `target/debug/guessing_game`
猜一个数字！
请输入你的猜测：
6
你的猜测是：6
```

现在，游戏的第一部分已完成：我们收到了用户的输入，然后打印了它。

## 生成一个神秘的数字

下面，我们需要生成一个神秘的数字，供用户猜测。这个神秘的数字应该是一个变化的数字，这样游戏才可供多次尝试。我们使用1到100之间的随机数，这样游戏不会过于困难。Rust目前没有在标准库内置随机数的功能。然而，Rust团队提供了一个[随机库](https://crates.io/crates/rand)来实现这个功能。

### 使用库来获取更多功能

记住crate就是一系列的Rust源码。我们目前构建的项目是一个*二进制crate*，也就是说它是可执行的。而`rand`库是一个*库crate（library crate）*，其中的代码用于其他用户引入，无法独立执行。

Cargo对于外部crate的管理能力是其亮点之一。在我们开发使用`rand`的代码前，我们需要修改*Cargo.toml*文件来将`rand`引入作为依赖。打开文件，在最下方添加一行，就在Cargo为你自动生成的`[dependencies]`节标题后。请确保添加指定版本的`rand`，否则其行为可能会和示例代码不一致：

```toml
[dependencies]
rand = "0.8.5"
```

在`Cargo.toml`文件里，一个节标题后的内容，直到下一个小节，都属于这一小节。在`[dependencies]`里，你告诉了Cargo你的项目依赖了哪些外部的crate，以及其对应的版本。这里我们指定了`rand`crate和一个语义化版本标识符`0.8.5`。Cargo理解语义化版本（有时候也会成为*SemVer*），这是一种版本号的标准格式。`0.8.5`其实是`^0.8.5`的缩写，意味着`0.8.5`到`0.9.0`值下的版本都满足要求。

Cargo认为这些版本的包API和`0.8.5`兼容，这样的声明可以保证你获取到和当前实例兼容的最新的修订版本。任何大于等于`0.9.0`的包都不保证和本例中的API一致。

现在，不修改任何代码，我们来构建一下工程：

```bash
$ cargo build
  Updating crates.io index
   Locking 15 packages to latest Rust 1.85.0 compatible versions
    Adding rand v0.8.5 (available: v0.9.0)
 Compiling proc-macro2 v1.0.93
 Compiling unicode-ident v1.0.17
 Compiling libc v0.2.170
 Compiling cfg-if v1.0.0
 Compiling byteorder v1.5.0
 Compiling getrandom v0.2.15
 Compiling rand_core v0.6.4
 Compiling quote v1.0.38
 Compiling syn v2.0.98
 Compiling zerocopy-derive v0.7.35
 Compiling zerocopy v0.7.35
 Compiling ppv-lite86 v0.2.20
 Compiling rand_chacha v0.3.1
 Compiling rand v0.8.5
 Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.48s
```

你可能会看到不同的版本号（但它们都是兼容的，感谢语义化版本号！）和不同的行数（和操作系统相关），行的顺序可能也不同。

在我们添加了外部依赖后，Rust会从*仓库*获取我们依赖的包的一切，也就是[Crates.io](https://crates.io/https://crates.io/)的复制版本。Crates.io是Rust的生态系统里存放各种Rust开源项目的地方。

在更新了仓库后，Cargo会检查`[dependencies]`小节，下载还没有下载过的crate。在本例中，虽然我们只列了`rand`作为依赖，Cargo仍然会下载一系列`rand`所依赖的crate。在下载完成后，Rust会编译它们，然后基于这些依赖编译我们的项目。

如果你不尽兴任何修改立刻运行`cargo build`，你不会看到除了`Finished`行以外的输出。因为Cargo知道虽然它已经完成了对依赖的下载和编译，但你的*Cargo.toml*中的修改与其无关联。Cargo还知道你的代码是没有变化的，所以它不会重新编译代码。由于无事可做，它会直接退出。

如果你打开了*src/main.rs*文件，做一些无关紧要的改动，然后保存并重新构建，你会看到如下输出：

```bash
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
```

这些行表示了Cargo只更新了和你的*src/main.rs*的小小改动相关的构建，它知道它可以重用之前下载和编译的部分。

### 通过*Cargo.lock*文件保障可重复的构建

Cargo内置了一种机制来保证你和其他人可以随时重新构建你的代码：而Cargo只会使用你声明的版本，除非你做了调整。比如，假设之后`rand`发布了`0.8.6`版本，而那个版本包含了一个重要的漏洞修复，但它也包含了一些对你的代码有影响的改动。为了应对这种变化，Rust会在你第一次运行`cargo build`时创建*Cargo.lock*文件，所以现在我们的*guessing_game*目录下应该已有这个文件了。

在你第一次构建项目时，Cargo认为此时的依赖版本都是比较合适的，所以会将其写入*Cargo.lock*文件。在未来你进行构建的时，Cargo会查看*Cargo.lock*文件是否存在，如果存在，那么会直接使用其中记录的版本，而不会重新推测。这样可以让你的重复构建自动化，换言之，你的项目会一直使用0.8.5版本的依赖，除非你手动升级，多亏了*Cargo.lock*。由于*Cargo.lock*对于重复构建来说十分重要，所以它通常也会和代码的其他部分一起被纳入代码版本管理中。

### 升级Crate来获取新版本

当你*确实*想升级一个crate时，Cargo提供了`update`命令，它会忽略*Cargo.lock*文件，并重新基于*Cargo.toml*对依赖版本进行推测。然后Cargo会将推测的结果写入*Cargo.lock*文件。这种情况下，Cargo会查找高于0.8.5而低于0.9.0的版本。如果`rand`有两个新的版本0.8.6和0.9.0，那么你会在运行`cargo update`时看到如下输出：

```bash
$ cargo update
    Updating crates.io index
     Locking 1 package to latest Rust 1.85.0 compatible version
    Updating rand v0.8.5 -> v0.8.6 (available: v0.9.0)
```

Cargo忽略了0.9.0版本。这时，你可以发现你的*Cargo.lock*文件发生了变化，记录了你使用的`rand`crate版本为0.8.6。如果你希望使用0.9.0或者0.9.x版本的`rand`，你需要修改你的*Cargo.toml*文件：

```toml
[dependencies]
rand = "0.9.0"
```

在你下次运行`cargo build`时，Cargo会更新crate仓库，并根据你新的指定内容重新推测你对`rand`的依赖。

关于Cargo和它的机制还有很多内容，我们会在第14章展开讨论，现在，上述内容就是你需要了解的一切了。Cargo使得重用库变得使用容易，这样Rustacean们就可以基于各种各样的包开发很少量专注的代码。

### 生成随机数

我们来使用`rand`生成一个随机数。更新*src/main.rs*的代码如下：

```rust
use std::io;

use rand::Rng;

fn main() {
    println!("猜一个数字！");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("神秘数字是：{secret_number}");

    println!("请输入你的猜测：");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("读取行内容失败");

    println!("你的猜测是：{guess}");
}
```

首先我们添加了行`use rand::Rng;`。`Rng`trait定义了各种生成随机数的实现，要使用这些方法，这个trait必须引入当前作用域。第十章会介绍trait的更多细节。

下面，我们会在代码中增加两行。在增加的第一行，我们调用了`rand::thread_rng`函数来给予我们一个特定数字生成器供我们使用：这个生成器存在于当前操作的本地线程，由操作系统提供种子。然后我们调用了生成器的`gen_range`方法。这个方法定义在`Rng`trait上，我们已经使用`use rand::Rng`将其引入了。`gen_range`方法接收一个范围表达式作为参数，并生成一个在那个范围里的数字。这里我们使用的范围表达式的形式是`开始..=结束`，这表示一个闭区间，所以我们需要使用`1..=100`来请求一个1到100之间的数字。

> [!NOTE]
> 当接触一个crate时，你并不知道该使用的trait、方法和函数，所以你需要查看crate相应的文档来了解。Cargo对此有一个优雅的设计，当你运行`cargo doc --open`命令时，它会构建你本地依赖所提供的文档，并在浏览器内打开。比如，如果你对`rand`crate的其他功能感兴趣，你可以运行`cargo doc --open`，然后点击侧边栏的`rand`来了解更多。

第二行打印了神秘数字。这对于我们开发程序过程中的调试非常有用，在最终版之前我们会删除。毕竟如果游戏的答案一开始就泄露了，那也谈不上什么游戏了！

运行程序几次：

```bash
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
猜一个数字！
神秘数字是：7
请输入你的猜测：
4
你的猜测是：4

$ cargo run
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
猜一个数字！
神秘数字是：83
请输入你的猜测：
4
你的猜测是：5
```

你可能会看到不同的数字，但它们都应该在1到100之间。干得漂亮！

## 对比用户的猜测和神秘数字

现在我们有了用户的输入和随机的数字了，我们可以进行对比了。这一部分代码如下，注意这部分代码还无法编译，我们会做出解释：

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    // 略

    println!("你的猜测是：{guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("太小了！"),
        Ordering::Greater => println!("太大了！"),
        Ordering::Equal => println!("你赢了！"),
    }
}
```

首先我们添加了另一行`use`声明，从标准库引入了`std::cmp::Ordering`。`Ordering`类型是另一个枚举，它的变体是`Less`、`Greater`和`Equal`。分别代表数字对比的三种结果。

然后我们在下面添加了五行使用`Ordering`类型的代码。`cmp`方法会对比两个值，任何可以比较的类型都可以调用。它接收一个被对比对象的引用：这里我们是用`secret_number`和`guess`对比。这个方法会返回`Ordering`枚举的一种变体，这个枚举我们已经使用`use`声明引入了。我们使用了`match`表达式来决定我们基于调用`cmp`对`guess`和`secret_number`进行对比后返回的`Ordering`的各种变体进行的下一步操作，

一个`match`表达式由*分支*组成，一个分支包括一个进行匹配的*模式*，以及如果给予`match`的值匹配成功要运行的代码。Rust会将`match`后跟随的值和各个分支进行逐一比较。模式和`match`结构是强大的Rust功能：它们允许你穷举代码的各种可能性，从而确保你处理了各种情况。这部分功能会分别在第六章和第十九章内详细展开。

我们来逐行分析一下我们这里使用的`match`。假设用户猜测的数字是50，而这次生成的随机数是38。

当代码用38和50进行对比时，`cmp`方法会返回`Ordering::Greater`，因为50比38大。所以`match`表达式拿到的是`Ordering::Greater`，然后它开始检查各个分支。首先查看第一个分支，`Ordering::Less`，`Ordering::Greater`和`Ordering::Less`不匹配，所以这里的代码会被忽略，然后进入下一个分支。下一个模式是`Ordering::Greater`，它是匹配的！所以这个分支的关联代码会被执行，它会打印`太大了！`。`match`表达式会在匹配到第一个成功的分支后结束，所以在这个情况下，最后一个分支不会进行检查。

然而，此时的代码是无法编译的，我们可以尝试一下：

```bash
$ cargo build
   Compiling libc v0.2.86
   Compiling getrandom v0.2.2
   Compiling cfg-if v1.0.0
   Compiling ppv-lite86 v0.2.10
   Compiling rand_core v0.6.2
   Compiling rand_chacha v0.3.0
   Compiling rand v0.8.5
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
error[E0308]: mismatched types
  --> src/main.rs:23:21
   |
23 |     match guess.cmp(&secret_number) {
   |                 --- ^^^^^^^^^^^^^^ expected `&String`, found `&{integer}`
   |                 |
   |                 arguments to this method are incorrect
   |
   = note: expected reference `&String`
              found reference `&{integer}`
note: method defined here
  --> /rustc/4eb161250e340c8f48f66e2b929ef4a5bed7c181/library/core/src/cmp.rs:964:8

For more information about this error, try `rustc --explain E0308`.
error: could not compile `guessing_game` (bin "guessing_game") due to 1 previous error
```

错误的核心在与*类型不匹配*。Rust的类型系统很强大，也很严格。然而，它也有类型推断。在我们写下`let mut guess = String::new()`时，Rust就会推断`guess`是一个`String`类型，我们无需手动注明。而`secret_number`则是一个数字类型。很多Rust的数字类型都可以存储1到100的值：比如32比特数字`i32`，无符号32比特数字`u32`，64比特数字`i64`等等。除非手动声明，否则Rust默认的数字类型是`i32`，也就是这里`secret_number`的类型，除非你添加类型信息来让Rust进行其他推断。这里的错误原因就是字符串和数字进行了比较。

最终，我们希望将程序读取的输入`String`转换为数字类型，这样我们就可以使用数字比较。我们可以给`main`函数添加一行代码来实现：

```rust
    // 略

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("读取行内容失败");

    let guess: u32 = guess.trim().parse().expect("请输入数字！");

    println!("你的猜测是：{guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("太小了！"),
        Ordering::Greater => println!("太大了！"),
        Ordering::Equal => println!("你赢了！"),
    }
```

添加的行是：

```rust
let guess: u32 = guess.trim().parse().expect("请输入数字！");
```

我们创建了一个变量`guess`。等等，程序不是已经有一个变量`guess`了吗？没错，但Rust允许我们使用新值遮盖之前的`guess`。*遮盖（Shadowing）*允许我们重用`guess`这个变量名，而不是强迫我们创建两个不同名字的变量，比如`guess_str`和`guess`，这部分我们会在第三章展开讨论。但现在，你只需要知道这个特性在进行类型转换时常常被用到。

我们给这个新变量绑定了表达式`guess.trim().parse()`。这里的`guess`指向原始的`guess`变量，即用户的字符串输入。`String`实例的`trim`方法会移除字符串两端的空格，这是我们将其转换成`u32`前必须的操作，因为后者只能包含数字数据。用户必须按下<Keyboard value="enter" />来满足`read_line`的要求，完成其输入，这个操作会给字符串添加一个换行符。比如，如果用户输入了<Keyboard value="5" />，然后按下<Keyboard value="enter" />，那么`guess`的内容就是`5\n`。`\n`表示“新的一行”。（在Windows上，按下<Keyboard value="enter" />会添加一个回车和一个换行，即`\r\n`）`trim`方法会移除`\r\n`和`\n`，仅保留`5`。

字符串的`parse`方法会将字符串转换为其他类型。这里，我们使用它将字符串转换为数字。我们使用`let guess: u32`来告诉Rust我们希望转换的类型。`guess`后的冒号符（`:`）是显式地告诉Rust变量的类型。Rust有一系列的内置数字类型；`u32`是一个无符号的，32比特的整数。对于小的正数，这是一个不错的选择。你可以在第三章了解其他的数字类型。

此外，示例里的`u32`注解和对`secret_number`的比较也表示Rust会推断`secret_number`也是`u32`类型。所以我们现在在比较同一个类型的两个值了！

`parse`方法只对逻辑上可以转为数字的内容生效，所以它是很容易出错的。比如，如果用户的输入包括了`A👍%`，那么是没有任何办法将其转换为数字的。由于这个过程可能失败，所以`parse`方法的返回值是一个`Result`类型，和`read_line`一样（我们前面讨论过）。这里我们仍然使用`expect`来处理`Result`。如果`parse`由于无法转换，返回了一个`Result`的`Err`变体，那么游戏会崩溃，并答应对应的信息。如果`parse`转换成功，它会返回一个`Ok`变体，而`expect`会返回`Ok`中包含的数字，也就是我们想要的值。

我们来运行程序：

```bash
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running `target/debug/guessing_game`
猜一个数字！
神秘数字是：58
请输入你的猜测：
  76
你的猜测是：76
太大了！
```

太棒了！尽管我们在输入时刻意增加了空格，程序仍然推测出用户的输入是76。你可以多次运行程序来检查不同的输入表现出的不同行为：正确猜数，猜测太大的数和太小的数。

游戏的大部分内容都完成了，但用户目前只能进行一次猜测。我们来使用循环优化这一点！

## 使用循环来允许重复猜测

`loop`关键字会创建一个无尽的循环。我们来添加一个循环，给予用户多次猜测的机会：

```rust
    // 略

    println!("神秘数字是：{secret_number}");

    loop {
        println!("请输入你的猜测：");

        // 略

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("太小了！"),
            Ordering::Greater => println!("太大了！"),
            Ordering::Equal => {
                println!("你赢了！");
                break;
            }
        }
    }
```

正如你看到的一样，我们将从要求用户输入的一切都移入了循环里。确保循环里的代码都向右移动了四个空格，然后再次运行程序。程序会无限要求用户输入，其实这里引入了一个新的问题。它似乎并没有任何办法让用户退出！

用户总是可以使用<Keyboard :value="['ctrl', 'c']" />快捷键来退出程序。但也有其他办法来阻止这个永不停止的怪物，就像我们在介绍`parse`的部分提过的：如果用户输入了非数字的回答，那么程序会崩溃。我们可以利用这种形式来让用户退出，比如：

```bash
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.23s
     Running `target/debug/guessing_game`
猜一个数字！
神秘数字是：59
请输入你的猜测：
45
你的猜测是：45
太小了！
请输入你的猜测：
60
你的猜测是：60
太大了！
请输入你的猜测：
59
你的猜测是：59
你赢了！
请输入你的猜测：
quit

thread 'main' panicked at src/main.rs:28:47:
Please type a number!: ParseIntError { kind: InvalidDigit }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

输入`quit`会让游戏退出，但是你可能注意到了，任何非数字的输入都会触发这个行为。这样的设计不够优雅，或者说；我们希望游戏在用户猜测到正确的数字时也可以退出。

### 在猜对后退出

我们来添加一个`break`声明，让程序在用户猜对后退出：

```rust
        // --snip--

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("太小了！"),
            Ordering::Greater => println!("太大了！"),
            Ordering::Equal => {
                println!("你赢了！");
                break;
            }
        }
    }
}
```

在`你赢了！`后面添加`break`可以让程序在用户猜对后退出循环。由于循环是`main`函数的最后部分，退出循环也就意味着退出程序。

### 处理无效输入

为了进一步优化游戏的行为，我们不在用户输入一个非数字时让程序崩溃，而是让程序忽略掉非数字，这样用户可以继续猜测。我们可以改变`guess`从`String`转换为`u32`时的代码：

```rust
        // --snip--

        io::stdin()
            .read_line(&mut guess)
            .expect("读取行内容失败");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("你的猜测是: {guess}");

        // --snip--     
```

我们从调用`expect`改为了一个`match`表达式，从程序崩溃改为了对错误的处理。别忘了`parse`的返回值是一个`Result`类型，而`Result`是一个枚举，其变体为`Ok`和`Err`。我们这里使用`match`表达式，就像我们对`cmp`方法返回的`Ordering`结果的处理一样。

如果`parse`成功地将字符串转为了数字，那么它会返回一个包含转换结果数字的`Ok`值。这个`Ok`会匹配到第一个分支，`match`表达式会直接返回`parse`处理过后放入`Ok`的`num`值。这个数字最终会被存储到我们期望的地方，也就是新的`guess`变量。

如果`parse`*无法*成功地将字符串转为数字，那么它会返回一个`Err`值，其中包含错误的更多信息。`Err`和`match`的第一个分支`Ok(num)`模式不匹配，但它和第二个分支的`Err(_)`匹配。下划线`_`是一个万能的通配符；在这个例子里，我们希望匹配所有的`Err`值，不管其中包含什么样的信息。所以程序会执行第二个分支里的代码，`continue`，它会告诉程序直接进入下一个`loop`的迭代，要求新的猜测。所以，程序就这样忽略了`parse`可能出现的一切错误！

现在程序的所有内容都应该符合预期了，我们来试试：

```bash
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
     Running `target/debug/guessing_game`
猜一个数字！
神秘数字是：61
请输入你的猜测：
10
你的猜测是：10
太小了！
请输入你的猜测：
99
你的猜测是：99
太大了！
请输入你的猜测：
foo
请输入你的猜测：
61
你的猜测是：61
你赢了
```

太棒了！随着最终的改动，我们完成了整个游戏。但别忘了程序目前还在打印神秘数字。这部分仅供测试使用，它会毁了游戏的体验。删除这行`println!`的打印。下面是最终的完整代码：

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("猜一个数字！");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("请输入你的猜测：");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("读取行失败");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("你的猜测是：{guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("太小了！"),
            Ordering::Greater => println!("太大了！"),
            Ordering::Equal => {
                println!("你赢了！");
                break;
            }
        }
    }
}
```

恭喜你，你已经完成了整个猜数游戏！

## 总结

这个项目通过让你快速上手的方式介绍了许多的Rust概念：`let`，`match`，函数，外部crate的使用，等等。在后续的章节里，你会逐一了解这些概念。第三章会介绍大部分常见的编程理念在Rust中的应用，比如变量，数据类型，函数。第四章会探索所有权，这是让Rust真正与众不同的地方。第五章会介绍枚举和方法愈发，而第六章会介绍枚举。