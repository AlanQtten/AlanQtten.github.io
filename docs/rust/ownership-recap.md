<script setup>
import { Wrapper, MemoryGraph } from "../components/memory-graph";
import ShikiCode from "../components/code/ShikiCode.vue";
import { R, W, O } from "../components/letter"
import { lr } from "../utils/renderer"
import {
  QuizProvider,
  Quiz,
  Radio,
  RadioHolder,
  Checkbox,
  CheckboxHolder
} from "../components/quiz"

</script>

# 所有权回顾

这一章讨论了很多新的概念，比如所有权、借用、切片。如果你对系统级编程并不熟悉，这章讨论的比如内存分配、栈/帧、指针、未定义行为也是一些新概念。在我们进入Rust的其余部分前，先停下来喘口气。我们会回顾本周的概念，练习巩固。

## 所有权 vs 垃圾回收

为了引入所有权，我们必须讨论**垃圾回收**。大部分编程语言使用垃圾回收器来管理内存，比如Python，Javascript，Java和Go。垃圾回收器会跟程序一起在运行时运行（或者至少运行一个跟踪回收器）。回收期会扫描内存来找到不再使用的数据————也就是说，运行的程序无法通过函数内部的变量继续访问那些数据。然后，回收器会释放内存。

垃圾回收器带来的核心优势就是避免了C/C++中可能发生的未定义行为（比如使用了被释放的内存）。垃圾回收机制也避免了为检测未定义行为而设计的复杂类型系统，比如Rust。然而，垃圾回收也存在一些缺陷。很明显的就是性能问题，垃圾回收会引发源源不断的小开销（为了进行引用计数，比如Python和Swift）或者不那么频繁的大开销（为了跟踪，比如所有GC设计的语言）。

还有一些不那么明显的缺陷，比如**垃圾回收的行为是不可预测的**。为了验证这个观点，假设我们实现了一个表示一系列可变单词的类`Document`。在一些含垃圾回收的语言里，比如Python，我们会这么设计：

```python
class Document:
  def __int__(self, words: List[str]):
    """Create a new document"""
    self.words = words

  def add_word(self, word: str):
    """Add a word to the document"""
    self.words.append(word)

  def get_words(self) -> List[str]:
    """Get a list of all the words in the document"""
    return self.words
```

下面的代码使用`Document`创建了文档`d`，将`d`复制到`d2`，然后修改`d2`：

```python
words = ["Hello"]
d = Document(words)

d2 = Document(d.get_words())
d2.add_word("world")
```

考虑两个很重要的问题：

