<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  IsCompileText,
  IsCompile
} from "../../components/quiz"

</script>

# 对可恢复的错误使用Result

大部分错误并不会严重到需要程序完全停止。有时候，当一个函数失败了，其原因是很容易解释和做出应对的。比如，如果你尝试打开一个文件，但这个文件并不存在，操作失败了，你可能希望创建这个文件，而不是中断程序。

回顾第二章提到的错误处理，`Result`枚举定义了两个变体，`Ok`和`Err`：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`T`和`E`都是泛型参数：这部分我们会在第十章讨论。现在你只需要知道`T`表示成功情况下被`Ok`变体存储的值类型，`E`表示错误情况下被`Err`变体存储的值类型。正因为`Result`有这样的泛型参数，我们可以使用`Result`类型来定义各种情况下函数的返回类型。

让我们来调用一个打开文件的函数，返回一个`Result`：

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");
}
```

`File::open`的返回类型为`Result<T, E>`，泛型`T`被`File::open`实现为成功时的类型，`std::fs::File`，即文件的句柄。`E`类型被实现为`std::io::Error`。这个返回值类型意味着当我们调用`File::open`成功时，会拿到一个可读可写的文件句柄。这个函数也可能会失败：比如，文件可能不存在，或者我们没有足够的访问权限。`File::open`需要一种方式来告诉我们程序成功与否，也就是成功情况下返回句柄，失败情况下返回错误信息。这些信息恰恰就是`Result`可以表达的。

对于`File::open`成功的情况，`greeting_file_result`会存储一个`Ok`实例，包含文件的句柄。对于失败的情况，`greeting_file_result`会存储一个`Err`实例，包含描述了发生错误的原因。

我们需要添加一些代码来处理`File::open`返回的不同情况，下面的代码使用了基础工具`match`来处理`Result`：

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => panic!("Program opening the file: {:?}", error),
    }
}
```

可以注意到，就像`Option`枚举一样，`Result`枚举也被预先导入了，所以我们不需要在`Ok`和`Err`前面指明`Result::`。

当结果为`Ok`时，代码会返回被`Ok`变体包裹的`file`，这个变量被我们赋值给了`greeting_file`变量。在`match`后，我们可以使用这个文件句柄进行读写。

`match`的另一个分支处理了`File::open`返回`Err`的情况。这个例子里，我们选择调用`panic!`宏。如果没有名为*hello.txt*的文件，那么我们会看到如下输出：

```
$ cargo run
   Compiling error-handling v0.1.0 (file:///projects/error-handling)
    Finished dev [unoptimized + debuginfo] target(s) in 0.73s
     Running `target/debug/error-handling`
thread 'main' panicked at 'Problem opening the file: Os { code: 2, kind: NotFound, message: "No such file or directory" }', src/main.rs:8:23
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

和之前一样，这些输出会告诉我们错误的原因。

## 匹配不同的错误

在上面的代码里，不管`File::open`失败的原因是什么，`panic!`都会被调用。然而，我们可能希望对不同的错误采取不同的行动：如果`File::open`失败的原因是文件不存在，我们希望创建这个文件并返回句柄。如果`File::open`失败的原因是其他问题————比如权限不足————那么我们仍然希望程序`panic!`。这种情况下，我们可以使用嵌套的`match`来匹配各种类型的错误：

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem create the file: {:?}", e),
            },
            other_error => {
              panic!("Problem opening the file: {:?}", other_error);
            }
        }
    }
}
```

`File::open`方法返回的`Err`变体内部存储的是`io::Error`，它是一个标准库提供的结构体。这个结构体有一个方法`kind`，调用它，我们会得到一个`io::ErrorKind`类型的值。标准库提供的`io::ErrorKind`枚举列举了在`io`操作中可能引发的各种错误。这里我们需要的变体是`ErrorKind::NotFound`，它表示我们试图打开的文件不存在。这里我们对`greeting_file_result`使用了match，但内部也嵌套了对`error.kind()`的match。

