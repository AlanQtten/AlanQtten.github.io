<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 使用Async处理并发

本章，我们会使用async解决一些我们在第16章中使用线程解决了的并发挑战。由于我们已经讨论过了核心思想，本章我们会更关注线程和future的区别。

大部分情况下，使用async的API和使用线程的API非常类似。而在小部分情况下，它们最终的结果会有所不同。即使线程和async的API*看起来相似*，它们的行为也是不同的————它们的性能表现也往往不同。

## 计数

我们在第16章讨论的第一个话题就是使用不同的线程来计数。我们来使用async完成相同的任务。`trpl`crate提供了`spawn_task`函数，它和`thread::spawn`API很像，而`sleep`就是async版本的`thread::sleep`。我们可以结合它们来实现和线程一样的计数功能：

```rust
use std::time::Duration;

fn main() {
    trpl::run(async {
        trpl::spawn_task(async {
            for i in 1..10 {
                println!("hi number {i} from the first task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        });

        for i in 1..5 {
            println!({"hi number {i} from the second task!"});
            trpl::sleep(Duration::from_millis(500)).await;
        }
    })
}
```

首先，我们在`main`函数中使用了`trpl::run`，这样我们的顶层函数就可以书写async代码了。

> [!NOTE]
> 在本章的每个例子中，我们的`main`函数都会使用`trpl::run`，所以我们会省略掉这部分代码。你使用时可不要忘记哦！

然后我们在代码块中插入了两个循环，循环内都调用了`trpl::sleep`，打印下一条信息前都等待了半秒（500毫秒）。我们在`trpl::spawn_task`中插入了一个循环，在顶层函数中插入了一个循环。我们也给每一个`sleep`的调用都添加了`.await`。

这和基于线程的实现类似————输出也是跟之前一样的不固定的顺序。

```
hi number 1 from the second task!
hi number 1 from the first task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
```

这个版本的代码会在顶层代码块中的循环结束时立即结束，`spawn_task`函数也会在主函数结束时结束。如果你想要等待所有的任务完成，你需要使用句柄来等待。使用线程时，我们可以使用`join`方法来“阻塞”，直到对应的线程结束。而在下面的代码中，我们可以使用`.await`来完成同样的事，因为句柄本身是一个future。它的`Output`类型为`Result`，所以我们可以在等待到后展开它。

```rust
        let handle = trpl::spawn_task(async {
            for i in 1..10 {
                println!("hi number {i} from the first task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        });

        for i in 1..5 {
            println!({"hi number {i} from the second task!"});
            trpl::sleep(Duration::from_millis(500)).await;
        }

        handle.await.unwrap();
```

这个版本的代码会等待*两个*循环都完成。

```
hi number 1 from the second task!
hi number 1 from the first task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
hi number 6 from the first task!
hi number 7 from the first task!
hi number 8 from the first task!
hi number 9 from the first task!
```

到目前为止，async和线程给予我们的结果是一样的，只是语法不同：使用`.await`而不是调用`join`来处理句柄，以及对`sleep`调用的等待。

最大的不同点是，我们不需要启用另一个操作系统线程来完成任务了。实际上，我们甚至都不需要开启一个任务。因为async代码块会编译成匿名的future，我们可以将每个循环放到async代码块中，使用`trpl::join`函数来在运行时同时运行它们。

在第16章，我们展示了如何使用`std::thread::spawn`返回的`JoinHandle`类型上的`join`方法。`trpl::join`函数是类似的，但是它是future版本的，当你传入两个future时，它会创建一个新的future，其输出为一个元组，元组会在包括你传入的两个future完成后的输出。因此，我们可以使用`trpl::join`来等待`fut1`和`fut2`完成。我们*没有*await`fut1`和`fut2`，而是await了`trpl::join`返回的新的future。我们忽略了输出，因为此处的元组只包含了两个元数据。

```rust
        let fut1 = async {
            for i in 1..10 {
                println!("hi number {i} from the first task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let fut2 = async {
            for i in 1..5 {
                println!("hi number {i} from the second task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        trpl::join(fut1, fut2).await;
```

运行这段代码，我们可以看到两个future都完成了：