1. <strong>words数组什么时候会被释放？</strong>这段代码创建了三个指向相同数组的指针。`words`、`d`和`d2`都包含了指向堆中数组的指针。因此Python会在这三个变量都脱离作用域后再销毁数组。更普遍地讲，通过阅读源代码很难预测数据被垃圾回收的时机。
2. <strong>文档`d`的内容是什么？</strong>由于`d2`和`d`指向了同一个数组，`d2.add_words("world")`也修改了`d`。因此在这个例子里，`d`是`["Hello", "world"]`。这种现象的原因在于`d.get_words()`返回了`d`中数组的可变引用。普遍来说，隐晦的可变引用很容易在数据结构泄露内部结构时引发不可预测的问题。<Thinking>实际上，发明所有权最初的动机和内存安全完全无关。而是为了避免像在Java类似的语言里，数据结构内部的可变引用泄露的问题。如果你对所有权类型的历史感兴趣，可以阅读[Clarke1998年发布的论文](https://dl.acm.org/doi/abs/10.1145/286936.286947)</Thinking>。在这里，修改`d2`影响到了`d`可能并不是代码的本意。

这种问题不仅限于Python————你会在C#，Java，Javascript等等语言里面遭遇到类似的问题。实际上，大多数的编程语言都有指针的概念。关键在于如何将指针暴露给编程人员。垃圾回收使得开发者很难看清变量和数据的关联关系。比如，`d.get_words()`返回的指针指向`d`这件事就很不明显。

相比之下，Rust的所有权模型将指针带到了舞台中央。我们可以把`Document`翻译成Rust的数据结构。正常来说，我们会使用`struct`，但由于还没有介绍到，所以我们先使用类型别名：

```rust
type Document = Vec<String>;

fn new_document(words: Vec<String>) -> Document {
    words
}

fn add_words(this: &mut Document, word: String) {
    this.push(word);
}

fn get_words(this: &Document) -> &[String] {
    this.as_slice()
}
```

这个Rust API和之前的Python API不同的关键在于：
- 函数`new_document`消费了输入集合`words`的所有权。即`Document`拥有了单词集合。可预料到的是，这个单词集合会在其拥有者`Document`生命周期结束时被销毁。
- 函数`add_word`需要一个可变引用`&mut Document`才能操作document。它也消费了输入数据`word`的所有权，也就是说没有任何其他人能够操作document单独的单词。
- 函数`get_words`返回了一个明确的document中字符串不可变引用。想要基于这些单词创建一个新的document，只能深度克隆它，比如：

```rust
fn main() {
    let words = vec!["hello".to_string()];
    let d = new_document();

    // .to_vec() 可以将通过逐个元素克隆的方式
    // 将 &[String] 转化成 Vec<String>
    let words_copy = get_words(&d).to_vec();
    let mut d2 = new_document(words_copy);
    add_word(&mut d2, "world".to_string());

    // `d2`的修改不会影响`d`
    assert(!get_words(&d).contains(&"world".into()));
}
```

这个例子想要说明的观点是：如果Rust不是你的“母语”，那么你应该已经有了一些和内存、指针打交道的经验！Rust只是让这些概念更加明确了。这样做的好处是（1）避免了垃圾回收对运行时性能的影响（2）避免了数据“泄露”对编程时心智负担的影响。

## 所有权的概念

接下来，让我们回顾一下所有权的概念。很快速的回顾————目标只是提醒你相关的概念。如果你觉得你已经忘了或者不理解相关概念，我们会提示你该回到某一章进行详细的学习。

## 运行时的所有权

首先我们来回顾Rust如何在运行时使用内存：

- Rust在栈帧中分配本地变量，它们会在函数开始时被分配，在函数结束时被销毁。
- 本地变量可以直接持有数据（比如数字，布尔值，元组等等）或者指针。
- 指针可以指向盒子（指针拥有的堆数据）或者引用（不拥有的指针）。

下面的图表展示了可以更好的看清上面的概念：

<Wrapper>
<template #code>

```rust
fn main() {
    let mut a_num = 0;
    inner(&mut a_num); /*[!flag L2]*/
}

fn inner(x: &mut i32) {
    let another_num = 1;
    let a_stack_ref = &another_num;

    let a_box = Box::new(2);
    let a_box_stack_ref = &a_box;
    let a_box_heap_ref = &*a_box; /*[!flag L1]*/
}
```

</template>

<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [{ key: 'a_num', value: 0 }]
      },
      {
        name: 'inner',
        body: [
          { key: 'x', point2: 'main.a_num' },
          { key: 'another_num', point2: '1' },
          { key: 'a_stack_ref', point2: 'inner.another_num' },
          { key: 'a_box', point2: 0 },
          { key: 'a_box_stack_ref', point2: 'inner.a_box' },
          { key: 'a_box_heap_ref', point2: 0 },
        ]
      }
    ],
    heap: [{ id: 0, value: 2 }]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'a_num', value: 5 }
      ] }
    ]
  }"
/>
</div>
</template>
</Wrapper>

回顾这个图表，确保你理解了每一部分。比如，你应该能够回答下面的问题：

- 为什么`a_box_stack_ref`指向栈，而`a_box_heap_ref`执行了堆？
- 为什么值`2`在L2不存在了？
- 为什么`a_num`在L2的值为`5`？

如果你想回顾盒子，请重读4.1。如果你想回顾引用，请重读4.2。如果你想学习盒子和引用都包含的场景，请重读4.3。

切片是一种特殊的、指向内存中数据的连续片段的引用。下面的图表展示了一个字符串切片的工作原理：

<Wrapper>
<template #code>

```rust
fn main() {
    let s = String:;from("abcdefg");
    let s_slice = &s[2..5]; /*[!flag L1]*/
}
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 's', point2: 0, },
      {
        key: 's_slice',
        point2: '0.2-5',
        modifier: { Q: ([a,b,c,d], pkg) => [a,b,pkg.pointerEndLeft * 0.7,d] },
       }
    ] }],
    heap: [{ id: 0, value: ['a','b','c','d','e','f','g'] }]
  }"
/>
</template>
</Wrapper>

如果你想回顾切片，请重读4.4。

## 编译时的所有权

Rust会跟踪每一个变量的<R />（读取），<W />（写入），<O />（拥有）权限。只有拥有对应的权限，才能进行对应的操作。举一个基本的例子，如果一个变量没有使用`let mut`声明，那么它就没有<W />权限，也就不能被修改：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 1: return lr({
          perms: [
            { var: 'n', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn main() {
    let n = 0;
    /*[!perm_double R.W.{"collapse":true,"letterBProps":{"missing":true}}]*/n += 1;
}` })'
/>

