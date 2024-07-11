<script setup>
import {
  QuizProvider,
  Quiz,
  IsCompileText,
  IsCompile
} from '../../components/quiz';
</script>
# 使用Hash Map创建强大的kv结构

我们要讨论的最后一个集合是hash map。`HashMap<K, V>`使用*哈希函数*存储了类型为`K`的键和类型为`V`的值，哈希函数决定了这些键值对在内存中存放的方式。许多编程语言都支持这种数据结构，但它们的名字都不大一样，比如hash、map、object、hash table、dictionary或者associative array等等。

当你希望根据key来检索数据，而不是像vector一样用索引检索数据时，hash Map非常有用。比如，在一个游戏程序里，你可以设置队伍的名字为键，队伍的分数为值，以此追踪各个队伍的得分情况。

这一节我们会讨论hash map的基础API，但标准库的`HashMap<K, V>`还有更多的函数。跟之前一样，记得检查文档来获取它们的更多信息。

## 创建一个新的Hash Map

hash map最简单的使用就是用`new`来创建，用`insert`来添加元素。下面的代码就是一个追踪两队分数的程序，它们的名字是*Blue*和*Yellow*。Blue队开始的分数是10，而Yellow是50：

```rust
    use std::collection::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
```

别忘了我们要先从标准库的集合部分`use`引入`HashMap`。对于我们这三种常见集合，这一种是最不常见的，所以它没有被自动预引入到作用域中。标准库对hash map的支持也相对较少；比如没有内置的宏。

就像vector一样，hash map的数据存储在堆中。上面的`HashMap`的键类型为`String`，值类型为`i32`。就像vector一样，hash map是同质的，它所有的键必须为同一类型，它所有的值必须为同一类型。

## 访问Hash Map的值

我们可以通过`get`方法来获取hash map的值：

```rust
    use std::collection::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    let team_name = String::from("Blue");
    let score = scores.get(&team_name).copied().unwrap_or(0);
```

这里，`score`会被赋予Blue队的分数阶，结果为`10`。`get`方法返回了一个`Option<&V>`；如果传入的键在hash map中找不到对应的值，`get`会返回`None`。这段程序使用`copied`方法获取了一个`Option<i32>`而不是`Option<&i32>`，然后`unwrap_or`会在`scores`找不到对应的值时将`score`设置为0。

我们可以用和vector类似的方式遍历hash map的键值，使用`for`循环：

```rust
    use std::collection::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    for (key, value) in &scores {
        println!("{key}: {value}");
    }
```

代码会用不确定的顺序打印：

```
Yellow: 50,
Blue: 10
```

## Hash Map和所有权

对于实现了`Copy`特性的类型，比如`i32`，hash map会复制它们的值。对于含所有权的类型比如`String`，它们会被移动，hash map会成为这些值的所有者：

```rust
    use std::collection::HashMap;

    let field_name = String::from("Favorite color");
    let field_value = String::from("Blue");

    let mut map = HashMap::new();
    map.insert(field_name, field_value);
    // field_name和field_value现在都无效了
    // 试试使用它们，看看编译器的报错吧
```

在`field_name`和`field_value`被通过`insert`移动到hash map内后，我们无法继续使用它们了。

如果我们将值的引用插入hash map，那么值不会被移动了。这种情况下，引用指向的值的存活时间必须比hash map更长。我们会在第十章讨论这些问题。

## 更新Hash Map

尽管键值的数量是可以持续增加的，但相同的key只能包含相同的值（反过来则不然，比如，Blue队和Yellow队的分数均可以为10）。

当你想要修改hash map中的值时，你必须决定如何处理键值对已经存在的情况。你可以选择把旧值替换为新值，完全抛弃旧值。你也可以保留旧值，只在键*不存在*的情况下插入新值。或者你可以结合旧值和新值。让我们来逐个查看这些场景。

### 覆写旧值

如果我们插入一个键值对，然后插入同样的键和不同的值，那么键关联的值会被替换。尽管下面的代码调用了两次`insert`方法，但hash map也只包含一个键值对，因为我们为Blue队插入了两次分数：

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();

    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Blue"), 25);

    println("{:?}", scores);
```

这段代码会输出`{"Blue": 25}`，原来的值`10`被覆写了。

### 只在键不存在时插入

有一种场景也是十分常见的：拿着一个键值对在hash map中检查，如果键已经存在，那么保持现状，如果不存在，那么插入这个键值对。

Hash map提供了特殊的API`entry`，它接收需要检查的键作为参数。`entry`方法的返回值是一个`Entry`枚举，它表示值可能存在，可能不存在。举例来说，如果我们希望检查Yellow队的分数是否存在，如果不存在，那么插入50，对Blue队也一样：

```rust
    use std::collections::HashMap;

    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);

    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50);

    println!("{:?}", scores);
