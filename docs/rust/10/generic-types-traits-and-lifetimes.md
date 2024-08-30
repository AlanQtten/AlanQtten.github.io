# 泛型，特性和生命周期

对于重复的概念，每一种语言都设计了高效复用的工具。Rust的工具之一就是泛型：它是对替代具体类型和其他属性的抽象。我们可以通过泛型的行为和它与其他泛型的关联来表达，无需了解其编译、运行时填入的具体类型。

函数可以将参数置为泛型，而不是具体的类型（比如`i32`或者`String`），就像函数接受未知的值、并对它们进行类似操作一样。实际上，我们已经在第6章使用了`Option<T>`，在第8章使用了`Vec<T>`和`HashMap<K, V>`，在第9章使用了`Result<T, E>`。这一章里，我们会探索如何在自定义类型、函数和方法中使用泛型！

首先，我们来回顾我们是如何通过拆分函数减少重复代码的。然后我们会用类似的思路为两个参数不同、行为相同的函数创建一个泛型函数。我们也会介绍如何在结构体和枚举上使用泛型。

然后你可以学习到如何通过*特性(traits)*来定义泛型行为。你可以将trait与泛型类型结合起来，因为泛型类型只接受具有特定行为的类型，而不是任何类型。

最后，我们会讨论*生命周期*：一种泛型，提供编译器关于引用之间关系的信息。生命周期让我们有了给编译器提供足够信息的机会，编译器可以通过这些信息确定引用在复杂情况下的存活时长。

## 通过拆分函数减少重复代码

泛型允许我们使用一个占位符来替代具体的类型，它能表示多个类型，移除重复的代码。在讨论泛型语法前，我们先看看不涉及泛型的移除重复代码，那就是提取函数，使用占位符（参数）替代具体的值。然后我们会用同样的方式提取泛型函数！要识别哪些代码可以被提取，你需要先找到使用了泛型的重复代码。

我们先看一个程序，它用于查找列表中的最大数：

```rust
fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let mut largest = &number_list[0];

    for number in &number_list {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);
}
```

我们在变量`number_list`里存储了整数列表，然后给`largest`赋值了列表第一个元素的引用。然后我们对列表进行了迭代遍历，如果当前数字比`largest`大，就把它的引用赋值给`largest`。然而，如果当前元素小于等于目前为止的最大值，变量就不会改变，而迭代继续。在迭代结束后，`largest`就是最大数字的引用，这段代码里也就是100。

现在我们需要对两个列表分别查找最大数。要实现这点，我们可以选择重复上面的代码，用通用的逻辑书写两次：

```rust
fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let mut largest = &number_list[0];

    for number in &number_list {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);

    let number_list = vec![102, 34, 6000, 89, 54, 2, 43, 8];

    let mut largest = &number_list[0];

    for number in &number_list {
        if number > largest {
            largest = number;
        }
    }

    println!("The largest number is {}", largest);
}
```

尽管这样的代码是可行的，但是重复的代码是很单调、易错的。在修改代码时，我们还需要在多个地方进行修改。

为了减少重复，我们创建了一个抽象，它定义了一个对任何整数列表的操作。这样的代码更加清晰，还允许我们从一个抽象的角度表达了从列表中找到最大值的操作。

下面的代码里，我们提取了一个寻找最大数的函数，命名为`largest`。然后我们调用了这个函数两次。未来我们还可以将它用在任何`i32`列表上：

```rust
fn largest(list: &[i32]) -> &i32 {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let number_list = vec![102, 34, 6000, 89, 54, 2, 43, 8];

    let result = largest(&number_list);
    println!("The largest number is {}", result);
}
```

`largest`函数的参数名为`list`，它代表我们传入这个函数的任何`i32`的列表值。作为结果，当我们调用函数时，传入的特定值会进行代码进行运行。

总的来说，我们采取了以下步骤来调整代码：

1. 找到重复的代码。
2. 提取重复部分的代码，确定输出和返回值，书写函数签名。
3. 更新原重复代码为函数调用。

接下来，我们也会遵循这些步骤来使用泛型减少重复的代码。就像函数允许在一个抽象的实例`list`上操作一样，泛型允许你在抽象的类型上操作。

假设我们有两个函数：一个查找`i32`列表中的最大值，一个查找`char`列表的最大值。我们该怎么减少重复代码呢？让我们来一起看看！
