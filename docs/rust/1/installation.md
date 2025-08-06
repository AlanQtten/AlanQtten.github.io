<script setup>
import {
  QuizProvider,
  Quiz,
  Input
} from "../../components/quiz"

</script>

# 安装

安装Rust的第一步，我们需要通过`rustup`下载Rust，这是一个命令行工具，用于管理Rust及其相关工具。你需要连接网络来进行下载。

> [!NOTE]
> 如果你出于某些原因不想使用`rustup`，那么你可以查看[其他的安装方法](https://forge.rust-lang.org/infra/other-installation-methods.html)来了解更多方式。

下面的步骤会安装最新一个稳定版本的Rust编译器。Rust的稳定性保证了本书中的所有例子都向后兼容新版本。不同版本的输出可能略有不同，因为Rust会不断优化错误和警告信息。换句话说，使用下述步骤安装的任何更新的、更稳定的Rust版本都和本书的内容一致。

::: info 命令行符号
在本章以及本书中，我们会展示许多的终端命令。使用`$`开头的内容都是你应该在终端内执行的。你不需要输入`$`符号；这只是表示终端的行开始。没有使用`$`开头的内容表示前一个命令的输出。此外，特指PowerShell的命令会使用`>`而不是`$`。
:::

## 在Linux或macos上安装`rustup`

如果你使用的是Linux或macos，可以打开命令行，输入如下命令：

```bash
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

这个命令会下载一个脚本，并安装`rustup`工具，而`rustup`会安装最新稳定版本的Rust。你可能需要输入你的密码。如果安装成功，会显示如下信息：

```
Rust is installed now. Great!
```

你还需要一个*链接器*，它是Rust用来将其构建输出汇总成一个文件的工具。你也许已经有一个了。如果你看到了一个链接器错误，那么你应该安装C编译器，它通常包含一个链接器。C编译器是很有用的，因为一些常见的Rust包依赖于C，需要C的编译器。

在macOS上，你可以运行如下命令来安装一个C编译器：

```bash
$ xcode-select --install
```

Linux用户通常需要根据具体情况安装GCC或者Clang。比如，如果你使用的是Ubuntu，那么你可以安装`build-essential`包。

## 在Windows上安装`rustup`

在Windows上，你可以遵循[https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)里的步骤来安装Rust。在安装的过程中，你会被提示安装Visual Studio。它会提供链接器，以及编译程序所需的原生库。如果你需要其他帮助，可以访问[https://rust-lang.github.io/rustup/installation/windows-msvc.html](https://rust-lang.github.io/rustup/installation/windows-msvc.html)。

本书的剩余部分使用的命令在*cmd.exe*和*PowerShell*里都是可用的。如果有所不同，我们会在使用的地方指明。

## 问题排查

为了验证是否正确安装了Rust，开启一个命令行并输入如下命令：

```bash
$ rustc --version
```

你应该可以看到版本号，版本发布前的最后一次提交的哈希和提交日期，格式如下：

```
rustc x.y.z (abcabcabc yyyy-mm-dd)
```

如果你看到了这些输出，那么你已经成功地安装了Rust！如果没有，检查一下Rust是否在你的环境变量`PATH`里，运行如下命令以检查：

在Windows的CMD中，使用：

```cmd
> echo %PATH%
```

在PowerShell中，使用：

```powershell
> echo $env:Path
```

在Linux和macOS中，使用：

```bash
$ echo $PATH
```

如果环境变量正确而Rust仍然无法正常工作，那么你可以在其他几个地方获取帮助。想办法通过[社区](https://www.rust-lang.org/community)联系到其他的Rustacean（我们给自己取的一个傻傻的名字）。

## 升级和卸载

在使用`rustup`安装Rust之后，升级新版本就很容易了。在命令行里运行如下脚本即可：

```bash
$ rustup update
```

要卸载Rust和`rustup`，在命令行运行如下脚本：

```bash
$ rustup self uninstall
```

## 离线文档

安装Rust的同时也会下载一份文档，这样你可以离线阅读。运行`rustup doc`就可以在本地的浏览器里打开文档。

任何情况下，如果你对于标准库提供的类型或函数存疑，不确定其功能或如何使用，你都可以使用应用接口（Application programming interface, API）文档来查找！

## 文本编辑器和集成开发环境（IDE）

本书不会预设你在使用任何的工具。任何的文本编辑器都可以完成工作！然而，很多文本编辑器和集成开发工具（IDEs）都对Rust提供了支持。你可以在[工具列表](https://www.rust-lang.org/tools)里找到一些推荐的工具。

## 离线使用本书

在许多的例子里，我们使用了标准库以外的库。在那些例子里，你需要使用互联网连接或者提前下载那些依赖。要提前下载，你可以运行如下命令。（后续我们会解释什么是`cargo`以及这些命令都做了什么）。

```bash
$ cargo new get-dependencies
$ cd get-dependencies
$ cargo add rand@0.8.5 trpl@0.2.0
```

这些包的下载会被缓存，后续无需重新下载。运行过这些命令后，你也不需要保留`get-dependencies`文件夹。如果你已经运行了上述指令，那么在本书其余的`cargo`指令里，你可以添加`--offline`选项来避免使用互联网。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：比如，你可以使用`rustup update`来获取Rust的最新版本。

</template>
<template #quiz>

在你的机器上管理Rust版本的命令行工具的名字是？

<Input answer="rustup" />

</template>
</Quiz>
</QuizProvider>
:::
