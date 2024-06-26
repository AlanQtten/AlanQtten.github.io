<script setup>
import ShikiCode from "../../components/code/ShikiCode.vue"
import { lr } from "../../utils/renderer"
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  RadioHolder,
  Radio
} from "../../components/quiz"

</script>

# `match`: 流程控制结构

Rust内置了一个极其强大的流程控制结构叫做`match`，它允许你将一个值和各种模式进行匹配，并根据匹配的情况执行不同的代码。匹配的内容包括字面量，变量，通配符等等，第十八章会详细讨论模式匹配的各种情况。`match`的强大就在于各种丰富的匹配规则，以及编译器能够通过它确保所有的情况都被考虑了。

可以把`match`表达式想象成一个硬币分类机：硬币调进来，机器内部有不同大小的洞，硬币会从上到下穿过各个洞。`match`同理，值从上到下进行匹配，匹配到了第一个“适合”的，就执行其中的代码。

既然说到了硬币，我们就使用它们来开发一个`match`的例子！下面的函数接收一个不确定价值的美国硬币，然后，就像硬币分类机一样，判断出硬币的价值并以数字形式返回：

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

让我们拆解`value_in_cents`函数中的`match`。首先我们写了`match`关键字，后面跟随了一个表达式，也就是值`coin`本身。这里表面上可能跟`if`的使用方式有些相似，其实有很大不同：使用`if`时，后面的条件值必须为布尔值，但是这里可以为任何类型。比如这个例子里的`coin`就是一个`Coin`枚举类型，而这个类型是我们在第一行定义的。

然后是`match`的分支。一个分支由两部分组成：一个匹配模式和一些代码。比如第一个分支的匹配模式是当值为`Coin::Penny`，`=>`操作符用来分割匹配模式和要运行的代码。第一个分支的代码只有值`1`。每一个分支和后面的分支使用逗号隔开。

当`match`表达式执行时，它会将按照顺序值放入每个分支的匹配模式进行比较。如果一个某个模式匹配了，那么对应的代码就会被执行。如果没有匹配，那么会直接进入下一个分支，和硬币分类机一样。我们可以随自己的心意随意设置分支的数量，在上面的代码中，我们的`match`有4个分支。

每一个分支关联的代码都是一个表达式，匹配到的分支后面的表达式计算的结果会作为整个`match`表达式的结果。

如果表达式太短，我们可以不用大括号包裹，类似上面的代码，我们只返回了一个值。但如果你希望执行多行代码，那么你必须使用大括号，而分支之间的逗号则可有可无了。比如，下面的代码会在每一次命中`Coin::Penny`时打印“Lucky penny!”，但仍保持返回值为1：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

## 绑定了值的模式匹配

`match`的分支还有另一个很实用的功能，它可以绑定匹配到的值。这也是我们从枚举变体中取值的方法。

举个例子，让我们对我们的枚举稍作修改，在其中放入些许数据。从1999年到2008年，美国的50个州在25美分其中一面的设计上各有不同。而其他的硬币都没有这种待遇，只有25美分。我们可以修改`Quarter`变体的格式，来包含`UsState`的信息：

```rust
#[derive(Debug)] // 便于后续调试
enum UsState {
    Alabama,
    Alaska,
    // 略
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}
```

假设有一位朋友想要收集50个州的25分硬币。当我们根据硬币的类型进行分类的同时，我们也希望喊出每个25分硬币关联的州名，这样就能让朋友看看他是否有这种硬币。

