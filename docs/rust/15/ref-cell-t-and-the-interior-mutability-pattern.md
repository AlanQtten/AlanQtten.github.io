<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"
</script>

# `RefCell<T>`和内部可变性模式

*内部可变性（interior mutability）*是Rust中的一种设计模式，它允许你修改数据，即便是针对数据的不可变引用；正常情况下，这样的操作会被借用规则所禁止。要修改数据，该模式会使用`unsafe`的代码在数据结构内部违反Rust管理突变和借用的常规规则。不安全的代码就是告诉编译器我们会手动检查规则，不需要编译器来帮助我们检查；我们会在第19章详细讨论不安全代码。

我们只应在那些我们确信运行时借用规则也会被遵守（即使编译器无法提供保障）的情况下使用涉及了内部可变性的类型。`unsafe`的代码被包裹在了安全的API中，外侧的类型仍然是不可变的。

我们可以通过`RefCell<T>`类型来了解内部可变性模式。

## 通过`RefCell<T>`保证运行时的借用规则

和`Rc<T>`不同，`RefCell<T>`类型代表了数据持有的独立所有权。所以，`RefCell<T>`和`Box<T>`类型有什么不同呢？回顾第四章学过的借用规则：

- 在任何时间，你可以有下面两者*任其一*（但不可以同时）：一个可变引用或任意数量的不可变引用。
- 引用必须永远有效。

对于`Box<T>`这类的引用，借用规则可以在编译时对其进行检查。而对于`RefCell<T>`，则是在*运行时*进行检查。对于普通的引用，如果你违反了借用规则，你会收到一个编译时错误。而对于`RefCell<T>`，如果你违反了规则，你的程序会panic并退出。

在编译时进行检查的好处是错误会提前被锁定，且不会对运行时的性能造成任何的损耗，因为所有的分析都提前完成了。出于这些原因，在编译时进行借用规则的检查永远是最好的选择，也是Rust默认采取的模式。

在运行时进行借用规则检查的好处是可以放开某些编译器无法识别、但内存安全的场景。类似Rust编译器这样的静态分析是很保守的。某些代码的特性永远无法通过分析代码感知到：最有名的例子就是停机问题，这是一个有趣的问题，但超出了本书的讨论范围。

由于某些分析无法达成，如果Rust编译器不能确定代码是否能通过所有权规则，它可能会拒绝通过这段代码。这种情况下，它是很保守的。如果Rust接收了不正确的程序，用户就不会信任Rust创造的限制了。然而，如果Rust拒绝了正确的程序，用户会感觉非常的不方便，但不会有任何灾难发生。`RefCell<T>`类型在这种情况下就很有用了，如果你确定你的代码遵守了借用规则，而编译器无法理解和保障这一点的话。

和`Rc<T>`一样，`RefCell<T>`也是为了单线程场景设计的，如果你在多线程上下文中使用它，你会看到一个编译错误。我们会在第16章讨论如果在多线程程序中获得`RefCell<T>`的功能。

下面是对选择`Box<T>`、`Rc<T>`或`RefCell<T>`场景的回顾：

- `Rc<T>`允许了单个数据存在多个所有者；`Box<T>`和`Ref<T>`只允许单个所有者。
- `Box<T>`允许不可变或可变借用在编译时进行检查；`Rc<T>`只允许编译时的不可变引用检查；`RefCell<T>`允许可变或不可变引用在运行时的检查。
- 因为`RefCell<T>`允许了运行时的可变借用检查，你可以修改`RefCell<T>`内部的值，即使`RefCell<T>`本身是不可变的。

修改不可变值内部的值就是*内部可变性*模式。我们来看一个内部可变性是主角的场景。

## 内部可变性：对不可变值的可变借用

借用规则的结果之一就是当你有一个不可变值时，你不能对其进行可变借用。比如，下面的代码是无法编译的：

```rust
fn main() {
    let x = 5;
    let y = &mut x;
}
```

如果你尝试编译这段代码，你会看到如下报错：

```
$ cargo run
   Compiling borrowing v0.1.0 (file:///projects/borrowing)
error[E0596]: cannot borrow `x` as mutable, as it is not declared as mutable
 --> src/main.rs:3:13
  |
3 |     let y = &mut x;
  |             ^^^^^^ cannot borrow as mutable
  |
help: consider changing this to be mutable
  |
2 |     let mut x = 5;
  |         +++

For more information about this error, try `rustc --explain E0596`.
error: could not compile `borrowing` (bin "borrowing") due to 1 previous error
```

然而，在某些情况下允许值在自己的方法里修改自身，对外继续保持不可变也是十分有用的。外部的代码无法修改其值。`RefCell<T>`的使用场景之一就是启用内部可变性，但`RefCell<T>`并不是完全绕开了借用规则：借用检查器允许了编译时的内部可变性，并在运行时进行借用规则的检查。如果你违反了规则，你会收到`panic!`而不是编译错误。

