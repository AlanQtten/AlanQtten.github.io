<script setup>
import {
  QuizProvider,
  Quiz,
  RadioHolder,
  Radio
} from "../../components/quiz"
</script>
# 使用`if let`简化流程控制

`if let`语法可以将`if`和`let`结合成一种更加简洁的方式，它能处理一部分值，忽略其他值。举例来说，下面的程序在一个`Option<u8>`上使用了match语法，但只希望`config_max`为Some变体且有值的情况下执行程序：

```rust
    let config_max = Some(3u8);
    match config_max {
        Some(max) => println!("The maximum is configured to be {}", max),
        _ => (),
    }
```

如果值是`Some`，我们通过将值绑定给变量`max`打印出`Some`变体的值。而对`None`的情况，我们什么都不做。为了满足`match`表达式的语法，我们必须在处理第一个变体后增加`_ => ()`，这种模版化的代码加起来很无聊。

作为替代，我们可以简写为`if let`。下面的代码和之前的`match`完全相同：

```rust
    let config_max = Some(3u8);
    if let Some(max) => config_max {
        println!("The maximum is configured to be {}", max);
    }
```

`if let`语法会接收一个模式和一个表达式，用等号分隔。它和`match`的工作原理完全相同，表达式就是`match`中的表达式，而模式就是第一个分支。比如在上面的例子中，模式就是`Some(max)`，`max`绑定到了`Some`内部的值。我们可以在`if let`的代码块中使用这个变量，和`match`的分支中一样。如果值没有匹配到，那么`if let`后的代码块不会执行。

使用`if let`标识更少的字符，更少的缩进，更少的模版代码。然而，`match`强制的完整性检查丢失了。`match`和`if let`的使用选择取决于你处理的场景，以及丢掉检查换取的简便性值不值得。

换句话说，你可以将`if let`看做`match`只关心一个匹配模式、忽略其他值时的语法糖。

我们可以为`if let`添加一个`else`。`else`的代码块相当于`match`中`_`跟随的代码块。回顾`Quarter`变体存储了`UsState`值的`Coin`枚举。如果我们想要统计所有非25分的硬币数量，但对25分硬币的处理不变，使用`match`可以进行如下表示：

```rust
    let mut count = 0;
    match cion {
        Coin::Quarter(state) => println!("State quarter from {:?}!", state),
        _ => count += 1,
    }
```

使用`if let`表达式，可以如下表示：

```rust
    let mut count = 0
    if let Coin::Quarter(state) = coin {
        println("State quarter from {:?}!", state);
    }else {
        count += 1;
    }
```

如果你的代码逻辑使用`match`会看起来太啰嗦，记住`if let`也是你的工具之一。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：如果函数只在某个条件下执行，那么使用`if let`是更符合语义的

</template>
<template #quiz>

对于下面的函数，哪一种流程控制语句更符合语义？

```rust
enum Location {
    Point(i32),
    Range(i32, i32)
}

fn print_range_max(loc: &location) {
    // 如果loc是一个Range变体，打印它的第二个字段
}
```

<RadioHolder>
<Radio label="match" />
<Radio label="if let" answer />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：如果函数需要对各种情况进行返回，那么使用`match`更符合语义。

</template>
<template #quiz>

对于下面的函数，哪一种流程控制语句更符合语义？

```rust
enum Location {
    Point(i32),
    Range(i32, i32)
}

fn print_range_max(loc: &location) -> i32 {
    // 如果loc是Range，返回它的第一个字段
    // 如果loc是Point，返回它唯一的字段
}
```

<RadioHolder>
<Radio label="match" answer />
<Radio label="if let" />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::

## 总结

我们已经了解了如何使用枚举来创建自定义类型、穷举一系列的值。我们已经展示了标准库的`Option<T>`是如何为你避免错误的。当枚举的变体持有值时，你可以根据不同的情况，选择`match`或`if let`来取出并使用这些值。

你的Rust程序已经可以使用结构体和枚举来表达你所在领域的各种概念了。在你的API中创建和使用自定义类型可以保证类型安全：编译器会确保你的函数只会传入其期望的类型。

为了提供组织结构清晰的API，并让你的用户开箱即用，按需加载，让我们看看Rust的模块化系统。