```rust
fn main() {
    let n = 0;
    /*[!perm_double R.W.{"collapse":true,"letterBProps":{"missing":true}}]*/n += 1;
}
```

如果一个变量的所有权被**移动**或**借用**，那么它的所有权会发生改变。对一个不可复制的元素（比如`Box<T>`或者`String`）进行复制需要<R /><O />权限，且移动会抹除原变量的所有权限。这条规则避免了使用被移动的数据：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 1: return lr({
          perms: [
            { var: 's', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
        case 2: return lr({
          perms: [
            { var: 's', operation: 'e', P: ['s', 'e', 's'] }
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn main() {
    let s = String::from("Hello world");
    consume_a_string(/*[!perm_double R.O.{"collapse":true}]*/s);
    println!("{}", /*[!perm R.{"collapse":true,"missing":true}]*/s); // \`s\` 已经被移动，无法读取
}
fn consume_a_string(_s: String) {
    // 字符串被我吃了
}` })'
/>

如果你想回顾移动的原理，请重读4.1。

借用一个变量（创建一个指向它的引用）会暂时性地移除一个变量的部分权限。一个不可变的借用会创建一个不可变的引用，同时也会禁用借用的数据的修改和移动。比如，打印一个不可变引用是可以的：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          perms: [{ var: 's', operation: 'g', P: 'p' }]
        })
        case 1: return lr({
          perms: [
            { var: 's', operation: 'b', P: [null, 's', 's'] },
            { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*s_ref', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 2: return lr({
          perms: [
            { var: 's', operation: 'r', P: [null, 'p', 'p'] },
            { var: 's_ref', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*s_ref', operation: 'l', P: ['s', 'e', 'e'] },
          ]
        })
        case 3: return lr({
          perms: [{ var: 's', operation: 'l', P: 's' }]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut s = String::from("Hello");
let s_ref = &/*[!perm R.{"collapse":true}]*/s;
println!("{}", /*[!perm R.{"collapse":true}]*/s_ref);
println!("{}", /*[!perm R.{"collapse":true}]*/s)` })'
/>

但修改一个不可变引用是不允许的：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
        case 1: return lr({
          perms: [
            { var: '*s_ref', operation: 'g', P: ['p', 'e', 'e'], collapse: true },
            { var: 's', operation: 'b', P: [null, 's', 's'] },
            { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut s = String::from("Hello");
let s_ref = &/*[!perm R.{"collapse":true}]*/s;
s_ref/*[!perm_double R.W.{"collapse":true,"letterBProps":{"missing":true}}]*/.push_str(" world");
println!("{s}")` })'
/>

从引用中移出数据也是不允许的：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
        case 1: return lr({
          perms: [
            { var: '*s_ref', operation: 'g', P: ['p', 'e', 'e'], collapse: true },
            { var: 's', operation: 'b', P: [null, 's', 's'] },
            { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut s = String::from("Hello");
let s_ref = &/*[!perm R.{"collapse":true}]*/s;
let s2 = /*[!perm_double R.O.{"collapse":true,"letterBProps":{"missing":true}}]*/*s_ref;
println!("{s}")` })'
/>

一次可变的借用可以创建可变的引用，同时也会禁止借用数据的读取，写入或者移动。比如，修改一个可变的引用是允许的：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          perms: [
            { var: 's', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
        case 1: return lr({
          perms: [
            { var: 's', operation: 'b', P: 's' },
            { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*s_ref', operation: 'g', P: ['p', 'p', 'e'] }
          ]
        })
        case 2: return lr({
          perms: [
            { var: 's', operation: 'r', P: 'p' },
            { var: 's_ref', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*s_ref', operation: 'l', P: ['s', 's', 'e'] }
          ]
        })
        case 3: return lr({
          perms: [
            { var: 's', operation: 'l', P: 's' }
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut s = String::from("Hello");
let s_ref = &mut /*[!perm_double R.W.{"collapse":true}]*/s;
s_ref/*[!perm_double R.W.{"collapse":true}]*/.push_str(" world");
println!("{}", /*[!perm R.{"collapse":true}]*/s)` })'
/>

但访问被进行了可变借用的数据是不允许的：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'g', P: 'p' }
          ]
        })
        case 1: return lr({
          perms: [
            { var: 's', operation: 'b', P: 's', collapse: true },
            { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*s_ref', operation: 'g', P: ['p', 'p', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut s = String::from("Hello");
let s_ref = &mut /*[!perm_double R.W.{"collapse":true}]*/s;
println!("{}", /*[!perm R.{"collapse":true,"missing":true}]*/s);
s_ref.push_str(" world");` })'
/>

如果你想回顾权限和引用，请重读4.2。

## 所有权在运行时和编译时的关联

Rust的权限设计是为了避免未定义行为。比如，很常见的一种未定义行为就是**释放后使用**，包括对被释放数据的读和写。不可变引用移除了<W />权限来避免释放后使用，比如：

<Wrapper>
<template #code>

```rust
let mut v = vec![1, 2, 3];
let n = &v[0]; /*[!flag L1]*/
v.push(4); /*[!flag L2]*/
println!("{n}"); /*[!flag_error L3]*/
```

</template>
<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 0 },
      { key: 'n', point2: 0 },
    ] }],
    heap: [{ id: 0, value: [1,2,3] }]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 0 },
      { key: 'n', point2: 'null' },
    ] }],
    heap: [{ id: 0, value: [1,2,3,4] }]
  }"
/>

<MemoryGraph
  title="L3"
  error-message="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 0 },
      { key: 'n', point2: 'null_error' },
    ] }],
    heap: [{ id: 0, value: [1,2,3,4] }]
  }"
