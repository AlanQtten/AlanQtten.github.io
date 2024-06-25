<script setup>
import {
  QuizProvider,
  Quiz,
  RadioHolder,
  Radio,
  IsCompile,
  IsCompileText
} from "../components/quiz"
import ShikiCode from "../components/code/ShikiCode.vue"
import { lr } from "../utils/renderer"
import {
  R,
  O,
  W
} from "../components/letter"
import {
  Wrapper,
  MemoryGraph
} from "../components/memory-graph"

</script>

# 方法

方法和函数类似：都使用`fn`关键字和方法名来定义，都可以包含参数和返回值，都包含了一些在调用时才会运行的代码。和函数不同的是，方法是在结构体的上下文中（或者在枚举或特性对象中，这部分分别会在第六章、第十七章讨论）被定义的，它们的第一个参数永远是`self`，它代表了调用这个方法的结构体实例。

## 定义方法

我们可以把一个拥有`Rectangle`实例作为参数的`area`函数改为一个在`Rectangle`结构体内部定义的`area`方法，代码如下：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels",
        rect1.area()
    )
}
```

要在`Rectangle`的上下文中定义一个函数，我们需要使用`impl`关键字（implementation的缩写）。`impl`块中所有的内容都会和`Rectangle`关联。然后我们将`area`函数移动到`impl`的大括号内，修改它的第一个（在这个例子里，也是唯一一个）参数为`self`，它的使用当然也要一起更改。在`main`函数中，对函数的调用也可以修改为*方法语法*。方法语法紧跟在实例后面：我们添加了一个点、函数的名字的圆括号，无需任何参数。

在`area`的签名中，我们使用了`&self`而不是`rectangle: &Rectangle`。实际上，`&self`是`self: &Self`的简写。在`impl`块中，`Self`是对`impl`作用类型的简写。方法的第一个参数必须是一个`Self`类型、名字叫做`self`的参数，所以Rust允许你简写成`self`。请注意，如果需要借用`Self`实例，那么在`self`前面仍需标注`&`来明确指定，就像`rectangle: &Rectangle`一样。方法可以获取`self`的所有权，借用`self`的不可变引用，就像我们这里做的一样，当然也可以借用`self`的不可变引用，就像其他普通的参数一样。

这里我们选择`&self`的原因和我们在之前的函数版本中使用`&Rectangle`的原因是一样的：我们不希望获取所有权，只希望读取结构体的数据，无需写入。如果我们希望通过调用方法来修改实例的部分内容，那么我们应该在第一个参数使用`&mut self`。使用`self`来直接移动所有权的方法是十分少见的；这种情况基本上只会发生在我们希望对`self`进行转换，在调用方法后不希望用户再继续使用这个实例了的情况。

使用方法而不是函数的主要原因是，除了提供了函数语法，无需在每个函数中定义`self`的类型外，对代码的组织也是是什么有利的。可以将所有和实例相关的操作都放置在`impl`块中，而不是在库中到处书写，然后通过手动搜索`Rectangle`来查找相关代码。

方法的名字可以和结构体字段的名字相同。比如，我们可以给`Rectangle`类型定义一个`width`方法：

```rust
impl Rectangle {
    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    if rect1.width() {
        println!("The rectangle has a nonzero width; it is {}", rect1.width);
    }
}
```

这里，我们在`width`方法中判断了实例`width`字段和`0`的对比结果。我们可以在方法中随意使用同名字段。在`main`函数中，当我们给`rect1.width`后面加上一对小括号，Rust便知道我们指的是方法`width`。当我们不加小括号时，Rust知道我们指的是`width`字段。

通常来说，字段和方法名完全一致表示这个方法只会返回这个字段，不进行其他操作（但不是永远如此）。这类方法成为*getter*，Rust不会像一些其他语言一样，为字段自动实现它们。*getter*对于实现私有属性来说十分有用，你可以将字段设为私有，方法设为公有，从而在类型的公共API中启用对这个字段的只读访问。我们会在第七章讨论公有和私有的含义以及如何将类型变为公有或私有。

## 多参数的方法

让我们通过为`Rectangle`引入第二个方法来进行练习。这一次我们会接收另一个`Rectangle`作为参数，如果它能被`self`（当前实例）所容纳就返回`true`，否则返回`false`。当这个方法`can_hold`写完后，我们可以这样使用：

```rust
fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

