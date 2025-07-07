# 将单线程服务器转换为多线程服务器

现在，服务器会轮流处理每个请求，也就是说只要前一个连接还没有处理完成，它就不会处理另一个连接。如果服务器接收到了越来越多的请求，这种串行执行的效果就会越来越欠佳。如果服务器的某一次请求处理花费了大量的时间，随后的请求就需要等待大量的时间，即便新的请求可能只需要很短的时间就可以处理完成。我们需要改善这种情况，但是首先我们需要亲眼看看这个问题。

## 在当前的服务器实现中模拟一个慢请求

我们来看看在我们的服务器实现中，一个慢速的请求是如何影响其他请求的。下面的代码实现会在处理 */sleep* 时模拟一个非常慢的响应，它会导致整个服务在响应前等待五秒钟：

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};
// 略

fn handle_connection(mut stream: TcpStream) {
    // 略

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    // 略
}
```

由于我们需要分三种情况讨论，所以我们从`if`转倒了`switch`。我们需要明确地将`request_line`和字符串字面量进行模式匹配；`match`并不会像等号方法那样自动地引用和解引用。

第一个分支和之前代码的`if`代码块一样。第二个分支则匹配了 */sleep* 请求。在收到这个请求时，服务端会在返回成功的HTML页前等待五秒钟。第三个分支和之前的`else`代码块的作用相同。

不难看出我们的服务有多原始：真实的库会提供更简洁的方式来处理各个请求！

使用`cargo run`运行代码。然后开启两个浏览器窗口：一个*http://127.0.0.1:7878/*和另一个*http://127.0.0.1:7878/sleep*。如果你刷新 */* URI多次，你会发现它的响应速度很快，和之前一样。但如果你输入 */sleep* 然后加载 */* ，你会发现 */* 会在`sleep`持续五秒后才能加载出来。

有很多技术都可以避免请求被慢请求阻塞，包括第17章介绍过的async；但我们这里使用的是线程池。

## 使用线程池提高吞吐量

*线程池*就是一组预分配的线程，它们等待着，随时准备处理任务。当一个程序收到了一个新的任务，它会将任务分配给线程池中的一个线程，那个线程会处理这个任务。其余的线程仍然可以在头个线程处理时处理其他任务。当第一个线程完成处理后，它会返回空闲的线程池，等待新任务。线程池可以让你并发地处理连接，进而提高服务的吞吐量。

我们会将线程池的线程数量限制到一个比较小的数字，保护服务器不受Dos攻击；假设我们对每一个请求都创建一个新的请求，那么如果有人对我们的服务器发出了一千万个请求，就会造成一场浩劫，服务器的资源会被消耗殆尽，请求的处理也会被阻塞。

所以这里我们不会创建无穷无尽的线程，反之，我们会创建固定数量的线程池。线程池会维护一个队列来管理请求。每一个池中线程都会从这个队列中弹出请求，处理这个请求，然后再次向队列请求弹出新的请求。这样的设计下，我们可以并发地处理*N*个请求，*N*就是线程数量。如果线程池中的每一个线程都在处理长请求，那么新来的请求仍有可能被阻塞在队列里，但我们提高了服务器可以处理的长请求数量。

这种技术只是提高网络服务器吞吐量的众多方法之一。你也可以探索其他方法，比如分叉/合并模型，单线程异步I/O模型，以及多线程异步I/O模型。如果你对这些内容感兴趣，你可以阅读关于其他方法的资料，尝试实现它们；在像Rust这样的低层级语言中，所有的方式都是可行的。

在我们开始实现线程池前，我们来聊聊使用池子看起来是什么样子的。当你尝试代码设计时，写一个客户端接口对指导你的设计来说会十分有帮助。编写代码的API，使其结构方式跟你想调用的方式一致；然后按照那个结构进行实现，而不是先实现功能，再设计公共的API。

类似我们在第12章使用测试驱动开发项目一样，这里我们会使用编译驱动的方式。我们会写下我们希望的调用函数的代码，然后跟着编译器的报错来决定下一步动作。然而，在我们完全前，我们需要先探索需要使用的技术作为开始。

### 为每个请求创建线程

首先，我们来想想如果我们的代码会为每个连接创建线程，那么它看起来可能会是什么样子。前面提到过，这不是我们的最终计划，因为这样可能会产生无穷多的线程，但这是一个多线程服务的起点。然后我们会添加线程池来提升，这样对比这两种策略也更容易。下面的代码展示了对`main`函数的修改，在`for`循环里为每一个流的处理创建一个新的线程：

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        thread::spawn(|| {
            handle_connection(stream);
        });
    }
}
```

