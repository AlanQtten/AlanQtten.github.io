<script setup>
import {
  QuizProvider,
  Quiz,
  Radio,
  RadioHolder,
} from "../../components/quiz"
</script>

# 通过配置文件来定制化构建

在Rust中，*发布配置（release profiles）*是预定义、可自定义的，它可以允许开发者定义不同的配置来控制代码编译的各个过程。每一个配置都是独立的。

Rust提供了两个主要的配置：`dev`配置是用于`cargo build`运行时使用的，而`release`配置是用于`cargo build --release`运行时使用的。`dev`配置是为了开发过程而服务，而`release`配置是为了发布而服务的。

这些配置的名字你可能在构建代码的输出中看到过：

```
$ cargo build
    Finished dev [unoptimized + debuginfo] target(s) in 0.0s
$ cargo build --release
    Finished release [optimized] target(s) in 0.0s
```

可以看到编译器使用了`dev`和`release`这两种不同的配置。

如果你没有在*Cargo.toml*添加任何`[profile.*]`的片段，Cargo会使用各个场景下的默认的配置。如果你想要自定义，那么可以添加`[profile.*]`的片段，它会覆盖默认配置。比如，下面是`dev`和`release`配置下的`opt-level`的默认值：

```toml
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3
```

`opt-level`用来控制Rust编译器的优化级别，从0到3。越大的数字表示越多的优化，也会消耗越多的编译时间，所以如果你在开发代码，而又在不停地编译，你可以减少优化来加快调试的速度。`dev`配置的`opt-level`也因此默认为`0`。如果你已经准备好发布你的代码了，最后多花些时间编译。代码发布时你只会编译一次，但你需要运行编译后的代码很多次，所以发布模式用更慢的编译时换来了更快的运行时。这也是为什么`opt-level`在`release`配置下默认为`3`。

你可以在*Cargo.toml*中添加一个不同的值来覆盖默认配置。比如，如果我们像在开发模式下使用优化等级1，我们可以添加如下配置：

```toml
[profile.dev]
opt-level = 1
```

这段配置会覆盖`0`。现在当我们运行`cargo build`时，Cargo会使用默认的`dev`配置和我们的`opt-level`自定义配置。由于我们设置了`opt-level`为`1`，Cargo会进行一些优化，但不会像`release`配置那么多。

要查看完整的配置选项和配置的默认值，你可以查看[Cargo的文档](https://doc.rust-lang.org/cargo/reference/profiles.html)。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：为了最小化编译时间，默认的配置为`dev`。如果你想使用`release`配置，你可以添加`--release`，这样编译时间会更久，但代码执行会更快。（没有`build`这个配置）。

</template>
<template #quiz>

如果你运行`cargo build`且不附加任何参数，默认会使用下面哪一个配置？

<RadioHolder>
<Radio label="build" />
<Radio label="dev" answer />
<Radio label="release" />
</RadioHolder>

</template>
</Quiz>
</QuizProvider>
:::
