<script setup>
import { MemoryGraph, Wrapper } from '../components/memory-graph'
import { 
  Quiz,
  QuizProvider,
  RadioHolder,
  Radio,
  Input,
  IsCompile,
  CheckboxHolder,
  Checkbox
} from '../components/quiz'
</script>

# 什么是所有权

所有权是保证Rust程序安全的纪律。要理解所有权，我们需要先理解是什么导致一个Rust程序变得安全（或不安全）。

## 安全就是避免未定义行为

下面是一个可以安全执行的例子：

```rust
fn read(y: bool) {
    if y {
        println!("y is true!");
    }
}

fn main() {
    let x = true;
    read(x);
}
```

我们可以把函数的调用移动到x的声明前，此时程序就变成了一个不安全的程序：

```rust
fn read(y: bool) {
    if y {
        println!("y is true!");
    }
}

fn main() {
    read(x); // 哦不，x没有定义！
    let x = true;
}
```

第二个程序不安全的原因是，`read(x)`期望`x`是一个`bool`类型的值，而`x`此时还没有值

当类似这样的程序被一个解释器所执行时，在`x`未定义前去读取它的值会导致一个异常，比如Python中的`NameError`或者Javascript中的`ReferenceError`。但捕获这个异常也是有代价的。每当一个程序读取一个变量时，解释器都必须检查这个变量是否已经定义。

Rust的目标是把程序编译成尽可能高效的二进制文件，这就要求运行时的检查要尽可能的减少。因此，Rust不会在运行时检查一个变量是否在使用前被定义了。取而代之的是，Rust会在编译时检查。如果你尝试编译一个不安全的程序，你会看到如下错误

```
error[E0425]: cannot find value `x` in this scope
--> src/main.rs:8:1
 |
8|		read(x); // 哦不，x没有定义！
 |		     ^ not found in this scope
```

你可能会有一种直觉：对Rust来说保证变量在使用前已经被定义是很有利的。但这是为什么呢？为了阐明这个规则，我们需要先提出一个问题：**如果Rust允许一个被拒绝的程序进行编译，会发生什么？**

首先我们可以思考，一个安全的程序是如何编译和执行的。在一台使用x86架构处理器的电脑上，Rust会为上面的main函数生成如下的汇编代码：

```asm
main:
	; ...
	mov		edi, 1
	call	read
	; ...
```

这段汇编代码会：

- 移动数字1（相当于`true`）到`edi`这个“寄存器”中（一种汇编变量）
- 调用`read`函数，函数期望第一个参数`y`就是`edi`寄存器

如果允许一个不安全的程序编译，那么它的汇编代码如下：

```asm
main:
	; ...
	call	read
	mov		edi, 1	; mov 在 call的后面
	; ...
```

这段程序是不安全的，因为`read`期望`edi`是一个`bool`类型（即数字0或1）。但`edi`却可能是任意值：`2`，`100`，`0x1337BEEF`。当`read`函数出于任何目的想要使用`y`时，立刻就会导致**未定义行为**

Rust无法明确在`y`既不是`ture`也不是`false`时运行`if y { ... }`会发什么。这种行为，以及后续代码的执行，就是未定义的。比如：