就像你在第16章中学过的那样，`thread::spawn`会创建一个新的线程，然后运行传入新线程的闭包内的代码。如果你运行这段代码，然后在浏览器里加载 */sleep* ，然后在其他两个浏览器页签里加载 */* ，你就会发现对 */* 的请求并不会等待 */sleep* 的请求完成。然而，就像我们提到的一样，无限制地创建新线程最终会导致系统过载。

你可能会想到第17章节的内容，感觉这里使用async和await正合适！你可以保留这个想法，在我们构建线程池时，你可以想想如果使用async，那么代码看起来会是什么样子。

### 创建限量的线程

我们希望线程池的工作方式和线程类似，这样从线程切换到线程池就不会引起使用我们代码的人有大的改动。下面的代码展示了一个虚构的接口`ThreadPool`结构体，我们用它替代了`thread::spawn`：

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}
```

我们使用了`ThreadPool::new`来创建一个新的线程池，传入的参数表示线程的数量，在这个例子里是四。然后，在`for`循环里，`pool.execute`的接口和`thread::spawn`类似，它会接受一个闭包，线程池会运行它来处理每个流。我们需要实现`pool.execute`，以便其能够将闭包交给一个线程池里的线程来执行。这段代码当然是无法编译的，但我们会尝试编译一下，让编译器告诉我们如何修复。

### 使用编译驱动构建`ThreadPool`

带着前面对*src/main.rs*的改动，我们可以使用编译器的`cargo check`命令，根据其编译错误驱动我们的开发。下面是我们看到的第一个错误：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0433]: failed to resolve: use of undeclared type `ThreadPool`
  --> src/main.rs:11:16
   |
11 |     let pool = ThreadPool::new(4);
   |                ^^^^^^^^^^ use of undeclared type `ThreadPool`

For more information about this error, try `rustc --explain E0433`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

太好了！这个错误告诉我们，我们需要`ThreadPool`类型或者模块，所以我们来创建它。我们的`ThreadPool`实现的功能独立于我们的网络服务器。所以我们把`hello`crate从一个二进制crate调整为一个库crate来放置我们的`ThreadPool`实现。在我们改变为库crate之后，我们的线程池就可以独立使用了，而不是仅仅为了网络服务器。

创建*src/lib.rs*文件，其内容如下，就是一个最简单的`ThreadPool`结构体的定义：

```rust
pub struct ThreadPool;
```

然后编辑*main.rs*文件，通过在*src/main.rs*的文件顶部添加如下代码，将`ThreadPool`从库crate引入到作用域内：

```rust
use hello::ThreadPool;
```

代码仍然是无法工作的，但我们可以检查一下，以便我们定位到下一个错误：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0599]: no function or associated item named `new` found for struct `ThreadPool` in the current scope
  --> src/main.rs:12:28
   |
12 |     let pool = ThreadPool::new(4);
   |                            ^^^ function or associated item not found in `ThreadPool`

For more information about this error, try `rustc --explain E0599`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

这段错误告诉我们下一个需要添加的是为`ThreadPool`引入一个名为`new`的关联方法。我们也知道了`new`的参数需要可以接收`4`，且其应该返回一个`ThreadPool`实例。我们来实现一个最简单的符合要求的`new`方法：

```rust
pub struct ThreadPool;

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        ThreadPool
    }
}
```

我们选择了`usize`作为`size`参数的类型，因为我们知道负数对于线程数量来说是没有任何意义的。我们也知道`4`就是线程集合的元素数量，这正是`usize`类型的作用，正如我们在第三章讨论的那样。

我们来再次检查代码：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0599]: no method named `execute` found for struct `ThreadPool` in the current scope
  --> src/main.rs:17:14
   |
17 |         pool.execute(|| {
   |         -----^^^^^^^ method not found in `ThreadPool`

For more information about this error, try `rustc --explain E0599`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

现在的错误是因为我们的`ThreadPool`没有`execute`方法。回顾之前的内容，我们知道这个方法的前面应该类似`thread::spawn`。此外，我们还需要让`execute`方法将其闭包分配给线程池中空闲的线程来执行。

我们来给`ThreadPool`定义一个可以接收闭包作为参数的`execute`方法。回顾第13章的内容，我们知道闭包有三种不同的trait：`Fn`、`FnMut`和`FnOnce`。我们需要决定这里使用的是哪一种闭包。我们已经知道，我们的函数最终的执行效果和标准库的`thread::spawn`类似，所以我们可以看看它的签名赋予了怎样的边界。其文档如下：

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

`F`类型参数就是我们关注的重点；而`T`类型参数则和返回值有关，这里我们无需关注。我们可以看到`spawn`方法使用了`FnOnce`作为`F`的trait边界。这可能就是我们想要的，因为我们最终会将`execute`方法的参数传递给`spawn`。想想我们的需求就可以更加确定了`FnOnce`就是我们想要的trait，因为处理请求的线程只会处理那个请求的闭包一次，这和`FnOnce`的`Once`一致。

`F`类型参数还有一个trait边界，就是`Send`和生命周期边界`'static`，这对于我们的情况来说也是有用的：我们需要`Send`来将闭包在线程间传递，而`'static`则是因为我们不知道线程需要等待多久才能执行。我们来创建`ThreadPool`的`execute`方法，它会接收一个泛型类型参数`F`，其边界正如上述描述的那样：

```rust
impl ThreadPool {
    // 略
    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}
