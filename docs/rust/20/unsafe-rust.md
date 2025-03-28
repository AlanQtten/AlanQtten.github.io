<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 不安全的Rust

目前我们讨论过的所有代码都有Rust在编译时强制地保证了内存安全。然而，Rust里藏着另一种语言，它不会强制保证内存安全：它被称为*不安全的Rust（unsafe Rust）*，它的语法和Rust是一样的，但它开启了更多的能力。

不安全的Rust之所以存在，就是因为静态的代码分析是很保守的。当编译器试图决定代码是否符合要求时，对它来说，拒绝不合法的程序比接受合法的程序要更容易。尽管有些代码*可能*是合理的，如果Rust的编译器没有足够的信息来支撑这种推断的话，它就会拒绝掉这段代码。在这些情况下，你可以使用不安全的代码来告诉编译器，“相信我，我知道自己在做什么”。然而，请注意，使用不安全的Rust意味着风险转移给了你自己：如果你的不安全代码有错误，那么程序可能会出现一些内存不安全的问题，比如对一个空指针的解引用。

Rust设计了不安全特性的了一个原因在于，底层的计算机硬件本质上是不安全的。如果Rust不允许你进行不安全的操作，那么你就不能处理类似的任务。Rust需要支持低等级的系统编程，比如直接和操作系统进行交互，甚至是开发你自己的操作系统。开发低等级的操作系统是语言的目标之一。我们来看看我们能使用不安全的Rust做什么，以及我们如何使用它。

## 不安全的超能力

要切换到不安全的Rust，你可以使用`unsafe`关键字，然后开启一个新的代码块，放置不安全的代码。你可以进行以下五种在安全的Rust里不能进行的操作，这些操作也被称为*不安全的超能力（unsafe superpowers）*。这些超能力包括：

- 解引用原始指针
- 调用不安全的函数或方法
- 访问或修改可变静态变量
- 实现不安全的trait
- 访问`union`的字段

需要注意理解的一点是，`unsafe`并不会关闭借用检查或禁用其他任何Rust的安全检查：如果你在不安全的代码里使用了一个引用，它仍然会被检查。`unsafe`关键字只会开启你对这五项特性的访问，它们进而不会被编译器检查其内存安全。在不安全代码块里，你仍然能获得一定程度上的安全。

总的来说，`unsafe`并不意味着其中的代码必须是危险的，或者说一定会引发内存安全问题：其意图在于让你明白，作为程序员，你需要保证`unsafe`代码块里的代码会用有效的方式访问内存。

人总是会犯错的，但通过要求这五种不安全的操作必须在`unsafe`注明的代码块里操作，你就可以知道和内存安全问题有关的错误发生在这些代码块里。尽量保持`unsafe`代码块很简短；你会在面对内存安全问题时回来感谢我。

为了让不安全的代码尽可能的独立，最好将其囊括在一个安全的抽象里，然后提供一个安全的API，这部分我们会在后面讨论。标准库的部分安全的抽象就是通过被严格审计的不安全代码组成的。这样做可以避免`unsafe`被你或你的用户写在各个分散的地方，转让使用安全抽象。

## 解引用原始指针

在第四章里，我们提到过，编译器会保证引用总是有效的。而不安全的Rust有两种被称为*原始指针（raw pointer）*的类型，它们和引用类似。就像引用一样，它们可以是不可变的或可变的，分别写作`*const T`和`*mut T`。这里的星号并不是解引用操作符；它是类型名的一部分。对原始指针来说，*不可变*意味着其在解引用后不能被直接赋值。

原始指针和引用、智能指针的区别是：

- 它被允许忽略借用规则，可以同时存在对同一个位置的不可变和可变的指针，或者多个可变指针
- 它不保证指向的内存是有效的
- 它允许指向空
- 没有实现任何自动清理

通过让Rust强制放弃一些保障，你可以换来更好的性能，或者实现与其他语言、硬件的接口，这些是有保障的Rust无法做到的。

下面的代码展示了如何通过一个引用创建一个不可变和可变的原始指针。

```rust
    let mut num = 5;

    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;
```

注意这里我们并没有使用`unsafe`关键字。这是因为，我们可以在安全代码里创建原始指针；我们只是不能在安全代码里解引用它们，你在后面会看到。