- 这段代码并没有导致整个程序的崩溃，没有人注意到问题
- 由于[存储器区段错误](https://zh.wikipedia.org/wiki/%E8%A8%98%E6%86%B6%E9%AB%94%E5%8D%80%E6%AE%B5%E9%8C%AF%E8%AA%A4)或者其他操作系统错误，这段代码导致了程序的崩溃
- 这段代码正常运行，直到一个坏人利用这点进行了恶意输入，删除了你的生产环境数据库，覆盖了你的备份，或偷走了你的存款

**Rust的主要目标就是保证你的程序绝对没有未定义行为**。这就是“安全”的含义。未定义行为对于一些直接访问内存的底层程序来说是特别危险的。底层系统70%的安全漏洞都来自内存损坏（未定义行为的一种）。

Rust的次要目标之一是在编译时而不是运行时尽可能避免未定义行为。这个目标是出于以下两个动机：

1. 在编译时捕获bug意味着避免生产环境的bug，提高程序的可靠性
2. 在编译时捕获bug意味着更少的生产环境检查，提高程序的性能

Rust并不能避免所有的bug。如果一个应用程序暴露了一个公共未授权的`/delete-producation-database`接口，那么任何坏人不需要借助可疑的if语句，也能删除你的数据库。但 Rust 的保护措施仍使程序比较少保护的语言更安全，来自[谷歌的安卓团队发现的情况](https://security.googleblog.com/2022/12/memory-safe-languages-in-android-13.html)。

## 把所有权作为内存安全的规范

既然安全就是避免未定义行为，而所有权的存在就是为了安全，那么，我们需要从所有权所阻止的未定义行为的角度来理解它。Rust维护了一份“被视为未定义的行为”清单。但现在，我们先关注其中的一项：内存操作。

内存是程序执行期间数据所存放的空间。有多种维度来思考“内存”：

- 如果你不熟悉系统层级的编程，你可能会用“内存就是电脑内存”或“内存就是运行太多东西时会耗尽的东西”这种高层级的方式来看待内存
- 如果你熟悉系统层级的编程，你可能会用“内存是一个字节数组”或“内存就是从`malloc`返回的指针”这种低层级的方式来看待内存

这些内存模型都是有效的，但他们对协助理解Rust的工作原理并没有什么帮助。高层级的模型太过于抽象，而Rust又需要你理解指针的概念。低层级的模型又太过具体，而Rust其实并不需要你把内存理解成字节的数组。

Rust提供了一个特别的方式来思考内存。所有权就是这种思考下的产物。这章余下的内容会解释Rust的内存模型。

## 栈里的变量

下面是一个类似前文看过的程序，这个程序定义了一个变量n，并调用了plus_one函数

<Wrapper>
<template #code>

```rust
fn main() {
    let n = 5; /*[!flag L1]*/
    let y = plus_one(n); /*[!flag L3]*/
    println!("The value of y is {y}");
}

fn plus_one(x: i32) -> i32 {
    /*[!flag L2]*/x + 1
}
```

</template>

<template #graph>
<div class="flex gap-8">
  <MemoryGraph 
    title="L1"
    :memory="{ stack: [{ name: 'main', body: [{ key: 'n', value: 5 }] }]}"
  />

  <MemoryGraph 
    title="L2"
    :memory="{
      stack: [
        { name: 'main', body: [{ key: 'n', value: 5 }] },
        { name: 'plus_one', body: [{ key: 'x', value: 5 }] },
      ]
    }"
  />

  <MemoryGraph 
    title="L1"
    :memory="{
      stack: [{ name: 'main', body: [{ key: 'n', value: 5 }, { key: 'y', value: 6 }] }]
    }"
  />
</div>
</template>
</Wrapper>

变量存活在许多“帧”里。一“帧”就是单个作用域里从变量到值的映射，比如一个函数。举例说明

- L1位置的main函数的“帧”存储了n=5
- L2位置的plus_one函数的“帧”存储了x=5
- L3位置的main函数的“帧”存储了n=5; y=6

一系列的“帧”按照函数调用的顺序整理为栈。比如，在L2，main函数框的位置在plus_one的框上面。函数调用结束后，Rust解除了函数“帧”的分配（解除...分配也被成为释放或者丢弃，这些术语会交替使用）。这些“帧”的顺序被称为栈，因为最近被添加的“帧”就是下一个被移除的（先入后出）。

> [!NOTE]
>
> 这种内存模型并没有完全描述Rust的工作原理！在之前的汇编代码中，Rust编译器会把n或x放到寄存器中，而不是栈的“帧”里。但这些差别只是实施过程的细节。它们不该影响你对Rust安全性的理解，所以我们可以继续关注这些存储在“帧”中的变量。

当一个表达式读取了一个变量，这个变量的值会从栈帧的槽中被复制。比如，当我们运行如下程序时：

<Wrapper>
<template #code>