在内部的match里，我们想要检查的是`error.kind()`返回的内容能不能和`ErrorKind`枚举的`NotFound`变体匹配。如果可以，那么我们可以使用`File::create`进行文件的创建。然而，因为`File::create`也是可能失败的，我们需要再次使用match来处理这种情况。当文件无法被创建时，会打印不同的错误信息。最外层`match`的第二个分支无需进行代码修改，这样，这个程序在无法找到文件以外的错误会继续panic。

> ### 替代`match`处理`Result<T, E>`的方法
>
> <br />
>
> 好多`match`啊！`match`表达式非常实用，但也比较原始。在第13章，你会学到闭包，它可以用在很多`Result<T, E>`定义的方法上。这些方法在处理`Result<T, E>`时比`match`更加简洁。
>
> <br />
>
> 比如，下面的代码跟之前的逻辑一样，但使用了闭包和`unwrap_or_else`方法：
>```rust
>use std::fs::File;
>use std::io::ErrorKind;
>
>fn main() {
>    let greeting_file = File::open("hello.txt").unwrap_or_else(|error|, {
>        if error.kind() == ErrorKind::NotFound {
>            File::create("hello.txt").unwrap_or_else(|error| {
>                panic!("Problem create the file: {:?}", error);
>            })
>        } else {
>            panic!("Problem opening the file: {:?}", error);
>        }
>    })
>}
>```
>尽管这里的代码跟之前的行为是一样的，但它并没有包含任何的`match`的使用，阅读起来也会更加清晰。在学习第13章后，你可以回来看看这段代码，同时也可以看看标准库文档中对`unwrap_or_else`方法的定义。大部分类似的方法都能清理掉`match`表达式的嵌套地狱。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：`Option`*只能*表示一个操作失败了，而`Result`可以解释*为什么*操作失败了。

</template>
<template #quiz>

哪一个声明对`File::open`返回`Result`而不是`Option`的原因描述的最准确？

<Radio>
<Option label="因为Result以与底层系统调用相同的方式表示错误" />
<Option label="因为Result可以表示为什么操作失败了，而文件的开启可能会因为很多原因失败" />
<Option label="因为Result在运行时表示错误时，比Option占用的字节少" />
<Option label="因为Result表示了失败的可能性，而Option无法表示失败" />
</Radio>
</template>
</Quiz>
</QuizProvider>
:::

## 错误时panic的捷径：`unwrap`和`expect`

使用`match`是行得通的，但它可能会有点啰嗦，它也无法永远很好地表达意图。`Result<T, E>`类型提供了很多实用的方法，它们可以分别聚焦更具体的场景。`unwrap`方法就是一个实现了`match`功能的简写方法。如果`Result`的值是`Ok`变体，`unwrap`会返回`Ok`内部的值。如果`Result`的值是`Err`变体，`unwrap`会调用`panic!`宏：

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt").unwrap();
}
```

如果我们在没有*hello.txt*文件的情况下运行这段代码，我们会收到`unwrap`方法内部`panic!`调用的错误信息：

```
thread 'main' panicked at 'called `Result::unwrap()` on an `Err` value: Os {
code: 2, kind: NotFound, message: "No such file or directory" }',
src/main.rs:4:49
```

类似地，`expect`方法可以让我们自定义`panic`的错误信息。使用`expect`而不是`unwrap`可以提供更好的错误信息，这些信息能够更好地表达你的意图，对错误追踪也有帮助。`expect`的语法如下：

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt")
        .expect("hello.txt should be included in the project");
}
```

`expect`和`unwrap`的调用方式相同：它们都返回文件句柄，或者在失败时调用`panic!`宏。`expect`的参数会作为其内部调用`panic!`宏的参数，而不是`unwrap`内部`panic!`使用的默认参数：

```
thread 'main' panicked at 'hello.txt should be included in this project: Os {
code: 2, kind: NotFound, message: "No such file or directory" }',
src/main.rs:5:10
```

