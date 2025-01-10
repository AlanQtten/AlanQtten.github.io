<script setup>
import { Wrapper, MemoryGraph } from "../../components/memory-graph";
import ShikiCode from "../../components/code/ShikiCode.vue"
import { O } from "../../components/letter"

import {
  QuizProvider,
  Quiz,
  Radio,
  Option,
  IsCompileText,
  IsCompile
} from "../../components/quiz"

import { lr } from "../../utils/renderer"
</script>

# 闭包：捕获环境的匿名函数

Rust中的闭包是一种你可以存储到变量中或传递给其他函数的匿名函数。你可以在一个地方创建闭包，然后在其他任何地方、不同的上下文中执行它。和函数不同的是，闭包可以捕获它们定义时所处环境中的值。我们会演示闭包的特性如何提高代码重用和定制行为。

## 使用闭包来捕获环境

我们先来看看闭包是如何捕获它们定义环境中的值的。下面的场景是：时不时的，T恤公司会给邮件列表中的某个人赠送独家限量版T恤，作为促销活动的一部分。列表中的人可以选择性地将它们最喜欢的颜色加入到个人档案里。如果用户指定了颜色，他们会获得对应颜色的T恤；否则，他们会获得当前存量最多颜色的T恤。

有很多方式来实现这个功能。比如，我们可以声明一个枚举`ShirtColor`，它有变体`Red`和`Blue`（为了简单，这里我们假设只有两种颜色）。我们使用一个`Inventory`结构体来表示公司的T恤库存，它有类型为`Vec<ShirtColor>`的字段`shirts`，代表当前库存的T恤。最后，我们给`Inventory`定义方法`giveaway`，它获取用户选择的T恤颜色，然后返回最终用户会获得的T恤颜色。

```rust
#[derive(Debug, PartialEq, Copy, Clone)]
enum ShirtColor {
    Red,
    Blue,
}

struct Inventory {
    shirts: Vec<ShirtColor>,
}

impl Inventory {
    fn giveaway(&self, user_preference: Option<ShirtColor>) -> ShirtColor {
        user_preference.unwrap_or_else(|| self.most_stocked())
    }

    fn most_stocked(&self) -> ShirtColor {
        let mut num_red = 0;
        let mut num_blue = 0;

        for color in &self.shirts {
            match color {
                ShirtColor::Ref => num_red += 1,
                ShirtColor::Blue => num_blue += 1,
            }
        }
        if num_red > num_blue {
            ShirtColor::Ref
        } else {
            ShirtColor::Blue
        }
    }
}

fn main() {
    let store = Inventory {
        shirts: vec![ShirtColor::Blue, ShirtColor::Red, ShirtColor::Blue],
    };

    let user_pref1 = Some(ShirtColor::Red);
    let giveaway1 = store.giveaway(user_pref1);
    println!(
        "The user with preference {:?} gets {:?}",
        user_pref1, giveaway1
    );

    let user_pref2 = None;
    let giveaway2 = store.giveaway(user_pref2);
    println!(
        "The user with preference {:?} gets {:?}",
        user_pref2, giveaway2
    );
}
```

`main`函数中定义的`store`有两件蓝色限量T恤和一件红色限量T恤用来做促销。我们调用了`giveaway`方法，第一次传入了一个红色的偏好，第二次传入了`None`，表示用户没有偏好。

这样的代码可以通过很多办法实现，这里为了关注闭包，我们在`giveaway`函数中刻意使用了它，其他地方都是已经学习过的概念。在`giveaway`函数中，我们把用户偏好设置为`Option<ShirtColor>`，然后调用`user_preference`的`unwrap_or_else`方法。`Option<T>`的`unwrap_or_else`方法是标准库提供的。他会接收一个参数：一个没有任何参数的闭包，返回类型为`T`（和`Option<T>`存储在`Some`变体中的类型一致，本例中为`ShirtColor`）。如果`Option<T>`是`Some`变体，那么`unwrap_or_else`会返回`Some`中的值。如果`Option<T>`是`None`变体，那么`unwrap_or_else`会调用闭包，用闭包函数返回的值作为返回值。

