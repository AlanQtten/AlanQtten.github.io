<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  Option
} from "../../components/quiz"
</script>

# 通过`Sync`和`Send`Traits实现可扩展的并发

有趣的是，Rust设计了*很少*的并发特性。本章我们讨论的每一个并发功能都来自标准库，而非语言本身。你处理并发的方式也不会被标准库或语言所限制；你可以自己开发办法功能，或使用其他人开发的版本。

然而，有两个并发的概念被嵌入到了语言中：`std::marker`提供的trait，`Sync`和`Send`。

## 使用`Send`来实现跨线程的所有权转移

`Send`标记trait表面实现了这个trait类型的值的所有权可以跨线程转移。几乎所有的Rust类型都实现了`Send`，但也有例外，比如`Rc<T`：它不能实现`Send`，因为如果你复制了一个`Rc<T>`的值，并尝试将其复制体的所有权转移到其他线程里，那么两个线程可能会同时更新引用计数。出于这个原因，`Rc<T>`的实现只考虑了单线程的使用场景，这样你也不需要为了线程安全而付出性能代价。

因此，Rust的类型系统和trait边界保证了你不会意外地将一个`Rc<T>`不安全地移动到线程内。如果我们这么做了，类似上一节的例子，我们会收到错误``the trait `Send` is not implemented for `Rc<Mutex<i32>>` ``。当我们换为了`Arc<T>`，它实现了`Send`，代码可以编译通过了。

任何完全由`Send`类型组成的类型也会被自动标记为`Send`。几乎所有的原始类型都实现了`Send`，除了原始指针，这部分我们会在第19章讨论。

## 使用`Sync`来实现多线程访问

`Sync`标记trait表面实现了这个trait类型的值可以安全地被多个线程引用。换句话说，当任何实现了`Sync`的`T`的`&T`（对`T`的不可变引用）被`Send`时，引用都会被安全地发送到其他线程。类似`Send`，原始类型全部是`Sync`的，且完全由`Sync`类型组成的类型也会被自动标记为`Sync`。

`Sync`是Rust中和“线程安全”最类似的概念，即，特定的数据片段可以被多线程安全地使用。`Sync`和`Send`trait被分开的原因是它们可能会单独存在、同时存在，或都不存在。比如：

- 智能指针`Rc<T>`既没有实现`Send`，也没有实现`Sync`，原因之前已经提过。
- `RefCell<T>`类型（我们在第15章讨论过的）以及相关的`Cell<T>`家族都实现了`Send`（如果`T: Send`），但它们都没有实现`Sync`。一个`RefCell`可以跨线程发送，但不能被并发访问，因为运行时的借用检查实现的`RefCell<T>`不是线程安全的。
- 智能指针`Mutex<T>`实现了`Send`和`Sync`，如你在上一章看到的，它可以被用于跨线程的共享访问。
- `Mutex::lock`返回的类型`MutexGuard<'a, T>`（如果`T: Sync`）实现了`Sync`，但没有实现`Send`。它被设计为不允许`Send`，因为[某些平台要求互斥体需要被锁定者解锁](https://github.com/rust-lang/rust/issues/23465#issuecomment-82730326)。

## 手动实现`Send`和`Sync`是不安全的

因为由实现了`Send`和`Sync`trait的类型组成的类型会自动被标记为`Send`和`Sync`，所以我们不需要手动实现这些类型。作为标记trait，它们也没有办法实现。它们只是为了强制和并发相关的不变量。

手动实现这些trait的过程需要不安全的Rust代码。我们会在第19章讨论不安全的Rust代码；现在，你需要知道的事手动实现`Send`和`Sync`的类型需要谨慎的思考来保证安全性。你可以查看[The Rustonomicon](https://doc.rust-lang.org/nomicon/index.html)来了解更多内容。

## 总结

这不是本书中最后一次提及并发：下一章会聚焦异步编程，而第20章的项目会涉及本章概念的实际使用，而不仅仅是简单的例子。

就像之前提到的一样，由于Rust中只有很少一部分并发特性是由语言本身处理的，所以有很多crate都实现了并发策略。它们比标准库发展地更快，所以，请务必关注最新、最优雅的多线程处理crate。

Rust标准库提过了用于消息传递的通道，以及在多线程的上下文中使用的智能指针，比如`Mutex<T>`和`Arc<T>`。类型系统和借用检查器会保证使用了这些方案的代码不会发生竞态问题或者无效引用。一旦你的代码通过了编译，你就可以放心地运行它，而不用担心类似其他语言中出现的难以复现追踪的多线程问题。并发编程不再是一个令人害怕的概念：无畏并发，放心开发！

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：在线程间传递`DbConnection`是可行的，所以`DbConnection`实现了`Send`。但如果类似一个`Arc<Database>`被多个线程共享，并调用`db.query()`是不可行的，所以`DbConnection`不应该实现`Sync`。

</template>
<template #quiz>

假设你定义了一个用于数据库连接的API：

```rust
struct DbConnection { /* ... */ }
impl DbConnection {
    fn query(&self) -> DbResult {
        /* ... */
    }
}
```

你的数据库不支持单个连接的并发查询。`DbConnection`应该实现以下哪些标记trait?

<Radio>
<Option label="Send" />
<Option label="Send和Sync都不需要" />
<Option label="Send和Sync" />
<Option label="Sync" />
</Radio>

</template>
</Quiz>
</QuizProvider>
:::
