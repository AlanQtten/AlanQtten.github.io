<script setup>
import ShikiCode from "../components/code/ShikiCode.vue"
import LetterTable from "../components/letter/LetterTable.vue"
import { W } from "../components/letter"
import { h } from "vue"
import Wrapper from "../components/memory-graph/Wrapper.vue"
import MemoryGraph from "../components/memory-graph/MemoryGraph.vue"
import Quiz from "../components/quiz/QuizHolder.vue"
import QuizProvider from "../components/quiz/QuizProvider"
import Radio from "../components/quiz/Radio.vue"
import RadioHolder from "../components/quiz/RadioHolder.vue"

</script>

# 修复错误的所有权

学习如何修复所有权的错误是Rust的核心技巧之一。当借用检查器拒绝了你的程序，该如何应对呢？在这一小节里，我们会讨论一系列常见的所有权错误场景。每一个场景都会提出一个被编译器拒绝的程序，然后解释并提出（一个或多个）解决方案。

比较容易理解的情况是，对于安全的函数和不安全的函数，Rust总会拒绝那些不安全的程序。<Thinking>这种保障只限于“安全”分组下的Rust代码。如果你使用了`unsafe`标识或者引入了不安全的库（比如调用了一个C库）。这种情况下你的安全问题只能自己负责。</Thinking>但是有时候，Rust也会拒绝安全的程序。下面的各种场景会展示如何应对这两种场景。

## 修复不安全程序：在栈中返回引用

第一个场景是关于在栈中返回引用，如同我们在上一节讨论过的。也就是下面的函数

```rust
fn return_a_string() -> &String {
    let s = String::from("Hello world");
    &s
}
```

要解决这个问题，我们首先要问：为什么这个程序不安全？问题在于被引用数据的生命周期。如果你想要传递一个字符串的引用，你需要确保这个字符串存活的时候够久。

基于这种情况，有四种办法可以延长字符串的生命周期。第一种办法是将字符串的所有权移出函数，把`&String`改为`String`：

```rust
fn return_a_string() -> String {
    let s = String::from("Hello world");
    s
}
```

另一种办法是返回一个永远存在的字符串字面量（使用`'static`标识）。这种方案适用于我们永远不打算修改字符串，因此分配堆内存也没什么必要了：

```rust
fn return_a_string() -> &'static str {
    "Hello world"
}
```

另一种办法是使用垃圾回收来将借用检查延迟到运行时。比如，可以使用引用计数指针：

```rust
use std::rc::Rc;
fn return_a_string() -> Rc<String> {
    let s = Rc::new(String::from("Hello world"));
    Rc::clone(&s)
}
```

我们会在第14章讨论引用计数。简单来说，`Rc::clone`只克隆了`s`的指针，并没有克隆其数据。在运行时，`Rc`会检测最后一个`Rc`指针被释放的时机，然后销毁数据。

另一种办法是使用可变引用来提供一个“槽”：

```rust
fn return_a_string(output: &mut String) {
    output.replace_range(.., "Hello world");
}
```

在这种策略下，调用者负责为字符串创建空间。这种风格比较啰嗦，但调用者需要仔细地控制分配的时机，那么它对内存的使用率比较高。

具体采用哪一种策略取决于你的应用程序。关键在于分析出潜藏在所有权错误表象下的根本问题。你期望你的字符串存活多久？谁应该负责销毁？一旦你对这些问题有了清楚的答案，策略的选择只是对于不同API的调用罢了。

## 修复不安全程序：权限不足