```

我们仍然需要在`FnOnce`后面添加`()`，因为这个`FnOnce`代表了一个不接收任何参数，返回元组类型`()`的闭包。就像函数定义一样，返回类型可以从签名中省略，但即便我们没有任何参数，我们仍然需要写一对括号。

再次强调，这是`execute`最简单的实现：它什么都没做，我们只是在让代码通过编译而已。我们来再次检查一下：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.24s
```

编译通过了！但是注意，如果你使用`cargo run`，然后在浏览器里创建请求，你会看到和本章开头一样的错误。因为我们的库还没有调用传入`execute`的闭包！

> [!NOTE]
> 你可能听说过一些有关含严格编译器语言的传闻，比如Haskell和Rust，“如果编译通过了，那么程序就可以正常工作”。这个说法其实并不完全正确，比如这里我们的程序也通过了，但它显然什么都没有做！如果我们在开发一个真实、完整的项目，那么现在就是我们开始书写检查程序编译和功能的单元测试的绝佳时机。

思考一个问题：如果我们执行一个*future*而不是一个闭包会有什么不同？

### 在`new`里校验线程数

我们还没有对`new`和`execute`的参数做任何事。我们来简单实现下这些函数的函数体。首先，我们来开发`new`。早先时候我们选择了一个无符号的类型作为`size`参数的类型，因为一个线程池的数量显然不会是负数。然而，一个空的线程池其实也是没有意义的，即便0也是合法的`usize`。我们需要在返回`ThreadPool`实例前添加有关`size`大于0的检查，借助`assert!`宏的功能，如果收到了0，那么我们就让程序panic：

```rust
impl ThreadPool {
    /// 创建一个新的线程池
    ///
    /// size参数标识线程池的线程数量
    ///
    /// # Panics
    ///
    /// `new`函数会在 size 为0时候panic
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        ThreadPool
    }

    // 略
}
```