/>
</div>
</template>
</Wrapper>

另一种常见的未定义行为就是**重复释放**，即对头一块内存释放两次。不同的是，指向不可复制数据的引用没有<O />权限，避免了重复释放，比如：

<Wrapper>
<template #code>

```rust
let v = vec![1, 2, 3];
let v_ref: &Vec<i32> = &v;
let v2 = *v_ref; /*[!flag L1]*/
drop(v2); /*[!flag L2]*/
drop(v); /*[!flag_error L3]*/
```

</template>
<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 0 },
      { key: 'v_ref', point2: 'main.v' },
      { key: 'v2', point2: 0 },
    ] }],
    heap: [{ id: 0, value: [1,2,3] }]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 'null' },
      { key: 'v_ref', point2: 'main.v' },
      { key: 'v2', point2: 'null', moved: true },
    ] }],
  }"
/>

<MemoryGraph
  title="L3"
  error-message="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 'null_error', moved: true },
      { key: 'v_ref', point2: 'main.v' },
      { key: 'v2', point2: 'null_error', moved: true },
    ] }],
  }"
/>
</div>
</template>
</Wrapper>

如果你想回顾未定义行为，重读4.1和4.3。

## 其他

在我们进一步介绍类似结构体、枚举、特性等功能时，所有权会和他们相互交融。这一章是进一步学习Rust的基础————内存、指针、未定义行为和权限的概念会帮助我们掌握更多Rust的高级功能。

别忘了进行小测检查你的理解！

::: details 小测（7）
<QuizProvider>
<Quiz>
<template #description>

解析：函数调用的目的是直接修改，因此最合适的类型签名就是接收可变引用。不可变引用或者普通的集合都是不合适的。

</template>
<template #quiz>

如果你想实现下面的函数：

将输入的浮点数集合中所有的浮点数进行四舍五入并直接修改

下面哪一个函数签名和这个功能最贴切？

<RadioHolder>
<Radio>

```rust
fn round_all(v: &Vec<f32>) -> Vec<f32>;
```

</Radio>
<Radio>

```rust
fn round_all(v: Vec<f32>);
```

</Radio>
<Radio>

```rust
fn round_all(v: &Vec<f32>);
```

</Radio>
<Radio answer>

```rust
fn round_all(v: &mut Vec<f32>);
```

</Radio>
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：对于`haystack`，切片类型`&[String]`相比`&Vec<String>`可以接收更多类型的输入，所以它是更好的选择。对于`needle`，目标的子串不一定占用了堆分配的空间，所以`&str`比`String`更好。对于返回值，`Vec<String>`要求克隆输入的字符串，因此它是不合适的。`&[String]`也是不合适的，因为它只能返回连续的内容。`Vec<&String>`是最好的选择，因为它只需要分配指针空间，不需要分配字符串本身的空间。

</template>
<template #quiz>

如果你想实现下面的函数：

函数接收一个字符串集合和一个子串，返回集合中所有包含这个子串的字符串

下面哪一个函数签名和这个功能最贴切？

<RadioHolder>
<Radio>

```rust
fn find_contains(haystack: &Vec<String>, needle: &str) -> &[String];
```

</Radio>
<Radio>

```rust
fn find_contains(haystack: &[String], needle: &str) -> Vec<String>;
```

</Radio>
<Radio answer>

```rust
fn find_contains(haystack: &[String], needle: &str) -> Vec<&String>;
```

</Radio>
<Radio>

```rust
fn find_contains(haystack: &Vec<String>, needle: String) -> Vec<String>;
```

