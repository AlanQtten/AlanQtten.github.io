<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  IsCompileText,
  IsCompile
} from "../../components/quiz"
import {
  Wrapper,
  MemoryGraph
} from "../../components/memory-graph"
import ShikiCode from "../../components/code/ShikiCode.vue"
import { lr } from "../../utils/renderer"
import { W } from "../../components/letter"

</script>

# 使用Vector创建强大的值列表

我们要讨论的第一个集合类型是`Vec<T>`，也被成为*vector*。vector允许你存储多个数据类型相同的值，它们会在内存中被紧密存储。vector只能存储同类型的数据。对于要存储一系列元素的场景，它们是十分有用的，比如一个文件的多行文字，或者一个购物车内容的价格列表。

## 创建新的Vector

要创建一个新的空vector，我们需要调用`Vec::new`函数：

```rust
    let v: Vec<i32> = Vec::new();
```

注意这里我们添加了类型标注。因为这个集合中没有任何的值，Rust并不知道我们希望存储什么类型的数据。这是一个很重要的点。vector的实现使用了泛型；我们会在第10章讨论。现在，只需要知道标准库提供的`Vec<T>`可以持有任何类型。当我们创建了存储特定类型的vector，我们可以在尖括号内声明类型。在上面的例子里，我们告诉Rust`Vec<T>`类型的`v`会存储`i32`类型的元素。

通常来说，你会使用初始值来创建`Vec<T>`，Rust会自动推断你希望存储的类型，并不需要你手动声明。Rust提供了方便的`vec!`宏，它能快速创建一个vector。下面的代码就创建了一个持有`1`、`2`和`3`的`Vec<i32>`。这里推断的类型是`i32`，这是数字的默认类型，正如我们在数据类型的章节讨论过的：

```rust
    let v = vec![1, 2, 3];
```

因为我们给予了初始的`i32`值，Rust可以推断`v`的类型是`Vec<i32>`，类型定义就可以省略了。下面，我们来看看如何修改vector。

## 更新Vector

要创建一个vector并添加元素，我们可以使用`push`方法：

```rust
    let mut v = Vec::new();

    v.push(5);
    v.push(6);
    v.push(7);
    v.push(8);
```

对于任何变量，只要我们想要修改它的值，就需要使用`mut`关键字进行声明。我们插入的内容是`i32`类型，所以Rust可以推断出vector的类型，无需`Vec<i32>`声明。

## 读取Vector元素

有两种方式来对vector的元素进行引用：索引或`get`方法。在下面的例子里，我们声明了返回值的类型，仅仅为了程序的清晰度。

下面的例子展示了使用两种方式来访问vector元素：

```rust
    let v = vec![1, 2, 3, 4, 5];

    let third: &i32 = &v[2];
    println!("The third element is {third}");

    let third: Option<&i32> = v.get(2);
    match third {
        Some(third) => println!("The third element is {third}"),
        None => println!("There is no third element").
    }
```

注意一些细节。我们使用了下标`2`来获取vector的第三个值，因为vector用数字作为下标，从0开始。使用`&`和`[]`可以创建对应下标的引用。而当我们使用`get`方法传入下标时，我们会收到一个`Option<&T>`，这时我们可以使用`match`来处理。

Rust提供两种方式是为了让你自己选择下标越界时的行为。比如，如果我们尝试获取用这两种方式获取下标为100的元素：

```rust
    let v = vec![1, 2, 3, 4, 5];

    let does_not_exist = &v[100];
    let does_not_exist = v.get(100);
```

当我们运行这段代码，第一个`[]`方法会导致程序崩溃，因为它试图对一个不存在的元素创建引用。如果你希望程序在有人试图访问越界时崩溃，那么你应该使用下标的方式。

当使用`get`方法访问越界时，它会返回一个`None`，不会导致程序崩溃。如果在你的程序中，下标越界是常见且正常的行为，那么你应该使用这种方法。你的代码应该伴随着对`Some(&element)`和`None`的处理逻辑，就像第6章讨论的那样。比如，下标可能来自一个用户输入。如果他们不小心输入了太大的数字，程序收到了一个`None`，你可以提示用户当前的集合中有多少元素，然后给他们一个重新输入正确值的机会。这样比在输错时直接崩溃要更加的友好！

