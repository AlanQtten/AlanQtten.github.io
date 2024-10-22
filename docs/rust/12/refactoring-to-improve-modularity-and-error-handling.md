# 提高模块化程序和错误处理

要优化我们的程序，我们需要修复四个问题，它们和程序的结构，以及其处理潜在错误的方式有关。首先，我们的`main`函数目前运行了两个任务：解析参数和读取文件。随着程序的开发，`main`函数会运行越来越多的任务。随着函数的功能增多，它的可读性会越来越差，测试也很难进行，想要不触及其他部分而只调整某一部分也变得十分困难。最好将各个不同任务分离为单独的函数。

这个问题也和我们的第二个问题有关：`query`和`file_path`是我们程序的配置变量，而`contents`是用来处理程序逻辑的变量。随着`main`函数的增大，我们需要给这个域内引入越来越多的变量；随着变量的增多，要清晰地追踪它们各自的目的就变得很困难了。最好将配置类的变量统一结构，让它们的目的更清晰。

第三个问题使我们在读取文件失败时使用了`expect`来打印错误信息，但错误信息只会展示`Should have been able to read the file`。但读取文件失败的原因有很多：比如，文件可能不存在，或者我们没有权限打开它。现在不管什么情况，我们都打印相同的错误信息，这样对用户没有任何的帮助。

第四，我们使用了`expect`来处理错误，如果用户运行程序时没有传入足够的参数，它们会看到`index out of bounds`错误，这个错误来自Rust，它并没有清晰地解释错误的原因。如果我们可以将错误统一处理，未来的维护者想要调整错误处理逻辑时，只需要关心这一个地方的代码即可。在同一个位置对错误进行统一处理还有一个额外的好处，那就是我们的终端用户可以看到更有意义的信息。

让我们来重构我们项目，逐一解决这些问题吧。

## 二进制项目的关注点分离

`main`函数中分配多个任务的代码组织问题对于很多二进制项目来说都是一个问题。好在Rust社区已经有一个`main`函数变大时拆分关注点的指南。它分为下面几个步骤：

- 将程序拆分为*main.rs*和*lib.rs*，将程序的逻辑移入*lib.rs*。
- 如果命令行的处理逻辑很小，可以将它放在*main.rs*中。
- 如果命令行的处理逻辑变得越来越复杂，可以将它拆分到*lib.rs*中。

在上面的处理后，`main`函数中的职责仅限于：

- 使用参数调用命令行解析逻辑
- 设置任何其他配置值
- 调用`lib.rs`中的`run`函数
- 在`run`返回错误时进行处理

这样的模式在于分离关注点：*main.rs*处理程序的运行，而*lib.rs*处理所有的任务逻辑。由于你不能直接对`main`函数进行测试，这样的结构可以让你轻松地测试*lib.rs*中的逻辑。而*main.rs*中的代码非常简短，快速地阅读就能判断其正确性。让我们遵循这些步骤来重构我们的项目吧。

### 分离参数解析器

我们将处理命令行参数的函数分离出来，放置在*src/lib.rs*中，供`main`函数调用。下面的函数展示了`main`函数的改动，它会调用`parse_config`，我们暂时先把它定义在*src/main.rs*中：

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let (query, file_path) = parse_config(&args);

    // 略
}

fn parse_config(args: &[String]) -> (&str, &str) {
    let query = &args[1];
    let file_path = &args[2];

    (query, file_path)
}
```

我们仍然将命令行的参数转为vector，但这次我们没有直接在`main`函数内将下标1的参数赋值给`query`，下标2的参数赋值给`file_path`，而是将整个vector传递给了`parse_config`函数。`parse_config`会在内部处理参数解析的逻辑，然后将值返回给`main`。我们的`query`和`file_path`仍然在`main`中创建，但`main`函数已经不包含对命令行参数解析、以及变量对应的逻辑了。

对我们的小程序来说，这样的重构似乎有点舍近求远了，但是我们的重构就是在小的、渐进的步骤中进行的。这样的改动后，再次运行程序来确保参数解析的逻辑没有问题。时刻检查逻辑是一个好习惯，它能帮助你及时改正错误。

### 聚合配置

我们可以再进行一个小步骤来让我们的`parse_config`函数更好。现在我们返回的是一个元组，但是我们立刻将元组拆分成了不同的部分。这是一个信号，我们可能没有用到最何时的数据结构。

另一个信号是`parse_config`的`config`部分，它表示函数返回的两个值是相关的，且它们都是一个配置值的一部分。除了将这两个值组合成一个元组之外，我们目前并没有在数据结构中传达这种含义；更好的做法是将它们放入一个结构体，并给给予他们有意义的名字。这样做可以让未来的维护者轻松理解这两个值的关系和目的：

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = parse_config(&args);

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    let contents =
        fs::read_to_string(config.file_path).expect("Should have been able to read the file");

    // 略
}

struct Config {
    query: String,
    file_path: String,
}

fn parse_config(args: &[String]) -> Config {
    let query = args[1].clone();
    let file_path = args[2].clone();

    Config { query, file_path }
}
```

