<script setup>
import Keyboard from '../../components/keyboard/Keyboard.vue'
</script>

# 优雅的终止和清理

通过我们的努力，代码使用线程池实现了对请求的并发处理。我们会看到一些关于`workers`，`id`以及`thread`字段没有被使用的警告，这也提醒了我们目前还没有做任何的清理工作。当我们使用不那么优雅的<Keyboard :value="['ctrl', 'c']"/>来停止主线程，所有的其他线程都会立刻被停止，即使他们手里还有未完成的请求。

下面，我们来实现`Drop`trait，调用线程池中每个线程的`join`方法，这样他们就可以在完成对请求的处理后关闭。然后我们会实现一种告诉线程他们应该停止接收新请求并停止的方式。为了看看这些代码的效果，我们会调整我们的服务，使其在优雅的停止其线程池前只接收两个请求。

在开始前需要注意的一点是：以上种种都不会对处理闭包部分的代码产生影响，所以如果我们使用了async运行时的线程池，那么事情也不会有什么不同。

## 为`ThreadPool`实现`Drop`trait

我们来为我们的线程池实现`Drop`。当线程池被销毁时，我们的线程应该全部加入，以确保他们完成了他们的工作。下面的代码展示了第一个版本的`Drop`实现；这段代码暂时还是无法编译的。

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

首先，我们对线程池的`workers`进行了遍历。我们使用了`&mut`，因为`self`需要是一个可变引用，这样我们才能操作`worker`。对于每一个worker，我们都打印了信息来明确特定的`Worker`实例被关闭了，然后我们调用了`Worker`实例中线程的`join`方法。如果对`join`的调用失败了，我们也使用了`unwrap`让Rust在这种情况下panic，进入一个不优雅的停止。

编译代码，你会看到如下报错：

```
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0507]: cannot move out of `worker.thread` which is behind a mutable reference
  --> src/lib.rs:52:13
   |
52 |             worker.thread.join().unwrap();
   |             ^^^^^^^^^^^^^ ------ `worker.thread` moved due to this method call
   |             |
   |             move occurs because `worker.thread` has type `JoinHandle<()>`, which does not implement the `Copy` trait
   |
note: `JoinHandle::<T>::join` takes ownership of the receiver `self`, which moves `worker.thread`
  --> /rustc/4eb161250e340c8f48f66e2b929ef4a5bed7c181/library/std/src/thread/mod.rs:1876:17

For more information about this error, try `rustc --explain E0507`.
error: could not compile `hello` (lib) due to 1 previous error
```

错误告诉我们无法调用`join`，因为我们只有对每个`worker`的可变借用，而`join`需要参数的所有权。为了解决这个问题，我们需要将线程移出拥有`thread`的`Worker`实例，这样`join`就可以消费这个线程了。我们在第18章处理类似问题的方式就是可选的方法之一。如果`Worker`持有了`Option<thread::JoinHandle<()>>`，那么我们就可以调用`Option`的`take`方法来移出`Some`变体里的值，留下一个`None`变体。换句话说，一个运行中的`Worker`会拥有一个包含`thread`的`Some`，当我们想要清理这个`Worker`时，我们就可以将`Some`替换为`None`，这样`Worker`就没有线程可以运行了。

然而，我们*唯一*需要这个的地方就是销毁`Worker`的场景。作为代价，我们却需要在任何我们想要访问`worker.thread`的地方处理`Option<thread::JoinHandle<()>>`。虽然在Rust里`Option`是很常见的类型，但如果你发现你在包装一些你知道永远是`Option`的东西时，也许你应该找找有什么替代方案了。它们可以让你的代码更干净，更不容易出错。

在本例中，更好的方法是存在的：`Vec::drain`方法。它接收一个范围参数，指定要从`Vec`中移除的元素，并返回这些元素的迭代器。如果传入了`..`范围语法，那么`Vec`的*每个*元素都会被移除。

因此，`ThreadPool`的`drop`实现可以更新为如下：

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

## 向线程发出停止监听任务的信号

随着我们上面的改动，我们的代码可以无任何警告地编译了。然而，坏消息是这段代码还没有包含我们期望的功能。关键在于`Worker`实例中的线程运行闭包的逻辑：现在，我们调用了`join`方法，但是它不会停止任何的线程，因为它们会无限地`loop`寻找任务。如果我们试图使用我们当前给`ThreadPool`实现的`drop`方法销毁线程池，那么主线程会永远阻塞，等待第一个线程完成。