我们声明了闭包表达式`|| self.most_stocked()`作为`unwrap_or_else`的参数。这是一个自身不接收任何参数的闭包（如果闭包有参数，那么他们会在两个竖线中出现）。闭包体调用了`self.most_stocked()`。我们在此处定义了闭包，而`unwrap_or_else`的实现会在必要时调用它。

运行代码，输出如下：

```
$ cargo run
   Compiling shirt-company v0.1.0 (file:///projects/shirt-company)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/shirt-company`
The user with preference Some(Red) gets Red
The user with preference None gets Blue
```

一个有趣的角度是，这里我们传递了一个用当前`Inventory`实例调用`self.most_stocked()`的闭包。标准库并不需要了解任何关于`Inventory`和`ShirtColor`类型的信息，也不需要知道我们用它们处理的逻辑。闭包捕获了一个`self``Inventory`实例不变的引用，然后把它传给了我们定义在`unwrap_or_else`调用中的代码。换句话说，函数这种情况下是无法捕获其环境的。

## 闭包的推断和注解

函数和闭包还有很多不同。闭包通常不会要求你对参数或返回值进行类型标注，像`fn`一样。函数的类型声明是必须的，因为它们是暴露给使用者的接口。严格地定义这些接口非常重要，她们可以让大家都了解到函数的入参和出参。而闭包则不同，它们通常不会用在对外暴露的接口中：它们被存储在变量中，并且在使用时不需要命名或暴露给库的用户。

闭包通常很短，且只和比较狭隘、特定的上下文有关，而不是抽象的场景。在这些限制下，编译器可以推断出其参数和返回值的类型，就像它推断大部分变量的类型一样（在一些很少见的情况下，闭包也是需要注解的）。

随变量使用时，如果我们想增加可读性，我们可以添加类型声明，代价是代码会变得有些啰嗦。闭包的类型定义如下。在这个例子里，我们定义了一个闭包，将它存储在了一个变量里，而不是直接定义在参数中：

```rust
    let expensive_closure = |num: u32| -> u32 {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    }
```

添加了类型注解后，闭包的语法看起来和函数的语法很像。这里我们定义了一个函数，它会将参数加1然后返回，为了方便大家区分，在其后面我们定义了有着同样行为的闭包。我们增加了一些空格来使部分代码对齐。这说明了闭包语法与函数语法的相似之处，区别在于闭包使用管道符号，并且可以省略一些语法：

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = (x: u32) -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

第一行展示了一个函数定义，第二行是一个完整的闭包定义。在第三行，我们移除了闭包定义中的类型注解。第四行，我们移除了大括号，在闭包体仅有一个表达式时，大括号可以省略。这些都是有效的定义，它们的行为也是相同的。`add_one_v3`和`add_one_v4`需要被调用，这样编译器才能推导它们的类型。这种情况和`let v = Vec::new();`需要类型注解或某种类型的值被插入`Vec`来让Rust推断的情况很相似。

对于闭包的定义，编译器会为其各个参数和返回值推导出一个准确的类型。比如，下面代码中的闭包仅仅返回了其参数。这个闭包只是为了阐述概念定义的，实际上并没有什么用处。请注意我们没有给这个闭包添加任何的类型定义。因此，我们可以使用任何类型调用这个闭包，我们第一次传入了`String`类型。如果我们再次使用整数调用`example_closure`，编译器就会报错：

```rust
    let example_closure = |x| x;

    let s = example_closure(String::from("hello"));
    let n = example_closure(5);
