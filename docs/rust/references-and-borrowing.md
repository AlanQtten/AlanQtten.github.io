<script setup>
import { ref, h } from "vue"
import { Vec } from "../utils/generateStructure"

import { Wrapper, DetailMode, MemoryGraph } from '../components/memory-graph'
import {
  Quiz,
  QuizProvider,
  Input,
  RadioHolder,
  Radio,
  CheckboxHolder,
  Checkbox,
  IsCompile,
  IsCompileText
} from '../components/quiz'
import ShikiCode from '../components/code/ShikiCode.vue'
import { R, W, O, F, DoubleLetter } from '../components/letter'
import { lr } from "../utils/renderer"

const vec3_0 = ref(Vec({ cap: 3, point2: 0 }))
</script>

# 引用和借用

所有权、堆内存和移动提供了对堆内存数据进行安全编程的基础。但是，仅允许移动的API使用起来并不方便。比如，如果你想读取一个字符串2次：

<Wrapper>
<template #code>

```rust
fn main() {
    let m1 = String::from("Hello");
    let m2 = String::from("world");
    greet(m1, m2); /*[!flag L2]*/
    let s = format!("{} {}", m1, m2); /*[!flag_error L3]*/ // 错误：m1和m2被移动了
}

fn greet(g1: String, g2: String) {
    println!("{} {}!", g1, g2); /*[!flag L1]*/
}
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'm1', point2: 0, moved: true },
          { key: 'm2', point2: 1, moved: true }
        ]
      },
      {
        name: 'greet',
        body: [
          { key: 'g1', point2: 1, svgCurve: { x1: 0.5, y1: 0.9, x2: 0.6, y2: 0.5 } },
          { key: 'g2', point2: 1, svgCurve: { x1: 0.5, y1: 0.9, x2: 0.6, y2: 0.5 } }
        ]
      },
    ],
    heap: [
      { id: 0, value: ['H', 'e', 'l', 'l', 'o'] },
      { id: 1, value: ['w', 'o', 'r', 'l', 'd'] },
    ]
  }"
/>

<div class="flex gap-8">
<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'm1', point2: 'null', moved: true },
        { key: 'm2', point2: 'null', moved: true }
      ] }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  errorMessage="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'm1', point2: 'null_error', moved: true },
        { key: 'm2', point2: 'null', moved: true }
      ] }
    ]
  }"
/>
</div>
</div>
</template>
</Wrapper>

在这个例子中，调用`greet`导致`m1`和`m2`的所有权移动到了`greet`函数的参数上。两个字符串的内存都在`greet`调用结束后被释放了，因此不能在main函数中继续使用。如果我们尝试读取它们，比如`format!(...)`，就会导致未定义行为。Rust编译器会编译失败，错误原因和上一节看到过的一样：

```
error[E0382]: borrow of moved value: `m1`
--> test.rs:5:30
(......)
```

这种移动行为极度不便。通常来说字符串都会被多次使用。取而代之的方案是`greet`返回字符串的所有权，如下：

<Wrapper>
<template #code>

```rust
fn main() {
    let m1 = String::from("Hello");
    let m2 = String::from("world"); /*[!flag L1]*/
    let (m1_again, m2_again) = greet(m1, m2);
    let s = format!("{} {}", m1_again, m2_again); /*[!flag L2]*/
}

fn greet(g1: String, g2: String) -> (String, String) {
    println!("{}, {}", g1, g2);
    (g1, g2)
}
```

</template>
</Wrapper>

然而，这样的程序太过于繁琐冗长了。Rust提供了一种更简洁的、无需通过引用移动的方式。

## 引用就是无主指针

引用也是一种指针。下面就是一个更简洁的`greet`函数的重构：

<Wrapper>
<template #code>

```rust
fn main() {
    let m1 = String::from("Hello");
    let m2 = String::from("world"); /*[!flag L1]*/
    greet(&m1, &m2); /*[!flag L3]*/ // 注意符号"&"
    let s = format!("{} {}", m1, m2);
}

fn greet(g1: &String, g2: &String) { // 注意符号"&"
     /*[!flag L2]*/println!("{} {}", g1, g2);
}
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'm1', point2: 0 }, { key: 'm2', point2: 1, }] }
    ],
    heap: [
      { id: 0, value: ['H', 'e', 'l', 'l', 'o'] },
      { id: 1, value: ['w', 'o', 'r', 'l', 'd'] }
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'm1', point2: 0 },
          { key: 'm2', point2: 1 },
        ]
      },
      {
        name: 'greet',
        body: [
          { key: 'g1', point2: 'main.m1' },
          { key: 'g2', point2: 'main.m2' },
        ]
      }
    ],
    heap: [
      { id: 0, value: ['H', 'e', 'l', 'l', 'o'] },
      { id: 1, value: ['w', 'o', 'r', 'l', 'd'] }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'm1', point2: 0 }, { key: 'm2', point2: 1 }] }
    ],
    heap: [
      { id: 0, value: ['H', 'e', 'l', 'l', 'o'] },
      { id: 1, value: ['w', 'o', 'r', 'l', 'd'] }
    ]
  }"
/>
</div>
</template>
</Wrapper>

`&m1`使用了`&`符号创建了一个`m1`的引用（或者说借用）。`greet`函数的参数`g1`的类型也改为了`&String`，即“一个对String类型的引用”。

可以观察到在L2，从`g1`到达实际的字符串“Hello”需要两步。`g1`是一个对栈中变量`m1`的引用，而`m1`是一个字符串存储，指向堆内存中的“Hello”。

