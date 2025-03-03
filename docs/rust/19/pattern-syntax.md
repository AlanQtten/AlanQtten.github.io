<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  Checkbox,
  Option
} from "../../components/quiz"

</script>

# 模式语法

这一节，我们会集齐模式的所有合法的语法，并讨论为什么，以及何时使用它们。

## 匹配字面量

就像你在第6章看到的一样，你可以使用字面量直接进行模式匹配。下面就是一个例子：

```rust
    let x = 1;

    match x {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
```

这段代码会打印`one`，因为`x`的值为`1`。这样的语法对于希望匹配特定值的情况特别有用。

## 匹配具名变量

具名变量是一种可以匹配任何值的不可反驳模式，在本书中我们大量使用了它。然而，在`match`表达式中使用具名变量也有一定的复杂度。因为`match`会开启一个新的作用域，在`match`表达式的模式里声明的变量会遮挡`match`结构外的同名变量，对所有变量来说皆是如此。在下面的代码里，我们声明了一个`x`，值为`Some(5)`，然后声明了一个`y`，值为`10`。然后我们创建了`match`表达式对`x`进行匹配。注意`match`分支里的模式以及最后的`println!`，你可以尝试预测一下这段代码的输出。

```rust
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(y) => println!("Matched, y = {y}"),
        _ => println!("Default case, x = {x:?}"),
    }

    println!("at the end: x = {x:?}, y = {y}");
```

我们来看看`match`表达式运行时发生了什么。第一个match分支里的模式和`x`定义的值不匹配，所以代码会继续往下。

第二个match分支里引入了一个新的变量`y`，它会匹配任何`Some`内的值。由于`match`表达式内是一个新的作用域，所以这里的`y`是一个新的变量，而不是我们一开始赋值`10`的变量。新的`y`会绑定任何`Some`内的值，也就是`x`。因此，这里的`y`会绑定给`x`的`Some`内部的值，即`5`，所以这个分支的表达式会运行，输出`Matched, y = 5`。

如果`x`为`None`而不是`Some(5)`，那么前两个分支内的模式都不会匹配，最终下划线会匹配到。我们没有在这个分支里创建新的`x`变量，所以这个表达式里的`x`仍然是外侧的`x`，没有被遮挡。这种情况下，`match`会输出`Default case, x = None`。

当`match`表达式完成后，其作用域就结束了，而内侧`y`的作用域也结束了。所以最后的打印会输出`at the end: x = Some(5), y = 10`。

要创建一个比较外侧`x`和`y`值的`match`表达式，我们不需要引入阴影变量，只需要使用match的条件守卫，我们会在本章的后面部分讨论这种语法。

## 多模式

在`match`表达式里，你可以使用`|`符号来匹配多个模式，其表达了*或*语法。比如，在下面的代码里，我们在match的分支里对`x`进行了匹配，在第一个分支里有一个*或*的选项，如果`x`满足这个分支里的任何一个值，那么这个分支对应的代码会执行：

```rust
    let x = 1;

    match x {
        1 | 2 => println!("one or two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
```

这段代码会打印`one or two`。

## 使用`..=`来进行范围匹配

`..=`语法允许我们匹配一个值的闭区间。在下面的代码里，当值和范围匹配时，对应的分支会执行：

```rust
    let x = 5;

    match x {
        1..=5 => println!("one through five"),
        _ => println!("something else"),
    }
```

如果`x`是1,2,3,4,5，那么第一个分支会匹配。这个语法比起使用多个`|`的表达来说更加的方便；如果我们使用`|`，我们就得书写`1 | 2 | 3 | 4 | 5`这样的代码。声明一个范围更剪短，特别是你的范围很大的时候，比如1到1000！

编译器会在编译时检查范围是否为空，而Rust只能判断数字和`char`类型的范围是否为空，所以范围只能是这两种类型。

下面是一个`char`范围的例子：

```rust
    let x = 'c';

    match x {
        'a'..='j' => println("early ASCII letter"),
        'k'..='z' => println("late ASCII letter"),
        _ => println("something else"),
    }
```