```

编译器报错如下：

```
$ cargo run
   Compiling closure-example v0.1.0 (file:///projects/closure-example)
error[E0308]: mismatched types
 --> src/main.rs:5:29
  |
5 |     let n = example_closure(5);
  |             --------------- ^- help: try using a conversion method: `.to_string()`
  |             |               |
  |             |               expected `String`, found integer
  |             arguments to this function are incorrect
  |
note: expected because the closure was earlier called with an argument of type `String`
 --> src/main.rs:4:29
  |
4 |     let s = example_closure(String::from("hello"));
  |             --------------- ^^^^^^^^^^^^^^^^^^^^^ expected because this argument is of type `String`
  |             |
  |             in this closure call
note: closure parameter defined here
 --> src/main.rs:2:28
  |
2 |     let example_closure = |x| x;
  |                            ^

For more information about this error, try `rustc --explain E0308`.
error: could not compile `closure-example` (bin "closure-example") due to 1 previous error
```

由于我们第一次使用了`String`类型的值来调用`example_closure`，编译器推断这个闭包的参数`x`和其返回值的类型均为`String`。这些类型被锁定在了`example_closure`的定义中，如果我们使用其他类型来调用同一个闭包，编译器就会报错。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：理论上，Rust是可以为顶层函数提供类型推断的。类似Haskell和OCaml这样的函数式编程语言也提供了类似的功能。然而，Rust的设计者选择了要求顶层函数类型注解的设计，这样可以推动更加清晰的接口设计：一个函数永远有最清晰的类型。

</template>
<template #quiz>

以下哪一项是Rust可以推断闭包的参数/返回值类型，而无法推断顶层函数的参数/返回值类型的最佳理由

<Radio>
<Option label="任何赋值给变量的内容都可以被推断，而顶层函数不能被赋值给变量" />
<Option label="由于停机问题，Rust在数学上无法推断顶层函数的类型。" />
<Option label="为了向下兼容老版本的Rust" />
<Option label="顶层函数可能作为库对外接口的一部分，而闭包无法被直接暴露" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：马桶闭包和`std::mem::drop`类似，一个将传入参数销毁的函数。

</template>
<template #quiz>

Rust允许在闭包参数中使用模式匹配，包括下划线的使用，比如，你可以书写如下带代码：

```rust
let f = |_| (); // 也被叫做 “马桶闭包”
let s = String::from("Hello");
f(s);
```

下面哪一项对`f`和`s`的关系描述的最准确？

<Radio>
<Option label="f对s没有影响" />
<Option label="f会导致s被立刻销毁" />
<Option label="f读取了s，并丢弃了结果" />
<Option label="f捕获了当前环境的s" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::

## 捕获引用还是移动所有权

闭包可以通过三种方式捕获其环境中的值，也对应着函数参数的三种类型：不可变的借用，可变的借用，和获取所有权。闭包会根据其函数体内如何使用这些值来决定使用哪种方式捕获。

下面的代码中，我们定义了一个闭包，他会捕获一个对名为`list`的vector的不可变引用，因为它需要不可变引用来打印值：

```rust
fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let only_borrows = || println!("From closure: {list:?}");

    println!("Before calling closure: {list:?}");
    only_borrows();
    println!("After calling closure: {list:?}");
}
```

这个例子还表明，变量可以绑定到一个闭包定义，之后我们可以像调用函数一样，通过变量名加括号来调用闭包。

由于我们可以在同一时间创建多个`list`的不可变引用，`list`在闭包定义前，在闭包定义后但未调用前，在闭包调用后都是可以访问的。这段代码编译运行结果如下：

```
$ cargo run
     Locking 1 package to latest compatible version
      Adding closure-example v0.1.0 (/Users/chris/dev/rust-lang/book/tmp/listings/ch13-functional-features/listing-13-04)
   Compiling closure-example v0.1.0 (file:///projects/closure-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/closure-example`
Before defining closure: [1, 2, 3]
Before calling closure: [1, 2, 3]
From closure: [1, 2, 3]
After calling closure: [1, 2, 3]
```

在下面的代码中，我们修改了闭包的结构，它会给`list`中添加一个元素。这次闭包会捕获一个对`list`的可变引用：

```rust
fn main() {
    let mut list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let mut borrows_mutably = || list.push(7);

    borrow_mutably();
    println!("After calling closure: {list:?}");
}
```

这段代码编译运行结果如下：

```
$ cargo run
     Locking 1 package to latest compatible version
      Adding closure-example v0.1.0 (/Users/chris/dev/rust-lang/book/tmp/listings/ch13-functional-features/listing-13-05)
   Compiling closure-example v0.1.0 (file:///projects/closure-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/closure-example`
Before defining closure: [1, 2, 3]
After calling closure: [1, 2, 3, 7]
```

注意此时在`borrows_mutably`闭包的定义和调用之间没有`println!`了：当`borrows_mutably`被定义后，它捕获了`list`的可变引用。而我们仅使用了这个闭包一次，因此在闭包调用后，这个可变借用就结束了。在闭包的定义和使用之间，需要不可变借用的打印是无法执行的，因为可变借用和不可变借用不能同时存在。你可以试试添加`println!`，看看错误信息是什么。

如果你希望强制闭包获取值的所有权（就算它可能并不需要），你可以在参数列表前使用`move`关键字。

这个技巧在将闭包传递给一个新的线程时很有用，这样数据就被新的线程所拥有了。我们会讨论第16章讨论并发性时讨论线程和线程的应用，现在，我们通过创建一个新线程简单地探索一下`move`关键字的使用。下面的代码展示了一个在新线程而不是主线程中打印vector的方式：

```rust
use std::thread;

fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    thread::spawn(move || println!("From closure: {list:?}"))
        .join()
        .unwrap();
}
```

我们创建了一个新线程，给它传递了一个闭包。这个闭包打印了`list`。在之前的例子中，闭包仅仅只是捕获了`list`的不可变引用，因为打印它只需要这个权限。本例中，尽管闭包体仍然只需要不可变引用，我们在闭包开始时添加了`move`关键字来表面`list`应该被移动到闭包内。新的线程可能会在其余的主线程执行结束前结束，也主线程会先结束。如果主线程维护着`list`的所有权，在其结束时候销毁了`list`，那么子线程中的不可变引用就无效了。因此，编译器要求`list`被移动到闭包内来确保其引用的有效性。你可以尝试移除`move`关键字，然后在闭包定义后在主线程中使用`list`，看看你会收到怎样的错误信息。

## 将捕获的值移出闭包和`Fn`Traits

一旦一个闭包从其定义的环境中捕获了一个引用或一个值的所有权（或者说，如果任何东西被移*入*了闭包），那么闭包内的代码就会决定闭包执行时引用或值会发生什么（从而影响任何东西移*出*闭包）。一个闭包体可以进行任何以下操作：将捕获的值移出闭包，修改捕获的值，既不移动也不修改值，或者不从环境中捕获任何内容。

闭包从环境中捕获和处理值的情况影响了它们所实现的traits，而这些traits是函数和结构体可以指明它们接收何种闭包的方式。闭包会根据闭包体内对值的处理自动实现一、二、或三种`Fn`traits，按需要进行叠加：

1. `FnOnce`适用于可以被调用一次的闭包。所有的闭包都至少实现了这个trait，因为所有的闭包都是可以被调用的。如果一个闭包将其捕获的值移出了闭包体，那么它应当只实现了`FnOnce`，而没有任何其他`Fn`traits，因为它只能被调用一次。
2. `FnMut`适用于不会将捕获值移出闭包体的情况，因为它们可能会修改捕获的值。这类闭包可以被调用多次。
3. `Fn`适用于既没有将捕获值移除其闭包体、也没有修改捕获值的闭包，也适用于没有从环境中捕获任何内容的闭包。这类闭包可以被执行多次，因为它们对环境没有任何影响。在并发调用闭包的情况下，这一点非常重要。

让我们来看看定义在`Option<T>`上的方法`unwrap_or_else`方法：

```rust
impl<T> Option<T> {
    pub fn unwrap_or_else<F>(self, f: F) -> T
    where
        F: FnOnce() -> T
    {
        match self {
            Some(x) => x,
            None => f(),
        }
    }
}
```

回顾之前学过的知识我们可以看出，`T`是一个泛型类型，它代表了`Option`的`Some`变体存储的值类型。`T`也是`unwrap_or_else`的返回值类型：比如，如果你在一个`Option<String>`上调用`unwrap_or_else`，那么你会获得一个`String`。

接着，`unwrap_or_else`函数又定义了一个额外的泛型类型参数`F`。`F`表示参数`f`的类型，也就是我们给`unwrap_or_else`传递的闭包。

这里我们指明了trait边界，即`F`需要满足`FnOnce() -> T`，也就是说，`F`必须可以被调用一次，且不接收任何参数，最终返回`T`。trait边界`FnOnce`约束了`unwrap_or_else`最多只会调用`f`一次。在`unwrap_or_else`的函数体内，我们可以看到如果`Option`为`Some`，那么`f`不会被调用。如果`Option`是`None`，那么`f`会被调用一次。由于所有的闭包都实现了`FnOnce`，因此`unwrap_or_else`可以接收三种闭包的任意一种，它的自由度很大。

> [!NOTE]
> 函数可以实现三种`Fn`traits。如果我们希望进行的操作并不需要对环境中的内容进行捕获，那么我们可以使用函数的名字，而不是实现了任意一种`Fn`trait的闭包。比如，对一个`Option<Vec<T>>`值，我们可以调用`unwrap_or_else(Vec::new)`来获取一个全新的空vector（如果值为`None`）。

现在我们来看看标准库的另一个方法，`sort_by_key`，它定义在切片上，可以看到它和`unwrap_or_else`不同，`sort_by_key`使用了`FnMut`而不是`FnOnce`。这里闭包接收一个参数，它是对当前元素的引用，然后它会返回类型可被排序的类型`K`。如果你想将一个切片按照特定的类型排序，这个方法非常实用。下面的代码里，我们有一系列的`Rectangle`实例，我们可以使用`sort_by_key`来根据它们的`widht`属性进行升序排序：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    list.sort_by_key(|r| r.width);
    println!("{list:#?}");
}
```

代码输出如下：

```
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.41s
     Running `target/debug/rectangles`
[
    Rectangle {
        width: 3,
        height: 5,
    },
    Rectangle {
        width: 7,
        height: 12,
    },
    Rectangle {
        width: 10,
        height: 1,
    },
]
```

`sort_by_key`之所以需要接收一个`FnMut`闭包的原因是，它需要多次调用这个闭包：切片中的每个元素都需要一次。而闭包`|r| r.width`没有捕获、修改、移动任何环境中的内容，所以它满足这个trait的边界。

相比之下，下面的代码展示了一个实现了`FnOnce`trait的闭包，他移动了环境中的值。编译器不会允许我们将这个闭包传给`sort_by_key`使用：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    let mut sort_operations = vec![];
    let value = String::from("closure called");

    list.sort_by_key(|r|, {
        sort_operations.push(value);
        r.width
    });
    println!("{list:#?}");
}
```

上面是一个做作、复杂的办法（当然也是不生效的）来记录`list`排序期间调用`sort_by_key`的次数。这段代码尝试将`value`————一个闭包环境下的`String`————插入到`sort_operations`这个vector中。这个闭包捕获`value`，然后将`value`移出闭包，`value`的所有权转移给`sort_operations`vector。这个闭包是可以被调用一次的；但再次调用它是不成立的，因为`value`已经不在当前环境里了，它无法被再次插入到`sort_operations`中！因此，这个闭包只实现了`FnOnce`。当我们尝试编译这段代码时，我们会看到如下报错，它会告诉我们`value`不能被移出闭包，因为闭包必须实现`FnMut`：

```
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
error[E0507]: cannot move out of `value`, a captured variable in an `FnMut` closure
  --> src/main.rs:18:30
   |