我们通过`as`基于一个不可变和一个可变引用分别创建了不可变和可变类型的原始指针。因为这些引用是有保障一定有效的，所以我们就知道这些特定的原始指针也是有效的，但是这个假设并不适用于任何原始指针。

为了证明这一点，我们来创建一个有效性不确定的原始指针。下面的代码展示了我们如何创建一个指向内存随机地址的原始指针。使用随机的内存是未定义的：对应的地址里可能有数据，也可能没有，编译器可能会优化这段代码，最终不会有内存访问，但程序也可能引发一个分段错误。通常来说，这样的代码是无意义的，但其是可行的。

```rust
    let address = 0x012345usize;
    let r = address as *const i32;
```

回顾我们在安全代码里创建原始指针，但不能*解引用*并读取指向数据的过程。在下面的代码里，我们使用`*`解引用了原始指针，当然这样的操作要求`unsafe`代码块：

```rust
    let mut num = 5;

    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;

    unsafe {
        println!("r1 is {}", *r1);
        println!("r2 is {}", *r2);
    }
```

创建一个指针是无害的；但访问其指向的值就存在无效的风险了。

注意在上面的代码里，我们创建了指向同一个地址的原始指针`*const i32`和`*mut i32`，也就是`num`。如果我们试图创建对`num`的不可变和可变引用，代码就无法通过编译，因为Rust的所有权规则不允许可变引用和不可变引用同时存在。而对于原始指针，我们可以对同一个内存地址创建不可变指针和可变指针，还可以通过可变指针修改数据，这样做有潜在的风险。请务必小心！

既然存在这么多地风险，为什么还要使用原始指针呢？一个主要的作用就是在实现C语言的接口时，你会在下一小节看到。另一种情况是开发一些借用检查器无法理解的安全抽象。我们会引入一些不安全的函数，看看使用了不安全代码的安全抽象。

## 调用不安全的函数或方法

在不安全代码块里可以进行的第二种操作就是调用不安全的函数。不安全的函数和方法看起来就和普通的函数和方法一样，但它们的定义前有一个额外的`unsafe`。`unsafe`关键字就暗示了这个函数的调用是有要求的，Rust无法针对这个函数做出一些保障。通过在`unsafe`代码块里调用不安全的函数，就表示我们已经读过了这个函数的文档，且对这个函数的调用负责。

下面的代码就是一个不安全函数`dangerous`的声明，它的函数体内没有任何代码：

```rust
    unsafe fn dangerous() {}

    unsafe {
        dangerous();
    }
```

我们必须在一个单独的`unsafe`代码块里调用`dangerous`函数。如果我们试图在这之外调用它，会看到如下报错：

```
$ cargo run
   Compiling unsafe-example v0.1.0 (file:///projects/unsafe-example)
error[E0133]: call to unsafe function `dangerous` is unsafe and requires unsafe function or block
 --> src/main.rs:4:5
  |
4 |     dangerous();
  |     ^^^^^^^^^^^ call to unsafe function
  |
  = note: consult the function's documentation for information on how to avoid undefined behavior

For more information about this error, try `rustc --explain E0133`.
error: could not compile `unsafe-example` (bin "unsafe-example") due to 1 previous error
```

通过`unsafe`代码块，我们就是向Rust断言我们已经读过了函数的文档，理解了如何正确使用这个函数，且验证了我们的代码是符合函数的要求的。

不安全函数的内部是自动`unsafe`的，所以在其中进行不安全操作时，不需要额外的`unsafe`关键字。

### 基于不安全代码创建安全抽象

一个函数内需要插入不安全的代码并不意味着我们需要将整个函数标记为不安全。实际上，将不安全的代码包裹在一个安全的函数里是一种很常见的抽象。在下面的例子里，我们来学习一个来自标准库的函数`split_at_mut`，其中就包含一些不安全的代码。我们来探索如何实现它。这个安全的方法定义了可变切片：它接收一个切片，然后根据下标参数将其一分为二。下面的代码是`split_at_mut`的使用：

```rust
    let mut v = vec![1, 2, 3, 4, 5, 6];

    let r = &mut v[..];

    let (a, b) = r.split_at_mut(3);

    assert_eq!(a, &mut [1, 2, 3]);
    assert_eq!(b, &mut [4, 5, 6]);
```

