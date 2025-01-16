<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"
</script>

# 处理任意数量的Futures

在上一节中，当我们将两个future调整为三个future时，我们也需要将`join`调整为`join3`。如果每次调整future的数量都需要调整对应的方法，就太麻烦了。幸运的是，`join`方法有宏版本，我们可以传入任意数量的future作为参数。它也会等待这些future。因此，我们可以使用`join!`而不是`join3`来重写代码：

```rust
        trpl::join!(tx1_fut, tx_fut, rx_fut);
```

这绝对比在`join`、`join3`和`join4`等等之间反复横跳要好太多了！然而，尽管这个宏可以处理已知数量的future。在真实场景中，将多个future插入集合中，然后等待其中的一部分或者全部完成也是一种常见的编程范式。

要检查一个集合里的全部future，我们需要对它们*全部*进行迭代和join。`trpl::join_all`函数就是为此而生，它可以接收任意实现了`Iterator`trait的类型，此trait我们在第13章中已经学习过。我们来试试将future放入一个vector中，并使用`join_all`来替代`join!`。

```rust
        let futures = vec![tx1_fut, rx_fut, tx_fut];

        trpl::join_all(futures).await;
```

不幸的是，这是无法编译的。我们会看到如下报错：

```
error[E0308]: mismatched types
  --> src/main.rs:43:37
   |
8  |           let tx1_fut = async move {
   |  _______________________-
9  | |             let vals = vec![
10 | |                 String::from("hi"),
11 | |                 String::from("from"),
...  |
19 | |             }
20 | |         };
   | |_________- the expected `async` block
21 |
22 |           let rx_fut = async {
   |  ______________________-
23 | |             while let Some(value) = rx.recv().await {
24 | |                 println!("received '{value}'");
25 | |             }
26 | |         };
   | |_________- the found `async` block
...
43 |           let futures = vec![tx1_fut, rx_fut, tx_fut];
   |                                       ^^^^^^ expected `async` block, found a different `async` block
   |
   = note: expected `async` block `{async block@src/main.rs:8:23: 20:10}`
              found `async` block `{async block@src/main.rs:22:22: 26:10}`
   = note: no two async blocks, even if identical, have the same type
   = help: consider pinning your async block and and casting it to a trait object
```

这样的错误可能有点出乎意料。毕竟，它们任何一员都没有返回任何东西，因此它们应该均为`Future<Output = ()>`。然而，`Future`是一个trait，不是一个具体的类型。真正的类型是编译器为async代码块生成的一个独立的数据结构。你无法将两个不同的自定义类型放入`Vec`中，编译器生成的类型也是同理。

要让这段代码成功，我们需要使用*trait对象（trait object）*，就像我们在第12章中做过的一样（关于trait对象的细节我们会在第18章中讨论）。使用trait对象可以让我们讲这些匿名的future看做同一个类型，因为它们都实现自`Future`trait。

> [!NOTE]
> 在第8章中，我们讨论了另一种在`Vec`中放置多个不同类型的方式：使用一个枚举来表示`Vec`中可能出现的类型。但是那个方法在这里并不奏效。首先，我们没办法为这里不同的类型命名，因为它们都是匿名的。其次，我们一开始需要使用vector和`join_all`的原因就在于需要处理动态的future数量，真实的数量需要在运行时才能确定。

我们可以将`vec!`中的future放入`Box::new`中，代码如下：

```rust
        let futures = vec![Box::new(tx1_fut), Box::new(rx_fut), Box::new(tx_fut)];

        trpl::join_all(futures).await;
```

不幸的是，代码仍然无法编译。实际上，这里的基础错误没有变化，但这次的错误来自第二个和第三个的`Box::new`调用，且这次的错误还指向了`Unpin`trait。我们等下会回到`Unpin`错误。现在，我们先通过显式地指定`futures`的类型为trait对象修复`Box::new`调用的问题：

```rust
        let futures: Vec<Box<dyn Future<Output = ()>>> = vec![Box::new(tx1_fut), Box::new(rx_fut), Box::new(tx_fut)];
```

这里的类型有些复杂，我们来拆解一下：

- 最内侧的类型就是future本身。我们显式地标注了future输出的类型为元类型`()`：`Future<Output = ()>`。
- 我们使用了`dyn`关键字将trait标注为动态。
- 整个trait被包裹在了`Box`中。
- 最终，我们将`futures`声明为包管这些元素的`Vec`。