</Radio>
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：就像在4.3中的讨论过的一样，函数`split_at_mut`是使用了`unsafe`功能实现的。这个功能并没有完全禁用借用检查器，而是允许使用特定的不安全功能，比如裸指针。

</template>
<template #quiz>

通常Rust不允许同一个数组存在多个可变访问，即使他们毫不相干。比如，下面的程序无法编译：

```rust
fn main() {
    let mut v = vec![0, 1, 2, 3];
    let (r0, r1) = (&mut v[0..2], &mut v[2..4]);
    r0[0] += 1;
    r1[0] += 1;
}
```

然而，Rust标准库中的`slice::split_at_mut`却能实现这个功能：

```rust
fn main() {
    let mut v = vec![0, 1, 2, 3];
    let (r0, r1) = v.split_at_mut(2);
    r0[0] += 1;
    r1[0] += 1;
}
```

哪一个选项最好地描述了`split_at_mut`实现的可能性？

<RadioHolder>
<Radio label="split_at_mut是特殊的编译器原语，无法在语言内部实现" />
<Radio label="split_at_mut使用了不安全代码，禁用了借用检查器对可变引用安全性的检查" />
<Radio label="split_at_mut调用了一个无法被Rust分析的C库" />
<Radio label="split_at_mut使用了不安全的代码，通过裸指针避开了借用检查器" answer />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：<O />权限代表了一个对象的所有权。而一个对象只能有一个拥有者，因此对于不可复制的类型（比如`String`），引用不能移动所有权是十分重要的。如果两个变量认为它们拥有了同一个字符串，它们都会尝试销毁它，最终引发重复销毁。

</template>
<template #quiz>

现有如下程序：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 's', operation: 'g', P: ['p', 'e', 'p'] }
          ]
        })
        case 1: return lr({
          perms: [
            { var: '*s_ref', operation: 'g', P: ['p', 'e', 'e'], collapse: true },
            { var: 's', operation: 'b', P: ['s', 'e', 's'] },
            { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let s = String::new();
let s_ref = &/*[!perm R.{"collapse":true}]*/s;` })'
/>

哪一个选项最准确地解释了为什么`*s_ref`没有<O />（拥有）权限？

<RadioHolder>
<Radio label="所有权意味着可读取，而读取*s_ref会导致使用空指针" />
<Radio label="所有权意味着修改，而修改*s_ref会导致使用空指针" />
<Radio label="所有权意味着借用，而借用*s_ref会导致重复释放" />
<Radio label="所有权意味着移动，而将一个引用移出会导致重复释放" answer />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：借用检查器总会拒绝包含了未定义行为的程序，但偶尔也会拒绝不包含未定义行为的程序（即使它们是完全安全的）。从技术的角度来说，借用检查器是一个健全但不完备的分析系统。

</template>
<template #quiz>

现有一系列Rust程序，都不包含`unsafe`的代码。选择以下对这些程序被借用检查器通过/拒绝描述正确的选项：

<CheckboxHolder>
<Checkbox label="借用检查器有时会拒绝不含未定义行为的程序" answer />
<Checkbox label="借用检查器有时会接收包含未定义行为的程序" />
<Checkbox label="借用检查器总会通过不包含未定义行为的程序" />
<Checkbox label="借用检查器总会拒绝包含未定义行为的程序" answer />
</CheckboxHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这段代码会导致重复释放。

</template>
<template #quiz>

下面的函数`extract`被借用检查器拒绝了

```rust
fn extract(b: &Box<i32>) -> i32 {
    let b2: Box<i32> = *b
    *b2
}
```

如果借用检查器没有拒绝这个函数。请判断是否存在输入会让这个函数引发未定义行为：

<RadioHolder>
<Radio label="会" answer />
<Radio label="不会" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：借用检查器拒绝这段代码的原因是它认为`get_first`和`get_second`会返回元组中任意的引用，所以`fst`和`snd`可能会指向同一份数据。但在这个程序里它们永远是不同的，所以这个函数是安全的。

</template>
<template #quiz>

下面的函数`transfer_string`被借用检查器拒绝了

```rust
fn get_first(strs: &mut (String, String)) -> &mut String {
    &mut strs.0
}

fn get_second(strs: &mut (String, String)) -> &mut String {
    &mut strs.1
}

fn transfer_string(strs: &mut (String, String)) {
    let fst = get_first(strs);
    let snd = get_second(strs);
    fst.push_str(snd);
    snd.clear()
}
```

如果借用检查器没有拒绝这个函数。请判断是否存在输入会让这个函数引发未定义行为：

<RadioHolder>
<Radio label="会" />
<Radio label="不会" answer />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