当`m1`拥有字符串“Hello”的所有权时，`g1`既没有拥有`m1`，也没有拥有“Hello”。因此当`greet`执行结束、程序到达L3，并没有任何的堆内存数据被释放。仅仅是`greet`的栈帧消失了而已。关于堆内存的释放原则仍然保持不变。因为`g1`并没有拥有“Hello”，Rust并不会因为它的缘故去释放“Hello”。

引用就是一种**非拥有**的指针，因为它们并不会拥有它们指向的数据。

## 解引用一个指针来访问其数据

前面的例子使用了堆内存函数和字符串来展示Rust如何“跟踪”指针到它的数据。比如，`println!`宏对于数据的直接引用和间接引用都神奇的生效了。其潜藏的机制就是**解引用**操作符，使用“*”表示。下面就是一个使用解引用进行各种操作的例子：

<Wrapper>
<template #code>

```rust
let mut x: Box<i32> = Box::new(1);
let a: i32 = *x;           // *x读取了堆数据，所以a = 1
*x += 1;                   // 左侧是*x，调整了堆数据
                           // 所以x指向的堆数据变成了2

let r1: &Box<i32> = &x;    // r1是一个对x的引用
let b: i32 = **r1;         // 两次解引用可以访问到堆数据

let r2: &i32 = &*x;        // r2直接指向了堆内存数据
let c: i32 = *r2;/*[!flag L1]*/      // 因此，要读取r2的数值只需要一次解引用
```

</template>

<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'x', point2: 0 },
          { key: 'a', value: 1 },
          { key: 'r1', point2: 'main.x' },
          { key: 'b', value: 2 },
          { key: 'r2', point2: 0 },
          { key: 'c', value: 2 }
        ]
      }
    ],
    heap: [
      { id: 0, value: 2 }
    ]
  }"
/>
</template>
</Wrapper>

注意观察到`r1`指向了栈中的`x`，而`r2`指向了堆中数据`2`的不同。

在阅读Rust代码时，你可能不会那么频繁地看到解引用操作符。Rust会在某些情况下隐式地插入引用或者解引用，比如使用`.`来调用方法时。比如，下面的代码就是对于`i32::abs`和`str::len`完全相同的调用：

```rust
let x: Box<i32> = Box::new(-1);
let x_abs1 = i32::abs(*x); // 显式地解引用
let x_abs2 = x.abs();      // 隐式地解引用
assert_eq!(x_abs1, x_abs2);

let r: &Box<i32> = &x;
let r_abs1 = i32::abs(**r); // 显式地解引用（两次）
let r_abs2 = r.abs();       // 隐式地解引用（两次）
assert_eq!(r_abs1, r_abs2);

let s = String::from("Hello");
let s_len1 = str::len(&s); // 显式的引用
let s_len2 = s.len();      // 隐式地引用
assert_eq!(s_len1, s_len2);
```

这个例子从三个角度展示了隐式转换：

1. `i32::abs`函数的参数类型是一个`i32`类型。要传入`Box<i32>`，你既可以解引用堆数据，即`i32::abs(*x)`，也可以使用函数调用语法来隐式地解引用，即`x.abs()`。点语法是函数调用的语法糖。
2. 对于多级的指针，这种转换仍然是生效的。比如，在`r: &Box<i32>`上调用`abs`会插入两次解引用。
3. 反过来也是一样的。`str::len`函数的参数类型是一个`&str`。如果在一个拥有`String`的类型上调用`len`，Rust会自动插入一个借用（引用）操作符。（实际上，这里甚至还有从`String`到`str`的转换！）

在后续的章节中我们会继续讨论函数调用和隐式转换。现在，重要的是要理解，这些转换既发生在函数调用，也发生在一些宏（比如`println`）。我们会一点点揭开Rust的神秘面纱，让你对Rust的工作机制有一个清楚的认知。

::: details 小测（2）

<QuizProvider>
<Quiz>
<template #description>

解析：***y是正确的表达式，y的类型是`Box<&Box<i32>>`。它是一个指向堆内存中的指向栈中指向堆内存数据指针的指针的指针。因此y必须被解引用3次，每层关系一次。

</template>

<template #quiz>
请查看如下代码和内存状态展示图
<Wrapper>

<template #code>

```rust
let x = Box::new(0);
let y = Box::new(&x); /*[!flag L1]*/
```

</template>

<template #graph>
<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'x', point2: 0, },
          { key: 'y', point2: 1, },
        ]
      },
    ],
    heap: [
      { id: 0, value: 0, },
      { id: 1, point2: 'main.x' }
    ]
  }"
  :wrapperStyle="{ paddingBottom: '16px' }"
/>
</template>
</Wrapper>

如果想通过变量`y`复制出数字0，需要使用多少次解引用？用数字表示你的答案，比如0或1

<Input answer="3" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：引用是非拥有的指针。因此把&v传递给get_first函数并不会移动v的所有权，所以在get_first调用结束后，v也不会被释放。

</template>

<template #quiz>
请查看如下代码和内存状态展示图

<Wrapper>
<template #code>

```rust
fn get_first(vr: &Vec<i32>) -> i32 {
    vr[0]
}

fn main() {
    let mut v = vec![0, 1, 2];
    let n = get_first(&v);
    println!("{} {}", n, v[1]); /*[!flag L1]*/
}
```

</template>

<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'v', point2: 0 }, { key: 'n', value: 0 }] }
    ],
    heap: [
      { id: 0, value: [0,1,2] }
    ]
  }"
/>
</template>
</Wrapper>

以下哪一项最好地解释了为什么`v`没有在`get_first`调用结束后被释放？

<RadioHolder>
<Radio label="在调用get_first之后，v仍然被println所使用" />
<Radio label="vr没有在get_first内被修改" />
<Radio label="get_first返回了i32类型，没有返回集合本身" />
<Radio label="vr是一个引用类型，并没有其指向集合的所有权" answer />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>