```

`Entry`枚举定义了`or_insert`方法，如果值存在，它会返回一个对`Entry`键相关联的值的可变引用，如果值不存在，他会插入传入的参数值，返回新值的可变引用。这种技术比我们自己写的代码更加清晰，且它和借用检查器的配合也更好。

运行上面的代码，打印结果为`{"Yellow": 50, "Blue": 10}`。第一次`entry`的调用会为Yellow队插入分数50，因为它还没有值。第二次调用不会改变hash map，因为Blue队已经有了分数。

### 根据旧值更新新值

另一个常见的场景是根据旧值更新新值。比如，下面的代码用于统计每一个单词出现的次数。我们使用hash map，单词作为键，出现的次数作为值。如果第一次看到值，会插入0：

```rust
    use std::collections::HashMap;

    let text = "hello world wonderful world";

    let mut map = HashMap::new();

    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        *count += 1;
    }

    println!("{:?}", map);
```

这段代码的打印结果为`{"world": 2, "hello": 1, "wonderful": 1}`。你可能会看到同样的键值对打印出不同的顺序；回顾前文，hash map并不保证键值对的顺序。

`split_whitespace`方法会返回一个`text`子串的迭代器，由空格分割。`or_insert`方法返回了键对应值的可变引用（`&mut V`）。我们将它保存到`count`变量中，所以不能直接对它进行赋值，要先对`count`进行解引用。可变引用的生命周期截止于`for`循环，所以这些修改是安全的，可以通过借用规则。

## 哈希函数

默认情况下，`HashMap`使用一种称为*SipHash*的哈希函数，它能抵御哈希表的拒绝服务攻击（DoS）<Thinking>https://en.wikipedia.org/wiki/SipHash</Thinking>。它不是最快的哈希算法，但牺牲一点性能换来更好的安全性是值得的。如果你认为默认的哈希算法对你的代码来说不够快，那么你可以指定其他的hasher。*hasher*是一个实现了`BuildHasher`特性的类型。我们会在第10章讨论这部分内容。你也不需要从头实现hasher，[crates.io](https://crates.io)上有许多其他Rust开发者提供的hasher，它们实现了各种各样的哈希算法。

::: details 小测（2）
<QuizProvider>
<Quiz>
<template #description>

解析：在不可变引用（v1）存活的状态下，h无法被修改（h.insert("k2", 1)）。

</template>
<template #quiz>
<IsCompileText />

```rust
use std::collections::HashMap;
fn main() {
    let mut h = HashMap::new();
    h.insert("k1", 0);
    let v1 = &h["k1"];
    h.insert("k2", 1);
    let v2 = &h["k2"];
    println!("{} {}", v1, v2);
}
```

<IsCompile :answer="{ compiled: false }" />
</template>
</Quiz>

<Quiz>
<template #description>

解析：这个程序存储了字符串中每个字符串出现过的下标索引集合。然后和计算了字符‘l’下标的和，即2和3，结果为5。

</template>
<template #quiz>
<IsCompileText />

```rust
use std::collections::HashMap;
fn main() {
    let mut h: HashMap<char, Vec<usize>> = HashMap::new();
    for (i, c) in "hello".chars().enumerate() {
        h.entry(c).or_insert(Vec::new()).push(i);
    }
    let mut sum = 0;
    for i in h.get(&'l').unwrap() {
      sum += *i;
    }
    println!("{}", sum);
}
```

<IsCompile :answer="{ compiled: true, result: '5' }" />
</template>
</Quiz>
</QuizProvider>
:::

## 总结

vector，字符串，hash map提供了大量的功能，可以满足你的存储、访问和修改数据。下面是一些练习：

- 创建一个整数列表，获取它的中位数和出现最多的数（使用hash map可能会很有用）。
- 将字符串转为猪拉丁文。每个单词的第一个辅音被移到单词的末尾并加上“ay”，所以“first”变成“irst-fay”。以元音开头的单词在末尾加上“hay”，例如“apple”变成“apple-hay”。请记住有关UTF-8编码的细节！
- 使用hash map和vector实现一个文本接口，允许用户输入雇员的名字来加入公司的部门。比如，“Add Sally to Engineering”或者“Add Amir to Sales”。然后允许用户查看当前部门的所有员工，或者查看公司按部分分类的所有员工，按照字母顺序排列。

标准库为vector、字符串、hash map提供了大量的实用方法，对你完成这些练习会有很大的帮助。

接下来我们要讨论的程序复杂度会更高，所以现在来讨论错误处理是最佳时机。下一章见！