```
hi number 1 from the first task!
hi number 1 from the second task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
hi number 6 from the first task!
hi number 7 from the first task!
hi number 8 from the first task!
hi number 9 from the first task!
```

这里，我们看到的输出顺序是稳定的，和在线程中看到的不一样。因为`trpl::join`函数是*公平的*，它会平均地检查每个future，在它们之间交替，永远不会让其中一个等待太久。对线程而言，操作系统会决定检查间隔以及运行某个线程运行的时长。而对于Rust的async，运行时会决定检查哪一个任务（实际中的情况可能会更复杂，因为async运行时可能会在底层使用线程来管理异步，这就使得其要付出更多努力来保证公平————但仍然是可以做到的！）运行时并不会为任何操作保证公平，所以它们往往会提供不同的API，让用户选择是否需要保证公平。

你可以尝试以下等待future的变体，看看它们的效果：

- 移除一个或两个循环中的异步代码。
- 在定义async代码块后立刻执行await。
- 仅将第一个循环包裹在async代码块中，在第二个循环体后await它。

如果你想要更有挑战性，试试你能不能在代码运行*前*就推测出它们的输出！

## 消息传递

在future之间共享数据也很熟悉：我们可以再次使用消息传递，但是要使用async版本的类型和方法。为了展示基于线程和基于future的并发的关键不同点，我们会走一条和第16章中轻微不同的路线。在下面的代码里，我们先创建一个async代码块————*不是*像分配一个线程那样分配一个不同的任务。

```rust
        let (tx, mut rx) = trpl::channel();

        let val = String::from("hi");
        tx.send(val).unwrap();

        let received = rx.recv().await.unwrap();
        println!("Got: {received}");
```

这里，我们使用了`trpl::channel`，一个async版本的多生产者，单消费者的通道API，类似我们在第16章使用的线程版本。async版本的API和基于线程的版本有一点不同：它使用了可变而不是不可变的接受者`rx`，且其`recv`方法会产生一个我们可以await的future而不是一个直接的值。现在我们可以从生产者发消息给接收者了。注意我们不需要开启一个新的线程，甚至不需要开启一个新的任务；我们只需要await`rc.recv`的调用即可。

`std::mpsc::channel`的同步方法`Receiver::recv`会阻塞，直到其收到一条消息。而`trpl::Receiver::recv`不会，因为它是异步的。它不会阻塞，而是将控制权交给运行时，直到收到消息，或者通道关闭。相比之下，我们不需要await`send`方法，因为它不会阻塞。它不需要阻塞，因为我们将它发入了无边界的通道。

> [!NOTE]
> 由于所有的异步代码都运行在一个`trpl::run`负责的异步代码块里，其中的一切都可以避免阻塞。然而，*外部的*代码会阻止`run`函数的返回，这就是`trpl::run`函数的意义：它允许你选择在何处阻塞异步代码，从而决定同步代码和异步代码切换的位置。出于这个原因，在大部分async运行时里，`run`都会命名为`block_on`。

你可以从这个例子里发现两件事：一，信息回到达正确的地方！二，虽然我们使用了future，但这里其实没有任何异步。列出的一切都是顺序执行的，就像future不存在一样。

我们来发送一系列信息，且在其间等待，代码如下：

```rust
        let (tx, mut rx) = trpl::channel();

        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("future"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            trpl::sleep(Duration::from_millis(500)).await;
        }

        while let Some(value) = rx.recv().await {
            println!("received '{value}'");
        }
```

除了发送消息外，我们也需要接收他们。在这种情况下，我们可以手动进行，只要调用`rx.recv().await`四次就可以了，因为我们知道会有多少消息传来。在真实世界中，我们可能需要处理*未知*数量的信息。那种情况下，我们需要一致等待，直到我们可以肯定没有更多消息了。

在之前的代码中，我们使用了`for`循环来处理同步通道中的所有元素。然而，Rust没有提供`for`循环来迭代异步元素的方法。我们可以用一种还没有见过的新循环，即`while let`循环。`while let`就是循环版本的`if let`结构。循环会一直执行，直到表达式不再和值匹配。

