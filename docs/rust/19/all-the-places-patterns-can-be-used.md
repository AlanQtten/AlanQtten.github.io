<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile
} from "../../components/quiz"

</script>

# 所有可以使用模式的地方

模式会出现在Rust中的各种地方，在不知不觉中你已经和它们打过不少交道了！这一节会讨论所有可以使用模式的地方。

## `match`的分支

就像我们在第6章讨论的一样，我们可以在`match`的分支中使用模式。通常来说，`match`表达式的定义包括`match`关键字、一个待匹配的值和一些匹配分支，匹配分支就由模式和表达式组成，如果值和分支的模式匹配，那么表达式就会运行，比如：

```rust
match VALUE {
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
}
```

比如下面就是一个在第6章见过的表达式，它对类型为`Option<i32>`的变量`x`进行了匹配：

```rust
match x {
    None => None,
    Some(i) => Some(i + 1),
}
```

这个`match`表达式里的模式就是箭头左边的`None`和`Some(i)`。

`match`表达式的要求之一就是它们需要*详细*，即`match`所匹配值的所有可能性都需要被考虑到。一个保证这一点的办法是在最后一个分支里处理所有余下的情况，一个匹配任何值的变量名，这样就覆盖了所有的可能性。

特殊的模式`_`可以匹配一切，但它永远无法绑定给一个变量，所以它常常被放在match的最后一个分支里。`_`模式对于你希望忽略所有非特定值的情况来说很实用。我们会在后面详细讨论。

## 条件性`if let`表达式

在第6章我们介绍`if let`表达式时，主要是将其作为`match`只匹配单个情况时的简写。但`if let`也有可选的`else`分支，其中的代码会在`if let`没有匹配到的情况下执行。

下面的代码展示了`if let`、`else if`和`else if let`表达式混用的情况。这样给了`match`表达式足够的灵活度，可以让单个值和各种模式匹配。同时，Rust也不会强制要求`if let`、`else if`和`else if let`互相相关联。

下面的代码根据一系列的条件检查判断最终该选择的背景色。在这个例子中，我们创建了一些写死值的变量，真实情况下这些值可能来自用户输入。

```rust
fn main() {
    let favorite_color: Option<&str> = None;
    let is_tuesday = false;
    let age: Result<u8, _> = "34".parse();

    if let Some(color) = favorite_color {
        println!("Using your favorite color, {color}, as the background");
    } else if is_tuesday {
        println!("Tuesday is green day!");
    } else if let Ok(age) = age {
        if age > 30 {
            println!("Using purple as the background color");
        } else {
            println!("Using orange as the background color");
        }
    } else {
        println!("Using blue as the background color");
    }
}
```

如果用户指定了最喜欢的颜色，那么这个颜色会被设置为背景色。如果没有指定且今天是周二，那么背景色为绿色。否则，如果用户指定了他的年龄，且我们可以成功地将其转为数字，那么我们会根据数字的大小来决定使用紫色还是橘色。如果这些条件都不满足，那么背景色会被设置为蓝色。

这样的条件结构可以让我们实现复杂的需求。由于这里我们的值是写死的，所以最终例子会输出`Using purple as the background color`。

你会发现`if let`对影子变量的使用和`match`的分支一致：`if let Ok(age) = age`中引入了一个新的影子变量`age`，它被包裹在`Ok`变体中。这也就意味着我们需要将`if age > 30`放置在后续的代码块里：我们不能书写类似`if let Ok(age) = age && age > 30`的代码，因为`age`在新的作用域（大括号）开始时才可以使用。

使用`if let`表达式的劣势在于，编译器不会像对`match`表达式一样检查其是否详细了。如果我们省略了最后的`else`代码，进而忽略了一些边缘情况，编译器就无法针对一些潜在的逻辑问题发出警告了。

## `while let`条件循环

和`if let`的情况类似，`while let`条件循环允许`while`循环在模式匹配成功地情况下无限地运行。下面的代码里，我们编写了`while let`循环，将集合当做栈来使用，并按照和插入时相反的方向打印栈里的数据：

```rust
    let mut stack = Vec::new();

    stack.push(1);
    stack.push(2);
    stack.push(3);

    while let Some(top) = stack.pop() {
        println!("{top}");
    }
```

这个例子会打印3、2、1。`pop`方法会获取集合的最后一个元素，并返回`Some(value)`。如果集合为空，那么`pop`会返回`None`。`while`循环会无限执行，只要`pop`返回`Some`。当`pop`返回`None`时，循环会停止。我们可以使用`while let`来推出栈内的所有元素。

## `for`循环

在一个`for`循环里，`for`关键字后跟随的值就是模式。比如，在`for x in y`里，`x`就是模式。下面的代码展示了如何在`for`循环中使用模式进行结构，或者说分解一个元组，作为`for`循环的一部分：

