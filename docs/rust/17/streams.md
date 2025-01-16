<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 流

目前为止，我们接触的都是独立的future。但有一个很大的例外就是我们使用的异步通道。回顾早些时候我们在异步通道下使用的接收器。异步的`recv`方法会随着时间提供一系列元素。这是一种很常见的编程范式，常常被称为*流*。

我们已经看到过了一系列的元素，即我们在第13章中看到的`Iterator`trait，但异步通道接收器和迭代器有很大的不同。首先就是时间的不同：迭代器是同步的，而通道接收器是异步的。其次是API的不同。在使用迭代器时，我们会调用同步的`next`方法。而对于`trpl::Receiver`，我们调用的是异步的`recv`方法，但除此之外，它们的API很相似。

这样的相似性并不是巧合。流就是一种异步的迭代。与专门用于接收消息的`trpl::Receiver`不同，通用流API需要具备更广泛的适用性：它只会像`Iterator`一样提供下一个元素，只不过是异步的。实际上，这就是流在Rust中大致的工作方式，我们可以调用`next`来处理流，然后等待输出，代码如下：

```rust
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let iter = values.iter().map(|n| n * 2);
        let mut stream = trpl::stream_from_iter(iter);

        while let Some(value) = stream.next().await {
            println!("The value was: {value}");
        }
```

我们使用一组数字开始，然后将它们转化为一个迭代器，并使用`map`对每一项进行翻倍处理。然后我们使用`trpl::stream_from_iter`函数将迭代器转为一个流。然后我们使用`while let`循环来迭代这些元素。

不幸的是，如果我们运行这段代码，会发现它无法编译。查看输出，报告中指出了没有可用的`next`方法：

```
error[E0599]: no method named `next` found for struct `Iter` in the current scope
 --> src/main.rs:8:40
  |
8 |         while let Some(value) = stream.next().await {
  |                                        ^^^^
  |
  = note: the full type name has been written to '/Users/chris/dev/rust-lang/book/listings/ch17-async-await/listing-17-30/target/debug/deps/async_await-bbd5bb8f6851cb5f.long-type-18426562901668632191.txt'
  = note: consider using `--verbose` to print the full type name to the console
  = help: items from traits can only be used if the trait is in scope
help: the following traits which provide `next` are implemented but not in scope; perhaps you want to import one of them
  |
1 + use futures_util::stream::stream::StreamExt;
  |
1 + use std::iter::Iterator;
  |
1 + use std::str::pattern::Searcher;
  |
1 + use trpl::StreamExt;
  |
help: there is a method `try_next` with a similar name
  |
8 |         while let Some(value) = stream.try_next().await {
  |                                        ~~~~~~~~

For more information about this error, try `rustc --explain E0599`.
```

正如错误信息所建议的，我们需要正确的trait，才能使用`next`方法。截至目前的讨论，你可能以为我们需要`Stream`，但其实*这里*我们需要的trait是`StreamExt`。`Ext`表示“扩展（extension）”：这是Rust社区在扩展trait时的常用名。

你可能会想为什么使用`StreamExt`而不是`Stream`，甚至怀疑是否真的有`Stream`类型存在。简单来说，在整个Rust生态系统里，`Stream`trait是一个很底层的接口，它结合了`Iterator`和`Future`。而`StreamExt`则基于`Stream`提供了很多高层级的API，其中就包括和`Iterator`类似的`next`方法。我们会在之后继续讨论`Stream`和`StreamExt`。现在，我们先继续当前的话题。

我们只需要使用`use`引入`trpl::StreamExt`，代码如下：

```rust
extern crate trpl; // 为了mdbook的测试

use trpl::StreamExt;

fn main() {
    trpl::run(async {
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let iter = values.iter().map(|n| n * 2);
        let mut stream = trpl::stream_from_iter(iter);

        while let Some(value) = stream.next().await {
            println!("The value was: {value}");
        }
    });
}
```

这样，事情就能如我们所愿地运行了！不仅如此，既然引入了`StreamExt`，我们就可以将它用在各种工具方法上，就像迭代器一样。比如，在下面的代码里，我们使用`filter`方法来过滤出一切无法被3和5整除的数字：

```rust
extern crate trpl; // 为了mdbook的测试

use trpl::StreamExt;

fn main() {
    trpl::run(async {
        let values = 1..101;
        let iter = values.filter(|n| n * 2);
        let stream = trpl::stream_from_iter(iter);

        let mut filtered = stream.filter(|value| value % 3 == 0 || value % 5 == 0);

        while let Some(value) = filtered.next().await {
            println!("The value was: {value}");
        }
    });
}
```