这已经有很大的不同了。现在我们运行编译，我们只会看到`Unpin`的错误。虽然有三个错误，但是它们很类似：

```
error[E0277]: `{async block@src/main.rs:8:23: 20:10}` cannot be unpinned
   --> src/main.rs:46:24
    |
46  |         trpl::join_all(futures).await;
    |         -------------- ^^^^^^^ the trait `Unpin` is not implemented for `{async block@src/main.rs:8:23: 20:10}`, which is required by `Box<{async block@src/main.rs:8:23: 20:10}>: std::future::Future`
    |         |
    |         required by a bound introduced by this call
    |
    = note: consider using the `pin!` macro
            consider using `Box::pin` if you need to access the pinned value outside of the current scope
    = note: required for `Box<{async block@src/main.rs:8:23: 20:10}>` to implement `std::future::Future`
note: required by a bound in `join_all`
   --> /Users/chris/.cargo/registry/src/index.crates.io-6f17d22bba15001f/futures-util-0.3.30/src/future/join_all.rs:105:14
    |
102 | pub fn join_all<I>(iter: I) -> JoinAll<I::Item>
    |        -------- required by a bound in this function
...
105 |     I::Item: Future,
    |              ^^^^^^ required by this bound in `join_all`

error[E0277]: `{async block@src/main.rs:8:23: 20:10}` cannot be unpinned
  --> src/main.rs:46:9
   |
46 |         trpl::join_all(futures).await;
   |         ^^^^^^^^^^^^^^^^^^^^^^^ the trait `Unpin` is not implemented for `{async block@src/main.rs:8:23: 20:10}`, which is required by `Box<{async block@src/main.rs:8:23: 20:10}>: std::future::Future`
   |
   = note: consider using the `pin!` macro
           consider using `Box::pin` if you need to access the pinned value outside of the current scope
   = note: required for `Box<{async block@src/main.rs:8:23: 20:10}>` to implement `std::future::Future`
note: required by a bound in `JoinAll`
  --> /Users/chris/.cargo/registry/src/index.crates.io-6f17d22bba15001f/futures-util-0.3.30/src/future/join_all.rs:29:8
   |
27 | pub struct JoinAll<F>
   |            ------- required by a bound in this struct
28 | where
29 |     F: Future,
   |        ^^^^^^ required by this bound in `JoinAll`

error[E0277]: `{async block@src/main.rs:8:23: 20:10}` cannot be unpinned
  --> src/main.rs:46:33
   |
46 |         trpl::join_all(futures).await;
   |                                 ^^^^^ the trait `Unpin` is not implemented for `{async block@src/main.rs:8:23: 20:10}`, which is required by `Box<{async block@src/main.rs:8:23: 20:10}>: std::future::Future`
   |
   = note: consider using the `pin!` macro
           consider using `Box::pin` if you need to access the pinned value outside of the current scope
   = note: required for `Box<{async block@src/main.rs:8:23: 20:10}>` to implement `std::future::Future`
note: required by a bound in `JoinAll`
  --> /Users/chris/.cargo/registry/src/index.crates.io-6f17d22bba15001f/futures-util-0.3.30/src/future/join_all.rs:29:8
   |
27 | pub struct JoinAll<F>
   |            ------- required by a bound in this struct
28 | where
29 |     F: Future,
   |        ^^^^^^ required by this bound in `JoinAll`

Some errors have detailed explanations: E0277, E0308.
For more information about an error, try `rustc --explain E0277`.
```

这真是*一大堆*需要消化内容，我们来一一分解。第一部分告诉我们第一个async代码块（`src/main.rs:8:23: 20:10`）没有实现`Unpin`trait，建议使用`pin!`或者`Box::pin`来解决。本章后面的部分，我们会挖掘关于`Pin`和`Unpin`的更多细节。现在，你只需要采纳编译器的建议来解决问题！下面的代码里，我们更新了`features`的类型标注，使用`Pin`包裹了每一个`Box`。然后，我们使用`Box::pin`来固定住future。

```rust
        let futures: Vec<Pin<Box<dyn Future<Output = ()>>>> = vec![Box::pin(tx1_fut), Box::pin(rx_fut), Box::pin(tx_fut)];
```

编译这段代码，我们终于可以看到正常的输出：

```
received 'hi'
received 'more'
received 'from'
received 'messages'
received 'the'
received 'for'
received 'future'
received 'you'
```

呼，可以松一口气了！

