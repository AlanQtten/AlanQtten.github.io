<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  RadioHolder,
} from "../../components/quiz"

</script>

# 组织测试结构

就像这一章开始时提到的，测试是非常复杂的，不同的人可能会使用不同的术语和结构。Rust社区认为测试主要分为两大类：单元测试和集成测试。*单元测试*是比较小型的、更加聚焦于某个点的单个模块的独立测试，它们通常被用于对私有接口进行测试。*集成测试*一般会独立于你的库，模拟外侧代码对你库的调用，通常它们会测试公有的接口，且涉及多个模块。

不管你在书写哪一种测试，你都需要确保它们的行为是符合预期的，不管是分开还是一起。

## 单元测试

单元测试的目的是为了队代码的各个最小单元进行独立测试，以快速验证代码是否存在问题。单元测试通常就放在你要测试的代码旁，也就是*src*目录中。最方便的方式就是在每个文件里创建一个`tests`模块，在其内部开发测试代码，并使用`#[cfg(test)]`属性来标记这个模块。

### 测试模块和`#[cfg(test)]`

`tests`模块上的`#[cfg(test)]`注解会让Rust了解到这部分代码只会在运行`cargo test`时编译运行，而在`cargo build`时忽略。这样做可以省下你编译库时的时间，且最终的打包产物也会更小，因为测试代码不会被包含进去。由于集成测试书写在一个完全不同的目录里，它们并不需要`#[cfg(test)]`标注。然而单元测试就书写在源码的同个文件里，因此你必须通过`#[cfg(test)]`明确哪些代码不会被编译。

回顾本章第一节中我们生成的新项目`adder`，Cargo为我们生成了如下代码：

```rust
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

在自动生成的`tests`模块里，`cfg`属性是*configuration*的缩写，告诉Rust后面的元素应该被看错一个特定的配置项。在本例中，这个配置项就是`test`，也就对应了Rust提供的编译和运行测试的能力，Cargo只会在我们运行`cargo test`时才会编译测试代码。也包括任何在这个模块内的辅助函数，当然也包括标注了`#[test]`的函数。

### 测试私有函数

在社区中，私有函数是不是应该被直接进行测试是存在分歧的，很多其他的语言也是没有测试私有函数的功能的。不管你赞同哪种观点，Rust的私有规则都提供了能让你测试私有函数的能力。下面的代码就存在一个私有函数`internal_adder`：

```rust
pub fn add_two(a: usize) -> usize {
    internal_adder(a, 2)
}

fn internal_adder(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal() {
        let result = internal_adder(2, 2);
        assert_eq!(result, 4);
    }
}
```

注意`internal_adder`函数没有被标注为`pub`。测试只是Rust的代码，`tests`模块只是一个普通的模块。就像我们在模块树一节中提到过的，子模块可以访问祖先模块的元素。在这个测试中，我们使用`use super::*`将父级的所有内容全部带入了`tests`模块，因此我们可以在测试模块内调用`internal_adder`函数。如果你认为私有函数不应该被测试，Rust也不会强制你这么做。

## 集成测试

在Rust中，集成测试是完全独立于你的库的。它们会像任何外界的代码一样使用你的库，也就是说它们只会调用你的公共接口。它们的目的是为了保证代码的各个部分组合后仍然能够正常工作。即便代码独立工作时是正常的，它们仍有可能在组合后出现问题，所以集成测试的覆盖也一样重要。要创建集成测试，你需要*tests*目录。

### `tests`目录

首先，我们要在项目的根目录下创建一个*tests*目录，和*src*平级。这样Cargo就知道这个目录下的文件是集成测试文件。之后我们就可以在这个目录下放置任意数量的测试文件，Cargo会将每一个文件编译为独立的crate。

让我们来创建一个集成测试。*src/lib.rs*的代码仍然和上面保持一致，我们创建*tests*目录，创建文件*tests/integration_test.rs*。工程目录如下：

```
adder
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── integration_test.rs
```

在*tests/integration_test.rs*中，我们可以编写如下代码：

```rust
use adder::add_two;

#[test]
fn it_adds_two() {
    let result = add_two(2);
    assert_eq!(result, 4);
}
```

*tests*目录下的每一个文件都是一个独立的crate，所以我们需要在每一个测试crate中引入我们的库。也就是本例中的`use adder::add_two`，而在单元测试中则不需要这一行。

我们也不需要在*tests/integration_test.rs*中标注`#[cfg(test)]`。因为Cargo会特殊处理*tests*目录，这部分代码只会在运行`cargo test`时编译。运行`cargo test`，结果如下：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.31s
     Running unittests src/lib.rs (target/debug/deps/adder-1082c4b063a8fbe6)

running 1 test
test tests::internal ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/integration_test.rs (target/debug/deps/integration_test-1082c4b063a8fbe6)

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出的三部分分别对应了单元测试，集成测试和文档测试。注意，如果任何一个部分失败了，剩余的部分都不会继续运行。比如，如果单元测试失败了，那么集成测试和文档测试部分都不会有任何的输出，因为它们不会运行。

第一部分的输出和我们之前看到的一样：每个单元测试独占一行（这里仅有`internal`），以及最终的总结行。