要达到能满足生产水准的代码，大部分Rust控会选择`expect`而不是`unwrap`，插入更多的上下文来解释为什么这个操作在理想情况下总是成功的。这样，就算你的假设是错的，你也能在调试时获取更多的信息。

## 传递错误

当一个函数的实现囊括了对可能失败操作的调用，与其在每个地方处理这些错误，你可以选择将其抛出，留给调用者决定该怎么做。这种模式被称为*错误传递*，使调用代码能够更好地控制错误处理。调用代码通常具有比当前代码上下文更多的信息或逻辑，可以更好地决定如何处理错误。

比如，假设一个函数用于从文件中读取用户名。如果文件不存在或者不可读，函数会返回这些错误给调用者：

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let username_file_result = File::open("hello.txt");

    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}
```

这个函数可以用更剪短的方式实现，但我们暂时不引入错误处理，先手动实现；在最后，我们会展示简短的方式。我们先来看看函数的返回类型：`Result<String, io::Error>`。这就表示函数返回的类型是`Result<T, E>`，而`T`的类型是`String`，`E`的类型是`io::Error`。

如果这个函数进行的很顺利，调用这个函数的代码会收到包裹着`String`的`Ok`变体————也就是函数读取到的用户名。如果函数遇到了任何问题，调用代码会收到包裹着`io::Error`实体的`Err`变体，它存储了问题相关的各种信息。我们选择`io::Error`作为返回的错误类型，因为这个函数体内可能失败的操作返回的都是这类错误：`File::open`和`read_to_string`方法。

函数体首先调用了`File::open`函数。然后我们使用了跟之前类似的`match`来处理`Result`。如果`File::open`成功，`username_file`变量会存储`file`变量存储的文件句柄，然后函数继续。如果失败，不会直接调用`panic!`，我们会使用`return`关键字来让函数提前返回`File::open`抛出的错误，即变量`e`，作为这个函数的错误值。

如果我们获取到了句柄，那么这个函数会调用`username_file`文件句柄的`read_to_string`方法读取文件内容，即获取一个`String`，赋值给变量`username`。`read_to_string`方法也会返回一个`Result`类型，因为它可能也会失败，即使`File::open`成功了。所以我们需要再次使用`match`来处理：如果`read_to_string`成功了，那么整个函数就成功了，我们会返回`Ok`包裹的`username`变量。如果`read_to_string`失败了，我们会用返回`File::open`相同的方式返回错误。这里不需要再指明`return`，因为这里已经是整个函数的最后表达式了。

调用这个函数的程序要么会收到一个包裹着用户名的`Ok`，要么会收到一个包裹着`io::Error`的`Err`。函数的调用者可以决定如何处理这些值。如果调用者收到了一个`Err`值，他可以选择调用`panic!`来让程序结束、使用默认的用户名、或者尝试从其他地方获取用户名等等。我们并不清楚调用者会如何调用，所以我们决定将全部的成功或错误信息向上传递，等待他们被正确处理。

错误的传递在Rust中非常常见，因此Rust提供了操作符`?`来让它更方便。

### 错误传递简写：`?`操作符

下面的代码实现了和上面一样的功能，但使用了`?`操作符实现：

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}
```

在`Result`值后书写的`?`和之前的`match`工作方式相同。如果`Result`的值是`Ok`，那么表达式会返回`Ok`包裹的值，程序继续。如果值是`Err`，那么这个`Err`会作为整个函数的返回值，类似使用了`return`关键字，错误会被向上传递给调用这个函数的代码。

直接使用`match`表达式和`?`操作符的工作方式也是有区别的：经过`?`操作符的错误会经过`from`函数，这个定义在了标准库的`From`特性上，它用于将一个类型转换为另一个类型。当`?`操作符调用`from`函数时，它会将接收到的错误类型转换为当前函数的返回值类型。当一个函数需要返回一种错误来代表函数可能存在的所有错误，即使函数的各个部分返回的错误并不一样，这个特性非常实用。