```rust
let a = 5; /*[!flag L1]*/
let mut b = a; /*[!flag L2]*/
b += 1; /*[!flag L3]*/
```

</template>

<template #graph>
<div class="flex gap-8">
  <MemoryGraph 
    title="L1"
    :memory="{
      stack: [{ name: 'main', body: [{ key: 'a', value: 5 }] }]
    }"
  />

  <MemoryGraph 
    title="L2"
    :memory="{
      stack: [
        { 
          name: 'main', 
          body: [{ key: 'a', value: 5 }, { key: 'b', value: 5 }] 
        }
      ]
    }"
  />

  <MemoryGraph 
    title="L3"
    :memory="{
      stack: [
        { name: 'main', body: [{ key: 'a', value: 5 }, { key: 'b', value: 6 }] }
      ]
    }"
  />
</div>
</template>
</Wrapper>



变量a的值被复制到了变量b，在b发生变化时，a的值仍然保持不变。

## 堆中的“盒子”

然而，复制数据会消耗大量的内存。比如，下面是一个有些不同的程序，这个程序复制了一个拥有1百万数据的数组：

<Wrapper>
<template #code>

```rust
let a = [0; 1_000_000]; /*[!flag L1]*/
let b = a; /*[!flag L2]*/
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
  <MemoryGraph 
    title="L1"
    :memory="{ stack: [{ name: 'main', body: [
      { 
        key: 'a', 
        value: [
          0,0,0,0,0,0,0,0,0,0,0,'...',0
        ] 
      }
    ] }]}"
  />

  <MemoryGraph 
    title="L2"
    :memory="{ stack: [{ name: 'main', body: [
      { 
        key: 'a', 
        value: [
          0,0,0,0,0,0,0,0,0,0,0,'...',0
        ] 
      },
      { 
        key: 'b', 
        value: [
          0,0,0,0,0,0,0,0,0,0,0,'...',0
        ] 
      }
    ] }]}"
  />
</div>
</template>
</Wrapper>

可以看到，复制a到b的行为导致main函数的帧中存放了两百万个元素。

为了在不复制数据的情况下转移其访问权，Rust使用了指针。一个指针就是一个描述内存位置的值。被指针指向的值成为被指值。一个常见的创建指针的方式就是在堆中分配内存。堆是内存中一片分隔开的区域，其中的数据可以无限期地存储。堆数据并不会和某一个栈帧绑定死。Rust提供了一个内置构造函数**Box**来便捷地把数据放入堆。比如，我们可以使用`Box::new`来封装一百万个元素的数据：

<Wrapper>
<template #code>

```rust
let a = Box::new([0; 1_000_000]); /*[!flag L1]*/
let b = a; /*[!flag L2]*/
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
  <MemoryGraph
    title="L1"
    :memory="{
      stack: [
        { name: 'main', body: [{ key: 'a', point2: 0 }] }
      ],
      heap: [
        { 
          id: 0,
          value: [
            0,0,0,0,0,0,0,0,0,0,0,'...',0
          ]
        }
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
            { key: 'a', point2: 0, moved: true }, 
            { key: 'b', point2: 0 }
          ] 
        }
      ],
      heap: [
        { 
          id: 0,
          value: [
            0,0,0,0,0,0,0,0,0,0,0,'...',0
          ]
        }
      ]
    }"
  />
</div>
</template>

</Wrapper>

可以观察到，在同一时间，只有一个数组存在。在L1，`a`的值是一个指向堆内数组数据的指针（用点和带箭头的线表示）。`let b = a`这个声明将a的指针复制给了b，但指针指向的数据并没有复制。请注意`a`的样式变淡了因为它被**移动了**，后面我们会讨论这是什么含义。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：栈帧是与特定的函数相关联的，当函数结束时会被释放。而堆中的数据可以无限期地存活。注意堆栈中的数据都是可变、可被复制的。堆中也能存储指针（甚至有指向栈的指针，后面我们会看到）

</template>
<template #quiz>

下述哪种说法最准确的描述了栈和堆的不同？

