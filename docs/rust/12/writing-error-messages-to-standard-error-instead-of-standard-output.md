# 用标准错误流取代标准输出流

目前，我们所有的输出都在使用`println!`宏输出到命令行。大部分命令行工具中，都会包含两种输出：为普通信息准备的*标准输出*（`stdout`）以及为错误信息准备的*标准错误*（`stderr`）。这种区别使用户能够选择将程序的成功输出重定向到文件，但仍然将错误消息打印到屏幕上。

`println!`宏只能够输出到标准输出流，所以我们需要使用其他方法来输出到标准错误流。

## 错误去哪了

首先我们来观察一下`minigrep`当前输出的内容是如何输出到标准输出流的，其中就包括了我们想写入标准错误流的错误信息。我们可以将它的输出重定向到文件中，然后刻意触发一个错误。我们不会重定向到标准错误流，那样的话错误信息仍然会显示在屏幕上。

命令行程序本身就应该向标准错误流发送错误信息，这样就算我们将标准输出流重定向到了一个文件，我们仍然能在屏幕上看到错误信息。目前我们的程序还不够好：我们会看到它将错误信息的输出也存储到文件中了！

要证明这个行为，我们可以使用`>`和一个文件路径，*output.txt*，也就是我们要将标准输出流重定向的文件。我们不会给程序本身传入任何参数，这样就会触发错误：

```bash
$ cargo run > output.txt
```

`>`语法告诉命令行将标准输出流的内容输出到*output.txt*中，而不是输出在屏幕上。我们不会看到错误信息像我们希望的那样呗打印到屏幕上，也就是说它们被输出到了文件中。下面是*output.txt*的内容：

```
Problem parsing arguments: not enough arguments
```

不出所料，我们的错误信息被输出到标准流中了。这样的信息输出到标准错误流中是十分有用的，这样只有成功的数据才会被写入文件。我们来调整一下。

## 将错误输出到标准错误流

我们使用之前的代码来修改。在我们之前的重构中，所有错误信息的打印都被迁移到了`main`函数中。标准库提供了`eprintln!`宏来输出到标准错误流，因此我们只需要把两个地方的`println!`修改为`eprintln!`即可：

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        eprintln!("Application error: {e}");
        process::exit(1);
    };
}
```

再次用同样的方式运行程序，不带任何参数，以及`>`来重定向：

```bash
$ cargo run > output.txt
Problem parsing arguments: not enough arguments
```

现在我们可以看到错误被输出到了屏幕上，而*output.txt*什么都没有。这才是我们期待的命令行程序的行为。

我们可以使用不会引发任何错误的参数来运行程序，同时继续将输出重定向到文件：

```bash
$ cargo run -- to poem.txt > output.txt
```

我们不会看到终端的任何输出，而*output.txt*内会包含运行结果：

```
Are you nobody, too?
How dreary to be somebody!
```

可以看到，我们的程序使用标准输出流作为成功时的输出，使用更合适的标准错误流作为错误时的输出。

## 总结

这一章回顾了之前学到的主要概念，同时也包括了Rust中常见的I/O操作。通过使用命令行参数，文件，环境变量和`eprintln!`宏来输出错误，你现在可以构建一个命令行程序了。结合前几章学到的概念，你的代码应当组织优雅，使用合适的数据结构来高效地存储数据，很好的处理测试，同时也被很好地测试了。

下一章，我们会讨论Rust被函数式语言所启发的功能：闭包和迭代器。