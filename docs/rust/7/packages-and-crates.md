<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  Input
} from "../../components/quiz"

</script>

# 包和库

在模块系统的第一部分，我们会讨论包和库。

一个*库（crate）*是Rust编译器一次能够处理的最小代码。即便你使用`rustc`（而不是`cargo`）并传递了一些简单的代码（就像我们在第一章做的那样），编译器也会认为它们是一个crate。Crate可以包括模块，以及定义在其他地方但和crate一起被编译的文件，我们会在后面看到。

一个crate会以下面两种形式之一出现：二进制crate或crate库。*二进制crate*是已经编译成可执行程序的代码，比如在命令行程序或者服务器上。它们都需要有一个`main`函数来定义可执行程序的入口。目前为止我们创建的crate都是这种形式。

*crate库*没有`main`函数，它们也不会被编译成可执行文件。它们的目的是为其他项目提供一些功能。比如，我们在第二章使用过的`rand`crate提供了一个可以生成随机数的功能。当一个Rust控说“crate”时，他们多半在说crate库。这个词在Rust中的使用类似其他语言的`library`。

*crate根*是Rust编译器开始的地方，它也会作为你的crate的根模块（这部分我们会在7.2讨论）。

*包（package）*是一个或多个功能丰富的crate组成的。一个包会包括一个*Cargo.toml*文件，它的作用是描述如何构建这些crate。Cargo本身就是一个包含了crate库的命令行工具，它的作用是构建你的代码。Cargo包也包括了二进制crate依赖的crate库。其他工程可以用和Cargo命令行一样的逻辑来依赖Cargo这个crate库。

一个包可以包括任意数量的二进制crate，但最多只能包括一个crate库。一个包最少要包含一个crate，不管它是二进制还是库。

让我们来看看在我们创建包时发生了什么。首先，我们输入`cargo new`：

```
$ cargo new my-project
    Created binary (application) `my-project` package
$ ls my-project
Cargo.toml
src
$ ls my-prject/src
main.rs
```

在我们执行了`cargo new`后，我们使用`ls`来查看了Cargo创建了什么。在工程的目录下，它创建了*Cargo.toml*文件，代表这是一个包。同时也创建了包括*main.rs*文件的目录*src*。打开*Cargo.toml*，你会发现里面并没有提到*src/main.rs*。Cargo默认*src/main.rs*是和包名同名二进制crate的crate根。同样的，如果一个包下放置了*src/lib.rs*，那么Cargo就知道这个包包含了一个和包同名的carte库，而*src/lib.rs*就是carte根。Cargo会将carte根传递给`rustc`来构建库或二进制可执行文件。

这里，我们的包只包含了*src/main.rs*，表示它只包含了一个二进制crate，名称为`my-project`。如果一个包既包含*src/main.rs*，又包含*src/lib.rs*，那么它拥有两个crate：一个二进制可执行程序和一个库，它们的名字都和包名相同。一个包可以包含多个二进制carte，只要放置在*src/bin*的目录下即可：每一个文件都是独立的二进制crate。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：包是最顶层的组织单元，它包含crate，而crate又包括了模块。

</template>
<template #quiz>

以下哪一项是正确的包含关系？“A>B”表示“A包含B”

<Radio>
<Option label="包>crate>模块" answer />
<Option label="模块>crate>包" />
<Option label="crate>包>模块" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：*main.rs*提供了一个二进制crate，*lib.rs*提供了一个crate库，*bin/alt.rs*提供了一个二进制crate。*util.rs*可能作为一个模块被其他crate调用，但它在Rust中并不是一个特殊的名字，所以并不能构成一个crate。*build.rs*是构建的脚本。

</template>
<template #quiz>

假设现有一个Rust包`foobar`：

```
foobar
├── Cargo.toml
├── build.rs
└── src/
    ├── main.rs
    ├── util.rs
    ├── lib.rs
    └── bin/
        └── alt.rs
```

这个包包含多少个crate？使用数字表示你的结论：

<Input answer="3" />

</template>
</Quiz>
</QuizProvider>
:::
