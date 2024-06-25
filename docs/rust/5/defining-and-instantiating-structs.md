<script setup>
import { ref } from "vue";
import {
  Wrapper,
  MemoryGraph,
} from "../../components/memory-graph";
import ShikiCode from "../../components/code/ShikiCode.vue"
import {
  lr
} from "../../utils/renderer"
import {
  QuizProvider,
  Quiz,
  IsCompile,
  IsCompileText,
} from "../../components/quiz"

const userStruct1 = ref({
  title: 'User',
  body: [
    { name: 'active', value: 'true' },
    { name: 'username', point2: 0, class: 'username' },
    { name: 'email', point2: 1, class: 'email' },
    { name: 'sign_in_count', value: '1' },
  ]
})
const userStruct2 = ref({
  title: 'User',
  body: [
    { name: 'active', value: 'true' },
    { name: 'username', point2: 0, class: 'username2' },
    { name: 'email', point2: 2, class: 'email2' },
    { name: 'sign_in_count', value: '1' },
  ]
})

</script>

# 定义和实例化结构体

结构体和元组类似，它们都持有了相关联的数据。和元组一样，结构体中可以包含不同的类型。但和元组不同的是，结构体中的元素都有名字，可以很清晰地知道值的含义。名字的引入使得结构体比元组更加灵活：你不需要依赖数据的顺序来定义和访问数据。

要定义结构体，我们要使用`struct`关键字加上结构体的名字。结构体的名字是整个数据打包后的描述签名。然后，使用一对大括号，内部包含每个值的名字和类型，这些内容成为*字段*。比如，下面的例子就是一个用户的结构体：

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}
```

要使用我们定义的结构体，我们需要使用结构体的名字进行*实例化*，并制定每个字段具体的值。结构体名字后面是大括号包裹的*键值对*，键就是字段的名字，值就是这次实例化希望保存的值。结构体定义时和实例化时的名字顺序可以不一致。换句话说，结构体的定义就像一个类型模版，而实例化的过程使用特定的值填充了字段，构成了这个结构体类型的值。比如：

<Wrapper>
<template #code>

```rust
fn main() {
    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    }; /*[!flag L1]*/
}
```

</template>

<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'user1',
            detail: userStruct1,
            point2: [['username', 0], ['email', 1]],
            forceShowDetail: true
          }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['s','o','m','e','u','s','e','r','n','a','m','...','3'] },
      { id: 1, value: ['s','o','m','e','o','n','e','@','e','x','a','...','m'] },
    ]
  }"
/>
</template>
</Wrapper>

要获取结构体中具体的值，我们可以使用点。比如，要访问用户的邮箱，可以使用`user.email`。如果实例是可变的，那么也可以通过点语法来为特定的字段赋值。下面的代码就是修改一个可变的`User`实例的`email`值：

<Wrapper>
<template #code>

```rust
fn main() {
    let mut user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    }; /*[!flag L1]*/

    user1.email = String::from("anotheremail@example.com");
}
```

</template>
<template #graph>
<div class="flex flex-col gap-16"></div>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'user1',
            detail: userStruct1,
            point2: [['username', 0], ['email', 1]],
            forceShowDetail: true
          }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['s','o','m','e','u','s','e','r','n','a','m','...','3'] },
      { id: 1, value: ['s','o','m','e','o','n','e','@','e','x','a','...','m'] },
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
            key: 'user1',
            detail: userStruct1,
            point2: [['username', 0], ['email', 1]],
            forceShowDetail: true
          }
        ]
      }
    ],
    heap: [
      { id: 0, value: ['s','o','m','e','u','s','e','r','n','a','m','...','3'] },
      { id: 1, value: ['a','n','o','t','h','e','r','e','m','a','i','...','m'] },
    ]
  }"
/>
</template>
</Wrapper>

请注意，整个实例都是可变的；Rust不允许将某一个字段单独标记为可变。就像其他表达式一样，我们也可以在函数体的最后一行构造一个结构体，将结构体实例作为函数的返回值。

下面的代码展示了`build_user`函数返回了一个绑定了给定邮箱和用户名的`User`实例。而字段`active`设置了值为`true`，`sign_in_count`设置了值为`1`。

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username: username,
        email: email,
        sign_in_count: 1,
    }
}
```