:::

## 避免别名和修改同时存在

指针非常强大，但随之而来的危险是指针功能纵容了**别名**。别名就是通过不同的变量访问同一份数据。单独存在时，别名无伤大雅。但结合上**修改**，灾难就发生了。一个变量可以通过许多办法让另一个变量焦头烂额，比如：

- 释放指向的内存，让另一个变量变为空指针。
- 修改指向的数据，破坏另一个变量在运行时的预期。
- 异步修改数据，引发竞态问题。

下面的例子，我们会使用vector数据结构，`Vec`和数组不同的点在于它的长度是可变的，可以使用`Vec::push`来为vector插入一个元素：

<Wrapper>
<template #code>

```rust
let mut v: Vec<i32> = vec![1, 2, 3]; /*[!flag L1]*/
v.push(4); /*[!flag L2]*/
```

</template>

<template #graph>
<div class="flex gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [{ key: 'v', point2: 0 }] }],
    heap: [{ id: 0, value: [1,2,3] }]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [{ name: 'main', body: [{ key: 'v', point2: 0 }] }],
    heap: [{ id: 0, value: [1,2,3,4] }]
  }"
/>
</div>
</template>
</Wrapper>

`vec!`宏使用后面的元素创建了一个vector。vector`v`的类型是`Vec<i32>`。`<i32>`语法代表这个vector的元素类型是`i32`。

一个重要的实现细节是，`v`分配了一片固定容量（capacity）的内存。我们可以看一眼`Vec`的内部来查看更多细节：

<Wrapper>
<template #code>

```rust
let mut v: Vec<i32> = vec![1,2,3]; /*[!flag L1]*/
```

</template>

<template #graph>
<DetailMode defaultDetailMode>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'v', point2: 0, detail: vec3_0 }
      ] }
    ],
    heap: [
      { id: 0, value: [1,2,3] }
    ]
  }"
/>
</DetailMode>
</template>
</Wrapper>

> [!NOTE]
>
> 点击图表右上角的🔬按钮可以切换图表的详情模式

可以注意到vector有长度（`len`）为3和容量（`cap`）为3。vector的容量已满。所以当我们调用`push`方法，vector会重新分配更大的容量，将所有元素复制，然后释放原始的内存。在之前的图表中，数组`1234`的内存位置与`123`不同。

说回内存安全，让我们混入引用。假如我们创建了一个vector堆数据的引用。然后经过push，引用可能会失效：

<Wrapper>
<template #code>

```rust
let mut v: Vec<i32> = vec![1, 2, 3];
let num: &i32 = &v[2]; /*[!flag L1]*/
v.push(4); /*[!flag L2]*/
println!("Third element is {}", *num); /*[!flag_error L3]*/
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'v', point2: 0 },
        { key: 'num', point2: '0.3' },
      ] }
    ],
    heap: [
      { id: 0, value: [1,2,3] }
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'v', point2: 0 },
        { key: 'num', point2: 'null' },
      ] }
    ],
    heap: [
      { id: 0, value: [1,2,3,4] }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  errorMessage="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'v', point2: 0 },
        { key: 'num', point2: 'null_error' },
      ] }
    ],
    heap: [
      { id: 0, value: [1,2,3] }
    ]
  }"
/>
</div>
</template>
</Wrapper>

起初，`v`指向堆中一个含有三个元素的数组。然后`num`被创建了，它是一个指向数组第三个元素的引用（L1）。然而，`v.push(4)`使得`v`被重新分配了。之前的数组被释放了，一个更新、更大的数组被创建了。在这个过程中，`num`被置为了空指针。因此在L3，解构操作`*num`读取了失效内存，导致了未定义行为。

从一个更抽象的角度看，这个问题的原因是集合`v`被同时进行了别名（即`num`的引用）和修改（即`v.push(4)`操作）。为了避免这类问题，Rust遵循以下原则：

>指针安全原则：永远不要对数据同时进行赋予别名和修改操作。

数据可以被赋予别名，数据也可以被修改。但数据不能同时被赋予别名和修改。比如，Rust为了贯彻这个原则，禁用了所有**含所有权指针**的别名操作。把一个含所有权指针赋值给另一个变量会移动所有权，无效化前一个变量。数据只能被它所有权归属的变量访问——不允许别名。

然而， 由于引用是无拥有的指针，它们需要一些和含所有权指针不同的规则来保证指针安全原则。从设计原则来说，引用就是为了暂时地创建别名。在这章后面的部分，我们会解释Rust如何保证引用的安全——借用检查器。

## 引用会从路径上改变权限

借用检查器的核心概念在于，变量对于其数据包含以下三种权限：

- 读取(<R />)：数据可以被复制到其他地方。
- 写入(<W />)：数据可以在原地被修改。
- 拥有(<O />)：数据可以被移动或者销毁。

这些权限只会在编译时存在。他们描述了在你的程序执行前，编译器是如何“理解”的。

默认情况下，一个变量会对其数据有读取/拥有（<R /><O />）的权限。如果一个变量使用`let mut`声明，那么它同时拥有了写入的权限（<W />）。核心在于，**引用可以暂时地移除**。

为了更生动地解释这个概念，让我们看看下面这个程序，这是一个安全的程序，`push`在`println!`后才调用。这里使用了新的图表形式，来展示每一行的权限变化。

<ShikiCode
  :inserter="({ line, before, after }) => {
    if (!after) {
      switch (line) {
      case 0: return lr({ perms: [{ var: 'v', operation: 'g', P: 'p' }] });
      case 1: return lr(
        {
          perms: [
            { var: 'v', operation: 'b', P: [null, 's', 's'] },
            { var: 'num', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*num', operation: 'g', P: ['p', 'e', 'e'] },
          ],
        },
      );
      case 2: return lr(
        {
          perms: [
            { var: 'v', operation: 'r', P: [null, 'p', 'p'] },
            { var: 'num', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*num', operation: 'l', P: ['s', 'e', 'e'] },
          ],
        },
      );
      case 3:
        return lr({ perms: [{ var: 'v', operation: 'l', P: 's' }] });
      }
    }
  }"
  :init-code="() => ({ lang: 'rust', code: `let mut v: Vec<i32> = vec![1, 2, 3];