期望的输出应该如下，因为`rect2`比`rect1`小，但`rect3`比`rect1`大：

```
Can rect1 hold rect2? true
Can rect1 hold rect3? false
```

现在我们已经知道我们想要定义一个方法，它应该存在于`impl Rectangle`代码块内。方法名字叫做`can_hold`，它会接收另一个`Rectangle`实例的不可变借用作为参数。我们可以从方法调用的地方推断出参数的类型：`rect1.can_hold(&rect2)`传递了`&rect2`，它是对`rect2`————一个`Rectangle`实例的不可变引用。这是合理的，因为我们只需要读取`rect2`（不需要写，否则需要一个可变借用），而且我们希望`main`函数在调用后保留`rect2`的所有权，供之后使用。`can_hold`函数的返回值是一个布尔值，它的实现会检查`self`的宽、高是否大于另一个`Rectangle`的宽、高。我们可以为`impl`块添加`can_hold`方法：

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

当我们运行这段代码，我们会得到上面的输出。方法可以在`self`参数后继续增加参数签名来接收多个参数，这些参数和函数参数的工作原理是相同的。

## 关联函数

`impl`块中定义的所有函数统称为*关联函数*，因为它们和`impl`后书写的类型相关联。在定义关联函数时，如果它们不需要类型实例，那么第一个参数可以不为`self`（因此，它们也就不是方法了）。我们已经使用过一个类似的函数了：定义在`String`类型上的`String::from`。

关联函数常常被用在构造函数上，这类函数会返回结构体的实例，它们被称为`new`，但`new`并不是一个语言内置的功能。比如，我们可以提供一个名字叫做`square`的函数，他只接受一个参数，这个参数的值会赋给宽和高，这就创建了一个正方形的`Rectangle`，无需重复定义新的类型：

```rust
impl Rectangle {
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }
}
```

函数返回值和函数体中的`Self`关键字都是`impl`指定类型的别名，在这个例子里，也就是`Rectangle`。

要调用这种关联函数，我们需要使用结构体的名字加上`::`；比如`let sq = Rectangle::square(3);`。函数的命名空间是结构体：`::`可以用在关联函数和模块创建的命名空间里。我们会在第七章讨论模块。

## 多个`impl`块

每个结构体都可以拥有多个`impl`块。比如，下面的代码和之前实现的代码作用相同：

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

这里的两个方法其实没什么理由分为两个`impl`，但这仍然是合法的语法。我们会在第十章讨论泛型和特性时看到多`impl`的实用场景。

## 方法调用时函数调用的语法糖

综合我们已经讨论过的概念，我们应该明白，方法调用是函数调用的语法糖。比如，如果我们的结构体有`area`和`set_width`方法：

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn set_width(&mut self, width: u32) {
        self.width = width;
    }
}
```

假设我们有一个实例`r`。那么方法调用`r.area()`和`r.set_width(2)`和下面的代码是相同的：

```rust
    let mut r = Rectangle {
        width: 1,
        height: 2
    };
    let area1 = r.area();
    let area2 = Rectangle::area(&r);
    assert_eq!(area1, area2);

    r.set_width(2);
    Rectangle::set_width(&mut r, 2);
```

`r.area()`变为了`Rectangle::area(&r)`。函数的名字是关联函数`Rectangle::area`。函数的参数是`&self`。Rust自动插入了借用符`&`。

> [!NOTE]
> 如果你对C/C++比较熟悉，那么你可能习惯于`r.area()`和`r->area()`这两种语法。Rust没有箭头符号`->`，使用点语法时，Rust会自动进行引用和解引用。

类似的，`r.set_width(2)`变为了`String::set_width(&mut r, 2)`。这个函数期望一个`&mut self`，所以第一个参数需要可变借用`&mut r`。第二个参数完全一样，是数字2。

就像我们在4.3讨论过的，Rust会自动插入所需要的引用和解引用（不管需要多少）来让类型和`self`参数匹配。比如，下面就是两种对一个包装过的`Rectangle`实例的可变引用的`area`方法调用：

```rust
    let r = &mut Box::new(Rectangle {
        width: 1,
        height: 2
    });
    let area1 = r.area();
    let area2 = Rectangle::area(&**r);
    assert_eq!(area1, area2);