只用安全的Rust是无法实现这个函数的。你可能会尝试类似如下代码，但是这样的代码是无法编译的。为了简单，我们实现的`split_at_mut`只支持`i32`的切片类型：

```rust
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();

    assert!(mid <= len);

    (&mut values[..mid], &mut values[mid..])
}
```

这个函数先获取了切片的长度。然后通过断言下标参数小于等于切片长度，确保了给定的下标在切片的范围内。这个断言表示如果我们传入了超出切片长度的下标，函数会panic。

接着我们会返回一个元组结构包含的两个可变切片：一个从原始切片的开始到`mid`下标，一个从`mid`下标到切片结束。

如果我们尝试编译这段代码，我们会看到如下报错：

```
$ cargo run
   Compiling unsafe-example v0.1.0 (file:///projects/unsafe-example)
error[E0499]: cannot borrow `*values` as mutable more than once at a time
 --> src/main.rs:6:31
  |
1 | fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
  |                         - let's call the lifetime of this reference `'1`
...
6 |     (&mut values[..mid], &mut values[mid..])
  |     --------------------------^^^^^^--------
  |     |     |                   |
  |     |     |                   second mutable borrow occurs here
  |     |     first mutable borrow occurs here
  |     returning this value requires that `*values` is borrowed for `'1`
  |
  = help: use `.split_at_mut(position)` to obtain two mutable non-overlapping sub-slices

For more information about this error, try `rustc --explain E0499`.
error: could not compile `unsafe-example` (bin "unsafe-example") due to 1 previous error
```

Rust的借用检查器无法理解借用切片的不同片段这种行为；它只知道我们从同一个切片里借用了两次。借用一个切片的不同部分从本质上来说是可行的，因为它们没有交集，但Rust还没有聪明到能理解这一点。当出现这种我们知道安全，而Rust不知道的情况，就该使用不安全代码了。

下面的代码展示了如何使用`unsafe`代码块、原始指针和一些对不安全函数的调用实现了`split_at_mut`：

```rust
use std::slice;

fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
```

回顾第四章，切片是一个对部分数据和切片长度的指针。我们可以使用`len`方法来获取切片的长度，然后使用`as_mut_ptr`方法来访问切片的原始指针。在本例中，由于我们创建了对`i32`值的可变切片，`as_mut_ptr`会返回类型为`*mut i32`的原始指针，也就是我们存储在`ptr`变量里的内容。

我们断言了`mid`下标在切片的范围内。然后我们使用了不安全的代码：`slice::from_raw_parts_mut`函数会接收一个原始指针和一个长度，然后创建一个切片。我们首先调用这个函数从原始指针`ptr`创建了`mid`长度的切片。然后我们调用了`ptr`的`add`方法，并传入`mid`，获取了一个从`mid`开始的原始指针，接着我们使用这个指针创建了一个从`mid`一直到切片结尾的切片。

`slice::from_raw_parts_mut`这个函数也是不安全的，因为它接收了一个原始指针，且强制将这个指针看作了有效的。原始指针的`add`方法也是不安全的，因为它强制将偏移的位置看作是合法的指针。因此，我们必须使用`unsafe`代码块来包裹`slice::from_raw_parts_mut`和`add`方法的调用。通过检查代码和添加`mid`必须小于等于`len`的断言，我们可以确保所有`unsafe`块里的原始指针都使用了切片里的有效数据。这种情况下`unsafe`的使用就是合情合理的。

注意我们没有将`split_at_mut`函数的结果标记为`unsafe`，且我们是在安全Rust的环境里调用这个函数的。我们基于不安全的代码实现创建了安全的抽象，也就完成了安全地调用`unsafe`代码的过程，因为这个函数只会创建对其访问数据有效的指针。

相比之下，下面的代码中`slice::from_raw_parts_mut`对切片的使用就可能会导致崩溃。这段代码接收一个随机的内存地址，然后创建一个长度为10000的切片。

```rust
    use std::slice;

    let address = 0x01234usize;
    let r = address as *mut i32;

    let values: &[i32] = unsafe { slice::from_raw_parts_mut(r, 10000) };
