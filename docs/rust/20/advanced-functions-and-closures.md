<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"
</script>

# 闭包和函数进阶

本节会讲解一些与函数和闭包有关的进阶特性，包含函数指针和返回闭包。

## 函数指针

我们已经讨论过了如何给函数传递闭包；但你也可以给函数传递常规函数！这样的技术很有用，因为往往你要传递的是已经声明的函数，而不是一个新定义的闭包。函数会强转为类型`fn`（f是小写的），避免和闭包trait`Fn`混淆。`fn`类型被称为*函数指针（function pointer）*。使用函数指针可以让你在函数里像使用其他参数一样使用函数。

声明参数为函数指针的语法和闭包的语法类似，代码如下，我们定义了一个函数`add_one`，它的功能是将参数加一后返回。而`do_twice`则接受两个参数：一个函数指针，接收任何接收一个`i32`参数且返回一个`i32`的函数，以及一个`i32`值。`do_twice`函数会调用`f`两次，并将`arg`值传递给它，然后将两次函数的结果进行相加。`main`函数会调用`do_twice`函数，传入`add_one`和`5`。

```rust
fn add_one(x: i32) -> i32 {
    x + 1
}

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}

fn main() {
    let answer = do_twice(add_one, 5);

    println!("The answer is: {answer}");
}
```

这段代码会打印`The answer is: 12`。我们声明了`do_twice`函数的参数`f`是一个`fn`，且其接收一个`i32`作为参数，并返回一个`i32`。然后我们在`do_twice`的函数体内调用了`f`。在`main`函数中，我们将`add_one`传入了`do_twice`，作为其第一个参数。

和闭包不同的是，`fn`是一个类型，而不是一个trait，所以我们直接了`fn`作为参数类型，而不是声明一个泛型函数，然后使用`Fn`trait作为trait边界。

函数指针实现了全部三个闭包trait（`Fn`、`FnMut`和`FnOnce`），也就是说你永远可以将函数指针传递给一个接收闭包作为参数的函数。

话虽如此，但有一种情况你可能只希望接受`fn`类型而不是闭包，那就是在与不支持闭包的外部代码交互时：例如C语言的函数可以接收函数作为参数，但C并不支持闭包。

举一个你可以使用行内定义的闭包或者具名函数的例子，由标准库的`Iterator`trait提供的`map`方法。要使用`map`方法来将一个数字集合转成字符串集合，我们可以使用闭包：

```rust
    let list_of_numbers = vec![1, 2, 3];
    let list_of_strings: Vec<String> =
        list_of_numbers.iter().map(|i| i.to_string()).collect();
```

或者我们也可以直接将一个具名函数传入`map`，比如：

```rust
    let list_of_numbers = vec![1, 2, 3];
    let list_of_strings: Vec<String> =
        list_of_numbers.iter().map(ToString::to_string).collect();
```

注意这里需要使用我们前面提到过的完全限定语法，因为有很多可用的函数都命名为`to_string`。这里，我们使用了定义在`ToString`trait上的`to_string`函数，标准库会为任何实现了`Display`的类型实现这个方法。

回顾第六章我们对枚举的介绍，每个枚举的变体都会变为一个初始化函数。我们可以使用这些函数作为实现了闭包traits的函数指针，也就是说我们可以将初始化函数传入接收闭包作为参数的函数，比如：

```rust
    enum Status {
        Value(u32),
        Stop,
    }

    let list_of_statuses: Vec<Status> = (0u32..20).map(Status::Value).collect();
```

这里我们为范围内的`u32`值调用`map`，传入初始化函数，创建了`Status::Value`实例。有些人会更喜欢这种风格，有些人更喜欢闭包。它们会被编译为同样的代码，所以你可以按照自己的喜好选择。

## 返回闭包

闭包可以使用trait来表示，也就是说你不能直接返回闭包。在大部分场景下，如果你想返回一个trait，你可以使用实现了那个trait的确定的类型作为函数的返回。然而，你不能在这种情况下使用闭包，因为它们没有明确的类型可以返回。

下面的代码是一段尝试直接返回闭包的代码，它会编译失败：

```rust
fn returns_closure() -> dyn Fn(i32) -> i32 {
    |x| x + 1
}
```

编译器抛出错误如下：

```
$ cargo build
   Compiling functions-example v0.1.0 (file:///projects/functions-example)
error[E0746]: return type cannot have an unboxed trait object
 --> src/lib.rs:1:25
  |
1 | fn returns_closure() -> dyn Fn(i32) -> i32 {
  |                         ^^^^^^^^^^^^^^^^^^ doesn't have a size known at compile-time
  |
help: consider returning an `impl Trait` instead of a `dyn Trait`
  |
1 | fn returns_closure() -> impl Fn(i32) -> i32 {
  |                         ~~~~
help: alternatively, box the return type, and wrap all of the returned values in `Box::new`
  |
1 ~ fn returns_closure() -> Box<dyn Fn(i32) -> i32> {
2 ~     Box::new(|x| x + 1)
  |

For more information about this error, try `rustc --explain E0746`.
error: could not compile `functions-example` (lib) due to 1 previous error
```

这个错误再次提到了`Sized`trait！Rust不知道需要多少空间来存储这个闭包。我们已经介绍了如何处理这种情况，使用trait对象即可：

```rust
fn returns_closure() -> Box<dyn Fn(i32) -> i32> {
    Box::new(|x| x + 1)
}
```

这样的代码可以正常编译。如果你忘记了trait对象的相关内容，可以回顾第18章。

接着，我们来看看宏！

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：带有上下文的闭包可以被传入`register2`，但只有定级函数（或者无上下文的闭包）可以被传入`register1`。

</template>
<template #quiz>

假设现在要实现`register`函数，以下面两种方式接收回调：

```rust
fn register1(cb: fn(Event) -> ());
fn register2<F>(cb: F) where F: Fn(Event) -> ();
```

哪一个签名接收的参数范围更广？

<Radio>
<Option label="它们是一样的" />
<Option label="register1" />
<Option label="register2" answer />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