Rust可以判断`'c'`在第一个范围内，并打印`early ASCII letter`。

## 通过结构来分解值

我们也可以使用模式来解构结构体，枚举和元组，快速使用它们的一部分。我们来逐一了解这些类型。

### 结构结构体

在下面的代码里，我们声明一个`Point`结构体，它有两个字段，`x`和`y`，然后我们使用`let`声明和一个模式对其进行了解构：

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
}
```

这段代码创建了变量`a`和`b`来匹配结构体`p`的`x`和`y`字段。这个例子展示了变量的名称可以和要匹配的结构体字段名不一致。不过，更常规的做法是使用相同的名字来进行匹配，这样更容易记忆其对应关系。由于这样的做法更加常见，且书写`let Point { x: x, y: y } = p;`这样的代码会有些啰嗦，Rust提供了更简短的方法来表示这种模式：你只需要列出结构体的字段，然后对应的变量就会自动创建。下面的代码展示了和之前类似的方式，但`let`声明使用了`x`和`y`而不是`a`和`b`。

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x, y } = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
}
```

这段代码创建了`x`和`y`来匹配`p`变量中的`x`和`y`字段。结果就是变量`x`和`y`会包含`p`结构对应的值。

我们也可以使用字面量来创建结构体的一部分，而不是为所有的字段创建变量。这样做可以让你测试一部分字段的值是否为特定的值，同时又结构其它字段。

在下面的代码里，我们创建了一个`match`表达式来将`Point`的值分为3个部分：落在`x`轴上的值（此时`y = 0`），落在`y`轴上的值（此时`x = 0`），以及其它情况。

```rust
fn main() {
    let p = Point { x: 0, y: 7 };

    match p {
        Point { x, y: 0 } => println!("On the x axis at {x}"),
        Point { x: 0, y } => println!("On the y axis at {y}"),
        Point { x, y } => {
            println!("On neither axis: ({x}, {y})")
        },
    }
}
```

第一个分支通过指定`y`字段只有为`0`时才匹配，确定了其会匹配任何落在`x`轴上的值。这个模式仍然会创建一个`x`变量，我们可以在该分支的代码里使用它。

类似的，第二个分支通过指定`x`字段只有为`0`时才匹配，确定了其会匹配任何落在`y`轴上的值，同时也创建了`y`变量来匹配`y`字段。第三个分支没有使用任何字面量，所以它会匹配任何的`Point`，且它为`x`和`y`都创建了变量。

在这个例子里，`p`的值会匹配第二个分支，所以代码会打印`On the y axis at 7`。

记住`match`表达式一旦匹配就会停止继续检查其他分支，所以即便值为`Point { x: 0, y: 0 }`，其输出也会是`One the x axis at 0`。

### 解构枚举