当程序创建了一个有效的引用时，借用检查器会确认其所有权和借用规则（正如我们在第四章讨论的）来保证这个引用和其他对这个vector的引用保持有效的状态。回顾可变引用和不可变引用同事存在的情况。下面的程序就适用于那个规则，当我们对vector的第一个元素创建了一个不可变引用，还试图在vector尾部添加元素时，程序不会允许我们继续访问那个元素：

```rust
    let mut v = vec![1, 2, 3, 4, 5];

    let first = &v[0];

    v.push(6);

    println!("The first element is {first}");
```

编译这段代码会看到如下报错：

```
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:5
  |
4 |     let first = &v[0];
  |                  - immutable borrow occurs here
5 |
6 |     v.push(6);
  |     ^^^^^^^^^ mutable borrow occurs here
7 |
8 |     println!("The first element is: {first}");
  |                                      ----- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `collections` due to previous error
```

上面的代码看起来可能是可行的：为什么第一个元素要关注vector尾部元素的变化呢？这个错误源自于vector的工作原理：因为vector会将值在内存中连续存储，在其尾部添加一个元素时且当前存储空间的后面已经没有足够的空间来存储新元素时，vector需要重新分配新的内存空间，并将旧的元素复制过来。这种情况下，对第一个元素的引用会指向被释放的内存。借用规则就是为了避免程序进入那种情况。

> [!NOTE]
> 要了解更多`Vec<T>`的细节，请查看Rust圣经。

## 遍历vector的元素

要依次访问vector中的元素，你可以使用迭代器，它省去了一个个访问元素的繁琐。下面的程序展示了如何使用`for`循环来对一个`i32`vector的每个元素创建不可变引用并打印它们：

```rust
    let v = vec![100, 32, 57];
    for n_ref in &v {
        // n_ref的类型是i32
        let n_plus_one: i32 = *n_ref + 1;
        println!("{n_plus_one}");
    }
```

要读取`n_ref`引用的数字，我们需要使用解引用操作符`*`来获取`n_ref`的值，然后我们可以进行加1，这部分我们在第四章讨论过。

我们也可以对集合的每个元素创建可变引用，而不是直接修改所有元素。下面的`for`循环就给集合的每个元素加了`50`：

```rust
    let mut v = vec![100, 32, 57];
    for n_ref in &mut v {
        // n_ref的类型是 &mut i32
        *n_ref += 50;
    }
```

要修改可变引用所指向的值，我们需要使用解引用操作符`*`来获取`n_ref`的值，然后我们可以使用`+=`操作符。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：如果`til = 4`，那么对于长度为`3`的vector，for循环会试图对vector进行`i = 3`的操作，这是越界的。但`n = 1`不会导致程序崩溃，因为它不会运行到越界的下标，会提前退出。

</template>
<template #quiz>

以下哪一个对`find_until`函数的调用会导致运行时崩溃？

```rust
fn find_until(v: &Vec<i32>, n: i32, til: usize) -> Option<usize> {
    for i in 0 .. til {
        if v[i] == n {
            return Some(i);
        }
    }
    return None;
}
```

<Radio>
<Option label="find_until(&vec![1, 2, 3], 0, 0)" />
<Option label="find_until(&vec![1, 2, 3], 3, 3)" />
<Option label="find_until(&vec![1, 2, 3], 1, 4)" />
<Option label="find_until(&vec![1, 2, 3], 4, 4)" answer />
</Radio>
</template>
</Quiz>

<Quiz>
<template #description>

解析：`Vec::push`移动了它的参数，所以`s`在`v.push(s)`后不再可用了。因此调用`println!("original: {}", s)`是不符合所有权安全的。

</template>
<template #quiz>
<IsCompileText />

