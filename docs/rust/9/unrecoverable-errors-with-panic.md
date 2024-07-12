<script setup>
import {
  QuizProvider,
  Quiz,
  Input,
  RadioHolder,
  Radio,
} from "../../components/quiz"

</script>

# 对不可恢复的错误panic!

代码中时有糟糕的事发生，且你无能为力。这种情况下，Rust内置了`panic!`宏。实践中，有两种触发panic宏的方式：进行不可挽回的错误操作（比如数组的越界访问）或者显式地调用`panic!`宏。这两种方式都会引发程序的“恐慌”（终止）。默认来说，当程序panic时，它会打印错误信息，展开并清理堆栈信息，然后退出。通过一个环境变量，你可以让Rust在panic发生时展示调用栈，减少溯源成本。

> ### 解开栈信息或放弃panic的响应
>
> <br />
>
> 默认来说，当panic出现时，程序会开始*展开*，它的含义是Rust会逆着栈的路径，对其中的函数进行数据清理。然而，这种回溯和清理要耗费大量的工作。因此Rust允许你立刻*放弃*作为替代，它不会进行数据清理。
>
> <br />
>
> 这种情况下的内存需要等待操作系统进行清理。如果你的项目要生成的二进制文件要尽可能地小，你可以在*Cargo.toml*文件的`[profile]`节添加`panic = 'abort'`来切换展开为放弃。比如，如果你希望在发布模式下放弃，你可以添加如下代码
> ```toml
> [profile.release]
> panic = 'abort'
> ```

让我们尝试一次简单的`panic!`调用：

```rust
fn main() {
    panic!("crash adn burn");
}
```

当你运行这段代码时，你会看到如下报错：

```
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/panic`
thread 'main' panicked at 'crash and burn', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

最后两行的错误信息就来自`panic!`的调用。第一行展示了panic的信息和它在源代码中调用的位置：*src/main.rs:2:5*表示*src/main.rs*文件的第二行，第5个字符。

这种情况下，这行指示的就是我们代码的一部分，如果我们查看对应的行，我们会看到`panic!`宏的调用。在其他情况下，`panic!`的调用可能来自我们代码调用的其他代码，这时的报告的文件名称和行数就来自其他人对`panic!`宏的调用，而不是我们代码中对包含`panic!`调用的执行位置。我们可以使用函数的回溯来确定是我们代码的哪一部分导致了`panic!`。我们会继续讨论回溯的更多细节。

## 使用`panic!`回溯

让我们看一个错误使用库代码引发`panic!`的例子。下面的代码是一次对vector的越界访问：

```rust
fn main() {
    let v = vec![1, 2, 3];

    v[99];
}
```

这里我们尝试访问vector的第100个元素（下标从0开始），由于vector仅有3个元素。这种情况下，Rust会panic。使用`[]`应该返回一个元素，但如果你传递了无效的下标，Rust就无法为你返回正确的元素。

在C语言里，尝试对某种数据结构进行越界访问会导致未定义行为。你可能会读取到对应内存位置的内容，尽管这些内存并不属于这个数据结构。这种情况称为*缓冲区过读*，它可能会引发严重的安全问题，攻击者可能会想办法操纵那个下标读取到他们原先无法读取的数据。

为了保护你的应用，如果你尝试越界访问，Rust会停止执行：

```
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/panic`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', src/main.rs:4:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

错误指向了`main.rs`文件的第四行，也就是我们尝试访问99下标的地方。后面的信息（note）提示我们可以设置`RUST_BACKTRACE`环境变量来获取导致错误的回溯信息。*回溯*是函数到达错误点的列表。Rust中的回溯和其他语言类似：阅读的方式是从上到下，直到你看到你书写代码的文件。这里就是问题的起点了。它往上一行就是你的代码调用的代码，再往上是它调用的代码。这样的过程中可能会包括Rust的核心代码，标准库，或者你使用的crate。让我们尝试将`RUST_BACKTRACE`设置为非0值来查看回溯：

```
$ RUST_BACKTRACE=1 cargo run
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', src/main.rs:4:5
stack backtrace:
   0: rust_begin_unwind
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/std/src/panicking.rs:584:5
   1: core::panicking::panic_fmt
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/core/src/panicking.rs:142:14
   2: core::panicking::panic_bounds_check
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/core/src/panicking.rs:84:5
   3: <usize as core::slice::index::SliceIndex<[T]>>::index
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/core/src/slice/index.rs:242:10
   4: core::slice::index::<impl core::ops::index::Index<I> for [T]>::index
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/core/src/slice/index.rs:18:9
   5: <alloc::vec::Vec<T,A> as core::ops::index::Index<I>>::index
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/alloc/src/vec/mod.rs:2591:9
   6: panic::main
             at ./src/main.rs:4:5
   7: core::ops::function::FnOnce::call_once
             at /rustc/e092d0b6b43f2de967af0887873151bb1c0b18d3/library/core/src/ops/function.rs:248:5
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

真是一大堆输出！你真实看的输出可能略有不同，和你的操作系统、Rust版本有关。要获取包含这些信息的回溯，必须使用调试符号。调试符号在调用`cargo build`或`cargo run`而不传递`--release`时是默认启用的，我们这里就是这么做的。

在这些输出里，回溯的第6行指向了我们项目中导致问题的代码：*src/main.rs*文件的第4行。如果我们不希望程序panic，我们应该从回溯中找到问题的源头。之前的代码里面我们可以书写了会导致panic的代码，修复这个panic的方式就是不要对vector进行越界访问。如果你的代码panic了，你需要搞清楚是什么行为导致的，是什么值导致的，以及如何修复它。

我们会在后面讨论什么情况应该使用`panic!`来处理错误情况。接下来，我们来看如何使用`Result`从错误中恢复。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：比如，你可以运行下面的命令

```bash
RUST_BACKTRACE=1 cargo run
```

</template>
<template #quiz>
如果你希望查看panic的回溯，你应该将哪个环境变量设为1？

<Input answer="RUST_BACKTRACE" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：panic不应该用于在*程序内*通知调用者。默认的假设就是调用者不会捕获这些panic。

</template>
<template #quiz>

以下哪个理由**不是**一个好的使用panic的理由？

<RadioHolder>
<Radio label="程序需要尽快停止" />
<Radio label="程序到达了一个错误的状态，需要通知调用的程序" answer />
<Radio label="程序会引发一个危险的操作" />
<Radio label="程序到达了一个不可恢复的错误节点" />
</RadioHolder>
</template>
</Quiz>
</QuizProvider>
:::