我们已经在本书中进行过枚举的结构（比如在第6章），但我们还没有明确讨论过，解构枚举的模式与枚举内部数据的定义方式是相对应的。在下面的例子里，我们使用了`Message`枚举，并使用了一个`match`来解构其各个内部值。

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.")
        }
        Message::Move { x, y } => {
            println!("Move in the x direction {x} and in the y direction {y}")
        }
        Message::Write(text) => {
            println!("Text message: {text}")
        }
        Message::ChangeColor(r, g, b) => {
            println!("Change the color to red {r}, green {g}, and blue {b}")
        }
    }
}
```

这段代码会打印`Change the color to red 0, green 160, and blue 255.`，你可以尝试修改`msg`的值来看看其他分支的运行。

对于没有任何数据的枚举变体，比如`Message::Quit`，我们无法进一步解构其值。只能使用`Message::Quit`这样的字面量模式来进行匹配，这个模式里没有任何变量。

对于类结构体的枚举变体，比如`Message::Move`，我们可以使用类似匹配结构体时的模式进行匹配。在变体名称后，我们可以使用一个大括号，然后在其中列出我们希望解构，并在当前分支里使用的变量。这里我们使用了简写语法。

对于类元组的枚举变体，比如`Message::Write`持有了一个包含一个元素的元组，或者`Message::ChangeColor`，持有了一个包含三个元素的元组。这里使用的语法和我们解构元组时的语法类似。模式里变量的数量必须和对应变体存储的元组数量一致。

### 解构嵌套的结构体和枚举

到目前为止，我们所匹配的结构体和枚举都是单层深度的，但嵌套的内容也可以使用模式匹配！比如，我们可以重构一下上一个小节的带代码，让`ChangeColor`支持RGB格式和HSV格式的颜色，代码如下：

```rust
enum Color {
    Rgb(i32, i32, i32),
    Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!("Change the color to red {r}, green {g}, and blue {b}")
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!("Change the color to hue {h}, saturation {s}, and value {v}")
        }
        _ => (),
    }
}
```

`match`表达式的第一个分支里的模式会匹配包含了`Color::Rgb`变体的`Message::ChangeColor`枚举变体；其中的变量都会被绑定`i32`类型的值。而第二个分支里的模式也会匹配`Message::ChangeColor`枚举变体，但其中的枚举会匹配`Color::Hsv`。我们可以在一个`match`表达式里表达这些复杂的条件，即便涉及了两个枚举。

### 解构结构体和元组

我们可以在更复杂的场景里混合，匹配，以及嵌套解构赋值。下面的例子就是一个复杂的解构，我们在一个元组里嵌套了结构体和元组，然后将它们全部解构为原始类型：

```rust
    let ((feet, inches), Point { x, y }) = ((3, 10), Point { x: 3, y: -10 });
```

这样的代码可以让我们将复杂的类型分解为各个组件片段，这样我们就可以分别使用我们感兴趣的值。

使用模式来解构是一种非常方便的分别使用值片段（比如结构体里的各个字段）的方式。

## 忽略模式里的值

你已经发现了一部分情况下忽略模式里的某些值很有用，比如在`match`的最后一个分支里，这样我们就获得了一个包罗万象的分支，虽然它可能什么都不做，但它会匹配剩余的所有情况。也有一些办法忽略模式的整体或是一部分：使用`_`模式（你已经见过了），`_`是另一种模式，它由一个下划线组成，也可以使用`..`来忽略剩余的值。我们来探索一下如何使用这些模式。

### 使用`_`忽略整个值

我们已经使用过下划线的方式，它会匹配任何未绑定的值。对于`match`表达式的最后一个分支来说特别有用，但是我们也可以在其他地方使用，包括函数参数，代码如下：

```rust
fn foo(_: i32, y: i32) {
    println!("This code only uses the y parameter: {y}");
}

fn main() {
    foo(3, 4);
}
```

这段代码会完全忽略传递给第一个参数的`3`，打印`This code only uses the y parameter: 4`。

在大部分情况下当你不需要一个特定的函数参数时，你会修改签名，这样就不会包含无用的参数了。但也有忽略函数参数特别有用的情况，比如，当你需要为一个类型实现一个trait，但你的类型并不需要其中的一个参数时。为了避免收到浏览器的无用参数的警告，你就可以忽略它。

### 使用嵌套的`_`忽略部分值

我们也可以在模式内使用`_`来忽略部分值，比如，我们只想测试某个值的一部分，但是并不关心剩余部分的代码运行时。下面的代码展示了一个配置的管理。业务要求用户不可以覆盖已有配置，必须先重置一个配置，然后再设置新值。

```rust
    let mut setting_value = Some(5);
    let new_setting_value = Some(10);

    match (setting_value, new_setting_value) {
        (Some(_), Some(_)) => {
            println!("Can't overwrite an existing customized value");
        }
        _ => {
            setting_value = new_setting_value;
        }
    }

    println!("setting is {setting_value:?}");
```

这段代码会打印`Can't overwrite an existing customized value`，然后打印`setting is Some(5)`。在第一个分支里，我们不关注每个`Some`变体里的值，但我们需要测试`setting_value`和`new_setting_value`是`Some`变体。在这种情况下，我们会打印`setting_value`没有被修改的原因。

第二个分支表达了其他所有（如果`setting_value`或`new_setting_value`是`None`）的情况，我们希望在这种情况下允许`setting_value`修改为`new_setting_value`。

