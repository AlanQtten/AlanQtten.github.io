<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  IsCompileText,
  IsCompile
} from "../../components/quiz"

</script>

# 使用迭代器处理一系列元素

迭代器是一种允许你对一系列元素进行某些任务的模式。一个迭代器负责处理每个元素的迭代的逻辑，并决定任务序列何时完成。如果你使用了迭代器，你就不需要自行重新实现这些逻辑了。

Rust中的迭代器是*惰性的*，也就是说它们你调用之前不会有任何的影响。比如，下面的代码调用了定义在`Vec<T>`上的`iter`方法，创建了对vector`v1`内的元素的迭代器。这份代码本身是没有做任何事的。

```rust
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();
```

迭代器存储在了`v1_iter`变量内。一旦我们创建了一个迭代器，我们可以用各种办法使用它。在第三章的代码中，我们使用`for`循环来遍历了一个数组内的所有元素，对每个元素执行了一些操作。在底层，这样的操作会隐式地创建并消费一个迭代器，但是我们当时并没有深入讨论，现在可以来详细看看了。

下面的例子里，我们将迭代器的创建和使用分开了。当`for`循环使用迭代器`v1_iter`进行调用时，迭代器的每一个元素都会被循环的某一个迭代所使用，即打印各个值：

```rust
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();

    for val in v1_iter {
        println!("Got: {val}");
    }
```

在那些标准库不提供迭代器的语言中，实现相同功能时，通常会声明一个值为0的变量，用该变量索引vector中的值，并在循环中递增变量，直到其达到vector中的上限。

而迭代器会帮你处理这些处理，省去那些重复性极高的杂乱代码。迭代器可以让你灵活地对不同系列元素使用通用的逻辑，而不局限于数据结构，比如vector。我们来看看迭代器是怎么做到的。

## `Iterator`trait和`next`方法

所有的迭代器都实现了标准库定义的`Iterator`trait。其定义大概如下：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 这里省略了方法的默认实现
}
```

注意这里的定义使用了新的语法：`type Item`和`Self::Item`，它们是这个trait的*关联类型*。我们会在第19章讨论这部分内容。现在，你只需要知道这段代码表示要实现了`Iterator`trait，你需要定义一个`Item`类型，且`Item`类型需要作为`next`方法的返回值。换句话说，`Item`类型会作为迭代器返回的类型。

`Iterator`trait只要求实现一个方法：`next`，它会返回迭代器的一个元素，包装在`Some`中，当迭代器结束时，返回`None`。

我们可以直接调用迭代器的`next`方法；下面的代码展示了迭代器调用`next`的结果变化：

```rust
    #[test]
    fn iterator_demonstration() {
        let v1 = vec![1, 2, 3];

        let mut v1_iter = v1.iter();

        assert_eq!(v1_iter.next(), Some(&1));
        assert_eq!(v1_iter.next(), Some(&2));
        assert_eq!(v1_iter.next(), Some(&3));
        assert_eq!(v1_iter.next(), None);
    }
```

注意我们需要将`v1_iter`声明为可变的：调用迭代器的`next`方法会改变内部的状态，迭代器需要了解它所处的位置。换句话说，这段代码*消费了*，或者说使用了迭代器。每一次对`next`的调用都会消耗一个迭代器的元素。如果我们使用的是`for`循环，那么我们无需将迭代器声明为可变的，因为`for`循环会获取`v1_iter`的所有权，隐式地将其变为可变的。

还要注意的一点是，我们从`next`方法中获取到的是对vector内部元素的不可变引用。`iter`方法创建的就是一个不可变引用的迭代器。如果我们想创建一个获取`v1`所有权并返回其拥有值的迭代器，我们可以用`into_iter`替代`iter`。类似的，如果我们想获取的事可变引用的迭代器，我们可以用`iter_mut`替代`iter`。

## 消耗迭代器的方法

标准库为`Iterator`trait的各种方法提供了默认实现；你可以在标准库的文档中查看它们。有部分方法会在内部调用`next`方法，这也是为什么实现`Iterator`trait时需要实现`next`方法。

调用`next`的方法被叫做*消费适配器（consuming adaptors）*，因为调用它们会消耗迭代器。比如`sum`方法，它会获取迭代器的所有权，通过调用`next`方法逐个访问元素，也就是消耗迭代器。随着它的迭代，它会将各个元素加入到一个总和中，迭代完成时，它会将这个值返回。下面的代码就是一个使用`sum`进行测试的方法：

```rust
    #[test]
    fn iterator_sum() {
        let v1 = vec![1, 2, 3];

        let v1_iter = v1.iter();

        let total: i32 = v1_iter.sum();

        assert_eq!(total, 6);
    }