```

Rust会自动添加两次解引用（一次为了可变引用，一次为了Box）然后使用一个不可变借用符号，因为`area`期望一个`&Rectangle`。注意这里我们在4.2中讨论过，也是一种把可变引用“降级”为共享引用的方式。相反，你不能调用`set_width`并传入一个`&Rectangle`或者`&Box<Rectangle>`。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：Rust没有为构造函数设计专门的关键字。符合语义习惯的方式是使用`new`，但并不是语言强制的。

</template>
<template #quiz>

Rust中构造函数的关键字是什么？

<RadioHolder>
<Radio label="constructor" />
<Radio label="new" />
<Radio label="类型的名字" />
<Radio label="都不是" answer />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：方法只能为类型实现（比如`impl Point`），不能为变量实现（比如`p`）。

</template>
<template #quiz>
<IsCompileText />

```rust
struct Point(i32, i32);
fn main() {
    let p = Point(1, 2);

    impl p {
        fn x(&self) -> i32 { self.0 }
    }

    println!("{}", p.x())
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>
</QuizProvider>
:::

## 方法和所有权

就像我们在4.2中讨论过的，结构体对方法的调用必须包含必要的权限。为了提供示例，我们会展示三个方法，分别使用`&self`、`&mut self`和`self`：

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn set_width(&mut self, width: u32) {
        self.width = width;
    }

    fn max(self, other: Rectangle) -> Rectangle {
        Rectangle {
            width: self.width.max(other.width),
            height: self.height.max(other.height)
        }
    }
}
```

## `&self`和`&mut self`的读写

如果你通过`let rect = Rectangle { ... }`创建了一个拥有数据所有权的`rectangle`，那么`rect`有<R />和<O />权限。带着这些权限，实例可以调用`area`和`max`方法：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 3: return lr({
          perms: [
            { var: 'rect', operation: 'g', P: ['p', 'e', 'p'], collapse: true },
            { var: 'rect.width', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'rect.height', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 5: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'other_rect', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other_rect.width', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other_rect.height', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 6: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'rect', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'rect.width', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'rect.height', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'other_rect', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'other_rect.width', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'other_rect.height', operation: 'e', P: ['s', 'e', 's'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let rect = Rectangle {
    width: 0,
    height: 0
};
println("{}", rect/*[!perm R]*/.area());
let other_rect = Rectangle { width: 1, height: 1 };
let max_rect = rect/*[!perm_double R.O]*/.max(/*[!perm_double R.O]*/other_rect);` })'
/>

然而，如果我们调用`set_width`，那么会缺少<W />权限：

<ShikiCode
  :init-code='() => ({ lang: "rust", code: `let rect = Rectangle {
    width: 0,
    height: 0
};
rect/*[!perm_double R.W.{"letterBProps":{"missing":true}}]*/.set_width(0);` })'
/>

Rust会拒绝这段程序：

```
error[E0596]: cannot borrow `rect` as mutable, as it is not declared as mutable
  --> test.rs:28:1
   |