这里还有很多可以挖掘的细节。比如，使用`Pin<Box<T>>`会引入额外的消耗，因为需要将这些future通过`Box`放入堆中————而我们仅仅是为了处理类型问题。我们其实并不*需要*分配堆内存，毕竟：这些future对于函数来说都是本地的。就像前面提到的一样，`Pin`本身是一个包裹类型，我们通过它来满足`Vec`的单一类型要求————也是我们一开始使用`Box`的原因————而无需堆内存分配。我们也可以直接使用`Pin`来包裹future，即使用`std::pin::pin`宏。

然而，我们还是需要显式指定被固定住的引用类型；否则Rust不会知道要将它们解释为动态的trait对象，即我们需要赋给`Vec`的类型。因此我们需要在定义每一个future时调用`pin!`，然后将`futures`定义为一个`Vec`，其元素类型为被固定住的对动态`Future`类型的可变引用：

```rust
        let tx1_fut = pin!(async move {
            // --略--
        });

        let rx_fut = pin!(async {
            // --略--
        });

        let tx_fut = pin!(async {
            // --略--
        });

        let futures: Vec<Pin<&mut dyn Future<Output = ()>>> = vec![tx1_fut, rx_fut, tx_fut];
```

我们目前一直忽略了不同`Output`类型的可能性。比如，在下面的代码里，`a`的匿名future实现为`Future<Output = u32>`，`b`的匿名future实现为`Future<Output = &str>`，`c`的匿名实现为`Future<Output = bool>`。

```rust
        let a = async { 1u32 };
        let b = async { "Hello" };
        let c = async { true };

        let (a_result, b_result, c_result) = trpl::join!(a, b, c);
        println!("{a_result}, {b_result}, {c_result}");
```

我们可以使用`trpl::join!`来await它们，因为它允许传入不同类型的future，且返回这些类型组成的元组。我们*不能*使用`trpl::join_all`，因为它要求传入future的类型相同，其错误就是我们在开始这场`Pin`讨论时遇到的。

这是一个权衡：我们可以使用`join_all`来处理不定数量的future，但它们必须有相同的类型，我们也可以使用`join`方法或`join!`宏来处理给定数量的future，也允许其类型各不相同。这与处理Rust中的其他类型没有区别。尽管我们有一些优雅的语法来处理future，但它们并不特殊，这是一件好事。

## future竞速

当我们使用`join`家族的函数和宏对future进行“join”时，我们要求它们*全部*完成后才能继续。但有时，我们只需要*一部分*future完成即可继续————就像让future之间竞速一样。相应的操作也因此被称为`race`。

> [!NOTE]
> 在底层，`race`是基于更基础的函数`select`实现的，后者在真实的代码场景中使用更多。`select`也比`trpl::race`有更多的功能，但它也引入了额外的复杂度，因此我们暂且不谈。

下面的代码里，我们使用`trpl::race`来运行两个future，`slow`和`fast`。每一个future都会在开始运行时打印消息，使用`sleep`等待一段时间，然后在完成前再次打印消息。我们将它们传给了`trpl::race`，等待其中之一完成。（不出所料的，`fast`获胜了！）注意这和我们之前使用的`race`不一样，我们忽略了其返回的`Either`实例，因为有趣的部分发生在async代码块中。

```rust
        let slow = async {
            println!("slow started");
            trpl::sleep(Duration::from_millis(100)).await;
            println!("slow finished");
        };

        let fast = async {
            println!("fast started");
            trpl::sleep(Duration::from_millis(50)).await;
            println!("fast finished");
        };

        trpl::race(slow, fast).await;
```

注意如果你将`race`参数的顺序更换，那么“started”相关的消息打印顺序也会发生变化，即便`fast`future永远更快完成。这是因为这个`race`的实现是不公平的。它永远会按照传入参数的顺序执行future。也有一些实现*是*公平的，它会随机地选择先执行的future。不过，不管我们使用的`race`实现是否公平，其中一个future都会在另一个开始前运行到它的第一个`.await`。

回顾前面学习的内容，Rust的运行时允许暂停一个future还没有准备好的任务，并切换到其他任务上继续执行。反过来也是一样的：Rust*只会*在await点暂停async代码块，将控制权交给运行时。await点之间的事是完全同步的。

这就意味着如果你在一个async代码块中进行繁重的工作，而没有加入任何await点，那么这个future会阻塞其他future的执行。你可能听过类似的说法，一个future*抢占了其他future的资源*。在某些情况下，这个问题会非常严重。然而，如果你打算进行一些昂贵的准备工作或者长任务，或者你有一些无限执行特定任务的future，那么你需要慎重考虑何时将控制权交给运行时。