<RadioHolder name="401-1-1">
  <Radio label="栈存储着可复制的数据，堆存储着不可复制的数据" />
  <Radio label="栈存储着不可变的数据，堆存储着可变数据" />
  <Radio label="栈存储着和某个特定函数关联的数据，堆存储着与函数生命周期无关的数据" answer />
  <Radio label="栈可以存储指向堆的指针，而堆只能存储非指针数据" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

两个`盒子`存储了两份15，而`let b = a`只复制了堆指针，并没有复制堆中的值。

</template>

<template #quiz>
请查看如下代码

<Wrapper>

<template #code>

```rust
let a = Box::new(15);
let b = a;
let c = Box::new(15); /*[!flag L1]*/
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
          { key: 'a', point2: 0, moved: true },
          { key: 'b', point2: 0 },
          { key: 'c', point2: 1 },
        ] 
      }
    ],
    heap: [
      { id: 0, value: 15 },
      { id: 1, value: 15 },
    ]
  }"
/>
</template>
</Wrapper>

<span>最终，内存中有多少份数字15的复制体？用数字表示你的答案，比如0或1</span>
<Input answer="2" />
</template>
</Quiz>
</QuizProvider>

:::

## Rust不允许手动的内存管理

内存管理就是分配和释放内存的过程。或者换句话说，是找到空闲内存和后续归还不再被使用内存的过程。Rust会自动管理栈帧。当一个函数被调用，Rust会为其分配栈帧。当调用结束，Rust会释放栈帧。

正如我们之前看到的，在调用`Box::new(..)`时会分配堆内存。但堆内存是何时被释放的？假设Rust有一个`free()`函数用来释放堆内存，并且允许程序员随时可以调用`free`。这种“手动”的内存管理很容易产生漏洞。比如，读取一个指向被释放内存的指针：

<Wrapper>
<template #code>

```rust
let b = Box::new([0; 100]); /*[!flag L1]*/
free(b); /*[!flag L2]*/
assert!(b[0] == 0); /*[!flag_error L3]*/
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'b', point2: 0 }] }
    ],
    heap: [
      { 
        id: 0,
        value: [
          0,0,0,0,0,0,0,0,0,0,0,'...',0
        ]
      }
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory='{ stack: [
    { name: "main", body: [{ key: "b", point2: "null", moved: true }] }
  ]}'
/>

<MemoryGraph
  title="L3"
  errorMessage="未定义行为：指针在其指向的对象被释放后被使用"
  :memory='{ stack: [
    { name: "main", body: [{ key: "b", point2: "null_error", moved: true }] }
  ]}'
/>
</div>
</template>
</Wrapper>

在这里，我们在堆中分配了一个数组。然后调用了`free(b)`，释放了`b`指向的堆内存。因此`b`成了一个空指针，我们用”⦻“来表示。此时还没有未定义行为发生！在L2时，程序仍然是安全的。一个空指针的存在也不是一个问题。

未定义行为发生在我们视图访问b，即读取`b[0]`。这回导致对不可用内存的访问，从而导致程序崩溃。或导致更糟的情况：程序没有崩溃且返回了不相干的随机数据。这样的程序就是**不安全的**。

Rust不允许程序内手动释放内存。这种策略避免了类似上面的未定义行为。

## 内存的释放由拥有者管理

作为替代手段，Rust自动释放堆内存。下面是一条对Rust内存释放策略**几乎**正确的描述：

>（几乎正确的）内存释放原则：如果一个变量和内存绑定，那么当Rust释放变量的栈帧时，Rust会释放堆内存

举个例子，让我们通过下面的程序查看内存的创建和释放

<Wrapper>
<template #code>