24 | let rect = Rectangle {
   |     ---- help: consider changing this to be mutable: `mut rect`
...
28 | rect.set_width(0);
   | ^^^^^^^^^^^^^^^^^ cannot borrow as mutable
```

如果我们对一个`Rectangle`实例的不可变引用调用`set_width`，那么我们会看到类似的错误，即使实例本身是可变的：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 4: return lr({
          perms: [
            { var: 'rect', operation: 'g', P: 'p', collapse: true },
            { var: 'rect.width', operation: 'g', P: 'p' },
            { var: 'rect.height', operation: 'g', P: 'p' },
          ]
        })
        case 6: return lr({
          perms: [
            { var: '*rect_ref', operation: 'g', P: ['p', 'e', 'e'], collapse: true },
            { var: 'rect', operation: 'b', P: 's' },
            { var: 'rect.width', operation: 'b', P: 's' },
            { var: 'rect.height', operation: 'b', P: 's' },
            { var: 'rect_ref', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '(*rect_ref).width', operation: 'g', P: ['p', 'e', 'e'] },
            { var: '(*rect_ref).height', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `// 给let声明增加了mut关键字
let mut rect = Rectangle {
    width: 0,
    height: 0
};
rect/*[!perm_double R.W]*/.set_width(1); // 这里是OK的
let rect_ref = &/*[!perm R.{"collapse":true}]*/ref;
rect_ref/*[!perm_double R.W.{"letterBProps":{"missing":true}}]*/.set_width(2); // 这里仍然是不行的` })'
/>

## `self`的移动

调用一个方法也就代表着把`self`移动结构体实例（除非这个结构体实现了`Copy`特性）。比如，如果我们在传入给`max`方法后继续使用`Rectangle`实例：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 3: return lr({
          perms: [
            { var: 'rect', operation: 'g', P: ['p', 'e', 'p'], collapse: true },
            { var: 'rect.width', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'rect.height', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 7: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'other_rect', operation: 'g', P: ['p', 'e', 'p'], collapse: true },
            { var: 'other_rect.width', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other_rect.height', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 8: return lr({
          perms: [
            { var: 'rect', operation: 'e', P: ['s', 'e', 's'], collapse: true },
            { var: 'rect.width', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'rect.height', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'other_rect', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'other_rect.width', operation: 'e', P: ['s', 'e', 's'] },
            { var: 'other_rect.height', operation: 'e', P: ['s', 'e', 's'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `let rect = Rectangle {
    width: 0,
    height: 0
};
let other_rect = Rectangle {
    width: 1,
    height: 1
};
let max_rect = rect/*[!perm_double R.O.{"collapse":true}]*/.max(/*[!perm_double R.O.{"collapse":true}]*/other_rect);
println!("{}", rect/*[!perm R.{"collapse":true}]*/.area());` })'
/>

一旦我们调用了`rect.max(..)`，我们就移动了`rect`，它丢失了所有权限。编译上面的代码，错误如下：

```
error[E0382]: borrow of moved value: `rect`
  --> test.rs:33:16
   |
24 | let rect = Rectangle {
   |     ---- move occurs because `rect` has type `Rectangle`, which does not implement the `Copy` trait
...
32 | let max_rect = rect.max(other_rect);
   |                     --------------- `rect` moved due to this method call
33 | println!("{}", rect.area());
   |                ^^^^^^^^^^^ value borrowed here after move
```

如果我们在一个引用上调用方法，也会发生类似的情况。比如，如果我们有一个`set_to_max`方法，给`self`赋值了`self.max(..)`的返回值：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 2: return lr({
          perms: [
            { var: '*self', operation: 'g', P: ['p', 'p', 'e'], collapse: true },
            { var: 'self', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '(*self).width', operation: 'g', P: ['p', 'p', 'e'] },
            { var: '(*self).height', operation: 'g', P: ['p', 'p', 'e'] },
            { var: 'other', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other.width', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other.height', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `impl Rectangle {
    fn set_to_max(&mut self, other: Rectangle) {
        /*[!perm_double R.W]*/*self = self/*[!perm_double R.O.{"letterBProps":{"missing":true}}]*/.max(other);
    }
}` })'
/>

可以看到，`self`缺少了<O />权限，无法进行`self.max(..)`操作。Rust会抛出如下报错：

```
error[E0507]: cannot move out of `*self` which is behind a mutable reference
  --> test.rs:23:17
   |
23 |         *self = self.max(other);
   |                 ^^^^^----------
   |                 |    |
   |                 |    `*self` moved due to this method call
   |                 move occurs because `*self` has type `Rectangle`, which does not implement the `Copy` trait
   |
```

这类错误和我们在4.3中讨论的一样。

## 好的移动和坏的移动

你可能会思考：为什么移动`*self`会有影响呢？实际上，对于`Rectangle`的例子，移动`*self`是安全的，尽管Rust禁止了这个操作。比如，如果我们模拟一个`set_to_max`的调用，你可以看到实际上没什么不安全操作：

<Wrapper>
<template #code>

```rust
impl Rectangle {
    fn set_to_max(&mut self, other: Rectangle) {
        let max = self.max(other); /*[!flag L2]*/
        *self = max;
    }
}

fn main() {
    let mut rect = Rectangle { width: 0, height: 1 };
    let other_rect = Rectangle { width: 1, height: 0 }; /*[!flag L1]*/
    rect.set_to_max(other_rect); /*[!flag L3]*/
}
```

</template>
<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'rect',
            forceShowDetail: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '0'
                },
                {
                  name: 'height',
                  value: '1'
                }
              ]
            }
          },
          {
            key: 'other_rect',
            forceShowDetail: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '1'
                },
                {
                  name: 'height',
                  value: '0'
                }
              ]
            }
          }
        ]
      }
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'rect',
            forceShowDetail: true,
            forceAsRef: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '0'
                },
                {
                  name: 'height',
                  value: '1'
                }
              ]
            }
          },
          {
            key: 'other_rect',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '1'
                },
                {
                  name: 'height',
                  value: '0'
                }
              ]
            }
          }
        ]
      },
      {
        name: 'Rectangle::set_to_max',
        body: [
          {
            key: 'self',
            point2: 'main.rect'
          },
          {
            key: 'rect',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '1'
                },
                {
                  name: 'height',
                  value: '0'
                }
              ]
            }
          },
          {
            key: 'max',
            forceShowDetail: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '1'
                },
                {
                  name: 'height',
                  value: '1'
                }
              ]
            }
          }
        ]
      }
    ]
  }"
