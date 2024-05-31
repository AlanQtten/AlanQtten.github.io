<script setup>
import { ref } from "vue"
import { Vec } from "../utils/generateStructure"

import Wrapper from '../components/memory-graph/Wrapper.vue'
import DetailMode from '../components/memory-graph/DetailMode.vue'
import MemoryGraph from '../components/memory-graph/MemoryGraph.vue'
import Quiz from '../components/quiz/QuizHolder.vue'
import Input from '../components/quiz/Input.vue'
import Radio from '../components/quiz/Radio.vue'

const vec3_0 = ref(Vec({ cap: 3, point2: '0' }))
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
      { id: '0', value: 2 }
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

<Quiz
  question="请查看如下代码和内存状态展示图"
  answer="3"
>
<template #description>

解析：***y是正确的表达式，y的类型是`Box<&Box<i32>>`。它是一个指向堆内存中的指向栈中指向堆内存数据指针的指针的指针。因此y必须被解引用3次，每层关系一次。

</template>

<template #quiz="{ value, onChange, disabled }">
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

<Input
  :value="value"
  :onChange="onChange"
  :disabled="disabled"
/>

</template>
</Quiz>

<StrongHr />

<Quiz
  question="请查看如下代码和内存状态展示图"
  answer="D"
  questionMark="1"
>
<template #description>

解析：引用是非拥有的指针。因此把&v传递给get_first函数并不会移动v的所有权，所以在get_first调用结束后，v也不会被释放。

</template>

<template #quiz="{ value, onChange, disabled }">
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
      { id: '0', value: [0,1,2] }
    ]
  }"
/>
</template>
</Wrapper>

以下哪一项最好地解释了为什么`v`没有在`get_first`调用结束后被释放？

<Radio
  :value={value}
  :options="[
    { key: 'A', message: '在调用get_first之后，v仍然被println所使用', },
    { key: 'B', message: 'vr没有在get_first内被修改', },
    { key: 'C', message: 'get_first返回了i32类型，没有返回集合本身', },
    { key: 'D', message: 'vr是一个引用类型，并没有其指向集合的所有权', },
  ]"
  :onChange="onChange"
  :disabled="disabled"
/>

</template>
</Quiz>

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
        { key: 'num', point2: 0 },
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
      { id: '0', value: [1,2,3,4] }
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



























