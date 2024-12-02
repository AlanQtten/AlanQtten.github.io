# 性能比较：循环 vs 迭代器

要决定使用循环还是迭代器，你需要先知道哪一个实现速度更快：是使用:`for`循环版本的`search`还是使用迭代器版本的`search`。

我们可以运行一个基准测试，加载Sir Arthur Conan Doyle的作品*福尔摩斯探案集（The Adventures of Sherlock Holmes）*全本书的内容到一个`String`中，然后查询其中的*the*。下面是两个版本的`search`运行的基准测试：

```rust
test bench_search_for  ... bench:  19,620,300 ns/iter (+/- 915,700)
test bench_search_iter ... bench:  19,234,900 ns/iter (+/- 657,200)
```

迭代器的版本小幅领先！我们不会深入讨论这里的基准测试代码，因为这里的重点不是展示这两个版本是相同的，而是从性能的角度对比这两种实现。

如果想要得到更综合性的基准测试，你可以使用不同的文字，以及不同大小的`contents`，不同的单词（对应不同长度的`query`），以及其他各种组合。重点在于：迭代器，尽管封装了更高级的抽象，最终会被编译为类似你首先的低抽象层级的代码。迭代器是Rust中的*零依赖抽象（zero-cost abstractions）*之一，也就是说这些抽象不会带来任何附加的运行时开销。这和Bjarne Stroustrup，C++的设计者和实现者，所说的一样，他在“C++基础（Foundations of C++）（2012）”中定义了*零开销（zero-overhead）*：

> 通常，C++的实现遵循零开销原则：不使用的特性不会带来额外开销。此外，使用的特性也已优化至无法更优的手写代码。

再举一个例子，下面的代码来自一个音频解码器。解码算法使用线性预测数学运算，通过先前样本的线性函数来估计未来的值。这段代码使用迭代器链来对本地的三个变量运行一些数学操作：一个数据的`buffer`切片，一个存储了12个`coefficients`的数组，一个存储偏移数量的`qlp_shift`。这些变量定义时没有给予任何值；尽管这段代码脱离其上下文后没有太多意义，它仍然是一段简洁、真实的代码，展示了Rust如何将高级抽象翻译为低级代码。

```rust
let buffer: &mut [i32];
let coefficients: [i64; 12];
let qlp_shift: i16;

for i in 12..buffer.len() {
    let prediction = coefficients.iter()
                                 .zip(&buffer[i - 12..i])
                                 .map(|(&c, &s)| c * s as i64)
                                 .sum::<i64> >> qlp_shift;
    let delta = buffer[i];
    buffer[i] = prediction as i32 + delta;
}
```

为了计算预测值，此代码遍历`coefficients`中的12个值，使用`zip`方法将系数值与`buffer`中之前的12个值配对。然后，对每对值相乘，累加所有结果，并将总和右移`qlp_shift`位。

在诸如音频解码器等应用中，计算往往优先考虑性能。在这里，我们创建了一个迭代器，使用了两个适配器，最后消费了该值。那么，这段Rust代码会编译成什么汇编代码呢？截至目前，它编译的汇编代码和手写的完全相同。没有与遍历`coefficients`中值对应的循环：Rust知道有12次迭代，因此会将循环“展开”。循环展开是一种优化方式，它移除控制循环的开销代码，直接生成每次迭代的重复代码。

所有系数都存储在寄存器中，这使得访问这些值非常快。在运行时，数组访问也没有边界检查。Rust应用的所有这些优化让生成的代码极为高效。了解这些后，你可以放心地使用迭代器和闭包了！它们让代码显得更高级，但不会带来运行时性能损耗。

## 总结

闭包和迭代器是Rust受函数式编程语言启发而添加的特性。它们给予了Rust能够清晰地表达高层级的抽象，同时仅消耗低层级的性能。闭包和迭代器的实现使得运行时的性能完全不受影响。这也是Rust的目标之一，努力提供零开销的抽象。

现在我们提高了我们I/O项目的表述，我们来看看`cargo`是如何帮助我们将项目与世界分享的。