我们也可以在一个模式的多个位置使用下划线来忽略特定的值。下面的代码展示了一个忽略一个包含五个元素的元组里的第二个和第四个元素的情况：

```rust
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, _, third, _, fifth) => {
            println("Some numbers: {first}, {third}, {fifth}");
        }
    }
```

这段代码会打印`Some numbers: 2, 8, 32`，4和16会被忽略。

### 通过使用`_`开头命名来忽略未使用变量

如果你创建了一个变量且没有在任何地方使用它，Rust通常会给出一个警告，因为未使用的变量可能是程序漏洞。但是，有能力创建不使用的变量也是有用的，比如你可能正处于原型阶段，或者才开始一个项目。这种情况下，你可以通过下划线开头的名字来告诉Rust不要抛出警告。在下面的代码里，我们创建了两个未使用的变量，但在我们编译代码时，我们只会看到其中之一的警告。

```rust
fn main() {
    let _x = 5;
    let y = 10;
}
```

这里我们会收到未使用变量`y`的警告，但不会收到未使用`_x`的警告。

注意只使用`_`和使用下划线开头的名字有一点微妙的区别。`_x`还是会绑定变量的值，而`_`什么都不会绑定。下面的代码展示了这种差异所引发的错误：

```rust
    let s = Some(String::from("Hello!"));

    if let Some(_s) = s {
        println!("found a string");
    }

    println!("{s:?}");
```

我们收到了一个错误，因为`s`的值被移动到了`_s`里，我们就不能再使用`s`了。然而，使用下划线本身并不会绑定任何值。下面的代码就可以正常编译，因为`s`没有移动到`_`里：

```rust
    let s = Some(String::from("Hello!"));

    if let Some(_) = s {
        println!("found a string");
    }

    println!("{s:?}");
```

这段代码的运行没有任何问题，因为`s`没有被绑定给任何东西；它没有移动。

### 使用`..`忽略值的剩余部分

对于存在多个组成部分的值，我们可以使用`..`语法，来使用特定的部分，忽略剩余部分。`..`模式会忽略任何我们没有显式匹配的值。在下面的代码里，我们创建了一个`Point`结构体，它包括三个维度数据。在`match`表达式里，我们只希望操作`x`维度，忽略`y`和`z`维度。

```rust
    struct Point {
        x: i32,
        y: i32,
        z: i32,
    }

    let origin = Point { x: 0, y: 0, z: 0 };

    match origin {
        Point { x, .. } = println!("x is {x}"),
    }
```

我们列出了`x`，然后包含了`..`模式。这样比`y: _`加上`z: _`这样的代码要快得多，特别是我们应对的结构体存在大量的字段，而和当前上下文相关的字段只有一两个的情况。

`..`语法会尽可能多地展开值。下面的代码是对元组使用`..`语法的例子：

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("Some numbers: {first}, {last}");
        }
    }
}
```

在这段代码里，第一个值和最后一个值会被`first`和`last`匹配。`..`会匹配并忽略所有中间值。

然而，`..`的使用必须是明确的。如果不确定哪些值确定被匹配而哪些确定被忽略，Rust会跑出一个异常。下面的代码展示了一个不明确的`..`使用，它无法编译通过。

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (.., second, ..) => {
            println!("Some numbers: {second}");
        }
    }
}
```

编译这段代码，会看到如下报错：

```
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
error: `..` can only be used once per tuple pattern
 --> src/main.rs:5:22
  |
5 |         (.., second, ..) => {
  |          --          ^^ can only be used once per tuple pattern
  |          |
  |          previously used here

error: could not compile `patterns` (bin "patterns") due to 1 previous error
```

Rust无法判断在`second`的前面和后面有多少值被忽略了。这段代码可能表示我们希望忽略`2`，绑定`second`为`4`，然后忽略`8`、`16`和`32`；也可能表示我们希望忽略`2`和`4`，绑定`second`为`8`，然后忽略`16`和`32`；等等等等。`second`这个变量名对Rust来说是无效的，所以我们会收到编译错误，因为这两个地方的`..`是有歧义的。