这一次的代码，我们在`Coin::Quarter`变体的后面添加了一个变量`state`。当`Coin:Quarter`匹配到了，`state`变量会绑定到对应的州上。然后我们就可以在对应的代码体中使用`state`：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}
```

如果我们调用了`value_in_cents(Coin::Quarter(UsState::Alaska))`，`coin`就等于`Coin::Quarter(UsState::Alaska)`。当我们在`match`的各个分支中进行比较时，会匹配到`Coin::Quarter(state)`。这时，`state`的值就是`UsState::Alaska`。我们可以在`println!`表达式中使用它，这样就得到了`Coin`枚举中`Quarter`变体包裹的值。

## `Option<T>`的匹配

在之前的章节中，我们讨论过对在使用`Option<T>`时对`Some`中`T`值的获取；使用`match`也可以处理`Option<T>`，和我们处理`Coin`枚举的方式一样！只不过这一次不是对比硬币，对比的是`Option<T>`的变体，但`match`表达式的工作原理是相同的。

假设我们要写一个函数，它接收一个`Option<i32>`，如果有值。为这个值加1。如果没有值，那么返回`None`，不进行其他操作。

这样的函数配合`match`很容易就能写出来：

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let five = Some(5);
let six = plus_one(five);
let none = plus_one(None);
```

仔细观察`plus_one`的细节。当我们调用`plus_one(five)`时，变量`x`的值为`Some(5)`。它会与第一个分支比较：

```rust
        None => None,
```

`Some(5)`和`None`不匹配，所以继续进行下一个分支：

```rust
        Some(i) => Some(i + 1),
```

`Some(5)`和`Some(i)`匹配吗？匹配！它们的变体相同，`i`绑定到了`Some`包裹的值上，即`5`。之后分支后的代码会执行，我们会给`i`的值加1，并创建一个新的`Some`来存储这个`6`。

而另一次`plus_one`的调用，`x`为`None`。同样的，它会进入`match`并与第一个分支比较：

```rust
        None => None,
```

匹配了！没有值需要做加法，所以函数结束，在`=>`的右侧返回了`None`值。因为第一个分支匹配了，其他分支也不会再进行比较了。

将`match`和枚举进行结合使用的场景非常多。你会在Rust代码中大量看到这种范式：`match`和枚举一起使用，并绑定变体内部的值，然后在分支代码中使用它。可能一开始这样的做法有点别扭，但等你习惯了这种方式，你会希望所有的语言都有这种东西。它始终是用户的最爱。

## 匹配必须完整

关于`match`我们还要讨论一个方面：它的分支必须包括所有的可能性。假设`plus_one`的实现如下，就无法通过编译：

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        Some(i) => Some(i + 1),
    }
}
```

我们没有处理`None`的情况，所以这样的代码很可能会产生问题。幸运的是，Rust能够捕获此类问题。如果你试图编译这段代码，你会看到如下报错：

```
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0004]: non-exhaustive patterns: `None` not covered
 --> src/main.rs:3:15
  |