同样的道理，如果你有长时间的阻塞性操作，async就是将其转为多个相关联代码块的绝佳工具。

但是在这些情况下*如何*将控制权还给运行时呢？

## 让步

我们来模拟一个长时任务。下面的代码创建了一个`slow`函数。它使用`std::thread::sleep`而不是`trpl::sleep`，这样`slow`的调用会阻塞当前线程几秒钟。我们可以将`slow`看做真实世界里的长时阻塞性任务。

```rust
fn slow(name: &str, ms: u64) {
    thread::sleep(Duration::from_millis(ms));
    println!("'{name}' ran for {ms}ms");
}
```

下面，我们使用`slow`来模拟在future中进行CPU密集型的任务。目前，每个future只会在运行完长任务*后*才会将控制权返还给运行时。

```rust
        let a = async {
            println!("'a' started.");
            slow("a", 30);
            slow("a", 10);
            slow("a", 20);
            trpl::sleep(Duration::from_millis(50)).await;
            println!("'a' finished.");
        };

        let b = async {
            println!("'b' started.");
            slow("b", 75);
            slow("b", 10);
            slow("b", 15);
            slow("b", 35);
            trpl::sleep(Duration::from_millis(50)).await;
            println!("'b' finished.");
        };

        trpl::race(a, b).await;
```

运行这段代码，输出如下：

```
'a' started.
'a' ran for 30ms
'a' ran for 10ms
'a' ran for 20ms
'b' started.
'b' ran for 75ms
'b' ran for 10ms
'b' ran for 15ms
'b' ran for 350ms
'a' finished.
```

正如我们之前描述的一样，`race`会在`a`完成后完成。这两个future不会有交错。future`a`会运行`trpl::sleep`被await前的工作，然后future`b`会运行`trpl::sleep`被await前的工作，然后future`a`会完成。要允许两个future在其长任务期间有所进展，我们需要await节点来让出控制权给运行时。也就是说我们需要一些可以await的东西！

在上面的代码里，我们已经看到了类似的“让步”：如果我们移除了future`a`里的`trpl::sleep`，那么future`b`*完全不会执行*。也许我们可以使用`sleep`作为开始？

```rust
        let one_ms = Duration::from_millis(1);

        let a = async {
            println!("'a' started.");
            slow("a", 30);
            trpl::sleep(one_ms).await;
            slow("a", 10);
            trpl::sleep(one_ms).await;
            slow("a", 20);
            trpl::sleep(one_ms).await;
            println!("'a' finished.");
        };

        let b = async {
            println!("'b' started.");
            slow("b", 75);
            trpl::sleep(one_ms).await;
            slow("b", 10);
            trpl::sleep(one_ms).await;
            slow("b", 15);
            trpl::sleep(one_ms).await;
            slow("b", 35);
            trpl::sleep(one_ms).await;
            println!("'b' finished.");
        };
```

在上面的代码里，我们在`slow`调用的间隙增加了`trpl::sleep`的调用。这样，两个future的工作就会交错进行：

```
'a' started.
'a' ran for 30ms
'b' started.
'b' ran for 75ms
'a' ran for 10ms
'b' ran for 10ms
'a' ran for 20ms
'b' ran for 15ms
'a' finished.
```

future`a`仍然会在将运行权交给`b`前运行一小段时间，因为它在调用`trpl::sleep`前调用了`slow`，但在那之后，future的运行切换了四次，每次都命中了await点。当前情况下，我们可以在每次`slow`后调用，因为这里的工作分解后对我们仍然是有效的。

但我们并不希望在这里*sleep*：我们希望可以让进度足够快。只希望可以将控制器交给运行时。我们可以调用`yield_now`来直接完成这个工作。下面的代码里，我们将`sleep`改为了`yield_now`。

```rust
        let a = async {
            println!("'a' started.");
            slow("a", 30);
            trpl::yield_now().await;
            slow("a", 10);
            trpl::yield_now().await;
            slow("a", 20);
            trpl::yield_now().await;
            println!("'a' finished.");
        };

        let b = async {
            println!("'b' started.");
            slow("b", 75);
            trpl::yield_now().await;
            slow("b", 10);
            trpl::yield_now().await;
            slow("b", 15);
            trpl::yield_now().await;
            slow("b", 35);
            trpl::yield_now().await;
            println!("'b' finished.");
        };
```