/>

<MemoryGraph
  title="L3"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'rect',
            forceShowDetail: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '0'
                },
                {
                  name: 'height',
                  value: '1'
                }
              ]
            }
          },
          {
            key: 'other_rect',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                {
                  name: 'width',
                  value: '1'
                },
                {
                  name: 'height',
                  value: '0'
                }
              ]
            }
          }
        ]
      }
    ]
  }"
/>
</div>
</template>
</Wrapper>

将`*self`进行移动是安全的原因是`Rectangle`没有拥有堆数据。实际上，我们可以为`Rectangle`的定义添加一行`[derive(Copy, Clone)]`来让`set_to_max`通过编译：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 6: return lr({
          perms: [
            { var: '*self', operation: 'g', P: ['p', 'p', 'e'], collapse: true },
            { var: 'self', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '(*self).width', operation: 'g', P: ['p', 'p', 'e'] },
            { var: '(*self).height', operation: 'g', P: ['p', 'p', 'e'] },
            { var: 'other', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other.height', operation: 'g', P: ['p', 'e', 'p'] },
            { var: 'other.height', operation: 'g', P: ['p', 'e', 'p'] },
          ]
        })
        case 7: return lr({
          defaultCollapse: true,
          perms: [
            { var: '*self', operation: 'l', P: ['s', 'e', 's'] },
            { var: 'self', operation: 'l', P: ['s', 's', 'e'] },
            { var: '(*self).width', operation: 'l', P: ['s', 's', 'e'] },
            { var: '(*self).height', operation: 'l', P: ['s', 's', 'e'] },
            { var: 'other', operation: 'l', P: ['s', 'e', 's'] },
            { var: 'other.height', operation: 'l', P: ['s', 'e', 's'] },
            { var: 'other.height', operation: 'l', P: ['s', 'e', 's'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `#[derive(Copy, Clone)]
struct Rectangle {
    width: u32,
    height: u32,
}
impl Rectangle {
    fn set_to_max(&mut self, other: Rectangle) {
        /*[!perm_double R.W]*/*self = self/*[!perm R]*/.max(/*[!perm R]*/other);
    }
}` })'
/>

注意和之前的不同点是，`self.max(other)`不再需要`*self`或`other`的<O />权限了。注意这里`self.max(other)`是`Rectangle::max(*self, other)`的简写。不同点在于，当`Rectangle`可复制时，`*self`不会要求对`*self`的所有权。

你可能会好奇：为什么Rust不自动地为`Rectangle`派生`Copy`特性？其实Rust不自动派生`Copy`是为了稳定的API。想象一下如果`Rectangle`的作者添加了一个`name: String`字段。然后所有的依赖`Rectangle`的`Copy`特性的代码都会突然报错。为了避免这类问题，API的作者必须显式地添加`#[derive(Copy)]`来明确地告诉调用者，这些结构体是可复制的。

为了更好地理解这个问题，让我们模拟一个场景。如果我们为`Rectangle`添加了`name: String`且Rust允许`set_to_max`编译，那么会发生什么？

<Wrapper>
<template #code>

```rust
struct Rectangle {
    width: u32,
    height: u32,
    name: String,
}

impl Rectangle {
    fn set_to_max(&mut self, other: Rectangle) {
        /*[!flag L1]*/let max = self.max(other); /*[!flag L2]*/
        drop(*self); /*[!flag_error L3]*/ // 一般来说drop是隐含的
                          // 这里为了明确逻辑所以注明
    }
}

fn main() {
    let mut r1 = Rectangle {
        width: 9,
        height: 9,
        name: String::from("r1")
    };
    let r2 = Rectangle {
        width: 16,
        height: 16,
        name: String::from("r2")
    };
    r1.set_to_max(r2);
}
```

</template>
<template #graph>
<div class="flex flex-col gap-16">
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'r1',
            forceShowDetail: true,
            point2: 0,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '9' },
                { name: 'height', value: '9' },
                { name: 'name', point2: 0 },
              ]
            }
          },
          {
            key: 'r2',
            forceShowDetail: true,
            moved: true,
            point2: 0,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 0 },
              ]
            }
          },
        ]
      },
      {
        name: 'Rectangle::set_to_max',
        body: [
          {
            key: 'self',
            point2: 'main.r1'
          },
          {
            key: 'other',
            forceShowDetail: true,
            point2: 1,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 1 },
              ]
            }
          },
        ]
      }
    ],
    heap: [
      { id: 0, value: ['r','1'] },
      { id: 1, value: ['r','1'] },
    ]
  }"
