<script setup>
import {
  QuizProvider,
  Quiz,
  Checkbox,
  Option,
  IsCompileText,
  IsCompile
} from "../../components/quiz"
</script>

# 通过`Drop`trait来运行清理代码

对智能指针来说还有一个重要的trait，就是`Drop`，它允许你自定义值离开作用域时的行为。你可以为任何类型实现`Drop`trait，比如释放文件资源或者网络连接。

我们在介绍智能指针的章节引入`Drop`的原因是，你几乎总是需要为智能指针实现`Drop`trait。比如，如果一个`Box<T>`被释放，那么它会销毁其指向的堆内存。

在某些语言里，开发者需要在每一次使用完这些类型的实例后主动调用代码来释放内存或资源。比如文件的句柄，socket或者锁。如果他们忘记了，那么系统就会产生额外的负担，甚至崩溃。在Rust里，你可以自定义一个值被释放时要执行的代码，编译器会将这部分代码自动插入到合适的地方。最终，你无需担心清理代码要放在那些实例使用结束的地方————你的资源也不会泄露！

你可以通过实现`Drop`trait来指定值离开作用域时要执行的代码。`Drop`trait要求你实现一个`drop`方法，它接收一个可变`self`作为参数。要了解Rust是如何调用`drop`的，我们先来试试在`drop`中插入`println!`声明。

下面的代码中展示了`CustomSmartPointer`结构体自定义了实例离开作用域时的行为，也就是打印`Dropping CustomSmartPointer!`：

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };
    println!("CustomSmartPointers created.");
}
```

`Drop`trait已经被预置了，所以我们不需要引入。我们为`CustomSmartPointer`实现了`Drop`trait，提供了一个调用`println!`的`drop`方法。`drop`方法的函数体内可以书写任何你希望实例离开作用域时运行的代码。我们这里打印一段文字，来看看Rust何时调用的`drop`。

在`main`函数中，我们创建了两个`CustomSmartPointer`实例，然后打印了`CustomSmartPointers created`。在`main`函数最后，我们的`CustomSmartPointer`实例会离开作用域，Rust会调用`drop`方法。注意我们不需要显式地调用`drop`方法。

当我们运行程序时，可以看到输出如下：

```
$ cargo run
   Compiling drop-example v0.1.0 (file:///projects/drop-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.60s
     Running `target/debug/drop-example`
CustomSmartPointers created.
Dropping CustomSmartPointer with data `other stuff`!
Dropping CustomSmartPointer with data `my stuff`!
```

Rust在实例离开作用域时自动帮我们调用了`drop`方法，运行了我们指定的代码。变量销毁的顺序和他们创建的顺序刚好相反，所以`d`会在`c`前被销毁。这个例子的目的是展示`drop`方法工作的方式；当然，通常你需要指定清理代码而不是仅仅打印一些文字。

## 使用`std::mem::drop`提前释放值

不幸的是，想要禁用`drop`的功能并不简单。禁用`drop`通常来说是没有必要的；`Drop`trait的存在就是为了自动化。然而，在某些极端情况下，你可能想要提前运行清理函数。比如使用智能指针来管理锁的情况：你可以希望强制运行`drop`函数来释放锁，这样同个作用域内的其他代码就可以获取锁。Rust不允许你直接调用`Drop`trait的`drop`方法；但是你可以调用标准库提供的`std::mem::drop`方法，如果你想强制释放一个值。

如果你想要手动调用`Drop`trait的`drop`方法，比如对`main`函数进行如下调整，你会看到一个编译错误：

```rust
fn main() {
    let c = CustomSmartPointer {
        data: String::from("some data"),
    };
    println!("CustomSmartPointer created.");
    c.drop();
    println!("CustomSmartPointer dropped before the end of main.");
}
```

编译这段代码，错误如下：

```
$ cargo run
   Compiling drop-example v0.1.0 (file:///projects/drop-example)
error[E0040]: explicit use of destructor method
  --> src/main.rs:16:7
   |
16 |     c.drop();
   |       ^^^^ explicit destructor calls not allowed
   |
help: consider using `drop` function
   |
16 |     drop(c);
   |     +++++ ~

For more information about this error, try `rustc --explain E0040`.
error: could not compile `drop-example` (bin "drop-example") due to 1 previous error
```

错误信息明确说明了我们不能显式地调用`drop`方法。错误信息中出现了术语*destructor（析构函数）*，这是一个通用编程术语，表示一个用来清理实例的函数。一个析构函数和*构造函数（constructor）*类似，只不过后者用来创造实例。Rust中的`drop`函数就是一个特别的析构函数。

Rust不允许我们显式地调用`drop`方法是因为Rust会在`main`函数结束时自动调用`drop`。如果允许用户调研，可能会造成*重复释放（double free）*。

我们无法禁用`drop`在值离开作用域时的自动插入，我们也不能显式地调用`drop`方法。所以，如果我们需要强制提前清理一个值，我们就需要使用`std::mem::drop`函数。

`std::mem::drop`函数和`Drop`trait上的`drop`方法不同。我们需要将我们希望强制清理的值作为参数传递给他。这个函数也是预置的，所以我们可以调整上面的代码：

```rust
fn main() {
    let c = CustomSmartPointer {
        data: String::from("some data"),
    };
    println!("CustomSmartPointer created.");
    drop(c);
    println!("CustomSmartPointer dropped before the end of main.");
}
```

运行代码，输出如下：

```
$ cargo run
   Compiling drop-example v0.1.0 (file:///projects/drop-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.73s
     Running `target/debug/drop-example`
CustomSmartPointer created.
Dropping CustomSmartPointer with data `some data`!
CustomSmartPointer dropped before the end of main.
```

``Dropping CustomSmartPointer with data `some data`!``被打印在了`CustomSmartPointer created.`和`CustomSmartPointer dropped before the end of main.`文本之间，也就表明`drop`方法提前释放了`c`。

你可以随意使用`Drop`trait中定义的代码，来让清理过程既方便又快捷：比如，你可以创建你自己的内存分配器！结合`Drop`trait和所有权系统，你不需要思考何时清理，因为Rust会自动处理。

你也不需要担心不小心清理了正在使用中的值：所有权系统确保了引用是永远有效的，也就确保了`drop`只会在值永远不会被使用后调用一次。

现在我们已经了解了`Box<T>`和智能指针的特点，我们来看看标准库中定义的其他智能指针吧。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：一个被拥有的值不能被释放两次，所以调用两次`drop`无法通过编译。

</template>
<template #quiz>
<IsCompileText />

```rust
struct Example(i32);
impl Drop for Example {
    fn drop(&mut self) {
        self.0 += 1;
        println!("drop {}", self.0);
    }
}
fn main() {
    let e = Example(0);
    drop(e);
    drop(e);
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：任何使用`s`导致的移动并丢弃返回值都会导致`s`被释放。然而，`s.drop()`是不能被直接调用的。

</template>
<template #quiz>

假设现有如下代码，分配了一个字符串：

```rust
fn main() {
    let mut s = String::new();
    ----
}
```

以下哪一个操作填入下划线处后会导致`s`被释放？

<Checkbox>
<Option label="drop(s);" answer />
<Option label="s.drop();" />
<Option label="(|_| ())(s);" answer />
<Option label="{ s };" answer />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
