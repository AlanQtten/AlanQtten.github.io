<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  RadioHolder,
  Input
} from "../../components/quiz"

</script>

# 使用String创建强大的UTF-8字符串

在第四章我们已经了解过了字符串，但这里我们会更深入地讨论。Rust新手常常在字符串上卡死，原因是下面三点的任意组合：Rust习惯于暴露各种错误，字符串是一个比很多程序员想象的更复杂的数据结构，UTF-8也一样。这些因素的组合使得Rust中的字符串处理似乎比其他语言更加困难。

在集合的上下文里我们讨论过字符串，因为字符串的底层是字节的集合，再加上一些实用的功能使得这些字节可以被视为文本。这一章中，我们会讨论`String`上和集合相同的操作，比如创建、更新、读取。我们还会讨论`String`和集合不同的地方，即如何索引到字符串受到人类和电脑对字符串数据解释方式的差异的影响而变得很复杂。

## 什么是字符串？

首先我们需要定义好*字符串*这个名词的含义。Rust的核心只包括了一种字符串类型，也就是切片类型`str`，它通常会以借用的形式出现，即`&str`。在第四章，我们讨论了*字符串切片*，它是对一些存储在其他地方的UTF-8编码的引用。比如字符串字面量就存储在程序的二进制文件中，因此它们是字符串切片。

## 创建新的字符串

许多针对`Vec<T>`的操作也同样使用于`String`，因为`String`实际上就是一个字节的vector，在此基础上增加了额外的保障、限制和能力。一个`Vec<T>`和`String`同名的函数就是`new`，对于这两种类型，它都能创建一个新的实例：

```rust
    let mut s = String::new();
```

这行代码创建了一个新的空字符串`s`，之后我们可以向其中载入数据。通常来说，我们会在创建字符串的时候插入初始值。为了完成这个目的，我们可以使用`to_string`方法，这个方法对于任何实现了`Display`特性的类型来说都是有效的，比如：

```rust
    let data = "initial contents";

    let s = data.to_string();

    // 这个方法也可以直接用在字符串字面量上
    let s = "initial contents".to_string();
```

这段代码创建了一个包含`initial contents`的字符串。

我们也可以使用`String::from`来通过字符串字面量创建`String`。下面的代码和使用`to_string`的效果是相同的：

```rust
    let s = String::from("initial contents");
```

因为字符串几乎处处都需要使用，我们为字符串内置了许许多多的方法。它们中的一部分可能是冗余的，但我们仍然保留了它们！在上面的例子里，`String::from`和`to_string`实现了相同的功能，所以选择哪个取决于你的编码风格和代码可读性。

请记住字符串是UTF-8编码的，所以我们可以在其中包含各种字符：

```rust
    let hello = String::from("السلام عليكم");
    let hello = String::from("Dobrý den");
    let hello = String::from("Hello");
    let hello = String::from("שָׁלוֹם");
    let hello = String::from("नमस्ते");
    let hello = String::from("こんにちは");
    let hello = String::from("안녕하세요");
    let hello = String::from("你好");
    let hello = String::from("Olá");
    let hello = String::from("Здравствуйте");
    let hello = String::from("Hola");
```

## 更新字符串

就像`Vec<T>`一样，`String`的大小、内容都是可以更改的。此外，你也可以使用`+`或者`format!`宏来进行字符串拼接。

### 使用`push_str`和`push`为字符串添加内容

我们可以使用`push_str`并传入一个字符串切片来扩充一个`String`：

```rust
    let mut s = String::from("foo");
    s.push_str("bar");
```

这两行代码后，`s`的内容就变为了`foobar`。`push_str`方法接受一个字符串切片作为参数，因为我们并不希望获取参数的所有权。比如在下面的代码里，我们在将`s2`的内容插入到`s1`后仍然希望使用它：

```rust
    let mut s1 = String::from("foo");
    let s2 = "bar";
    s1.push_str(s2);
    println!("s2 is {s2}");
```