```rust
fn main() {
    let a_num = 4; /*[!flag L1]*/
    make_and_drop(); /*[!flag L3]*/
}

fn make_and_drop() {
    let a_box = Box::new(5); /*[!flag L2]*/
}
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L3"
  :memory="{ stack: [
    { name: 'main', body: [{ key: 'a_num', value: 4 }] }
  ]}"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'a_num', value: 4 }] },
      { name: 'make_and_drop', body: [{ key: 'a_box', point2: 0 }] }
    ],
    heap: [
      { id: 0, value: '5' }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  :memory="{ stack: [
    { name: 'main', body: [{ key: 'a_num', value: 4 }] }
  ]}"
/>
</div>
</template>
</Wrapper>

在L1，调用`make_and_drop`之前，内存的中只有`main`的栈帧。接着在L2，调用了`make_and_drop`，`a_box`指向了堆中的`5`。当`make_and_drop`完成调用后，Rust释放了它的栈帧。`make_and_drop`包含了变量`a_box`，所以Rust释放了`a_box`指向的堆内存。因此在L3堆已经是空的了。

堆内存被成功的管理了。但如果我们滥用这个机制呢？回到之前的例子，如果我们将两个变量绑定到同一份堆内存上呢？

```rust
let a = Box::new([0; 1_000_000]);
let b = a;
```

堆中的数组被绑定到了`a`和`b`上。根据我们“几乎正确的”原则，Rust会试图释放两次内存（因为有两个变量）。这也是未定义行为！

为了避免这种情况，我们总算讲到了所有权。当`a`被绑定到`Box::new([0; 1_000_000])`时，我们会说`a`**拥有**了内存。而`let b = a`语句将内存的所有权从`a`**移动**到了`b`。综上所述，Rust释放内存的策略可以有一个更精准的描述：

>（完全正确的）内存释放原则：如果一个变量拥有一份内存，当Rust释放这个变量的栈帧时，对应的堆内存也会被释放。

在上面的例子中，`b`持有数组内存的所有权。因此在作用域结束时，Rust只会出于b的原因释放**一次**内存。

## 集合对内存的使用

为了存储一系列的元素，一些Rust内置的数据结构，比如`Vec`、`String`和`HashMap`也会使用堆内存<Thinking>这些数据结构并不是真的使用了`Box`这个函数。比如，`String`用`Vec`实现，而`Vec`则用`VecRaw`实现。但它们和`Box`的相似性很高：它们的数据都放置在堆中</Thinking>。比如，下面是一个创建、移动、修改字符串的例子：

<Wrapper>
<template #code>

```rust
fn main() {
    let first = String::from("Ferris"); /*[!flag L1]*/
    let full = add_suffix(first); /*[!flag L4]*/
    println!("{full}");
}

fn add_suffix(mut name: String) -> String {
    /*[!flag L2]*/name.push_str(" Jr.");/*[!flag L3]*/
    name
}
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', stack: [{ key: 'first', point2: 0 }] }
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] }
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'first', point2: 0, moved: true }] },
      { name: 'add_suffix', body: [{ key: 'name', point2: 0 }] },
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  :memory="{
    stack: [
      { name: 'main', body: [{ key: 'first', point2: 'null', moved: true }] },
      { name: 'add_suffix', body: [{ key: 'name', point2: 0 }] }
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's', ' ', 'J', 'r', '.'] }
    ]
  }"
/>

<MemoryGraph
  title="L4"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'first', point2: 'null', moved: true },
        { key: 'full', point2: 0 },
      ] },
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's', ' ', 'J', 'r', '.'] }
    ]
  }"
/>
</div>
</template>
</Wrapper>

这个程序更加深入，请确保跟上每一步：

1. 在L1，字符串”Ferris“被分配了堆内存。`first`拥有它。
2. 在L2，`add_suffix(first)`函数被调用了。字符串的所有权从`first`移动到了`name`。字符串的内容并没有被复制，但指针被复制了。
3. 在L3，`name.push_str(" Jr.")`扩展了字符串的堆内空间。这会导致三件事：
   - 分配了一个新的、更大的内存
   - ”Ferris Jr.“被写入了新的内存空间
   - 旧的内存空间被释放了
4. 在L4，`add_suffix`的栈帧被销毁了。函数返回了`name`，将所有权交给了`full`

## 所有权移动后的变量无法继续使用

前面的程序帮助说明了所有权是如何保证安全的。想象一下如果在调用`add_suffix`后，`first`在`main`函数中被使用了。我们可以模拟一段程序来看看其导致的未定义行为：