/>

<MemoryGraph
  title="L2"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'r1',
            forceShowDetail: true,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '9' },
                { name: 'height', value: '9' },
                { name: 'name', point2: 'null' },
              ]
            }
          },
          {
            key: 'r2',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 'null' },
              ]
            }
          },
        ]
      },
      {
        name: 'Rectangle::set_to_max',
        body: [
          {
            key: 'self',
            point2: 'main.r1'
          },
          {
            key: 'other',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 'null' },
              ]
            }
          },
           {
            key: 'max',
            forceShowDetail: true,
            point2: 0,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 0 },
              ]
            }
          },
        ]
      }
    ],
    heap: [
      { id: 0, value: ['m','a','x'] },
    ]
  }"
/>

<MemoryGraph
  title="L3"
  error-message="未定义行为：指针在其指向的对象被释放后被使用"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'r1',
            forceShowDetail: true,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '9' },
                { name: 'height', value: '9' },
                { name: 'name', point2: 'null_error' },
              ]
            }
          },
          {
            key: 'r2',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 'null' },
              ]
            }
          },
        ]
      },
      {
        name: 'Rectangle::set_to_max',
        body: [
          {
            key: 'self',
            point2: 'main.r1'
          },
          {
            key: 'other',
            forceShowDetail: true,
            moved: true,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 'null' },
              ]
            }
          },
           {
            key: 'max',
            forceShowDetail: true,
            point2: 0,
            detail: {
              title: 'Rectangle',
              body: [
                { name: 'width', value: '16' },
                { name: 'height', value: '16' },
                { name: 'name', point2: 0 },
              ]
            }
          },
        ]
      }
    ],
    heap: [
      { id: 0, value: ['m','a','x'] },
    ]
  }"
/>
</div>
</template>
</Wrapper>