函数的参数名和结构体的字段名字是相同的，这种命名没有问题，但重复书写`email`和`username`似乎有些无聊。如果结构体的字段很多，一直重复性地书写每个字段就很烦人了。幸运的事，Rust内置了方便的简写！

## 字段初始化简写

由于结构体的字段名和函数的参数名完全相同，我们可以使用*字段初始化简写*的语法来重构`build_user`，函数的功能没有改变，但无需再重复书写`username`和`email`了：

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,
        email,
        sign_in_count: 1,
    }
}
```

在这里，我们创建了一个新的`User`实例，它包含`email`字段。如果我们希望将函数的`email`直接设置为实例值，那么我们只需要写`email`，而不必书写`email: email`。

## 用结构体更新语法从其他实例创建实例

创建一个大部分值都和另一个实例值相同、其余则不同的实例也是十分常见的需求。你可以使用*实例更新语法*。

首先，我们先不使用更新语法，而是用常规方式创建一个`User`实例`user2`。我们为`email`赋予了新值，其他值则来自`user1`：

<Wrapper>
<template #code>

```rust
fn main() {
    // --略--

    let user2 = User {
        active: user1.active,
        username: user1.username,
        email: String::from("another@example.com"),
        sign_in_count: user1.sign_in_count,
    }; /*[!flag L1]*/
}
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'user1',
            detail: userStruct1,
            point2: [['username', 0], ['email', 1]],
            forceShowDetail: true,
            moved: true,
          },
          {
            key: 'user1',
            detail: userStruct2,
            point2: [['username2', 0], ['email2', 2]],
            forceShowDetail: true
          },
        ]
      }
    ],
    heap: [
      { id: 0, value: ['s','o','m','e','u','s','e','r','n','a','m','...','3'] },
      { id: 1, value: ['s','o','m','e','o','n','e','@','e','x','a','...','m'] },
      { id: 2, value: ['a','n','o','t','h','e','r','e','m','a','i','...','m'] },
    ]
  }"
/>
</template>
</Wrapper>

而使用结构体更新语法，我们可以使用更少的代码实现。下面代码中的`..`就表示没有指明的字段都从这个结构体中获取值：

```rust
fn main() {
    // --略--

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    }
}
```

上面代码创建的`user2`和`user1`的`email`值不同，而`username`、`active`和`sign_in_count`值都相同。`..user1`必须在结构体实例化的最后位置，在所有指定值字段的后面，但前面指定值的字段的数量、顺序都不受限制。

请注意结构体更新和赋值语法一样，都使用`=`；这是因为它移动了数据，就像我们在前一张“什么是所有权”里看到的一样。在这里例子里，我们在创建了`user2`后无法再继续使用`user1`了，因为`username`的值类型是`String`，它被移动到了`user2`里。如果我们给`user2`的`username`和`email`都赋予了新的`String`，仅使用了来自`user1`的`active`和`sign_in_count`，那么在创建`user2`后`user1`仍然是有效的。`active`和`sign_in_count`是实现了`Copy`特性的类型，这部分我们在后面的章节会讨论到。

## 使用元组结构体创建不含字段名的类型

Rust也提供形似元组的结构体，叫做*元组结构体*。元组结构体也附加了结构体的名字，但并没有字段名；当然，它们仍包含字段的类型。元组结构体对于某些场景十分有用，比如你希望给整个元组赋予名字和不同的类型，但字段的名字又是十分啰嗦、冗长的。

要定义元组结构体，需要使用`struct`关键字和后面的元组类型。比如，下面的程序我们定义了`Color`和`Point`这两个元组：

<Wrapper>
<template #code>

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0); /*[!flag L1]*/
}
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          {
            key: 'black',
            forceShowDetail: true,
            detail: {
              title: 'Color',
              body: [
                {
                  name: null,
                  value: [0,0,0]
                }
              ]
            }
          },
          {
            key: 'origin',
            forceShowDetail: true,
            detail: {
              title: 'Point',
              body: [
                {
                  name: null,
                  value: [0,0,0]
                }
              ]
            }
          },
        ]
      }
    ]
  }"
/>
</template>
</Wrapper>

