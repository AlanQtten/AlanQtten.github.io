# 优化I/O工程

学习完了这些有关迭代器的只是，我们可以使用迭代器来优化第12章的I/O工程，让代码更加简洁、清晰。让我们来看看如何用迭代器来优化`Cargo::build`和`search`函数的实现吧！

## 使用迭代器替换`clone`

在之前的代码里，我们接收了一个`String`的切片作为参数，通过对切片进行索引、复制，创建了一个`Config`结构体的实例，这样`Config`实例就可以拥有值的所有权。下面是`Config::build`的实现：

```rust
impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        let ignore_case = env::var("IGNORE_CASE").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case,
        })
    }
}
```

之前，我们曾说过暂时不需要考虑`clone`操作带来的副作用，因为我们会在“未来”移除掉它。现在是时候动手了！

我们之所以需要`clone`，是因为`args`是`String`切片类型，但`build`函数并没有`args`的所有权。要返回`Config`实例的所有权，我们必须克隆`query`和`file_path`的值，这样`Config`实例就可以拥有对应字段的所有权。

现在我们学习了迭代器的知识，我们可以将`build`函数改为接收一个迭代器的所有权作为参数，而不是一个借用一个切片。我们会使用迭代器的功能，无需手动检查切片长度、索引位置等等。这样可以让`Config::build`的目的更加清晰，因为迭代器会协助访问对应的值。

一旦`Config::build`接收了一个迭代器的所有权，而不再对借用的数据进行索引时，我们就可以将迭代器的`String`移入`Config`，而不是调用`clone`来重新分配。

### 直接使用返回的迭代器

打开你的I/O项目的*src/main.rs*文件，它的内容如下：

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err|, {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    })

    // 略
}
```

我们首先修改`main`函数，如下（这段代码暂时还不能编译，因为我们还没有修改`Config::build`）：

```rust
fn main() {
    let config = Config::build(env::args()).unwrap_or_else(|err|, {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    })

    // 略
}
```

`env::args`函数返回的就是一个迭代器！与其将迭代器的值收集到一个vector中，再将其切片传给`Config::build`，我们可以直接将`env::args`返回的迭代器的所有权传递给`Config::build`。

接着，我们来修改`Config::build`的定义。在*src/lib.rs*文件中，我们将`Config::build`的签名修改如下（这段代码仍然是无法编译的，我们还需要修改函数体）：

```rust
impl Config {
    pub fn build(
        mut args: impl Iterator<Item = String>,
    ) -> Result<Config, &'static str> {
        // 略
```

查阅标准库中关于`env::args`函数的文档可知，其返回的迭代器类型为`env::args::Args`，这个类型实现了`Iterator`trait，返回的元素类型为`String`。

我们已经更新了`Config::build`的签名，参数`args`的类型为泛型类型，其trait边界从`&[String]`改为了`impl Iterator<Item = String>`。`impl Trait`的语法我们已经在第十章讨论过了，此处的含义是`args`可以为任何实现了`Iterator`trait、返回`String`元素的类型。

由于我们获取了`args`的所有权，且即将通过迭代来修改`args`的值，我们添加了`mut`关键字，使得`args`参数声明为可变的。

### 使用`Iterator`Trait的方法替代索引

接着，我们来修复`Config::build`的函数体。由于`args`实现了`Iterator`trait，我们可以调用`next`方法了！下面的代码就是使用`next`方法的版本：

```rust
impl Config {
    pub fn build(mut args: impl Iterator<Item = String>) -> Result<Config, &'static str> {
        args.next();

        let query = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a query string"),
        };

        let file_path = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a file path"),
        };

        let ignore_case = env::var("IGNORE_CASE").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case,
        })
    }
}
```

别忘了`env::args`返回的第一个参数是程序的名称。我们需要忽略它，并继续获取后续值，这也是为什么我们先调用了`next`方法而没有对其返回值进行任何操作的原因。接着，我们调用`next`方法来获取要放在`Config`中的`query`字段。如果`next`返回了`Some`，我们使用`match`来分离其中的值。如果它返回了`None`，那么就说明参数的数量不足，我们可以提前使用`Err`来结束函数。`file_path`同理。

## 使用迭代适配器让代码更清晰

我们还可以借助迭代器的优势来优化I/O项目中的`search`函数，它原本的实现如下：

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}
```

我们可以使用迭代适配器的方法来让代码更简洁。这样做也可以让我们避免创建一个可变中间值`results`vector。函数式编程的风格更倾向于减少可变状态来让代码更加清晰。移除可变的状态也让未来查询的并发有所加强，因为我们无需管理`results`vector的并发访问。修改后的代码如下：

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents
        .lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

回顾`search`函数的目的，它需要返回`contents`中所有包含`query`的行。和之前的`filter`的例子类似，这段代码使用了`filter`适配器来确保只有`line.contains(query)`返回`true`的行才会被保留。最后我们调用`collect`将所有匹配成功的行收集到了一个vector中。是不是似曾相识！你可以试试用类似的办法重构`search_case_insensitive`。

## 循环和迭代器如何选择

下一个逻辑问题是，你该在你的代码中使用哪种风格，以及其原因：是原始的版本还是使用迭代器。大部分Rust开发者会倾向于使用迭代器的风格。这种风格在一开始可能会有些难度，但随着你熟悉各个迭代适配器的用法，迭代器会非常容易理解。与其使用循环和创建新的vector，迭代器的代码更关注高层级面向对象的循环。这样的抽象减少了代码中的模板代码，让代码独特的概念可以更容易地被看到，比如根据条件过滤部分迭代器的元素。

但是这两种实现真的完全一样吗？直觉似乎告诉你低抽象的循环速度更快。那就让我们来看看它们的性能吧。
