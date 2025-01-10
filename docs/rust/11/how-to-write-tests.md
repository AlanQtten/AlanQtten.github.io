<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  Input
} from "../../components/quiz"

</script>

# 如何编写测试

测试是用于验证非测试代码是否按照期望运行的Rust函数。测试函数的主体通常执行以下三个操作：

- 准备好需要的数据或状态
- 运行测试代码
- 对结果进行断言

让我们来看看Rust为这些操作提供的功能，包括`test`属性，一系列宏，以及`should_panic`属性。

## 剖析测试函数

简单来说，Rust中的测试就是带有`test`属性的函数。属性是Rust代码片段的元数据；比如我们在第五章中给结构体添加的`derive`属性。要把一个函数改为一个测试函数，只需要在`fn`前面的一行增加`#[test]`即可。当你使用`cargo test`命令运行测试时，Rust会将带有标注的函数打包成二进制运行，且输出其测试结果。

只要使用Cargo创建库时，一个测试模块和一个测试函数总会自动生成。这个模块是一个很好的模版，来帮助你快速开发测试代码，而无需寻找其结构和语法。你可以按照你的想法添加任意数量的测试用例。

在自己动手书写测试前，我们先通过Rust生成的测试模板来了解一下测试函数的运行。然后我们会开发真正的测试函数，对我们的代码进行校验。

让我们创建一个新的库`adder`，它可以进行数字相加：

```bash
$ cargo new adder --lib
     Created library `adder` project
$ cd adder
```

你的`adder`库下的*src/lib.rs*文件内容应为：

```rust
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

我们先来单独看看`it_works`函数，注意`#[test]`注解：这个属性表示这是一个测试函数，所以测试运行器就明白该将这个函数看做一个测试函数。由于我们也可以在`tests`模块中书写非测试函数已处理其他逻辑，所以我们必须得标注哪些函数是测试函数。

实例代码使用了`assert_eq!`宏来对`result`进行断言，`result`来自2和2的相加。这是一个标准的断言格式。我们可以运行这段代码来查看测试结果。

`cargo test`命令的运行结果如下：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.57s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Cargo编译并运行了测试。我们可以看到`running 1 test`。之后的一行展示了生成的测试函数名，即`tests::it_works`，然后是测试的结果`ok`。总结起来就是`test result: ok`。表示所有的测试都通过了，而`1 passed; 0 failed`表示了测试通过和失败的数量。

我们也可以让某个测试在特定的情况下不运行，这部分我们会在这一章的后续部分介绍。目前只显示`0 ignored`。

`0 measured`是为了性能测试时的基准测试准备的。基准测试目前还只在Rust的nightly版本中可用。你可以在Rust的API目录中找到更多信息。

我们可以给`cargo test`传递一个参数，来只运行和名字匹配的测试：这种情况叫做*过滤（filtering）*，我们会在这一章的后续部分介绍。目前我们没有过滤任何测试，因此这里显示`0 filtered out`。

在`Doc-tests adder`部分，我么可以看到任何文档测试的功能。我们目前还没有任何的文档测试，但Rust可以对API文档中的代码示例进行编译。这个特性可以帮助你的文档和实例永远同步！我们会在第14章讨论这部分内容。现在，我们可以先忽略`Doc-tests`的输出。

现在，我们可以开始定制我们自己的测试函数了。首先，我们需要调整`it_works`函数，比如`exploration`：

