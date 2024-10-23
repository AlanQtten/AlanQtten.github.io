# 添加环境变量

我们再给`minigrep`添加一个额外的功能：一个可以让用户启用大小写不敏感的搜索的环境变量。我们可以通过命令行参数来实现这个功能，让用户在使用时每次都传入，但更好的选择是设置一个环境变量，这样用户只需要设置一次，之后他们的终端搜索就会保持这个配置。

## 为大小写敏感的`search`函数开发一个失败的测试

我们先添加一个新的`search_case_insensitive`函数，它会在环境变量有值时调用。我们仍然遵循TDD流程，所以第一步仍然是开发一个失败的测试。我们添加一个新的函数`search_case_insensitive`，然后将我们的老测试从`one_result`改为`case_sensitive`来区分两个测试的不同：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn case_sensitive() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Duct tape.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }

    #[test]
    fn case_insensitive() {
        let query = "rUsT";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Trust me.";

        assert_eq!(
            vec!["Rust:", "Trust me."],
            search_case_insensitive(query, contents)
        )
    }
}
```

注意前一个用例的`contents`也有所调整。我们增加了新的一行`"Duct tape."`，它包括一个大写字母*D*，因此在大小写敏感的情况下不应该和查询字符串`"duct"`所匹配。这样修改老测试的原因是为了确保我们不会意外地破坏我们已经实现的大小写敏感的搜索功能。这个测试当前应该是通过的，在我们实现大小写不敏感的过程中也应该保持通过的状态。

为大小写不敏感的场景设置的新测试使用了`"rUsT"`。在我们新添加的`search_case_insensitive`函数中，查询字符串`"rUsT"`应该和大写字母*R*开头的`"Rust:"`以及`"Trust me."`行相匹配，虽然他们都包含了不同大小写的情况。这个就是我们的失败的测试了，它目前也是无法编译的，因为我们还没有添加`search_case_insensitive`函数。你可以添加一个空的实现，让它永远返回一个空的vector，就像我们上一节开发`search`的过程一样。

## 实现`search_case_insensitive`函数

下面的`search_case_insensitive`和`search`函数类似。唯一的不同点在于我们使用了`query`和`line`的小写转换版本进行比较，这样不管输入的字符串大小写情况如何，他们都会按照小写进行比较：

```rust
pub fn search_case_insensitive<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let query = query.to_lowercase();
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.to_lowercase().contains(query) {
            results.push(line);
        }
    }

    results
}
```

首先我们将`query`字符串进行了小写转换，然后将它存入了一个影子变量中。对`query`调用`to_lowercase`方法后，不管用户的查询字符串是`"rust"`、`"Rust"`还是`"rUsT"`，我们都会把它看做`"rust"`，这样就实现了对大小写的不敏感。虽然`to_lowercase`可以处理基本的Unicode，但它也不是100%准确的。在真实的应用中，我们可能需要更多的处理，但是这一节主要是为了讨论环境变量，不是Unicode，所以我们目前可以接受这个简单的实现。

注意`to_lowercase`会创建新的数据，而不是引用数据，所以`query`不再是一个字符串切片了，它是一个`String`。假设查询字符串是`"rUsT"`：这个字符串并没有包含我们所需要的`u`和`t`，所以我们需要分配包含`"rust"`的新`String`。当我们把它作为参数传递给`contains`方法时，我们需要添加一个`&`符号，因为`contains`的签名要求一个字符串切片。

接着，我们对每一行`line`调用`to_lowercase`来将所有字符转化为小写。在我们的`query`和`line`都转为小写后，我们就可以进行正常的查询了。

让我们来看看这个实现是否可以通过测试：

```
$ cargo test
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.33s
     Running unittests src/lib.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 2 tests
test tests::case_insensitive ... ok
test tests::case_sensitive ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests minigrep

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

太好了！测试都通过了。现在我们可以在`run`函数中调用`search_case_insensitive`了。首先我们给`Config`结构体添加一个新的配置项，用于切换大小写敏感。添加这个字段会导致编译失败，因为我们还没有在任何地方初始化它：

```rust
pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}
```

我们新添加的`ignore_case`属性保存了一个布尔值。接着，我们要在`run`函数中检查`ignore_case`字段的值，来决定我们要调用`search`函数还是`search_case_insensitive`函数，如下例所示，目前仍然是无法编译的：

```rust
pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    let results = if config.ignore_case {
        search_case_insensitive(&config.query, &contents)
    } else {
        search(&config.query, &contents)
    };

    for line in results {
        println!("{line}")
    }

    Ok(())
}
```

最后，我们需要检查环境变量。标准库中内置了`env`模块来处理各种环境变量，所以我们需要在*src/lib.rs*中引入这个模块。然后我们需要使用`env`模块的`var`函数来检查环境变量`IGNORE_CASE`是否被设置了：

```rust
use std::env;
// 略

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

在这里，我们创建了一个新的变量，`ignore_case`。为了给它赋值，我们调用了`env::var`函数，并传递了环境变量名`IGNORE_CASE`作为参数。`env::var`函数返回的是一个`Result`，如果环境变量获取成功，那么他会返回包含环境变量（不管什么类型）的`Ok`变体。如果环境变量没有设置，它会返回`Err`变体。

我们使用了`Result`类型的`is_ok`方法来检查环境变量是否被设置了，也就表示当前的程序是否该进行大小写敏感的搜索。如果`IGNORE_CASE`环境变量没有被设置任何值，那么`is_ok`会返回`false`，此时程序会进行大小写敏感的搜索。由于我们并不关心环境变量的*值*，只关心它有没有被设置，所以`is_ok`比`unwrap`，`expect`或者其他`Result`的方法更合适。

我们将`ignore_case`变量的值传递给`Config`实例，这样`run`函数就可以读取其值来决定调用`search_case_insensitive`还是`search`了，就像我们之前实现的那样。

让我们来试试看！首先我们不设置任何的环境变量，使用字符串`to`进行查询，他应该和包含小写的`to`的行所匹配：

```
$ cargo run -- to poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep to poem.txt`
Are you nobody, too?
How dreary to be somebody!
```

看起来很好！现在，我们将`IGNORE_CASE`设置为`1`，继续使用*to*进行查询：

```bash
$ IGNORE_CASE=1 cargo run -- to poem.txt
```

如果你使用的是PowerShell，你可能需要用分开的命令设置环境变量：

```powershell
PS> $Env:IGNORE_CASE=1; cargo run -- to poem.txt
```

这样会使得`IGNORE_CASE`在你的命令行会话中持久化存在。可以使用`Remove-Item`命令来移除它：

```powershell
PS> Remove-Item Env:IGNORE_CASE
```

最终我们的结果应该包含一些大写*to*的行：

```
Are you nobody, too?
How dreary to be somebody!
To tell your name the livelong day
To an admiring bog!
```

太棒了，我们查询到了包含*To*的行！我们的`minigrep`程序可以进行由环境变量控制的大小写不敏感的搜索了。现在你了解了该如何管理命令行参数和环境变量了。

一些程序会允许参数*和*环境变量服务于同一个配置。那种情况下，程序内部需要决定它们的优先级。你可以尝试自己练习一下，兼容控制大小写敏感的配置通过命令行参数和环境变量来设置。如果一个配置设置了敏感，另一个设置了不敏感，程序就需要决定它们的优先级。

`std::env`模块包含了很多实用的功能来处理环境变量：你可以查看它们的文档来了解更多。