这样不仅更清晰地表明了我们的实际意图，同时也比`sleep`更快，因为类似`sleep`这样的定时器对其时间颗粒度有限制。比如我们所使用的`sleep`函数，就只能精确到毫秒，即使我们给它传了一纳秒也一样。再次强调，现代电脑的速度非常*快*：一毫秒内它们可以做很多事。

你可以通过设置一些基准测试来检查，比如下面的代码。（这段代码不是标准的性能测试，但可以说明它们的区别。）这里，我们跳过了所有的状态打印，给`trpl::sleep`传递了1纳秒，然后让每一个future独立运行，不进行切换。接着我们运行了1000次的循环，来看看`trpl::sleep`和`trpl::yield_now`的性能比较：

```rust
        let one_ns = Duration::from_nanos(1);
        let start = Instant::now();
        async {
            for _ in 1..1000 {
                trpl::sleep(one_ns).await;
            }
        }
        .await;
        let time = Instant::now() - start;
        println!(
            "'sleep' version finished after {} seconds.",
            time.as_secs_f32()
        );

        let start = Instant::now();
        async {
            for _ in 1..1000 {
                trpl::yield_now().await;
            }
        }
        .await;
        let time = Instant::now() - start;
        println!(
            "'yield' version finished after {} seconds.",
            time.as_secs_f32()
        );
```

`yield_now`的版本要*快得多*！

这也说明了，即便对于密集计算的任务（或者你的程序在进行的工作），async也十分实用，因为它提供了实用地工具来组织不同代码片段直接的关系。这也是一种形式的*协作式多任务处理（cooperative multitasking）*，即每一个future都有权决定其移交控制权的时机，也就是await点。因此，每一个future都有责任避免阻塞太长时间。在一些基于Rust开发的嵌入式操作系统中，这是*唯一*的多任务处理方式！

在真实世界的代码中，你当然不需要在每一行代码后关注函数的交替执行情况。尽管让步的控制相对来说消耗较小，但也不是无消耗！很多情况下，试图拆解密集计算的任务反而会让它变得更慢，所以有时候出于对*整体的*性能考量，让一个操作简单地阻塞也不是坏事。你应该通过缜密的测试来判断你的性能瓶颈。如果你发现许多本该并发执行的任务却在串行运行，牢记这种底层机制非常重要！

## 自定义async抽象

我们可以结合future来实现新的功能。例如，我们可以使用现有的异步构件构建一个`timeout`函数。完成后，该结果将成为另一个可用于构建更高层异步抽象的构件。

下面的代码展示了我们期望的`timeout`配合慢future工作的情况：

```rust
        let slow = async {
            trpl::sleep(Duration::from_millis(100)).await;
            "I finished"
        };

        match timeout(slow, Duration::from_millis(10)).await {
            Ok(message) => println!("Succeeded with '{message}'"),
            Err(duration) => {
                println!("Failed after {} seconds", duration.as_secs())
            }
        }
```

我们来实现！首先，我们需要思考`timeout`：

- 它应该是一个async函数，这样我们可以await它。
- 它的第一个参数应该是一个future。我们需要设计为一个泛型，这样可以适配任何future。
- 它的第二个参数应该是一个最大等待时间。如果我们使用`Duration`，那么这个参数会被传递给`trpl::sleep`。
- 它应返回一个`Result`。如果future成功完成，那么`Result`就是`Ok`，且其内部的值为future提供的值。如果给定的时间过去了，那么`Result`就是`Err`，并显示超时等待的时间。

下面是函数的定义：

```rust
async fn timeout<F: Future>(
    future_to_try: F,
    max_time: Duration,
) -> Result<F::Output, Duration> {
    // 待实现
}
```

这样的类型可以完成我们的目的。现在，我们来思考我们需要的*行为*：我们想要让传入的future和时长竞速。我们可以使用`trpl::sleep`来基于时长创建一个定时器的future，使用`trpl::race`让这个定时器和传入的future竞速。

我们知道`race`是不公平的，会根据传入参数的顺序决定执行顺序。因此，我们首先给`race`传入`future_to_try`，这样即使`max_time`非常短，它也有机会完成。如果`future_to_try`先完成，那么`race`会返回`Left`，即`future`的输出。如果`timer`先完成，那么`race`会返回`Right`，即定时器的输出`()`。

在下面的代码里，我们对`trpl::race`的返回进行了匹配。如果`future_to_try`成功了，我们收到了`Left(output)`，我们就会返回`Ok(output)`。如果内部的定时器完成了，我们收到了`Right(())`，我们就会忽略`()`，返回一个`Err(max_time)`。