15 |     let value = String::from("closure called");
   |         ----- captured outer variable
16 |
17 |     list.sort_by_key(|r| {
   |                      --- captured by this `FnMut` closure
18 |         sort_operations.push(value);
   |                              ^^^^^ move occurs because `value` has type `String`, which does not implement the `Copy` trait
   |
help: consider cloning the value if the performance cost is acceptable
   |
18 |         sort_operations.push(value.clone());
   |                                   ++++++++

For more information about this error, try `rustc --explain E0507`.
error: could not compile `rectangles` (bin "rectangles") due to 1 previous error
```

这个错误指出了错误所在的行，即闭包体尝试将`value`移出当前环境的操作。要修改这个问题，我们需要修改闭包体，保证其没有任何从环境中移出值的操作。要记录闭包调用的次数，我们可以在环境中创建一个计数器，在闭包体内增加它的值，这样可以更直接。下面的闭包是可以和`sort_by_key`配合使用的，因为它只捕获了`num_sort_operations`计数器的可变引用，因此可以被调用多次：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    let mut num_sort_operations = 0;
    list.sort_by_key(|r| {
        num_sort_operations += 1;
        r.width
    });
    println!("{list:#?}, sorted in {num_sort_operations} operations");
}
```

## 闭包必须为捕获到的生命周期命名

如果你要设计一个函数，它可以接收或返回闭包，那么你需要考虑闭包捕获到的数据的生命周期。比如，下面是一个简单的程序，它应该返回一个闭包，这个闭包会克隆一个字符串：

```rust
fn make_a_cloner(s_ref: &str) -> impl Fn() -> String {
    move || s_ref.to_string()
}
```

然而，这个程序会被编译器拒绝，错误如下：

```
error[E0700]: hidden type for `impl Fn() -> String` captures lifetime that does not appear in bounds
 --> test.rs:2:5
  |
1 | fn make_a_cloner(s_ref: &str) -> impl Fn() -> String {
  |                         ---- hidden type `[closure@test.rs:2:5: 2:12]` captures the anonymous lifetime defined here
2 |     move || s_ref.to_string()
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^
```

这个错误看起来可能会令人很困惑。什么是“hidden type”？为什么它捕获了生命周期？为什么生命周期需要出现在边界中？

要回答这些问题。我们先来看看Rust如果允许`make_a_cloner`编译通过的话会发生什么。我们可以书写下面这样一个不安全的程序：

<Wrapper>
<template #code>

```rust
fn make_a_cloner(s_ref: &str) -> impl Fn() -> String {
    move || {
        s_ref.to_string(); /*[!flag_error L3]*/
    }
}

fn main() {
    let s_own = String::from("hello");
    let cloner = make_a_cloner(&s_own); /*[!flag L1]*/
    drop(s_own); /*[!flag L2]*/
    cloner();
}
```

</template>
<template #graph>

<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 's_own', point2: 0 },
      { key: 'cloner', point2: '0.0-11', detail: {
        title: 'make_a_cloner::{closure#0}',
        body: [
          { name: 's_ref', point2: '0.0-11' },
        ]
      }, forceShowDetail: true },
    ] }],
    heap: [{ id: 0, value: ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'] }]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [{ name: 'main', body: [
      { key: 's_own', point2: 'null', moved: true },
      { key: 'cloner', detail: {
        title: 'make_a_cloner::{closure#0}',
        body: [
          { name: 's_ref', point2: 'null' },
        ]
      }, forceShowDetail: true },
    ] }],
  }"