```

我们没有随机地址内存的所有权，自然也无法保证这段代码创建的切片包含合法的`i32`值。任何对`values`的使用都可能会导致未定义行为。

### 使用`extern`函数调用外部代码

有时候，Rust代码需要和其他语言编写的代码进行交互。为了实现这一点，Rust设置了一个关键字`extern`来方便创建和使用*外部函数接口（FFI）*。一个FFI就是一种编程语言里定义函数和启用不同的（外部的）语言来调用这些函数的机制。

下面的代码展示了如何设置一个和来自C标准库的`abs`函数的一体化流程。定义在`extern`块里的函数对于Rust代码来说永远是不安全的。因为其他语言并没有Rust的规则和保障，且Rust也无法检查它们，所以检查它们是否安全就是开发者的责任了。

```rust
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

在`extern "C"`代码块里，我们列举了我们希望调用语言的函数名和签名。`"C"`表示外部函数使用的是哪一个*二进制应用接口（application binary interface, ABI）*：ABI会定义如何在汇编层调用这些函数。`"C"`的ABI是最常用的，它遵守C语言的ABI。

> #### 在其他语言里调用Rust函数
> <br />
>
> 我们也可以使用`extern`来创建一些允许其他语言调用Rust函数的接口。这种情况下不用创建完整的`extern`块，我们只需要在相关函数的`fn`关键字前添加`extern`关键字并指定ABI即可。我们还需要添加`#[no_mangle]`注解来通知Rust编译器不要干涉这个函数的名字。*干涉（Mangling）*是编译器为了之后的处理方便而修改的不利于人类阅读的函数名。每一个编译器都会或多或少地干涉调整名字，为了让其他语言可以使用名字调用Rust里的函数，我们必须禁用掉编译器的干涉。
> <br />
> 在下面的例子里，我们将`call_from_c`函数暴露给了C语言，它会被编译到一个共享库里，和C进行链接：
>
> ```rust
> #[no_mangle]
> pub extern "C" fn call_from_c() {
>     println!("Just called a Rust function from C!");
> }
> ```
> 这里`extern`的使用不需要`unsafe`。

## 访问或调整一个可变静态变量

在本书中，我们其实没有认真讨论过*全局变量*，虽然Rust确实支持，但它和Rust的所有权规则有些冲突。如果两个线程访问同一个可变的全局变量，就会引发竞态问题。

在Rust里，全局变量被称为*静态*变量。下面的代码展示了一个声明和使用一个数组切片作为静态变量的例子。

```rust
static HELLO_WORLD: &str = "Hello, world!";

fn main() {
    println!("name is {HELLO_WORLD}");
}
```

静态变量很像常量，我们在第三章讨论过。为了便利，静态变量的名字是`大写的蛇形命名法`。静态变量只能存储生命周期为`'static`的引用，也就是说Rust的编译器可以推断出它的生命周期，我们无需显式注明。访问一个不可变的静态变量是安全的。

常量和不可变的静态变量之间有一个微妙的区别，那就是静态变量在内存中的地址是固定的。使用这个值永远会访问同一份数据。而常量在有需要的情况下是可以被复制的。另一个区别就是静态变量可以是可变的。访问和修改可变的静态变量是*不安全的*。下面的代码展示了如何声明，访问和调整一个可变的静态变量`COUNTER`。

```rust
static mut COUNTER: u32 = 0;

fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    add_to_count(3);

    unsafe {
        println!("COUNTER: {COUNTER}");
    }
}
```

就像常规的变量一样，我们通过`mut`关键字来声明静态变量的可变性。任何对`COUNTER`进行读取和写入操作的代码都需要放置在`unsafe`代码块里。这段代码会正常编译并打印`COUNTER: 3`，因为这是一个单线程的场景。如果有多个线程尝试访问`COUNTER`，那么会引发竞态问题。

当一个可变的数据在全局可访问时，很难保证不发生竞态问题，这也是为什么Rust将可变的静态变量标记为不安全的原因。如果可能的话，最好还是使用我们在第16章中讨论的并发技术和线程安全的智能指针，这样编译器可以检查来自不同线程的数据访问是否安全。

## 实现一个不安全的Trait

我们可以使用`unsafe`来实现一个不安全的trait。如果一个trait的至少一个方法里存在编译器无法验证的操作，那么它就是不安全的。我们通过添加`unsafe`关键字来标记这个trait及其实现是不安全的，代码如下：

