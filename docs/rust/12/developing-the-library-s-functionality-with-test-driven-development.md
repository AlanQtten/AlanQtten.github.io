# 通过测试驱动来开发功能

现在我们将大部分逻辑都分离到了*src/lib.rs*中，*src/main.rs*中只剩下了参数收集和错误处理，这样的结构让我们的测试更容易编写了。我们可以用各种参数直接调用函数、检查结果，无需从命令行调用我们的二进制文件。

这一节，我们会给`minigrep`程序添加搜索的逻辑，我们会使用测试驱动开发（test-driven development, TDD）流程，它的步骤如下：

1. 编写一个失败的测试，并运行它，确保它失败的理由和期望一致。
2. 调整足够的代码来让测试通过。
3. 重构你刚刚添加的代码，确保测试仍然通过。
4. 从步骤1开始，重复这个过程。

尽管这只是软件开发的方式之一，TDD可以协助驱动代码设计。在开发代码前就开发测试用例可以通过测试的通过与否来持续保障测试的覆盖率。

我们将通过测试驱动实现实际功能，该功能将在文件内容中搜索查询字符串，并生成匹配查询的行列表。我们将把这个功能添加到一个名为`search`的函数中。

## 编写一个失败的测试

由于我们不再需要它们了，我们可以将*src/lib.rs*和*src/main.rs*中用于检查程序行为的`println!`声明全部移除了。然后，在*src/lib.rs*中，我们会添加一个`tests`模块，并添加一个测试函数，就像我们在第11章中做的一样。测试函数会声明我们希望的`search`的行为：它会接收一个查询字符串和一个文本内容，且只会返回包含查询字符串的行。下面的代码展示了这个测试，目前还无法编译：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_result() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }
}
```

这个测试会查找字符串`"duct"`。我们传入的三行文本中，只有一行包括了`"duct"`（字符串开头双引号后的反斜杠是告诉Rust不要给这个字符串字面量的开头添加一个新行字符）。我们断言`search`函数的返回值会包含我们期望的行。

我们目前还无法运行这个测试并看着它失败，因为这个测试压根无法编译：`search`函数还不存在！根据TDD原则，我们需要添加足够的代码让这个测试编译运行，这里我们需要添加`search`的函数定义，目前它永远返回一个空的vector。然后测试应该编译并失败，因为空vector不包含`"safe, fast, productive."`：

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    vec![]
}
```

注意我们需要在`search`的签名中添加显式的生命周期，并在`contents`参数和返回值中使用它。回顾第十章中我们讨论的，生命周期参数的定义是为了描述参数生命周期和返回值生命周期的关系。当前情况下，我们已经表示了返回的vector应该包含引用了参数`contents`中部分的字符串切片（与`query`无关）。

换句话说，我们告诉了Rust`search`函数返回的结果会和传入`search`函数的参数`contents`一样。这很重要！*由*切片引用的数据只有在其引用有效时才有效；如果编译器认为我们在创建`query`的字符串引用而不是`contents`的字符串引用，它会进行错误的安全检查。

如果我们不进行生命周期标注，这段代码会编译失败，报错如下：

```
$ cargo build
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
error[E0106]: missing lifetime specifier
  --> src/lib.rs:28:51
   |
28 | pub fn search(query: &str, contents: &str) -> Vec<&str> {
   |                      ----            ----         ^ expected named lifetime parameter
   |
   = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `query` or `contents`
help: consider introducing a named lifetime parameter
   |
28 | pub fn search<'a>(query: &'a str, contents: &'a str) -> Vec<&'a str> {
   |              ++++         ++                 ++              ++

For more information about this error, try `rustc --explain E0106`.
error: could not compile `minigrep` (lib) due to 1 previous error
```

Rust无法确定我们需要的是哪个参数，所以我们需要显式的声明。由于`contents`包含了全量的待查文本，而我们希望返回的是和查询字符串匹配的字符串，我们就知道返回值应该和`contents`参数的生命周期相关联。

其他编程语言不会要求你将参数和返回值在签名中做关联，但随着时间的推移，这种做法会变得更容易。你可以将它和第十章中的例子做比较。