```

在调用`sum`后，我们就不能再使用`v1_iter`了，因为`sum`获取了迭代器的所有权。

## 产生迭代器的方法

`Iterator`上也定义了不会消耗迭代器的方法，它们被称为*迭代适配器（iterator adaptors）*。它们会返回一个新的迭代器，角度和原始迭代器有所差异。

下面的代码展示了一个迭代适配器的方法`map`，它接收一个闭包，这个闭包会在每一个元素被迭代时调用。`map`方法会返回一个新的迭代器，它包含的是被调整过的元素。这里的闭包会在每次迭代时对原始元素加1并返回：

```rust
    let v1: Vec<i32> = vec![1, 2, 3];

    v1.iter().map(|x| x + 1);
```

然而，这段代码会抛出一个警告：

```
$ cargo run
   Compiling iterators v0.1.0 (file:///projects/iterators)
warning: unused `Map` that must be used
 --> src/main.rs:4:5
  |
4 |     v1.iter().map(|x| x + 1);
  |     ^^^^^^^^^^^^^^^^^^^^^^^^
  |
  = note: iterators are lazy and do nothing unless consumed
  = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
  |
4 |     let _ = v1.iter().map(|x| x + 1);
  |     +++++++

warning: `iterators` (bin "iterators") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.47s
     Running `target/debug/iterators`
```

由于上面的代码没有做任何事；我们声明的闭包并不会被调用。这里的警告告诉了我们原因：迭代适配器是惰性的，我们需要消费这里的迭代器。

要修复这里的警告并消费迭代器，我们可以使用`collect`方法，我们曾经在第12章对`env::args`使用过这个方法。这个方法会消耗迭代器，并将其所有元素收集到一个集合中。

下面的代码中，我们把调用`map`方法返回的迭代器进行了消费，将它的元素收集到了一个vector中。这个vector最终包含元素会比原始的vector中的元素多1：

```rust
    let v1: Vec<i32> = vec![1, 2, 3];

    let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();

    assert_eq!(v2, vec![2, 3, 4]);
```

由于`map`接收一个闭包，我们可以在其中对元素进行任何操作。这是一个展示在迭代器中使用闭包来自定义行为的绝佳例子。

你可以链式调用迭代适配器来增强一些复杂操作的可读性。但是由于所有的迭代器都是惰性的，你必须调用一个消费适配器方法来获取迭代适配器的结果。

## 使用闭包捕获环境

很多迭代适配器都会接收一个闭包作为参数，通常来说，我们传递给其的闭包都会捕获环境。

比如，我们可以使用接收一个闭包的`filter`方法。这个闭包接收迭代器中的元素作为参数，并返回一个`bool`。如果返回`true`，那么元素会被包含在`filter`提供的新迭代器中。反之则不会。

下面的代码里，我们使用`filter`来捕获环境中的`shoe_size`变量，以此迭代所有的`Shoe`结构体实例。最终会返回特定大小的鞋子。

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter().filter(|s| s.size == shoe_size).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filters_by_size() {
        let shoes = vec![
            Shoe {
                size: 10,
                style: String::from("sneaker"),
            },
            Shoe {
                size: 13,
                style: String::from("sandal"),
            },
            Shoe {
                size: 10,
                style: String::from("boot"),
            },
        ];

        let in_my_size = shoes_in_size(shoes, 10);

        assert_eq!(
            in_my_size,
            vec![
                Shoe {
                    size: 10,
                    style: String::from("sneaker"),
                },
                Shoe {
                    size: 10,
                    style: String::from("boot"),
                },
            ]
        );
    }
}
```

`shoes_in_size`函数接收一个存储了鞋子的vector的所有权，以及一个鞋子的号码作为参数。它返回一个只包含这个号码的鞋子的vector。

在`shoes_in_size`的函数体内，我们调用了`into_iter`来创建一个迭代器，它会获取vector的所有权。然后我们会调用`filter`方法来将这个迭代器适配到一个新的迭代器里，新的迭代器只包含闭包返回`true`情况对应的元素。

闭包会捕获环境中的`shoe_size`参数，将它和各个元素（鞋子）的大小进行比较，最终只保留特定大小的鞋子。最终，调用`collect`来收集所有适配迭代器返回的元素到一个新的vector中，作为整个函数的返回值。

在最终的测试中，我们调用了`shoes_in_size`，获得了和我们传入大小匹配的鞋子。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：惰性通常理解为“不会在请求前工作”，而迭代器直到`Iterator::next`被调用前不会进行任何计算。

</template>
<template #quiz>

下面哪一项是迭代器被称为惰性的原因？

<Radio>
<Option label="除非你调用了从迭代器中提炼元素的方法，否则迭代器不会产生任何影响" answer />
<Option label="一个迭代器只会对给定数量的元素进行迭代" />
<Option label="一个迭代器会在迭代中获取系列元素的所有权" />
<Option label="一个迭代器会在迭代中创建元素的备份" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：for循环是`while let`的语法糖，而它自己是`loop`和`break`的语法糖。

</template>
<template #quiz>

下面的代码语义相同

片段1：

```rust
while let Some(x) = iter.next() {
    f(x);
}
```

片段2：

```rust
for x in iter {
    f(x);
}
```

<Radio>
<Option label="是" answer />
<Option label="否" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：迭代器的顺序很关键————一个`filter`+一个`map`和一个`map`+一个`filter`是不同的。

你可能会好奇为什么第一个`filter`使用了`*x`而第二个`filter`没有。这是因为`v.iter()`返回的是一个`<Item = &i32>`类型的迭代器。而`.filter()`接收一个`<Item = T>`作为入参，并将`&T`传给其谓词。因此第三行才需要标注`x: &&i32`。Rust的标准库为`&i32`实现了操作符`%`，但没有为`&&i32`实现。所以我们需要对`x`进行一次解引用，即`*x % 2`。

对于第四行代码，`.map()`操作接收一个`<Item = T>`的迭代器作为入参，`T`会传递给它的闭包。因此`map`中的闭包接收`&i32`作为入参。标准库已经为`&i32`实现了乘法操作`*`，所以这里不需要解引用，直接`x * 2`即可。`x * 2`操作创建了一个`i32`类型的值，所以`map`得返回值是`<Item = i32>`的迭代器。`filter`接收了`x: &i32`，它进行`x % 2`时也是不需要解引用的。这样你应该理解了！

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let v = vec![1, 2, 3, 4];
    let a: Vec<_> = v.iter().filter(|x: &&i32| *x % 2 == 0).map(|x: &i32| x * 2).collect();
    let b: Vec<_> = v.iter().map(|x: &i32| x * 2).filter(|x: &i32| x % 2 == 0).collect();
    println!("{} {}", a[0], b[0]);
}
```

<IsCompile :answer="{ compiled: true, result: '4 2' }" />

</template>
</Quiz>
</QuizProvider>
:::
