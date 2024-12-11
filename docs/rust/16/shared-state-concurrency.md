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

# 并发中的状态共享

消息传递对于并发处理来说是一种不错的办法，但它并不是独一无二的。另一种办法是让多线程访问同一份共享数据。再想想Go的文档中提到的：“不要通过共享内存来交流”。

通过共享内存来交流是什么样的呢？以及，为什么消息传递的支持者要警告不要使用共享内存呢？

在某种程度上来说，任何编程语言的通道都和单一所有权类似，因为一旦你将值发送到了通道中，你就不应该再使用它了。而并发的状态共享就好像多所有权：多个线程可以同时访问同一片内存。正如你在第15章中看到的一样，智能指针可以实现多所有权，而多所有权会引入额外的复杂度，因为不同所有者的所有权需要管理。Rust的类型系统和所有权规则就是为了让这个管理更准确。比如，我们来看看互斥体，共享内存最常见的并发原语之一。

## 使用互斥体来保证同一时间只有一个线程会访问数据

*互斥体（Mutex）*是*相互排斥（mutual exclusion）*，互斥保证了任何时间点只有一个线程可以访问数据。要访问互斥体内的数据，一个线程首先必须给出它想要访问互斥体的*锁*的信号。锁是互斥体内的一部分数据结构，它会跟踪谁目前在访问数据。因此，互斥体从设计之初就是为了作为其数据的*护卫*而存在，它内部的锁系统会确保这一点。

互斥体通常很难使用，因为你需要记住下面两条规则：

- 你在使用数据前必须请求锁。
- 在使用完互斥体的数据后，你必须解锁数据，以便其他线程请求锁。

现实世界中也有互斥体的概念，你可以想象一个小组讨论上的共享麦克风。在小组成员发言前，他必须发出想要使用麦克风的信号。当他们拿到麦克风后，他们可以随意发言，然后将麦克风递给下一个想要发言的成员。如果一个成员在使用完成后忘记了传递麦克风，那么其他人就无法继续发言了。如果对共享麦克风的管理不当，那么讨论无法按照预期进行！

### `Mutex<T>`的API

