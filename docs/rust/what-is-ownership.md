<script setup>
import Stack from '../components/stack-graph/Stack.vue'
import Wrapper from '../components/stack-graph/Wrapper.vue'
</script>

>（译）

# 理解所有权

**所有权**是Rust最独特的特性，对这门语言的其余部分也有重大意义。**所有权**使得Rust能够在不需要垃圾回收的情况下保证内存安全，所以，理解所有权的工作原理十分重要，在这一章中，我们会讨论所有权以及几个与之关联的特性：借用（borrowing），切片（slice），以及Rust如何在内存中放置数据。

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
<div style="display: flex;gap: 32px;">
  <Stack 
    title="L1"
    :memory="[{ scopeName: 'main', stack: [{ key: 'n', value: 5 }] }]"
  />

  <Stack 
    title="L2"
    :memory="[
      { scopeName: 'main', stack: [{ key: 'n', value: 5 }] },
      { scopeName: 'plus_one', stack: [{ key: 'x', value: 5 }] },
    ]"
  />

  <Stack 
    title="L1"
    :memory="[{ scopeName: 'main', stack: [{ key: 'n', value: 5 }, { key: 'y', value: 6 }] }]"
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
<div style="display: flex;gap: 32px;">
  <Stack 
    title="L1"
    :memory="[{ scopeName: 'main', stack: [{ key: 'a', value: 5 }] }]"
  />

  <Stack 
    title="L2"
    :memory="[{ scopeName: 'main', stack: [{ key: 'a', value: 5 }, { key: 'b', value: 5 }] }]"
  />

  <Stack 
    title="L3"
    :memory="[{ scopeName: 'main', stack: [{ key: 'a', value: 5 }, { key: 'b', value: 6 }] }]"
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
<div style="display: flex;flex-direction: column;gap: 16px;">
  <Stack 
    title="L1"
    :memory="[{ scopeName: 'main', stack: [
      { 
        key: 'a', 
        value: [
          0,0,0,0,0,0,0,0,0,0,0,'...',0
        ] 
      }
    ] }]"
  />

  <Stack 
    title="L2"
    :memory="[{ scopeName: 'main', stack: [
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
    ] }]"
  />
</div>
</template>
</Wrapper>

可以看到，复制a到b的行为导致main函数的帧中存放了两百万个元素。















