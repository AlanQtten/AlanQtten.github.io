# 使用自定义命令扩展Cargo

Cargo设计之初就考虑到了用户的扩展需求，你可以自定义子命令，而无需修改Cargo本身。如果你的`$PATH`中存在一个`cargo-something`，那么你就可以使用`cargo something`来运行它。这些命令也会在运行`cargo --list`被展示出来。使用`cargo install`来安装扩展，然后像使用Cargo内置工具一样使用它们就是Cargo最便捷的设计。

## 总结

使用Cargo和[crates.io](https://crates.io)来分享代码是使得Rust系统开发变得使用的一部分。Rust的标准库很小，也很稳定，但是crate更容易分享、使用，并改进这个语言各个时间线的部分。不要觉得分享自己的代码到[crates.io](https://crates.io)会很害羞；你的代码很可能帮助到其他人！