<Wrapper>
<template #code>

```rust
fn main() {
    let first = String::from("Ferris");
    let full = add_suffix(first);
    println!("{full}, originally {first}"); /*[!flag_error L1]*/ // first 在这里被使用了
}

fn add_suffix(mut name: String) -> String {
    name.push_str(" Jr.");
    name
}
```

</template>

<template #graph>
<MemoryGraph
  title="L1"
  errorMessage="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'first', point2: 'null_error', moved: true },
        { key: 'full', point2: 0 }
      ] }
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's', ' ', 'J', 'r', '.'] }
    ]
  }"
/>
</template>
</Wrapper>

在`add_suffix`调用结束后，`first`指向了被释放的内存。在`println!`中读取`first`因此违反了内存安全（也就成为了未定义行为）。请记住：导致问题的不是`first`指向了被释放的内存，而是试图在`first`无效后还使用它的行为。

谢天谢地的是，Rust会拒绝编译这段程序，并给出如下报错：

```
error[E0382]: borrow of moved value: `first`
--> test.rs:4:35
 |
2|		let first = String::from("Ferris");
 |		    ----- move occurs because `first` has type `String`, which does not implement the `Copy` trait
3|		let full = add_suffix(first);
 |		                      ----- value moved here
4|		println!("{full}, originally {first}"); // first 在这里被使用了
 |		                              ^^^^^ value borrowed here after move
```

让我们跟随这个错误的脚步。Rust告诉我们在程序第三行调用`add_suffix`时，`first`被移动了。错误信息阐明了`first`被移动的原因是它的类型是`String`，这个类型没有实现`Copy`。我们很快会讨论`Copy`，简而言之，如果你使用`i32`而不是`String`，就不会得到这个错误。最后，错误信息指出在`first`被移动后我们使用了它（错误中说的是”借用“，后面我们会讨论）。

所以如果你移动了一个变量，Rust会阻止你继续使用原始变量。更普遍来说，编译器会坚持以下原则：

> 堆内存移动原则：如果变量`x`把它对堆内存数据有所有权移动到了变量`y`，那么在移动后`x`无法继续被使用。

现在你应该能感觉到所有权、移动和安全之间的联系了。移动堆数据的所有权避免了”读取空指针“这种未定义行为。

## 克隆取代移动

有一种避免移动数据的方式就是克隆它，调用`.clone()`方法，比如，我们可以使用克隆修复前面的程序：

<Wrapper>
<template #code>

```rust
fn main() {
    let first = String::from("Ferris");
    let first_clone = first.clone(); /*[!flag L1]*/
    let full = add_suffix(first_clone); /*[!flag L2]*/
    println!("{full}, originally {first}");
}

fn add_suffix(mut name: String) -> String {
    name.push_str(" Jr.");
    name
}
```

</template>

<template #graph>
<div class="flex flex-col gap-8">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'first', point2: 0 },
        { key: 'first_clone', point2: 1 }
      ] }
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] },
      { id: 1, value: ['F', 'e', 'r', 'r', 'i', 's'] },
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      { name: 'main', body: [
        { key: 'first', point2: 0 },
        { key: 'first_clone', point2: 'null', moved: true },
        { key: 'full', point2: 1 }
      ] }
    ],
    heap: [
      { id: 0, value: ['F', 'e', 'r', 'r', 'i', 's'] },
      { id: 1, value: ['F', 'e', 'r', 'r', 'i', 's', ' ', 'J', 'r', '.'] },
    ]
  }"
/>
</div>
</template>
</Wrapper>

可以观察到在L1，`first_clone`并不是”浅“复制了`first`的指针，而是”深“复制了堆内存中的数据。因此在L2，当`first_clone`被移动且被`add_suffix`无效化后，原始的`first`变量并没有被改变。继续使用`first`是安全的。

::: details 小测（4）
<QuizProvider>
<Quiz>
<template #description>

解析：在栈帧中存放一个空指针是完全安全的，重点在于不要使用空指针。（不管是读取还是释放）