我们添加了一个名为`Config`的结构体，并为它定义了两个字段`query`和`file_path`。`parse_config`的新签名也表示了它返回的是一个`Config`值。在`parse_config`的函数体内，之前我们返回了引用于`args`的`String`切片，现在我们定义了一个`Config`实例来拥有这些`String`值。`main`函数中的`args`变量是参数值的拥有者，它只允许`parse_config`函数借用这些值，因此，如果`Config`直接绑定了`args`中的值，会违反Rust的借用规则。

处理`String`数据的方式有很多；最简单的，尽管会影响效率，我们可以调用`clone`方法。这样可以创建完全复制的数据来让`Config`实例拥有，但也要花费更多的时间和内存来创建一个对字符串数据的引用。然而，克隆数据也能让我们的代码非常直接，因为我们无需关心引用的生命周期；这样的情况下，放弃一点性能来提高简洁性是一种权衡。

> ### 使用`clone`的权衡
> 在Rust控中有一种趋势，那就是避免使用`clone`来修复所有权问题，因为它会造成性能损耗。在第13章中，我们会学到如何用更高效的方式解决此类问题。但现在，复制几个字符串并不会有什么影响，因为你只会复制一次，且查询的字符串和文件路径都比较小。拥有一个稍微低效但能正常运行的程序，要比在第一次尝试时就过度优化代码更好。随着你的Rust水平逐渐提高，你会更轻松地使用更高效的办法，但现在，`clone`已经很完美了。

我们已经升级了`main`函数，它将`parse_config`返回的`Config`实例放置在了`config`变量中，我们也修改了对`query`和`file_path`变量的直接引用，现在通过`Config`结构体的属性来访问它们。

现在我们的代码清晰地传达了`query`和`file_path`是相关的，且它们的目的是对程序的运行进行配置。任何需要它们的代码都会明白如何通过`config`实例来访问它们。

### 为`Config`创建构造函数

目前为止，我们已经将解析命令行参数的代码从`main`函数中分离并放置在了`parse_config`函数中。这样做让我们看到了`query`和`file_path`是相关的，且它们的关系通过代码传达。然后我们添加了`Config`结构体，让`query`和`file_path`的关系有了语义化，`parse_config`也能用起字段作为返回。

现在`parse_config`的目的是创建一个`Config`实例，我们可以将`parse_config`从一个纯函数改为和`Config`结构体紧密关联的`new`方法。这样的方式是更加符合习惯的。我们用标准库的类型创建实例时，比如`String`，是通过调用`String::new`。类似的，将`parse_config`改为`Config`结构体的`new`函数，我们就能通过`Config::new`来创建`Config`实例。改动如下：

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args);

    // 略
}

// 略

impl Config {
    fn new(args: &[String]) -> Config {
        let query = args[1].clone();
        let file_path = args[2].clone();

        Config { query, file_path }
    }
}
```

我们更新了`main`方法，将`parse_config`的调用替换为了`Config::new`。`parse_config`被改为了`new`且移到了`impl`块中，它跟`Config`结构体的`new`方法产生了关联。别忘了再次编译代码，保证没有错误。

### 修复错误处理

现在我们来看看错误处理。回顾之前的代码，如果我们越界访问`args`中下标为1或下标为2的元素，那么程序会panic。你可以不传入任何参数运行当前程序，结果如下：

```
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep`
thread 'main' panicked at src/main.rs:27:21:
index out of bounds: the len is 1 but the index is 1
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

`index out of bounds: the len is 1 but the index is 1`这一行是为编程人员准备的错误信息。它对于终端用户来说毫无道理，他们也无法判断自己该做什么。我们来试试修复这个问题。

### 优化错误信息

在下面的代码里，我们为`new`函数添加了一个预检，它会检查切片的长度是否足够让我们访问下标1和下标2。如果不够，程序会主动panic，并展示一个更加友好的错误信息。

```rust
    // 略
    fn new(args: &[String]) -> Config {
        if args.len() < 3 {
            panic!("not enough arguments");
        }
        // 略
```

这段代码很像我们在第9章讨论过的方式，当时我们在`value`参数不符合区间时调用了`panic!`。只不过我们这里并非检查参数的区间，我们是检查`args`的长度是否至少为`3`。满足这个功能，函数就可以继续运行。如果`args`没有三个元素，这个判断为`true`，我们就会调用`panic!`宏来立刻结束整个程序。

有了`new`中新加入的代码，我们可以尝试再次不携带任何参数运行并查看结果：

```
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep`
thread 'main' panicked at src/main.rs:26:13:
not enough arguments
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

这样的输出更加优雅：我们现在有了一个合理的错误信息。然而，这里还有很多我们不希望抛给终端用户的额外信息。也许我们之前的办法在这里并不是最优解：调用`panic!`对于程序本身的问题来说是更合适的，但不适合一个使用侧的问题，就像我们在第9章讨论的一样。因此，我们要使用另一种第9章中学过的技术————返回一个`Result`来表达成功或失败。

### 返回`Result`来替代`panic!`

我们可以返回一个`Result`，它在成功的情况下会包括`Config`实例，在失败的情况下会描述失败原因。我们也要把`new`改为`build`，因为在很多程序员的语义中，`new`是不会失败的。当`Config::build`在`main`函数中被调用时，我们可以使用`Result`来暗示这其中可能有问题。然后我们可以让`main`函数把一个`Err`变体转换为一个更实际的错误，这样终端用户就无需查看调用`panic!`引发输出的`thread 'main'`和`RUST_BACKTRACE`。

下面的代码就是我们对函数进行的改造，现在我们将函数改为`Config::build`，且它会返回一个`Result`。注意这里的代码还无法编译，`main`函数的代码稍后也需要改造：

```rust
impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        Ok(Config { query, file_path })
    }
}
```

在成功的情况下，`build`函数返回的`Result`会包含`Config`实例，在失败的情况下，它会包含一个字符串字面量。由于我们添加了`'static`生命周期，所以我们的错误值永远为字符串字面量。