我们还给`ThreadPool`添加了一些文档。注意这里我们沿用了文档的最佳实践，即单独添加了一个小节来描述什么情况下我们的函数会panic，正如我们在第14章讨论的那样。你可以尝试运行`cargo doc --open`，并点击`ThreadPool`结构体来看看`new`的文档是什么样的！

除了像我们这里做的一样使用`assert!`宏，我们也可以修改`new`为`build`，然后返回一个`Result`，就像我们在第12章的I/O项目中开发的`Config::build`那样。但在这里我们将创建没有任何线程的线程池视为一种无法恢复的错误。如果你感兴趣，可以尝试开发`build`函数，其签名如下，并将它和`new`进行比较：

```rust
pub fn build(size: usize) -> Result<ThreadPool, PoolCreationError> {
```

### 创建存储线程的空间

现在我们已经有办法确定线程池存储的数量是一个合法数字了，我们可以创建这些线程，然后将它们存储在`ThreadPool`结构体内并返回了。但是我们如何“存储”一个线程呢？我们来再看看`thread::spawn`的签名：

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

`spawn`函数返回了`JoinHandle<T>`，其中`T`就是闭包的返回类型。我们这里也可以使用`JoinHandle`来试试看。在我们的项目里，我们传入的闭包会处理连接，没有返回任何东西，所以`T`就是元类型`()`。

下面的代码可以通过正常编译，但其没有创建任何线程。我们修改了`ThreadPool`的定义，使其保存了`thread::JoinHandle<()>`的实例集合，初始化的集合容量即`size`，我们之后会在`for`循环内创建线程，最终返回包含它们的`ThreadPool`实例。

```rust
use std::thread;

pub struct ThreadPool {
    threads: Vec<thread::JoinHandle<()>>,
}

impl ThreadPool {
    // 略
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut threads = Vec::with_capacity(size);

        for _ in 0..size {
            // 创建一些线程，将它们存入集合
        }

        ThreadPool { threads }
    }
}
```

我们给我们的库crate引入了`std::thread`，因为我们使用了`thread::JoinHandle`作为`ThreadPool`存储集合的元素类型。

在收到合法的大小参数后，我们的`ThreadPool`会创建一个新的集合，存储`size`个元素。`with_capacity`函数的作用和`Vec::new`一样，但有一个很重要的不同点：它会为集合预分配空间。因为我们已经知道要存储`size`个元素在集合里，这样的预分配会比`Vec::new`稍微高效一点，后者会在元素被插入时调整自身的大小。

再次运行`cargo check`，它应该会成功。

### 负责从`ThreadPool`发送代码到线程的`Worker`结构体

我们在`for`循环里遗留了一个关于创建线程的注释。这里，我们来看看如何实现它。标准库提供了`thread::spawn`方法来创建线程，但`thread::spawn`旨在线程被创建时立刻执行其获取的代码。然而，我们的诉求是创建线程，让它们*等待*一些我们后续会发送的代码。标准库关于线程的实现里没有提供这样的功能；所以我们必须手动实现。

我们会实现这个功能，通过一个新的数据结构来在`ThreadPool`和线程之间管理这种新的行为。这个数据结构称为*Worker*，这也是一个线程池实现里的标准术语。`Worker`会获取需要执行的代码，然后在其线程中执行。

你可以想象在餐厅工作的人：他们会等待客户提交新的订单，然后负责处理和完成这些订单。

为此，我们不再在线程池里存储`JoinHandle<()>`的实例集合，而是存储`Worker`结构体的实例集合。每一个`Worker`会存储一个`JoinHandle<()>`实例。然后我们会在`Worker`上实现一个方法，它会接收待运行的闭包代码，并将其发送到已经在运行的线程内运行。我们还会给每个`Worker`添加一个`id`，这样我们在打印调试时就可以区分池内的不同`Worker`实例了。

这里在我们创建`ThreadPool`时需要有一个新的步骤。我们会实现发送闭包到线程的代码，但要先让`Worker`按照如下步骤准备好：

