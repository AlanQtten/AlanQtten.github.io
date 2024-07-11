<script setup>
import {
  QuizProvider,
  Quiz,
  RadioHolder,
  Radio,
  CheckboxHolder,
  Checkbox,
} from "../../components/quiz"
</script>

# 所有权之旅 #2

所有权之旅是一个系列的测试，检查你对所有权在实际情景中的理解。这些情景都是源自StackOverflow上有关Rust的问题。你可以用这些问题测试自己目前对所有权的理解。

::: details 小测（6）
<QuizProvider>
<Quiz>
<template #description>

解析：`v.iter()`在for循环期间内对vector`v`进行了不可变借用。然而，`v.remove(i)`要求`v`的可变借用。因此`v.remove(i)`不能将`v`借用为可变的，这会跟迭代器冲突。

</template>
<template #quiz>
程序1

```rust
/// 移除原整数数组中的0
fn remove_zeros(v: &mut Vec<u32>) {
    for (i, t) in v.iter().enumerate().rev() {
        if *t == 0 {
          v.remove(i);
          v.shrink_to_fit();
        }
    }
}
```

如果你要编译这个函数，你会收到以下哪一个错误？

<RadioHolder>
<Radio label="v.iter()不能在可变引用上调用" />
<Radio label="v的存活时长不足以调用v.remove(i)" />
<Radio label="i仍存活时，t不能被解引用" />
<Radio label="v.remove(i)不能将v借用为可变的" answer />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：要违反内存安全，`remove_zeros`必须传入一个第一个元素后还出现零的vector。`v.shrink_to_fit()`会释放vector的内存（根据大小的调整），它会使指向旧数据的迭代器`v.iter()`被无效化。注意在调用`remove_zeros`后访问`v`并不是违反内存安全的必要条件，因为问题来自内部。

</template>
<template #quiz>
程序1

```rust
/// 移除原整数数组中的0
fn remove_zeros(v: &mut Vec<u32>) {
    for (i, t) in v.iter().enumerate().rev() {
        if *t == 0 {
          v.remove(i);
          v.shrink_to_fit();
        }
    }
}
```

如果你要编译这个函数，你会收到如下报错：