</template>
<template #quiz>
下面哪一个选项【不是】未定义行为？

<RadioHolder name="401-2-1">
  <Radio value="A" label="栈帧中存储着一个空指针" answer />
  <Radio value="B" label="释放同一片内存两次" />
  <Radio value="C" label="在if()中使用非bool类型的值" />
  <Radio value="D" label="使用一个空指针" />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #quiz>
判断下面的程序是否编译成功，如果成功，写出执行后的输出结果。

```rust
fn add_suffix(mut s: String) -> String {
    s.push_str(" world");
    s
}

fn main() {
    let s = String::from("hello");
    let s2 = add_suffix(s);
    println!("{}", s2);
}
```

<IsCompile 
  name="401-2-2"
  :answer="{
    compiled: true,
    result: 'hello world'
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：变量s在if体里被移动了，所以在第8行使用它是不合法的。尽管在这个程序中，b永远是false，所以if永远不会被执行，但Rust通常不会尝试解析if是否会被执行，只会认为它“可能”会被执行，所以“可能”存在移动。

</template>
<template #quiz>
判断下面的程序是否编译成功，如果成功，写出执行后的输出结果。

```rust
fn main() {
    let s = String::from("hello");
    let s2;
    let b = false;
    if b {
        s2 = s;
    }
    println!("{}", s)
}
```

<IsCompile name="401-2-3" :answer="{ compiled: false }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：核心概念在于，当堆内存传递给`move_a_box`后，它会在`move_a_box`调用结束后被释放，因此

- 在`move_a_box`调用后试图使用`println`访问`b`是未定义行为，因为它所指向的内存已经被释放了
- 移动`b`的所有权两次是未定义行为，这会导致Rust重复释放内存。（不管`let b2 = b`在`move_a_box`的前面还是后面）

然而，在`let b2 = b`后进行`println!(b)`并不是未定义行为。尽管`b`被移动了，它所指向的数据还没有被释放，直到`move_a_box`调用结束。因此从技术层面讲这段代码是安全的，但Rust仍会让它编译失败。

</template>

<template #quiz>
现有如下函数，移动了堆数据

```rust
fn move_a_box(b: Box<i32>) {
    // 什么都没有
}
```

下面有四个被Rust编译器拒绝的程序，想象一下如果Rust允许这些代码编译通过。请选择哪些代码会导致未定义行为，或选择“都不会”

<div class="flex flex-col">
<CheckboxHolder name="401-2-4">
<Checkbox label="都不会" />

<Checkbox>

```rust
let b = Box::new(0);
let b2 = b;
println!("{}", b);
move_a_box(b2);
```

</Checkbox>

<Checkbox answer>

```rust
let b = Box::new(0);
let b2 = b;
move_a_box(b);
```

</Checkbox>

<Checkbox answer>

```rust
let b = Box::new(0);
move_a_box(b);
let b2 = b;
```

</Checkbox>

<Checkbox answer>

```rust
let b = Box::new(0);
move_a_box(b);
println!("{}", b)
```

</Checkbox>
</CheckboxHolder>
</div>


</template>
</Quiz>
</QuizProvider>
:::

## 总结

所有权是堆内存管理的主要规则<Thinking>从另一个角度说，所有权也是指针管理的规则。但我们还没有讲解如何创建指向各种地方（而不仅仅是堆数据）的指针，下一节我们会讲到</Thinking>

- 所有的堆数据都必须被**一个**变量拥有
- 一旦堆数据的拥有者结束了它的生命周期，Rust就会释放这些内存
- 所有权可以被移动，具体表现为赋值（变量->变量）和函数调用（变量->形参变量）
- 堆数据只能被当前拥有者访问，过去的拥有者无法访问

我们不仅强调了Rust的保护机制是如何工作的，也强调了为什么要避免未定义行为。当程序没有通过Rust编译器的编译，而你不理解Rust抛出的错误信息，很容易为之变得苦恼。本节讨论的基础概念应该能够帮助你解释Rust的错误信息，帮助你设计更加“Rust风格”的API。
























