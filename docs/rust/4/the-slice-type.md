<script setup>
  import { ref } from "vue"
  import { Wrapper, MemoryGraph, DetailMode } from "../../components/memory-graph";
  import ShikiCode from "../../components/code/ShikiCode.vue";
  import {
    Quiz,
    QuizProvider,
    Radio,
    Option,
    IsCompile,
    IsCompileText,
  } from "../../components/quiz";
  import { lr } from "../../utils/renderer"
  import { Vec } from "../../utils/generateStructure"

  const vec11_0 = ref({ title: 'String', body: [{ name: 'vec', value: Vec({ cap: 11, point2: 0 }) }] })
</script>

# 切片类型

切片允许你对集合中连续的一部分、而不是完整的集合创建引用。切片也是一种引用，所以它也是不拥有的指针。

为了阐述切片的易用性，我们来开发一个小程序：现有由数个单词组成的字符串，单词由空格分隔，查找其中的第一个单词。如果没有找到空格，那么整个字符串看作一个单词。没有切片，程序的签名可能如下：

```rust
fn first_word(s: &String) -> ?
```
`first_word`函数的参数是`&String`类型。我们不需要字符串的所有权，所以这就够了。但是该返回什么呢？并没有一个很好的类型来描述**字符串的一部分**。然而，我们可以返回单词结束的下标，如下：

```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i
        }
    }

    s.len()
}
```

因为我们需要遍历整个字符串元素并检查空格，我们需要使用`as_bytes`将字符串转为bytes数组：

```rust
    let bytes = s.as_bytes();
```

然后，我们要创建一个迭代器：

```rust
    for (i, &item) in bytes.iter().enumerate() {
```

我们会在后面的章节讨论迭代器。现在，只要知道`iter`是一个能返回集合每一个元素的方法，而`enumerate`将`iter`的返回值进行了封装，以元组的形式返回了下标和对元素的引用。这种方式比自行计算下标更方便。

因为`enumerate`返回了元组，我们可以使用模式匹配来解构它。这部分我们也会在后续的章节讨论。在`for`循环中，我们明确了`i`表示下标，`&item`表示对字符的引用。因为`iter().enumerate()`返回的是对元素的引用，我们在模式匹配中标注了`&`。

在`for`循环内，我们查找了使用字符字面量语法来查找代表空格的字符。如果找到了，返回其位置。否则，使用`s.len()`返回字符串的长度：

```rust
        if item == b' ' {
            return i
        }
    }

    s.len()
```

现在我们有办法来找到第一个单词的下标了，但这里有个问题。我们返回了`usize`，它仅仅在`&String`的上下文里才是有意义的。换句话说，因为它和`String`是分开的，在未来无法保证它仍然有效。比如下面的程序对于`first_word`的使用：

