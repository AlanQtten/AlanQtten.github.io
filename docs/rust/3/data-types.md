<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  IsCompile,
  IsCompileText
} from "../../components/quiz"

</script>

# 数据类型

Rust中每个值的数据类型都是确定的，数据类型会告诉Rust该如何操作数据。我们会介绍数据类型的两种子集：基础类型和复合类型。

请注意Rust是强类型语言，也就是说它在编译时必须知道所有变量的类型。编译器会自动根据值和值的使用推导出类型。为了缩小类型的范围，比如第二章的字符串转换，我们必须使用类型标注：

```rust
let guess: u32 = "42".parse().expect("Not a number!");
```

如果我们不写`:u32`这样的类型标注，Rust会抛出如下错误，表示编译器需要更多信息来明确值类型：

```
$ cargo build
    Compiling no_type_annotations v0.1.0(file:///projects/no_type_annotations)
error [E0282]: type annotations need
 --> src/main.rs:2:9
  |
2 |    let guess = "42".parse().expect("Not a number!");
  |        ^^^^^
  |
help: consider giving `guess` an explicit type
  |
2 |    let guess: _ = "42".parse().expect("Not a number!");
  |             +++
For more information about this error, try `rustc --explain E0282`.
error: could not compile `no_type_annotations` due to previous error
```

你会看到许多不同的数据类型。

## 基础类型

基础类型表示单个值。Rust有四种主要的基础类型：整数、浮点数、布尔和字符。你可能在很多语言中见过它们。让我们直接进入它们在Rust中的运用。

### 整数

整数就是没有小数部分的数字。第二章我们使用了`u32`这个整数类型。这个类型表示这个值是一个无符号整数（符号整数类型使用`i`开头），占据了32比特。下面的表格展示了Rust内置的整数类型。我们可以随意使用它们来定义整数。

|长度（比特）|有符号|无符号|
|--|--|--|
|8|`i8`|`u8`|
|16|`i16`|`u16`|
|32|`i32`|`u32`|
|64|`i64`|`u64`|
|128|`i128`|`u128`|
|arch|`isize`|`usize`|

每一个数字都是有符号或者无符号，且有明确的大小。有符号和无符号表示一个值可不可以为负————换句话说，这个数字需不需要符号。就像在纸上写数字一样，如果明确是一个正数，就不会书写符号。有符号整数使用二进制补码表示法存储。

每一个有符号整数能存储-(<span>2<sup>n-1</sup></span>)到<span>2<sup>n-1</sup>-1</span>闭区间内的数。`n`表示变量占用的比特数。因此`i8`可以存储-(<span>2<sup>7</sup></span>)到<span>2<sup>7</sup>-1</span>，即-128到127。而无符号整数能存储0到<span>2<sup>n</sup>-1</span>，因此`u8`能存储0到<span>2<sup>8</sup>-1</span>，即0到255。

另外，`isize`和`usize`取决于程序运行电脑的架构，64位的电脑占用64比特，32位的电脑占用32比特。

你也可以使用下面表格的方式书写数字字面量。注意数字字面量可以使用类型后缀，比如`57u8`。数字字面量也可以使用`_`来分割，使其更易于阅读，比如`1_000`，它和`1000`是完全一样的。

|数字字面量|例子|
|--|--|
|十进制|`98_222`|
|十六进制|`0xff`|
|八进制|`0off`|
|二进制|`0b1111_0000`|
|字节（仅允许`u8`）|`b'A'`|

那么如何判断该使用什么类型的数字呢？如果你不确定，Rust的默认值是一个好的开始：数字类型默认为`i32`。而使用`isize`或`usize`一般用在一些集合的下标。

> 整数溢出
>
> 如果你有一个`u8`类型的变量，它能存储的值范围是0到255.如果你试图赋给它一个超出范围的值，比如256。整数溢出就会出现，这会导致两种情况。如果你在调试模式下编译，Rust会在生产环境检查此类行为并在出现时崩溃。这部分内容在第九章会深入讨论。
>
> 如果你使用了`--release`，在发布模式下编译，Rust不会在生产环境检查此类错误，也不会崩溃。反之，如果溢出出现，Rust进行二进制补码环绕处理。简单来说，超出类型最大值的变量会“绕到”该类型能容纳的最小值。例如，对于`u8`来说，256变为0，257变为1，以此类推。程序不会崩溃，但变量的值可能不是你期望的。指望这样的行为来拯救程序是不可能的。
>
> 为了更明确地处理溢出的情况，你可以使用标准库为整数类型提供的方法：
> - 不管在什么模式下，使用`wrapping_*`的方法包裹代码，比如`wrapping_add`。
> - 如果发生溢出，使用`checked_*`方法返回`None`。
> - 使用`overflowing_*`方法返回值和一个检查是否溢出的布尔值。
> - 使用`saturating_*`在值的最大/最小处进行拦截。