另一个常见的问题是尝试操作只读数据，或尝试销毁引用指向的数据。比如，如果我们现在需要一个函数`stringify_name_with_title`。这个函数的作用是使用名字的集合来创建完整的名字，并为其增加一个额外的称号。

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return h(LetterTable, { perms: [
          { var: 'name', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*name', operation: 'g', P: ['p', 'e', 'e'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn stringify_name_with_title(name: &Vec<String>) -> String {
    name/*[!perm_double R.W.{"letterBProps":{"missing":true}}]*/.push(String::from("Esq."));
    let full = name.join(" ");
    full
}
// ideally: ["Ferris", "Jr."] => "Ferris Jr. Esq."` })'
/>

这个程序会被借用检查器拒绝，因为`name`是一个不可变引用，但`name.push(..)`需要<W />权限。这个程序是不安全的，因为`push`可能会导致`stringify_name_with_title`以外的其他指向`name`的引用被无效化，比如：

<Wrapper>
<template #code>

```rust
fn main() {
    let name = vec![String::from("Ferris")];
    let first = &name[0]; /*[!flag L1]*/
    stringify_name_with_title(&name); /*[!flag L2]*/
    println!("{}", first); /*[!flag_error L3]*/
}
```

</template>

<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'name', point2: 1 },
      { key: 'first', point2: 1 }
    ] }],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] },
      { id: 1, point2: 0 },
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :wrapper-style="{ paddingBottom: '3rem' }"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'name', point2: 2 },
      { key: 'first', point2: 'null' }
    ] }],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] },
      { id: 1, value: ['E', 's', 'q', '.'] },
      { id: 2, point2: [1, 0] },
    ]
  }"
/>

<MemoryGraph
  title="L2"
  error-message="未定义行为：指针在其指向的对象被释放后被使用"
  :wrapper-style="{ paddingBottom: '3rem' }"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'name', point2: 2 },
      { key: 'first', point2: 'null_error' }
    ] }],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] },
      { id: 1, value: ['E', 's', 'q', '.'] },
      { id: 2, point2: [1, 0] },
    ]
  }"
/>
</div>
</template>
</Wrapper>

在这个例子中，在`stringify_name_with_title`前创建了一个对`name[0]`的引用`first`。而`name.push(..)`对name的内容进行了重分配，也就使得`first`被无效化了，进而导致`println`读取了被销毁的内存。

那么我们如何修复这个问题呢？最简单的办法就是把形参的类型从`&Vec<String>`改成`&mut Vec<String>`：

```rust
fn stringify_name_with_title(name: &mut Vec<String>) -> String {
    name.push(String::from("Esq."));
    let full = name.join(" ");
    full
}
```

但这不是一个好办法！**如果调用者不希望函数修改输入，那么函数就不应该修改**。`stringify_name_with_title`的调用者可能并不希望集合被这个函数修改。如果这个函数叫做`add_title_to_name`，那么他可以修改输入，但显然和当前的语义是不符的。

另一个选择是从name获取所有权，即将`&Vec<String>`修改为`Vec<String>`：

```rust
fn stringify_name_with_title(mut name: Vec<String>) -> String {
    name.push(String::from("Esq."));
    let full = name.join(" ");
    full
}
```

但这也不是一个好办法！**对一个Rust函数来说，拿走一些在堆中持有数据类型（比如`Vec`或`String`）的所有权是很少见的。**这个版本的`stringify_name_with_title`还会使得入参`name`不再可用，这一点在上一章的开头我们已经讨论过，对调用者来说是十分不方便的。

所以使用`&Vec`看起来就是好的选择，不应该被修改。我们应该调整的是函数体。有很多对内存使用各不相同的解决方案。比如克隆`name`：

```rust
fn stringify_name_with_title(name: &Vec<String>) -> String {
    let mut name_clone = name.clone();
    name_clone.push(String::from("Esq."));
    let full = name_clone.join(" ");
    full
}
```

通过克隆`name`，我们可以修改本地的集合副本。然而，克隆复制了输入参数中的每一个字符串。可以使用更简单的函数来避免不必要的复制：

```rust
fn stringify_name_with_title(name: &Vec<String>) -> String {
    let mut full = name.join(" ");
    full.push_str(" Esq.");
    full
}
```

这个方案是可行的，因为`slice::join`已经将`name`的数据复制到了`full`中。

普遍来说，Rust编程就是一个谨慎寻找所有权平衡的过程。比如在这个例子中，符合语义的做法就是使`name`只有读权限。

::: details 小测（3）
<QuizProvider>
<Quiz
  answer="A"
  description="栈帧的生命周期无法被延长，因此这不是一种有效的做法"