3 |         match x {
  |               ^ pattern `None` not covered
  |
note: `Option<i32>` defined here
 --> /rustc/d5a82bbd26e1ad8b7401f6a718a9c57c96905483/library/core/src/option.rs:518:1
  |
  = note:
/rustc/d5a82bbd26e1ad8b7401f6a718a9c57c96905483/library/core/src/option.rs:522:5: not covered
  = note: the matched value is of type `Option<i32>`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
4 ~             Some(i) => Some(i + 1),
5 ~             None => todo!(),
  |

For more information about this error, try `rustc --explain E0004`.
error: could not compile `enums` due to previous error
```

Rust明白我们没有覆盖所有的可能性，甚至明白我们漏掉了哪些模式！Rust中的`match`是*完整的*：完整覆盖每一个可能性的代码才是合法的。特别是对于`Option<T>`，当Rust提醒我们补充对于`None`的处理时，也保护了我们不会拥有null值，从而避免了之前讨论过的那些耗费千亿美元的问题。

## 使用`_`占位符来捕获所有模式

使用枚举时，我们可以为一些特定的值采取一些特定的行动，为其他的值采取一个默认的行动。想象一下我们在实现一个游戏，如果你掷骰子掷出了3，你的人物不会移动，但是会获得一顶漂亮的帽子。如果你掷出了7，你的人物会丢掉帽子。而掷出其他值时，你的人物会在棋盘上移动对应点数的距离。下面是实现了这段逻辑的代码，只不过掷出的点数写死了。其他的逻辑没有实现，因为它们和这个例子不相干：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        other => move_player(other),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn move_player(num_spaces: u8) {}
```

对于前两个分支，匹配的值是字面量`3`和`7`。而最后一个分支涵盖了其他所有的可能性，`other`就是这个模式匹配到变量的名字。这段代码会运行`other`分支，并将值传递给`move_player`函数。

这段代码可以正常编译，尽管我们并没有列出所有`u8`的可能性，但最后一个模式会匹配没有列出的所有值。这种捕获所有的模式跟`match`必须完整的规则不谋而合。请注意我们必须把捕获所有的分支放在最后，因为模式匹配是顺序执行的，如果我们在捕获所有的分支后添加分支，会收到Rust的警告！

Rust也提供了那些*不想*使用捕获所有的值的情况，`_`是一个特殊的匹配符，它可以匹配任何值，且不会绑定到那个值。这样就可以告诉Rust我们不准备使用这个值，Rust也就不会发出未使用的值警告。

让我们对游戏规则进行微调：如果你掷出了`3`和`7`以外的值，那么你必须重新掷骰子。这一回我们不会使用匹配到的值了，我们可以把`other`替换为`_`：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => reroll(),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn reroll() {}
```

这个例子同样具备完整性，因为我们显式地在最后一个分支里忽略了所有其他值；没有遗漏任何内容。

最后，我们会再次修改游戏规则，这一次如果你掷出了`3`和`7`以外的值，任何事都不会发生。这种情况我们可以在`_`分支中返回一个单元值（在介绍元组类型时讨论过）：

```rust
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => (),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
```

这样，我们就显式地告诉Rust，如果值在前面的分支没有匹配到，那么我们也不会使用这个值，且也不进行任何代码操作。

第18章会介绍模式和匹配的更多内容。

## `match`和所有权

如果一个枚举包括了不可复制的数据，比如`String`，那么你应该十分小心，因为`match`可能会移动或者借用它。比如，下面的程序使用了`Option<String>`，它可以编译通过：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          perms: [
            { var: 'opt', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'opt@Some.0', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 5: return lr({
          perms: [
            { var: 'opt', operation: 'l', P: ['s', 'e', 's'] },
            { var: 'opt@Some.0', operation: 'l', P: ['s', 'e', 's'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let opt: Option<String> = Some(String::from("Hello world"));
match opt/*[!perm R.{"collapse":true}]*/ {
    Some(_) => println!("Some!"),
    None => println!("None!")
};
println!("{:?}", /*[!perm R.{"collapse":true}]*/opt);` })'
/>