### 浮点数

Rust也有两种对应浮点数的类型，使用数字和小数点表示。Rust的浮点数类型是`f32`和`f64`，对应32比特和64比特。默认的浮点数类型是`f64`，因为在现代的CPU上，它`f32`的速度相差无几，却更精确，所有的浮点数都是有符号的。

下面是一个浮点数的例子：

```rust
fn main() {
    let x = 2.0; // f64

    let y: f32 = 3.0; // f32
}
```

浮点数根据IEEE-754标准表示。`f32`类型是单精度浮点数，`f64`是双精度。

### 数字操作

Rust支持基本的数学操作：加减乘除以及取余。整数的除法会取0到最近的整数。下面的代码展示了各种操作：

```rust
fn main() {
    // 加
    let sum = 5 + 10;

    // 减
    let difference = 95.5 - 4.3;

    // 乘
    let product = 4 * 30;

    // 除
    let quotient = 56.7 / 32.2;
    let truncated = -5 / 3; // Results in -1

    // 取余
    let remainder = 43 % 5;
}
```

每一个表达式都使用了数学符号来计算得到一个单值，并绑定给了变量。附录里包括了所有Rust提供的操作符。

### 布尔类型

和其他大部分语言一样，Rust中的布尔类型有两种值：`true`和`false`。布尔占用1个字节。使用`bool`进行标识，比如：

```rust
fn main() {
    let t = true;

    let f: bool = false // 手动标注
}
```

布尔类型的主要应用场景在条件语句，比如`if`。我们会在后面的章节讨论。

### 字符类型

Rust的`char`类型是语言中最原始的字母类型。下面是一些例子：

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ'; // 手动标注
    let heart_eyed_cat = '😻';
}
```

请注意`char`字面量使用单引号包裹，和字符串不同。Rust的`char`类型占用了4个字节，使用unicode表示，所以它能表示除了ASCII外的很多字符，比如带重音的字母、中文、日文、韩文、emoji以及零宽字符在Rust中都是有效的`char`。unicode的范围是`U+0000`到`U+D7FF`和`U+E000`到`U+10FFFF`闭区间。然而，“字”在unicode中并不是一个概念，所以你对于“字”的直觉和Rust中的`char`可能并不相同。我们会在后面的章节讨论字符、字符串的存储。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：有符号数的范围是-<span>2<sup>n - 1</sup></span>到<span>2<sup>n - 1</sup> - 1</span>

</template>
<template #quiz>

`i128`能表示的最大数为：

<Radio>
<Option>
<span>2<sup>128</sup></span>
</Option>
<Option>
<span>2<sup>128</sup> - 1</span>
</Option>
<Option>
<span>2<sup>127</sup></span>
</Option>
<Option answer>
<span>2<sup>127</sup> - 1</span>
</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这个表达式在调试模式下会引发程序崩溃，在发布模式下会返回255。

</template>
<template #quiz>

如果`x: u8 = 0`，我们运行`x - 1`时会发生什么？

<Radio>
<Option label="程序一定会崩溃" />
<Option label="一定会返回255" />
<Option label="取决于编译的模式" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：不存在`fsize`这种类型。浮点数只有`f32`和`f64`。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let x: fsize = 2.0;
    println!("{x}");
}
```

<IsCompile
  :answer="{ compiled: false }"
/>

</template>
</Quiz>
</QuizProvider>
:::

## 复合类型

复合类型可以将多个数据捆绑到一个类型中。Rust内置了两种复合类型：元组和数组。

### 元组

元组是很常见的一种将多个不同类型数据捆绑到一个类型中的方式。元组的长度是固定的：一旦确定了，它们的大小就不能调整。

使用小括号包裹、逗号分隔的值来创建元组。元组的每一个位置都有类型，且它们无需一致。下面就是一个不同类型的例子：

```rust
fn main() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
}
```

由于元组已经被捆绑，所以变量`tup`可以绑定到整个元组上。如果想获取独立的元素，我们可以使用模式匹配来解构元组：

```rust
fn main() {
    let tup = (500, 6.4, 1);

    let (x, y, z) = tup;

    println!("The value of y is: {y}");
}
```

