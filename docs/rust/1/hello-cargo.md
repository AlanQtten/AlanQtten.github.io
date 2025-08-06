<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"

</script>

# 你好，Cargo!

Cargo是Rust的构建系统和包管理器。大部分Rustacean都使用这个工具来管理他们的Rust工程，因为Cargo为你处理了很多工作，比如构建你的代码，下载你代码所依赖的包，并构建那些包。（我们可以将这些你的代码需要的库成为*依赖*）

对于最简单的Rust程序，比如我们上一小节开发的那个，它们没有任何的依赖。如果我们使用Cargo来构建“Hello, world!”工程，那么只会用到Cargo里负责构建代码的部分。在你的程序越来越复杂后，你需要添加依赖，如果你的程序一开始就是用Cargo来创建的，那么添加依赖会变得十分容易。

由于绝大多数的Rust工程都选择使用Cargo，本书的其余部分也会使用它。如果你遵循了前一节的标准安装流程，那么Cargo在你安装Rust时就已经自动安装了。如果你使用了其他方式安装了Rust，那么你可以使用如下命令来检查Cargo是否已安装：

```bash
$ cargo --version
```

如果你看到了版本号，那么你已经安装了！如果你看到了错误，比如`command not found`，那么查看你安装Rust的文档来了解如何安装Cargo。

## 使用Cargo创建一个工程

我们来使用Cargo创建一个新工程，看看它和我们的原始“Hello, world!”项目有什么不同。回到你的*projects*目录（或者你自定义的存放代码的位置）。然后，不管什么操作系统，运行如下命令：

```bash
$ cargo new hello_cargo
$ cd hello_cargo
```

第一个命令会创建一个新的目录和工程，名为*hello_cargo*。我们给项目取名为*hello_cargo*，而Cargo会根据这个名字创建同名目录。

进入*hello_cargo*目录并查看文件。你会看到Cargo生成了两个文件和一个目录：一个*Cargo.toml*文件和一个*src*目录，后者其中有一个*main.rs*文件。

它同时也初始化了一个Git仓库，并生成了*.gitignore*文件。如果你在一个Git仓库下运行`cargo new`，那么Git文件不会生成。你可以使用`cargo new --vcs=git`来覆盖这个行为。

> [!NOTE]
> Git是最常见的版本管理系统。你可以使用`--vcs`参数来为`cargo new`指定不同的版本管理工具，或者不使用版本管理工具。运行`cargo new --help`来查看所有可用选项。

在你喜欢的文本编辑器里打开你的 *Cargo.toml* ，其内容大致如下：

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```

这个文件是[TOML](https://toml.io/)（Tom's Obvious, Minimal Language）格式，这是Cargo的配置文件格式。

第一行，`[package]`，是一个小节标题，表示这部分配置是关于包的。随着我们对这个文件的不断修改，会添加其他小节。

之后的三行都是Cargo编译你的项目所需的配置信息：名字，版本，以及Rust的版本。我们会在附录E中讨论关于`edition`的更多内容。

最后一行，`[dependencies]`，是一个新的小节，其中会列出你项目的所有依赖。在Rust里，包的代码被称为*crate*。这个项目里我们不需要任何的依赖，但在第二章我们会添加一些，所以到那时我们需要使用这一小节。

打开 *src/main.rs* 文件，你会看到如下内容：

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo为你生成了一个“Hello, world!”项目，就像你之前开发的一样！到目前为止，从0开发的工程和Cargo生成的工程的区别是Cargo将代码放置在了*src*目录下，还在顶层目录下生成了*Cargo.toml*配置文件。

Cargo期望你的源代码都存放在*src*目录下。顶层的目录只用来放置README文件、项目的证书信息、配置文件等等和代码无关的文件。使用Cargo可以帮助你整理你的项目。一切都在其应该在的位置。

如果你自己创建了一个工程，就像我们的“Hello, world!”工程一样，你也可以将项目转变为使用Cargo的模式。只需要将项目代码全部移入*src*目录，然后自己创建一个合适的*Cargo.toml*文件。一个简单的创建*Cargo.toml*文件的方式就是运行`cargo init`，它会帮你自动创建。

## 构建和运行Cargo项目

现在，我们来看看在我们使用Cargo构建和运行“Hello, world!”程序时会有什么不同！在你的*hello_cargo*目录下，运行如下命令以构建你的项目：

```bash
$ cargo build
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

这个命令会在你的目录下的*target/debug/hello_cargo*创建一个可执行文件（或者Windows下的 *target\debug\hello_cargo.ext* ），而不是直接在你的目录下生成。由于默认的构建是一个调试性质的构建，Cargo会将其放在名为 *debug* 的目录下。你可以使用如下命令运行它：