比如，我们可以将`read_username_from_file`函数的返回值类型改为我们自定义的`OurError`类型。如果我们通过`impl From<io::Error> for OurError`从`io::Error`构造了`OurError`实例，那么不需要添加任何其他代码，`read_username_from_file`中对`from`的调用就可以转换错误类型。

在上面的代码里，`File::open`调用结尾的`?`会将其`Ok`变体内的值返回给`username_file`。如果错误出现，`?`会提前让整个函数返回，将`Err`返回给调用者。结尾的`read_to_string`调用也是同理。

`?`操作符减少了大量的模版代码，让函数的实现更加简单。我们甚至可以使用链式的调用和`?`操作符一起，让代码更加简洁：

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();

    File::open("hello.txt")?.read_to_string(&mut username)?;

    Ok(username)
}
```

我们将`String`类型`username`的创建移动到了函数的最开始；这部分不会发生变化。无需创建`username_file`，我们直接在`File::open("hello.txt")?`的结果上链式调用了`read_to_string`。`read_to_string`的结尾依然使用了`?`操作符，在`File::open`和`read_to_string`都成功的情况下，我们仍然会返回一个`Ok`包裹的`username`。它和之前的代码功能相同，只是更高效的写法。

下面的代码使用了`fs::read_to_string`来让代码更加简短：

```rust
use std::fs;
use std::io;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

将文件的内容读取为字符串是很常见的操作，所以标准库提供了便捷的`fs::read_to_string`函数来开启文件、创建`String`、读取文件内容、将内容写入`String`中、返回。当然了，使用`fs::read_to_string`不会让我们有机会解释内部的各种错误处理，所以我们从更复杂的例子开始。

### `?`操作符可以使用的位置

`?`操作符只能用在返回类型和`?`使用位置类型可以兼容的情况。因为`?`意味着函数可能会提前返回一个值，和我们之前使用`match`返回的规则一样，`match`消费了`Result`的值，提前返回了`Err(e)`值。因此这个函数的返回值必须是一个`Result`，才能跟它兼容。

下面的代码展示了一次`?`操作符的错误使用，它用在了`main`函数里，它的返回值类型和函数的返回值类型不兼容：

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt");
}
```

这段代码尝试打开一个文件，可能会失败。`File::open`返回的`Result`值使用了`?`操作符，但`main`函数的返回值类型为`()`，而非`Result`。当我们编译代码时，错误如下：

```
$ cargo run
   Compiling error-handling v0.1.0 (file:///projects/error-handling)
error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option` (or another type that implements `FromResidual`)
 --> src/main.rs:4:48
  |
3 | fn main() {
  | --------- this function should return `Result` or `Option` to accept `?`
4 |     let greeting_file = File::open("hello.txt")?;
  |                                                ^ cannot use the `?` operator in a function that returns `()`
  |
  = help: the trait `FromResidual<Result<Infallible, std::io::Error>>` is not implemented for `()`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `error-handling` due to previous error
```

错误指出我们只能在返回值为`Result`，`Option`，或者其他实现了`FromResidual`的类型上使用`?`操作符。

要修复这个问题，你有两个选择。要么修改函数的返回值，使其跟`?`操作符的类型兼容，只要这么干行得通。另一个办法是使用`match`或者`Result`上定义的方法来处理`Result<T, E>`。

错误信息还提到了`?`可以被用在`Option<T>`上。跟我们在`Result`上使用`?`一样，你可以在返回`Option`的函数里的`Option`上使用`?`。他们的工作方式类似，如果值为`None`，那么`None`会被提前返回。如果值为`Some`，那么`Some`包裹的值会作为表达式的返回值，程序继续。下面就是一个寻找给予文本第一行最后一个字符的函数：

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}
```

由于文本可能为空，所以这个函数返回一个`Option<char>`。这个函数接收一个字符串切片`&str`，并对其调用了`lines`方法，它会返回一个按行分割的迭代器。因为这个函数希望检查第一行，我们对迭代器调用了`next`方法。如果`text`是一个空串，调用`next`会返回`None`，这种情况下，`?`会中断运行，并让`last_char_of_first_line`返回`None`。如果`text`不是空串，那么`next`会返回`Some`并包裹`text`第一行文字的最后一个字符。

`?`取得了一个字符串切片，我们可以在上面调用`chars`方法来获取一个字符迭代器。我们感兴趣的是第一行的最后一个字符，所以我们调用`last`来返回迭代器的最后一个元素。因为第一行可能为空串，所以`last`返回的也是一个`Option`。比如，如果`text`开始于一个换行符，即`\nhi`。然而，如果第一行文字确实存在最后一个字符，那么函数会返回`Some`变体。中间的`?`操作符给予了我们更加便捷的逻辑表达，让我们用一行代码就实现了功能。如果我们不能对`Option`使用`?`，我们就只能使用`match`表达式来实现这段逻辑。

注意，你可以在一个返回`Result`的函数里的`Result`值上使用`?`，也可以在一个返回`Option`的函数里的`Option`值上使用`?`，但是不能混用。`?`并不会自动地进行`Result`和`Option`的转换；那种情况下，你可以使用`Result`上的`ok`方法，或者`Option`的`ok_or`方法来实现。

目前为止，我们使用的`main`函数都返回了`()`。`main`函数很特别，因为它是程序的起点和终点，它的返回值会受到一定的限制。

幸运的是，`main`函数可以返回`Result<(), E>`。下面的代码修改了`main`的返回值为`Result<(), Box<dyn Error>>`，并在结尾添加了`Ok(())`，这样的代码是可以通过编译的：

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let greeting_file = File::open("hello.txt");

    Ok(())
}
```

