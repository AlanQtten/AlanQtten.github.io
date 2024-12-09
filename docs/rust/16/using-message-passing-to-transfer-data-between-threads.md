<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
} from "../../components/quiz"
</script>

# 使用信息传递在线程间传递数据

一个非常受欢迎的保证安全并发的方式是*消息传递（message passing）*，即线程或参与者通过发送包含数据的消息来交流。在Go语言的文档中提到过：“不要通过共享内存来交流；要通过交流来共享内存”。

为了完成并发中的消息传递，Rust的标准库提供了*通道（channels）*的实现。通道是一个标准的编程理念，它用于一个线程给另一个线程发送数据。

你可以将编程中的通道现象成水的通道，比如小溪或者河。如果你在河里放一个橡皮鸭，它会顺着水流一路向下。

一个通道有两部分：发射机和接收机。发射机就像河流的上游，也就是你将小鸭子放下的地方，而接收机就像鸭子最终抵达的地方。你可以在代码中调用发射机的方法来发送你想发送的数据，然后在另一部分接收消息。当发射机和接收机都被销毁时，你可以说通道被*关闭*了。

我们来开发一个程序，一个线程生成数据，发送到通道，另一个线程接收并打印它们。我们会发送一些实例数据来演示这个概念。当你对这个技术熟悉了以后，你可以在任何需要彼此交流的线程里使用通道，比如聊天系统或者分布式计算系统。

首先，我们来创建一个不做任何事的通道。注意下面的代码是无法编译的，因为Rust无法确定你要通过通道发送什么数据：

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
}
```

我们使用`mpsc::channel`函数创建了一个新的通道；`mpsc`是*多生产者，单消费者（multiple producer, single consumer）*的缩写。简单来说，Rust标准库实现的通道是可以拥有多个*发送*端来生产数据，但只能有一个*接收*端来消费数据。想象一下多条小溪汇聚成了一条大河：所有小溪里的东西最终都会流入大河。我们先来看看单生产者的场景，然后再慢慢增加到多个。

`mpsc::channel`函数会返回一个元组，第一个元素是发送端————也就是发射机————第二个元素是接收端————也就是接收机。`tx`和`rx`分别是*transmitter*和*receiver*的缩写，所以我们将它们作为变量名。我们使用了`let`声明和元组的解构；这部分我们会在第18章讨论。现在，你只需要知道这是一种`let`声明的简化语法，且能将`mpsc::channel`的返回值分解的方式即可。

我们将发送端移动到一个子线程中，然后通过它给主线程发送一条字符串消息，进行交流，代码如下。这部分就像把橡皮鸭放到了水里，或者从一个线程给另一个线程发送消息。

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    })
}
```

我们这里再次使用了`thread::spawn`来创建一个新的线程，并使用`move`将`tx`移动到了子线程的闭包内，这样子线程就拥有了`tx`。子线程需要发射机的所有权来给通道发送消息。`send`方法返回的是`Result<T, E>`类型，如果接收机已经被销毁，没有地方发送消息，那么发送操作会返回一个错误。这个例子里，我们会调用`unwrap`来panic。但在真实的应用里，我们需要正确地处理它：你可以回顾第9章来了解错误处理。

在下面的代码里，我们在主线程中获取了接收器中的值。这就好像在河的下游捡起橡皮鸭，或者接收聊天消息。

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

接收机预置了两个实用方法：`recv`和`try_recv`。我们这里使用`recv`，也就是*receive*的简写，它会阻塞当前主线程的执行，等待通道的值发送过来。等到值发送后，`recv`会返回一个`Result<T, E>`。等到接收机关闭时，`recv`会返回一个错误来标志着没有值会继续发送过来了。

`try_recv`方法不会阻塞，但是它会立刻返回一个`Result<T, E>`：如果有消息，那么`Ok`会持有它，如果没有，那么它会是一个`Err`变体。如果当前线程在等待消息期间还有其他工作要做，那么使用`try_recv`更合适：我们可以写一个轮询，它会时不时地调用`try_recv`，如果有消息就处理它，如果没有，就先进行其他工作，等待下一次查看。

本例中我们为了简单，就使用`recv`；我们在等待消息期间不需要在主线程中进行其他工作，所以阻塞主线程更合适。

当我们运行代码时，我们会看到主线程打印了如下消息：

```
Got: hi
```

完美！

## 通道和所有权转移

所有权规则在消息发送中扮演了重要的角色，因为它可以帮助你开发出安全、并发的程序。在Rust中时刻注意所有权就能天生地避免许多并发的问题。我们来做一个试验，展示一下通道和所有权是如何协作避免问题的：我们尝试在`val`被发送*后*在子线程中使用它。你可以试试编译下面的代码，看看为什么它会报错：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
        println!("val is {val}");
    });

    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