如果`push_str`方法消费了`s2`的所有权，我们在最后一行就无法打印它了。然而，这段代码是正常工作的。

`push`方法接受一个单字符作为参数。下面的代码就将“l”插入了`String`：

```rust
    let mut s = String::from("lo");
    s.push('l');
```

结果就是，`s`的内容为`lol`。

### 使用`+`或`format!`宏进行拼接

需要拼接两个存在的字符串也是十分常见的。其中的一个方法是使用`+`：

```rust
    let s1 = String::from("Hello, ");
    let s2 = String::from("world!");
    let s3 = s1 + &s2; // 注意s1被移动了，之后无法被使用
```

`s3`的内容为`Hello, world!`。`s1`不能继续使用、我们使用了`s2`的引用的原因和`+`操作符背后的方法的签名有关，它的签名是这样的：

```rust
fn add(self, s: &str) -> String {
```

在标准库中，你可以看到`add`的定义使用了泛型和关联类型。这里我们用混合类型替代，当我们对`String`调用这个方法时就会发生。我们会在第十章讨论泛型。这个签名可以帮助我们理解`+`背后隐藏的内容。

首先，`s2`的前面使用了`&`，也就意味着我们给第一个字符串传递了一个第二个字符串的*引用*。这是因为`add`方法的`s`参数：我们只能够在`String`上创建`&str`；不能直接将两个`String`相加。等等————`&s2`的类型是`&String`，不是`&str`，它和`add`的签名不一致，为什么这样的代码可以编译通过呢？

我们能够给`add`方法传递`&s2`的原因是编译器可以将`&String`类型*强转*为`&str`。当我们调用`add`方法时，Rust使用了*解引用强转*（deref coercion），他会将`&s2`转为`&s2[..]`。我们会在第15章深入讨论解引用强转。由于`add`没有获取`s`的所有权，`s2`在这个操作后仍然是一个有效的`String`。

其次，我们可以看到`add`方法获取了`self`的所有权，因为`self`并没有使用`&`。也就是说`s1`会被移动至`add`的调用中，在其调用后也不再有效。所以尽管`let s3 = s1 + &s2;`看起来很像对两个字符串进行了复制和创建新字符串，但它实际的操作是：

1. `add`获取了`s1`的所有权，
2. 它复制了`s2`的内容，将其插入了`s1`，
3. 它返回了`s1`的所有权。

如果`s1`有足够的空间能够容纳`s2`，那么不会有任何的内存分配。然而，如果`s1`的空间不足，那么`s1`会自动扩充，分配能容纳两个字符串的空间。

如果你需要进行多个字符串的拼接，继续使用`+`会显得很笨重：

```rust
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toe");

    let s = s1 + "-" + &s2 + "-" + &s3;
```

这种情况下，`s`的值为`tic-tac-toe`。这么多`+`和`"`字符，这样的代码很难阅读。对于更加复杂的场景，我们可以使用`format!`宏：

```rust
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toe");

    let s = format!("{s1}-{s2}-{s3}");
```

这段代码也将`s`设置为了`tic-tac-toe`。`format!`宏的使用方式看起来非常像`println`，但它并不会打印值，而是会返回一个`String`。这样的代码可读性更高，`format!`宏也会自动使用引用，所以它不会消费任何参数的所有权。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`push_str`接收一个`&mut self`，而`+`接收一个`self`，所有`+`会消费所有权，而`push_str`不会。

</template>
<template #quiz>

使用`a + b`和`a.push_str(b)`来拼接字符串有什么区别？

<RadioHolder>
<Radio label="push_str消费了b的所有权，+没有" />
<Radio label="它们没有任何区别，是同一个方法的别名" />
<Radio label="+消费了a的所有权，push_str没有" answer />
<Radio label="push_str在运行时的效率比+好" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：每一次`String::from`和`+`都会导致内存分配。

</template>
<template #quiz>