```rust
    let v = vec!['a', 'b', 'c'];

    for (index, value) in v.iter().enumerate() {
        println!("{value} is at index {index}");
    }
```

上面的代码会打印如下内容：

```
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.52s
     Running `target/debug/patterns`
a is at index 0
b is at index 1
c is at index 2
```

我们使用`enumerate`方法创建了一个迭代器，它会提供值和值的下标，将其封装为元组。比如第一个值就是元组`(0, 'a')`。当这个值匹配了模式`(index, value)`时，`index`为`0`，而`value`为`'a'`，你可以在打印内容的第一行看到。

## `let`声明

在本章，我们只讨论了使用`match`和`if let`来进行模式匹配的方式，实际上，我们也可以在其他地方使用模式，包括`let`声明。比如，下面是一个简单的`let`声明语句：

```rust
let x = 5;
```

你在这么使用`let`时，其实就是在使用模式，尽管你自己没有意识到！更通俗地讲，`let`声明的格式如下：

```rust
let PATTERN = EXPRESSION;
```

在类似`let x = 5`这样的声明里，变量名就属于`PATTERN`插槽，一个变量名就是就简单的模式。Rust会将表达式和模式进行比较，然后赋值给其找到的名字。比如在`let x = 5;`里，`x`就是一个表示“将匹配到的内容绑定给变量`x`”的模式。由于名称`x`就是完整的模式，所以这里也可以理解为“不管值为什么，都可以绑定给`x`”。

要从`let`的角度更清晰地明白模式是如何匹配的，可以看看下面的使用`let`来解构元组的例子：

```rust
    let (x, y, z) = (1, 2, 3);
```

这里，我们使用模式来匹配一个元组。Rust会将值`(1, 2, 3)`和模式`(x, y, z)`进行比较，查看和模式匹配的值，进而将`1`绑定给`x`，`2`绑定给`y`，`3`绑定给`z`。你可以把这个元组的模式看做三个独立的变量模式的嵌套。

如果模式里的元素数量和元组的元素数量不匹配，那么类型就无法匹配，会发生编译错误。比如，下面的代码就是一个尝试将一个含有三个元素的元组和两个变量的模式进行匹配，这是行不通的。

```rust
    let (x, y) = (1, 2, 3);
```

这样的代码会引发如下编译错误：

```
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
error[E0308]: mismatched types
 --> src/main.rs:2:9
  |
2 |     let (x, y) = (1, 2, 3);
  |         ^^^^^^   --------- this expression has type `({integer}, {integer}, {integer})`
  |         |
  |         expected a tuple with 3 elements, found one with 2 elements
  |
  = note: expected tuple `({integer}, {integer}, {integer})`
             found tuple `(_, _)`

For more information about this error, try `rustc --explain E0308`.
error: could not compile `patterns` (bin "patterns") due to 1 previous error
```

要修复这个问题，我们需要使用`_`或者`..`忽略元组中的一个或多个元素，你会在本章的后面部分看到。如果我们的模式中有太多变量，那么就只能移除变量的数量，使其和元组的元素数量一致。

## 函数参数

函数参数也可以使用模式。在下面的代码里，我们声明了函数`foo`，它接收一个`i32`类型的参数`x`，现在这样的代码对你来说应该很熟悉了：

```rust
fn foo(x: i32) {
    // 代码
}
```

`x`的部分就是模式！就像我们在`let`中做的一样，我们也可以在函数的参数中使用模式来匹配元组。下面的代码就将我们传递给函数的元素进行了拆分：

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("Current location: ({x}, {y})");
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);
}
```

这段代码会打印`Current location: (3, 5)`。值`&(3, 5)`会和模式`&(x, y)`相匹配，所以`x`的值为`3`，`y`的值为`5`。

我们也可以在闭包的参数列表中使用模式，其方式方法和在函数的参数列表中一样，因为我们在第13章讨论过，闭包和函数非常相似。

现在，你已经看到了各种各样的模式使用了，但是模式在各种地方的使用并不是完全一致的。在某些地方，模式是不可反驳的；在其他的情况下，模式可以是可反驳的。我们会在下一节讨论着两个概念。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：这段代码是一个使用`while let`和`let`进行匹配的例子。你也可以将它们结合使用，比如：

```rust
while let Some((_, n)) = v.next() {
    /* ... */
}
```

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut v = vec![(1, 2), (3, 4)].into_iter();
    let mut sum = 0;
    while let Some(t) = v.next() {
        let (_, n) = t;
        sum += n;
    }
    println!("{sum}");
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: '6'
  }"
/>

</template>
</Quiz>
</QuizProvider>
:::