## 使用匹配守卫的额外条件

匹配守卫是在匹配分支的模式后指定的额外`if`条件，只有当该条件也匹配时，才会选择该分支。相比单独的模式来说，匹配守卫可以表达更复杂的概念。

匹配守卫的表达式里可以使用模式里创建的变量。下面的代码展示了一个`match`表达式，第一个分支里的模式为`Some(x)`，然后添加了匹配守卫`if x % 2 == 0`（匹配偶数数字）。

```rust
    let num = Some(4);

    match num {
        Some(x) if x % 2 == 0 => println!("The number {x} is even"),
        Some(x) => println!("The number {x} is odd"),
        None => (),
    }
```

这个例子会打印`The number 4 is even`。当`num`在第一个分支内被匹配时，它会匹配成功，因为`Some(4)`和`Some(x)`匹配。然后匹配守卫会检查`x`取余2后是否为0，这里的结果为真，所以第一个分支匹配通过了。

如果`num`为`Some(5)`，那么第一个分支里的匹配守卫就会返回`false`，因为5取余2后为1，不等于0。Rust会继续检查第二个分支，它会匹配通过，因为第二个分支没有任何的匹配守卫，因此它可以匹配任何`Some`变体。

在模式内部是没有办法表示`if x % 2 == 0`这样的条件的，这也是匹配守卫存在的意义。但匹配守卫并不会被算作这个分支“完备度”的一部分。所以即便我们为这个分支添加了额外的`Some(x) if x % 2 == 1`，我们还是需要添加一个无人看守的`Some(x)`分支。

在之前的代码里，我们提到了可以使用匹配守卫来解决匹配变量遮挡的问题。回顾我们在`match`表达式中创建一个新变量而不是使用`match`外变量的例子。这个新的变量也就导致我们无法对外部变量进行测试。下面的代码展示了我们如何使用匹配守卫解决这个问题：

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(n) if n == y => println!("Matched, n = {n}"),
        _ => println!("Default case, x = {x:?}"),
    }

    println!("at the end: x = {x:?}, y = {y}");
}
```

这段代码会打印`Default case, x = Some(5)`。第二个分支里的模式没有引入新变量`y`来遮挡外侧的`y`，所以我们可以在匹配守卫里使用外侧的`y`。如果声明类似`Some(y)`这样的模式，那么外侧的`y`就会被遮挡，所以我们声明了`Some(n)`。这样创建的新变量`n`不会遮挡任何东西，因为在`match`外没有变量名为`n`。

匹配守卫`if n == y`不是一个模式，因此也不会引入新的变量。这里的`y`就是外侧的`y`，而不是一个遮挡的`y`，通过对比`n`和`y`，我们可以找到和外侧的`y`相同的值。

你也可以在匹配守卫前使用或操作符`|`来指定多个模式；匹配守卫会对所有的模式生效。下面的代码展示了`|`和匹配守卫的结合使用。这个例子的重点在于`if y`会适用于`4`、`5`和`6`，即便看起来它好像只适用于`6`。

```rust
    let x = 4;
    let y = false;

    match x {
        4 | 5 | 6 if y => println!("yes"),
        _ => println!("no"),
    }
```

match表达式的第一个分支表示它只会匹配`x`等于`4`、`5`或`6`且`y`为`true`的情况。当运行这段代码时，第一个分支的模式会匹配成功，因为`x`的值为`4`，但是由于`if y`为`false`，所以第一个分支最终是不会被选择的。代码会继续检查第二个分支，它会匹配成功，所以这个程序会打印`no`。程序这样运行的原因就是`if`表达式适用于整个模式`4 | 5 | 6`，而不是只针对`6`。换句话说，这里的结合使用相当于：

```
(4 | 5 | 6) if y => ...
```

而不是

```
4 | 5 | (6 if y) => ...
```

在运行这段代码后，结合的行为就很明显了：如果匹配守卫只适用于`|`操作符声明的最后一个值，那么第一个分支就会匹配，程序会打印`yes`。

## `@`绑定

艾特操作符`@`允许我们在测试一个值是否匹配模式的同时，创建一个变量来保存该值。在下面的代码里，我们想要测试`Message::Hello`的`id`字段是否在`3..=7`范围里。同时我们也想将这个值绑定给变量`id_variable`，这样我们就可以在这个分支的代码里使用它了。这个变量的名字我们可以设置为`id`，和字段一样，但是为了做示例我们选了一个不同的名字：

```rust
    enum Message {
        Hello { id: i32 },
    }

    let msg = Message::Hello { id: 5 };

    match msg {
        Message::Hello {
            id: id_variable @ 3..=7,
        } => println!("Found an id in range: {id_variable}"),
        Message::Hello { id: 10..=12 } => {
            println!("Found an id in another range")
        }
        Message::Hello { id } => println!("Found some other id: {id}"),
    }