我们已经进行了两处改造：由于调用`panic!`会给用户传递冗余的错误信息，我们返回了`Err`值，然后我们将`Config`实例放置在了`Ok`中进行返回。这两处改动让函数和它的签名匹配。

`Config::build`返回一个`Err`值可以让`main`函数来处理`build`函数返回的`Result`值，在错误的情况下，也可以更清晰地退出进程。

### 调用`Config::build`并处理错误

要处理错误并打印用户友好的信息，我们需要先改造`main`函数来处理`Config::build`返回的`Result`，正如下面的代码所示。我们也不再借助`panic!`来让命令行工具以非零错误码退出，而是手动实现这一功能。一个非0的状态是通知进程来以一个错误状态中断当前进程。

```rust
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    // 略
}
```

在这次更新中，我们使用了一个还没有详细介绍过的方法：`unwrap_or_else`，它由标准库为`Result<T, E>`定义。使用`unwrap_or_else`可以让我们定义一些自定义的，非`panic!`的错误处理。如果`Result`为`Ok`，那么函数的行为和`unwrap`一样：它会返回`Ok`包裹的值。然而，如果值是`Err`，那么这个函数会调用*闭包*中的代码，也就是这里我们给`unwrap_or_else`传入函数————一个匿名函数。我们在第13章中会详细讨论闭包。现在，你只需要了解`unwrap_or_else`会传递`Err`内部的值，当前情况下也就是字符串字面量`"not enough arguments"`，给到闭包中两个`|`包裹出现的参数`err`。这样闭包中的代码运行时就可以使用`err`值了。

我们也添加了新的`use`来引入标准库中的`process`。闭包中的代码仅有两行：打印`err`的值，然后调用`process::exit`。`process::exit`方法会立刻中断程序，并返回我们传递的数字。它跟`panic!`很类似，但它不会有任何额外的输出，让我们来试试吧：

```
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/minigrep`
Problem parsing arguments: not enough arguments
```

太酷了！这样的输出对用户来说是更友好的。

## 抽离`main`中的逻辑

现在我们完成了对配置解析的重构。我们来看看程序本身的逻辑。正像我们在前面提到的一样，我们会分离一个`run`函数，它会包含当前在`main`中的所有和配置准备、错误处理无关的运行逻辑。等到我们完成后，`main`函数会更加简洁，也会更易检查，我们也可以为其他代码开发一些测试。

下面的代码分离了`run`函数。目前，我们只是将这个函数分离而已。因此它还定义在*src/main.rs*中：

```rust
fn main() {
    // 略

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    run(config);
}

fn run(config: Config) {
    let contents =
        fs::read_to_string(config.file_path).expect("Should have been able to read the file");

    println!("with text:\n{contents}");
}

// 略
```

`run`函数现在包含了所有`main`中剩余的逻辑，从读取文件开始。`run`接收一个`Config`实例作为参数。

### `run`函数返回错误

既然程序剩余的逻辑已经拆分到了`run`函数中，我们就可以进一步优化错误处理，正如我们给`Config::build`做的一样。与其让程序在调用`expect`时panic，`run`函数会返回`Result<T, E>`来预防错误。这可以让我们进一步巩固`main`函数中错误处理的友好程度。下面的代码就是我们为`run`函数进行的改动：

```rust
use std::error::Error;

