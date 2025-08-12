# 附录D：实用开发工具

在本附录中，我们会介绍一些Rust项目提供的实用的开发工具。包括自动格式化，快速修复警告，语法检查器和IDE集成。

## 使用`rustfmt`实现自动格式化

`rustfmt`工具会根据社区代码风格的最佳实践来格式化你的代码。许多协作性质的代码会使用`rustfmt`来避免有关开发Rust过程中代码风格的争议：大家都使用同一个工具来格式化代码。

Rust的安装已经默认包含了`rustfmt`，所以你的系统里已经有了`rustfmt`和`cargo-fmt`这两个程序。这两个命令分别对应`rustc`和`cargo`，`rustfmt`提供了更细粒度的控制，而`cargo-fmt`则理解Cargo工程的上下文。要格式化一个Cargo项目，运行如下命令：

```bash
$ cargo fmt
```

运行这个命令会格式化当前crate的所有代码。但只会影响代码风格，不会影响代码的语义。要了解`rustc`的更多内容，可以查看其[文档](https://github.com/rust-lang/rustfmt)。

## 使用`rustfix`实现代码修复

Rust的安装已经默认包含了`rustfix`，它可以自动对一些显而易见的编译警告进行修复。你之前已经见过了一些编译警告。比如，对于如下代码：

```rust
fn main() {
    let mut x = 42;
    println!("{x}");
}
```

这里，我们的`x`定义为可变，但我们并没有真的修改它。Rust会抛出一个警告：

```bash
$ cargo build
   Compiling myprogram v0.1.0 (file:///projects/myprogram)
warning: variable does not need to be mutable
 --> src/main.rs:2:9
  |
2 |     let mut x = 0;
  |         ----^
  |         |
  |         help: remove this `mut`
  |
  = note: `#[warn(unused_mut)]` on by default
```

这里的警告建议我们移除`mut`关键字。我们可以使用`rustfix`工具来接收这个建议，运行`cargo fix`命令：

```bash
$ cargo fix
    Checking myprogram v0.1.0 (file:///projects/myprogram)
      Fixing src/main.rs (1 fix)
    Finished dev [unoptimized + debuginfo] target(s) in 0.59s
```

再次查看*src/main.rs*，我们可以看到`cargo fix`做了什么：

```rust
fn main() {
    let x = 42;
    println!("{x}");
}
```

`x`变量现在是不可变的了，而警告自然也会消失。

你还可以使用`cargo fix`来将代码迁移到不同的Rust合集版本。这部分在附录E中有所介绍。

## 使用Clippy来获取更多检查

Clippy工具是一个语法检查的集合，它会分析你的代码，捕捉一些常见的错误，提升你的代码质量。Clippy已经包含在标准的Rust安装中。

要在任何的Cargo项目中使用Clippy，只需要运行：

```bash
$ cargo clippy
```

比如，假设你开发了一个程序，使用了一个和某个数学常量相似的值，比如PI：

```rust
fn main() {
    let x = 3.1415;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

运行`cargo clippy`会看到如下错误：

```
error: approximate value of `f{32, 64}::consts::PI` found
 --> src/main.rs:2:13
  |
2 |     let x = 3.1415;
  |             ^^^^^^
  |
  = note: `#[deny(clippy::approx_constant)]` on by default
  = help: consider using the constant directly
  = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#approx_constant
```

这个错误告诉你Rust里已经定义了精确的`PI`常量，如果你使用它，你的程序可以更加准确。你可以调整代码，下面的代码就不会收到任何来自Clippy的错误或警告：

```rust
fn main() {
    let x = std::f64::consts::PI;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

要了解有关Clippy的更多内容，可以查看其[官方文档](https://github.com/rust-lang/rust-clippy)。

## 使用`rust-analyzer`来进行IDE集成

为了辅助IDE集成，Rust社区推荐使用[rust-analyzer](https://rust-analyzer.github.io/)。这个工具是一系列围绕编译器的工具，其涉及符合[Lanuage Server Protocol](http://langserver.org/)，它用于定义IDE和语言本身如何互相沟通。不同的客户端都可以使用`rust-analyzer`，比如Visual Studio Code就提供了Rust分析插件。

你可以访问`rust-analyzer`的[主页](https://rust-analyzer.github.io/)来了解如何安装，然后你需要安装特定IDE的语言服务支持。你的IDE会集成诸如语法高亮、定义跳转和行内错误等功能。