我们来看一个例子，使用`RefCell<T>`来修改一个不可变值，看看为什么它很实用。

### 内部可变性实用场景之一：模拟对象

某些情况下，在测试程序时，你可能需要使用一个本地类型来代表外侧的一个类型，但并不需要它的完整功能来配合断言。这种占位的类型成为*测试替身（test double）*。你可以想象一下电影拍摄中的“特技替身”，他们会代替演员来完成一些特定的场景。测试替身会在我们运行测试时替代其他类型。*模拟对象（mock objects）*就是一个特殊的测试替身，它会记录测试期间发生的事，以便你可以断言正确的行为。

Rust中没有和其他语言类似的对象，也没有在标准库中内置像其他语言一样的模拟对象功能。然而，你可以定义一个结构体，来完成模拟对象的功能。

下面是我们的测试场景：我们的库会跟踪某个值和最大值的关系，并依据上面的关系发送消息。这个库可以用于跟踪用户调用API的次数等等。

我们的库会提供检测值和最大值接近程度的功能，以及在何种情况下该发送何种消息。使用了我们库的应用需要提供一个消息发送机制：可以在应用内发布消息，发送邮箱，发送短信等等。我们的库无需关心那些细节。我们只需要实现一个trait`Messenger`，代码如下：

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}
```

这段代码的重点在于`Messenger`trait的方法`send`会接收一个`self`的不可变引用和一段消息。这个trait就是我们的模拟对象需要实现的接口，这样模拟对象就能像真实对象一样。还有一个重要的点是我们想测试`LimitTracker`上的`set_value`方法的行为。我们可以修改我们传入的`value`参数，但是`set_value`没有返回任何用于断言的值。我们想要确保我们创建的`LimitTracker`实现了`Messenger`trait，且存储了特定的`max`值，如果我们传入了不同的`value`，那么程序会发送不同的消息。

因此我们需要一个模拟对象，它不需要在我们调用`send`时发送邮件或短信，只需要记录发送的消息即可。我们可以创建一个模拟对象的实例，创建一个使用了模拟对象的`LimitTracker`，最终调用`LimitTracker`上的`set_value`方法，然后检查模拟对象是否记录了正确的值。下面的代码展示了一段尝试实现模拟对象的代码，但借用检查器并不允许这样做：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    struct MockMessenger {
        sent_messages: Vec<String>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger {
                sent_messages: vec![],
            }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.len(), 1);
    }
}
```

测试代码定义了一个`MockMessenger`结构体，它拥有一个`sent_messages`字段，类型为一个存储了`String`值的`Vec`，它会记录所有发送的值。我们也定义了一个关联的`new`方法，它提供了一个简洁的新建`MockMessenger`的方式，默认存储了一个空的消息列表。接着我们为`MockMessenger`实现了`Messenger`trait，这样我们就可以将`MockMessenger`传给`LimitTracker`。在`send`方法的定义中，我们将接收的消息存入了`MockMessenger`的`sent_messages`中。

在测试代码中，我们测试了当`LimitTracker`被设置了超过`max`75%的`value`后会发生什么。首先，我们创建了一个新的`MockMessenger`实例，它存储了一个空列表。然后我们创建了一个新的`LimitTracker`，并将`MockMessenger`实例和值为100的`max`设置给了它。我们接着调用了`LimitTracker`的`set_value`方法，传入了80，它超过了100的75%。然后我们断言`MockMessenger`存储的消息列表应该有一条消息。

然而，这段测试代码是有问题的，报错如下：

```
$ cargo test
   Compiling limit-tracker v0.1.0 (file:///projects/limit-tracker)
error[E0596]: cannot borrow `self.sent_messages` as mutable, as it is behind a `&` reference
  --> src/lib.rs:58:13
   |
58 |             self.sent_messages.push(String::from(message));
   |             ^^^^^^^^^^^^^^^^^^ `self` is a `&` reference, so the data it refers to cannot be borrowed as mutable
   |
help: consider changing this to be a mutable reference in the `impl` method and the `trait` definition
   |
2  ~     fn send(&mut self, msg: &str);
3  | }
...
56 |     impl Messenger for MockMessenger {
57 ~         fn send(&mut self, message: &str) {
   |

For more information about this error, try `rustc --explain E0596`.
error: could not compile `limit-tracker` (lib test) due to 1 previous error
```

我们不可以调整`MockMessenger`来追踪信息，因为`send`方法接收了一个`self`的不可变引用。我们也不能使用`&mut self`，因为`send`的签名无法满足`Messenger`trait的定义（你可以尝试改一改，看看对应的错误信息）。