`Box<dyn Error>`类型是一个*特性对象*，这部分我们会在第17章讨论。现在，你可以将`Box<dyn Error>`看做“任何错误”。在`main`函数内的`Result`值上使用`?`跟`Box<dyn Error>`是兼容的，因为它支持提前返回任何`Err`值。尽管这里的`main`函数只会返回`std::io::Error`，但指明`Box<dyn Error>`这种签名可以对未来的代码维护很有帮助。

当`main`函数返回`Result<(), E>`且结果为`Ok(())`时，它会返回一个`0`，结果为`Err`时会返回一个非零值。C语言编写的程序会在它们退出时返回整数：成功指向返回`0`，报错程序返回非`0`。Rust也遵守了这种范式。

`main`函数可以返回任何实现了`std::process::Termination`特性的类型，它包括了返回`ExitCode`的函数`report`。你可以查看标准库文档来为自己的类型实现`Termination`特性。

现在我们讨论完了`panic!`的调用和`Result`的返回，是时候对比它们来决定何时使用了。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：如果`e`是一个`Result`，那么`e?`会取出`Ok`内部的值，或抛出错误。

</template>
<template #quiz>

假设一个表达式`e`返回了`Result<T, E>`，那么哪段代码是`e?`的最好翻译？

<Radio>
<Option answer>

```rust
match e {
    Ok(x) => x,
    Err(err) => { return Err(err); }
}
```

</Option>
<Option>

```rust
match e {
    Ok(x) => x,
    Err(err) => panic!("{err}")
}
```

</Option>
<Option>

```rust
if let Err(err) = e {
    return Err(err);
}
```

</Option>
<Option>

```rust
e.unwrap()
```

</Option>
</Radio>
</template>
</Quiz>

<Quiz>
<template #description>

解析：`File::open`返回的是一个`Result`，但函数`read_username_from_file`的返回值是`Option`。因此使用`?`操作符是不合法的，除非`Result`被转化为了`Option`（使用`Result::ok`方法）。

</template>
<template #quiz>
<IsCompileText />

```rust
// 假设 hello.txt 的内容为 "will"

fn read_username_from_file() -> Option<String> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Some(username)
}

fn main() {
    println!("{}", read_username_from_file().unwrap());
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::