`rx.recv`的调用会返回一个`Future`，我们可以await它。运行时会等待这个`Future`完成。一旦一个消息到达，future就会解析为`Some(message)`，随后的信息也一样。当通道关闭时，即使还有没到达的*任何*信息，future也会立刻解析为`None`来表明不会有更多的值了，我们应该停止循环————即，停止await。

`while let`会集合这一切。如果`rx.recv().await`的调用结果是`Some(message)`，我们就获取到了消息的访问权，且可以在循环中使用它，就像`if let`一样。如果结果是`None`，那么循环会结束。每次循环完成时，它都会再次检查await点，所以运行时会暂停，直到接收到另一条消息。

现在所有的消息可以成功的发送和接收了。不幸的是，这里仍然存在一些问题。比如，如果消息不是按照半秒的间隔到达。而是在程序开始后的2秒（2000毫秒）同时到达了。这样，程序永远不会退出！它会永远等待新消息。你只能使用ctrl+c来手动停止它。

我们先来思考为什么所有的消息会在一段延迟后同时到达，而不是有间隔地一个一个到达。在一个async代码块里，`.await`关键字在代码中出现的顺序就是它们运行的顺序。

在上面的代码里，只有一个async代码块，所以一切都是线性的。并不存在并发性。所有的`tx.send`调用都会依次发生，并穿插着所有的`trpl::sleep`调用及其相关的await点。只有这些操作完成之后，`while let`循环才会开始经过`recv`调用中的`.await`点。

要创造我们想要的行为，让延迟发生在我们接收消息的间隔，我们需要将`tx`和`rx`操作放到独立的async代码块中。然后运行时就可以使用`trpl::join`分别指向它们，就像计数例子中一样。再次，我们等待了`trpl::join`的调用结果，而不是独立的future。如果我们按顺序等待了独立的future，我们又会回到一个顺序的执行————正是我们要*避免*的。

```rust
        let tx_fut = async {
            let vals = vec![
                String::from("hi"),
                String::from("from"),
                String::from("the"),
                String::from("future"),
            ];

            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received '{value}'");
            }
        };

        trpl::join(tx_fut, rx_fut).await;
```

通过这次代码更新，消息会按照500毫秒的间隔打印，而不会在2秒后同时打印。

但程序仍然不会退出，因为`while let`循环的方式和`trpl::join`互相影响了：

- `trpl::join`返回的future只会在*所有*传递给它的future都完成时才会完成。
- `tx`future会在它发送完`vals`中的最后一条消息，并睡眠后完成。
- `rx`future会在`while let`循环结束后完成。
- `while let`循环不会结束，除非`rx.recv`提供了`None`。
- `rx.recv`只会在通道的另一端关闭后才会返回`None`。
- 通道只会在调用`rx.close`或者发送端`tx`被销毁时才会关闭。
- 我们没有在任何地方调用`rx.close`，而`tx`也不会销毁，直到最外层的，传递给`trpl::run`的async代码块结束。
- 代码块无法结束，因为它被`trpl::join`阻塞了，我们又回到了最开始的问题。

我们可以调用`rx.close`来手动关闭`rx`，但那样是不符合常理的。在接收特定数量的消息后关闭会让程序停止，但是我们可能会错过消息。我们需要其他办法来确保`tx`在函数结束*前*销毁。

现在，我们发送消息的async代码块只借用了`tx`，但是如果我们将`tx`移动到async代码块中，它就会在代码块执行完时被销毁。在第13章里，我们学到了如何在闭包中使用`move`关键字，而在第`16`章，我们看到了，在和线程打交道时我们总是需要move数据到闭包中。相同的规则动态使用于async代码块，所以`move`关键字对async代码块的作用和闭包类似。

下面，我们将`async`代码块改为一个`async move`代码块。让我们运行这一版代码时，它会优雅地在最后一条消息被发送并接受后停止。

```rust
        let (tx, mut rx) = trpl::channel();

        let tx_fut = async_move {
            let vals = vec![
                String::from("hi"),
                String::from("from"),
                String::from("the"),
                String::from("future"),
            ];

            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                epirntln!("received '{value}'");
            }
        };

        trpl::join(tx_fut, rx_fut).await;
```