1. 定义一个`Worker`结构体，存储一个`id`和一个`JoinHandle<()>`。
2. 修改`ThreadPool`，使其存储`Worker`实例的集合。
3. 定义一个`Worker::new`函数，接收一个数字`id`，返回一个`Worker`实例，这个实例会存储`id`以及一个包含空闭包的线程。
4. 在`ThreadPool::new`里，使用`for`循环来生成`id`，然后使用这个`id`来创建新的`Worker`，并将其存储在集合里。

如果你想要一些挑战，可以在继续阅读前自己尝试实现这些代码。

准备好了吗，下面就是一种实现前面提到的变化的方式：

```rust
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
}

impl ThreadPool {
    // 略
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers }
    }
    // 略
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize) -> Worker {
        let thread = thread::spawn(|| {});

        Worker { id, thread }
    }
}
```

我们把`ThreadPool`的字段从`threads`改为了`workers`，因为它存储的内容从`JoinHandle<()>`实例变成了`Worker`。我们还将游标传入了每个`Worker::new`，最终我们将每个`Worker`存储在了名为`workers`的集合里。

外部的代码（比如*src/main.rs*里的服务器）没必要知道我们在`ThreadPool`里使用了`Worker`结构体，所以我们这里的`Worker`结构体和其`new`函数都是私有的。`Worker::new`函数使用了我们传入的`id`，还存储了一个`JoinHandle<()>`实例，它来自使用空闭包创建分配的新线程。

> [!NOTE]
> 如果操作系统由于系统资源的问题没办法创建新的线程，那么`thread::spawn`会导致程序崩溃。这也会导致我们的整个程序崩溃，即便其他的线程可能是创建成功的。在简单的情况下，我们的实现是可行的，但在生产级别的线程池实现里，你应该使用`std::thread::Builder`及其`spawn`方法，它会返回一个`Result`。

这段代码会编译通过，然后存储我们传入`ThreadPool::new`数量的`Worker`实例。但我们*仍然*无法处理我们传入`execute`的闭包。我们来实现这个功能。

### 通过通道给线程发送请求

接下来我们要处理的问题是，目前我们传递给`thread::spawn`的闭包什么都没做。现在，我们可以通过`execute`方法获得我们想要执行的闭包。但是我们需要在创建`ThreadPool`的每个`Worker`时给予可供`thread::spawn`执行的闭包。

我们希望我们刚刚创建的`Worker`结构体从`ThreadPool`的队列中获取代码，并放入其线程中执行。

我们在第16章学过的通道————一种简单的线程间通信方式————在这里非常合适。我们可以使用函数通道作为作业队列，`execute`方法会从`ThreadPool`给`Worker`实例发送作业，后者会将作业发送给线程。下面是大致的计划：

1. `ThreadPool`会创建通道，并持有发送端。
2. 每个`Worker`都会持有接收端。
3. 我们会创建一个新的`Job`结构体，它会持有我们希望发送进通道的闭包。
4. `execute`方法会通过发送端发送其希望运行的作业。
5. 在内部线程中，`Worker`会循环其接收端，执行其收到的任何闭包作业。

我们先在`ThreadPool::new`中创建一个通道，并在`ThreadPool`实例中存储其发送端，代码如下。`Job`结构体现在还什么都没有存储，但它会作为我们发送到通道里的元素类型：

```rust
use std::{sync::mpsc, thread};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

struct Job;

impl ThreadPool {
    // 略
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers, sender }
    }
    // 略
}
```

在`ThreadPool::new`里，我们创建了我们的新通道，并让池子持有了其发送端。这段代码是可以编译的。

我们来尝试在线程池创建通道后将通道的接收端发送给每个`Worker`。我们已经知道了我们想要在`Worker`实例开启的线程里使用接收端，所以我们将`receiver`的引用作为了闭包的参数。代码如下，但暂时还无法编译：