```bash
$ ./target/debug/hello_cargo # 在Windows下使用 .\target\debug\hello_cargo.exe
Hello, world!
```

如果一切顺利，`Hello, world!`会在终端被打印出来。第一次运行`cargo build`时，Cargo还会在顶层目录下创建一个新文件：*Cargo.lock*。这个文件会追踪你的项目依赖版本。由于当前这个项目没有任何的依赖，所以这个文件有点多余。你不需要在任何时候手动修改这个文件；Cargo会为你手动管理。

我们刚才使用`cargo build`命令构建了一个项目，并使用`./target/debug/hello_cargo`命令运行了它，但我们也可以使用`cargo run`命令来编译代码并运行可执行文件：

```bash
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

使用`cargo run`更加方便，你不需要手动执行`cargo build`，然后使用完整的二进制文件路径来执行，所以这是大部分开发者的选择。

注意这次我们没有看到关于构建完成`hello_cargo`的输出信息。Cargo发现了你的源文件并没有修改，所以它没有重新构建，而是直接运行了二进制文件。如果你修改了你的源代码，Cargo会在运行前重新构建，输出如下：

```bash
$ cargo run
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

Cargo还提供了一个命令`cargo check`，它会快速检查你的代码，确保其编译通过，但它不会生成可执行文件：

```bash
$ cargo check
   Checking hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

什么场景下会不需要生成可执行文件呢？通常来说，`cargo check`比`cargo build`的速度要快的多，因为它会跳过生成可执行文件的步骤。如果你在开发的过程中不断地检查你的工作，那么使用`cargo check`来检查你的代码是否可以构建是更好的选择！通常，Rustacean会定期运行`cargo check`来确保其代码可以通过编译。然后在他们准备好使用可执行文件时，才会运行`cargo build`。

我们来简单回顾一下我们目前学到的关于Cargo的内容：

- 我们可以使用`cargo new`来创建项目。
- 我们可以使用`cargo build`来构建项目。
- 我们可以使用`cargo run`来构建并运行项目。
- 我们可以使用`cargo check`来构建项目，但不输出任何文件。
- Cargo不会将可执行文件生成在项目的顶层目录下，而是存放在*target/debug*目录下。

使用Cargo还有一个好处，它的命令行在任何的操作系统下都是一样的。所以在此之后，我们不会提供任何关于Linux、macOS或者Windows的特定命令。

## 为发布而构建

当你的项目准备好发布时，你可以使用`cargo build --release`来构建一个优化的版本。这个命令会在*target/release*目录下生成一个可执行文件，而不是*target/debug*目录。优化会让你的Rust代码运行地更快，但也会延长你的构建时间。所以才会有两种构建模式：一个面向调试，为了快速、频繁地重新构建，另一个则面向终端用户，它不会频繁地重新构建，且会尽可能快地运行。如果你在测试你的代码运行效率，那么你应该使用`cargo build --release`，并针对*target/release*下的可执行文件进行测试。

## 养成使用Cargo的习惯

对于简单的项目，Cargo不会比`rustc`有显著优势，但其会为你的项目增长过程保驾护航。一旦项目涉及多文件，或者需要依赖，使用Cargo来协调构建过程就十分必要了。

尽管`hello_cargo`项目很简单，但它也使用了许多你未来的Rust生涯里离不开的工具。实际上，你可以使用Git搭配如下命令，切换到某个项目的目录下构建试试看：

```bash
$ git clone example.org/someproject
$ cd someproject
$ cargo build
```

想了解Cargo的更多信息，可以查看[其文档](https://doc.rust-lang.org/cargo/)

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：Cargo不会监听文件的修改。但你可以使用诸如[cargo-watch](https://crates.io/crates/cargo-watch)一类的插件来实现这个目的。

</template>
<template #quiz>

假设你下载了一个Cargo项目，然后使用`cargo run`运行了它。以下哪一个说法是**不正确**的？

<Radio>
<Option label="Cargo会执行项目的二进制文件" />
<Option label="Cargo会监听文件的修改，并在其发生修改时重新执行二进制文件" answer />
<Option label="Cargo会下载并构建项目所需的任何依赖" />
<Option label="Cargo会在target/debug目录下生成可执行文件" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::

## 总结

你已经成功踏上了Rust之旅！在本章，你学到了：

- 使用`rustup`安装最新稳定版本的Rust。
- 更新Rust版本。
- 打开安装到本地的文档。
- 开发并直接使用`rustc`运行“Hello, world!”程序。
- 使用Cargo来便捷地创建和运行项目。

现在是一个开发复杂项目，并习惯读写Rust代码的绝佳时机！所以在第二章，我们会开发一个猜数游戏。如果你希望先学习一些常规的编程概念在Rust中如何工作的，可以先学习第三章，然后再回头学习第二章。
