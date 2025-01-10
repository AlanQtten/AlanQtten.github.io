<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  Input
} from "../../components/quiz"
</script>

# 控制测试的运行

就像`cargo run`编译你的代码、运行产生的二进制文件一样，`cargo test`也会编译你的测试代码，然后运行相应的二进制文件。`cargo test`默认会并行运行所有的测试，同时捕获其中的输出，避免其直接输出，让用户可以只浏览和测试有关的输出信息。然而，你也可以通过行内参数来修改这个默认行为。

一部分参数会传递给`cargo test`，而另一部分参数会传递给最终的二进制文件。为了区分这两种参数，需要先列出传递给`cargo test`的参数，然后用分隔符`--`，再列出传递给测试二进制文件的参数。运行`cargo test --help`可以查看所有可以用在`cargo test`中的参数，而使用`cargo test -- --help`可以查看所有可以用在二进制文件中的参数。

## 串行/并行运行测试

让运行多个测试时，默认会使用多线程进行并行运行，这样运行的速度更快，结果自然也更快看到。由于测试同一时间运行，你必须确保你的测试不存在互相依赖或共享状态，包括共享的环境，比如当前的工作区，或者环境变量。

比如，如果你要测试的每个函数都会在磁盘上创建一个名为*file-output.txt*的文件，并向其中写入一些数据。然后每个测试都断言这个文件包含某某值（此值在每个测试中是不同的）。由于测试同时运行，一个测试可能会在另一个测试断言前覆写文件数据，或在另一份代码运行后读取文件数据。这种情况下另一个测试会失败，但并不是因为代码存在漏洞，而是因为测试在运行期间存在互相干涉。一个解决的方案就是让每个函数操作不同的文件；另一个办法就是让测试代码串行运行。

如果你不想让测试代码并行运行，或者你希望控制其运行时候的线程数，你可以使用`--test-threads`参数，它的值就是你希望使用的线程数。比如：

```bash
$ cargo test -- --test-threads=1
```

我们这里设置为了`1`，也就以为着这个程序不需要任何的并行性。使用一个单独的线程会比并行花费更多的时间，但如果测试存在共享状态，这样做就会避免他们互相干涉。

## 显示函数输出

默认情况下，如果一个测试通过了，Rust的测试库会捕获所有的标准输出。比如，如果我们在测试函数中调用了`println!`，且测试通过了，那么我们不会在终端看到`println!`的输出；我们只会看到提示我们测试通过的输出。如果测试失败了，我们会看到所有输出，以及错误信息。

下例是一个傻瓜函数，他会打印自己的参数并返回10，后面是一个会通过的用例和一个会失败的用例：

```rust
fn prints_and_returns_10(a: i32) -> i32 {
    println!("I got the value {a}");
    10
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn this_test_will_pass() {
        let value = prints_and_returns_10(4);
        assert_eq!(value, 10);
    }

    #[test]
    fn this_test_will_fail() {
        let value = prints_and_returns_10(8);
        assert_eq!(value, 5);
    }
}
```

使用`cargo test`运行，输出如下：