```rust
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exploration() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

再次运行`cargo test`，`it_works`被换成了`exploration`：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.59s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::exploration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

现在让我们来增加一个测试，这一次我们通过在测试内引发panic来让这个测试失败！每一个测试函数都在单独的线程执行的，如果主线程看到一个测试线程死了，那么这个测试就会被标记为失败。在第九章我们曾说过，引发panic最简单的办法就是调用`panic!`宏。下面我们添加一个测试函数`another`，你的`src/lib.rs`代码应当如下：

```rust
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exploration() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn another() {
        panic!("Make this test fail");
    }
}
```

运行`cargo test`，可以看到`exploration`通过了，而`another`失败了：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.72s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 2 tests
test tests::another ... FAILED
test tests::exploration ... ok

failures:

---- tests::another stdout ----
thread 'tests::another' panicked at src/lib.rs:17:9:
Make this test fail
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::another

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

这一次`test tests::another`显示的不是`ok`，而是`FAILED`。这次在独立的结果和总结之间还出现了两个新的输出模块：第一个展示了每一个失败测试的失败原因。在本例中，我可以看到`another`这个函数失败的原因是它在*src/lib.rs*文件的第17行抛出了`panicked at 'Make this test fail'`。第二个模块展示了所有失败的测试名称，这个模块在我们运行大量测试用例时十分有用。我们可以更容易地使用失败测试的名字来运行测试；这部分我们会在下一节介绍。

总结行还是显示在最后：我们的测试总的来看是`FAILED`。一个测试通过，一个测试失败。

现在你已经看到了不同情况下的测试用例是什么样子的，我们来试试除了`panic!`的其他宏吧。

## 使用`assert!`宏检查结果

如果你想确定你的测试结果为`true`，那么标准库提供的`assert!`宏是最好的选择。`assert!`宏只接收一个布尔值类型的参数。如果值为`true`，那么测试通过，无事发生。如果值为`false`，那么`assert!`宏会调用`panic!`宏来让测试失败。使用`assert!`可以让我们判断我们的代码是否按预期行为运行。

在第五章，我们使用过`Rectangle`结构体和`can_hold`方法，它们的实现如下。我们可以把这些代码放到*src/lib.rs*文件里，然后使用`assert!`宏来书写一些用例：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

`can_hold`方法的返回类型也是布尔值，它和`assert!`宏可以完美配合。下面的代码里，我们创建了一个宽8高7的`Rectangle`实例并执行了`can_hold`方法，传入了一个宽5高1的`Rectangle`实例：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(larger.can_hold(&smaller));
    }
}
```

请注意`tests`模块内的`use super::*;`。`tests`模块是一个普通的模块，它遵循我们在第七章中讨论的规则。由于`tests`是一个内部模块，我们需要将外部模块的代码进行引入。我们在这里使用了通配符，所以任何我们在外部定义的内容都可以在`tests`模块中使用。

我们的测试函数名为`larger_can_hold_smaller`，其中我们创建了两个`Rectangle`实例。然后我们调用了`assert!`宏并传入了`larger.can_hold(&smaller)`的结果。这个表达式应当返回`true`，所以我们的测试应当通过，让我们来试试吧！

```
$ cargo test
   Compiling rectangle v0.1.0 (file:///projects/rectangle)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/rectangle-6584c4561e48942e)

running 1 test
test tests::larger_can_hold_smaller ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests rectangle

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

通过了！让我们再添加一个测试，这次我们断言一个小的多边形不能容纳一个大的多边形：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        // 略
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(!smaller.can_hold(&larger));
    }
}
```

由于这一次`can_hold`的正确返回值是`false`，我们需要对结果进行取反，然后传入`assert!`宏。结果当然是通过的：