这里，我们尝试在`tx.send`发送了`val`后打印它。这样做不是一个好主意：一旦值被发送给其他线程，那个线程很有可能会在我们尝试再次使用值之前调整或者销毁它。另一个线程的调整可能会带来隐性的数据不稳定，甚至不存在，最终导致错误。然而，Rust会在编译时就给如下报错：

```
$ cargo run
   Compiling message-passing v0.1.0 (file:///projects/message-passing)
error[E0382]: borrow of moved value: `val`
  --> src/main.rs:10:26
   |
8  |         let val = String::from("hi");
   |             --- move occurs because `val` has type `String`, which does not implement the `Copy` trait
9  |         tx.send(val).unwrap();
   |                 --- value moved here
10 |         println!("val is {val}");
   |                          ^^^^^ value borrowed here after move
   |
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0382`.
error: could not compile `message-passing` (bin "message-passing") due to 1 previous error
```

我们的并发问题引发了编译错误。`send`函数获取了其参数的所有权，当值被移动时，接收器会获取其所有权。这就避免了我们误用已经被发送的值的情况；所有权系统会保证一切都是正常的。

## 发送多个值并让接收器等待

上一节的代码可以编译运行了，但是它并没有清晰地展示两个线程通过通道互相交流的情况。下面的代码中，我们进行了一些调整，来验证代码运行的并发性：子线程会发送多个消息，并在发送期间短暂暂停。

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("Got: {received}");
    }
}
```

这一次，子线程内有一个vector的字符串，要全部发送给主线程。我们迭代这个vector，将它们逐个发送，并调用`thread::sleep`并传入`Duration`值1在发送之间暂停。

在主线程中，我没有再调用`recv`函数了：取而代之的是，我们将`rx`看做一个迭代器。对每个收到的值，我们都会打印它。当通道关闭时，迭代也会结束。

运行上述代码，你会看到输出如下，且每行之间会有1秒的间隔：

```
Got: hi
Got: from
Got: the
Got: thread
```

由于我们没有在主线程的`for`循环中书写任何暂停或延迟的代码，我们可以确定主线程在等待子线程的值发送完毕。

## 通过克隆发射机来创造多个生产者

早先我们提到过`mpsc`是*multiple producer，single consumer*的缩写。我们来扩展之前的代码，使用`mpsc`来创建多个线程，并给同一个接收端发送消息。我们可以克隆发射机，代码如下：

```rust
    // 略

    let (tx, rx) = mpsc::channel();

    let tx1 = tx.clone();
    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx1.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    thread::spawn(move || {
        let vals = vec![
            String::from("more"),
            String::from("messages"),
            String::from("for"),
            String::from("you"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("Got: {received}");
    }

    // 略
```

这一次，在我们创建第一个子线程前，我们调用了发射机的`clone`。它会返回给我们一个新的发射机，我们可以将它传给第一个子线程。然后我们会将原始的发射机传递给第二个线程。这样我们就有两个线程，给同一个接收机发送了不同的消息。

运行代码，输出如下：

```
Got: hi
Got: more
Got: from
Got: messages
Got: for
Got: the
Got: thread
Got: you
```

你实际看到的值可能略有不同，取决于你的系统。这就是并发困难且极具趣味性的点。如果你使用`thread::sleep`实验，并给予各个线程不同的值，那么每一次运行的输出都会不同。

现在你明白了通道的工作原理，我们来看看并发的其他方法。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：这是一个很好的使用枚举来向通道发送不同消息的例子。这里，客户端将数字值加了1，检索了数字，并退出给了服务端。

</template>
<template #quiz>
<IsCompileText />

```rust
use std::{sync::mpsc, thread};

enum ClientMessage { Incr, Get, Quit }
enum ServerMessage { Get(usize) }

fn main() {
    let (server_tx, client_rx) = mpsc::channel();
    let (client_tx, server_rx) = mpsc::channel();
    let server = thread::spawn(move || {
        let mut n = 0;
        loop {
            match server_rx.recv().unwrap() {
                ClientMessage::Quit => break,
                ClientMessage::Incr => n += 1,
                ClientMessage::Get => server_tx.send(ServerMessage::Get(n)).unwrap()
            }
        }
    });

    for msg in [ClientMessage::Incr, ClientMessage::Get, ClientMessage::Quit] {
        client_tx.send(msg).unwrap();
    }

    if let ServerMessage::Get(n) = client_rx.recv().unwrap() {
        println!("{}", n)
    }

    server.join().unwrap();
}
```

<IsCompile :answer="{ compiled: true, result: '1' }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：通道只能发送单一类型的值，所以`tx.send(s.len())`会引发类型错误。如果你想发送不同类型的值，你可以使用枚举或者实现`Any`trait。

</template>
<template #quiz>
<IsCompileText />

```rust
use std::{sync::mpsc, thread};

fn main() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let s = String::from("Hello world");
        tx.send(s.clone()).unwrap();
        tx.send(s.len()).unwrap();
    });
    let s = rx.recv().unwrap();
    let n = rx.recv().unwrap();
    println!("{s} {n}");
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::