```
error[E0502]: cannot borrow `*v` as mutable because it is also borrowed as immutable
 --> test.rs:5:13
  |
3 |     for (i, t) in v.iter().enumerate().rev() {
  |                   --------------------------
  |                   |
  |                   immutable borrow occurs here
  |                   immutable borrow later used here
4 |         if *t == 0 {
5 |             v.remove(i);
  |             ^^^^^^^^^^^ mutable borrow occurs here
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<CheckboxHolder>
<Checkbox answer>

```rust
let mut v = vec![5, 5, 0];
remove_zeros(&mut v);
println!("{:?}", v);
```

</Checkbox>
<Checkbox>

```rust
let mut v = vec![1; 100];
remove_zeros(&mut v);
```

</Checkbox>
<Checkbox answer>

```rust
let mut v = vec![1, 2, 0, 3];
remove_zeros(&mut v);
```

</Checkbox>
<Checkbox label="都不满足" />
</CheckboxHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：任何需要分配新vector的操作，不管是`Vec::clone`还是`Vec::new`，都引发了不必要的分配。因此最简单的策略是直接对`0 .. v.len()`进行迭代，不对`v`进行借用操作。我们用逆序来进行这个操作是为了避免移除一些不正确的下标。

正如之前提到的问题一样，这个问题的最佳解法其实是使用一个还没有讨论过的内置函数：`Vec::retain`。这个函数会保留通过断言的元素，但以更高效的内存实现。

</template>
<template #quiz>
程序1

```rust
/// 移除原整数数组中的0
fn remove_zeros(v: &mut Vec<u32>) {
    for (i, t) in v.iter().enumerate().rev() {
        if *t == 0 {
          v.remove(i);
          v.shrink_to_fit();
        }
    }
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<RadioHolder>
<Radio>

```rust /Vec<i32>/
fn remove_zeros(v: Vec<i32>) {
    for (i, t) in v.iter().enumerate().rev() {
        if *t == 0 {
            v.remove(i);
            v.shrink_to_fit();
        }
    }
}
```

</Radio>
<Radio>

```rust /.clone()/
fn remove_zeros(v: &mut Vec<i32>) {
    for (i, t) in v.clone().iter().enumerate().rev() {
        if *t == 0 {
            v.remove(i);
            v.shrink_to_fit();
        }
    }
}
```

</Radio>
<Radio answer>

<!-- TODO: highlight v[i] -->
```rust /i in (0 .. v.len()).rev()/
fn remove_zeros(v: &mut Vec<i32>) {
    for i in (0 .. v.len()).rev() {
        if v[i] == 0 {
            v.remove(i);
            v.shrink_to_fit();
        }
    }
}
```

</Radio>

<Radio>

```rust
fn remove_zeros(v: &Vec<i32>) -> Vec<i32> {
    let mut new_vec = Vec::new();
    for (i, t) in v.iter().enumerate().rev() {
        if *t != 0 {
            new_vec.push(*t);
        }
    }
    new_vec
}
```

</Radio>
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：编译器并不会考虑访问数组时的下标值，所以`&mut v[i]`和`&mut v[n - i - 1]`会被视为对同一个元素的引用。因此我们会看到`v`无法被重复可变借用的错误。

</template>
<template #quiz>
程序2

```rust
/// 将原数组逆转
fn reverse(v: &mut Vec<String>) {
    let n = v.len();
    for i in 0 .. n / 2 {
        std::mem::swap(&mut v[i], &mut v[n - i - 1]);
    }
}
```

如果你要编译这个函数，你会收到以下哪一个错误？

<RadioHolder>
<Radio label="不能通过v[i]和v[n - i - 1]对v进行重复可变借用" answer />
<Radio label="v本身是可变借用，不能通过v.len()对v进行不可变借用" />
<Radio label="不能通过v[i]对一个可变的vector创建可变借用" />
</RadioHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：这个函数并不会引起内存安全问题，因为所有的`i`都满足`i != n - i - 1`，这两个可变借用永远指向不同的元素。注意`let x = &v[0]`是无法通过编译的，Rust的借用检查器不会允许`x`存活时调用`reverse`。

</template>
<template #quiz>
程序2

```rust
/// 将原数组逆转
fn reverse(v: &mut Vec<String>) {
    let n = v.len();
    for i in 0 .. n / 2 {
        std::mem::swap(&mut v[i], &mut v[n - i - 1]);
    }
}
```

如果你要编译这个函数，你会收到如下报错：

```
error[E0499]: cannot borrow `*v` as mutable more than once at a time
 --> test.rs:5:40
  |
5 |         std::mem::swap(&mut v[i], &mut v[n - i - 1]);
  |         --------------      -          ^ second mutable borrow occurs here
  |         |                   |
  |         |                   first mutable borrow occurs here
  |         first borrow later used by call

```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<CheckboxHolder>
<Checkbox>

```rust
let mut v = vec![String::from("a"), String::from("b")];
reverse(&mut v);
println!("{:?}", v);
```

</Checkbox>
<Checkbox>

```rust
let mut v = vec![String::from("a"), String::from("b")];
let x = &v[0];
reverse(&mut v);
println!("{x}");
```

</Checkbox>
<Checkbox>

```rust
let mut v = vec![String::from("a"), String::from("b")];
reverse(&mut v);
```

</Checkbox>
<Checkbox label="都不满足" answer />
</CheckboxHolder>
</template>
</Quiz>

<Quiz>
<template #description>

解析：对于这种借用检查器拒绝了的实际上是安全的程序，且毫无迂回时，为了避免内存重分配，`unsafe`的代码块也是可以被接受的。这种特殊情况下，你应该使用`Vec::swap`，它内部的`unsafe`代码（跟答案的代码类似）进行了严格的测试。不过通常来说，如果标准库没有提供你需要的函数，那么正确地使用`unsafe`也是可以被接受的。

</template>
<template #quiz>
程序2

```rust
/// 将原数组逆转
fn reverse(v: &mut Vec<String>) {
    let n = v.len();
    for i in 0 .. n / 2 {
        std::mem::swap(&mut v[i], &mut v[n - i - 1]);
    }
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<RadioHolder>
<Radio>

```rust {4-7}
fn reverse(v: &mut Vec<String>) {
    let n = v.len();
    for i in 0 .. n / 2 {
        let s1 = v[i].clone();
        let s2 = v[n - i - 1].clone();
        v[i] = s2;
        v[n - i - 1] = s1;
    }
}
```

</Radio>
<Radio answer>

```rust {4-6}
fn reverse(v: &mut Vec<String>) {
    let n = v.len();
    for i in 0 .. n / 2 {
        let p1 = &mut v[i] as *mut String;
        let p2 = &mut v[n - i - 1] as *mut String;
        unsafe { std::ptr::swap_nonoverlapping(p1, p2, 1) };
    }
}
```

</Radio>
<Radio>

```rust /Vec<String>/ /let mut v2 = Vec::new();/ /v.push(v.pop().unwrap());/
fn reverse(v: &Vec<String>) -> Vec<String> {
    let n = v.len();
    let mut v2 = Vec::new();
    for i in 0 .. n {
        v.push(v.pop().unwrap());
    }
    v2
}
```

</Radio>

<Radio>

```rust /let mut v2 = v.clone();/
fn reverse(v: &Vec<String>) -> Vec<String> {
    let n = v.len();
    let mut v2 = v.clone();
    for i in 0 .. n / 2 {
        std::mem::swap(&mut v[i], &mut v2[n - i - 1]);
    }
}
```

</Radio>
</RadioHolder>
</template>
</Quiz>
</QuizProvider>
:::