请注意`black`和`origin`的值是不同的，因为它们是不同元组结构体的实例。你定义的每个结构体都是独一无二的类型，尽管它们内部的类型结构可能是相同的。举个例子，一个接收`Color`类型作为参数的函数不能接收`Point`作为参数，尽管它们都是三个`i32`类型组合而成的。在其他方面，元组结构体和元组是基本相同的，你可以把它结构成独立的部分，也可以使用`.`和下标来访问其成员。

## 无字段类单元结构体

你也可以定义不包含任何字段的结构体！这种结构体称为*类单元结构体*，因为它们和`()`类似，在数据类型的章节我们提到过单元类型。类单元结构体对于一些场景十分有用，比如你想实现在某些类型上实现特性单又不希望这个类型存储任何数据。我们会在后面的章节讨论特性。下面是一个声明、初始化类单元结构体的例子：

<Wrapper>
<template #code>

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual; /*[!flag L1]*/
}
```

</template>
<template #graph>
<MemoryGraph
  title="L1"
  :memory="{
    stack: [
      {
        name: 'main',
        body: [
          { key: 'subject', value: 'AlwaysEqual' }
        ]
      }
    ]
  }"
/>
</template>
</Wrapper>

要定义`AlwaysEqual`，我们需要使用`struct`关键字和我们希望使用的名字，然后是一个分号。不需要大括号或者小括号！然后我们用类似的方式创建了一个`AlwaysEqual`的实例`subject`：使用定义的名字，无需大括号或者小括号。想象一下我们之后为这个类型实现了一先行为，使得`AlwaysEqual`和任何类型都相等（可能出于测试代码的目的）。我们不需要任何数据来实现这个功能！你会在第十章看到定义和实现了各种特性的类型，包括类单元结构体。

## 结构体数据的所有权

在我们之前定义的结构体`User`中，我们使用了拥有性质的`String`而不是`&str`这种切片。这是一种刻意的选择，因为我们希望每个结构体实例都拥有其自己的数据，合结构体自身的生命周期保持一致。

结构体也可以包含对其他东西所拥有数据的引用，但需要使用*生命周期*，这是在第十章我们会讨论的Rust功能。生命周期保证了结构体引用的数据存活时长大于等于结构体。如果你不使用生命周期就识图在结构体中保存引用，那么不会成功：

```rust
struct User {
    active: bool,
    username: &str,
    email: &str,
    sign_in_count: u64,
}