async的通道还是一个多生产者的通道，所以如果我们想从多个future发送消息，可以调用`tx`的`clone`方法。在下面的代码里，我们克隆了`tx`，在第一层的async代码块中创造了`tx1`。我们将`tx1`移入async块中，就像我们对`tx`做的一样。然后，我们将`tx`移入了*新的*async代码块中，这里我们以一个慢一些的间隔发送消息。我们恰好将新的async代码块放在接收消息的async块后，但也不影响程序的运行。future的关键在于它们被await的顺序，而不是它们被创建的顺序。

发送消息的async代码块都需要标注为`async move`，所以`tx`和`tx1`会在相应的代码结束后被销毁。否则我们掉回我们一开始的死循环中。最终，我们将`trpl::join`换为了`trpl::join3`来处理额外的future。

```rust
        let (tx, mut rx) = trpl::channel();

        let tx1 = tx.clone();
        let tx1_fut = async move {
            let vals = vec![
                String::from("hi"),
                String::from("from"),
                String::from("the"),
                String::from("future"),
            ];

            for val in vals {
                tx1.send(val).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received '{value}'");
            }
        };

        let tx_fut = async move {
            let vals = vec![
                String::from("more"),
                String::from("messages"),
                String::from("for"),
                String::from("you"),
            ];

            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(Duration::from_millis(1500)).await;
            }
        };

        trpl::join3(tx1_fut, tx_fut, rx_fut).await;
```

现在我们可以看到所有来自发送future的消息了。因为发送的future的间隔不同，所以我们接收到消息的间隔也是类似的：

```
received 'hi'
received 'more'
received 'from'
received 'the'
received 'messages'
received 'future'
received 'for'
received 'you'
```

这是一个好的开始，但是我们可处理的future数量仍是受限的：`join`能处理2个，`join3`能处理3个。我们来看看如何处理更多的future吧。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：这个程序的行为是确定的。打印的代码直到async代码块被await才会执行。而它们await的顺序是c/b/a，所以程序会打印CBA。

</template>
<template #quiz>
现有如下函数：

```rust
async fn print_letters() {
    let a = async { print!("A"); };
    let b = async { print!("B"); };
    let c = async { print!("C"); };
    c.await;
    b.await;
    a.await;
}
```

在运行`print_letters().await`后，以下哪些输出可能是正确的？

<Checkbox>
<Option label="CBA" answer />
<Option label="ABC" />
<Option label="BCA" />
<Option label="ACB" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：假想的方法`wait_all`和`join`的语义类似，但是保证更少。仅针对这个程序来说，给定的两个future的任何交错都是有可能的。唯一无效的输出就是和程序运行相悖的顺序，比如，DABC就是D会在C前输出。

</template>
<template #quiz>

假设现有一个辅助函数`wait_all(a, b)`，它的行为如下：

- `wait_all`会保证a和b都执行完成。
- `wait_all`不会保证公平性和初始执行顺序。

那么对于如下代码：

```rust
async fn print_letters() {
    let fut1 = async {
        print!("A");
        sleep().await;
        print!("B");
    };
    let fut2 = async {
        print!("C");
        sleep().await;
        print!("D");
    }
    wait_all(fut1, fut2).await;
}
```

在运行`print_letters().await`后，以下哪些输出可能是正确的？

<Checkbox>
<Option label="CADB" answer />
<Option label="ACBD" answer />
<Option label="ABCD" answer />
<Option label="DABC" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：由于通道是非阻塞性的，我们可以在发送前创建接收通道而不会死循环。

</template>
<template #quiz>

假设你通过`channel()`获取了一个消息通道，且它是非阻塞性的且*有界的*，即`send`返回的future会在通道内有空间时才完成。假设你使用函数`join(a, b)`*公平地*等待两个参数完成。那么对于如下代码：

```rust
let (tx, mut rx) = channel(16);
let recv_fut = rx.recv();
let send_fut = tx.send(0);
let (n, _) = join(recv_fut, send_fut).await;
println!("{}", n.unwrap());
```

执行这段代码会发生什么？

<Radio>
<Option label="程序打印0，且进入了死循环" />
<Option label="程序会panic" />
<Option label="程序不会打印任何东西，且进入了死循环" />
<Option label="程序打印0，且退出了" answer />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