```rust
impl ThreadPool {
    // 略
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, receiver));
        }

        ThreadPool { workers, sender }
    }
    // 略
}

// 略

impl Worker {
    fn new(id: usize, receiver: mpsc::Receiver<Job>) -> Worker {
        let thread = thread::spawn(|| {
            receiver;
        });

        Worker { id, thread }
    }
}
```

我们做了一些很小、很直白的改动：我们将接收端传入了`Worker::new`，然后在闭包里使用了它。

检查代码，会看到如下错误：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0382]: use of moved value: `receiver`
  --> src/lib.rs:26:42
   |
21 |         let (sender, receiver) = mpsc::channel();
   |                      -------- move occurs because `receiver` has type `std::sync::mpsc::Receiver<Job>`, which does not implement the `Copy` trait
...
25 |         for id in 0..size {
   |         ----------------- inside of this loop
26 |             workers.push(Worker::new(id, receiver));
   |                                          ^^^^^^^^ value moved here, in previous iteration of loop
   |
note: consider changing this parameter type in method `new` to borrow instead if owning the value isn't necessary
  --> src/lib.rs:47:33
   |
47 |     fn new(id: usize, receiver: mpsc::Receiver<Job>) -> Worker {
   |        --- in this method       ^^^^^^^^^^^^^^^^^^^ this parameter takes ownership of the value
help: consider moving the expression out of the loop so it is only moved once
   |
25 ~         let mut value = Worker::new(id, receiver);
26 ~         for id in 0..size {
27 ~             workers.push(value);
   |

For more information about this error, try `rustc --explain E0382`.
error: could not compile `hello` (lib) due to 1 previous error
```

我们的代码尝试将`receiver`传递给多个`Worker`实例。这是行不通的，回顾第16章学到的内容：Rust提供的通道实现是多*生产者*，单*消费者*。也就是说我们不能仅仅通过克隆消费端来修复这段代码。我们也不希望将一份信息多次发送给多个消费端；我们希望一系列的消息可以发送给多个`Worker`实例，且每个消息只被处理一次。

此外，从通道的队列里取出一个任务也涉及对`receiver`的修改，所以线程间需要一个安全的方式来分享和调整`receiver`；否则，我们可能会遇到竞态问题（第16章介绍过）。

回顾我们在第16章介绍的线程安全的智能指针：为了在多个线程间分享某个值的所有权，且允许线程修改这个值，我们需要使用`Arc<Mutex<T>>`。`Arc`类型可以允许多个`Worker`实例拥有接收端，而`Mutex`则保证了同时只有一个`Worker`在通过接收端获取任务。下面的代码展示了我们所做的调整：

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};
// 略

impl ThreadPool {
    // 略
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    // 略
}

// 略
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        // 略
    }
}
```

在`ThreadPool::new`里，我们将接收端包裹在了`Arc`和`Mutex`里。对于每一个新的`Worker`，我们克隆了`Arc`来增加引用计数，这样`Worker`实例就可以共享接收端的所有权了。

有了这些改动，代码可以编译通过了！我们快成功了！

### 实现`execute`方法

最后，我们来实现`ThreadPool`的`execute`方法。这里我们先调整了`Job`，将其从一个结构体改为了一个trait对象的类型别名，这样它就可以存储`execute`收到的闭包了。正如我们在第20章的类型别名学习中提到的，类型别名可以让我们将一个很长的类型简化为一个很简短的别名。代码如下：

```rust
// 略

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    // 略

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.send(job).unwrap();
    }
}

// 略
```

在使用我们在`execute`方法里接收到的闭包创建新的`Job`实例后，我们将那个任务发送到了通道里。这里我们为了避免发送失败，所以在`send`的调用后调用了`unwrap`。这是有可能发生的，比如，如果我们停止了所有线程的执行，那么接收端就不会再接收新的信息了。现在，我们还无法停止线程的执行：也就意味着只要线程池存在，我们的线程就会一直执行。我们使用`unwrap`的原因是我们知道错误不会发生，而编译器是无从得知的。

但我们还没有完成！在`Worker`里，我们传递给`thread::spawn`的闭包仍然只是通道接收端的*引用*。由于我们需要闭包无限执行，不停地询问通道是否有新的任务，且在收到任务后立刻执行。所以我们对`Worker::new`进行如下更改：

```rust
// 略

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let job = receiver.lock().unwrap().recv().unwrap();

                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

这里，我们首先调用了`receiver`的`lock`方法来获取互斥锁，然后我们调用了`unwrap`，以便在发生错误时panic。如果互斥锁本身是一个*中毒（poisoned）*状态（比如其他线程持有了锁，但是没有释放锁就panic了），那么获取锁是有可能失败的。在这种情况下，正确的选择就是调用`unwrap`，让这一整个线程panic。你也可以将`unwrap`改为`expect`来输出一段你觉得有意义的错误信息。

在获取了互斥锁后，我们可以调用`recv`方法从通道获取一个`Job`。最后面的`unwrap`也负责这个过程中可能发生的错误，比如持有发送端的线程停止了，和`send`方法在接收端停止的情况下返回`Err`是类似的情况。

对`recv`的调用阻塞了，所以现在没有任何的任务，当前线程会一直等待到有需要执行的任务。`Mutex<T>`保证了同时只有一个`Worker`线程在请求任务。

我们的线程池已经可用了！运行`cargo run`，并发起一些请求：

```
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
warning: field `workers` is never read
 --> src/lib.rs:7:5
  |
6 | pub struct ThreadPool {
  |            ---------- field in this struct
7 |     workers: Vec<Worker>,
  |     ^^^^^^^
  |
  = note: `#[warn(dead_code)]` on by default

warning: fields `id` and `thread` are never read
  --> src/lib.rs:48:5
   |
47 | struct Worker {
   |        ------ fields in this struct
48 |     id: usize,
   |     ^^
49 |     thread: thread::JoinHandle<()>,
   |     ^^^^^^

warning: `hello` (lib) generated 2 warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.91s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
```

成功了！现在我们有了一个线程池来并发处理连接。程序最多只会创建四个线程，所以我们的系统也不会因为过多的请求而过载。如果我们发起了一个对 */sleep* 的请求，那么服务也可以在处理它的同时处理其他请求。

> [!NOTE]
> 如果你在多个浏览器窗口同时发起了 */sleep* 请求，他们可能会按照五秒的间隔加载。这是因为某些浏览器会为了缓存，针对同一个请求就行多次的请求。所以这个限制与我们的网络服务器无关。

此时是一个很好的时间来停下想一想，如果我们使用future而不是闭包来开发，那么之前的几段代码会有什么不同。哪些类型会被修改？函数的签名又会发生什么变化呢？哪些部分又是不动的呢？

在第17、18章中了解过`while let`后，你可能会好奇我们为什么不把代码写成下面的样子：

```rust
// 略

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            while let Ok(job) = receiver.lock().unwrap().recv() {
                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

这段代码可以编译运行，但它并不会像我们期待的那样工作：一个慢请求仍然会导致其他的请求按照处理顺序等待。其中原因比较微妙：`Mutex`结构体没有公开的`unlock`方法，因为锁的所有权是基于`lock`方法返回的`LockResult<MutexGuard<T>>`中的`MutexGuard<T>`的生命周期的。在编译期，借用检查器可以强制被`Mutex`所守护的资源只能在获取到锁的情况下被访问。然而，它的实现仍然可能导致锁被持有比预期更长的时间，如果我们不注意`MutexGuard<T>`的生命周期。

我们之前的代码使用的`let job = receiver.lock().unwrap().recv().unwrap();`能够成功的原因在于`let`，任何来自等号右侧表达式的临时值都会在`let`声明结束后被立刻销毁。然而，`while let`（`if let`和`match`同理）并不会销毁临时值，直到其关联代码块结束。在上面的代码里，锁在整个`job()`的调用过程中都是持有状态，也就是说其他的`Worker`实例无法获取到任何的任务。