```rust
fn main() {
    let mut v = Vec::new();
    let s = String::from("Hello ");
    v.push(s);
    v[0].push_str("world");
    println!("original: {}", s);
    println!("new: {}", v[0]);
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：不可复制的类型无法使用下标来移动。只能使用类似`Vec::remove`的方法来将元素从vector移出。4.3对这部分有详细解释。

</template>
<template #quiz>
<IsCompileText />

```rust
fn main() {
    let v = vec![String::from("Hello ")];
    let mut s = v[0];
    s.push_str("world");
    println!("{s}");
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::

## 安全地使用迭代器

我们会在第13章讨论迭代器工作原理的更多细节。现在，重要的是明白迭代器包含了对vector数据的指针。我们可以使用图例来查看迭代器的工作，下面是的程序是使用了`Vec::iter`和`Iterator::next`：

<Wrapper>
<template #code>

```rust
let mut v: Vec<i32>         = vec![1, 2];
let mut iter: Iter<'_, i32> = v.iter(); /*[!flag L1]*/
let n1: &i32                = iter.next().unwrap(); /*[!flag L2]*/
let n2: &i32                = iter.next().unwrap(); /*[!flag L3]*/
let end: Option<&i32>       = iter.next(); /*[!flag L4]*/
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
        body: [
          { key: 'v', point2: 0 },
          { key: 'iter', point2: 0 }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1', '2'] }
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
          { key: 'v', point2: 0 },
          { key: 'iter', point2: '0.2' },
          { key: 'n1', point2: 0 }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1', '2'] }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'v', point2: 0 },
          { key: 'iter', point2: 'null' },
          { key: 'n1', point2: 0 },
          { key: 'n2', point2: '0.2' }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1', '2'] }
    ]
  }"
/>

<MemoryGraph
  title="L4"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'v', point2: 0 },
          { key: 'iter', point2: 'null' },
          { key: 'n1', point2: 0 },
          { key: 'n2', point2: '0.2' },
          { key: 'end', value: 'None' }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1', '2'] }
    ]
  }"
/>
</div>
</template>
</Wrapper>

可以看到迭代器`iter`是一个在vector的每个元素上移动的指针。`next`方法在移动迭代器，返回对前一个元素的引用，可能是`Some`（也就是我们unwrap的）或者是迭代器结尾的`None`。

这些细节和vector的安全使用有关。比如，如果我们希望原地复制vector的内容，比如`[1, 2]`变为`[1, 2, 1, 2]`。可能的实现如下：

<ShikiCode
  :inserter="({ line, after }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'v', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*v', operation: 'g', P: ['p', 'p', 'e'] }
          ]
        })
        case 1: return lr({
          perms: [
            { var: '*v', operation: 'b', P: [null, 's', 'e'], collapse: true },
            { var: 'v', operation: 'b', P: [null, 'e', 's'] },
            { var: 'n_ref', operation: 'c', P: ['p', 'e', 'p'] },
            { var: '*n_ref', operation: 'c', P: ['p', 'e', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `fn dup_in_place(v: &mut Vec<i32>) {
    for n_ref in v/*[!perm R.{"collapse":true}]*/.iter() {
        v/*[!perm_double R.W.{"letterBProps":{"missing":true}}]*/.push(/*[!perm R]*/*n_ref);
    }
}` })'
/>

注意`v.iter()`移除了`*v`的<W />权限，因此`v.push(..)`操作缺少了期望的<W />权限。Rust编译器会抛出如下报错：

```
error[E0502]: cannot borrow `*v` as mutable because it is also borrowed as immutable
 --> test.rs:3:9
  |
2 |     for n_ref in v.iter() {
  |                  --------
  |                  |
  |                  immutable borrow occurs here
  |                  immutable borrow later used here
3 |         v.push(*n_ref);
  |         ^^^^^^^^^^^^^^ mutable borrow occurs here
```

正如我们在第四章讨论的一样，这种错误的背后隐藏的安全隐患是读取被释放了的内存。一旦`v.push(1)`发生，vector会重新分配内存，迭代器的指针就会无效化。所以为了安全的使用迭代器，Rust不允许在迭代中对vector进行新增或移除元素。

还有一种不使用指针对vector进行迭代的方式，就是使用范围，就像我们在4.4的字符串切片中提到的一样。比如，`0 .. v.len()`就是一个迭代了vector所有下标的范围：

<Wrapper>
<template #code>

```rust
let mut v = Vec<i32>       = vec![1, 2];
let mut iter: Range<usize> = 0 .. v.len(); /*[!flag L1]*/
let i1: usize              = iter.next().unwrap();
let n1: &i32               = &v[i1]; /*[!flag L2]*/
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
        body: [
          { key: 'v', point2: 0 },
          {
            key: 'iter',
            forceShowDetail: true,
            detail: {
              title: 'Range',
              body: [
                { name: 'start', value: 0 },
                { name: 'end', value: 2 }
              ]
            }
          }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1', '2'] }
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
          { key: 'v', point2: 0 },
          {
            key: 'iter',
            forceShowDetail: true,
            detail: {
              title: 'Range',
              body: [
                { name: 'start', value: 0 },
                { name: 'end', value: 2 }
              ]
            }
          },
          { key: 'i1', value: 0 },
          { key: 'n1', point2: 0 }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['1', '2'] }
    ]
  }"
