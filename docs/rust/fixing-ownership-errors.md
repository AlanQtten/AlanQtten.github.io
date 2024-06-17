<script setup>
import ShikiCode from "../components/code/ShikiCode.vue"
import { W, R, O } from "../components/letter"
import { h } from "vue"
import { Wrapper, MemoryGraph } from "../components/memory-graph"
import { 
  Quiz,  
  QuizProvider,
  Radio,
  RadioHolder,
  Checkbox,
  CheckboxHolder,
  IsCompile
} from "../components/quiz"
import { lr } from "../utils/renderer"
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
        case 0: return lr({ perms: [
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
<Quiz>
<template #description>

解析：栈帧的生命周期无法被延长，因此这不是一种有效的做法

</template>
<template #quiz> 
下面哪种做法无法修复“函数返回栈引用”这种错误？

<RadioHolder name="403-1-1">
<Radio label="延长栈帧的生命周期" answer />
<Radio label="调用者提供一个可变的槽" />
<Radio label="获取返回值的所有权" />
<Radio label="使用引用计数指针" />
</RadioHolder>
</template>
</Quiz>

<Quiz>
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
<Radio>

```rust /name: &mut String/
fn award_phd(name: &mut String) {
    name.push_str(", Ph.D.");
}
```

</Radio>

<Radio>

```rust /&*name/
fn award_phd(name: &String) -> String {
    let mut name = &*name;
    name.push_str(", Ph.D.");
    name
}
```

</Radio>

<Radio answer>

```rust /name.clone()/
fn award_phd(name: &String) -> String {
    let mut name = name.clone();
    name.push_str(", Ph.D.");
    name
}
```

</Radio>

<Radio>

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

<Quiz>
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
<Radio>

```rust /mut n/ /&mut v.clone()/
fn round_in_place(v: &Vec<f32>) {
    for mut n in &mut v.clone() {
        n = n.round();
    }
}
```

</Radio>

<Radio answer>

```rust /&mut Vec<f32>/
fn round_in_place(v: &mut Vec<f32>) {
    for n in v {
        *n = n.round()
    }
}
```

</Radio>

<Radio>

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

<Radio>

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
        case 0: return lr({
          perms: [
            { var: '*dst', operation: 'g', P: ['p', 'p', 'e'], collapse: true },
            { var: 'dst', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'src', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*src', operation: 'g', P: ['p', 'e', 'e'] },
            { var: '(*src)[_]', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 1: return lr({
          perms: [
            { var: '*dst', operation: 'b', P: [null, 's', 'e'], collapse: true },
            { var: 'dst', operation: 'b', P: [null, 'e', 's'] },
            { var: 'largest', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*largest', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        }) 
        case 2: return lr({
          defaultCollapse: true,
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

## 修复不安全程序：集合元素的移出与复制

对Rust的学习者来说，从集合中复制数据常常令人十分困惑。比如，下面是一个安全地从集合中复制数字的程序：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [{ var: 'v', operation: 'g', P: ['p', 'e', 'p'] }] })
        case 1: return lr({ perms: [
          { var: '*n_ref', operation: 'g', P: ['p', 'e', 'e'], collapse: true },
          { var: 'v', operation: 'b', P: ['s', 'e', 's'] },
          { var: 'n_ref', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
        case 2: return lr({ defaultCollapse: true, perms: [
          { var: 'n_ref', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*n_ref', operation: 'l', P: ['s', 'e', 'e'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let v: Vec<i32> = vec![0, 1, 2];
let n_ref: &i32 = &/*[!perm R.{"collapse":true}]*/v[0];
let n: i32 = /*[!perm R]*/*n_ref;` })'
/>

解引用操作`*n_ref`需要<R />权限，而路径`*n_ref`正好拥有这个权限。但如果我们把集合元素的类型从`i32`改为`String`呢？结果是所需要的权限不足了：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [
          { var: 'v', operation: 'g', P: ['p', 'e', 'p'] }
        ] })
        case 1: return lr({ perms: [
          { var: '*s_ref', operation: 'g', P: ['g', 'e', 'e'], collapse: true },
          { var: 'v', operation: 'b', P: ['s', 'e', 's'] },
          { var: 's_ref', operation: 'g', P: ['g', 'e', 'p'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let v: Vec<String> = vec![String::from("Hello world")];
let s_ref: &String = &/*[!perm R.{"collapse":true}]*/v[0];
let s: String = /*[!perm_double R.O.{"letterBProps":{"missing":true}}]*/*s_ref;` })'
/>

第一个程序可以编译通过，而第二个程序编译不通过。Rust抛出了如下错误：

```
error[E0507]: cannot move out of `*s_ref` which is behind a shared reference
--> test.rs:4:9
 |
4|  let s = *s_ref;
 |          ^^^^^^
 |          |
 |          move occurs because `*s_ref` has type `String`, which does not implement the `Copy` trait
```

问题在于集合`v`拥有字符串`Hello world`。当我们对`s_ref`进行解引用，会导致字符串的所有权从集合被剥离。但引用是不拥有的指针————我们无法通过引用来获取所有权。因此Rust解释为“cannot move out of [...] a shared reference”（无法从共享引用...中移动）。

但为什么这种情况是不安全的呢？我们可以通过图示模拟被拒绝的程序：

<Wrapper>
<template #code>

```rust
let v: Vec<String> = vec![String::from("Hello world")];
let s_ref: &String = &v[0];
let s: String = *s_ref; /*[!flag L1]*/

// 这些销毁操作通常是隐式的，此处为了说明暴露出来
drop(s); /*[!flag L2]*/
drop(v); /*[!flag_error L3]*/
```

</template>

<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 1 },
      { key: 's_ref', point2: 1 },
      { key: 's', point2: 0 },
    ] }],
    heap: [
      { id: 0, value: ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'] },
      { id: 1, point2: 0 }
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 0 },
      { key: 's_ref', point2: 0 },
      { key: 's', point2: 'null', moved: true },
    ] }],
    heap: [{ id: 0, point2: 'null' }]
  }"
/>

<MemoryGraph
  title="L3"
  error-message="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 'v', point2: 0, moved: true },
      { key: 's_ref', point2: 0 },
      { key: 's', point2: 'null_error', moved: true },
    ] }],
    heap: [{ id: 0, point2: 'null_error' }]
  }"
/>
</div>
</template>
</Wrapper>

这里发生了**重复销毁**的问题。在`let s = *s_ref`执行后，`v`和`s`都认为它们拥有了“Hello world”。在`s`被销毁后，“Hello world”被释放了。然后`v`被销毁，未定义行为就发生了。

> [!NOTE]
> 在执行`s = *s_ref`后，由于发生了**重复销毁**的问题，我们甚至不必使用`v`或`s`就会引发未定义行为。只要我们将字符串移出`s_ref`，未定义行为就会在元素销毁时发生。

然而，这种未定义行为在集合元素的类型为`i32`时并不会发生。不同点在于，复制`String`复制了一个指向堆数据的指针。而复制`i32`并没有。用技术的语言来说，Rust认为`i32`实现了`Copy`这个特性，而`String`并没有实现（后续章节会深入讨论特性）。

总的来说，**如果一个值没有拥有堆数据，那么它无需移动即可复制。**比如：
- 一个`i32`没有拥有堆数据，所以它无需移动即可复制。
- 一个`String`拥有了堆数据，所以它不能在不移动的情况下被复制。
- 一个`&String`没有拥有堆数据，所以它无需移动即可复制。

> [!NOTE]
> 可变引用是一个例外。比如，`&mut i32`不是一个可以复制的类型。所以你可以
> ```rust
> let mut n = 0;
> let a = &mut n;
> let b = a;
> ```
> 在赋值给`b`后，`a`就不能继续使用了。避免了两个指向同一份数据的可变引用同时被使用。

所以如果我们拥有一个`不可复制`的类型，比如`String`，那么我们如何安全地访问其中的元素呢？下面是一些安全的做法。首先，可以使用不可变引用来避免所有权的移动：

```rust
let v: Vec<String> = vec![String::from("Hello world")];
let s_ref: &String = &v[0];
println!("{s_ref}!");
```

其次，如果你想在不影响集合的情况下获取字符串的所有权，可以使用克隆：

```rust
let v: Vec<String> = vec![String::from("Hello world")];
let mut s: String = v[0].clone();
s.push('!');
println!("{s}");
```

最后，你也可以使用诸如`Vec::remove`类似的方法来把元素移出集合：

```rust
let mut v: Vec<String> = vec![String::from("Hello world")];
let mut s: String = v.remove(0);
s.push('!');
println!("{s}");
assert!(v.len() == 0);
```

## 修复不安全程序：修改不同的元祖成员

之前的例子都是一些不安全的程序。Rust也可能会拒绝一些安全的程序。一个常见的问题就是：Rust会尝试在最细粒度追踪所有权。然而，有些不同的路径可能会被Rust合并。

下面的例子就是一个通过借用检查器进行的最细层级所有权追踪。这个程序展示了借用元组的一个成员，然后修改了另一个成员：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 3: return lr({ perms: [
          { var: 'name', operation: 'g', P: 'p' },
          { var: 'name.0', operation: 'g', P: 'p' },
          { var: 'name.1', operation: 'g', P: 'p' },
        ] })
        case 4: return lr({ perms: [
          { var: 'name', operation: 'b', P: [null, 's', 's'] },
          { var: 'name.0', operation: 'b', P: [null, 's', 's'], collapse: true },
          { var: 'first', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*first', operation: 'g', P: ['p', 'e', 'e'] },
        ] }) 
        case 6: return lr({ defaultCollapse: true, perms: [
          { var: 'name', operation: 'l', P: ['s', 'e', 'e'] },
          { var: 'name.0', operation: 'l', P: ['s', 'e', 'e'], },
          { var: 'name.1', operation: 'b', P: 's', },
          { var: 'first', operation: 'b', P: ['s', 'e', 's'] },
          { var: '*first', operation: 'b', P: ['s', 'e', 'e'] },
        ] }) 
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut name = (
    String::from("Ferris"), 
    String::from("Rustacean")
);
let first = &/*[!perm R.{"collapse":true}]*/name.0;
name.1/*[!perm_double R.W]*/.push_str(", Esq.");
println!("{} {}", /*[!perm R.{"collapse":true}]*/first, /*[!perm R.{"collapse":true}]*/name.1);` })'
/>

声明`let first = &name.0`借用了`name.0`。这个借用移除了`name.0`的<W /><O />权限。也会移除`name`的<W /><O />的权限（比如，此时`name`不能作为函数的入参）。但`name.1`仍然保留了<W />权限，所以`name.1.push_str(...)`是合法的操作。

然而，Rust可能会找不到具体是哪一个路径被借用了。比如，如果我们把`&name.0`重构为函数`get_first`。注意在调用`get_first(&name)`后，Rust会移除name.1的<W />权限：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [
          { var: 'name', operation: 'g', P: ['p', 'e', 'p']},
          { var: '*name', operation: 'g', P: ['p', 'e', 'e']},
          { var: '(*name).0', operation: 'g', P: ['p', 'e', 'e']},
          { var: '(*name).1', operation: 'g', P: ['p', 'e', 'e']},
        ] })
        case 1: return lr({ defaultCollapse: true, perms: [
          { var: 'name', operation: 'l', P: ['s', 'e', 's']},
          { var: '*name', operation: 'l', P: ['s', 'e', 'e']},
          { var: '(*name).0', operation: 'l', P: ['s', 'e', 'e']},
          { var: '(*name).1', operation: 'l', P: ['s', 'e', 'e']},
        ] })
        case 7: return lr({ defaultCollapse: true, perms: [
          { var: 'name', operation: 'g', P: 'p'},
          { var: 'name.0', operation: 'g', P: 'p'},
          { var: 'name.1', operation: 'g', P: 'p'},
        ] })
        case 8: return lr({ perms: [
          { var: 'name', operation: 'b', P: [null, 's', 's']},
          { var: 'name.0', operation: 'b', P: [null, 's', 's']},
          { var: 'name.1', operation: 'b', P: [null, 's', 's'], collapse: true},
          { var: 'first', operation: 'g', P: ['p', 'e', 'p']},
          { var: '*first', operation: 'g', P: ['p', 'e', 'e']},
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn get_first(name: &(String, String)) -> &String {
    &/*[!perm R.{"collapse":true}]*/name.0
}
fn main() {
    let mut name = (
        String::from("Ferris"),
        String::from("Rustacean")
    );
    let first = get_first(&/*[!perm R.{"collapse":true}]*/name);
    name.1/*[!perm_double R.W.{"letterBProps":{"missing":true}}]*/.push_str(", Esq.");
    println!("{} {}", first, name.1);
}` })'
/>

现在我们不能进行`name.1.push_str(..)`了！Rust会抛出如下错误：

```
error[E0502]: cannot borrow `name.1` as mutable because it is also borrowed as immutable
--> test.rs:11:5
  |
10|    let first = get_first(&name);
  |                          ----- immutable borrow occurs here
11|    name.1.push_str(", Esq.");
  |    ^^^^^^^^^^^^^^^^^^^^^^^^^ mutable borrow occurs here
12|    println!("{} {}", first, name.1);
  |                      ----- immutable borrow later used here
```
这看起来很奇怪，既然我们修改前的程序是安全的。我们进行的修改也没修改程序的运行时行为。为什么将`&name.0`放入函数很关键呢？

问题在于，Rust并不关心`get_first`的具体实现，它只通过它的签名来判断它的借用行为，而它的签名表示“入参中的一些`String`被借用了”。Rust会趋于保守地认为`name.0`和`name.1`都被借用了，将它们的<W />和<O />权限都移除。

请记住，**上面的程序是安全的**。它并没有未定义行为！未来某个版本的Rust可能会更聪明，让它通过编译，但现在，它会被拒绝。所以如何应对当下的借用检查器呢？一个可行的办法是将`&name.0`在调用在行内进行，比如最开始的程序。另一个办法是通过`cells`将借用检查器推迟到运行时，后续章节我们会展开讨论。

## 修复不安全程序：修改数组的不同元素

跟上一个问题类似的问题是借用数组的元素。比如，观察下面的程序就能看到，哪些路径在创建数组元素的可变引用时被借用了：

<ShikiCode 
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [
          { var: 'a', operation: 'g', P: 'p' },
          { var: 'a[_]', operation: 'g', P: ['p', 'p', 'e'] },
        ] })
        case 1: return lr({ perms: [
          { var: 'a[_]', operation: 'b', P: ['s', 's', 'e'], collapse: true },
          { var: 'a', operation: 'b', P: 's' },
          { var: 'x', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*x', operation: 'g', P: ['p', 'p', 'e'] },
        ] })
        case 2: return lr({ perms: [
          { var: 'a[_]', operation: 'r', P: ['p', 'p', 'e'], collapse: true },
          { var: 'a', operation: 'r', P: 'p' },
          { var: 'x', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*x', operation: 'l', P: ['s', 's', 'e'] },
        ] })
        case 3: return lr({ defaultCollapse: true, perms: [
          { var: 'a', operation: 'l', P: 's' },
          { var: 'a[_]', operation: 'l', P: ['s', 's', 'e'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut a = [0, 1, 2, 3];
let x = &mut /*[!perm_double R.W.{"collapse":true}]*/a[1];
/*[!perm_double R.W.{"collapse":true}]*/*x += 1;
println!(/*[!perm R.{"collapse":true}]*/"{a:?}")` })'
/>

Rust的借用检查器不会区分路径`a[0]`和`a[1]`等等。它会使用`a[_]`来表示`a`中所有的下标。这么做是因为Rust有些情况下元素下标是不可判断的。比如，如果有一些更复杂的场景：

```rust
let idx = a_complex_function();
let x = &mut a[idx];
```

`idx`的值是什么呢？Rust不可能胡乱猜测，所以只能推断`idx`可以是任意数。比如，如果我们从一个下标读数的同时向另一个下标写入：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'a', operation: 'g', P: 'p' },
            { var: 'a[_]', operation: 'g', P: ['p', 'p', 'e'] },
          ]
        })
        case 1: return lr({
          perms: [
            { var: 'a[_]', operation: 'b', P: ['s', 's', 'e'], collapse: true },
            { var: 'a', operation: 'b', P: 's' },
            { var: 'x', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*x', operation: 'g', P: ['p', 'p', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut a = [1, 2, 3, 4];
let x = &mut /*[!perm_double R.W.{"collapse":true}]*/a[1];
let y = &/*[!perm R.{"missing":true}]*/a[2];
*x += *y;` })'
/>

然而，Rust会拒绝这个程序，因为`a`将其读权限赋予了`x`。编译器会抛出如下错误：

```
error[0502]: cannot borrow `a[_]` as immutable because it is also borrowed as mutable
--> test.rs:4:9
 |
3|  let x = &mut a[1];
 |          --------- mutable borrow occurs here
4|  let y = &a[2];
 |          ^^^^^ immutable borrow occurs here
5|  *x += *y;
 |  -------- mutable borrow later used here
```

再一次的，**这个程序是不安全的**。对于这样的情况，Rust的标准库会提供了函数来配合借用检查器。比如我们可以使用`slice::split_at_mut`：

```rust
let mut a = [0, 1, 2, 3];
let (a_l, a_r) = a.split_at_mut(2);
let x = &mut a_l[1];
let y = &a_r[0];
*x += *y;
```

你可能好奇，`split_at_mut`是怎么实现的呢？其实在一些Rust库中，尤其类似`Vec`或者`slice`这种核心库，你会经常看到`unsafe`的代码块。`unsafe`代码块允许使用“裸”指针，它们不会被借用检查器检查到。比如，我们可以使用一个不安全的块来完成我们的任务：

```rust
let mut a = [0, 1, 2, 3];
let x = &mut a[1] as *mut i32;
let y = &a[2] as *const i32;
unsafe { *x += *y ; } // 除非你非常清楚自己在做什么，否则别这么干！
```

不安全的代码对于一些期望突破借用检查器的限制十分有效。通常来说，借用检查器会拒绝那些你以为安全的代码。然后你应该去标准库里找到包含`unsafe`代码块的函数（比如`split_at_mut`）来解决你的问题。我们在后面会讨论不安全代码。现在，只要明白不安全代码就是Rust对某些其他情况下不可能实现的取巧实现。

::: details 小测（5）
<QuizProvider>
<Quiz>
<template #description>

解析：如果一个`String`在不移动的情况下被复制了，那么两个变量可能会拥有同一个字符串，最终导致内存的重复释放。

</template>
<template #quiz>

下面哪一个描述最正确地解释了为什么`i32`可以在不移动的情况下复制，而`String`不行？

<RadioHolder name="403-2-1">
<Radio label="i32是Rust中的一种原始类型，而String不是" />
<Radio label="String拥有了堆中的数据，而i32没有" answer />
<Radio label="String可以被存放在堆中，而i32只能被存放在栈中" />
<Radio label="i32占有的内存比String小" />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：`println`技术上来说是安全的，因为字符串在当前的块结束时才会被释放。但在程序结束时未定义行为出现了，字符串会由于`s`和`s2`的缘故被释放两次。

</template>
<template #quiz>

下面的代码无法通过编译

```rust
let s = String::from("Hello world");
let s_ref = &s;
let s2 = *s_ref;
println!("{s2}");
```

下面哪一个描述最正确地描述了如果允许这个程序编译，可能出现的未定义行为？

<RadioHolder name="403-2-2">
<Radio label="这个程序不存在未定义行为" />
<Radio label="字符串在程序结束时会被释放两次" answer />
<Radio label="println中读取s2的行为使用了被释放的内存" />
<Radio label="解引用*s_ref使用了被释放的内存" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这段代码是安全的。执行的话也不存在未定义行为。（如果`i`越界了，那么Rust会在运行时崩溃，而不是导致未定义行为）

这段代码无法编译的原因在于Rust无法确定`v[i]`和`v[i - 1]`指向的是不同的元素。

</template>
<template #quiz>

下面的代码无法通过编译

```rust
fn copy_to_prev(v: &mut Vec<i32>, i: usize) {
    let n = &mut v[i];
    *n = v[i - 1];
}
fn main() {
    let mut v = vec![1, 2, 3];
    copy_to_prev(&mut v, 1);
}
```

下面哪一个描述最正确地描述了如果允许这个程序编译，可能出现的未定义行为？

<RadioHolder name="403-2-3">
<Radio label="v[i - 1]读取了被释放的内存" />
<Radio label="&mut v[i]创建了指向释放内存的指针" />
<Radio label="这个程序不存在未定义行为" answer />
<Radio label="赋值*n使用了被释放的内存" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`let mut name = *name`使得入参`name`的所有权被移除了。然而，调用者仍然保留了原始字符串的所有权。因此在`award_phd`完成调用后，字符串被销毁了。上面的每一个程序都存在未定义行为，因为`name`最终会被销毁两次。不管`name`或其引用有没有在调用`award_phd`后被读取。

</template>
<template #quiz>

下面是一个和之前测试中类似的程序：

```rust
/// 返回"Ph.D." + 输入名称
fn award_phd(name: &String) {
    let mut name = *name;
    name.push_str(", Ph.D.");
}
```

Rust编译器会拒绝编译并抛出错误：

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

假设编译器**没有编译失败**。选择以下可能导致未定义行为的程序，或选择“都不会”

<CheckboxHolder name="403-2-4">
<Checkbox answer>

```rust
let name = String::from("Ferris");
award_phd(&name);
println!("{}", name);
```

</Checkbox>

<Checkbox answer>

```rust
let name = String::from("Ferris");
let name_ref = &name;
award_phd(&name);
println!("{}", name_ref);
```

</Checkbox>

<Checkbox answer>

```rust
let name = String::from("Ferris");
award_phd(&name);
```

</Checkbox>

<Checkbox label="都不会" />
</CheckboxHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这段程序可以正常编译，`x`复制了`point[0]`，因而允许`y`创建了对`point[1]`的可变借用。`x += 1`没有影响到`point`，而`*y += 1`影响了，因此结果是`0 2`。

</template>
<template #quiz>

判断下面的程序是否编译成功，如果成功，写出执行后的输出结果。

```rust
fn main() {
    let mut point = [0, 1];
    let mut x = point[0];
    let y = &mut point[1];
    x += 1；
    *y += 1;
    println!("{} {}", point[0], point[1]);
}
```

<IsCompile name="403-2-5" :answer="{ compiled: true, result: '0 2' }" />

</template>
</Quiz>
</QuizProvider>
:::

## 总结

当面对一个所有权问题时，应该先问问自己：我的程序真的不安全吗？如果是，那么因为需要理解不安全的根源。如果不是，那么应该明白借用检查器的限制，并了解如何绕开它们。