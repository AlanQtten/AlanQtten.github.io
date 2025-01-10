<script setup>
import {
  Quiz,
  QuizProvider,
  Radio,
  Option,
  IsCompile,
  IsCompileText
} from '../../components/quiz'
</script>

# 通过生命周期校验引用

生命周期是另一种我们已经使用过的泛型。和其他泛型限制类型的行为不同的是，生命周期保证了引用能根据我们的需要保持有效的状态。

在第四章的“在引用的生命周期结束时，权限会被返回”小节里，我们曾简短地说过，Rust中的每个引用都有*生命周期*，它决定了引用有效的范围。大多数情况下，生命周期是隐式推断而得的，就像类型一样。我们需要在多个类型复合时进行类型的标注，同理，我们也需要在引用的生命周期存在多种可能性时进行标注。Rust要求我们使用泛型生命周期参数来标注引用的关系，从而确保运行时的引用是绝对有效的。

生命周期标注是一个大多数语言都没有的概念，所以可能会让大家感觉不熟悉。尽管我们不会在这一章对生命周期进行完全的讲解，但我们会讲解一些基本的语法，来让你熟悉这个概念。

## 用生命周期避免悬空引用

生命周期的主要目的就是为了避免*悬空引用（dangling reference）*，它会引用访问到非它本意想访问的数据。下面是一个不安全的程序：

```rust
fn main() {
    let r;

    {
        let x = 5;
        r = &x;
    }

    println!("r: {}", r);
}
```

> [!NOTE]
>
> 在本章的一些例子里，我们声明了变量，却没有赋予其初始值。这样的代码乍一看感觉和“Rust没有null值”是矛盾的。然而，如果我们使用一个没有被赋值的变量，我们会看到一个编译时错误，也就明确了Rust确实不允许null的存在。

外侧的作用域声明了一个未初始化的变量`r`，内侧的作用域声明了一个变量`x`，初始值为`5`。在内侧作用域里，我们尝试将`r`赋值为`x`的引用。然后内侧作用域结束了，我们尝试打印`r`的值。这段代码无法通过编译，因为`r`引用的对象在内侧作用域结束时候就已经被销毁了，而我们尝试访问它，下面是报错信息：

```
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0597]: `x` does not live long enough
 --> src/main.rs:6:13
  |
5 |         let x = 5;
  |             - binding `x` declared here
6 |         r = &x;
  |             ^^ borrowed value does not live long enough
7 |     }
  |     - `x` dropped here while still borrowed
8 |
9 |     println!("r: {r}");
  |                  --- borrow later used here

For more information about this error, try `rustc --explain E0597`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

错误信息指出，变量`x`的存活时长不够。原因是`x`会在第7行————也就是内侧代码结束时被销毁。而`r`在外侧作用域仍然是有效的；因为它的作用域更大，也就是我们说的“存活的更久”。如果Rust允许这样的代码通过编译，那么`r`会指向一片已经被销毁的内存，我们对`r`进行的任何操作都无法正确执行。那么Rust是如何判断这段代码是无效的呢？答案是借用检查器。

## 借用检查器确保了数据必须在引用有效时存在

Rust编译器中的借用检查器会在作用域之间进行比较，确保所有的借用都是有效的。下面的代码跟上面的代码相同，但增加了生命周期的标注：

```rust
fn main() {
    let r;                // ---------+-- 'a
                          //          |
    {                     //          |
        let x = 5;        // -+-- 'b  |
        r = &x;           //  |       |
    }                     // -+       |
                          //          |
    println!("r: {}", r); //          |
}                         // ---------+
```

这里，我们将`r`的生命周期标注为`'a`，`x`的生命周期标注为`'b`。正如你看到的一样，`'b`的生命周期比`'a`要短。在编译代码时，Rust会对其大小进行比较，然后发现生命周期为`'a`的变量`r`引用了`'b`生命周期中的内存。因此程序拒绝了这段代码，因为`'b`比`'a`更短：即引用的对象的生命周期比引用本身短。

下面的代码修复了悬空引用的问题，它可以正常编译：

```rust
fn main() {
    let x = 5;            // ----------+-- 'b
                          //           |
    let r = &x;           // --+-- 'a  |
                          //   |       |
    println!("r: {r}");   //   |       |
                          // --+       |
}                         // ----------+
```

这段代码中，`x`的生命周期为`'b`，它比`'a`更长。也就是说，`r`可以引用`x`，因为Rust清楚的知道`x`有效期间`r`一定是有效的。

现在你知道了什么是生命周期，以及Rust如何通过分析它们来保证引用的有效性。让我们来看看如何泛型生命周期参数，以及如何在函数上下文中返回它们。

## 函数中的泛型生命周期

我们现在编写一个程序，它会对比两个字符串切片的长度，并返回其中较长的那个。这样的函数会接收两个字符串切片作为参数。在我们实现这个函数`longest`后，下面的代码应当输出`the longest string is abcd`：

```rust
fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}
```

注意我们希望函数接收字符串切片作为参数，也就是引用，而不是字符串，因为我们不希望`longest`函数获取参数的所有权。第四章中我们讨论过为什么要使用字符串切片作为参数。

如果我们像下面一样实现`longest`函数，那么编译器会报错：

```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

