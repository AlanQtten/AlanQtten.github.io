<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  RadioHolder,
  Input
} from "../../components/quiz"
</script>

# Cargo工作空间

在第12章，我们创建了一个包，它包含一个二进制crate和一个crate库。随着工程的开发，你可能会发现你的crate库越来越大，这时你就想将它拆分为多个crate库。Cargo内置了一个功能，名为*工作空间*，它可以管理多个串联开发，且互有关联的包。

## 创建一个工作区

一个*工作空间*就是一系列的包，它们共享同样的*Cargo.lock*和输出目录。我们可以使用工作空间来创建一个工程————这里我们使用一些琐碎的代码，方便我们关注工作空间的结构。有很多工作空间的结构可供选择，所以我们先展示最常见的一种。我们的工作空间会包含一个二进制和两个库。二级制是为了提供主要的函数功能，它会依赖两个库。第一个库会提供`add_one`函数，第二个库会提供`add_two`函数。这三个crate都会作为同一个工作空间的一部分。我们先创建一个工作空间目录：

```bash
$ mkdir add
$ cd add
```

接着，在*add*目录下，我们创建一个*Cargo.toml*文件，它会对整个工作空间进行配置。这个文件没有`[package]`章节。与之相反的是，它会从`[workspace]`章节开始，这个章节允许我们给工作空间添加成员，这里我们将我们的二进制crate的路径添加进去；也就是*adder*：

```toml
[workspace]

members = [ "adder", ]
```

接着，我们可以使用`cargo new`在*add*目录下创建一个`adder`二进制crate：

```bash
$ cargo new adder
     Created binary (application) `adder` package
```

此时，我们可以运行`cargo build`来对整个工作空间进行构建。*add*目录下的文件应如：

```
├── Cargo.lock
├── Cargo.toml
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

可以看到只有工作区的顶层有一个*target*文件夹，它存放了编译产物；`adder`包内并没有*target*文件夹。尽管我们是在*adder*目录下运行的`cargo build`，但编译产物还是会放在*add/target*而不是*add/adder/target*里。Cargo这样组织*target*的目录是因为工作区内的crate就应该互相依赖。如果各个crate有自己独立的*target*目录，那么它们还需要对其依赖的crate进行打包，并将结果存放在*target*目录下。通过共享一个*target*目录，crate之间可以避免无效的重复打包。

## 在工作空间下创建第二个包

接着，我们再在工作空间下创建一个包，名字叫做`add_one`。顶层的*Cargo.toml*也需要调整，以将*add_one*的路径添加到`members`列表中：

```toml
[workspace]

members = [
  "adder",
  "add_one",
]
```

接着，创建新的库crate，名字叫做`add_one`：

```bash
$ cargo new add_one --lib
     Created library `add_one` package

```

*add*目录下的目录和文件应为：

```
├── Cargo.lock
├── Cargo.toml
├── add_one
│   ├── Cargo.toml
│   └── src
│       └── lib.rs
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

在*add_one/src/lib.rs*文件里，我们添加一个`add_one`函数：

```rust
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

现在我们可以让我们的`adder`二进制包以来我们的`add_one`库包了。首先，我们需要将`add_one`在*adder/Cargo.toml*下声明为依赖：

```toml
[dependencies]
add_one = { path = "../add_one" }
```

Cargo不会预先认为工作区下的包存在互相依赖，所以我们需要指明依赖关系。

接着，我们可以在`adder`crate内调用`add_one`函数（来自`add_one`crate）。打开*adder/src/main.rs*文件，在顶部添加`use`行，将`add_one`库crate引入当前域。然后修改`main`函数，调用`add_one`函数：

```rust
use add_one;

