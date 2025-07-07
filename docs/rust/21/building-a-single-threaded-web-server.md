<script setup>
import Keyboard from '../../components/keyboard/Keyboard.vue'
</script>

# 构建一个单线程Web服务器

我们先从一个单线程的Web服务器入手。在我们开始之前，我们来快速看看创建Web服务器中涉及的协议。这些协议的细节超出了本书的讨论范围，但是一个简短的概述可以提高你需要的信息。

Web服务器涉及的两个主要的协议包括超文本传输协议（*Hypertext Transfer Protocol, HTTP*）和传输控制协议（*Transmission Control Protocol*）。它们都是*请求-响应*类的协议，也就是*客户端*发起请求，*服务端*监听这个请求并给客户端提供响应。请求和响应的内容由协议规定。

TCP是更低层级的协议，它用于描述信息如何从一个服务器传输到另一个服务器，但它不会规定信息的内容。HTTP是基于TCP定义的，它定义了请求和响应的内容。理论上来说HTTP是可以搭配其它协议使用的，但在大部分情况下，HTTP是基于TCP发送信息的。我们会开发TCP和HTTP响应和请求的原始字节。

## 监听TCP连接

我们的Web服务器需要监听TCP连接，这也是我们需要开发的第一部分。标准库提供了`std::net`来帮助我们。我们来创建一个新项目：

```bash
$cargo new hello
    Created binary (application) `hello` project
$cd hello
```

接着我们进入*src/main.rs*来开始。这段代码会监听本地地址`127.0.0.1:7878`上的传入TCP流。当有传入流时，它会打印`Connection established!`：

```rust
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        println!("Connection established!");
    }
}
```

通过使用`TcpListener`，我们可以监听`127.0.0.1:7878`这个地址的TCP连接。在这个地址里，冒号前面的部分是IP地址，表示你的电脑（这个地址在每台电脑上都一样，并不特指笔者的电脑），而`7878`则是端口。我们选择这个端口的原因有两个：HTTP通常不会使用这个端口，所以我们的应用不会和其他应用冲突，且7878是*rust*在电话上被打出来的号码。

在这个场景下，`bind`函数的作用类似`new`函数，但它不会返回一个新的`TcpListener`实例。函数被称为`bind`的原因是，在网络里，监听一个端口的连接也被称为“绑定端口”。

`bind`函数会返回一个`Result<T, E>`，也就表示这个行为有可能失败。比如，连接80端口号需要管理员权限（非管理员只能监听更高的端口，比如1023），所以如果我们在非管理员状态下尝试连接80端口，绑定就不会成功。还有其他不成功的情况，比如，如果我们运行了程序的两个实例，它们就会监听相同的端口。由于我们是出于学习的目的开发一个基础的服务，我们无需担心那些错误；反之，我们使用了`unwrap`使程序在发生错时直接停止。

`TcpListener`上的`incoming`函数会返回一个迭代器，它提高了流序列（更具体来说的话，就是`TcpStream`类型的流）。一个简单的*流*表示一个客户端和服务端之间活跃的连接。一个*连接*就是完整的请求和响应过程的名字，包括客户端连接服务端，服务端生成响应，服务端关闭连接。因此，我们会读取`TcpStream`来查看客户端发送的内容，然后将响应写入流，并将请求发送给客户端。总的来说，`for`循环会按顺序处理每个连接，并产生一系列供我们处理的流。

现在，我们对流的处理包括了调用`unwrap`来在流发生任何错误时中断程序；如果没有任何错误，那么程序会打印一段信息。我们稍后会添加成功监听后的更多功能。我们之所以可能在客户端连接到服务器时从`incoming`方法中收到错误，是因为我们实际上并没有真正对连接进行迭代。我们实际上迭代的是*对连接的尝试*。连接在一些情况下可能会不成功，且很多是系统特定的。比如，许多操作系统对于模拟活跃连接的数量有所限制；如果数量已经达到了上限，那么新的连接尝试就会失败，直到一些活跃连接被关闭。

我们来尝试运行代码！在命令行中调用`cargo run`，然后在浏览器中加载*127.0.0.1:7878*。浏览器会显示一个类似“连接重置”之类的错误信息，因为目前的服务没有返回任何的信息。但是查看命令行，你会看到一些信息被打印了出来，就在浏览器连接到服务的时候!

```
    Running `target/debug/hello`
Connection established!
Connection established!
Connection established!
```