在这个程序中，我们调用了`r1`的`set_to_max`，传入了`r2`。`self`是一个`r1`的可变引用，而`r2`移动到了`other`。在调用`self.max(other)`后，`max`方法消费了这两个实例的所有权。当`max`返回时，Rust销毁了堆中存储的字符串“r1”和“r2”。请注意这里的问题：在L2的位置，`*self`应该是可读可写的，然而，`(*self).name`（也就是`r1.name`）已经被销毁了。

因此当我们进行`*self = max`时，会遇到未定义行为。当我们覆写`*self`时，Rust会隐式地销毁`*self`中的旧数据。为了让这种行为更明显，我们添加了`drop(*self)`。在调用`drop(*self)`后，Rust会再次试图释放`(*self).name`。这是重复释放，属于未定义行为。

所以请记住：当你看到类似“cannot move out of `*self`”的错误时，很可能是你在`self`的引用上调用了方法，比如`&self`或`&mut self`。Rust是在避免重复释放。

## 总结

结构体允许你创建在你的领域里有意义的自定义类型。通过它，你可以使分散的数据紧密关联，提高代码的清晰度。在`impl`代码块中，你可以定义和类型相关的关联函数，而方法则是一种定义结构体实例行为的特殊关联函数。

但结构体不是唯一一种自定义类型的方式；让我们看看Rust工具箱里的另一个工具：枚举。

::: details 小测（4）
<QuizProvider>
<Quiz>
<template #description>

解析：表达式`v.len()`是`Vec::len(&*v)`的简写，是对`v`的合法再借用，所以这样的的表达式是可以被编译的。然而，不能将`v`直接传递给`Vec::len`，因为`&self`指定的是一个不可变引用。

</template>
<template #quiz>

现有类型为`&mut Vec<i32>`的变量`v`，你希望调用它的`len`方法，`len`方法的签名如下：

```rust
impl Vec<i32> {
    fn len(&self) -> usize {
        /* ... */
    }
}
```

如果你试图编译表达式`v.len()`，下面哪一个选项对即将发生的事描述最准？

<RadioHolder>
<Radio label="编译通过，因为&self可以接收任意类型的引用" />
<Radio label="编译通过，因为&mut的引用被隐式的重新借用成为了&引用" answer />
<Radio label="编译不通过，v没有被显式地解引用" />
<Radio label="编译不通过，&mut Vec<i32>和&Vec<i32>不是同一种类型" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：`incr_v1`方法不符合使用习惯，它消费了`Point`实例的所有权。在调用`p.incr_v1()`后，`p`就不再可用了，这很可能不是方法的本意。

</template>
<template #quiz>

下面两个方法都增加了结构体字段的值，哪一种风格更加“Rust”？

```rust
struct Point(i32, i32);
impl Point {
    fn incr_v1(mut self) { self.0 += 1 };
    fn incr_v2(&mut self) { self.0 += 2 };
}
```

<RadioHolder>
<Radio label="incr_v1" />
<Radio label="incr_v2" answer />
<Radio label="都是" />
<Radio label="都不是" />
</RadioHolder>

</template>
</Quiz>

<Quiz>
<template #description>

解析：请记住`.0`对于类似`Point`这样的元组结构体来说是合法的。

</template>
<template #quiz>

<IsCompileText />

```rust
struct Point(i32, i32);
impl Point {
    fn incr_x(&mut self) {
        self.0 += 1;
    }
}

fn main() {
    let mut p = Point(0, 0);
    p.incr_x();
    println!("{}", p.0);
}
```

<IsCompile :answer="{ compiled: true, result: '1' }" />

</template>
</Quiz>

<Quiz>
<template #description>

解析：`get_x`对`p`的全部内容进行了可变借用，除非`x`不再被使用了，否则程序无法使用`p`。因此在同一行读取`x`和`p.y`会导致报错。

</template>
<template #quiz>

<IsCompileText />

```rust
struct Point {
    x: i32,
    y: i32
}

impl Point {
    fn get_x(&mut self) -> &mut i32 {
        &mut self.x
    }
}

fn main() {
    let mut p = Point { x: 1, y: 2 };
    let x = p.get_x();
    *x += 1;
    println("{} {}", *x, p.y);
}
```

<IsCompile :answer="{ compiled: false }" />

</template>
</Quiz>
</QuizProvider>
:::