我们会看到如下关于生命周期的报错：

```
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0106]: missing lifetime specifier
 --> src/main.rs:9:33
  |
9 | fn longest(x: &str, y: &str) -> &str {
  |               ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
  |
9 | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
  |           ++++     ++          ++          ++

For more information about this error, try `rustc --explain E0106`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

这段帮助信息告诉我们，这里的返回值需要泛型生命周期参数，因为Rust无法判断这里的引用是来自`x`还是`y`。实际上，我们也不知道，因为`if`块返回了`x`，而`else`块返回了`y`！

当我们定义这个函数时，我们无法确定传入函数的具体值是什么，所以我们也无法确定`if`和`else`的执行情况。我们也无法确定我们传入变量的生命周期，所以我们无法像之前一样，确保我们返回的引用一定是有效的。借用检查器也无法判断，因为它无法确定`x`和`y`的生命周期和实际返回值的生命周期之间的关系。要修复这个问题，我们需要添加一个泛型生命周期参数来定义引用之间的关系，协助借用检查器进行分析。

## 生命周期标注语法

生命周期标注不会影响任何变量存活的时长。它们仅仅在不影响生命周期的情况下描述了多个变量生命周期之间的关系。就像函数声明了泛型参数后可以接收任何类型一样，声明了泛型生命周期参数的函数也可以接收拥有任何生命周期的引用作为参数。

生命周期的标注语法不太常见：生命周期参数的名字必须使用一个单引号（'）开头，且通常使用小写的、类似泛型参数一样的简短名字。大部分人会用`'a`作为第一个生命周期标注。我们需要在引用符号`&`后面书写生命周期标注，且使用一个空格将其和引用的类型分开。

下面是一个例子：一个没有生命周期参数的`i32`的引用，一个对`i32`的引用，且拥有一个生命周期参数`'a`，以及一个`i32`的可变引用，也拥有一个生命周期参数`'a`：

```rust
&i32        // 一个引用
&'a i32     // 一个带有显式生命周期的引用
&'a mut i32 // 一个带有显式生命周期的可变引用
```

生命周期独自出现时没什么特殊含义，因为标注的意义在于告诉Rust多个泛型的生命周期之间的关系。让我们来看看在`longest`函数上下文中生命周期标注是如何工作的。

## 函数签名中的生命周期标注

要在函数签名中使用生命周期标注，我们需要在函数名和参数列表之间书写一对尖括号，并在其中声明泛型*生命周期*参数，就像泛型*类型*参数一样。

我们希望签名能表示以下约束：函数的返回值和它的两个参数有效期相同。这就是参数的生命周期和返回值的生命周期之间的关系。我们把生命周期命名为`'a`，并给每个引用添加它：

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

这样的代码可以通过编译，在之前的`main`函数中调用时输出也是符合预期的。

现在，函数的签名会告诉Rust，对于生命周期`'a`，函数会接收两个参数，它们都是字符串切片，且生命周期为`'a`。函数签名还会告诉Rust这个函数的返回值也是一个字符串切片，其生命周期也为`'a`。也就是说，`longest`函数返回值的生命周期是小于等于其参数的生命周期的。这样的关系就是我们希望Rust分析代码时所使用的。

请记住，当我们在函数签名中指定生命周期参数时，我们没有改变任何传入参数或返回值的生命周期。我们只是为借用检查器提供了更多的信息，这样它能根据这些约束灵活地拒绝不符合约束的变量。注意，`longest`函数无需了解`x`和`y`实际存活的时长，只要满足签名中`'a`的要求即可。