你可能会看到一次浏览器请求产生了多个信息打印；这可能是因为浏览器在请求网页的同时也在请求其他资源，比如*favicon.ico*图标，用于显示在浏览器标签栏里。

也有可能是浏览器发现服务没有响应数据后尝试了多次访问。当`stream`离开作用域，在循环结束时被销毁时，连接会关闭，这是`drop`方法实现的一部分。有时浏览器处理关闭连接的方式就是重试，因为问题可能是暂时性的。

有时浏览器也会开启多个连接，但不发送任何请求，以便加快后续*发送*请求的速度。在这种情况下，我们的服务会看到多个连接，无论连接上是否包含请求。很多基于Chrome的浏览器会有这种行为：你可以使用隐私浏览模式或者使用其他浏览器来禁用这种行为。

重点在于，我们成功了获取了TCP连接的句柄！

别忘了在你完成了这一部分代码的运行后，可以通过<Keyboard :value="['ctrl', 'c']"/>来停止服务。然后在每次代码更改后运行`cargo run`，以确保运行的是最新的代码。

## 读取请求

我们来实现读取浏览器请求的功能！为了将获取连接和对连接采取行动的部分分开，我们创建了一个新的函数来处理连接。在`handle_connection`函数中，我们会读取TCP流的内容，并将其打印出来，这样我们就可以看看浏览器发送来了什么样的数据。代码如下：

```rust
use std::{
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    println!("Request: {http_request:#?}");
}
```

我们引入了`std::io::prelude`和`std::io::BufReader`来帮助我们进行对流的读写操作。在`main`函数的`for`循环里，我们不再打印信息来标记连接创建，而是调用了新的`handle_connection`方法，并将`stream`传递给了它。

在`handle_connection`函数中，我们创建了一个新的`BufReader`实例作为对`stream`引用的包裹。`BufReader`会通过管理`std::io::Read`trait的方法来添加一些缓冲。

我们创建了一个名为`http_request`的变量来收集浏览器发送请求的内容。这里我们添加了`Vec<_>`，表示我们希望将内容按行收集到vector里。

`BufReader`实现了`std::io::BufRead`trait，它提供了`lines`方法。`lines`方法通过分割流的内容为一行行数据返回一个`Result<String, std::io::Error>`的迭代器。为了获取到每个`String`，我们使用了map方法，并`unwrap`了每个`Result`。如果数据不是合法UTF-8，或者读取流的过程出现了问题，那么这个`Result`就会失败。再次提醒，一个生产级的应用需要更优雅地处理这些错误，我们这里为了简单，选择在错误发生时停止程序。

浏览器会使用两个换行符来表示整个HTTP请求的结束，所以为了从流中获取一个完整请求，我们需要不停地获取行，直到获取到的行是一个空字符串。在我们将这些内容收集到vector里后，我们用调试模式可以打印一下它们，这样我们可以看一看浏览器发送的内容。

我们来运行一下代码！启动程序并再次用浏览器发送请求。注意在浏览器里我们还是会看到错误页，但我们的程序会在命令行打印类似如下内容：