当然，这没什么意思。我们直接使用正常的迭代器，不引入任何async代码也可以完成。所以我们来看看其他流比较独特的地方吧。

## 组合流

许多事物可以自然地表示为流：例如队列中逐步可用的项目、从文件系统一次读取一部分以处理超过计算机内存的数据量，或者随着时间推移通过网络传输的数据。因为流就是future，所以我们也可以将它们和其他future一起使用，它们的组合可以变为很有趣的东西。比如，我们可以批量处理事件以避免过多的网络请求，对一系列的长操作设置超时时间，或者将用户事件进行节流，以减少不必要的工作。

我们来写一些消息流，类似WebSocket或者其他实时通信协议。下面的代码里，我们创建了`get_messages`，它会返回`impl Stream<Item = String>`。在它的实现里，我们创建了一个异步通道，检索了前十个英文字母，然后将它们发到了通道了里。

这里我们也使用了一个新的类型：`ReceiverStream`，他会将`rx`接收器从`trpl::channel`转化为一个带有`next`方法的`Stream`。而对于`main`函数，我们就可以使用`while let`来循环打印流内的消息了。

```rust
use trpl::{ReceiverStream, Stream, StreamExt};

fn main() {
    trpl::run(async {
        let mut messages = get_messages();

        while let Some(message) = messages.next().await {
            println!("{message}");
        }
    });
}

fn get_messages() -> impl Stream<Item = String> {
    let (tx, rx) = trpl::channel();

    let messages = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    for message in messages {
        tx.send(format!("Message: '{message}'")).unwrap();
    }

    ReceiverStream::new(rx)
}
```

运行这段代码，我们会看到期望的结果：

```
Message: 'a'
Message: 'b'
Message: 'c'
Message: 'd'
Message: 'e'
Message: 'f'
Message: 'g'
Message: 'h'
Message: 'i'
Message: 'j'
```

以上我们也可以使用常规的`Receiver`API，甚至常规的`Iterator`API来实现。我们来添加一些需要流的特性的功能，比如添加一个超时时间，它会监控流的每一个元素，还会在提交的元素上制造延迟。

下面的代码里，我们使用`timeout`给流设置了超时时间，它来自`StreamExt`trait。然后我们更新了`while let`循环的循环体，因为流现在返回的是`Result`。`Ok`变体表示消息暗示到达了；`Err`变体则表示超时。我们可以使用`match`来匹配结果，在成功的情况下打印消息，在失败的情况下打印超时通知。最后请注意，我们在对消息应用超时后对其进行固定，因为超时辅助函数生成的future需要固定后才能被轮询。

```rust
use std::{pin::pin, time::Duration};
use trpl::{ReceiverStream, Stream, StreamExt};

fn main() {
    trpl::run(async {
        let mut messages = pin!(get_messages().timeout(Duration::from_millis(200)));

        while let Some(result) = messages.next().await {
            match result {
                Ok(message) => println!("{message}"),
                Err(reason) => eprintln!("Problem: {reason:?}"),
            }
        }
    })
}
```

然而，如果消息之间没有延迟，那么这个超时并不会改变程序的行为。我们来添加一个延迟变量。在`get_messages`里，我们使用`messages`数组的`enumerate`迭代方法来获取每一个元素的下标。然后我们根据在下标为偶数的元素里设置100毫秒的延迟，在下标为奇数的元素里设置300毫秒的延迟，来模拟真实场景下的延迟不同的流。由于我们的超时时间是200毫秒，所以这个行为会影响一半的元素。

```rust
fn get_messages() -> impl Stream<Item = String> {
    let (tx, rx) = trpl::channel();

    trpl::spawn_task(async move {
        let messages = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
        for (index, message) in messages.into_iter().enumerate() {
            let time_to_sleep = if index % 2 == 0 { 100 } else { 300 };
            trpl::sleep(Duration::from_millis(time_to_sleep)).await;

            tx.send(format!("Message: '{message}'")).unwrap();
        }
    });

    ReceiverStream::new(rx)
}
```

要在`get_messages`函数内部的消息间隔间制造延迟而不造成阻塞，我们需要使用async。然而，我们不能让`get_messages`本身转变为一个async函数，因为那样我们就需要把`Stream<Item = String>`调整为`Future<Output = Stream<Item = String>>`。而调用者需要await`get_messages`来获取对流的访问。但别忘了：给定future内部的一切都是线性的；并发性存在于future*之间*。对`get_messages`进行await意味着需要在返回流接收器等待所有消息发送完成，包括延迟。结果就是，超时会失去效果。流本身也不存在任何延迟：在流可用前延迟已经全部结束。