当我们在函数中声明生命周期时，它被标注在函数的签名中，而不是函数体中。生命周期的标注变为了函数合约的一部分，就像类型一样。包含生命周期标注的函数签名让Rust编译器的工作轻松了不少。如果函数的调用不符合其签名，编译器就会报错，签名就能更准确地反映这些错误。同样的，Rust编译器能根据我们期望的生命周期关系做出更多推断，尽可能早的发现潜在的问题。

当我们调用`longest`函数并传入引用时，实际被赋值给`'a`的部分是`x`参数生命周期和`y`参数生命周期的重叠部分。换言之，`'a`的生命周期是`x`和`y`生命周期的最小交集，由于我们已经将函数的返回值标注为`'a`，此时返回值也会在`x`和`y`生命周期的最小交集内有效。

让我们来看看生命周期标注是如何约束`longest`函数的：

```rust
fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {result}");
    }
}
```

这段代码里，`string1`在整个外侧作用域结束前都是有效的，而`string2`在整个内侧作用域结束前都是有效的，所以`result`的生命周期就到整个内侧作用域结束。运行这段代码，你会发现它通过了借用检查器，编译通过并输出了`The longest string is long string is long`。

下面让我们再看一个例子，以理解`result`的生命周期必须是两个参数的最小交集。我们将`result`变量的声明移动到内侧作用域之外，而`string2`的声明和`result`的赋值仍在内侧作用域内。然后我们将使用了`result`的`println!`也移动到内侧作用域后，也就是其结束后，这样的代码无法通过编译：

```rust
fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
    }
    println!("The longest string is {result}");
}
```

当我们尝试编译时，报错如下：

```
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0597]: `string2` does not live long enough
 --> src/main.rs:6:44
  |
5 |         let string2 = String::from("xyz");
  |             ------- binding `string2` declared here
6 |         result = longest(string1.as_str(), string2.as_str());
  |                                            ^^^^^^^ borrowed value does not live long enough
7 |     }
  |     - `string2` dropped here while still borrowed
8 |     println!("The longest string is {result}");
  |                                     -------- borrow later used here

For more information about this error, try `rustc --explain E0597`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

错误信息告诉我们，要想让`result`在`println!`中是有效的，`string2`必须存活到外侧作用域结束。Rust通过函数签名中的生命周期标注推断得知了这个结果。

作为人类来说，我们可以查看这段代码，然后明确知道`string1`比`string2`长，因此`result`会包含`string1`的引用。因为`string1`在外侧作用域中，所以在`println!`中使用它也是有效的。然而，编译器无法理解这种情况，我们已经告诉Rust`longest`函数的返回值是其参数的最小交集。因此，借用检查器拒绝了这段代码。

你可以尝试将各种生命周期的值传入`longest`函数，看看其返回值的生命周期。你可以尝试自己推断，再进行编译查看，验证你的想法。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：生命周期用于判断一个对象是否“存活”，或者引用是否超过了其引用对象的生命周期。

</template>
<template #quiz>

以下哪种错误是通过生命周期可以避免的？

<Radio>
<Option label="没有为对象分配足够的内存" />
<Option label="没有预先检查错误的可能性就使用了一个算式的结果" />
<Option label="在一个对象的内存被释放后使用了它" answer />
<Option label="数据下标越界" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：如果一个函数的签名表述它返回了生命周期为`'a`的引用，那么它就不能返回其他的生命周期，也就是`y`的`'b`。

</template>
<template #quiz>

<IsCompileText />

```rust
fn shortest<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    if x.len() < y.len() {
        x
    } else {
        y
    }
}