let num: &i13 = &v[2];
println!(&quot;Third element is {}&quot;, *num);
v.push(4);` })"
/>

让我们逐行观察：

1. 在`let mut v = (...)`后，变量`v`被初始化了（使用<i class="inline-block [transform:rotateX(180deg)] i-material-symbols:subdirectory-arrow-right" />来表示）。它获取了<R plus /><W plus /><O plus />权限（加号表示获取了权限）。
2. 在`let num = &v[2]`后，`v`中的数据被`num`借用了（使用<i class="inline-block i-material-symbols:arrow-forward-rounded" />表示）。以下三件事发生了：
   - 借用移除了v的<W slash /><O slash />权限（划线表示权限的失去）。`v`不再能被写入或拥有，但仍然可以读取。
   - 变量`num`获取了<R /><O />权限。由于它并没有使用`let mut`声明，所以`num`是不可写的（<W />权限的丢失使用短线<W empty/>表示）。
   - **路径**`*num`获取了<R />权限。
3. 在`println!(...)`后，`num`不再被使用了，其对`v`的借用也结束了。因此：
   - `v`重新获得了<W /><O />权限（使用<i class="inline-block i-material-symbols:refresh" />表示）。
   - `num`和`*num`失去了所有的权限（使用<i class="inline-block i-material-symbols:subdirectory-arrow-right" />表示）。
4. 在`v.push(4)`后，`v`不再被使用了，它失去了它的所有权限。

接着，让我们探索这个图表的更多细节。首先，为什么会同时有`num`和`*num`？因为通过引用访问数据和操作引用本身是不同的。比如，如果我们使用`let mut`定义了一个数字的引用：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [{ var: 'x', operation: 'g', P: ['p', 'e', 'p'] }] });
        case 1: return lr(
          { perms:
            [
              { var: 'x', operation: 'b', P: [null, 'e', 's'] },
              { var: 'x_ref', operation: 'g', P: 'p' },
              { var: '*x_ref', operation: 'g', P: ['p', 'e', 'e'] },
            ]
          });
      }
    }
  }"
  :init-code="() => ({ lang: 'rust', code: `let x = 0;
let mut x_ref = &x;` })"
/>

可以看到`x_ref`是拥有<W />权限的，而`*x_ref`没有。所以我们可以为`x_ref`赋予一个不同的引用（比如：`x_ref = &y`），但我们却不能操作其指向的数据（比如：`*x_ref += 1`）。

更普遍地讲，权限是被定义在**路径**而不是变量上的。**路径**就是任何能够被放置到一个赋值左边的内容，包括：
- 变量，比如`a`
- 对其他路径的引用，比如`*a`
- 数组的值访问，比如`a[0]`
- 对象的成员访问，比如元组的`a.0`或结构体的`a.field`（下一章会讨论）
- 上述的任意组合，比如`*((*a)[0].1)`。

其次，为什么在路径不可用时，它会失去所有的权限呢？因为有些权限是互斥的。如果`num = &v[2]`，那么在`num`使用期间，`v`不能被修改或者销毁。但这并不意味着我们不能多次使用`num`。比如，如果我们给上面的程序增加一次`print`，那么`num`只是稍晚丢失权限而已：

<ShikiCode
  :inserter="({ line, before, after }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [{ var: 'v', operation: 'g', P: 'p' }]}
        );
        case 1: return lr(
          {
            perms: [
              { var: 'v', operation: 'b', P: [null, 's', 's'] },
              { var: 'num', operation: 'g', P: ['p', 'e', 'p'] },
              { var: '*num', operation: 'g', P: ['p', 'e', 'e'] },
            ]
          }
        );
        case 3: return lr(
          {
            perms: [
              { var: 'v', operation: 'r', P: [null, 'p', 'p'] },
              { var: 'num', operation: 'l', P: ['s', 'e', 's'] },
              { var: '*num', operation: 'l', P: ['s', 'e', 'e'] },
            ]
          }
        );
        case 4: return lr({ perms: [{ var: 'v', operation: 'g', P: 's' }]})
      }
    }
 }"
 :init-code='() => ({ lang: "rust", code: `let mut v: Vec<i32> = vec![1, 2, 3];
let num: &i13 = &v[2];
println!("Third element is {}", *num);
println!("Again, the third element is {}", *num);
v.push(4);` })'
/>

## 借用检查器能找到违规的权限

回顾一下指针安全原则：永远不要对数据同时进行赋予别名和修改操作。这些权限的目标就是为了保证数据不能被同时进行赋予别名和修改操作。创建一个对数据的引用（“借用”它），会导致这个数据变为只读，直到引用不再被使用。

Rust在内置的**借用检查器**里使用了这些权限。借用检查器会在包含引用的程序中寻找隐含的不安全行为。回到我们最早看到的不安全程序。这一次我们会加上图表来进行说明：

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [{ var: 'v', operation: 'g', P: 'p' }] });
        case 1: return lr({ perms: [
          { var: 'v', operation: 'b', P: [null, 's', 's'] },
          { var: 'num', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*num', operation: 'g', P: ['p', 'e', 'e'] },
        ] });
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut v: Vec<i32> = vec![1, 2, 3];
let num: &i32 = &/*[!perm R]*/v[2];
v/*[!perm_double R.W.{"letterBProps":{"missing": true}}]*/.push(4);
println!("Third element is {}", *num);` })'
/>

