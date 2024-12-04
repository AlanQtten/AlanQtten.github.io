<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  RadioHolder,
  Radio
} from "../../components/quiz"
</script>

# 使用线程来同时运行代码

在目前的大部分操作系统里，一个执行的程序会运行在一个*进程*中，操作系统会同时管理多个进程。在程序内，你也可以让各个代码的独立部分同时运行。这种可以运行独立代码片段的特性叫做*线程*。比如，一个网络服务器可以有多个线程，这样它就能同时处理多个请求。

将代码中的计算分割到各个线程中同时运行可以提高性能，但也会增加复杂度。由于线程是同时运行的，各个线程里的代码执行先后顺序是无法保证的。这可能会引发一系列问题，比如：

- 竞态问题，各个线程访问数据或资源的顺序不稳定
- 死锁，两个线程互相等待，导致它们都无法继续进行
- 偶发、很难复现的问题，修复也因此变的不稳定

Rust会尽力缓解使用线程的负面影响，但多线程环境下的编程仍然需要比单线程环境下更仔细的考虑和代码结构设计。

编程语言实现线程的方式各不相同，需要操作系统也提供了API来让语言开辟新的线程。Rust的标准库使用了*1:1*的线程实现，即程序的每一个线程都对应操作系统的一个线程。社区也有crate按照其他线程模型来实现，和1:1模型对比各有取舍。（Rust的async系统，我们会在下一章看到，也提供了另一种形式的并发）

## 使用`spawn`创建新线程

要创建一个新线程，我们需要调用`thread::spawn`函数，并传入一个闭包（我们在第13章曾使用过），内部包含我们希望在新线程运行的代码。下面的例子就是一些主线程的数据打印和新线程的数据打印：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread");
        thread::sleep(Duration::from_millis(1));
    }
}
```

你会发现当Rust的主线程完成后，所有的子线程都被中断了，不管它们有没有完成运行。程序的输出可能每次运行略有不同，但会类似下面的代码：

```
hi number 1 from the main thread!
hi number 1 from the spawned thread!
hi number 2 from the main thread!
hi number 2 from the spawned thread!
hi number 3 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the main thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
```

调用`thread::sleep`强制线程短暂地停止它的运行，允许其他线程运行。线程的运行可能会轮流，但并没有保证：它取决于操作系统对于线程的调度。这一轮运行里吗，主线程先打印了，虽然子线程的代码是更靠前的。且尽管我们告诉子线程打印`i`到9，它也只打印到了5就被主线程中断了。

如果你运行这段代码，没有看到任何来自主线程的输出，也没有任何的重叠，可以尝试增加间隔的时长，来让操作系统有更多机会切换线程。

## 使用`join`句柄来等待所有线程结束

上面的代码不仅是因为大部分情况下主线程会比子线程提前结束，也是因为线程的运行顺序并没有抱枕，我们无法确定子线程执行顺序。

我们可以将`thread::spawn`的返回值放在一个变量中，来修复线程未运行或过早结束的问题。`thread::spawn`的返回值的类型是`JoinHandle`。一个`JoinHandle`是一个含所有权的值，我们可以调用其`join`方法，它会等待线程完成。下面的代码展示了如何使用`JoinHandle`和`join`来确保子线程在`main`存在期间完成：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread");
        thread::sleep(Duration::from_millis(1));
    }

    handle.join().unwrap();
}
```

调用句柄的`join`方法会阻塞当前运行的线程，直到被句柄所代表的线程结束。*阻塞（blocking）*一个线程就是也就意味着那个线程不会继续执行或退出。由于我们是在`main`函数的`for`循环后调用了`join`，所以代码的输出会类似：

```
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 1 from the spawned thread!
hi number 3 from the main thread!
hi number 2 from the spawned thread!
hi number 4 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
```

两个线程仍然是交叉的，但是主线程中`handle.join()`的执行使其等待了子线程的完成。

如果我们将`handle.join()`移动到`main`函数的`for`循环之前会发生什么呢，代码如下：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    handle.join().unwrap();

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }
}
```

此时主线程会等待子线程完成后再执行`for`循环，代码的输出也就稳定了：

```
hi number 1 from the spawned thread!
hi number 2 from the spawned thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 3 from the main thread!
hi number 4 from the main thread!
```

一个小小的`join`的调用细节，就会影响你的线程运行。

## 在线程中使用`move`闭包

我们经常会使用`move`关键字配合传入`thread::spawn`的闭包，因为这样这个闭包就会获取到其使用的环境中的值的所有权，进而将所有权在线程间传递。第13章，我们讨论了`move`的使用。现在，我们会更多关注在`move`和`thread::spawn`的结合使用上。

在上面的代码里，我们传递给`thread::spawn`的闭包不接收任何参数：我们没有使用任何来自主线程代码的数据。要在子线程中使用主线程的数据，子线程的闭包必须捕获其需要的值。下面的代码展示了在主线程中创建一个vector，并在子线程中使用它的过程。然而，这段代码是无法运行的：

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(||, {
        println!("Here's a vector: {v:?}");
    });

    handle.join().unwrap();
}
```

闭包使用了`v`，所以它捕获了`v`，将其作为了闭包环境的一部分。由于`thread::spawn`在新的线程中运行这个闭包，我们应该可以在新线程中访问`v`。但是当我们编译代码时，会看到如下报错：