fn main() {
    let num = 10;
    println!("Hello, world! {num} plus one is {}!", add_one::add_one(num));
}
```

我们可以在顶层的*add*目录下运行`cargo build`打包整个工作空间：

```bash
$ cargo build
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 0.68s
```

要在*add*目录下运行二进制crate，我们可以使用`cargo run`和`-p`指定的参数来指定具体要运行工作空间下的哪个包：

```bash
$ cargo run -p adder
    Finished dev [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/adder`
Hello, world! 10 plus one is 11!
```

这样*adder/src/main.rs*中的代码就会运行，它依赖了`add_one`crate。

### 在工作空间下依赖外部包

注意工作空间仅在顶层包含一个*Cargo.lock*文件，而不是在每个crate的目录里都有。这样的设计保证了所有的crate都使用了相同版本的依赖。如果我们给*adder/Cargo.toml*和*add_one/Cargo.toml*文件都添加`rand`这个包，Cargo会将它们解析为同一个版本，并记录在*Cargo.lock*中。所有的crate使用相同版本的依赖也就意味着它们永远是互相兼容的。我们可以在*add_one/Cargo.toml*文件中添加`[dependencies]`小节和`rand`crate，这样我们就能在`add_one`中使用它了：

```toml
[dependencies]
rand = "0.8.5"
```

我们可以在*add_one/src/lib.rs*文件中添加`use rand;`了，此时在根目录*add*下运行`cargo build`会引入并编译`rand`crate。我们会收到一个警告，因为我们没有使用我们引入的`rand`：

```
$ cargo build
    Updating crates.io index
  Downloaded rand v0.8.5
   --snip--
   Compiling rand v0.8.5
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
warning: unused import: `rand`
 --> add_one/src/lib.rs:1:5
  |
1 | use rand;
  |     ^^^^
  |
  = note: `#[warn(unused_imports)]` on by default

warning: `add_one` (lib) generated 1 warning
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished dev [unoptimized + debuginfo] target(s) in 10.18s
```

此时顶层的*Cargo.lock*包含了`add_one`对`rand`的依赖信息。然而，即便`rand`已经在工作空间下的某个地方被使用了，我们还是无法直接在其他crate里使用它，除非我们给对应的*Cargo.toml*文件中添加`rand`依赖。比如，如果我们在`adder`包下的*adder/src/main.rs*文件中添加`use rand;`，我们会看到如下报错：

```
$ cargo build
  --snip--
   Compiling adder v0.1.0 (file:///projects/add/adder)
error[E0432]: unresolved import `rand`
 --> adder/src/main.rs:2:5
  |
2 | use rand;
  |     ^^^^ no external crate `rand`
```

要修复这个问题，我们要编辑`adder`包下的*Cargo.toml*文件，并指明`rand`是一个依赖。此时对`adder`的构建会将`rand`作为它的依赖，*Cargo.lock*中会进行记录，但并不会下载额外的`rand`。Cargo会保证工作空间里的每个包下的每个crate都使用同一个版本的`rand`，只要他们声明的`rand`版本是兼容的，这样做为我们省下了一些空间，也省去了我们检查依赖兼容性的繁琐工作。

如果工作空间下的某个crate声明了同一个依赖的不兼容版本，Cargo会逐个解析它们，但仍然会尝试使用最小兼容版本。

注意Cargo只能保证遵循了(Semantic Versioning)[https://semver.org/]的包的兼容性。比如，假设工作空间里的一个crate依赖了0.8.0版本的`rand`，而另一个crate依赖了0.8.1版本的`rand`。根据semver规则，0.8.1和0.8.0是兼容的（或者一个更高的次版本，比如0.8.2）。但是如果有一个crate依赖了0.7.0版本，那么根据semver规则，它们是不兼容的。因此，Cargo会为各个crate引入不同版本的`rand`。

### 在工作空间下添加测试

我们再来看看其他增强，比如给`add_one`crate下的`add_one::add_one`函数添加一个测试：

```rust
pub fn add_one(x: i32) -> i32 {
    x + 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(3, add_one(2));
    }
}
```

此时我们可以在*add*根目录下运行`cargo test`。在工作空间下运行`cargo test`会运行所有crate下的测试：

```
$ cargo test
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished test [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src/lib.rs (target/debug/deps/add_one-f0253159197f7841)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/adder-49979ff40686fa8e)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests add_one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出的第一部分展示了`add_one`crate的`it_works`测试通过了。第二部分展示了`adder`crate下没有任何测试，最后一部分展示了`add_one`下没有发现任何文档测试。

我们也可以使用`-p`参数来指定只运行某个crate下的测试：

```
$ cargo test -p add_one
    Finished test [unoptimized + debuginfo] target(s) in 0.00s
     Running unittests src/lib.rs (target/debug/deps/add_one-b3235fea9a156f74)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests add_one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出显示了`cargo test`只运行了`add_one`crate下的测试，并没有运行`adder`crate下的测试。

如果你要将工作空间下的crate推送到[crates.io](https://crates.io/)，那么工作空间下的每个crate需要分别推送。就像`cargo test`一样，你可以可以使用`-p`标记和crate的名字来推送指定的crate。

作为额外的练习，尝试像`add_one`一样给工作空间添加一个`add_two`crate吧！

随着项目的增长，你可以考虑使用工作空间：小的、独立的组件比一大包代码更容易理解。此外，在一个工作空间下维护多个crate也能让代码更加协调，因为它们经常同时改变。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：从`a`的角度看，`b`就和其他的外部crate一样，所以你无需使用额外的前缀来访问它。

</template>
<template #quiz>

现有一个工作空间，结构如下：

```
├── Cargo.lock
├── Cargo.toml
└── crates
    ├── a
    |   ├── lib.rs
    |   └── Cargo.toml
    └── b
        ├── lib.rs
        └── Cargo.toml
```

各个文件的内容如下：

```rust
// crates/b/lib.rs
pub fn f() {}
```

```toml
# crates/a/Cargo.toml
[dependencies]
b = { path = "../b" }
```

在*a/lib.rs*里，要使用哪个路径引用`f`？

<RadioHolder>
<Radio label="b::f" answer />
<Radio label="crates::b::f" />
<Radio label="workspace::b::f" />
<Radio label="super::b::f" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：根据语义化版本号的规则，`a`和`c`都可以共享同一个次版本号（也就是`0.8`）下的修订版本号。而`b`则需要使用`0.7`次版本下的最后一个修订版本号。所以我们一共需要两个版本。

</template>
<template #quiz>

假设现有一个工作空间，它下面有三个包，a，b，c，它们的依赖清单如下：

```toml
# a/Cargo.toml
[dependencies]
rand = "0.8.4"
```

```toml
# b/Cargo.toml
[dependencies]
rand = "0.7.3"
```

```toml
# c/Cargo.toml
[dependencies]
rand = "0.8.5"
```

如果对工作空间下的所有包进行编译，那么有多少个版本的`rand`会被使用？用数字表示你的答案。

<Input answer="2" />

</template>
</Quiz>
</QuizProvider>
:::