此时就该内部可变性登场了！我们可以将`sent_messages`存储在`RefCell<T>`中，这样`send`方法就可以修改`sent_messages`并存入我们需要的信息了，代码如下：

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    struct MockMessenger {
        sent_messages: RefCell<Vec<String>>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger {
                sent_messages: RefCell::new(vec![]),
            }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.borrow_mut().push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        // 略

        assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
    }
}
```

`sent_messages`字段从`Vec<String>`改为了`RefCell<Vec<String>>`。在`new`函数中，我们创建了一个包含空vector的`RefCell<Vec<String>>`。

对于`send`方法的实现，第一个参数我们仍然接收一个`self`的不可变借用，和trait的定义一致。但我们可以对`self.sent_messages`调用`RefCell<Vec<String>>`提供的`borrow_mut`方法来获取一个针对`RefCell<Vec<String>>`内部值的可变引用，也就是对应的vector。让我们可以调用`push`方法来插入我们需要在测试期间关注的信息。

最后一个改动是关于断言的：要查看内部的vector存储了多少个元素，我们需要调用`RefCell<Vec<String>>`定义的`borrow`方法来获取针对vector的不可变引用。

现在你了解了如何使用`RefCell<T>`了，我们来深入了解一下它是如何工作的！

### 使用`RefCell<T>`跟踪运行时的借用

在创建不可变和可变引用时，我们需要分别使用`&`和`&mut`语法。而针对`RefCell<T>`，我们需要使用`borrow`和`borrow_mut`方法，它们是属于`RefCell<T>`安全API的一部分。`borrow`方法会返回一个智能指针类型`Ref<T>`，而`borrow_mut`方法会返回一个智能指针类型`RefMut<T>`。这两个类型都实现了`Deref`，所以我们可以像使用常规引用那样使用它们。

`RefCell<T>`类型会追踪目前激活的`Ref<T>`和`RefMut<T>`有多少。每一次我们调用`borrow`方法时，`RefCell<T>`就会增加其内部记录的不可变借用的活跃数。当一个`Ref<T>`离开作用域时，这个活跃数会减少一个。就像编译时的借用规则一样，`RefCell<T>`允许同时存在一个可变引用或任意个不可变引用。

如果我们试图破坏这些规则，不像我们错误使用引用时收到的编译错误，`RefCell<T>`的实现会触发panic。下面的代码就是对`send`的实现进行了一些调整。我们尝试在同一个作用域下激活了两个可变借用，来验证`RefCell<T>`是如何在运行时避免我们这么做的。

```rust
    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            let mut one_borrow = self.sent_messages.borrow_mut();
            let mut two_borrow = self.sent_messages.borrow_mut();

            one_borrow.push(String::from(message));
            two_borrow.push(String::from(message));
        }
    }