fn main() {
    let user1 = User {
        active: true,
        username: "someusername123",
        email: "someone@example.com",
        sign_in_count: 1,
    };
}
```

这样的代码会由于缺少生命周期标识而编译失败：

```
$ cargo run
   Compiling structs v0.1.0 (file:///projects/structs)
error[E0106]: missing lifetime specifier
 --> src/main.rs:3:15
  |
3 |     username: &str,
  |               ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
1 ~ struct User<'a> {
2 |     active: bool,
3 ~     username: &'a str,
  |

error[E0106]: missing lifetime specifier
 --> src/main.rs:4:12
  |
4 |     email: &str,
  |            ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
1 ~ struct User<'a> {
2 |     active: bool,
3 |     username: &str,
4 ~     email: &'a str,
  |

For more information about this error, try `rustc --explain E0106`.
error: could not compile `structs` due to 2 previous errors
```

在第十章，我们会讨论如何修复这些问题，并在结构体中保存引用，但现在，只需要使用`String`而不是`&str`即可。

## 借用结构体的字段

类似“修复所有权问题”中提到的一样，Rust的借用检查器会在结构体层级和字段层级分别跟踪。举例来说，如果我们借用了`Point`结构的字段`x`，那么`p`和`p.x`都会暂时丧失它们的所有权（但`p.y`没有失去）：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 1: return lr({
          perms: [
            { var: 'p', operation: 'g', P: 'p' },
            { var: 'p.x', operation: 'g', P: 'p' },
            { var: 'p.y', operation: 'g', P: 'p' },
          ]
        })
        case 2: return lr({
          perms: [
            { var: 'p', operation: 'b', P: 's' },
            { var: 'p.x', operation: 'b', P: 's', collapse: true },
            { var: 'x', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*x', operation: 'g', P: ['p', 'p', 'e'] },
          ]
        })
        case 3: return lr({
          perms: [
            { var: 'p', operation: 'r', P: 'p' },
            { var: 'p.x', operation: 'r', P: 'p', collapse: true },
            { var: 'x', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*x', operation: 'l', P: ['s', 's', 'e'] },
          ]
        })
        case 4: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'p', operation: 'l', P: 's' },
            { var: 'p.x', operation: 'l', P: 's' },
            { var: 'p.y', operation: 'l', P: 's' },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `struct Point { x: i32, y: i32 }
let mut p = Point { x: 0, y: 0 };
let x = &mut /*[!perm_double R.W.{"collapse":true}]*/p.x;
/*[!perm_double R.W.{"collapse":true}]*/*x += 1;
println!("{}, {}", /*[!perm R.{"collapse":true}]*/p.x, /*[!perm R.{"collapse":true}]*/p.y)` })'
/>

结果就是，如果我们试图在`p.x`被可变借用时使用`p`：

<ShikiCode
  :inserter="({ after, line }) => {
    if(!after) {
      switch(line) {
        case 1: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'p', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*p', operation: 'g', P: ['p', 'e', 'e'] },
            { var: '(*p).x', operation: 'g', P: ['p', 'e', 'e'] },
            { var: '(*p.y)', operation: 'g', P: ['p', 'e', 'e'] },
          ]
        })
        case 2: return lr({
          defaultCollapse: true,
          perms: [
            { var: 'p', operation: 'l', P: ['s', 'e', 's'] },
            { var: '*p', operation: 'l', P: ['s', 'e', 'e'] },
            { var: '(*p).x', operation: 'l', P: ['s', 'e', 'e'] },
            { var: '(*p.y)', operation: 'l', P: ['s', 'e', 'e'] },
          ]
        })
        case 5: return lr({
          perms: [
            { var: 'p', operation: 'g', P: 'p' },
            { var: 'p.x', operation: 'g', P: 'p' },
            { var: 'p.y', operation: 'g', P: 'p' },
          ]
        })
        case 6: return lr({
          perms: [
            { var: 'p', operation: 'b', P: 's' },
            { var: 'p.x', operation: 'b', P: 's', collapse: true },
            { var: 'x', operation: 'g', P: ['p', 'e', 'p'] },
            { var: '*x', operation: 'g', P: ['p', 'p', 'e'] },
          ]
        })
      }
    }
  }"
  :init-code='() => ({ lang: "rust", code: `struct Point { x: i32, y: i32 }
fn point_point(p: &Point) {
    println!("{}, {}", /*[!perm R.{"collapse":true}]*/p.x, /*[!perm R.{"collapse":true}]*/p.y);
}
fn main() {
    let mut p = Point { x: 0, y: 0 };
    let x = &mut /*[!perm_double R.W.{"collapse":true}]*/p.x;
    point_point(&/*[!perm R.{"missing":true}]*/p);
    *x += 1;
}` })'
/>

编译器会抛出如下错误：

```
error[E0502]: cannot borrow `p` as immutable because it is also borrowed as mutable
  --> test.rs:10:17
   |
9  |     let x = &mut p.x;
   |             -------- mutable borrow occurs here
10 |     print_point(&p);
   |                 ^^ immutable borrow occurs here
11 |     *x += 1;
   |     ------- mutable borrow later used here
```

普遍来说，如果你发现了一个跟结构体所有权有关的错误，那么你应该考虑是结构中的哪个字段应该被借出哪些权限。但要注意借用检查器的限制，Rust偶尔可能会误认为比实际上更多的一些字段被借出了。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：`..a`语法会把除了`y`以外的所有字段从`b`复制到`a`，所以`a.x += 1`对`b`没有影响。

</template>
<template #quiz>
<IsCompileText />

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut a = Point { x: 1, y: 2 };
    a.x += 1;
    let b = Point { y: 1, ..a };
    a.x += 1;
    println!("{}", b.x);
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: '2'
  }"
/>
</template>
</Quiz>

<Quiz>
<template #description>

解析：Rust理解`.x`和`.y`的不同引用，所以同时对这两个字段进行可变引用是合法的。

</template>
<template #quiz>
<IsCompileText />

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut p = Point { x: 1, y: 2 };
    let x = &mut p.x;
    let y = &mut p.y;
    *x += 1;
    *y += 1;
    println!("{} {}", p.x, p.y);
}
```

<IsCompile
  :answer="{
    compiled: true,
    result: '2 3'
  }"
/>
</template>
</Quiz>
</QuizProvider>
:::