```
$ cargo test
   Compiling rectangle v0.1.0 (file:///projects/rectangle)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/rectangle-6584c4561e48942e)

running 2 tests
test tests::larger_can_hold_smaller ... ok
test tests::smaller_cannot_hold_larger ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests rectangle

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

这两个测试都通过了！现在我们来尝试为代码引入一个漏洞。我们修改一下`can_hold`的实现，将其宽度的比较符号取反：

```rust
// 略
impl Rectangle {
    fn can_hold(self, &Rectangle) -> bool {
        self.width < other.width && self.height > other.height
    }
}
```

运行测试，结果如下：

```
$ cargo test
   Compiling rectangle v0.1.0 (file:///projects/rectangle)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/rectangle-6584c4561e48942e)

running 2 tests
test tests::larger_can_hold_smaller ... FAILED
test tests::smaller_cannot_hold_larger ... ok

failures:

---- tests::larger_can_hold_smaller stdout ----
thread 'tests::larger_can_hold_smaller' panicked at src/lib.rs:28:9:
assertion failed: larger.can_hold(&smaller)
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::larger_can_hold_smaller

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

测试用例发现了漏洞！由于`larger.width`值为`8`而`smaller.width`值为`5`，这个比较的结果导致`can_hold`返回了`false`。

## 使用`assert_eq!`和`assert_ne!`宏检查相等性

在测试中，将函数的的返回值和你期望的返回值进行比较是校验函数的一种常见方式。使用`assert!`宏和`==`运算符可以实现这个功能。但是，这种情况实在是太过于常见，所以标准库提过了一对宏————`assert_eq!`和`assert_ne!`————来更方便地处理这种情况。这些宏分别用于比较传入两个参数的相等性或不相等性。如果测试失败，它们还会将传入的两个值打印出来，方便调试；而`assert!`只能看到`==`表达式返回的`false`结果，也只能打印一个`false`。

在下面的代码中，我们开发了一个将参数进行加2操作的函数`add_two`，然后我们使用`assert_eq!`宏来测试这个函数。

```rust
pub fn add_two(a: usize) -> usize {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        let result = add_two(2);
        assert_eq!(result, 4);
    }
}
```

运行一下，测试通过了！

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

我们创建了一个名为`result`的变量来存储`add_two(2)`的结果。然后将`result`和`4`传递给`assert_eq!`。这个测试的输出为`test tests::it_adds_two ... ok`，`ok`表示测试通过。

我们来为代码引入一个漏洞，看看`assert_eq!`失败时的表现。把`add_two`函数的实现修改如下：

```rust
pub fn add_two(a: usize) -> usize {
    a + 3
}
```

再次运行：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::it_adds_two ... FAILED

failures:

---- tests::it_adds_two stdout ----
thread 'tests::it_adds_two' panicked at src/lib.rs:12:9:
assertion `left == right` failed
  left: 5
 right: 4
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::it_adds_two

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

我们的测试代码捕捉到了漏洞！`it_adds_two`测试失败了，控制台输出了``assertion `left == right` failed``和`left`、`right`的值。这个输出可以让我们快速开始调试：`left`参数是`add_two(2)`的结果，值为`5`，而`right`参数值为`4`。如果我们的用例很多，你可以想象一下这样的输出有多方便。

值得注意的是，在一些语言、测试框架里，值对比函数的参数会被称为`expected`和`actual`，它们控制了传入值的顺序。然而，在Rust里，它们被称为`left`和`right`，这样的设计弱化了传入值的顺序。我们可以将断言代码写作`assert_eq!(4, result)`，而错误信息仍然会显示``assertion `left == right` failed``。

`assert_ne!`宏会对比传入的两个值，如果它们不相等，测试通过，反之则失败。这个宏对于特定的情况也很有用，比如你*不知道*测试的结果是什么，但你知道测试的结果*不应该*是什么。例如，如果我们正在测试一个函数，该函数一定会以某种方式更改其输入，但更改的方式取决于我们运行测试的当天是星期几，那么最好的断言可能是函数的输出不等于输入。

在内部，`assert_eq!`和`assert_ne!`分别使用了`==`和`!=`。当测试结果失败时，它们会使用调试格式打印参数，也就是说，传入这两个宏的参数必须实现了`PartialEq`和`Debug`trait。所有的原始类型和大部分的标准库类型都实现了这些trait。对于用户自定义的结构体和枚举，你需要手动实现`PartialEq`来完成类型的比较断言。你也需要实现`Debug`来保证断言失败时的输出。由于这两个trait是可以自动派生的，所以我们通常只需要给结构体或枚举的定义上添加`#[derive(PartialEq, Debug)]`注解即可。附录C介绍了这些trait和更多的可派生trait。

## 添加自定义的错误信息

`assert!`、`assert_eq!`和`assert_ne!`都接收一个可选参数，允许我们自定义打印的错误信息。任何必填参数后面的参数都会传递给`format!`宏（第8章中讨论过的），因此你可以传递一个含`{}`占位符的字符串，并在其中插入任何你想打印的值。自定义信息对于断言的说明文档来说是十分有用的；当测试未通过时，你能更好地发现问题。

例如，如果有一个函数，它会与传入的名称打招呼，我们希望测试我们传入的值是否正确地出现在了输出中：

```rust
pub fn greeting(name: &str) -> String {
    format!("Hello {name}!")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("Carol");
        assert!(result.contains("Carol"));
    }
}
```

由于这个程序的需求还未达成一致，且我们已知打招呼的开始词`Hello`是一定会变化的。而当需求变化时，我们不希望测试用例也需要调整，所以我们没有检查`greeting`的结果的绝对相等性，而是检查了其结果是否包含我们传入的参数。

现在，我们通过移除`name`来为`greeting`引入一个漏洞：

```rust
pub fn greeting(name: &str) -> String {
    String::from("Hello!")
}
```

运行测试，输出如下：

```
$ cargo test
   Compiling greeter v0.1.0 (file:///projects/greeter)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.91s
     Running unittests src/lib.rs (target/debug/deps/greeter-170b942eb5bf5e3a)

running 1 test
test tests::greeting_contains_name ... FAILED

failures:

---- tests::greeting_contains_name stdout ----
thread 'tests::greeting_contains_name' panicked at src/lib.rs:12:9:
assertion failed: result.contains("Carol")
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::greeting_contains_name

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

输出结果只显示了测试失败的原因和相应断言的位置。但我们希望能看到更多来自`greeting`函数的实用信息。这时，我们就可以给断言函数传递一个新的参数，打印`greeting`函数的结果：

```rust
    #[test]
    fn greeting_contains_name() {
        let result = greeting("Carol");
        assert!(
            result.contains("Carol"),
            "Greeting did not contain name, value was `{result}`",
        )
    }
```

再次运行，我们就能看到更多实用的错误信息了：

```
$ cargo test
   Compiling greeter v0.1.0 (file:///projects/greeter)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.93s
     Running unittests src/lib.rs (target/debug/deps/greeter-170b942eb5bf5e3a)

running 1 test
test tests::greeting_contains_name ... FAILED

failures:

---- tests::greeting_contains_name stdout ----
thread 'tests::greeting_contains_name' panicked at src/lib.rs:12:9:
Greeting did not contain name, value was `Hello!`
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::greeting_contains_name

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

我们可以看到测试中我们实际得到的输出，它能够帮助我们更好的调试。

## 使用`should_panic`检查panic

除了检查返回值之外，检查我们的代码是否按照我们的预期处理了所有的错误情况也是很重要的。比如，回顾我们在第九章创建的类型`Guess`，假设所有使用了`Guess`的代码都认为它只能包含1到100的数字。那么我们可以书写一个测试来保证`Guess`实例不会超出这个范围。

我们可以给测试函数添加`should_panic`属性。这样的测试只会在内部函数panic时才会通过；反之则会失败。

下面的代码就是对`Guess::new`错误情况的测试：

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {value}.");
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

我们在`#[test]`的后面，测试函数的签名加上了`#[should_panic]`属性，让我们来看看结果。

```
$ cargo test
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running unittests src/lib.rs (target/debug/deps/guessing_game-57d70c3acb738f4d)

running 1 test
test tests::greater_than_100 - should panic ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests guessing_game

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

非常好！现在我们通过移除入参大于`100`的检查来为`new`函数引入一个漏洞：

```rust
// 略
impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!("Guess value must be between 1 and 100, got {value}.");
        }

        Guess { value }
    }
}
```

运行测试，结果是未通过：

```
$ cargo test
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.62s
     Running unittests src/lib.rs (target/debug/deps/guessing_game-57d70c3acb738f4d)