<Wrapper>
<template #code>
<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*s', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 1: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'bytes', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*bytes', operation: 'g', P: ['p', 'e', 'e'] },
            { var: '(*bytes)[_]', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 2: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'bytes', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*bytes', operation: 'l', P: ['s', 'e', 'e'] },
            { var: '(*bytes)[_]', operation: 'l', P: ['s', 'e', 'e'] },
            { var: 'i', operation: 'c', P: ['p', 'e', 'p'] },
            { var: 'item', operation: 'c', P: ['p', 'e', 'p'] },
          ]
        })
        case 3: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*s', operation: 'l', P: ['s', 'e', 'e'] },
            { var: 'item', operation: 'l', P: ['s', 'e', 's'] },
          ]
        })
        case 4:
        case 5: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'i', operation: 'l', P: ['s', 'e', 's'] },
          ]
        })
        case 10: return lr({
          perms: [
            { var: 's', operation: 'g', P: 'p' },
          ]
        })
        case 12: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'l', P: 's' },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn first_word(s: &String) -> usize {
    let bytes = s/*[!perm R.{"collapse":true}]*/.as_bytes();
    for (i, &item) in bytes/*[!perm R.{"collapse":true}]*/.iter().enumerate() {
        if /*[!perm R.{"collapse":true}]*/item == b&#39; &#39; {
            return /*[!perm R.{"collapse":true}]*/i
        }
    }
    s/*[!perm R.{"collapse":true}]*/.len()
}
fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&/*[!perm R.{"collapse":true}]*/s); /*[!flag L1]*/
    s/*[!perm_double R.W]*/.clear(); /*[!flag L2]*/
}` })'
/>
</template>

<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 's', point2: 0 },
      { key: 'word', value: 5 },
    ] }],
    heap: [{ id: 0, value: ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'] }]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 's', point2: 0 },
      { key: 'word', value: 5 },
    ] }],
    heap: [{ id: 0, value: null }]
  }"
/>
</div>
</template>
</Wrapper>

这段代码编译通过了，`s`在`first_word`调用后也保留了写的权限。因为`word`并没有和`s`的状态关联，`word`仍然保留了值`5`。我们可能会使用`5`从`s`取出第一个单词，但那是一个bug，因为在我们保存了`5`之后`s`的内容已经改变了。

必须时时刻刻留心`word`和`s`不同步的问题是十分乏味且易出错的！对这些索引的管理扩展性也很差，如果我们要写一个`second_word`，那么它的签名可能是这个样子：

```rust
fn second_word(s: &String) -> (usize, usize) {
```

现在我们需要维护开始和结束的索引，导致更多基于它们进行计算的数据紊乱。这三个变量在程序中游荡，却又需要同步。

幸运的是，Rust对此给出了解决方案：字符串切片。

## 字符串切片

字符串切片就是对字符串的部分引用，如下：

<Wrapper>
<template #code>

```rust
let s = String::from("hello world");

let hello: &str = &s[0..5];
let world: &str = &s[6..11];
let s2: &String = &s; /*[!flag L1]*/
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 's', point2: 0 },
      { key: 'hello', point2: '0.0-5', modifier: { Q: ([a,b,c,d], pkg) => [a,b,pkg.pointerEndLeft * 0.73,d] } },
      { key: 'world', point2: '0.6-11', modifier: { Q: ([a,b,c,d], pkg) => [a,b,pkg.pointerEndLeft * 0.65,d] } },
      { key: 's', point2: 'main.s' },
    ] }],
    heap: [{ id: 0, value: ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'] }]
  }"
/>
</template>
</Wrapper>

相比于创建一个对于整个`String`的引用（比如`s2`），`hello`只引用了`String`的一部分，使用额外的`[0..5]`标注。使用诸如`[开始下标..结束下标]`的语法可以创建切片类型，遵循含头不含尾的原则。

切片是一种特殊的引用，因为它们是“胖”指针，或者说带有元数据的指针。在这个地方，元数据就是切片的长度。可以从下面的图表看到它的完整结构：

<Wrapper>
<template #graph>
<DetailMode defaultDetailMode>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 's', point2: 0, detail: vec11_0 },
        {
          key: 'hello',
          point2: '0.0-5',
          modifier: { Q: ([a,b,c,d], pkg) => [a,b,pkg.pointerEndLeft * 0.73,d] },
          detail: { body: [{ name: 'ptr', point2: '0.0-5' }, { name: 'len', value: 5 }] }
        },
        {
          key: 'world',
          point2: '0.6-11',
          modifier: { Q: ([a,b,c,d], pkg) => [a,b,pkg.pointerEndLeft * 0.65,d] },
          detail: { body: [{ name: 'ptr', point2: '0.6-11' }, { name: 'len', value: 5 }] }
        },
        { key: 's2', point2: 'main.s' }
      ] }
    ],
    heap: [{ id: 0, value: ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'] }]
  }"
/>
</DetailMode>
</template>
</Wrapper>

可以看到变量`hello`和`world`都有`ptr`和`len`属性，它们共同定义了变量引用的堆字符串区域。你也可以看到`String`真实的结构：一个字符的集合（`Vec<u8>`），包括长度`len`、缓存`buf`，`buf`内又包含指针`ptr`、容量`cap`等。

由于切片也是引用，它们也能改变引用数据的权限，比如，从下面可以看到`hello`从`s`创建后，`s`丢失了写和拥有权限：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 1: return lr({
          perms: [
            { var: 's', operation: 'g', P: 'p' }
          ]
        })
        case 2: return lr({
          perms: [
            { var: 's', operation: 'b', P: [null, 's', 's'] },
            { var: 'hello', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*hello', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 3: return lr({
          perms: [
            { var: 's', operation: 'r', P: [null, 'p', 'p'] },
            { var: 'hello', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*hello', operation: 'l', P: ['s', 'e', 'e'] },
          ]
        })
        case 4: return lr({
          perms: [
            { var: 's', operation: 'l', P: 's' }
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn main() {
    let mut s = String::from("hello");
    let hello: &str = &/*[!perm R.{"collapse":true}]*/s[0..5];
    println!("{}", /*[!perm R.{"collapse":true}]*/hello);
    s/*[!perm_double R.W.{"collapse":true}]*/.push_str(" world");
}` })'
/>

## 范围语法

在Rust的`..`范围语法中，如果你希望从0开始，可以省略掉开始的数字。换句话说，下面这两种语法是一样的：

```rust
let s = String::from("hello");

let slice = &s[0..2];
let slice = &s[..2];
```

同样的，如果你希望切片到字符串的最后一个元素，可以省略掉结尾的数字。即下面这两种语法是一样的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[3..len];
let slice = &s[3..];
```

也可以省略掉两边的数字，来获取整个字符串的切片：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[0..len];
let slice = &[..];
```

> [!NOTE]
> 字符串切片的范围索引必须是在有效的UTF-8字符。如果你尝试在多字节字符的中间创建字符串切片，程序将会以错误退出。在介绍字符串切片的这一部分中，我们假设仅使用ASCII，有关UTF-8处理的更详细讨论，请参见第八章的“用字符串存储UTF-8编码的文本”部分。

## 使用字符串切片重写`first_word`

在获取了这么多信息后，让我们使用切片重写`first_word`吧。字符串切片的签名写作`&str`：

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b'' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

和之前获取单词下标的方式相同，但不同的是在找到空格时我们返回了这个单词的切片。

现在当我们调用`first_word`时，我们会直接获取跟实际数据绑定的部分，它是一个切片引用。

对于`second_word`来说，返回一个切片仍然是有效的：

```rust
fn second_word(s: &String) -> &str {
```

现在我们有了一个稳定性极高的API，因为编译器会始终保证指向`String`的引用是有效的。再回顾之前的数据不同步的bug，当我们获得了第一个单词的下标，然后清空了字符串，下标还可用吗？这样的代码逻辑上就是不正确的，但却不会立刻报错，在我们后续尝试对一个空字符串使用这个索引时问题才会显现。切片消灭了这个漏洞，让我们更早地发现了程序的问题：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 1: return lr({
          defaultCollapse: true,
          perms: [{ var: 's', operation: 'g', P: 'p' }]
        })
        case 2: return lr({
          perms: [
            { var: 's', operation: 'b', P: [null, 's', 's'], collapse: true },
            { var: 'word', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*word', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn main() {
    let mut s = String::from("hello world");
    let world = first_word(&/*[!perm R.{"collapse":true}]*/s);
    s/*[!perm_double R.W.{"letterBProps":{"missing":true}}]*/.clear()
    println!("the first word is: {}", word);
}` })'
/>

可以看到调用`first_word`移除了`s`的写权限，因此`s.clear()`的调用被阻止了，下面是编译的错误

```
$ cargo run
    Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
  --> src/main.rs:18:5
  |
16|    let word = first_word(&s);
  |                          -- immutable borrow occurs here
17|
18|    s.clear(); // error!
  |    ^^^^^^^^^ mutable borrow occurs here
19|
20|    println!("the first word is: {}", word);
  |                                      ---- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `ownership` due the previous error
```

回顾借用的规则，如果某项数据含有一个不可变的引用，那么就不能由其创建可变引用。因为`clear`需要销毁`String`，它需要获取可变引用。而调用`clear`后的`println!`使用了`word`的引用，因此在这个点不可变引用仍然需要存活。Rust不允许`clear`中的可变引用和`word`中的不可变引用同时存在，因此编译失败了。Rust不仅使我们的API更容易使用，它也在编译时消除了一整个类别的错误！

## 字符串字面量即切片

回顾我们讨论过的字符串字面量存储在二进制中的情况。现在我们了解了切片，我们可以更正确地了解字符串字面量：

```rust
let s = "Hello world!";
```

`s`的类型是`&str`：它是指向二进制数据特定位置的切片。也是为什么字符串字面量不可变的原因；`&str`是不可变引用。

## 字符串切片作为参数

了解了字符串字面量切片和`String`的关系，我们可以进一步改进`first_word`，下面是它的签名：

```rust
fn first_word(s: &String) -> &str {
```

更有经验的Rust程序员会使用下面的形式，因为这样允许我们在同一个函数上使用`&String`和`&str`。

```rust
fn first_word(s: &str) -> &str {
```

如果你有一个字符串切片，可以直接传入。如果你有一个`String`，可以传入`String`的切片或者`String`的引用。这种灵活度源自强制类型转换，这部分内容我们会在后面讨论。定义一个参数为字符串切片而非`String`引用让我们的API更具普适性，且没有丢失任何功能：

```rust
fn main() {
    let my_string = String::from("hello world");

    // `first_word`可以传入字符串部分/完整切片
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    // `first_word`可以传入字符串引用，相当于传入了整个字符串的切片
    let word = first_word(&my_string);

    let my_string_literal = "hello world";

    // `first_word`可以传入字符串字面量的部分/完整切片
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);

    // 由于字符串字面量本身已经是切片类型
    // 因此，不需要切片语法也可以直接传入
    let word = first_word(my_string_literal);
}
```

## 其他切片

跟你想象的一样，字符串切片是特定指字符串的。但其实也存在更加普适的类型。比如下面的数组：

```rust
let a = [1, 2, 3, 4, 5];
```

就像我们对字符串切片的需求一样，我们可能希望指向数组的一部分。那么我们可以这么做：

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3];

assert_eq!(slice, &[2, 3]);
```

这段切片的类型是`&[i32]`。它的工作方式和字符串切片相同，通过存储一个元素引用和长度。你也可以在其他各种集合上面使用这种切片语法。这部分我们会在后面讨论。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`&String`类型是一个单指针类型，所以在64位的系统里面它占用8个字节。而`&str`是一个特殊的切片引用，它包含了指针和切片的长度，因此占用了16个字节。所以`s3`的类型`&str`比`s2`的类型`&String`使用了更多的内存。你可以使用`std::mem::size_of`来自己验证：

```rust
fn main() {
    println!(
        "&String={} &str={}",
        std::mem::size_of::<&String>(),
        std::mem::size_of::<&str>(),
    )
}
```

另外，请注意Rust会根据引用所在的上下文隐式地对`&String`或`&str`进行转换。所以`&s`可能会在不同的情况下显现不同的类型。

</template>
<template #quiz>

下面的程序中有两个变量`s2`和`s3`。它们会存储在`main`的栈帧中。每个变量都占用了栈的内存空间，但没有包括其指向的数据。下面哪一个对于`s2`和`s3`的说法是正确的？

```rust
fn main() {
    let s = String::from("hello");
    let s2: &String = &s;
    let s3: &str = &s[..];
}
```

<Radio>
<Option label="s3比s2占用的字节更少" />
<Option label="s3和s2占用的字节一样" />
<Option label="s3比s2占用的字节更多" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：由于`s.as_bytes()`制造了对`s`的不可变引用，所以此时在循环体内修改`s`（即`push_str`）是不合法的。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut s = String::from("hello");
    for &item in s.as_bytes().iter() {
        if item === b'l' {
            s.push_str(" world");
        }
    }
    println!("{s}");
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>
</QuizProvider>
:::

## 总结

切片是一种对连续区间的特殊引用，比如对字符串或者集合的切片。在运行时，切片会作为“胖指针”存在，它存储了对连续区间开始元素的指针和这段区间的长度。切片对比单纯的存储下标的一大好处就是它在使用时不会被无效化。