我们来看一个如何使用互斥体的例子，下面是一个在单线程中使用互斥体的例子：

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap();
        *num = 6;
    }

    println!("m = {m:?}");
}
```

就像大部分类型一样，我们使用关联方法`new`创建了`Mutex<T>`。要访问其中的数据，我们需要使用`lock`方法来访问锁。这个调用会阻塞当前线程，它在获得锁之前不会继续进行任何工作。

如果持有锁的线程panic了，那么`lock`的调用会失败。这种情况下，没有任何人能获得锁了，所以我们选择使用`unwrap`，这样在那种情况下当前线程也会panic。

在我们请求到了锁以后，我们可以使用返回值了，这种情况下我们命名为`num`，作为对互斥体内数据的可变引用。类型系统会保证我们在使用`m`前已经获取到了锁。`m`的类型是`Mutex<i32>`，而不是`i32`，所以我们*必须*调用`lock`才能使用`i32`值。我们无法忘记；否则类型系统不会允许我们访问其中的`i32`值。

你可能会怀疑，`Mutex<T>`是一个智能指针。更准确地说，调用`lock`会*返回*一个`MutexGuard`类型的智能指针，它被包裹在`LockResult`中，我们需要调用`unwrap`处理。`MutexGuard`智能指针实现了`Deref`来指向其内部数据；同时也实现了`Drop`来在`MutexGuard`离开作用域时自动释放锁，也就是内部作用域结束的时候。结果就是，我们不会忘记释放锁，进而导致其他线程被阻塞，因为锁的释放是自动发生的。

在释放锁喉，我们可以打印互斥体内的值，看看我们是否能够修改`i32`为6。

### 在多个线程之间共享`Mutex<T>`

现在，我们来试试在多个线程之间共享`Mutex<T>`。我们会创建十个线程，每个线程都会将值进行加1，这样计数器会从0变为10。下面的例子存在编译错误，我们会利用这个错误来学习`Mutex<T>`，以及Rust如何帮助我们修正：

```rust
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = vec![];

    for _ in 0..10 {
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

我们创建了一个`counter`变量来存储`Mutex<T>`的`i32`值，就像之前一样。接着，我们开启了十个线程，并迭代它们来增加数字的值。我们使用了`thread::spawn`并给所有线程赋值了同样的闭包：它会将`counter`移动到线程内，调用`lock`方法请求`Mutex<T>`的锁，然后将其值加1。当一个线程完成其闭包运行后，`num`会离开作用域，锁会自动被释放，以便下一个线程使用。

在主线程中，我们收集了所有的句柄。然后，就像之前一样，我们调用了每个线程的`join`来确保所有的线程都完成了。最终，主线程会请求锁并打印值。

我们已经说过了这个程序是无法编译的。现在我们来看看是为什么!

```
$ cargo run
   Compiling shared-state v0.1.0 (file:///projects/shared-state)
error[E0382]: borrow of moved value: `counter`
  --> src/main.rs:21:29
   |
5  |     let counter = Mutex::new(0);
   |         ------- move occurs because `counter` has type `Mutex<i32>`, which does not implement the `Copy` trait
...
8  |     for _ in 0..10 {
   |     -------------- inside of this loop
9  |         let handle = thread::spawn(move || {
   |                                    ------- value moved into closure here, in previous iteration of loop
...
21 |     println!("Result: {}", *counter.lock().unwrap());
   |                             ^^^^^^^ value borrowed here after move
   |
help: consider moving the expression out of the loop so it is only moved once
   |
8  ~     let mut value = counter.lock();
9  ~     for _ in 0..10 {
10 |         let handle = thread::spawn(move || {
11 ~             let mut num = value.unwrap();
   |

For more information about this error, try `rustc --explain E0382`.
error: could not compile `shared-state` (bin "shared-state") due to 1 previous error
```

错误信息表面了`counter`在循环时被移入了闭包。Rust告诉我们不能将`counter`在多个线程之间移动。我们需要第15章讨论过的多所有权方法修复这个编译问题。

### 多线程下的多所有权

在第15章，我们通过使用智能指针`Rc<T>`创建的引用计数实现了多所有权。这里我们可以使用同样的方式，看看会发生什么。我们将`Mutex<T>`包裹在`Rc<T>`中，并在移入线程之前克隆`Rc<T>`。

```rust
use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Rc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Rc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

我们还是会看到编译错误...且错误是不同的！编译器会输出很多内容：

```
$ cargo run
   Compiling shared-state v0.1.0 (file:///projects/shared-state)
error[E0277]: `Rc<Mutex<i32>>` cannot be sent between threads safely
  --> src/main.rs:11:36
   |
11 |           let handle = thread::spawn(move || {
   |                        ------------- ^------
   |                        |             |
   |  ______________________|_____________within this `{closure@src/main.rs:11:36: 11:43}`
   | |                      |
   | |                      required by a bound introduced by this call
12 | |             let mut num = counter.lock().unwrap();
13 | |
14 | |             *num += 1;
15 | |         });
   | |_________^ `Rc<Mutex<i32>>` cannot be sent between threads safely
   |
   = help: within `{closure@src/main.rs:11:36: 11:43}`, the trait `Send` is not implemented for `Rc<Mutex<i32>>`, which is required by `{closure@src/main.rs:11:36: 11:43}: Send`
note: required because it's used within this closure
  --> src/main.rs:11:36
   |
11 |         let handle = thread::spawn(move || {
   |                                    ^^^^^^^
note: required by a bound in `spawn`
  --> /rustc/eeb90cda1969383f56a2637cbd3037bdf598841c/library/std/src/thread/mod.rs:688:1

For more information about this error, try `rustc --explain E0277`.
error: could not compile `shared-state` (bin "shared-state") due to 1 previous error
```

哇，好啰嗦的错误信息！其中有一个值得关注的重要部分：```Rc<Mutex<T>>` cannot be sent between threads safely``。编译器也解释了原因：``the trait `Send` is not implemented for `Rc<Mutex<T>>```。我们会在下一节讨论`Send`：它是保证我们在线程中使用的类型是并发安全的trait。

不幸的是，`Rc<T>`在线程间共享时并不安全。在`Rc<T>`管理引用计数时，它会在每次`clone`调用时增加引用计数，并在其销毁时候减少计数。但它没有使用任何并发原语来确保对计数的修改不会被另一个线程打断。这可能会导致错误的计数————进而引发错误或内存泄露，或提前销毁我们还在使用的值。我们需要的是一个和`Rc<T>`完全一样的类型，且其需要用线程安全的方式来调整计数。

### 使用`Arc<T>`进行原子引用计数

幸运的是，`Arc<T>`*就是*一个像`Rc<T>`一样的类型，且它在并发场景下也是安全的。*a*表示*atomic（原子）*，表示这是一个*原子引用计数（atomically counted）*类型。原子是另一种并发原语，这里我们不展开讨论：你可以查看标准库有关`std::sync::atomic`的文档来了解更多细节。现在，你只需要知道原子和原始类型类似，但可以在线程之间安全地共享。

你可能会好奇为什么不是所有的原始类型都天生的原子化，以及为什么标准库不默认使用`Arc<T>`。原因在于，线程安全需要付出性能的代码，你应该只在需要的地方进行。如果你只是在单线程内进行各种操作，你可以抛弃原子化的保证，来换取更高的性能表现。

回到我们的例子：`Arc<T>`和`Rc<T>`的API相同，所以我们需要修改`use`的引入，`new`的调用，`clone`的调用。代码如下：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

代码打印如下：

```
10
```

成功了！我们将数字从0增加到了10，虽然并不是十分惊人，但它让我们了解了`Mutex<T>`和线程安全。你可以使用这个代码结构来进行更加复杂的计算，而不是简单的数字增加。使用这种策略，你可以将计算分割到独立的部分里，独立的线程里，然后使用`Mutex<T>`来让各个线程更新结果中其负责的部分。

注意，如果你进行的事简单的数值操作，标准库的`std::sync::atomic`提过了一些比`Mutex<T>`更简单的类型。这些类型可以提供安全、并发的原始类型原子操作。这里我们选择使用`Mutex<T>`只是为了讲解其工作原理。

## `RefCell<T>`/`Rc<T>`和`Mutex<T>`/`Arc<T>`之间的相似性

你可能会注意到`counter`是不可变的，但是我们却拿到了一个对内部值的可变引用；也就是说`Mutex<T>`提供了内部可变性，即`Cell`家族所做的事。就像我们使用`RefCell<T>`来允许修改`Rc<T>`内部的值一样，我们也使用`Mutex<T>`来修改`Arc<T>`中的值。

另一个值得注意的细节是，Rust无法避免使用`Mutex<T>`过程中的逻辑错误。回顾第15章中使用`Rc<T>`带来的循环应用风险，即两个`Rc<T>`互相引用，导致内存泄露。类似的，`Mutex<T>`也会创建类似的风险，即*死锁（deadlocks）*。你可以想象一个操作需要请求两个引用的锁，而两个线程分别请求了其中的一个锁，导致它们无限地彼此等待。如果你对死锁感兴趣，你可以尝试创造一个这样的Rust程序；然后研究其他语言中互斥锁的实现原理，并尝试在Rust中实现它们。标准库关于`Mutex<T>`和`MutexGuard`的文档可以提供帮助。

在这一章的结尾，我们会讨论`Send`和`Sync`trait，以及如何为自定义类型实现它们。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`Mutex<T>`保证了互斥体的数据只有在锁定状态下才能被访问，反过来，互斥体的锁也会在数据访问结束时被释放。

</template>
<template #quiz>

在一些并发的API中，互斥体和其存储的数据会被分开。比如，假设现在有一个互斥体的API如下：

```rust
let mut data = Vec::new();
let mx: Mutex = Mutex::new();
{
    let _guard = mx.lock();
    data.push(0);
}
```

以下哪一点对Rust设计为了`Mutex<T>`而不是`Mutex`描述地最准确？

<RadioHolder>
<Radio label="避免在没有锁定互斥体的情况下访问互斥体保护的数据" answer />
<Radio label="提高并发程序的执行效率" />
<Radio label="避免互斥体保护的数据在线程间移动" />
<Radio label="减少需要调用的互斥体方法数" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：如果数据包含引用，那么`Arc`也是不安全的，因为引用（理论上来说）可能会在所有线程完成对`Arc`的使用前被无效化。

</template>
<template #quiz>
<IcCompileText />

```rust
use std::{sync::Arc, thread};

fn main() {
    let s = String::from("Hello world");
    let a = Arc::new(&s);
    let a2 = Arc::clone(&a);
    let t = thread::spawn(move || a2.len());
    let len = t.join().unwrap();
    println!("{} {}", a, len);
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::