```

这段代码会打印`Found an id in range: 5`。通过在`3..=7`前面声明`id_variable @`，我们可以在测试值是否匹配范围的同时捕获到这个值。

在第二个分支里，我们只是在模式里声明了一个范围，这个分支对应的代码没有使用`id`字段实际的值。`id`可能为`10`、`11`或`12`，但是模式本身并不知道它具体是哪个值。模式的代码无法使用`id`字段的值，因为我们没有把它保存在变量里。

在最后一个分支里，我们指定了一个没有范围的变量，这个变量`id`也是可以在分支对应的代码里使用的。因为我们使用了结构体的简写语法。但是我们没有在这个分支里对`id`的值进行类似前两个分支一样的测试，所以任何的值都可以匹配这个模式。

使用`@`可以让我们在一个模式里对值进行测试并保存到一个变量。

::: details 小测（4）
<QuizProvider>
<Quiz>
<template #description>

解析：第一个分支会匹配`y = 1`，也就是说`y != 0`，所以模式失败了。第二个分支只要求`x == 0`，且`x`确实为`0`，所以这个模式匹配成功。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let x = (0, 1);
    match x {
        (_, y) if y == 0 => println!("A"),
        (0, _) => println!("B"),
        _ => println!("C"),
    }
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: 'B'
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`(_, n)`不合法，因为`a`是元组组成的数组，而不是元组本身。

</template>
<template #quiz>

现有如下程序：

```rust
let a = [(0, 1)];
let ?? = a;
```

以下哪几个选项可以放在`??`占位符的位置后是合法的模式？

<Checkbox>
<Option label="[..]" answer />
<Option label="_" answer />
<Option label="[(n, ..)]" answer />
<Option label="(_, n)" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：在值的两侧同时使用`..`是不合法的，因为它对于哪些数组元素应该被忽略这个问题来说是有歧义的。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let x = Some(&[0, 1]);
    match x {
        Some(&[.., 1, ..]) => println!("A"),
        Some(&[0, 1]) | None => println!("B"),
        _ => println!("C"),
    }
}
```

<IsCompile
  :answer="{
    compiled: false
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这个模式指明了`x`必须在`0`到`5`之间（闭区间），且`x + y != 0`，因此`(5, -4)`和`(0, 1)`是合法的，而`(-1, 2)`和`(3, -3)`是不合法的。

</template>
<template #quiz>

假设现有如下定义：

```rust
struct Point {
    x: i32,
    y: i32
}
```

那么对于以下模式：

```rust
Point { x: x @ 0 ..= 5, y } if x + y != 0
```

以下哪些值可以匹配这个模式？

<Checkbox>
<Option label="Point { x: 3, y: -3 }" />
<Option label="Point { x: 0, y: 1 }" answer />
<Option label="Point { x: 5, y: -4 }" answer />
<Option label="Point { x: -1, y: 2 }" />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::

## 总结

Rust的模式对于区分不同的数据来说非常有用。在使用`match`表达式时，Rust会确保你的模式覆盖了所有可能的值，否则你的程序无法编译。而`let`和函数参数里的模式让这些结构更加实用，使得我们可以在分配变量的同时将值拆分为更小单元。我们可以根据自己的需求创建或简单，或复杂的模式。

下面，在本书的倒数第二个单元里，我们来看看Rust的一些高阶特性。