// 略

fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    println!("with text:\n{contents}");

    Ok(())
}
```

这里我们进行了三处改动。首先，我们把`run`函数的返回值改为了`Result<(), Box<dyn Error>>`。函数本来返回的是原类型，我们将其作为`Ok`情况包裹的值。

对于错误类型，我们使用了*trait对象*`Box<dyn Error>`（我们在顶部使用`use`引入了`std::error::Error`）。我们会在第17章讨论trait对象。现在，你只需要知道我们没有指定返回值的具体类型，而`Box<dyn Error>`表示函数可以返回任何实现了`Error`trait的类型。这样的代码给了我们很大的灵活度，我们可以在不同错误发生时返回不同的错误值。`dyn`关键字是*dynamic*的缩写。

其次，我们用`?`替换了`expect`的调用，这部分我们在第9章讨论过。相比于在错误时调用`panic!`，`?`会将错误返回给上层函数处理。

最后，`run`函数会在成功的情况下返回`Ok`。而我们在`run`的函数签名中声明其成功时包裹的类型为`()`，也就是说我们需要返回一个`Ok`包裹的原类型值。在初学时`Ok(())`语法可能有点奇怪，但`()`这样的使用方式很常见，它表示我们调用`run`只是为了它的副作用；我们无需它的返回值。

运行这段代码，它会在编译时抛出警告：

```
$ cargo run -- the poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
warning: unused `Result` that must be used
  --> src/main.rs:19:5
   |
19 |     run(config);
   |     ^^^^^^^^^^^
   |
   = note: this `Result` may be an `Err` variant, which should be handled
   = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
   |
19 |     let _ = run(config);
   |     +++++++

warning: `minigrep` (bin "minigrep") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.71s
     Running `target/debug/minigrep the poem.txt`
Searching for the
In file poem.txt
With text:
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

Rust告诉我们，我们的代码忽略了`Result`值，而`Result`意味着可能存在的错误。但我们并没有检查是否真的存在错误，编译器提醒我们可能需要添加一些错误处理的代码！让我们来纠正这个问题吧。

### 在`main`函数中处理`run`返回的错误

我们会用处理`Config::build`返回的错误类似的方法类检查、处理错误，但有些许不同：

```rust
fn main() {
    // 略

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    if let Err(e) = run(config) {
        println!("Application error: {e}");
        process::exit(1);
    };
}
```

我们使用了`if let`而不是`unwrap_or_else`来检查`run`是否返回了`Err`值，如果返回，调用`process::exit(1)`。我们并不需要`run`函数成功时的返回值，所以也无需像从`Config::build`中获取`Config`实例那样调用`unwrap`。由于`run`在成功时会返回`()`，我们也无需使用`unwrap_or_else`来返回包裹的值，因为它只会是`()`。

`if let`和`unwrap_or_else`的函数体是相同的：打印错误然后退出。

## 将代码拆分到库Crate中

我们的`minigrep`项目已经初具雏形了！现在我们需要将*src/main.rs*的代码拆分一部分到*src/lib.rs*文件中。这样，我们就可以对代码进行测试，且*src/main.rs*文件的职责也会更少。

我们可以将*src/main.rs*中所有不在`main`函数中的代码全部移入*src/lib.rs*：

- `run`函数的定义
- 相关的`use`声明
- `Config`的定义
- `Config::build`方法的定义

*src/lib.rs*的内容应该如下（为了简洁，函数体已被省略）。注意目前代码是无法编译的，*src/main.rs*中的代码我们还没有调整：

```rust
use std::error::Error;
use std::fs;

pub struct Config {
    pub query: String,
    pub file_path: String,
}

impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> {
        // 略
    }
}

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    // 略
}
```

这里我们比较自由地使用了`pub`关键字：对`Config`结构体，对其字段和`build`方法，以及`run`函数。这样我们就有了一个库crate，且有了一批公共的可测试的API！

现在我们需要将*src/lib.rs*中的代码引入*src/main.rs*的二进制crate中：

```rust
use std::env;
use std::process;

use minigrep::Config;

fn main() {
    // 略
    if let Err(e) = minigrep::run(config) {
        // 略
    };
}
```

我们添加了`use minigrep::Config`行，将`Config`类型从库crate引入了当前的二进制crate的域，然后我们给`run`方法增加了crete的名称作为前缀。现在所有的功能应该都恢复正常了。使用`cargo run`来运行程序，确保一切正常。

呼！本章涉及了一大堆工作，但我们已经为成功打下了基础。现在处理错误更容易了，代码也更加模块化了。未来几乎所有的代码都会在*src/lib.rs*中实现。

让我们利用模块化的优势，做一些在旧代码中很难做到但在新代码中很容易的事：编写一些测试！