所以，我们不改变`get_messages`函数本身的返回值，转而使用独立任务来处理异步的`sleep`调用。

> [!NOTE]
> 这里调用`spawn_task`的方式行得通的原因是因为我们已经设置了我们的运行时。如果*没有*提前设置，那么调用这个特殊实现的`spawn_task`会造成程序崩溃。其他的实现也各有取舍：它们可能开启了一个新的运行时来避免崩溃，但是造成了额外的性能损耗，或者只是压根不提供不引入运行时新建任务的方式。你需要了解你的运行时选择了什么，并开发相应的代码！

现在我们的代码结果有趣多了！在每一对消息之间，我们看到了一个错误`Problem: Elapsed(())`。

```
Message: 'a'
Problem: Elapsed(())
Message: 'b'
Message: 'c'
Problem: Elapsed(())
Message: 'd'
Message: 'e'
Problem: Elapsed(())
Message: 'f'
Message: 'g'
Problem: Elapsed(())
Message: 'h'
Message: 'i'
Problem: Elapsed(())
Message: 'j'
```

超时并不会阻止消息到达————我们仍然能拿到所有的原消息。这是因为我们的通道是无界的：只要内存允许，它可以持有任意数量的消息。如果消息没有在超时前到达，我们的流处理就会处理那种情况，但如果它再次拉流，那么消息可能还是会到达的。

你现在应该明白不同通道，或者说流之间的行为差异了。我们来再看最后一个例子，集合流和时间间隔。

## 合并流

首先，我们来再创建一个流，如果直接运行它，那么它会每毫秒提交一个元素。为了简单，我们可以使用`sleep`函数来模拟延迟，并将其和`get_messages`中的通道创建流的方式结合起来。不同的是，这一次我们会发送已过去的间隔计数，所以返回值会改为`impl Stream<Item = u32>`，函数命也修改为`get_intervals`。

在下面的代码里，我们先在任务内定义了`count`。（我们不能在任务外定义，因为很明显这里需要限制给定变量的作用域。）然后我们创建一个无限循环。每一次循环都会异步地延迟一毫秒，然后增加计数，然后发送给通道。由于这些都被`spawn_task`所包裹，所以它们都会被运行时清理干净，包括无限循环。

```rust
fn get_intervals() -> impl Stream<Item = u32> {
    let (tx, rx) = trpl::channel();

    trpl::spawn_task(async move {
        let mut count = 0;
        loop {
            trpl::sleep(Duration::from_millis(1)).await;
            count += 1;
            tx.send(count).unwrap();
        }
    });

    ReceiverStream::new(rx)
}
```

这类型的无限循环只会在整个运行时停止时结束，但它们在Rust异步编程中很常见：需要程序都需要无限运行。对于async来说，只要循环体内存在await点，它就不会阻塞任何东西。

回到我们的main函数，我们可以尝试调用`get_intervals`。然后我们使用`merge`方法合并`messages`和`intervals`。最终，我们迭代合并后的流，而不是`messages`，代码如下：

```rust
        let messages = get_messages().timeout(Duration::from_millis(200));
        let intervals = get_intervals();
        let merged = messages.merge(intervals);
```

目前，`messages`和`intervals`都不需要被固定或调整为可变，因为他们都被合并到了一个`merged`流里。然而，这样的`merge`调用是无法编译的！（也无法再`while let`循环内调用`next`方法，我们等下会修复这一点。）这两个流的类型不同。`messages`流的类型为`Timeout<impl Stream<Item = String>>`，而`Timeout`类型给`Stream`实现了`timeout`方法。而`intervals`流的类型为`impl Stream<Item = u32>`。要合并这两个流，我们需要将它们的类型转为一致。

既然`messages`已经使我们期望的基本格式，且我们必须处理超时问题，我们就转化`intervals`流。首先，我们可以使用`map`辅助函数来将`intervals`转为字符串。然后，我们需要从`messages`匹配`Timeout`。由于我们*不需要*真的等待`intervals`，我们只需要将其超时时间设置的比我们使用的其他时长更长就行了。这里我们设置为`Duration::from_secs(10)`，即10秒钟。最后，我们需要把`stream`设置为可变的，这样`while let`循环才能调用`next`方法来对其进行迭代，且固定它，这样更安全：

```rust
        let messages = get_messages().timeout(Duration::from_millis(200));
        let intervals = get_intervals()
            .map(|count| format!("Interval: {count}"))
            .timeout(Duration::from_secs(10));
        let merged = messages.merge(intervals);
        let mut stream = pin!(merged);
```

这*几乎*就是我们需要做的一切了。通过了一切的类型检查。但如果你运行这段代码，会存在两个问题。首先，它永远不会停止！你需要使用ctrl+c来停止它，英文字母的打印会淹没在茫茫的计数中：