现在我们运行测试：

```
$ cargo test
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.97s
     Running unittests src/lib.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 1 test
test tests::one_result ... FAILED

failures:

---- tests::one_result stdout ----
thread 'tests::one_result' panicked at src/lib.rs:44:9:
assertion `left == right` failed
  left: ["safe, fast, productive."]
 right: []
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::one_result

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

太好了，测试如我们期望的失败了。让我们调整代码，使其通过。

## 编写代码来让测试通过

目前，我们永远返回空的vector，所以测试一定会失败。要修复这个问题并实现`search`，我们的程序需要遵循下面的步骤：

1. 遍历contents的每一行。
2. 检查当前行是否包括查询字符。
3. 如果包含，将其添加到我们即将返回的vector中。
4. 如果不包含，什么都不做。
5. 返回包含查询字符的行的vector。

我们来一步步进行，首先是遍历行。

### 使用`lines`方法遍历行

Rust有一个实用的内置方法来处理字符串的逐行遍历，它就叫做`lines`，下面的代码展示了它的使用，注意它目前还无法编译：

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        // 暂时什么都没做
    }
}
```

`lines`方法会返回一个迭代器。我们会在第13章详细介绍迭代器，你可以回顾第三章我们对于迭代器的使用，使用`for`循环来遍历迭代器，对集合中的每一个元素执行某些操作。

### 检查行是否包含查询字符

接下来，我们会判断当前行是否包含查询字符串。幸运的是，Rust为字符串内置了一个实用的方法`contains`，它可以完成这个功能！下面的代码展示了如何在`search`函数中使用`contains`方法，注意此时仍然无法编译：

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        if line.contains(query) {
            // 暂时什么都没做
        }
    }
}
```

现在我们只添加了部分功能。要想让代码编译通过，我们需要如函数签名中描述的一样返回内容。

### 存储匹配的行

要完成这个函数，我们需要一个办法来存储匹配的行，并最终返回。为此，我们可以在`for`循环前创建一个可变的vector，调用`push`方法存入`line`。在`for`循环后，我们可以返回vector：

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

现在我们的`search`函数应该返回包含`query`的行了，我们的测试也应该通过。让我们运行一下：

```
$ cargo test
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.22s
     Running unittests src/lib.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 1 test
test tests::one_result ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests minigrep

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

测试通过了，所以我们知道功能正常了！

此时，我们可以考虑重构代码，而保持测试通过来保证功能的正确性。`search`函数中的目前的代码还不错，但它并没有利用一些迭代器的特性。第13章中我们会回到这个例子，探索更多可提升的细节。

### 在`run`函数中使用`search`函数

现在`search`函数已经开发完成且测试通过，我们需要在`run`函数中调用`search`。将`config.query`和`run`函数从文件读取获得的`contents`传递给`search`函数。然后打印`search`返回的结果：

```rust
pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    for line in search(&config.query, &contents) {
        println!("{line}")
    }

    Ok(())
}
```

我们仍然使用`for`循环来逐一打印`search`的返回结果。

现在整个程序都正常了！我们可以尝试一下，首先我们传入一个应该从Emily Dickinson的诗中查到一行的单词：*frog*。

```
$ cargo run -- frog poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.38s
     Running `target/debug/minigrep frog poem.txt`
How public, like a frog
```

太酷了！现在我们试试多行出现的单词，比如*body*：

```
$ cargo run -- body poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep body poem.txt`
I'm nobody! Who are you?
Are you nobody, too?
How dreary to be somebody!
```

最后，确保我们传入不存在的单词时不会输出任何行，比如*monomorphization*：

```
$ cargo run -- monomorphization poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep monomorphization poem.txt`
```

太好了！我们已经完成了一个经典工具的迷你版本，且学到了如何组织应用结构。我们也学到了文件的输入输出，生命周期，测试，以及命令行参数的处理。

为了完善这个项目，我们将简要演示如何使用环境变量以及如何打印到标准错误输出。这两者在编写命令行程序时都非常有用。