running 1 test
test tests::greater_than_100 - should panic ... FAILED

failures:

---- tests::greater_than_100 stdout ----
note: test did not panic as expected

failures:
    tests::greater_than_100

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

这种情况下，我们并没有得到非常有用的信息，但如果我们查看测试函数，我们就会看到`#[should_panic]`注解。这样就可以推断出测试失败的原因是函数没有panic。

使用了`should_panic`的测试可能会失真。如果你的函数本身确实存在问题（而非我们预期的问题）那么测试也可以通过。要想让`should_panic`的测试更加准确，我们可以给`should_panic`传入一个可选参数`expected`。这样测试本身就会确保错误信息包含了我们提供的信息。比如，假设下面的`Guess`代码会针对不同的情况进行携带不同错误信息的panic：

```rust
// 略
impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!(
                "Guess value must be greater than or equal to 1, got {value}."
            );
        } else if value > 100 {
            panic!(
                "Guess value must be less than or equal to 100, got {value}."
            );
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "less than or equal to 100")]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

这个测试会通过，因为我们传给`should_panic`属性的`expected`参数是`Guess::new`panic错误信息的子串。我们也可以输入完整的错误信息，也就是`Guess value must be less than or equal to 100, got 200.`。要传入何种比例的错误信息取决于你希望这个用例有多准确，以及错误信息有多动态。在本例中，错误信息已经足够确保错误发生在`else if value > 100`这个分支中。

为了看看`should_panic`的`expected`信息和实际信息不符而失败的情况，我们把代码的错误信息交换，即：

```rust
        if value < 1 {
            panic!(
                "Guess value must be less than or equal to 100, got {value}."
            );
        } else if value > 100 {
            panic!(
                "Guess value must be greater than or equal to 1, got {value}."
            );
        }