```
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished dev [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/hello`
Request: [
    "GET / HTTP/1.1",
    "Host: 127.0.0.1:7878",
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language: en-US,en;q=0.5",
    "Accept-Encoding: gzip, deflate, br",
    "DNT: 1",
    "Connection: keep-alive",
    "Upgrade-Insecure-Requests: 1",
    "Sec-Fetch-Dest: document",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-Site: none",
    "Sec-Fetch-User: ?1",
    "Cache-Control: max-age=0",
]
```

你看到的内容可能会略有不同，取决于你的浏览器。现在我们已经打印出了请求，我们可以通过请求第一行`GET`后的路径看出为什么我们会在一次浏览器请求下收到多个连接了。如果重复的连接全部都是`/`，那么我们就知道是浏览器在重复请求`/`，因为它没有获取到任何响应。

我们来拆解这个请求数据，理解浏览器请求我们程序的内容。

## 凑近看看HTTP请求

HTTP是基于文本的协议，它的请求格式如下：

```
Method Request-URI HTTP-Version CRLF
headers CRLF
message-body
```

第一行是*请求行*，它存储了关于发送请求客户端的信息。请求行的第一部分包括使用的*方法*，比如`GET`或`POST`，它描述了客户端创建的是什么请求。我们的客户端使用了`GET`请求，也就表示它在请求信息。

下一个请求行的部分是`/`，也就表示客户端请求的*统一资源标识符（uniform resource identifier，URI）*：URI几乎，但不完全和*统一资源定位符（uniform resource locator，URL）*相同。URI和URL的区别并不是本章讨论的重点，但HTTP的规范使用了URI这个术语，所以我们只能在心里把*URI*替换成*URL*了。

最后一部分是客户端使用的HTTP版本，然后请求行会用一个CRLF序列来结束。（CRLF是*carriage return line feed*的缩写，表示回车换行，这是一个来自打字机时代的术语！）CRLF序列也可以被写作`\r\n`，`\r`表示回车，`\n`表示换行。*CRLF序列*分割开了请求行和请求数据的其他部分。注意当CRLF被打印时，我们只会看到新的一行，而不会看到`\r\n`。

查看我们运行程序所收到的请求行数据，可以看到方法为`GET`，URI为`/`，版本为`HTTP/1.1`。

在请求行之后接着的，从`Host`开始的都是请求头。`GET`请求没有请求体。

你可以尝试从不同的浏览器请求不同的地址，比如*127.0.0.1:7878/tst*，看看请求数据的变化。

现在我们已经知道了浏览器请求的内容，让我们来返回一些数据！

## 开发一个响应

我们会实现返回请求给客户端的请求。响应体的结构如下：

```
HTTP-Version Status-Code Reason-Phrase CRLF
headers CRLF
message-body
```

第一行是*状态行*，它包括响应的HTTP版本，总结了响应结果的响应状态码，以及一个对返回该状态码原因的简短描述。在CRLF序列后是任何的响应头，然后是另一个CRLF序列，最后是响应体。

下面是一个使用HTTP1.1的响应示例，其状态码为200，原因为OK，没有响应头，没有响应体：

```
HTTP/1.1 200 OK\r\n\r\n
```

状态码200是一个标准的成功响应。这段文本是一个很小的成功的HTTP响应。我们可以将其写入流，作为一个成功的响应返回给请求！在`handle_connection`函数里，移除`println!`语句，替换为如下代码：

```rust
fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let response = "HTTP/1.1 200 OK\r\n\r\n";

    stream.write_all(response.as_bytes()).unwrap();
}
```

我们添加的第一行代码定义了`response`变量，它存储了成功的响应信息。然后我们调用了`response`的`as_bytes`方法将字符串转换为了字节。`stream`的`write_all`方法接收一个`&[u8]`，并将这些字节直接发送到连接中。由于`write_all`操作可能失败，我们使用了`unwrap`处理了任何可能发送的错误，和之前一样。再次强调，在生产应用里请添加错误处理。

带着这些请求，我们来运行代码并创建请求。这里我们没有在控制台打印任何数据，所以我们自然也无法在Cargo的运行结果里看到什么。当你在浏览器里加载127.0.0.1:7878时，你会看到一个空页，而不是错误。你已经成功地手写了接收HTTP请求和返回响应的代码了！

## 返回真实的HTML

我们的服务当然不能只返回一个空页面，所以我们来实现更多功能。在项目的根目录下（不是src目录）创建一个新文件，名为*hello.html*。你可以输入任何HTML，例如：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p>Hi from Rust</p>
  </body>
</html>
```

这是一个最小的HTML页面，它包含头和一些文本。要将它返回给请求，我们需要调整`handle_connection`函数如下代码来读取HTML文件，并将其作为响应体返回：

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};
// 略

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let status_line = "HTTP/1.1 200 OK";
    let contents = fs::read_to_string("hello.html").unwrap();
    let length = contents.len();

    let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

我们在`use`声明里加入了`fs`来引入标准库的文件系统模块。读取文件内容为字符串的代码看着应该很熟悉；我们在I/O项目里使用过它们。

接着，我们使用了`format!`把文件的内容添加到了成功的响应体里。为了确保HTTP响应有效，我们需要添加一个`Content-Length`头，它会标注响应体的长度，在这个例子里，也就是`hello.html`的长度。

使用`cargo run`运行代码，然后在浏览器里加载*127.0.0.1:7878*；你可以看到渲染后的HTML！