为了修复这个问题，我们需要修改`ThreadPool`的`drop`实现，然后修改`Worker`里的循环。

首先我们将`ThreadPool`的`drop`实现调整为在等待线程完成前显式地销毁`sender`。下面的代码展示了`ThreadPool`显式销毁`sender`的调整。和线程不一样的是，这里我们*确实*需要使用`Option`的`Option::take`方法从`ThreadPool`移出`sender`。

```rust
pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}
// 略
impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        // 略

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&self) {
        drop(self.sender.take());

        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

销毁`sender`会关闭通道，也就意味着不会再有更多信息被发送了。在此之后，所有`Worker`实例的无限循环内对`recv`的调用都会返回错误。所以，我们修改了`Worker`的循环里的代码，来优雅地在这种情况下退出循环，也就意味着线程会在`ThreadPool`的`drop`实现调用`join`时结束。

```rust
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let message = receiver.lock().unwrap().recv();

                match message {
                    Ok(job) => {
                        println!("Worker {id} got a job; executing.");

                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} disconnected; shutting down.");
                        break;
                    }
                }
            }
        });

        Worker { id, thread }
    }
}
```

为了验证这段代码，我们可以将`main`函数调整为在优雅地终止前只接收2个请求，代码如下：

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}
```

在真实情况里，一个网络服务器当然不会在接收了两个请求后就关闭。这段代码只是为了验证我们的优雅退出逻辑以及清理逻辑是生效的。

`take`方法来自`Iterator`trait的定义，它会限制迭代器只迭代前两个元素。`ThreadPool`会在`main`函数结束时被销毁，而`drop`的实现会运行。

使用`cargo run`运行代码，然后发出三个请求。第三个请求应该会报错，然后你可以在你的终端看到如下输出：

```
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.41s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Shutting down.
Shutting down worker 0
Worker 3 got a job; executing.
Worker 1 disconnected; shutting down.
Worker 2 disconnected; shutting down.
Worker 3 disconnected; shutting down.
Worker 0 disconnected; shutting down.
Shutting down worker 1
Shutting down worker 2
Shutting down worker 3
```

你可能会看到不同的`Worker`ID，以及消息的顺序。我们可以通过这些消息看到代码的运作：`Worker`实例0和3获取了前两个请求。服务在接收完第二个第二个连接后停止了接收，而`ThreadPool`的`Drop`实现开始执行了，甚至在`Worker`3开始其任务之前。`sender`的销毁断开了所有的`Worker`实例，告诉它们该停止了。而每一个`Worker`实例都在其断联时打印了信息，然后线程池会调用`join`来等待每一个`Worker`线程完成。

请注意这次运行里一个有趣的小细节：`ThreadPool`销毁了`sender`，在任何`Worker`收到错误前，我们尝试了回收`Worker`0。`Worker`0此时还没有从`recv`中获取到任何错误，所以主线程会阻塞等待`Worker`0完成。同时，`Worker`3收到了一个任务，然后所有的线程收到了错误。在`Worker`0完成时，主线程会等待其他的`Worker`实例完成。此时，它们已经退出了循环停止了。

恭喜！我们的项目已经完成了；我们拥有了一个使用了线程池来实现异步响应的网络服务器。我们也可以优雅地退出服务，同时会清理线程池里的所有线程。

下面是完整代码。

*src/main.rs*：

```rust
use hello::ThreadPool;
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

*src/lib.rs*：

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

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

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        drop(self.sender.take());

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let message = receiver.lock().unwrap().recv();

                match message {
                    Ok(job) => {
                        println!("Worker {id} got a job; executing.");

                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} disconnected; shutting down.");
                        break;
                    }
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

这并不是结束！如果你希望继续对这个项目进行增强，下面是一些方向：

- 为`ThreadPool`及其公共方法添加更多文档。
- 为库功能添加测试。
- 将调用`unwrap`调整为更健壮的错误处理。
- 使用`ThreadPool`来处理除网络请求以外的其他任务。
- 在[crates.io](https://crates.io/)上找一个线程池，基于它实现一个类似的网络服务器。然后对比它和我们实现版本的API和健壮性。

## 总结

我们完成了！你已经完成了本书的阅读！感谢你和我们一起走过了这段Rust之旅。你已经准备好实现你自己的Rust项目，以及帮助其他人完成他们的项目了。别忘了这是一个温暖的社区，有很多Rust爱好者乐意为你在Rust的旅程里遇到的任何挑战提供帮助。