```

这一次测试无法通过：

```
$ cargo test
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/guessing_game-57d70c3acb738f4d)

running 1 test
test tests::greater_than_100 - should panic ... FAILED

failures:

---- tests::greater_than_100 stdout ----
thread 'tests::greater_than_100' panicked at src/lib.rs:12:13:
Guess value must be greater than or equal to 1, got 200.
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
note: panic did not contain expected string
      panic message: `"Guess value must be greater than or equal to 1, got 200."`,
 expected substring: `"less than or equal to 100"`

failures:
    tests::greater_than_100

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

错误信息告诉我们，尽管程序和我们预测的一样panic了，但其panic携带的错误信息并没有包括字符串`less than or equal to 100`。我们实际收到的错误信息是`Guess value must be greater than or equal to 1, got 200.`。这下我们就知道漏洞的根本问题所在了！

## 使用`Result<T, E>`来测试

目前为止，我们的测试都会在失败时panic。我们也可以选择使用`Result<T, E>`！下面的例子使用`Result<T, E>`重写了之前的一个测试函数，这次函数没有panic，而是返回了一个`Err`：

```rust
    #[test]
    fn it_works() -> Result<(), string> {
        let result = add(2, 2);

        if result == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
```

`it_works`函数的返回值被修改为了`Result<T, E>`。在函数体内，我们无需调用`assert_eq!`宏，而是在测试通过时返回`Ok(()`，测试失败时返回一个包含了`String`的`Err`。

允许测试函数返回`Result<T, E>`也让我们有了在测试函数中使用`?`操作符的能力，这可以大大提升测试代码书写的便捷性，任何失败的操作都会返回`Err`变体。

你也可以在使用了`#[should_panic]`注解的测试上使用`Result<T, E>`。如果要断言一个函数返回了`Err`变体，*不要*在`Result<T, E>`值上使用`?`操作符。使用`assert!(value.is_err())`来替代。

现在你了解了各种书写测试的方式，让我们来看看我们运行测试时发生了什么，以及`cargo test`命令的不同选项。

::: details 小测（2）

<QuizProvider>
<Quiz>
<template #description>

解析：这个注解让cargo理解了将这个函数看做测试函数而不是源码。

</template>
<template #quiz>

要将一个函数标注为单元测试，你需要使用什么标注？

<Input answer="#[test]" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：Rust中不存在`should_err`，任何返回`Result`的测试都必须返回`Ok`才能通过。

</template>
<template #quiz>

现有函数签名如下：

```rust
fn f(x: usize) -> Result<usize, String>;
```

如果你希望断言`f(0)`返回`Err(_)`。下面哪一个代码片段是**错误**的？

<Radio>
<Option answer>

```rust
#[test]
#[should_err]
fn test() -> Result<usize, String> {
    f(0)
}
```

</Option>

<Option>

```rust
#[test]
#[should_panic]
fn test() {
    f(0).unwrap();
}
```

</Option>

<Option>

```rust
#[test]
fn test() {
    assert!(match f(0) {
        Ok(_) => false,
        Err(_) => true
    });
}
```

</Option>

<Option>

```rust
#[test]
fn test() {
    assert!(f(0).is_err());
}
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>

:::