以下代码的最大堆内存分配次数是多少？

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = s1 + "-" + &s2 + "-" + &s3;
```

<Input answer="7" />

</template>
</Quiz>
</QuizProvider>
:::

## 索引字符串

在许多其他编程语言中，使用索引来访问字符串的独立字符是合法且常见的。然而，如果你在Rust中尝试这么做，你会得到一个错误：

```rust
    let s1 = String::from("hello");
    let h = s1[0];
```

这段代码的报错如下：

```
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0277]: the type `String` cannot be indexed by `{integer}`
 --> src/main.rs:3:13
  |
3 |     let h = s1[0];
  |             ^^^^^ `String` cannot be indexed by `{integer}`
  |
  = help: the trait `Index<{integer}>` is not implemented for `String`
  = help: the following other types implement trait `Index<Idx>`:
            <String as Index<RangeFrom<usize>>>
            <String as Index<RangeFull>>
            <String as Index<RangeInclusive<usize>>>
            <String as Index<RangeTo<usize>>>
            <String as Index<RangeToInclusive<usize>>>
            <String as Index<std::ops::Range<usize>>>

For more information about this error, try `rustc --explain E0277`.
error: could not compile `collections` due to previous error
```

错误信息已经告诉了我们前因后果；Rust的字符串并不支持下标。但是为什么呢？要回答这个问题，我们需要先了解Rust在内存中存储字符串的方式。

### 内部表现

字符串是对`Vec<T>`的封装。让我们看一些UTF-8编码字符串的例子：

```rust
    let hello = String::from("Hola");
```

这种情况下，`len`为4，也就是说vector存储的字符串“Hola”是一个4字节长度。每一个字母在UTF-8编码中都占用一个字节。然而，下面的代码可能会颠覆你的认知（注意下面字符串的开头是大写的西里尔字母Ze，不是阿拉伯数字3）：

```rust
    let hello = String::from("Здравствуйте");
```

如果我问这个字符串的长度，你可能会回答12。实际上，Rust的答案是24：“Здравствуйте”使用UTF-8编码的字节长度，因为每一个Unicode标量值占用了2个字节。因此，一个针对字节的下标并不总是等同于针对Unicode标量值的下标。比如：

```rust
let hello = "Здравствуйте";
let answer = &hello[0];
```

你已经知道了，`answer`并不是第一个字符`З`。当使用UTF-8编码时，`З`的第一个字节是`208`，第二个字节是`151`，所以`answer`的值似乎应该是`208`，可是`208`并不是一个有效的字符。返回`208`大概率不是用户期望的结果；然而，这是下标0位置Rust能找到的唯一数据。用户不希望返回字节数据，尽管字符串是由拉丁字母组成的；如果`&"hello"[0]`是合法的代码，那么它的返回值应该为`104`，而不是`h`。

结果就是，与其返回一个错误的值，引发不必要、难追踪的问题，Rust选择不让这段代码编译，在开发阶段避免了此类问题。

### 字节、标量值和字形簇！天哪！

另一个有关UTF-8的点是，在Rust的角度有三种方式看待字符串：一些字节，一些标量，或者字形簇（最接近我们说的*字*）。

如果我们看一下用天城文书写的印地语单词“नमस्ते”，它存储为`u8`类型的vector后，会是这样的:

```
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164,
224, 165, 135]
```

这是18个字节，也是计算机最终存储这段数据的方式。如果我们用Unicode标量值来看待这个字符串，它会是这样的：

```
['न', 'म', 'स', '्', 'त', 'े']
```

这里有5个`char`值，但第四个和第五个不是字：它们单独存在时是无意义的音符。最后，如果我们用字形簇来看待这个字符串，我们会得到人们说的印地语字：

```
["न", "म", "स्", "ते"]
```

Rust提供了不同的方式来解释计算机存储的原始字符串数据，以便每个程序可以根据需要选择适合的解释，无论程序处理哪种人类语言。

最后一个Rust不允许对`String`类型使用下标来获取字符的原因是下标操作的复杂度永远是(O(1))，但这个复杂度对于`String`来说是无法保证的，因为Rust需要从开头遍历到指定的下标，来确定有多少个合法字符。

### 字符串切片

对字符串使用下标并不是一个好主意，因为它返回的类型并不清晰：是字节，字符，字形簇，亦或是是字符串切片。如果你真的需要下标来创建字符串切片，Rust希望你的使用更加明确。

与其使用中括号包含的单个数字，你可以使用`[]`和一个范围来创建一个字符串切片：

```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