```
$ cargo run
   Compiling threads v0.1.0 (file:///projects/threads)
error[E0373]: closure may outlive the current function, but it borrows `v`, which is owned by the current function
 --> src/main.rs:6:32
  |
6 |     let handle = thread::spawn(|| {
  |                                ^^ may outlive borrowed value `v`
7 |         println!("Here's a vector: {v:?}");
  |                                     - `v` is borrowed here
  |
note: function requires argument type to outlive `'static`
 --> src/main.rs:6:18
  |
6 |       let handle = thread::spawn(|| {
  |  __________________^
7 | |         println!("Here's a vector: {v:?}");
8 | |     });
  | |______^
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ++++

For more information about this error, try `rustc --explain E0373`.
error: could not compile `threads` (bin "threads") due to 1 previous error
```

Rust*推断出*如何捕获`v`，由于`println!`只需要`v`的引用，所以闭包尝试借用`v`。然而，这里存在一个问题：Rust无法确定线程运行的时长，所以它并不能确定`v`永远是有效的。

下面的代码展示了一个场景，这个场景子线程中的`v`可能是无效的：

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {v:?}");
    });

    drop(v); // 哦不！

    handle.join().unwrap();
}
```

如果Rust允许这段代码编译，那么有可能线程并不会立即执行，只是被加入了后台程序。子线程内部存在着对`v`的引用，但主线程立刻使用我们第15章讨论过的`drop`函数销毁了`v`。接着，当子线程开始执行，`v`已经无效了，这个引用就是无效的。哦不！

要修复这个编译错误，我们可以使用编译器提供的建议：

```
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ++++
```

通过给闭包添加`move`关键字，我们强制这个闭包获取了其依赖值的所有权，这样Rust就不会推断其应该借用值了。下面的调整后的代码可以编译运行：

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("Here's a vector: {v:?}");
    });

    handle.join().unwrap();
}
```

你也许想用`move`闭包来修复之前的含`drop`的代码。然而，这个修复并不适用，这样的代码会被编译器用不同的理由拒绝。如果我们给闭包添加了`move`，我们就会将`v`移入闭包的环境，也就不能在主线程中调用`drop`了。我们会看到如下编译错误：

```
$ cargo run
   Compiling threads v0.1.0 (file:///projects/threads)
error[E0382]: use of moved value: `v`
  --> src/main.rs:10:10
   |
4  |     let v = vec![1, 2, 3];
   |         - move occurs because `v` has type `Vec<i32>`, which does not implement the `Copy` trait
5  |
6  |     let handle = thread::spawn(move || {
   |                                ------- value moved into closure here
7  |         println!("Here's a vector: {v:?}");
   |                                     - variable moved due to use in closure
...
10 |     drop(v); // oh no!
   |          ^ value used here after move

For more information about this error, try `rustc --explain E0382`.
error: could not compile `threads` (bin "threads") due to 1 previous error
```

Rust的所有权规则又一次拯救了我们！第一段的代码错误是由于Rust非常保守，只借用了`v`供线程使用，也就意味着理论上，主线程可以无效化子线程的引用。通过告诉Rust我们要将`v`的所有权移入子线程，我们保证了主线程不会继续使用`v`。如果我们用同样的方式修改第二段代码，我们就会违反所有权规则，因为我们尝试在主线程中使用`v`。`move`关键字只是覆写了Rust保守的默认推导为借用；它并不能让我们违背借用规则。

带着对线程和线程API的基本理解，我们来看看我们能用线程*做*什么。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`move`关键字导致`n`被复制到了闭包内，所以`thread::spawn`内的`n = n + 1`对外侧的`n`没有任何影响。

</template>
<template #quiz>
<IsCompileText />

```rust
use std::thread;
fn main() {
    let mut n = 1;
    let t = thread::spawn(move || {
        n + 1;
        thread::spawn(move || {
            n = n + 1;
        })
    })
    n = n + 1;
    t.join().unwrap().join().unwrap();
    println!("{n}");
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: '2'
  }"
/>
</template>
</Quiz>

<Quiz>
<template #description>

解析；如果一个闭包捕获的引用生命周期短于`'static`，那么这个线程就有可能比其捕获的值存活地更久，也就违背了内存安全。注意`thread::scope`可以通过让线程的生命周期静态限制化，从而允许线程捕获非静态的引用。

</template>
<template #quiz>

现有如下代码，其vector会被线程不切当地捕获：

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {:?}", v);
    });

    handle.join().unwrap();
}
```

Rust编译器会抛出如下报错：

```
note: function requires argument type to outlive `'static`
 --> src/main.rs:6:18
  |
6 |       let handle = thread::spawn(|| {
  |  __________________^
7 | |         println!("Here's a vector: {:?}", v);
8 | |     });
  | |______^
```

前面了解过，`'static`生命周期会让引用在整个程序中保持有效。

以下哪一个描述对“function requires argument type to outlive \`'static`”的解释最正确？

<RadioHolder>
<Radio label="传递给thread::spawn的闭包不允许有任何参数" />
<Radio label="闭包只能捕获&'static str类型的字符串常量" />
<Radio label="Rust无法了解线程运行的时长，所以线程的捕获需要永远存活" answer />
<Radio label="vector v包括的值没有达到'static的生命周期" />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