```
--略--
Interval: 38
Interval: 39
Interval: 40
Message: 'a'
Interval: 41
Interval: 42
Interval: 43
--略--
```

下面的代码展示了一种解决这两个问题的办法。首先，我们使用`throttle`来处理`intervals`流，避免它压垮`messages`流。节流是一种限制函数调用数量的方式————或者在这种情况下，也可以说流被拉取的数量。每100毫秒内运行一次就够了，因为这与消息到达的频率大致相当。

要限制我们从流接收元素的数量，我们可以使用`take`方法。我们将它应用到*合并的*流上，因为我们想限制的是最终的输出，而不是某一个流：

```rust
        let messages = get_messages().timeout(Duration::from_millis(200));
        let intervals = get_intervals()
            .map(|count| format!("Interval: {count}"))
            .throttle(Duration::from_millis(100))
            .timeout(Duration::from_secs(10));
        let merged = messages.merge(intervals).take(20);
        let mut stream = pin!(merged);
```

运行程序，它会在获取到20个元素后停止了，且计时器也不会压垮消息了。我们也不会收到`Interval: 100`或`Interval: 200`类似的消息，而是`Interval: 1`，`Interval: 2`等等————即便我们流的源头*可以*每秒提供一个事件。因为`throttle`会创建一个新的流来包裹原始流，这样原始流只会在节流的节奏里被拉取，而不是其“原始的”节奏。我们不在有一堆可以简单忽略的未处理的计时消息了。相反，我们一开始就不会生成这些间隔消息！这再次得益于Rust的“懒惰”特性，它允许我们灵活选择性能表现。

```
Interval #1
Message: 'a'
Interval #2
Interval #3
Problem: Elapsed(())
Interval #4
Message: 'b'
Interval #5
Message: 'c'
Interval #6
Interval #7
Problem: Elapsed(())
Interval #8
Message: 'd'
Interval #9
Message: 'e'
Interval #10
Interval #11
Problem: Elapsed(())
Interval #12
```

还有最后一样东西我们需要处理：错误！对于这些基于通道的流，`send`方法会在通道的另一端关闭的情况下失败————这取决于运行时如何运行这些由流组成的future。之前我们一直使用`unwrap`忽略了这些错误，但在一个好的app里，我们应该显式地处理错误，最少要结束循环来避免发送额外的消息！下面的代码展示了简单的错误处理策略：打印问题，使用`break`结束循环。通常来说，正确处理错误的方法各不相同————只要有一个策略即可。

```rust
fn get_messages() -> impl Stream<Item = String> {
    let (tx, rx) = trpl::channel();

    trpl::spawn_task(async move {
        let messages = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

        for (index, message) in messages.into_iter().enumerate() {
            let time_to_sleep = if index % 2 == 0 { 100 } else { 300 };
            trpl::sleep(Duration::from_millis(time_to_sleep)).await;

            if let Err(send_error) = tx.send(format!("Message: '{message}'") {
                eprintln!("Cannot send message '{message}': {send_error}");
                break;
            }
        }
    });

    ReceiverStream::new(rx)
}

fn get_intervals() -> impl Stream<Item = u32> {
    let (tx, rx) = trpl::channel();

    trpl::spawn_task(async move {
        let mut count = 0;
        loop {
            trpl::sleep(Duration::from_millis(1)).await;
            count += 1;

            if let Err(send_error) = tx.send(count) {
                eprintln!("Could not set interval '{count}': {send_error}");
                break;
            }
        }
    });

    ReceiverStream::new(rx)
}
```

这是一个很好的契机转向我们的最后一节，并通过讨论futures（包括流）、任务和线程之间的关系，以及如何将它们结合使用来总结对异步Rust的知识。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`Stream`trait就是Rust迭代器的异步版本。

</template>
<template #quiz>

`Stream`trait和Rust标准库中的哪个非async trait最相似？

<Radio>
<Option label="Write" />
<Option label="Iterator" answer />
<Option label="Index" />
<Option label="Sync" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：合并流只会让元素交错，而不会让“B”出现在“C”后面。

</template>
<template #quiz>

假设现有一个流提供序列消息`["A", "B", "C"]`，另一个流提供序列消息`["D", "E", "F"]`，你不知道每个流发送字符的时机，只知道其顺序。假设合并这两个流，打印其中的消息。选择其消息可能的打印顺序：

<Checkbox>
<Option label="DEFABC" answer />
<Option label="ABDEFC" answer />
<Option label="ACBDEF" />
<Option label="CFBEAD" />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
