# 读取一个文件

现在我们需要给程序添加读取`file_path`路径对应文件的功能。首先我们需要一个简单的文件来进行测试：我们使用一个很小的、只有几行的文件，它存在一些重复性的单词。一首Emily Dickinson的诗歌就非常合适了！下面我们在项目的根目录下创建一个名为*poem.txt*的文件，并输入诗歌“I'm Nobody! Who are you?”：

```txt
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

文本准备好了，调整*src/main.rs*来读取文件：

```rust
use std::env;
use std::fs;

fn main() {
    // 略
    println!("In file {file_path}");

    let contents = fs::read_to_string(file_path).expect("Should have been able to read the file");

    println!("with text:\n{contents}");
}
```

首先我们使用`use`声明来引入关联的标准库：这里我们需要`std::fs`来处理文件。

在`main`函数中，新的语句`fs::read_to_string`接收了`file_path`，来访问那个文件，而它的返回值类型为`std::io::Result<String>`，它包括了文件的内容。

在这之后，我们再次添加了临时的`println!`声明，在读取文件后打印`contents`的值，这样我们就能检查代码是否正确。

我们可以运行这段程序（由于我们还未实现搜索部分，搜索字符串可以随意传入）传入*poem.txt*作为第二个参数：

```
$ cargo run -- the poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep the poem.txt`
Searching for the
In file poem.txt
With text:
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

太好了！这段代码读取并打印了文记得内容。但代码本身还是有一些缺陷的。目前，`main`函数内放置了多个功能：通常来说，让单独的函数去维护单独的功能是更清晰、更容易维护的。另一个问题是我们还没有尽力处理错误。目前这个程序仍然很小，所以这些缺陷并不是什么大问题，但是随着程序的增大，再想彻底修复这些问题就很困难了。最佳实践是在程序的早期开发阶段就尽力重构，因为这时候代码量较小，重构成本比较低。下一章我们会进行这部分工作。