```rust
use trpl::Either;

// 略

fn main() {
    trpl::run(async {
        let slow = async {
            trpl::sleep(Duration::from_secs(5)).await;
            "Finally finished"
        };

        match timeout(slow, Duration::from_secs(2)).await {
            Ok(message) => println!("Succeeded with '{message}'"),
            Err(duration) => {
                println!("Failed after {} seconds", duration.as_secs())
            }
        }
    });
}

async fn timeout<F: Future>(
    future_to_try: F,
    max_time: Duration,
) -> Result<F::Output, Duration> {
    match trpl::race(future_to_try, trpl::sleep(max_time)).await {
        Either::Left(output) => Ok(output),
        Either::Right(_) => Err(max_time),
    }
}
```

这样，我们就有了一个可用的`timeout`，基于另外的两个async工具函数。如果我们运行这段代码，它会打印失败的消息：

```
Failed after 2 seconds
```

因为future可以和其他future组合，你可以使用小的async代码块组成强大的工具。例如，你可以使用相同的方法将超时与重试相结合，进而将其应用于网络调用等场景————就像本章开始的例子！

实践中，你通常主要和`async`和`.await`打交道，其次是和一些函数或宏，比如`join`、`join_all`、`race`等等。你只需要偶尔结合`pin`来使用这些API。

我们已经看到了几种处理多个future的方式。接下来，我们将了解如何使用流按时间顺序处理多个future。下面是一些可以提前思考的问题：

- 我们使用了`Vec`和`join_all`来处理多个future的完成。那么如何使用`Vec`来处理含顺序的一组future呢？我们又要为之付出什么代价呢？
- 查看`futures`crate的`futures::stream::FutureUnordered`。使用它和使用`Vec`的不同是什么？（不需要担心它是来自crate的`stream`部分；它适配于任何的future集合。）

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：由于没有使用`join_all`一类的函数，future不会并发运行。因此这段代码会运行15秒（每个元素5秒）。

</template>
<template #quiz>

现有函数`sleep(d)`，它会根据给定的时长进行休眠，代码如下：

```rust
let futs: Vec<_> = [1, 2, 3].iter().map(|n| async {
    sleep(Duration::from_secs(5)).await;
    n + 1
}).collect();

for fut in futs {
    let n = fut.await;
    println!("{n}");
}
```

如果执行，那么需要多长时间来执行？

<Radio>
<Option label="15" answer />
<Option label="5" />
<Option label="0" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：以下是这个函数的实现：

```rust
async fn map_stringify<I, O, F>(
    f: impl Fn(I) -> F, inputs: Vec<I>
) -> Vec<String>
where
    O: ToString,
    F: Future<Output = O>,
{
    let f = &f;
    let futs = inputs
      .into_iter()
      .map(|input| async move { f(input).await.to_string() });
    futures::future::join_all(futs).await
}
```

</template>
<template #quiz>

假设你设计了一个工具函数，声明如下：

---

`map_stringify`接收两个参数：一个输入的集合，一个将输入转化为输出的async函数，且输出可以被转化为字符串。`map_stringify`会返回一个转化好的集合。

---

以下哪一个函数签名和描述最匹配？

<Radio>
<Option>

```rust
fn map_stringify<I, O, F>(
    inputs: Vec<I>, f: impl Fn(I) -> O,
) -> Vec<impl Future<Output = String>>
where
    O: ToString,
```

</Option>
<Option>

```rust
async fn map_stringify(
    inputs: Vec<String>, f: impl Future<Output = String>
) -> Vec<String>
```

</Option>
<Option>

```rust
async fn map_stringify<I, F>(
    inputs: Vec<I>, f: impl Fn(I) -> F,
) -> Vec<String>
where
    F: Future + ToString,
```

</Option>
<Option answer>

```rust
async fn map_stringify<I, O, F>(
    inputs: Vec<I>, f: impl Fn(I) -> F,
) -> Vec<String>
where
    O: ToString,
    F: Future<Output = O>,
```

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：比如，你可以在长任务的future和一个在500ms内`sleep`的future之间运行`select`。

</template>
<template #quiz>

假设你实现了一个程序，需要运行async代码，每500毫秒检查计算是否停止。以下哪一个工具函数完成这个任务最合适？

<Radio>
<Option label="join" />
<Option label="yield" />
<Option label="race/select" answer />
<Option label="spawn/spawn_task" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
