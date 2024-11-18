# 使用`cargo install`安装二进制文件

`cargo install`命令可以让你安装并本地使用crate。它的主要目的不是为了替换系统包；而是为了给Rust开发者提供一个便捷的方式来安装各种工具。注意你只能安装拥有二进制目标文件的crate。*二进制目标文件*就是一个可执行文件，它创建自crate下的*src/main.rs*文件，或者其他被指定为二进制的文件，和库目标文件不同的是，库无法自己独立运行，它天生为了让其他人引入后使用。通常，crate的*README*文件会说明该crate是一个库，还是一个二进制文件，或者两者都有。

所有使用`cargo install`安装的二进制文件都会存放在安装根目录的*bin*文件夹下。如果你使用*rustup.rs*安装了Rust，且没有任何个性化配置，那么这个目录就是*$HOME/.cargo/bin*。请保证这个文件在你的`$PATH`环境变量里，这样你就能运行任何`cargo install`安装的包了。

比如，在第12章我们提到过Rust社区对`grep`的实现是`ripgrep`，用于文件搜索。要安装`ripgrep`，你可以运行如下命令：

```bash
$ cargo install ripgrep
    Updating crates.io index
  Downloaded ripgrep v13.0.0
  Downloaded 1 crate (243.3 KB) in 0.88s
  Installing ripgrep v13.0.0
--snip--
   Compiling ripgrep v13.0.0
    Finished release [optimized + debuginfo] target(s) in 3m 10s
  Installing ~/.cargo/bin/rg
   Installed package `ripgrep v13.0.0` (executable `rg`)
```

第2行一直到结尾的内容展示了安装文件的目录以及名称，这里`ripgrep`被安装为`rg`。只要你的安装目录和之前提到的一样，存在于`$PATH`环境变量里，你就可以运行`rg --help`来使用一个快速的，Rust开发的文件查询工具。