```

我们用`borrow_mut`的返回值创建了`RefMut<T>`类型的智能指针变量`one_borrow`。然后我们使用同样的方式创建了变量`two_borrow`。这会导致同一个作用域里存在两个可变引用，这是不允许的。当我们运行这段测试代码时，不会看到任何报错，但测试会运行失败：

```
$ cargo test
   Compiling limit-tracker v0.1.0 (file:///projects/limit-tracker)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.91s
     Running unittests src/lib.rs (target/debug/deps/limit_tracker-e599811fa246dbde)

running 1 test
test tests::it_sends_an_over_75_percent_warning_message ... FAILED

failures:

---- tests::it_sends_an_over_75_percent_warning_message stdout ----
thread 'tests::it_sends_an_over_75_percent_warning_message' panicked at src/lib.rs:60:53:
already borrowed: BorrowMutError
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::it_sends_an_over_75_percent_warning_message

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

注意代码panic的错误信息是`already borrowed: BorrowMutError`。这就是`RefCell<T>`如何处理运行时的借用规则违规。

选择捕获运行时而不是编译时的错误，就像我们这里做的一样，意味着你会在开发过程的后期发现代码错误：甚至可能在你的代码已经被部署到了生产环境。同时，你的代码需要付出一定的性能来追踪运行时的借用。然而，`RefCell<T>`可以实现模拟对象，它能修改对象本身，追踪仅允许值为不可变的上下文中产生的信息。你可以使用`RefCell<T>`作为一个备选项，来获取更多普通引用没有的功能。

## 结合`Rc<T>`和`RefCell<T>`使可变数据有多个所有者

`RecCell<T>`的常见用法之一是结合`Rc<T>`。回顾之前关于`Rc<T>`的介绍，它允许你创建针对单个数据的多个拥有者，但只允许创建不可变的访问。但如果你创建了一个存储了`RefCell<T>`的`Rc<T>`，你就可以创建拥有多个所有者的值*且*你可以通过它们修改！

比如，回顾我们之前讨论的构造列表，我们使用了`Rc<T>`来允许了多个列表拥有了另一个列表。由于`Rc<T>`只能存储不可变值，我们就不能修改已创建列表的元素。我们可以加入`RefCell<T>`来增加这种能力。下面的代码展示了在`Cons`定义中使用`RefCell<T>`，进而可以修改列表值的例子：

```rust
#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use crate::List::{Cons, Nil};
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));

    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));

    *value.borrow_mut() += 10;

    println!("a after = {a:?}");
    println!("b after = {b:?}");
    println!("c after = {c:?}");
}
```

我们创建了一个`Rc<RefCell<i32>>`实例，并存入了变量`value`以供后续使用。然后我们创建了一个类型为`List`的变量`a`，它的值为`Cons`变体，存储了`value`。我们需要克隆`value`，这样`a`和`value`都可以拥有对内部值`5`的所有权，而不是将`value`的所有权转移给`a`，或者从`value`借用`a`。

我们将`a`包裹在了`Rc<T>`中，这样我们就可以创建`b`和`c`，它们都引用了`a`，和我们之前的代码一样。

在我们创建了`a`，`b`和`c`后，我们希望给`value`添加值`10`。我们可以调用`value`的`borrow_mut`方法，它会使用我们第四章讨论过的自动解引用特性，获取`Rc<T>`中的`RefCell<T>`。`borrow_mut`方法会返回一个`RefMut<T>`智能指针，我们可以使用解引用操作符来修改其内部的值。

当我们打印`a`，`b`和`c`时，我们可以看到它们都存储了修改后的值15：

```
$ cargo run
   Compiling cons-list v0.1.0 (file:///projects/cons-list)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.63s
     Running `target/debug/cons-list`
a after = Cons(RefCell { value: 15 }, Nil)
b after = Cons(RefCell { value: 3 }, Cons(RefCell { value: 15 }, Nil))
c after = Cons(RefCell { value: 4 }, Cons(RefCell { value: 15 }, Nil))
```

这样的技术很简洁！通过使用`RefCell<T>`，我们的`List`对外表现为不可变。但我们可以使用`RefCell<T>`提供的方法来访问其内部可变性，进而修改我们需要修改的值。运行时的借用规则检查确保了我们不会遇到竞态问题，有时候在我们的数据结构中牺牲一点性能来获取灵活度也是值得的。注意`RefCell<T>`不能再多线程代码中使用！`Mutex<T>`才是线程安全版本的`RefCell<T>`，这部分我们会在第16章讨论。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：内部可变性的核心原则在于接收`&T`，并通过它安全地修改`T`内部的值。

</template>
<template #quiz>

以下哪一项对Rust中*内部可变性*的概念描述得最准确？

<Radio>
<Option label="它允许了数据结构内部的值可以被修改" />
<Option label="它允许通过不可变引用修改值" answer />
<Option label="它使用了借用检查器来确保运行时的内存安全" />
<Option label="它将unsafe的代码包裹在了安全的API中" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`RefCell`对于修改内部字段来说很有用，即使`some_method`接收了一个不可变引用作为入参。如果内部的字段为整数，那么使用`Cell<usize>`或者`AtomicUsize`会更好。

</template>
<template #quiz>

假设现有如下API，它跟踪特定方法的调用次数：

```rust
struct Api {
    count: ???
}

impl Api {
    fn some_method(&self) {
        // 增加count
        // 其余代码...
    }
}
```

假设`count`为`size`类型。这种情况下以下哪一种包裹最合适？

<Radio>
<Option label="Box<usize>" />
<Option label="Rc<usize>" />
<Option label="都不需要，usize就可以了" />
<Option label="RefCell<usize>" answer />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`BadRefCell`允许我们针对数据同时创建两个可变引用，也就导致vector重分配时还持有对其内容引用的操作是内存不安全的。

</template>
<template #quiz>

下面是一段对`RefCell`不正确的实现，它没有检查内部的值是否被借用了：

```rust
use std::cell::UnsafeCell;
struct BadRefCell<T>(UnsafeCell<T>);
impl<T> BadRefCell<T> {
    pub fn borrow_mut(&self) -> &mut T {
        unsafe { &mut *self.0.get() }
    }
}
```

假设我们使用`BadRefCell`的代码如下：

```rust
let v = BadRefCell(UnsafeCell::new(vec![1, 2, 3]));
```

以下哪一段API使用的代码违反了内存安全？

<Radio>
<Option>

```rust
drop(v.borrow_mut());
drop(v.borrow_mut());
```

</Option>
<Option answer>

```rust
let v1 = v.borrow_mut();
let n = &v1[0];
v.borrow_mut().push(0);
println!("{n}");
```

</Option>
<Option>

```rust
v.borrow_mut().push(0);
let n = v.borrow_mut()[0];
println!("{n}");
```

</Option>
<Option>

```rust
let v1 = v.borrow_mut();
let v2 = v.borrow_mut();
v1.push(0);
v2.push(0);
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
