# 智能指针

*指针*是一个很常见的概念，它表示一个包含了一个内存地址的变量。而地址引用了，或者说“指向了”某些数据。Rust中最常见的指针就是引用，我们已经在第四章讨论过了。引用使用`&`符号表示，它允许你借用指向值。除了引用数据外，它们没有其他特殊的功能，并且没有额外的开销。

而*智能指针*则不同，它们是一种行为和指针类似，但拥有额外元数据和能力的数据结构。智能指针的概念并非Rust独有：它起源于C++，在其他语言中也存在。Rust标准库提供了各种各样的智能指针，它们可以提供引用实现不了的功能。要探索这些概念，我们会展示几个不同的智能指针的例子，包括*引用计数（reference counting）*智能指针类型。它通过跟踪所有者的数量来让你的数据被多个拥有者共享，当没有拥有者留存时，清理数据。

在有着所有权和借用概念的Rust中，引用和智能指针有一些额外的不同：引用大部分情况下只能借用数据，而智能指针可以*拥有*其指向的数据。

尽管这个名字我们可能第一次听说，但前文中我们已经接触了一些智能指针，包括第八章的`String`和`Vec<T>`。这些类型都算作智能指针，因为它们拥有了一些内存，且允许你操作它。它们也有一些元数据，额外的能力和限制。比如，`String`会将其容量存储为元数据，同时保证了其存储的数据永远为合法的UTF-8。

智能指针通常使用结构体实现。和普通结构体不同的是，智能指针会实现`Deref`和`Drop`这两个traits。`Deref`trait允许一个智能指针结构体的实例表现的像一个引用，这样你可以使用引用的语法来操作它们。`Drop`trait允许你自定义实例离开作用域时要运行的代码。这一章，我们会讨论这两种trait，并证明它们对于智能指针的重要性。

考虑到智能指针范式在Rust中被频繁涉及，这一章不会讨论每一个现存的智能指针。许多库都定义了他们自己的智能指针，你也可以自己实现。我们会介绍标准库中最常见的智能指针：

- `Box<T>`，用于分配堆内存。
- `Rc<T>`，一个引用计数类型，用于启用多所有权。
- `Ref<T>`和`RefMut<T>`，通过`RefCell<T>`访问，它会强制运行时的借用规则，而不是编译时。

此外，我们还会介绍*内部可变性（interior mutability）*，即可变的类型通过暴露接口来允许修改内部的值。我们也会讨论*循环引用（reference cycles）*：为什么它们会引发内存泄露，以及如何避免它们。

我们开始吧！