/>

<MemoryGraph
  title="L3"
  error-message="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 's_own', point2: 'null_error', moved: true },
          { key: 'cloner', detail: {
            title: 'make_a_cloner::{closure#0}',
            body: [
              { name: 's_ref', point2: 'null_error' },
            ]
          }, forceShowDetail: true },
        ]
      },
      {
        name: 'make_a_cloner::{closure#0}',
      }
    ],
  }"
/>
</div>

</template>
</Wrapper>

我们可以跟随指向来看。在调用`make_a_cloner(&s_own)`后，在`L1`我们会获得一个闭包`cloner`。引用`s_ref`在这个环境的闭包内。然而，如果我们允许了`L2`位置的drop`s_own`，那么`cloner`就会被无效化，因为其环境中包含了一个指向失效内存的指针。此时调用`cloner()`就会导致释放后的使用（use-after-free）。

回到我们一开始的错误，问题在于**我们需要告诉Rust，closure返回的`make_a_cloner`需要比`s_ref`存活地更久**。我们可以使用生命周期参数来进行标记：

```rust
//              vvvv         vv                             vvvv
fn make_a_cloner<'a>(s_ref: &'a str) -> impl Fn() -> String + 'a {
    move || s_ref.to_string()
}
```

这些改动表述了：`s_ref`是一个生命周期为`'a`的字符串引用。给返回类型的trait边界添加`+ 'a`表示这个闭包必须比`'a`存活地更久。因此Rust明白了这个函数是安全的。如果我们用不安全的方式使用：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 0: return lr({ perms: [
          { var: 's_own', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
        case 1: return lr({ perms: [
          { var: 's_own', operation: 'b', P: ['', 'e', 's'] },
          { var: 'cloner', operation: 'g', P: ['p', 'e', 'p'] },
        ] })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let s_own = String::from("Hello world");
let cloner = make_a_cloner(&/*[!perm R.{"collapse":true}]*/s_own);
drop(/*[!perm_double R.O.{"letterBProps":{"missing":true}}]*/s_own);
cloner();` })'
/>

Rust识别到了在`make_a_cloner`的使用期间，`s_own`是不能被销毁的。反应在权限上：`s_own`调用`make_a_cloner`后失去了<O />权限。最终，Rust会用如下错误拒绝这个程序：

```rust
error[E0505]: cannot move out of `s_own` because it is borrowed
  --> test.rs:9:6
   |
8  | let cloner = make_a_cloner(&s_own);
   |                            ------ borrow of `s_own` occurs here
9  | drop(s_own);
   |      ^^^^^ move out of `s_own` occurs here
10 | cloner();
   | ------ borrow later used here
```

回到最初那个令人迷惑的错误：闭包的“hidden type”捕获了`s_ref`，其的生命周期是受限的。由于返回类型没有提及生命周期，所以Rust无法判断`make_a_cloner`是否安全。如果我们显式地指明闭包捕获了`s_ref`的生命周期，那么我们的函数就可以正常编译了。

注意，我们可以借用生命周期忽略规则来让函数的类型更加简洁。我们可以移除掉`<'a>`泛型，这样就表明了闭包依赖了*某个*生命周期，比如：

```rust
fn make_a_cloner(s_ref: &str) -> impl Fn() -> String + '_ {
    move || s_ref.to_string()
}
```

总的来说，`Fn`trait在定义或使用闭包的函数或类型时非常重要。下一节，我们会讨论迭代器。很多迭代器的方法都会接收闭包作为参数，所以我们会继续讨论更多闭包的细节。

::: details 小测（4）
<QuizProvider>
<Quiz>
<template #description>

解析：`add_suffix`在定义和运行期间对`s`进行了可变借用，所以`println`（对`s`的读取）是无效的。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut s = String::from("Hello");
    let mut add_suffix = || s.push_str(" world");
    println!("{s}");
    add_suffix();
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：由于`add_suffix`没有捕获`s`，所以在`add_suffix`修改前读取`s`是可以进行的。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut s = String::from("Hello");
    let add_suffix = |s: &mut String| s.push_str(" world");
    println!("{s}");
    add_suffix(&mut s);
}
```

<IsCompile :answer="{ compiled: true, result: 'Hello' }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：`f`会被多次调用，所以`FnOnce`是不合适的。`Fn`和`FnMut`这里都可以，但`FnMut`限制更小，所以这里`FnMut`更合适。

</template>
<template #quiz>

考虑如下API：

```rust
/// 此函数会对vector中的每个元素执行一次函数
fn for_each_mut<T, F: ___(&mut T)>(v: &mut Vec<T>, mut f: F) {
    for x in v.iter_mut() {
        f(x);
    }
}
```

下面哪一个trait填入空白处最合适？

<Radio>
<Option label="Fn" />
<Option label="FnMut" answer />
<Option label="FnOnce" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`pipeline`可以被多次调用，所以`FnOnce`是不合适的。`pipeline`接收了一个对`self`的不可变引用，如果`postprocess`为`FnMut`，那么它不能在`pipeline`内调用。因此`Fn`是最合适的。

</template>
<template #quiz>

考虑如下API：

```rust
pub struct Analyzer<F> {
    postprocess: F
}

impl<F: ___(i32)> -> <i32> Analyzer<F> {
    fn process(&self, n: i32) -> i32 { /* .. */ }
    pub fn pipeline(&self, n: i32) -> i32 {
        let n = self.process(n);
        (self.postprocess)(n)
    }
}
```

下面哪一个trait填入空白处最合适？

<Radio>
<Option label="Fn" answer />
<Option label="FnMut" />
<Option label="FnOnce" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