>
<template #quiz> 
下面哪种做法无法修复“函数返回栈引用”这种错误？

<RadioHolder name="403-1-1">
<Radio value="A" label="延长栈帧的生命周期" />
<Radio value="B" label="调用者提供一个可变的槽" />
<Radio value="C" label="获取返回值的所有权" />
<Radio value="D" label="使用引用计数指针" />
</RadioHolder>
</template>
</Quiz>

<Quiz answer="C">
<template #description>

解析：原函数并不希望修改原来的名字，所以将`name`的类型改成`&mut String`或者`String`都是不合适的。而编译器提示的`&*name`也是不够充分的————最让人满意的答案是通过`name.clone()`修改副本数据。

</template>
<template #quiz>
现有如下程序

```rust
/// 返回"Ph.D." + 输入名称
fn award_phd(name: &String) -> String {
    let mut name = *name;
    name.push_str(", Ph.D.");
    name
}
```

Rust编译器抛出了如下错误

```
error[E0507]: cannot move out of `*name` which is behind a shared reference
--> test.rs:3:20
 |
3|    let mut name = *name;
 |                   ^^^^^
 |                   |
 |                   move occurs because `*name` has type `String`, which does not implement the `Copy` trait 
 |                   help: consider borrowing here: `&*name`
```

下面是四种针对这个程序的修复，哪一个修复和原程序的语义最接近？四个选项不同的部分已被高亮显示

<RadioHolder name="403-1-2">
<Radio value="A">

```rust /name: &mut String/
fn award_phd(name: &mut String) {
    name.push_str(", Ph.D.");
}
```

</Radio>

<Radio value="B">

```rust /&*name/
fn award_phd(name: &String) -> String {
    let mut name = &*name;
    name.push_str(", Ph.D.");
    name
}
```

</Radio>

<Radio value="C">

```rust /name.clone()/
fn award_phd(name: &String) -> String {
    let mut name = name.clone();
    name.push_str(", Ph.D.");
    name
}
```

</Radio>

<Radio value="D">

```rust /mut name: &String/
fn award_phd(mut name: &String) -> String {
    name.push_str(", Ph.D.");
    name
}
```

</Radio>
</RadioHolder>

</template>
</Quiz>

<Quiz answer="B">
<template #description>

解析：因为这个函数应该直接修改集合，语义上它不应该返回一份集合的副本（即`-> Vec<f32>`）或消费原集合的所有权（`mut v: Vec<f32>`）。最好的办法就是将函数形参的类型签名从`&Vec<f32>`改为`&mut Vec<f32>`

</template>
<template #quiz>
现有如下程序

```rust
/// 将集合中所有的浮点数进行四舍五入
fn round_in_place(v: &Vec<f32>) {
    for n in v {
        *n = n.round();
    }
}
```

Rust编译器抛出了如下错误

```
er^ror[E0594]: cannot assign to `*n`, which is behind a `&` reference
--> test.rs:4:9
 |
3|    for n in v {
 |             - this iterator yields `&` reference
4|        *n = n.round();
 |        ^^^^^^^^^^^^^^ `n` is a `&` reference, so the data it refers to cannot be written 
```

下面是四种针对这个程序的修复，哪一个修复和原程序的语义最接近？四个选项不同的部分已被高亮显示

<RadioHolder name="403-1-3">
<Radio value="A">

```rust /mut n/ /&mut v.clone()/
fn round_in_place(v: &Vec<f32>) {
    for mut n in &mut v.clone() {
        n = n.round();
    }
}
```

</Radio>

<Radio value="B">

```rust /&mut Vec<f32>/
fn round_in_place(v: &mut Vec<f32>) {
    for n in v {
        *n = n.round()
    }
}
```

</Radio>

<Radio value="C">