fn main() {
    println!("{}", shortest("hello", "rust"));
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>
</QuizProvider>
:::

## 从生命周期的角度思考

生命周期的定义方式取决于你函数的行为。比如，如果我们修改了`longest`函数的实现，让它永远返回第一个参数，那么我们并不需要进行生命周期的标注了，但下面的代码仍然可以通过编译：

```rust
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

我们为参数`x`和返回值声明了生命周期参数`'a`，但没有为`y`进行任何标注，因为它和`x`以及函数返回值没有任何关系。

当一个函数返回引用时，返回值的生命周期至少要和函数的某个参数相同。如果没有，那么它引用的值必然是在这个函数内创建的。这样的情况会产生悬空引用，因为函数结束时会销毁这个变量。因此这样的`longest`实现是无法编译通过的：

```rust
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let result = String::from("really long string");
    result.as_str()
}
```

这里，尽管我们指明了函数的返回值的生命周期为`'a`，这样的实现仍然无法通过编译。因为返回值的生命周期并没有和参数的生命周期相关联。下面是报错信息：

```
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0515]: cannot return value referencing local variable `result`
  --> src/main.rs:11:5
   |
11 |     result.as_str()
   |     ------^^^^^^^^^
   |     |
   |     returns a value referencing data owned by the current function
   |     `result` is borrowed here

For more information about this error, try `rustc --explain E0515`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

问题在于`result`离开了作用域，其引用值在`longest`函数结束时被销毁了。我们还尝试在函数中返回一个引用。无论我们如何标注生命周期，都无法改变悬空引用的问题，而Rust不会允许我们创建一个悬空引用。这种情况下，最好的方式就是返回一个拥有所有权的值，而不是引用，这样，调用的函数就会负责清理这个值。

总而言之，生命周期语法在于连接函数的多个参数与其返回值之间的关系。一旦他们被连接，Rust就有了足够的信息来允许内存安全的操作，阻止悬空引用或其他违反内存安全的行为。

## 结构体定义中的生命周期标注

到目前为止，我们声明的结构体都持有了含所有权的类型。但我们也可以定义持有引用的结构体，但这种情况下，我们就需要给结构体定义中的每个引用都加上生命周期标注。下面的结构体`ImportantExcerpt`包含了一个字符串切片的引用：

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    let i = ImportantExcerpt {
        part: first_sentence,
    };
}
```

这个结构体有一个属性`part`，它包含了一个字符串切片，也就是一个引用。就像泛型一样，我们需要在结构体的名字后增加一个尖括号，在其中书写泛型生命周期参数。这样的声明表示`ImportantExcerpt`不能比其属性`part`存活的时间更长。

`main`函数创建了一个`ImportantExcerpt`的实例，它持有了对变量`novel`所有的`String`的第一行的引用。`novel`中的数据在`ImportantExcerpt`实例被实例化之前就存在了。此外，`novel`也没有在`ImportantExcerpt`实例离开作用域之前离开，所以`ImportantExcerpt`实例中的引用是有效的。

## 生命周期省略规则

你已经了解到了每一个引用都有生命周期，且你需要给使用了引用的函数和结构体进行生命周期标注。然而，下面的代码无需生命周期标注，也可以进行编译：

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item === b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

这样的函数能够编译是因为一些历史原因：在Rust的早期版本（pre1.0）中，这样的代码无法通过编译，因为当时每个引用都需要显式的生命周期。那种情况下，函数的签名需要被书写为：

```rust
fn first_word<'a>(s: &'a str) -> &'a str {
```

在开发了大量的Rust代码后，Rust团队发现开发者总是在某些情况下重复地书写一些代码。这种情况是可以被预测的，且有一定的规律。Rust团队将这些规律内置到了Rust编译器中，这样，借用检查器就能对一些特定的情况进行推导，而不需要开发者手动标注生命周期。

提及这段Rust历史的原因是，未来随着越来越多的规律被发现，生命周期的标注会变得越来越少。

这些被编写到Rust编译器中的规律被称为*生命周期省略规则（lifetime elision rules）*。这些规则并不是为了让开发者进行效仿的；它们只是一些编译器能够考虑到的特定情况，如果你的代码满足这些情况，那么你就无需显式地进行生命周期标注。

忽略规则并不能做到完美。如果在Rust应用这些规则后，引用的生命周期仍然不明确，编译器不会猜测剩余引用的生命周期应该是什么，而是会抛出一个错误，让开发者来进行明确的标注。

函数或者方法上的生命周期参数称为*输入生命周期（input lifetimes）*，而返回值的生命周期称为*输出生命周期（output lifetimes）*。

当生命周期没有被显式标注时，编译器会使用三条规则来推断。第一条规则适用于输入生命周期，第二、三条规则适用于输出生命周期。如果编译器无法从这三条规则中推断出所有引用的生命周期，那么编译器就会抛出一个错误。这些规则适用于`fn`关键字和`impl`代码块。

第一条规则是，编译器会尝试为每一个入参赋予一个不同的生命周期参数。类似`&'_ i32`需要一个生命周期参数，而`ImportantExcerpt<'_>`也需要一个生命周期参数，比如：

- 函数`fn foo(x: &i32)`会获得一个生命周期参数，即`fn foo<'a>(x: &'a i32)`。
- 函数`fn foo(x: &i32, y: &i32)`会获得两个生命周期参数，即`fn foo<'a, 'b>(x: &'a i32, y: &'b i32)`。
- 函数`fn foo(x: &ImportantExcerpt)`会获得两个生命周期参数，即`fn foo<'a, 'b>(x: &'a ImportantExcerpt<'b>)`。

第二条规则是，如果函数只有一个入参，那么这个参数的生命周期会被赋值给所有的输出生命周期参数。

第三条规则是，如果函数有多个参数，且其中一个为`&self`或者`&mut self`（也就是说这是一个方法），那么`self`的生命周期会赋值给所有的输出生命周期参数，这条规则大大增加了方法的可读性和开发的速度，因为我们几乎不需要标注任何的生命周期。

假设我们就是编译器。我们要遵循上面的规则来推断下面函数`first_word`签名中引用的生命周期，一个没有任何生命周期标注的函数为：

```rust
fn first_word(s: &str) -> &str {
```

编译器遵循第一条规则，为每一个入参都赋予一个生命周期参数，我们按照习惯就使用`'a`来命名，因此函数签名变为：

```rust
fn first_word<'a>(s: &'a str) -> &str {
```

第二条规则也是符合的，因为这个函数只有一个入参，根据第二条规则，单个参数的输入生命周期参数会被赋值给所有的输出生命周期参数，所以函数签名变为：

```rust
fn first_word<'a>(s: &'a str) -> &'a str {
```

现在函数签名中的所有引用都有了生命周期标注，编译器可以继续进行分析了，整个过程无需开发者进行任何的显式标注。

我们再看一个例子，这次我们使用之前的没有任何的生命周期参数版本的`longest`函数：

```rust
fn longest(x: &str, y: &str) -> &str {
```

根据第一条规则：每个参数都会获取独特的生命周期参数。这一次我们有两个参数，所以函数签名变为：

```rust
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {
```

不难发现，这个函数不符合第二条规则，因为它有两个入参。第三条规则也不符合，因为`longest`函数不是一个方法，它没有`self`类型的参数。在遍历了三条规则后，我们仍然无法判断函数返回值的生命周期。这就是为什么我们看到了之前的报错：编译器遍历了所有的规则仍然无法为函数签名中的所有引用类型进行生命周期标注。

由于第三条规则只适用于方法签名，我们会在下一节中讨论它，以及为什么这条规则可以大大减少方法的生命周期标注。

## 方法定义中的生命周期标注

要在结构体的方法实现中标注生命周期的语法和在结构体上定义泛型参数相同。在哪里定义、使用生命周期参数取决于它们是关联于结构体的字段还是方法的参数或返回值。

对于与结构体字段相关联的生命周期，需要在`impl`关键字后进行定义，然后在结构体的名字后使用，因为这些生命周期是结构体类型的一部分。

对于`impl`代码块内的方法前面，引用可能会被绑定到结构体某个引用类型的字段上，也可能是完全独立的。因此，生命周期忽略规则总是适用于方法签名。我们可以使用之前定义的`ImportantExcerpt`结构体来演示几个例子。

首先，我们定义一个方法`level`，它只接收一个参数，类型为`self`的引用，返回值为`i32`，非引用类型：

```rust
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}
```

`impl`后定义的生命周期参数，以及类型名后的对它的使用都是必须的，但我们不需要为`self`标注生命周期，因为它满足第一条生命周期忽略规则。

下面是一个适用于第三条规则的例子：

```rust
impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> & str {
        println!("Attention please: {announcement}");
        self.part
    }
}
```

这个方法有两个输入生命周期，因此Rust根据第一条规则，给予了`&self`和`&announcement`独立的生命周期参数。然后，因此其中一个参数是`&self`，所以返回值获得了`&self`的生命周期，至此所有的生命周期都被标注了。

## 静态生命周期

Rust中还存在一种特殊的生命周期，静态生命周期，即`'static`，它表示引用*可以*在整个程序运行期间存活。所有的字符串字面量都拥有`'static`生命周期，我们也可以像这样标注：

```rust
let s: &'static str = "I have a static lifetime.";
```

这个字符串的文本被直接存储到了程序的二进制中，它永远是可用的。因此，所有字符串字面量的生命周期都是`'static`。

你可能会看到一些在错误信息上使用`'static`的建议。但在为引用加上`'static`标注之前，请仔细思考你的引用是否真的在整个程序运行期间存活，以及这是否是你想要的。大多数情况下，错误信息中提示使用`'static`都是由于试图创建悬空引用或可用生命周期不匹配导致的，你应该解决那些问题，而不是使用`'static`生命周期。

## 泛型、trait约束和生命周期同时使用

我们来简单看看泛型、trait约束和生命周期同时使用的情况！

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display
{
    println!("Announcement! {ann}");
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

这个函数和之前的`longest`函数作用类似，但它会接收一个额外的类型为`T`的参数`ann`，`where`后的代码指定了它可以传入任何实现了`Display`trait的类型。这个额外的参数使用`{}`进行打印，这也是为什么它需要`Display`trait。由于生命周期也是泛型的一种，泛型生命周期参数`'a`和泛型类型参数`T`都在函数名后的尖括号中进行声明。

::: details 小测（3）
<QuizProvider>
<Quiz>
<template #description>

解析：`'static`表示“在整个程序内存活”，所以标注了`'static`的引用必须永远不被销毁。另外，尽管通常情况下`'static`标注的引用都是不可变的，但`'static`本身和可变性没有任何联系。

</template>
<template #quiz>

如果一个引用的生命周期为`'static`，那么表示：

<Radio>
<Option label="引用的数据是可以被修改的" />
<Option label="引用的数据存储在内存的静态区域" />
<Option label="引用的数据永远不会被销毁" answer />
<Option label="引用的数据不是动态的" />
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：结构体接受单个生命周期参数，函数的输出也只有一个生命周期，所以Rust推断它们是一样的。

</template>
<template #quiz>

下面的函数签名没有进行类型标注

```rust
struct Foo<'a> {
    bar: &'a i32
}

fn baz(f: Foo) -> &i32 { /* ... */ }
```

Rust会接收这样的函数签名吗？如果接收，它推导出的函数类型是什么样子的？

<Radio>
<Option label="Rust会拒绝这个函数签名" />
<Option>

```rust
fn baz(f: Foo) -> &i32
```

</Option>
<Option>

```rust
fn baz<'a>(f: Foo<'a>) -> &i32
```

</Option>
<Option>

```rust
fn baz<'a>(f: Foo) -> &'a i32
```

</Option>
<Option answer>

```rust
fn baz<'a>(f: Foo<'a>) -> &'a i32
```

</Option>
</Radio>

</template>
</Quiz>

<Quiz>
<template #description>

解析：Rust不会编译这个程序，因为返回值的的生命周期要绑定为`&Foo`的生命周期还是`Foo.bar`的生命周期是不明确的。

</template>
<template #quiz>

下面的函数签名没有进行类型标注

```rust
struct Foo<'a> {
    bar: &'a i32
}

// Foo变为了&Foo
fn baz(f: &Foo) -> &i32 { /* ... */ }
```

Rust会接收这样的函数签名吗？如果接收，它推导出的函数类型是什么样子的？

<Radio>
<Option label="Rust会拒绝这个函数签名" answer />
<Option>

```rust
fn baz(f: &Foo) -> &i32
```

</Option>
<Option>

```rust
fn baz<'a>(f: &Foo<'a>) -> &'a i32
```

</Option>
<Option>

```rust
fn baz<'a>(f: &'a Foo) -> &'a i32
```

</Option>
<Option>

```rust
fn baz<'a, 'b>(f: &'a Foo<'b>) -> &'a i32
```

</Option>
<Option>

```rust
fn baz<'a, 'b>(f: &'a Foo<'b>) -> &'b i32
```

</Option>
</Radio>

</template>
</Quiz>
</QuizProvider>
:::

## 总结

真是内容丰富的一章！现在你已经了解了泛型类型参数，trait和trait约束，以及泛型生命周期参数，通过它们开发的代码可以大大减少重复性。泛型类型参数允许你的代码接受不同的类型。Trait和trait约束能保证泛型类型的行为是符合需求的。你也学到了如何使用生命周期标注来保证灵活的代码不会产生任何悬空引用。以上所有的分析均在编译时进行，不会影响任何的运行时性能！

也许有些难以置信，但本章要讨论的大部分主题都还远远没有结束：第17章会讨论trait对象————另一种使用trait的方式。生命周期也还包括很多更复杂的场景，在Rust的引用文档中可以找到。下一章，我们会讨论如何在Rust中编写测试，以保证代码的正确性。
