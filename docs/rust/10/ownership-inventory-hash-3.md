<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 所有权之旅 #3

所有权之旅是一个系列的测试，检查你对所有权在实际情景中的理解。这些情景都是源自StackOverflow上有关Rust的问题。你可以用这些问题测试自己目前对所有权的理解。

::: details 小测（6）
<QuizProvider>
<Quiz>
<template #description>

解析：`slice::sort`方法需要传入一个切片的可变引用，但原代码中传入了不可变引用。

</template>
<template #quiz>

```rust
/// 返回切片中第n大的元素
fn find_nth<T: Ord + Clone>(elems: &[T], n: usize) -> T {
    elems.sort();
    let t = &elems[n];
    return t.clone();
}
```

如果你试图编译这段代码，你会收到以下哪一个错误？

<Radio>
<Option label="T的生命周期必须大于&[T]" />
<Option label="不能通过表达式&elems[n]移动共享引用" />
<Option label="不能通过clone移动共享引用" />
<Option label="不能通过sort将elems借用为可变的" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这个程序实际上是内存安全的，因为`slice::sort`只会移动元素，并不会销毁它们。比如，`&v[0]`在`find_nth`调用后仍然会指向*某个*数字，尽管指向的数字可能*不是原数字了*。

请注意`find_nth(v, 10)`也不会引发未定义行为，因为Rust会对数组的访问进行预检，所以`&v[10]`会引发`panic`。

</template>
<template #quiz>

```rust
/// 返回切片中第n大的元素
fn find_nth<T: Ord + Clone>(elems: &[T], n: usize) -> T {
    elems.sort();
    let t = &elems[n];
    return t.clone();
}
```

如果你试图编译这段代码，你会看到如下错误