当一个路径被使用时，Rust会寻找与其操作匹配的权限。比如，借用操作`&v[2]`需要`v`是可读的。因此<R />权限在操作符`&`和路径`v`之间显示。权限字母是实心的，因为`v`此时是含有读取权限的。

相比之下，修改操作`v.push(4)`要求`v`既有可读权限也有写入权限。<R />和<W />都展示了。然而，`v`并没有写入权限（被`num`借用了）。所以<W missing />是镂空的，表示这里期望的权限和`v`实际包含的权限并不匹配。

如果你试图编译这段程序，那么Rust编译器会返回如下错误：

```
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
--> test.rs:4:1
 |
3| let num: &i32 = &v[2];
 |                  - immutable borrow occurs here
4| v.push(4);
 | ^^^^^^^^^ mutable borrow occurs here
5| println!("Third element is {}", *num);
 |                                 ---- immutable borrow later used here
```

这段错误信息解释了`v`不能在其引用`num`使用期间被修改。当然那只是表层原因————真正的原因是经过`push`，`num`可能会失效。Rust捕捉了这种内存安全隐患。

## 可变的引用提供了独特的、非拥有的数据访问

目前为止我们看到的引用都是只读的**不可变引用**（也被叫做共享引用）。不可变引用允许别名却禁止了修改。然而，临时性地提供可变的访问，而无需移动它也是十分有用的。

