<script setup>
import {
  QuizProvider,
  Quiz,
  Checkbox,
  Option
} from "../../components/quiz"
</script>

# 面向对象语言特性

关于面向对象语言该拥有什么样的特性，社区没有达成共识。Rust受到了很多编程语言范式的影响，其中就包括OOP；比如，我们在第13章中介绍了一些来自函数式编程的特性。可以说，OOP类的语言通常有以下特性，对象，封装和继承。我们来看看这些特性是什么，以及Rust是如何支持它们的。

## 对象包括数据和行为

《设计模式：可复用面向对象软件的基础》（作者：Erich Gamma、Richard Helm、Ralph Johnson 和 John Vlissides，Addison-Wesley Professional，1994 年），俗称“The Gang of Four”，是一部面向对象设计模式的目录。书中这样定义面向对象编程（OOP）：

> [!NOTE]
> 面向对象程序由对象组成。一个*对象*将数据和程序对数据的行动打包在一起。后者通常称为*方法*或者*操作*。

基于这个定义，Rust就是面向对象的：结构体和枚举内有数据，而`impl`代码块给结构体和枚举提供了方法。尽管带有方法的结构体和枚举不*叫做*对象，但根据书中对于对象的定义，它们提供了相同的功能。

## 封装，隐藏实现细节

另一个和OOP有关的概念是*封装（encapsulation）*，也就是说一个对象的实现细节对于对象的使用者来说是不可访问的。因此，唯一能够和对象进行交互的方式就是通过其公共的API；使用对象的代码不应该拥有访问对象内部和直接修改数据、行为的能力。这样开发者可以修改和重构对象的内部实现，而无需调整使用它们的代码。

我们在第7章讨论了如何控制封装：我们可以使用`pub`关键字来决定代码中的哪些模块、类型、函数和方法是公开的，而其他的一切默认都是私有的。比如，你可以定义一个结构体`AveragedCollection`，它有一个字段，存储了一个`i32`的集合。这个结构体还有一个字段，存储了集合中数字的平均值，也就是说，这个平均值不需要在任何人有需求时进行计算。换句话说，`AveragedCollection`会缓存计算的平均值。下面的代码就是`AveragedCollection`的定义：

```rust
pub struct AveragedCollection {
    list: Vec<i32>,
    average: f64,
}
```

这个结构体本身被标记为`pub`，这样其他的代码可以使用它，但其中的字段保持私有。这种情况下很重要，因为我们需要保证不管是集合中的元素增加还是减少，平均值都会自动更新。下面的代码里，我们为结构体实现了`add`，`remove`和`average`方法：

```rust
impl AveragedCollection {
    pub fn add(&mut self, value: i32) {
        self.list.push(value);
        self.update_average();
    }

    pub fn remove(&mut self) -> Option<i32>{
        let result = self.list.pop();
        match result {
            Some(value) {
                self.update_average();
                Some(value)
            }
            None => None,
        }
    }

    pub fn average(&self) -> f64 {
        self.average
    }

    fn update_average(&mut self) {
        let total: i32 = self.list.iter().sum();
        self.average = total as f64 / self.list.len() as f64;
    }
}
```

公共方法`add`，`remove`和`average`是仅有的访问、修改`AveragedCollection`实例数据的方式。当一个元素通过`add`方法插入`list`，或使用`remove`方法移出时，它们的实现都会调用私有方法`update_average`，它会更新`average`字段。

我们保留`list`和`average`为私有的，这样外侧代码就没有办法直接对`list`字段进行插入或删除操作；否则，`average`字段可能和`list`的变化不同步。`average`方法会返回`average`字段的值，允许外部代码读取`average`，但不允许修改它。

由于我们对结构体`AveragedCollection`结构体的实现细节进行了封装，我们可以在未来很容易地调整，比如数据结构。对于实例来说，我们可以将`list`字段从`Vec<i32>`调整为`HashSet<i32>`。只要公共方法`add`、`remove`和`average`的签名保持不变。使用`AveragedCollection`的代码就不需要做任何修改。如果我们将`list`设置为公开，这种调整就无法实现了：`HashSet<i32>`和`Vec<i32>`对于添加、删除元素的方法是不同的，所以外部的代码也需要做调整。

如果封装是一个语言被看做面向对象的必要条件，那么Rust也是符合要求的。对`pub`的自由使用决定了不同代码片段对实现细节的封装。

## 继承，作为类型系统和代码共享的工具

*继承（inheritance）*是一种允许对象从其他对象的定义里继承元素的机制，你可以获取父对象的数据和行为，而无需重复定义。

如果一个语言需要支持继承才能看做面向对象语言，那么Rust就不符合要求。在不使用宏的情况下，Rust无法定义一个继承父结构体的数据和方法实现的结构体。

然而，如果你习惯于在代码中使用继承，那么Rust也提供了其他策略，这些策略会回到你使用继承的出发点。

你选择继承的原因大致有两个。一个是代码复用，你可以为一个类型实现特定的行为，继承允许你在不同的类型里复用这些实现。你可以通过Rust中默认trait方法实现来大致实现这一点，比如在第10章中，我们给`Summary`trait添加了`summarize`方法的默认实现。任何实现了`Summary`trait的类型，其`summarize`方法都是可用的，不需要进一步的开发。这和子类从父类继承方法的实现很类似。在实现`Summary`trait时，我们可以重写`summarize`的默认实现，这和子类重写继承方法的实现很类似。

使用继承的另一个原因和类型系统有关：为了在一个地方同时使用子类和父类。也叫做*多态（polymorphism）*，即你可以使用一类对象互相替代。

> [!NOTE]
> ### 多态
> 很多人可能以为多态和继承是一个意思。但它其实是一个更普遍的概念，指的是可以处理多种数据类型的代码。在继承中，那些类型就是子类型。
> Rust使用泛型来抽象不同可能性的类型，并通过特征约束来限制这些类型必须提供的内容。这有时被称为*有界含参多态（bounded parametric polymorphism）*。

现在，继承在程序设计模式中不再像过去那样受欢迎了，因为它往往会导致代码的过度分享。子类不应该共享来自父类的全部特征，但是在继承中，它是会这么干的。这样可能会导致程序设计很不灵活。同时也会引入在子类上调用一些毫无道理的方法的风险，进而导致错误。此外，一些语言只允许单继承（即一个子类只能继承一个父类），进一步限制了程序设计的灵活性。

出于这些原因，Rust尝试了不同的方式，采用trait对象替代了继承。我们来看看trait对象如何在Rust中实现多态。

::: details 小测（1）
<QuizProvider>
<Quiz>
<template #description>

解析：Rust中存在对象（也就是结构体）和封装（通过`pub`关键字实现），但不存在继承。

</template>
<template #quiz>

Rust实现了以下哪一种面向对象语言特性？

<Checkbox>
<Option label="私有数据的封装" answer />
<Option label="从父类继承方法" />
<Option label="带有方法的对象" answer />
</Checkbox>

</template>
</Quiz>
</QuizProvider>
:::