集成测试部分的开始打印了`Running tests/integration_test.rs`。然后，集成测试中的每一个测试都会独占一行，最终会有对集成测试的总结，就在`Doc-tests adder`开始之前。

每一个集成测试都会有独立的输出小节，如果我们继续给*tests*目录添加文件，输出中就会有更多的集成测试小节。

我们仍然可以通过`cargo test`的参数指定哪些测试应该被运行。如果要单独运行某个集成测试文件，可以使用`--test`参数，并携带集成测试文件的文件名：

```
$ cargo test --test integration_test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.64s
     Running tests/integration_test.rs (target/debug/deps/integration_test-82e7799c1bc62298)

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

这条命令只会运行*tests/integration_test.rs*中的测试。

### 集成测试中的子模块

随着集成测试的增加，你也许希望在*tests*目录下添加一些文件来更好地组织代码；比如，你可以根据测试功能的不同进行分组。我们之前提过，*tests*目录下的每一个文件都会编译为独立的crate，这对于创建独立的测试来说非常有用，这样的行为也更接近使用你代码的用户。然而，这也以为这*tests*目录下的文件不能和*src*下的代码一样处理，就像第七章中介绍的如何将代码分离为模块和文件。

如果你有一些需要在多个集成测试文件中共享的辅助函数，而你希望遵循第7章中学到的步骤将它们拆解到同一个模块中，*tests*目录这样设计的不便性可能会很突出。比如，如果你创建了*tests/common.rs*，然后在其中放置了`setup`函数，其中可能包括了各个测试中都需要的准备工作：

```rust
pub fn setup() {
    // 为你的库定制的准备工作
}
```

再次运行测试，我们会看到输出中多了一个小节，来自*common.rs*文件，尽管这个文件没有包含任何的测试文件，我们也没有在任何的地方调用`setup`函数：

```
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.89s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::internal ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/common.rs (target/debug/deps/common-92948b65e88960b4)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/integration_test.rs (target/debug/deps/integration_test-92948b65e88960b4)

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出中出现的`common`和`running 0 tests`显然不是我们想要的。我们只是想让各个集成测试公有代码而已。要避免这个问题，我们就不要创建*tests/common.rs*，取而代之的是*tests/common/mod.rs*，此时项目结构如下：

```
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    ├── common
    │   └── mod.rs
    └── integration_test.rs
```

有关Rust中这些名字的规则和转换我们已经在第7章中进行过介绍。这样的文件结构可以让Rust明白`common`模块并不是一个集成测试文件。我们可以将`setup`函数的代码移动到*test/common/mod.rs*中并删除*tests/common.rs*文件，测试输出中就不会再包含这个小节了。*tests*目录下的子目录中的文件不会在各个crate中被重复编译，也不会作为测试输出的小节。

在我们创建了*tests/common/mod.rs*后，我们可以在任何集成测试文件中引入它。下面就是在*tests/integration_test.rs*内，`it_adds_two`测试中调用`setup`函数的例子：

```rust
use adder::add_two;

mod common;

#[test]
fn it_adds_two() {
    common::setup();

    let result = add_two(2);
    assert_eq!(result, 4);
}
```

请注意这里的`mod common;`和我们第七章中介绍的模块操作完全一样。之后我们就可以在测试函数中调用`common::setup()`了。

### 二进制crate的集成测试

如果我们的项目是一个二进制的crate，它只包含*src/main.rs*文件，没有*src/lib.rs*文件，我们就不能在*tests*目录下创建集成测试文件，并使用`use`将*src/main.rs*中定义的内容进行引入。只有库crate才会暴露其他crate可以使用的内容，二进制crate设计之初就是为了自行运行的。

这就是为什么提供二进制文件的Rust项目通常会有一个简单的*src/main.rs*文件来调用位于*src/lib.rs*文件的原因之一。这样的结构下，集成测试可以通过`use`来测试库crate中各种重要的函数。如果这些函数可以正常工作，那么*src/main.rs*中微乎其微的代码也是可以正常工作的，这部分代码不需要进行测试。

## 总结

Rust的测试功能提供了一种方式来确保代码的运行方式符合预期，就算你进行了一些改变。单元测试会对代码的各个部分进行独立测试，它们还能测试私有的实现细节。集成测试会将代码的各个部分统一考虑，它们会和外界的代码一样使用库的公共接口。尽管Rust的类型系统和所有权规则已经避免了大部分漏洞，测试的重要性仍然不容小觑，它们能够帮助你的代码减少逻辑错误。

结合之前学到的各种知识，下一章我们来开发一个真正的项目！

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：所有的文件内的单元测试都可以访问私有函数，与是否在`mod tests`中无关。

</template>
<template #quiz>

以下哪个选项**不是**将单元测试放置在`#[cfg(test)] mod tests { ... }`中的原因？

<RadioHolder>
<Radio label="这种方式使得测试可以访问私有函数" answer />
<Radio label="这种方式分离了测试辅助函数和源代码" />
<Radio label="这种方式可以提高编译的效率" />
<Radio label="这种方式可以减少打包产物的体积" />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