现在，我们忽略了`http_request`里的请求数据，直接无条件返回了HTML文件的内容。这就表示如果你在浏览器里请求*127.0.0.1:7878/something-else*，你还是会看到同样的HTML。眼下，我们的服务器和大部分web服务器比起来还是限制很多。我们希望可以根据请求来定制化我们的响应，且只在请求为格式工整的`/`时返回HTML。

## 验证请求并选择响应

现在，我们的web服务会无视客户端请求的内容，直接返回HTML。我们来添加一些功能，检查浏览器是否在请求`/`，如果是，返回HTML，如果不是，就抛出错误。这里我们需要调整`handle_connection`，代码如下。新的代码会检查接收到的请求数据，因为我们已经知道了`/`类的请求看起来是什么样子的，然后在`if`和`else`代码块里处理不同的请求。

```rust
// 略

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    if request_line == "GET / HTTP/1.1" {
        let status_line = "HTTP/1.1 200 OK";
        let contents = fs::read_to_string("hello.html").unwrap();
        let length = contents.len();

        let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

        stream.write_all(response.as_bytes()).unwrap();
    } else {
        // 其他请求
    }
}
```

我们只需要查看HTTP请求的第一行，所以与其将整个请求转为一个vector，我们只需要调用`next`来获取迭代器的第一个元素即可。第一个`unwrap`是处理`Option`，如果迭代器内没有元素，就会停止程序。而第二个`unwrap`是处理`Result`，它和之前`map`函数里的`unwrap`效果相同。

接着，我们检查了`request_line`，查看其是否等同于对`/`路径的GET请求。如果是，那么`if`代码块会返回HTML文件的内容。

如果`request_line`*不*等于对`/`路径的GET请求，那么就意味着我们收到了其他请求。所以我们需要添加`else`代码块来处理。

运行这段代码，请求*127.0.0.1:7878*；你会看到*hello.html*的内容。如果你尝试其他请求，比如*127.0.0.1:7878/something-else*，你会看到类似初始代码的连接错误。

现在我们来添加一些代码到`else`代码块里，返回状态为404的响应，这个状态码表示请求的内容没有找到。我们也会返回一个HTML页面，来让终端客户理解发生了什么。

```rust
    // 略
    } else {
        let status_line = "HTTP/1.1 404 NOT FOUND";
        let contents = fs::read_to_string("404.html").unwrap();
        let length = contents.len();

        let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

        stream.write_all(response.as_bytes()).unwrap();
    }
```

这里，我们的响应有了一个包含404状态码和原因`NOT FOUND`的状态行。响应体为*404.html*文件里的HTML。你需要在*hello.html*旁边创建一个*404.html*作为错误页；你可以使用任何你想使用的HTML。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Oops!</h1>
    <p>Sorry, I don't know what you're asking for.</p>
  </body>
</html>
```

改动完成后，重新运行应用。请求*127.0.0.1:7878*应该会返回*hello.html*的内容，而任何的其他请求，比如*127.0.0.1:7878/foo*，都会返回错误页*404.html*。

## 一点重构

现在，`if`和`else`代码块里有很多重复：它们都会读取一个文件，并将文件内容写入流。唯一的区别就是状态行和文件名。我们可以抽离这部分不同点到分开的`if`和`else`行里，让代码更加简洁，这两行都会给状态行和文件名赋值；这样我们就可以在读取文件和写入响应时无条件使用这些变量。重构后的代码如下：

```rust
// 略

fn handle_connection(mut stream: TcpStream) {
    // 略

    let (status_line, filename) = if request_line == "GET / HTTP/1.1" {
        ("HTTP/1.1 200 OK", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND", "404.html")
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

现在`if`和`else`都只会返回合适的状态行和文件名的元组；接着我们就可以使用解构将它们的值赋给`let`声明的`status_line`和`filename`，正如我们在19章中学到的那样。

之前重复的代码现在被移动到了`if`和`else`代码块外，且使用了`status_line`和`filename`变量。这样我们就可以更清晰地看到两种情况下的不同，如果我们想要修改文件的读取或者响应的写入，我们就只需要对一个地方进行改动了。重构后的代码和之前代码的行为完全相同。

太棒了！我们现在有了一个简单的web服务，大约只用了40行Rust代码，其功能为对某个特殊请求返回内容页，对其他请求全部返回404响应。

现在，我们的服务器运行在单线程里，也就是说它只能同时处理一个请求。我们来模拟一些慢请求，从而说明为什么这是一个问题。然后我们会修复这个问题，让我们的服务器可以同时处理多个请求。