```
$ cargo test
   Compiling silly-function v0.1.0 (file:///projects/silly-function)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running unittests src/lib.rs (target/debug/deps/silly_function-160869f38cff9166)

running 2 tests
test tests::this_test_will_fail ... FAILED
test tests::this_test_will_pass ... ok

failures:

---- tests::this_test_will_fail stdout ----
I got the value 8
thread 'tests::this_test_will_fail' panicked at src/lib.rs:19:9:
assertion `left == right` failed
  left: 10
 right: 5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::this_test_will_fail

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

可以看到输出中并没有`I got the value 4`，因为它属于一个已通过测试的输出。这样的输出会被捕获。而属于失败测试的输出`I got the value 8`，则会在测试总结的部分显示，同时也显示了测试失败的原因。

如果在测试通过时，你也希望看到输出，那么你可以使用`--show-output`参数：

```bash
$ cargo test -- --show-output
```

使用`--show-output`运行，输出如下：

```
$ cargo test -- --show-output
   Compiling silly-function v0.1.0 (file:///projects/silly-function)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.60s
     Running unittests src/lib.rs (target/debug/deps/silly_function-160869f38cff9166)

running 2 tests
test tests::this_test_will_fail ... FAILED
test tests::this_test_will_pass ... ok

successes:

---- tests::this_test_will_pass stdout ----
I got the value 4

successes:
    tests::this_test_will_pass

failures:

---- tests::this_test_will_fail stdout ----
I got the value 8
thread 'tests::this_test_will_fail' panicked at src/lib.rs:19:9:
assertion `left == right` failed
  left: 5
 right: 10
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::this_test_will_fail

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

## 根据名称运行部分测试

有时候，运行完整的测试需要花费很长时间。如果你当前在集中精力开发某一部分代码，你可能只希望运行和它们相关的测试。你可以给`cargo test`传递你想运行的测试（或测试们）的名字，决定运行哪些测试。

要示范如何运行部分测试，我们先为我们的`add_two`函数创建三个测试用例：

```rust
pub fn add_two(a: usize) -> usize {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_two_and_two() {
        let result = add_two(2);
        assert_eq!(result, 4);
    }

    #[test]
    fn add_three_and_two() {
        let result = add_two(3);
        assert_eq!(result, 5);
    }

    #[test]
    fn one_hundred() {
        let result = add_two(100);
        assert_eq!(result, 102);
    }
}
```

不传递任何参数，那么此时的输出和之前类似，所有的用例并行运行：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.62s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 3 tests
test tests::add_three_and_two ... ok
test tests::add_two_and_two ... ok
test tests::one_hundred ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### 运行单个测试

我们可以给`cargo test`传递测试函数的名字来确保只运行那个测试：

```
$ cargo test one_hundred
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.69s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::one_hundred ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out; finished in 0.00s
```

只有测试名为`one_hundred`的测试会被运行；其他两个测试和这个名字不匹配。测试的输出结果也显示了`2 filtered out`来让我们了解到有多少测试没有运行。

我们无法通过这种方式指定多个测试的名字；只有传递给`cargo test`的第一个值会被使用。运行多个测试另有他法。

### 通过过滤运行多个测试

我们可以指定测试的一部分，任何和这一部分匹配的测试函数都会运行。比如，由于我们的两个测试名称都包含`add`，我们可以通过`cargo test add`来运行它们：

```
$ cargo test add
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 2 tests
test tests::add_three_and_two ... ok
test tests::add_two_and_two ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s
```

这个命令会运行所有名称内包含`add`的测试，而`one_hundred`测试则被过滤掉了。注意测试所处的模块也会被作为测试名的一部分，因此我们可以通过模块名来指定运行某个模块下的测试。

## 未特殊指定时忽略部分测试

有时候一些测试是非常耗时的，你可能希望在大部分情况下忽略它们。与其将所有想要运行的测试一一列出，不如使用`ignore`属性来排除测试，例如：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 3);
        assert_eq!(result, 4);
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // 需要很长时间的代码
    }
}
```

在`#[test]`后，我们添加了`#[ignore]`行来标注这个测试是被忽略的。现在当我们运行测试时，`it_works`会运行，而:`expensive_test`则不会运行：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.60s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 2 tests
test tests::expensive_test ... ignored
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

`expensive_test`被列为`ignored`。如果我们希望只运行被忽略的测试，可以使用`cargo test -- --ignored`：

```
$ cargo test -- --ignored
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test expensive_test ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

通过控制测试的运行与否，你可以确保你的`cargo test`可以尽快结束。等到你需要检查`ignored`测试的结果且有充足时间等待时，你可以使用`cargo test -- --ignored`。如果你希望运行所有的测试，不管它们有没有被忽略，那么你可以使用`cargo test -- --include-ignored`。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：默认情况下，测试会并行运行，所以不具备线程安全的行为（比如对单一文件进行写入）可能会存在失败的情况。

</template>
<template #quiz>

如果你运行了没有任何参数的`cargo test`，在多次测试后下面哪一项可能不会正常工作？

<Radio>
<Option label="由于panic而失败" />
<Option label="使用标准输出打印字符串" />
<Option label="对同一个文件写入文本" answer />
<Option label="从同一个数据库读取数据" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：存在于`test_the_logger`和`test_the_database`而不存在于`test_logger_and_database`的最小字符串是`h`（`the`的中间字母）。

</template>
<template #quiz>

下面是一个程序中的单元测试：

```rust
#[test]
fn test_the_logger() { /* ... */ }

#[test]
fn test_the_database() { /* ... */ }

#[test]
fn test_logger_and_database() { /* ... */ }
```

如果你只需要对`test_the_logger`和`test_the_database`进行测试，你应该给`cargo test <the_string>`传递的*最短*字符串是？

<Input answer="h" />

</template>
</Quiz>
</QuizProvider>
:::