**可变引用**正是为此设计的（也被叫做独特引用）。下面是一个可变引用及其权限变化的简单例子：

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [{ var: 'v', operation: 'g', P: 'p' }] })
        case 1: return lr({
          perms: [
            { var: 'v', operation: 'b', P: 's' },
            { var: 'num', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*num*', operation: 'g', P: ['p', 'p', 'e'] },
          ]
        })
        case 3: return lr({
          perms: [
            { var: 'v', operation: 'r', P: 'p' },
            { var: 'num', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*num*', operation: 'l', P: ['s', 's', 'e'] },
          ]
        })
        case 4: return lr({ perms: [{ var: 'v', operation: 'l', P: 's' }] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut v: Vec<i32> = vec![1, 2, 3];
let num: &mut i32 = &mut /*[!perm_double R.W.{"collapse":true}]*/v[2];
/*[!perm_double R.W.{"collapse":true}]*/*num += 1;
println!("Third element is {}", /*[!perm R.{"collapse":true}]*/*num);
println!("Vector is now {:?}", /*[!perm R.{"collapse":true}]*/v);` })'
/>

> [!NOTE]
>
> 当所期望的权限和当前的例子关联性不高时，我们会使用缩略点比如<R collapse />。可以将鼠标移动到上面来查看其具体对应的权限字母。

可变的引用可以使用`&mut`来创建。`num`的类型被写作`&mut i32`。和不可变引用做对比的话，可以看到它们的权限有两个重要的不同点：
1. 如果`num`是一个不可变引用，`v`会保留<R />权限。当`num`是一个可变引用时且在使用时，`v`丢失了所有的权限。
2. 如果`num`是一个不可变引用，路径`*num`只有<R />权限。当`num`是一个可变引用时，`*num`获取了<W />权限。

首先能观察到的是可变引用的安全性。可变引用允许了修改但禁用了别名。路径`v`被借用后暂时的不可用了，也就避免了别名。

其次能观察到的是可变引用的便捷性。`v[2]`可以通过`*num`被修改。比如，`*num += 1`修改了`v[2]`。注意只有`*num`拥有<W />权限，但`num`没有。`num`代表可变引用本身，它也是不能被赋值给其他可变引用的。

可变引用也可以被临时“降级”成只读引用，比如：

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [
          { var: 'v', operation: 'g', P: 'p' },
        ] })
        case 1: return lr({ perms: [
          { var: '*num', operation: 'g', P: ['p', 'p', 'e'], collapse: true },
          { var: 'v', operation: 'b', P: 's' },
          { var: 'num', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
        case 2: return lr({ perms: [
          { var: '*num', operation: 'b', P: [null, 's', 'e'] },
          { var: '*num2', operation: 'g', P: ['p', 'e', 'e'], collapse: true },
          { var: 'num', operation: 'b', P: [null, 'e', 's'] },
          { var: 'num2', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
        case 3: return lr({ defaultCollapse: true, perms: [
          { var: '*num', operation: 'r', P: ['s', 'e', 'e'] },
          { var: '*num', operation: 'r', P: ['s', 'e', 'e'] },
          { var: 'num2', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*num2', operation: 'l', P: ['s', 'e', 'e'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut v: Vec<i32> = vec![1, 2, 3];
let num: &mut i32 = &mut /*[!perm_double R.W.{"collapse":true}]*/v[2];
let num2: &i32 = &/*[!perm R.{"collapse":true}]*/*num;
println!("{} {}", /*[!perm R.{"collapse":true}]*/*num, /*[!perm R.{"collapse":true}]*/*num2)` })'
/>

> [!NOTE]
>
> 当权限的变化与当前的例子无关时，我们会隐藏它们。可以点击行尾下面的箭头来查看隐藏的步骤。同时，点击“...”也可以查看隐藏的权限信息。

在这段代码中，借用操作`&*num`移除了`*num`的<W />权限，但保留了`*num`的<R />权限，因此`println!(..)`可以同时读取`*num`和`*num2`。

## 在引用的生命周期结束时，权限会被返回

之前我们已经提到过，引用的所有权变化在它“被使用时”，“被使用时”这种说法就是在描述引用的**生命周期**，或者说从引用出生（被创建）到死亡（引用最后一（多）次被使用）的代码范围。

比如，在下面的例子里，`y`的生命周期开始于`let y = &x`，结束于`let z = *y`：

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [{ var: 'x', operation: 'g', P: 'p' }] })
        case 1: return lr({ perms: [
          { var: 'x', operation: 'b', P: [null, 's', 's'], collapse: true },
          { var: 'y', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*y', operation: 'g', P: ['p', 'e', 'e'] },
        ] })
        case 2: return lr({ perms: [
          { var: 'x', operation: 'r', P: [null, 'p', 'p'], collapse: true },
          { var: 'y', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*y*', operation: 'l', P: ['s', 'e', 'e'] },
          { var: 'z', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
        case 3: return lr({ defaultCollapse: true, perms: [
          { var: 'x', operation: 'l', P: 's' },
          { var: 'z', operation: 'l', P: ['s', 'e', 's'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut x = 1;
let y = &/*[!perm R.{"collapse":true}]*/x;
let z = /*[!perm R.{"collapse":true}]*/*y;
/*[!perm_double R.W.{"collapse":true}]*/x += /*[!perm R.{"collapse":true}]*/z;` })'
/>

`x`上的<W />权限在`y`的声明周期结束时候返回给了`x`，像我们之前看到的一样。

在之前的例子中，一段生命周期就是一片相邻的代码。然而，一旦我们引入了流程控制，情况就有所不同了。比如，下面是一个用来获取字符集合中第一个元素的大写形式的：

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ defaultCollapse: true, perms: [
          { var: 'v', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*v', operation: 'g', P: ['p', 'p', 'e'] },
        ] })
        case 1: return lr({ perms: [
          { var: '*v', operation: 'b', P: [null, 's', 'e'], collapse: true },
          { var: 'v', operation: 'b', P: [null, 'e', 's'] },
          { var: 'c', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*c', operation: 'g', P: ['p', 'e', 'e'] },
        ] })
        case 3: return lr({ perms: [
          { var: '*v', operation: 'r', P: [null, 'p', 'e'], collapse: true },
          { var: 'v', operation: 'r', P: [null, 'e', 'p'] },
          { var: 'c', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*c', operation: 'l', P: ['s', 'e', 'e'] },
          { var: 'up', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
        case 4: return lr({ defaultCollapse: true, perms: [
          { var: 'v', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*v', operation: 'l', P: ['s', 's', 'e'] },
          { var: 'up', operation: 'l', P: ['s', 'e', 's'] },
        ] })
        case 5: return lr({ perms: [
          { var: '*v', operation: 'r', P: [null, 'p', 'e'], collapse: true },
          { var: 'v', operation: 'r', P: [null, 'e', 'p'] },
          { var: 'c', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*c', operation: 'l', P: ['s', 'e', 'e'] },
        ] })
        case 6: return lr({ defaultCollapse: true, perms: [
          { var: 'v', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*v', operation: 'l', P: ['s', 's', 'e'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn ascii_capitalize(v: &mut Vec<char>) {
    let c = &/*[!perm R.{"collapse":true}]*/v[0];
    if (c/*[!perm R.{"collapse":true}]*/.is_ascii_lowercase()) {
        let up = c/*[!perm R.{"collapse":true}]*/.to_ascii_uppercase();
        v[0] = /*[!perm R.{"collapse":true}]*/up
    } else {
        println!("Already capitalized: {:?}", /*[!perm R.{"collapse":true}]*/v);
    }
}` })'
/>

变量`c`在if的不同分支里有不同的生命周期。在then分支下，`c`用在了表达式`c.to_ascii_uppercase()`里。因此`*v`在这行后才收回了<W />权限。

然而，在else分支下，`c`并没有被使用。在进入else分支时候`*v`就立刻收回了<W />权限。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：可变借用符号`t = &mut s`移除了`s`的所有权限，直到`t`的生命周期结束

</template>
<template #quiz>
现有如下程序

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [{ var: 's', operation: 'g', P: 'p' }] })
        case 1: return lr({ perms: [
          { var: 's', operation: 'b', P: 's' },
          { var: 't', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*t', operation: 'g', P: ['p', 'p', 'e'] }
        ] })
        case 3: return lr({ perms: [
          { var: 's', operation: 'r', P: 'p' },
          { var: 't', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*t', operation: 'l', P: ['s', 's', 'e'] }
        ] })
        case 4: return lr({ perms: [{ var: 's', operation: 'l', P: 's' }] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let mut s = String::from("Hello");
let t = &mut s;
/* here */
t.push_str(" world");
println!("{}", s);` })'
/>

在使用/* here */标记的位置，路径s的权限是什么？请选择

<CheckboxHolder>
<Checkbox label="R" />
<Checkbox label="W" />
<Checkbox label="O" />
<Checkbox label="没有任何权限" answer />
</CheckboxHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：当`get_first`被调用时，Rust识别了其返回值`first`（的类型）指向了`strs`的数据，所以`strs`失去了写的权限。一旦`first`变量不再被使用了（也就是if块结束后），`strs`收回了写权限。

</template>
<template #quiz>
现有如下程序

<ShikiCode
  :inserter="({ before, after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [
          { var: 'v', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*v', operation: 'g', P: ['p', 'e', 'e'] },
        ] })
        case 1: return lr({ perms: [
          { var: 'v', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*v', operation: 'l', P: ['s', 'e', 'e'] },
        ] })
        case 6: return lr({ perms: [
          { var: 'strs', operation: 'g', P: 'p' },
        ] })
        case 7: return lr({ perms: [
          { var: 'strs', operation: 'b', P: [null, 's', 's'] },
          { var: 'first', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*first', operation: 'g', P: ['p', 'e', 'e'] },
        ] })
        case 8: return lr({ perms: [
          { var: 'strs', operation: 'r', P: [null, 'p', 'p'] },
          { var: 'first', operation: 'l', P: ['s', 'e', 's'] },
          { var: '*first', operation: 'l', P: ['s', 'e', 'e'] },
        ] })
        case 9: return lr({ perms: [
          { var: 'strs', operation: 'l', P: 's' },
        ] })
        case 10: return lr({ perms: [
          { var: 'strs', operation: 'l', P: 's' },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn get_first(v: &Vec<String>) -> &str {
    &/*[!perm R.{"collapse":true}]*/v[0]
}
fn main() {
    let mut strs = vec![
        String::from("A"), String::from("B")
    ];
    let first = get_first(&/*[!perm R.{"collapse":true}]*/strs);
    if first/*[!perm R.{"collapse":true}]*/.len() > 0 {
        strs/*[!perm_double R.W.{"collapse":true}]*/.push(String::from("C"));
    }
}` })'
/>

下面哪种说法最准确地描述了为什么`strs`丢失、重新获得了<W />权限？
<RadioHolder>
<Radio label="get_first返回了一个指向strs关联数据的不可变引用，所以first的生命周期内strs是不可读的" answer />
<Radio label="在strs.push(..)之前，strs不需要读权限，所以它在这一步才收回了读权限" />
<Radio label="由于first指向strs，所以只有在嵌套的域内（比如if）才是可变的" />
<Radio label="strs在把不可变引用&strs传递给get_first期间是不可读的" />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：未定义行为的产生是由于`v1`在其内存被释放后被读取了。注意本题的其他三个选项对于程序的描述也是正确的，但是他们并没有解释未定义行为。比如，如果这个程序没有`println`，那么其他三个选项仍然是正确的，但程序不再会发生未定义行为了。

</template>
<template #quiz>
下面是一个不安全的程序

<Wrapper>
<template #code>

```rust
let v1 = vec![1, 2, 3];
let mut v2 = v1;
v2.push(4)
println!("{}", v1[0]); /*[!flag_error L1]*/
```

</template>

<template #graph>
<MemoryGraph
  title="L1"
  errorMessage="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'm1', point2: 'null_error', moved: true },
        { key: 'm2', point2: 0 }
      ] }
    ],
    heap: [
      { id: 0, value: [1,2,3,4] }
    ]
  }"
/>
</template>
</Wrapper>

下面哪一个选项最准确地描述了这个程序发生的未定义行为的种类？

<RadioHolder>
<Radio label="在第二行，v1被移动到了v2" />
<Radio label="v2拥有了堆中的集合数据，v1没有拥有" />
<Radio label="在第三行的push后，v1指向了空指针" />
<Radio label="v1[0]读取了v1，其指向了已经失效的内存" answer />
</RadioHolder>
</template>
</Quiz>
</QuizProvider>
:::

## 数据的寿命必须长于其引用

作为指针安全原则的一部分，借用检查器保证了**数据的寿命必须长于其指针**。Rust用两种方式保证了这件事。第一件事和单个函数内部创建、销毁引用有关。比如，如果我们在一个引用还存活的状态下销毁数据：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after && line === 1) {
      return lr({
        perms: [
          { var: 's', operation: 'b', P: [null, 'e', 's'], collapse: true },
          { var: 's_ref', operation: 'g', P: ['p', 'e', 'p'] },
          { var: '*s_ref', operation: 'g', P: ['p', 'e', 'e'] },
        ]
      })
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let s = String::from("Hello world");
let s_ref = &/*[!perm R.{"collapse": true}]*/s;
drop(/*[!perm_double R.O.{"letterBProps":{"missing":true}}]*/s);
println!("{}", s_ref);` })'
/>

为了捕获这类错误，Rust使用了我们已经讨论过的一种权限。`&s`借用`s`时，`s`的<O />权限被移除了。然而，`drop`需要<O />权限，这就造成了权限的缺失。

这个例子的关键在于，Rust知道`s_ref`存活了多久。但是如果不知道一个引用的存活周期，Rust仍需要一些保障机制。更明确地说，当引用被作为函数的输入或输出时。比如，下面是一个安全的程序，它返回了一个对集合中第一个元素的引用：

<ShikiCode
  :init-code='() => ({ lang: "rust", code: `fn first(strings: &Vec<String>) -> &String {
    let s_ref = &/*[!perm_double R.F.{"collapse":true}]*/strings[0];
    /*[!perm_double R.F]*/s_ref
}` })'
/>

这里引入了一个新的权限，流通权限<F />。当一个表达式使用引用作为输入（`&strings[0]`），或输出一个引用（`return s_ref`）时，<F />时必须的。

和<R /><W /><O />权限不同的是，流通权限不会在函数体内部被改变。如果引用被允许在特定表达式中使用（即流动），则该引用具有<F />权限。比如，如果我们把`first`改为一个新的函数`first_or`，增加一个`default`参数：

<ShikiCode
  :init-code='() => ({ lang: "rust", code: `fn first_or(strings: &Vec<String>, default: &String) -> &String {
    if strings/*[!perm_double R.F.{"collapse":true}]*/.len() > 0 {
        &/*[!perm_double R.F.{"letterBProps":{"missing":true}}]*/strings[0]
    } else {
        /*[!perm_double R.F.{"letterBProps":{"missing":true}}]*/default
    }
}` })'
/>

这样的代码是无法编译的，因为`&strings[0]`和`default`缺少<F />权限。但这是为什么呢？Rust给出了如下报错：

```
error[E0106]: missing lifetime specifier
--> test.rs:1:57
 |
1| fn first_or(strings: &Vec<String>, default: &String) -> &String {
 |                      ------------           -------     ^ expected named lifetime parameter
 |
 = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `strings` or `default`
```

`missing lifetime specifier`（缺少生命周期修饰符）这种说法有点古怪，但帮助信息提供了十分实用的上下文。想想一下Rust检查了这个函数的签名，但无法判断返回值`&String`引用自`strings`还是`default`。下面的程序对`first_or`的使用可以帮助理解为什么这个信息很重要：

```rust
fn main() {
    let strings = vec![];
    let default = String::from("default");
    let s = first_or(&strings, &default);
    drop(default);
    println!("{}", s);
}
```

如果`first_or`允许`default`作为函数的返回值进行流通，那么这个程序就是不安全的。类似之前的例子，`drop`会导致`s`无效化。只有`default`确定不作为函数返回值时，Rust才能允许这个程序被编译通过。

为了指定`default`可以被返回，Rust提供了一种机制：生命周期参数。我们会在未来的10.3章节中进行解释。现在只要知道：（1）引用的输入/输出和普通的引用有所不同。（2）Rust使用了不同的机制，<F />权限，来检查这些引用的安全性。

再看一个<F />权限的例子，如果你试图返回了一个栈内的变量：

<ShikiCode
  :init-code='() => ({ lang: "rust", code: `fn return_a_string() -> &String {
    let s = String::from("Hello world");
    let s_ref = &/*[!perm R.{"collapse":true}]*/s;
    /*[!perm_double R.F.{"letterBProps":{"missing": true}}]*/s_ref
}` })'
/>

这个程序是不安全的，因为引用`&s`在`return_a_string`函数返回时会被销毁。同样的，Rust会抛出`missing lifetime specifier`错误来拒绝这个程序编译。现在你理解了这个错误表示`s_ref`缺少<F />权限。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：尽管形参`n`使用了`mut`标记，但传入的引用必须也使用`mut`。所以正确的使用是`incr(&mut n)`。

</template>
<template #quiz>

<IsCompileText />

```rust
fn incr(n: &mut i32) {
    *n += 1
}

fn main() {
    let mut n = 1;
    incr(&n);
    println!("{n}");
}
```

<IsCompile :answer="{ compiled: false, }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：在一个不可变引用存活的情况下（s2）创建一个不可变引用（s3）是不允许的。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut s = String::from("hello");
    let s2 = &s;
    let s3 = &mut s;
    s3.push(" world");
    println!("{s2}");
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：正如本节提到的，`v.push(n)`会导致`v`的重新分配，使得指向它之前内存的所有引用变的无效。因此调用`give_and_take(&v, 4)`会导致在此之前创建的引用指向无效内存。因此可以排除第一个选项，`let v2 = &v`只是创建了一个栈内引用，修改v并不会影响它。而第二个选项虽然持有了一个空指针，但并没有使用它，也不属于未定义行为，只有第三个选项读取了空指针（`n`）。

</template>
<template #quiz>
现有如下程序，在一个集合的结尾插入了一个数字，然后移除/返回了集合的第一个元素：

```rust
fn give_and_take(v: &Vec<i32>, n: i32) -> i32 {
    v.push(n);
    v.remove(0)
}
```

正常来说，这段程序会编译失败

```
error[E0596]: cannot borrow `*v` as mutable, as it is behind a `&` reference
--> test.rs:2:5
 |
1| fn give_and_take(v: &Vec<i32>, n: i32) -> i32 {
 |                     --------- help: consider changing this to be a mutable reference: `&mut Vec<i32>`
2|     v.push(n);
 |     ^^^^^^^^^ `v` is a `&` reference, so the data it refers to cannot be borrowed as mutable
```

假设编译器**没有编译失败**。选择以下可能导致未定义行为的程序，或选择“都不会”

<CheckboxHolder>
<Checkbox>

```rust
let v = vec![1, 2, 3];
let v2 = &v;
give_and_take(&v, 4);
println!("{}", v2[0]);
```

</Checkbox>
<Checkbox>

```rust
let v = vec![1, 2, 3];
let n = &v[0];
let k = give_and_take(&v, 4);
println!("{}", k);
```

</Checkbox>
<Checkbox answer>

```rust
let v = vec![1, 2, 3];
let n = &v[0];
give_and_take(&v, 4);
println!("{}", n);
```

</Checkbox>
<Checkbox label="都不会" />
</CheckboxHolder>
</template>
</Quiz>
</QuizProvider>
:::

## 总结

Rust提过了不消耗数据所有权的情况下读写数据的能力。引用常常在使用借用符（`&`和`&mut`）和解引用符号（`*`）中被创建（隐式地）。

然而，引用的使用也常常出错。Rust内置的借用检查器创建了一套权限系统，来保证引用的使用是安全的：
- 所以的变量都能读、拥有和写它们的数据（当然都是可选的）。
- 创建引用时，会根据借用的路径来移动权限。
- 一旦引用的生命周期结束，各种权限就都会被返回。
- 数据的寿命必须长于其引用

这一小节中，似乎我们对Rust的感觉是它禁止的事比能做的事还多。这种感觉是刻意设计的结果！Rust的核心功能之一就是允许你使用指针，而无需垃圾回收，同时还避免了未定义行为。理解这些安全规则能够帮助你更好地理解Rust编译器。
