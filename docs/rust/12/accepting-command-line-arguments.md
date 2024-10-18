# 接收命令行参数

我们来创建一个新项目，当然还是使用`cargo new`。为了和系统内置的`grep`工具有所区分，我们的项目称为`minigrep`。

```bash
$ cargo new minigrep
      Created binary (application) `minigrep` package
$ cd minigrep
```

第一步是要确保我们的`minigrep`能够接受两个命令行参数：文件路径和要搜索的字符串。也就是说，我们的程序要使用`cargo run`，两个连字符来表示后面的参数是为程序准备的，而不是传给`cargo`的，一个要搜索的字符串，一个文件路径，如下所示：

```bash
$ cargo run -- searchstring example-filename.txt
```

现在，`cargo new`创建的程序当然无法处理这两个参数。[crates.io](https://crates.io/)上有很多处理命令行参数的库，但因为我们还在学习阶段，让我们来自己实现这个功能。

## 读取参数值

要让`minigrep`有读取命令行参数的能力，我们需要使用标准库提供的`std::env::args`函数。这个函数会返回一个命令行参数的迭代器。我们会在第13章中对迭代器进行详细介绍。现在，你只需要了解迭代器的两点：迭代器提供一系列值，且我们可以调用`collect`函数将迭代器转换为一个集合，比如vector，这个集合里包含了迭代器提供的所有值。

下面的代码允许`minigrep`程序读取命令行参数，并将值转换为vector：

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    dbg!(args);
}
```

首先我们使用`use`声明将`std::env`模块引入了当前域，这样我们就可以使用`args`函数了。注意`std::env::args`函数被嵌套在一个两层深的模块里。就像我们在第七章讨论的一样，当函数的嵌套层级超过一层时，我们通常会选择将其父模块而不是函数本身引入当前域。这样，我们就可以轻松调用`std::env`下的其他函数。这样的风格也比`use std::env::args`更加清晰，因为`args`很容易和当前文件定义的函数混淆。

> ### `args`函数和无效编码
>
> 注意，如果参数包含了无效的编码，`std::env::args`会panic。如果你的程序需要接收包含无效代码的参数，请使用`std::env::args_os`。这个函数会返回提供`OsString`值的迭代器，而不是`String`。我们这里为了简单，选择用`std::env::args`，因为`OsString`存在平台差异性，它比`String`更加复杂。

在`main`函数的第一行，我们调用了`env::args`，然后我们立刻使用了`collect`，将迭代器转为了一个包含所有值的vector。我们可以使用`collect`函数来创建各种各样的集合，所以我们显式声明了`args`是一个字符串的vector。尽管在Rust中你很少需要手动声明类型，`collect`是一个几乎每次都需要显式声明的函数，因为Rust无法推导你需要的集合类型。

最终，我们使用debug宏打印了vector的内容，我们可以尝试不传入参数和传入两个参数：

```
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running `target/debug/minigrep`
[src/main.rs:5:5] args = [
    "target/debug/minigrep",
]
```

```
$ cargo run -- needle haystack
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.57s
     Running `target/debug/minigrep needle haystack`
[src/main.rs:5:5] args = [
    "target/debug/minigrep",
    "needle",
    "haystack",
]
```

注意，vector的第一个值是`"target/debug/minigrep"`，也是我们二进制程序的名字。这与C语言中参数列表的行为相匹配，使程序可以在执行时使用调用它们的名称。当你想在消息中打印程序名称或根据使用的命令行别名更改程序行为时，能够访问程序名称通常很方便。但在本章中，我们将忽略这一点，只保留我们需要的两个参数。

## 将参数值保存为变量

程序目前可以访问命令行参数了。现在我们要将两个关键参数保存到变量中，以便我们在后续代码中使用：

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    let query = &args[1];
    let file_path = &args[2];

    println!("Searching for {query}");
    println!("In file {file_path}");
}
```

正如我们在之前的打印中看到的一样，程序的名字是vector的第一个参数`args[0]`，所以我们从1开始访问参数列表。`minigrep`的第一个参数使我们要查询的字符串，所以我们将其放入变量`query`中。第二个参数是文件路径，所以我们将其放入`file_path`中。

我们将这两个变量临时打印一下，以验证程序的运行结果符合我们的预期。我们可以使用`test`和`sample.txt`来运行一下：

```
$ cargo run -- test sample.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep test sample.txt`
Searching for test
In file sample.txt
```

太好了，程序正常运行！参数的值已经被我们存入了正确的变量中。后续我们会增加一些错误处理来避免特定的错误情况，比如用户没有传入参数；现在，我们先忽略这种情况，先为程序添加文件读取的功能。