```rust
unsafe trait Foo {
    // 方法
}

unsafe impl Foo for i32 {
    // 方法实现
}

fn main() {}
```

通过使用`unsafe impl`，我们就承诺了我们会承担编译器无法验证的操作。

举个例子，回顾我们在第16章中讨论过的`Sync`和`Send`标记trait：编译器会自动为完全由`Send`和`Sync`类型组成的trait实现它们。如果我们实现了一个类型，它包含了不是`Send`或`Sync`的类型，比如原始指针，而我们又想将这个类型标记为`Send`或`Sync`，我们就必须使用`unsafe`。Rust无法验证我们的类型是否可以安全地在多线程里被发送，或者被多线程访问；因此，我们需要手动检查，并标记为`unsafe`。

## 访问Union的字段

最后一个不安全的操作就是访问*union*的字段。一个`union`和`struct`类似，但它在特定的时刻只能是一种实例。Union主要用在和C代码的接口上。访问union的字段是不安全的，因为Rust无法保证当前存储在union实例里的类型。你可以查看[Union的定义](https://doc.rust-lang.org/reference/items/unions.html)来了解更多。

## 何时使用不安全的代码

使用`unsafe`来采取上面讨论的五种行动之一（超能力）并不是错误的，也不是不合理的。但使用`unsafe`的代码是很易错的，因为编译器无法保住我们保证内存安全。如果你有使用`unsafe`的理由，那么你可以使用它，显式地标注`unsafe`也让未来的问题排查更加方便。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：`unsafe`块允许你解引用原始指针和调用`unsafe`函数。然而，它无法让你禁用借用检查器（针对安全引用的检查仍然会进行）。引用在正常安全的代码里也可以被转为原始指针。

</template>
<template #quiz>

以下哪几项属于Rust会在`unsafe`代码块里开启的“超能力”？

<Checkbox>
<Option label="禁用借用检查器" />
<Option label="调用unsafe的函数" answer />
<Option label="解引用原始指针" answer />
<Option label="将引用转化为原始指针" />
</Checkbox>

</template>
</Quiz>

<Quiz>
<template #description>

解析：这个程序是危险的！由于`Vec`的容量是足够的，所以`v.push(4)`不会导致其重构大小，它可以正常编译和执行。然而如果容量为3，那么`n`就会指向被释放的内存。

</template>
<template #quiz>

<IsCompileText />

```rust
fn main() {
    let mut v = Vec::with_capacity(4);
    for i in 0 .. 3 {
        v.push(i);
    }
    let n = &v[0] as *const i32;
    v.push(4);
    println!("{}", unsafe { *n });
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: 0,
  }"
/>

</template>
</Quiz>

<Quiz>
<template #description>

解析：对同一个数组的不交叉区域创建的两个可变引用是合理的，因为借用检查器无法理解不交叉的情况。可以参考[`slice::split_at_mut`](https://doc.rust-lang.org/stable/std/primitive.slice.html#method.split_at_mut)。

允许变量未初始化是合理的，因为借用检查器有一个保守的策略，即值必须被初始化，但是有时候未初始化的值也是有用的。可以参考[`MaybeUninit`](https://doc.rust-lang.org/stable/std/mem/union.MaybeUninit.html)和[`take_mut`](https://docs.rs/take_mut/0.2.2/take_mut/index.html)crate。

让一个结构体持有其自身的引用也是合理的，因为借用检查器无法理解自引用的生命周期。可以参考[`std::pin`](https://doc.rust-lang.org/stable/std/pin/index.html)模块。

然而，返回一个函数外栈内分配的指针对不安全代码来说*永远*是无效的。唯一合适的迂回策略是使用垃圾回收，也就是使用`Rc<T>`来代替`&T`。

</template>
<template #quiz>

在与借用检查器配合工作时，以下哪几项是使用`unsafe`代码（或者被`unsafe`包裹的安全代码）的合适时机？

<Checkbox>
<Option label="返回一个指向函数外栈内分配的指针" />
<Option label="获取针对同一个数组不交叉区域的两个可变引用" answer />
<Option label="创建一个对结构体字段的引用，这个结构体本身存储在同一个结构体内的另一个字段内" answer />
<Option label="允许值在没有被读取的情况下不进行初始化" answer />
</Checkbox>

</template>

</Quiz>
</QuizProvider>
:::