```
error[E0596]: cannot borrow `*elems` as mutable, as it is behind a `&` reference
 --> test.rs:3:5
  |
3 |     elems.sort();
  |     ^^^^^^^^^^^^ `elems` is a `&` reference, so the data it refers to cannot be borrowed as mutable
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<Checkbox>
<Option>

```rust
let v = vec![5, 4, 3, 2, 1];
find_nth(&v, 0);
println!("{}", v[0]);
```

</Option>
<Option label="都不满足" answer />
<Option>

```rust
let v = vec![5, 4, 3, 2, 1];
find_nth(&v, 10);
```

</Option>
<Option>

```rust
let v = vec![5, 4, 3, 2, 1];
let n = &v[0];
find_nth(&v, 0);
println!("{}", n);
```

</Option>
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：类似`find_nth`这样的程序显然执行的是只读操作，也就是说它不应该影响入参的顺序。因此任何试图改变或者销毁入参的操作都不符合原函数的意图，就算将其转为更高效的vector也不行。

创建一个`Vec<&T>`的方案比`Vec<T>`更好，因为`T`可能会很大，`elems.to_vec()`的操作会很耗时。然而，如果`T`设置为`T: Copy`，那么`to_vec`就更合理了，它还能减少`elems.sort()`过程中的指针解引用操作。

</template>
<template #quiz>

```rust
/// 返回切片中第n大的元素
fn find_nth<T: Ord + Clone>(elems: &[T], n: usize) -> T {
    elems.sort();
    let t = &elems[n];
    return t.clone();
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<Radio>
<Option>

```rust /let mut elems = elems.to_vec();/
fn find_nth<T: Ord + Clone>(elems: &[T], n: usize) -> T {
    let mut elems = elems.to_vec();
    elems.sort();
    let t = &elems[n];
    return t.clone();
}
```

</Option>
<Option>

```rust /T: Ord/ /mut elems: Vec<T>/ /elems.remove(n);/ /return t;/
fn find_nth<T: Ord>(mut elems: Vec<T>, n: usize) -> T {
    elems.sort();
    let t = elems.remove(n);
    return t;
}
```

</Option>
<Option>
<!-- TODO: highlight word in some line -->

```rust /elems: &mut/
fn find_nth<T: Ord + Clone>(elems: &mut [T], n: usize) -> T {
    elems.sort();
    let t = &elems[n];
    return t.clone();
}
```

</Option>
<Option answer>

```rust
fn find_nth<T: Ord + Clone>(elems: &[T], n: usize) -> T {
    let mut ele_refs: Vec<&T> = elems.iter().collect();
    elem_refs.sort();
    let t = ele_refs[n];
    return t.clone();
}
```

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：根据生命周期忽略规则，`get_curve`函数的签名为`get_curve<'a>(&'a self) -> &'a Option<usize>`，这就意味着`self.get_curve()`的调用借用了整个`self`，而不仅仅是`self.curve`。因此在`let Some(curve) = ...`内的`self`的不可变借用以及`self.scores.iter_mut()`是不合法的。

</template>
<template #quiz>

```rust
struct TestResult {
    /// 学生的考试成绩
    scores: Vec<size>,

    /// 加权分数
    curve: Option<usize>
}
impl TestResult {
    pub fn get_curve(&self) -> &Option<usize> {
        &self.curve
    }

    /// 如果存在加权分数，那么分数全部提高
    pub fn apply_curve(&mut self) {
        if let Some(curve) = self.get_curve() {
            for score in self.scores.iter_mut() {
                *score += *curve;
            }
        }
    }
}
```

如果你试图编译这段代码，你会收到以下哪一个错误？

<Radio>
<Option label="在apply_curve中，不能将self借用为不可变来调用get_curve" />
<Option label="在apply_curve中，*score不能被修改" />
<Option label="在get_curve中，不能将本地变量self.curve作为引用返回" />
<Option label="在apply_curve中，不能将self.scores借用为可变来调用iter_mut" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这个程序实际上是安全的。但借用检查器存在限制，它无法识别到`get_curve`只借用了`curve`，而没有影响`scores`。然而，理论上`get_curve`是存在返回一些和`self.scores`有关的引用，从而破坏内存安全的可能性的。

</template>
<template #quiz>

```rust
struct TestResult {
    /// 学生的考试成绩
    scores: Vec<size>,

    /// 加权分数
    curve: Option<usize>
}
impl TestResult {
    pub fn get_curve(&self) -> &Option<usize> {
        &self.curve
    }

    /// 如果存在加权分数，那么分数全部提高
    pub fn apply_curve(&mut self) {
        if let Some(curve) = self.get_curve() {
            for score in self.scores.iter_mut() {
                *score += *curve;
            }
        }
    }
}
```

如果你试图编译这段代码，你会看到如下错误

```
error[E0502]: cannot borrow `self.scores` as mutable because it is also borrowed as immutable
  --> test.rs:17:26
   |
16 |         if let Some(curve) = self.get_curve() {
   |                              ---------------- immutable borrow occurs here
17 |             for score in self.scores.iter_mut() {
   |                          ^^^^^^^^^^^^^^^^^^^^^^ mutable borrow occurs here
18 |                 *score += *curve;
   |                           ------ immutable borrow later used here
```

如果编译器**没有**拒绝这个函数。以下哪些个程序能够满足

1. 通过编译
2. 程序的执行可能会引发未定义行为

<Checkbox>
<Option>

```rust
let mut result = TestResult {
    scores: vec![20, 50, 30],
    curve: Some(10)
};
let x = &result.scores[0];
result.apply_curve();
println!("{}", x);
```

</Option>
<Option label="都不满足" answer />
<Option>

```rust
let mut result = TestResult {
    scores: vec![20, 50, 30],
    curve: Some(10)
};
result.apply_curve();
```

</Option>
<Option>

```rust
let mut result = TestResult {
    scores: vec![20, 50, 30],
    curve: Some(10)
};
result.apply_curve();
println!("{:?}", result.scores);
```

</Option>
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：通过移除`get_curve`方法的调用，在行内直接访问`curve`，借用检查器就可以理解`self.curve`不会影响`self.scores`，从而允许函数进行正常编译。这也是绕开借用检查器限制的常见方法之一。

另一种迂回的办法是在`self.curve`的复制很轻量，使用`Option::copied`，一旦调用`.copied()`，`self`的借用会立刻解除。

</template>
<template #quiz>

```rust
struct TestResult {
    /// 学生的考试成绩
    scores: Vec<size>,

    /// 加权分数
    curve: Option<usize>
}
impl TestResult {
    pub fn get_curve(&self) -> &Option<usize> {
        &self.curve
    }

    /// 如果存在加权分数，那么分数全部提高
    pub fn apply_curve(&mut self) {
        if let Some(curve) = self.get_curve() {
            for score in self.scores.iter_mut() {
                *score += *curve;
            }
        }
    }
}
```

查看下面的修复（已高亮），哪一个修复符合以下三个标准

1. 修复的函数能够通过Rust的编译
2. 修复的函数保留了原始函数的意图
3. 修复的函数没有引发不必要的性能问题

<Radio>
<Option answer>

```rust /self.curve/
pub fn apply_curve(&mut self) {
    if let Some(curve) = self.curve {
        for score in self.scores.iter_mut() {
            *score += *curve;
        }
    }
}
```

</Option>
<Option>

```rust /.iter()/
pub fn apply_curve(&mut self) {
    if let Some(curve) = self.get_curve() {
        for score in self.scores.iter() {
            *score += *curve;
        }
    }
}
```

</Option>
<Option>

```rust /.as_ref()/
pub fn apply_curve(&mut self) {
    if let Some(curve) = self.get_curve.as_ref() {
        for score in self.scores.iter_mut() {
            *score += *curve;
        }
    }
}
```

</Option>
<Option>

```rust /.clone()/
pub fn apply_curve(&mut self) {
    if let Some(curve) = self.get_curve() {
        for score in self.scores.clone().iter_mut() {
            *score += curve;
        }
    }
}
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