这段程序首先创建了一个元组并绑定给了变量`tup`。然后它使用模式匹配将`tup`中的值赋给了`x`、`y`和`z`。这样的操作称作解构，因为它将一个值分成了三部分。最终，程序打印了`y`，输出`6.4`。

我们也可以直接使用`.`和下标来访问元组的元素，比如：

```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
}
```

这个程序创建了元组`x`然后使用对应的下标访问了元组的各个元素。就像大多数语言一样，元组的下标从0开始。

空的元组有一个特殊的名字，单元（*unit*）。这个值和它的类型都写作`()`，表示空值或空返回值。如果一个表达式没有任何返回，那么他会返回一个单元。

### 数组

另一个组合元素的方式是*数组*。和元组不同的是，数组的每个元素类型都必须相同。和其他语言不一样的是，Rust中的数组长度是固定的。

可以使用中括号包裹、逗号分割的方式来声明数组：

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
}
```

如果你希望你的数据被分配到栈中而不是堆中（堆和栈会在第四章中讨论）或者希望获取一组固定长度的元素，那么你应该使用数组。数组不像vector一样灵活。vector是一种标准库提供的、大小可调整的类集合类型。如果你不确定你该使用数组还是集合，那么你大概率应该使用集合。第八章会讨论vector的更多细节。

然而，如果你知道元素的数量不会改变。那么数组也是十分有用的。比如，如果你需要定义每个月份的名字，那么你应该使用数组而不是集合，因为它的长度一定为12：

```rust
let months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];

```

数组的类型使用类型和长度定义，分号隔开：

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

这里`i32`是数组元素的了类型，而`5`表示数组有5个元素。

也可以使用分号分隔开的值和数量来快速创建元素相同的数组，比如：

```rust
let a = [3; 5];
```

数组`a`会包含`5`个值`3`。上面的写法和`let a = [3, 3, 3, 3, 3];`相同，只是一种语法糖。

### 访问数组元素

数组是栈中一块已知的、固定长度的可分配内存。你可以使用下标访问数组：

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];

    let first = a[0];
    let second = a[1];
}
```

在这个例子里，变量`first`的值为`1`，因为数组下标1的位置为值`1`。变量`second`的值为`2`，因为数组下标2的位置为值`2`。

### 数组越界

让我们来看看如果你使用超出数组长度的下标访问数组会发生什么。下面的代码类似第二章的猜数游戏：

```rust
use std::io;

fn main() {
    let a = [1, 2, 3, 4, 5];

    println!("Please enter an array index.");

    let mut index = String::new();

    io::stdin()
        .read_line(&mut index)
        .expect("Failed to read line");

    let index: usize = index
        .trim()
        .parse()
        .expect("Index entered was not a number");

    let element = a[index];

    println!("The value of the element at index {index} is: {element}");
}
```

这段代码可以正常编译，如果你运行`cargo run`然后输入`0`、`1`、`2`、`3`或`4`，程序会输出数组中对应位置的值。如果你输入了超出数组长度的数字，比如`10`，你会看到如下输出：

```
thread 'main' panicked at 'index out of bounds: the len is 5 but the index is 10', src/main.rs:19:19
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

由于数组越界，程序抛出了一个运行时异常。程序会因异常退出，且不会执行`println!`语句。当你使用下标访问数组时，Rust会检查下标是否合法。如果下标越界，Rust会崩溃。这样的检查只能在运行时进行，尤其是对于上面的例子，因为编译器无法确定用户的输入值。

这是一个Rust实践内存安全原则的例子。在很多低级的编程语言里，这类型的检查并不会进行，当你提供了不正确的下标，会访问无效的内存。Rust通过立即退出避免了此类问题。第九章会讨论Rust的错误处理，告诉你如何书写可读性高、安全的代码，能同时保证程序的正常运行和避免数组越界。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：数组的值类型必须相同，`[message, 100]`语法试图创建一个包含两个不同类型元素的数组。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let message = "The temperature today is:";
    let x = [message, 100];
    println("{} {}", x[0], x[1]);
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：语法`[x; y]`的作用是声明长度为`y`的元素均为`x`的数组。语法`(a, b)`解构了`t`，将`a`的值绑定为了`[1; 2]`。语法`t.1`指向了`t`的第二个元素，即`[3; 4]`。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let t = ([1; 2], [3; 4]);
    let (a, b) = t;
    println("{}", a[0] + t.1[0]);
}
```

<IsCompile :answer="{ compiled: true, result: '4' }" />

</template>
</Quiz>
</QuizProvider>
:::