但是如果我们把`Some(_)`的占位符换位变量名，比如`Some(s)`，这段程序就**无法**通过编译了：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          perms: [
            { var: 'opt', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'opt@Some.0', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 2: return lr({
          perms: [
            { var: 'opt', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'opt@Some.0', operation: 'e', P: ['s', 'e', 's'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let opt: Option<String> = Some(String::from("Hello world"));
match opt/*[!perm R.{"collapse":true}]*/ {
    // _ 变为了 s
    Some(s) => println!("Some: {}", /*[!perm R.{"collapse":true}]*/s),
    None => println!("None!")
};
println!("{:?}", /*[!perm R.{"missing":true}]*/opt);` })'
/>

`opt`是一个简单的枚举————它的类型是`Option<String>`而不是`&Option<String>`。因此对`opt`进行`match`操作会移动到未忽略的字段，比如`s`。请注意`opt`丢失读、拥有权的速度比之前更快了。在`match`表达式后，`opt`里的数据已经被移动，使用`println`读取它是不合法的。

如果你想查看`opt`的数据又不想移动它，你应该使用引用：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          perms: [
            { var: 'opt', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'opt@Some.0', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 2: return lr({
          perms: [
            { var: 'opt', operation: 'b', P: ['p', 'e', 's'] },
            { var: 'opt@Some.0', operation: 'b', P: ['p', 'e', 's'] },
          ]
        })
        case 3: return lr({
          perms: [
            { var: 'opt', operation: 'r', P: [null, 'e', 'p'] },
            { var: 'opt@Some.0', operation: 'r', P: [null, 'e', 'p'] },
          ]
        })
        case 4: return lr({
          perms: [
            { var: 'opt', operation: 'r', P: [null, 'e', 'p'] },
            { var: 'opt@Some.0', operation: 'r', P: [null, 'e', 'p'] },
          ]
        })
        case 6: return lr({
          perms: [
            { var: 'opt', operation: 'l', P: ['s', 'e', 's'] },
            { var: 'opt@Some.0', operation: 'l', P: ['s', 'e', 's'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let opt: Option<String> = Some(String::from("Hello world"));
// opt 变为了 &opt
match &/*[!perm R.{"collapse":true}]*/opt {
    Some(s) => println!("Some {}", /*[!perm R.{"collapse":true}]*/s);
    None => println!("None")
};
println!("{:?}", /*[!perm R.{"collapse":true}]*/opt);` })'
/>

Rust会从外部的枚举引用`&Option<String>`中“推出”引用`&String`。因此`a`的类型是`&String`，而`opt`在match后可以继续使用。为了更好的理解“推出”的机制，请查看附录中的*绑定模式*。

::: details 小测（4）
<QuizProvider>
<Quiz>
<template #description>

解析：match会尝试从上到下进行匹配。第2、3分支都满足，所以最终命中第2个分支。

</template>
<template #quiz>
<IsCompileText />

```rust
enum Location {
    Point(i32),
    Range(i32, i32)
}

fn main() {
    let l: Location = Location::Range(0, 5);
    let n = match l {
        Location::Point(_) => -1,
        Location::Range(_, n) => n,
        Location::Range(0, _) => 0,
        _ => -2
    };
    println!("{n}");
}
```

<IsCompile :answer="{ compiled: true, result: '5' }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：函数通过消费其所有权“解包”了option，取出了其内部的值，但如果没有值，那么它会返回`other`。这是一个标准库提供的真实函数！

</template>
<template #quiz>

下面的程序为`Option`类型实现了一个方法

```rust
impl<T> Option<T> {
    fn unwrap_or(self, other: T) -> T {
        match self {
            Some(t) => t,
            None => other
        }
    }
}
```

下面哪一个句子对这个函数的行为描述地最正确？

<RadioHolder>
<Radio label="如果self内的对象存在，那么返回一个由包裹它的新option，如果不存在，返回other" />
<Radio label="如果self内的对象存在，那么对它的引用，如果不存在，返回other" />
<Radio label="如果self内的对象存在，返回它，如果不存在，返回other" answer />
<Radio label="如果self内部没有值，那么将other插入self" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：match分支`Either::Right(s)`移动了`s`字段，所以`x`无法继续被使用了。

</template>
<template #quiz>
<IsCompileText />

```rust
#[derive(Debug)]
enum Either {
    Left(usize),
    Right(String)
}

fn main() {
    let x = Either::Right(String::from("Hello world"));
    let value = match x {
        Either::Left(n) => n,
        Either::Right(s) => s.len()
    };
    println!("{x:?} {value}");
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：`match`和`if`在这里的作用完全相同。match就像一个特殊的if，它会检查对象和模式之间是否相等（是否匹配）。

</template>
<template #quiz>
查看下面两个函数的实现，它们的作用都是对一个无符号数进行减2的操作：

```rust
fn decr_twice_v1(n: u32) -> Option<u32> {
    match n {
        0 => None,
        1 => None,
        n2 => Some(n2 - 2)
    }
}

fn decr_twice_v2(n: u32) -> Option<u32> {
    if n == 0 {
        None
    } else if n == 1 {
        None
    } else {
        Some(n - 2)
    }
}
```

这两个函数什么情况下行为相同：

<RadioHolder>
<Radio label="所有输入都相同" answer />
<Radio label="没有输入能让他们相同" />
<Radio label="一部分输入相同" />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
