<script setup>
import {
  QuizProvider,
  Quiz,
  Input,
  Radio,
  Option
} from "../../components/quiz"

</script>

# Hello, World!

现在你已经安装了Rust，是时候开发你的第一个Rust程序了。作为传统，在学习一门新的语言时，通常会开发一个打印`Hello, World!`的程序，我们也不例外！

> [!NOTE]
> 本书假设你已经对命令行有了一定的了解。Rust不会对你的编辑工具或代码存放做任何要求，所以如果你更喜欢使用集成开发工具（IDE），那么请放心大胆地使用。许多IDE都提供了Rust支持；你可以检查IDE的文档来查看更多细节。Rust团队则将工作重心放在`rust-analyzer`上，这是一个对IDE的底层支持。你可以查看附录D来了解更多。

## 创建一个工程目录

首先你需要创建一个目录来存放你的Rust代码。你的代码放置在何处对Rust没有影响，但为了本书的练习，我们建议在根目录下创建一个*projects*目录，并在其中存放你的全部项目。

打开一个命令行，输入如下命令来创建*projects*目录，并在其中创建一个存放“Hello, World!”程序的工程目录。

在Linux、macOS或者Windows的PowerShell中，输入如下命令：

```bash
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

在Windows的CMD中，输入如下命令：

```cmd
> mkdir %USERPROFILE%\projects
> cd /d %USERPROFILE%\projects
> mkdir hello_world
> cd hello_world
```

## 开发和运行Rust程序

接着，创建一个名为*main.rs*的源文件。Rust的文件均以 *.rs* 后缀结尾。如果你使用了两个及以上的单词，常规的做法是使用下划线来分隔。比如，使用*hello_world.rs*而不是*helloworld.rs*。

打开*main.rs*文件，输入如下代码：

```rust
fn main() {
    println!("Hello, World!");
}
```

保存文件，回到命令行窗口，在*~/projects/hello_world*目录下运行命令。在Linux或macOS中，输入如下命令编译运行：

```bash
$ rustc main.rs
$ ./main
Hello, world!
```

在Windows上，使用`.\main`而不是`./main`：

```cmd
> rustc main.rs
> .\main
Hello, world!
```

不管你的操作系统是什么，都会在命令行输出`Hello, world!`。如果你没有看到这行输出，回到问题排查章节进行额外的检查。

如果`Hello, world!`被打印了，那么恭喜你！你正式开发了第一个Rust程序。你已经是一名Rust程序员了————欢迎！

## 解剖Rust程序

我们来重新看看这个“Hello, world!”程序的细节。拼图的第一部分是：

```rust
fn main() {

}
```

这几行定义了一个函数`main`。`main`函数是一个特殊的函数：它是所有可执行Rust程序的入口。这里，第一行定义了函数名为`main`，没有任何参数，没有任何返回。如果有参数，它们应该在括号`()`里。

函数体被包含在`{}`中。Rust要求所有的函数体都使用大括号包裹。良好的风格是将大括号的开始放在函数名所在的行，并使用空格隔开。

> [!NOTE]
> 如果你希望遵循标准Rust程序的风格，可以使用一个自动格式工具`rustfmt`来格式化代码成为特定的风格（查看附录D以了解更多）。Rust团队将其作为了标准Rust的一部分，就像`rustc`一样，所以它已经安装在你的电脑上了！

`main`函数中包含了如下代码：

```rust
println!("Hello, world!");
```

这段代码就是这个小小的程序进行的全部工作了：它打印了一行信息。但其中有三点细节需要注意。

首先，`println!`调用了Rust宏。如果这是一个函数调用，那么其形式应该是`println`（没有`!`）。Rust宏是一种通过自动生成代码来扩展Rust语法的方式，我们会在第20章讨论其中的更多细节。现在，你只需要知道使用了`!`表示你在调用一个宏，而不是一个普通的函数，且宏的规则和函数并不总是相同。

其次，你可以看到`"Hello, world!"`字符串。这个字符串我们作为参数传入了`println!`，并最终打印在了屏幕上。

最后，我们使用冒号（`;`）结束了行，也就表示表达式结束了，且下一行可以开始了。大部分的Rust代码行都以冒号结尾。

## 编译和运行是分开的步骤

你刚才运行了一个崭新的项目，所以我们来拆解每一个步骤。

在运行Rust程序前，你需要使用Rust的编译器来进行代码编译，也就是`rustc`命令，将你的源文件名传递给它作为参数，比如：

```bash
$ rustc main.rs
```

如果你有C或C++的背景，你会注意到这跟`gcc`或`clang`很像。在成功编译后，Rust会输出一个可执行的二进制文件。

在Linux、macOS和Windows的PowerShell中，你可以通过输入`ls`命令来查看这个可执行文件：

```bash
$ ls
main main.rs
```

在Linux和macOS中，你会看到两个文件。在Windows的PowerShell中，你会看到三个文件，CMD同理。而对于Windows的CMD，需要使用如下命令：

```powershell
> dir /B %= the /B option says to only show the file names =%
main.exe
main.pdb
main.rs
```

这些文件包括 *.rs* 后缀结尾的源文件，可执行文件（Windows的*main.eve*，其他平台的*main*），以及，使用Windows时，会有一个包含调试信息的文件，以 *.pdb* 后缀结尾。此时，你可以运行*main*或者*main.exe*，命令如下：

```bash
$ ./main # 或者Windows上的 .\main
```
如果你的*main.rs*是“Hello, world!”程序，那么这个命令会打印`Hello, world!`到终端。

如果你对于动态语言更熟悉，比如Ruby、Python或JavaScript，你可能对于编译和运行分离的步骤感到陌生。Rust是一个*预编译*语言，也就是说，你可以编译一个程序，然后将它给到其他人，他们可以在没有Rust的环境下运行它。如果你将 *.rb*，*.py* 或 *.js* 文件分享给了其他人，那么对应的，他们分别需要Ruby、Python和JavaScript的环境。但在那些语言里，你只需要一条命令就可以编译并运行你的程序了。一切都是语言设计的权衡。

使用`rustc`来编译对于简单项目来说足够了，但随着你的项目增长，你需要管理各种选项，让你的代码易于分享。下面，我们会介绍Cargo工具，它会帮助你开发真实的Rust项目。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：在你的程序里，你需要添加一个main函数，其格式如下：

```rust
fn main() {
    // 你的代码
}
```

</template>
<template #quiz>

每个可执行的Rust程序都需要包含一个名为什么的函数？

<Input answer="main" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：运行rustc会检查并编译你的程序，但不会执行。

</template>
<template #quiz>

现有如下程序在你的文件*hello.rs*里：

```rust
fn main() {
    println!("Hello world!");
}
```

假设你在命令行运行了`rustc hello.rs`，以下哪个选项对于会发生的事情描述最准确？

<Radio>
<Option label="rustc执行了程序，打印了Hello world!" />
<Option label="rustc会打印一个错误，因为这不是一个合法的程序" />
<Option label="rustc会根据Rust的编码风格格式化hello.rs" />
<Option label="rustc会生成一个二进制的可执行文件hello" answer />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