/>
</div>
</template>
</Wrapper>

## 借助枚举来存储多种类型

vector只能存储单一类型的数据。这样可能不太方便；绝对有场景需要存储不同类型的数据。幸运的是，枚举的变体被定义在同一个枚举类型下，所以当我们需要一个类型来指代不同类型的元素时，我们可以使用枚举来定义！

比如，如果我们想获取一个表格的数据，表格的列包含了整数、浮点数和字符串。这时我们就可以定义一个枚举类型，然后用变体存储着三种类型，这些变体都会被看做是同一种类型：即枚举类型。然后我们就可以创建存储它们的vector了:

```rust
    enum SpreadsheetCell {
        Int(i32),
        Float(f64),
        Text(String),
    }

    let row = vec![
        SpreadsheetCell::Int(3),
        SpreadsheetCell::Text(String::from("blue")),
        SpreadsheetCell::Float(10.12),
    ];
```

Rust需要在编译时了解vector存储的类型来确定每个元素需要分配的堆内存大小。我们必须明确当前vector要存储的数据类型。如果Rust允许vector存储任意的类型，会存在某个或某几个类型和其他类型的行为不兼容的情况。使用枚举和`match`意味着Rust会在编译时就保证每一种可能性都被处理了，这部分在第6章讨论过。

如果你不知道程序会在运行时存储的详细类型，枚举类型也帮不了你。这种情况下，可以使用特性对象（trait object），这部分我们会在第17章讨论。

现在我们已经讨论了常见的vector使用了，请阅读标准库的API文档来查看其他`Vec<T>`预定义的实用函数。比如，和`push`相对应的，`pop`方法会移除并返回最后一个元素。

## vector的释放会释放其所有元素

就像其他的`struct`，vector会在离开作用域时释放：

```rust
    {
        let v = vec![1, 2, 3, 4];

        // 一些v的操作
    } // <- v离开作用域，释放
```
当vector被释放时，它所包含的内容也都被释放了，即它持有的整数都被清理了。借用检查器会确保任何对vector的引用都只在vector有效时使用。

让我们进入下一个集合类型：`String`！

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：尽管程序对`v`创建了可变借用，但也只是允许`i`在for循环体内被修改。因此调用`v.push`是一个所有权错误。

</template>
<template #quiz>
<IsCompileText />

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    for i in &mut v {
        v.push(*i);
    }
    println!("{} {} {}", v[3], v[4], v[5]);
}
```

<IsCompile :answer="{ compiled: true, result: '5 5' }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：`i`的类型是`&mut i32`，也就意味着它是对`v`内数字的指针。所以如果我们将`i`插入了`v2`，那么`v2`的内部就存储了`v`的指针。因此对`v2[0]`的修改也会影响`v[0]`。

</template>
<template #quiz>
<IsCompileText />

```rust
fn main() {
    let mut v: Vec<i32> = vec![1, 2, 3];
    let mut v2: Vec<&mut i32> = Vec::new();
    for i in &mut v {
        v2.push(i);
    }
    *v2[0] = 5;

    let a = *v2[0];
    let b = v[0];
    println!("{a} {b}");
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::