这里，`s`的类型是`&str`，它包含字符串的前四个字节。前面我们提到过这些字符每个占用2个字节，所以`s`的内容是`Зд`。

如果你尝试访问一段字符的一部分字节，比如`&hello[0..1]`，Rust会在运行时报错：

```
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
    Finished dev [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/collections`
thread 'main' panicked at 'byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2) of `Здравствуйте`', src/main.rs:4:14
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

对字符串使用切片时要多加小心，否则可能会使你的程序崩溃。

## 迭代字符串的方法

操作字符串片段的最佳方式是明确指定你需要的是字符还是字节。对于独立的Unicode标量值，可以使用`chars`方法。对“Зд”调用`chars`方法会将其分割为2个`char`，你可以遍历返回的结果来访问每个元素：

```rust
for c in "Зд".chars() {
    println!("{c}");
}
```

这段代码的输出如下：

```
З
д
```

相对应的，`bytes`方法会返回每个字节，它对于你需要处理的内容可能是合适的：

```rust
for c in "Зд".chars() {
    println!("{c}");
}
```

这段代码的输出如下：

```
208
151
208
180
```

请记住合法的Unicode标量值可能由多个字节组成。

从字符串中获取如天城文一样的字形簇是复杂的，所以标准库没有内置这种方法。但你可以在[crates.io](https://crates.io)上找到你需要的crate。

## 字符串并不简单

总结来说，字符串是很复杂的。不同的编程语言会选择暴露不同的复杂度给开发者。Rust希望能让所有的Rust开发者正确地处理`String`，因此选择直接暴露UTF-8的内容。这样的暴露使得Rust中的字符串比其他编程语言更复杂，但却避免了包括处理非ASCII字符时可能发生的各种错误。

好消息是标准库基于`String`和`&str`提供了丰富的功能，它们能帮助你正确地应对复杂场景。请仔细阅读文档，了解诸如`contains`这种字符串搜索，或者`replace`这种字符串替换等等的使用方法。

让我们来看一个没那么复杂的内容：hash map。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：UTF-8字符串可以被解释为字节序列，字符序列，或者字形簇。它们都不能作为字符串的“默认”解释，所以对字符串使用下标是说不通的。

</template>
<template #quiz>
以下哪一个描述最好地解释了Rust不允许字符串使用下标索引的原因？

<RadioHolder>
<Radio label="下标不安全，可能会导致分段错误（segfault）或缓冲区溢出（buffer overflow）" />
<Radio label="对字符串使用下标是存在歧义的，因为字符串代表了多个维度的连续数据" answer />
<Radio label="对字符串使用下标会让Rust的使用太过简单，Rust开发者需要困难度来作为工作保障" />
<Radio label="对字符串使用下标的效率很低，因为它们没有终点，长度很难高效计算" />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：`&str`是保证其切片的字节是合法的UTF-8。因此想要使用`&str`的开发者（比如打印）无需检查其有效性，也无需担心意外创建了无效的字符切片。

</template>
<template #quiz>

以下哪一条对字符串切片`&str`和字节切片`&[u8]`的区别描述最准确？

<RadioHolder>
<Radio label="&str可以从String类型构建，而&[u8]只能从Vec类型构建" />
<Radio label="&str指向的字节总是可以被解释为UTF-8，而&[u8]只是字节序列" />
<Radio label="&str不能被进一步切片，而&[u8]可以" />
<Radio label="&str永远指向程序二进制存储的数据，而&[u8]可以存储任何位置的数据" />
</RadioHolder>
</template>
</Quiz>
</QuizProvider>
:::