```rust /-> Vec<f32>/ /let mut / / = Vec::new();/ /.push(n.round());/ /v2/
```rust
fn round_in_place(v: &Vec<f32>) -> Vec<f32> {
    let mut v2 = Vec::new();
    for n in v {
        v2.push(n.round());
    }
    v2
}
```

</Radio>

<Radio value="D">

```rust /mut v: Vec<f32>/
fn round_in_place(mut v: Vec<f32>) {
    for n in v {
        *n = n.round();
    }
}
```

</Radio>
</RadioHolder>
</template>
</Quiz>
</QuizProvider>
:::

## 修复不安全程序：别名和修改同时存在

另一种场景的不安全操作就是一个堆数据的引用被另一个引用销毁。比如，下面的程序创建了一个对集合中最长字符串的引用，然后在修改集合的同时还在使用引用：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return h(LetterTable, {
          perms: [
            { var: '*dst', operation: 'g', P: ['p', 'p', 'e'], collapse: true },
            { var: 'dst', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'src', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*src', operation: 'g', P: ['p', 'e', 'e'] },
            { var: '(*src)[_]', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 1: return h(LetterTable, {
          perms: [
            { var: '*dst', operation: 'b', P: [null, 's', 'e'], collapse: true },
            { var: 'dst', operation: 'b', P: [null, 'e', 's'] },
            { var: 'largest', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*largest', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        }) 
        case 2: return h(LetterTable, {
          defaultGraphCollapse: true,
          perms: [
            { var: 'src', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*src', operation: 'l', P: ['s', 'e', 'e'] },
            { var: '(*src)[_]', operation: 'l', P: ['s', 'e', 'e'] },
            { var: 's', operation: 'c', P: ['p', 'e', 'p'] },
            { var: '*s', operation: 'c', P: ['p', 'e', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn add_big_strings(dst: &mut Vec<String>, src: &[String]) {
    let largest: &String = dts/*[!perm R.{"collapse":true}]*/.iter().max_by_key(|s| s/*[!perm R.{"collapse":true}]*/.len()).unwrap();
    for s in /*[!perm R.{"collapse":true}]*/src {
        if s/*[!perm R.{"collapse":true}]*/.len() > largest/*[!perm R.{"collapse":true}]*/.len() {
            dst/*[!perm_double R.W.{"letterBProps": {"missing":true}}]*/.push(s/*[!perm R]*/.clone());
        }
    }
}` })'
/>

> [!NOTE]
> 这个例子使用了**迭代器**和**闭包**来快速地创建了对最长字符串的引用。这些概念我们会在后面的章节讨论，现在我们对它们的运行只要有模糊的直觉即可。

这个程序被借用检查器拒绝了，因为`let largest = ..`移除了`dst`的<W />权限。然而，`dst.push(..)`需要<W />权限。我们必须再次发问：**这个程序为什么不安全？**因为`dst.push(..)`会释放`dst`的内容，使得`largest`变为空指针。

为了修复这个程序，我们需要找到办法让`largest`的生命周期和`dst.push(..)`不重合。一个可行的办法是克隆`largest`：

```rust
fn add_big_strings(dst: &mut Vec<String>, src: &[String]) {
    let largest: String = dst.iter().max_by_key(|s| s.len()).unwrap().clone();
    for s in src {
        if s.len() > largest.len() {
            dst.push(s.clone());
        }
    }
}
```

然而，这种创建、复制字符串数据的做法可能会导致性能问题。

另一种可行的办法是压缩`src`，然后在修改`dst`：

```rust
fn add_big_strings(dst: &mut Vec<String>, src: &[String]) {
    let largest: String = dst.iter().max_by_key(|s| s.len()).unwrap();
    let to_add: Vec<String> = src.iter().filter(|s| s.len() > largest.len()).cloned().collect();
    dst.extend(to_add);
}
```
然而，为`to_add`这个集合分配空间也可能导致性能问题。

最后的办法是克隆`largest`的长度，由于我们其实并不需要`largest`本身的数据，只需要它的长度。这个办法是最经济也是最符合语义的：

```rust
fn add_big_strings(dst: &mut Vec<String>, src: &[String]) {
    let largest_len: usize = dst.iter().max_by_key(|s| s.len()).unwrap().len();
    for s in src {
        if s.len > largest_len {
            dst.push(s.clone());
        }
    }
}
```

这些办法的思路类似：缩短`dst`借出的周期，不和它的修改重合。