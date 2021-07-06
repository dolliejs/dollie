---
order: 2
toc: 'menu'
title: 'Advanced Usages'
---

# 进阶用法

## 编写扩展模板

### 主要使用场景

- 主模板需要扩充多个维度的功能（例如：React 主模板可能需要添加 TypeScript、Sass/Less/Stylus 预处理器、React Router、状态管理等功能或模块）
- 主模板只用于提供基础项目文件，而将其他代表各个模块或功能的文件存放于扩展模板中

### 存放位置

在模板根目录中，建立一个名为 `extends` 的目录，在这个目录内存放所有扩展模板的目录。Dollie 将扩展模板目录名作为扩展模板的名称，并且大小写敏感。

例如，一个名为 `foo` 的扩展模板应该存放于模板根目录下的 `extends/foo` 目录中。

### 注册扩展模板配置

在模板配置文件中可以为所有扩展模板注册配置，除 `extendTemplates` 外，扩展模板的配置项与主模板配置项并无二致。在模板根目录的配置文件中的 `extendTemplates` 字段内添加以扩展模板名称（即扩展模板目录名）为键、以配置项为值的键值对即可注册扩展模板的配置。

例如，有一个名为 `foo` 扩展模板在配置文件中应该像下面的代码一样注册配置：

```json
{
    "questions": [
        // ...主模板问题
    ],
    // ...主模板其他配置
    "extendTemplates": {
        "foo": {
            // ...foo 扩展模板的配置
        }
    }
}
```

## 识别扩展模板

### 通过输入识别

在主模板或扩展模板的 `questions` 字段中，如果某个问题的 `name` 字段为 `$EXTEND$` 且 `type` 字段为 `input`，用户对这个问题的回答内容将会被 Dollie 识别为扩展模板名称。例如：

```json
{
    "questions": [
        {
            "name": "$EXTEND$",
            "message": "Input the css preprocessor",
            "type": "input"
        }
    ]
}
```

例如，如果用户输入 `less`，Dollie 将会识别并将 `less` 作为本次生命周期中所依赖的扩展模板。

### 通过确认结果识别

在主模板或扩展模板的 `questions` 字段中，如果某个问题的 `name` 字段为 `$EXTEND:{name}$` 且 `type` 字段为 `confirm`，当用户选择 `y` 后，Dollie 会将 `{name}` 识别为扩展模板名称，否则 Dollie 不会采取任何识别扩展模板的措施。例如：

```json
{
    "questions": [
        {
            "name": "$EXTEND:typescript$",
            "message": "Would you want to use TypeScript in your project?",
            "type": "confirm"
        }
    ]
}
```

当用户确认时，Dollie 会将 `typescript` 识别并作为本次生命周期中所依赖的扩展模板，当用户拒绝时，Dollie 不会采取任何行动。

### 通过列表/多选识别

在主模板或扩展模板的 `questions` 字段中，如果某个问题的 `name` 字段为 `$EXTEND$` 且 `type` 字段为 `list` 或 `checkbox`，用户所有选中选项中的 `value` 字段都将会被 Dollie 识别并作为本次生命周期所依赖的扩展模板。例如：

```json
{
    "questions": [
        {
            "name": "$EXTEND$",
            "message": "Choose a state manager",
            "type": "list",
            "choices": [
                {
                    "name": "Redux",
                    "value": "redux"
                },
                {
                    "name": "MobX",
                    "value": "mobx"
                },
                {
                    "name": "Dva",
                    "value": "dva"
                }
            ]
        }
    ]
}
```

当用户选择 `'MobX'` 时，`mobx` 将会被 Dollie 识别并作为本次生命周期所依赖的扩展模板。

> 请注意：
> - `$EXTEND$` 在 Dollie 中是**大小写敏感的**
> - 对于返回值为 `'null'`、空值的问题，Dollie 不会识别为任何扩展模板，因此**请不要将扩展模板命名为 `'null'`**
> - 当采用列表或多选方式识别扩展模板时，请注意不要混淆 `choices` 中的 `name` 和 `value`

## 文件行为配置

Dollie 在模板配置文件中的 `files` 字段内定义了两个字段：`merge` 和 `delete`。对于上述所有字段，Dollie 都接受一个字符串数组作为每个字段的值，其中，数组元素为 [Glob 风格](https://en.wikipedia.org/wiki/Glob_(programming)) 的正则表达式用于匹配模板文件的相对路径（相对于项目根目录，以下简称“相对路径”）。

在生命周期内，Dollie 会遍历已生成的模板文件，若某个文件的相对路径在数组中匹配到了至少一次，那么 Dollie 将会对这个文件采取对应的策略。

对于上述两个字段，其含义分别如下：

### `files.merge`

Dollie 约定在增量覆盖时，所有扩展模板中的文件将会按照顺序依次覆盖主模板中的同名文件。但大多数情况下，模板的创建者和使用者都不希望已有的扩展模板对主模板同名文件的更改被新的扩展模板中的同名文件覆盖掉——他们希望保留每个扩展模板对同一文件的**所有更改**。

当扩展模板将文件写入目标目录时，如果文件名能匹配到该项配置中的某一条正则表达式，Dollie 将会记录其内容与文件初始内容的 Diff 结果，形成增量表（Patch Table），在最终写入文件内容时将该文件名下所有这样的增量表合并后作用到初始内容上。

### `files.delete`

在增量覆盖时，模板的创建者和使用者有时希望在某一个扩展模板生成完成后，删去已生成的某些文件，例如：一个 React 项目中如果使用了加入 TypeScript 支持的扩展模板，那么这个扩展模板就需要执行删除目录中使用 JavaScript 编写的代码文件。因此 `files.delete` 就能派上用场。

> 请注意：
> - Dollie 每次运行时，所有模板的上述两项配置中的值都会被叠加。

## 清理函数队列（`cleanups`）

Dollie 允许用户定义一些清理函数，用于在 Dollie 生成最终文件结果之前对已生成的项目目录结构和文件内容进行操作。例如，在模板根目录的 `dollie.js` 中可以编写如下内容：

```js
module.exports = {
    // ...主模板其他配置
    cleanups: [
        async function(context) {
            if (context.exists('tsconfig.json')) {
                context.deleteFiles(['src/index.js']);
            }
        },
        // ...
    ],
};
```

上述清理函数的作用是：在 Dollie 生成项目代码文件和目录结构之后，运行上述函数，如果项目中存在 `tsconfig.json`，则删除老旧的 JavaScript 文件。

> 请注意：
> - 清理函数配置在 JSON 类型的配置文件中无效
> - Dollie 同时对主模板和扩展模板提供清理函数的支持

## 编写 Origin 函数

### 文件内容

Dollie 仅接受 JavaScript 文件形式，在文件中必须使用 `module.exports` 导出 `Function` 类型的值。这个被导出的函数必须返回一个对象，其中 `url` 字段是一个字符串，它是必需的；`headers` 是一个键值对，用来设置 HTTP 请求头，它是非必需的。

以 Dollie 内置的[ GitHub Origin 函数](https://github.com/dolliejs/dollie/blob/master/packages/@dollie/origins/src/handlers/github.ts)为例，它的内容（JS 转写后的）如下：

```js
const _ = require('lodash');

module.exports = async (id, config = {}) => {
    if (!id) {
        return null;
    }

    const [repository, checkout = ''] = id.split('@');

    const token = config.token || '';

    return {
        url: `https://api.github.com/repos/${repository}/zipball${checkout ? `/${checkout}` : ''}`,
        headers: token ? {
            'Authorization': `token ${token}`,
        } : {},
    };
};
```

### 文件存放位置

Origin 函数文件可以存放在能通过 HTTP 或 HTTPS 协议的 URL 被访问到的互联网位置，也可以存放在本地文件系统中（在 Node.js 有权限读取这些文件的前提下）。

### 注册 Origin 函数

在创建 `Context` 实例时，可以通过 `Generator` 配置向 Dollie 传递一个以 Origin 函数名称为键、以 Origin 函数 URL 的键值对注册 Origin 函数，配置项路径为 `generator.origins`：

```js
const context = new Context('foo', 'example_origin:bar', {
    generator: {
        origins: {
            example_origin: 'https://example.com/origins/example_origin.js',
        },
    },
});
```

### 设置参数

在创建 `Context` 实例时，可以通过 `Generator` 配置向 Dollie 传递一个键值对来设置 Origin 函数的参数，配置项路径为 `generator.origin`：

```js
const context = new Context('foo', 'example_origin:bar', {
    generator: {
        // ...生成器其他配置
        origin: {
            foo: 'bar',
        },
    },
});
```

`{ foo: 'bar' }` 将会被作为第二个形式参数在 Dollie 调用 Origin 函数时传入。

## 处理文件冲突

### 为什么会产生冲突

由于 Dollie 支持通过扩展模板对项目代码增量覆盖，当多个扩展模板同时从某一文件的同一行开始增加内容时，Dollie 无法判定增加的内容是否全部需要保留。因此 Dollie 会将这种情况判定为冲突，将所有扩展模板对此处增加的内容叠加起来作为合并区块，并标记这个合并区块为冲突区块标记，然后交由用户决定区块内每一行的保留与否。

### 接收 Dollie Core 抛出的冲突

在实例化 `Context` 时，可以向 `generator.conflictSolver` 传入一个函数，以当前冲突区块作为回调形式参数传递，并返回解决后的合并区块：

```js
const context = new Context('foo', 'example_origin:bar', {
    generator: {
        // ...生成器其他配置
        conflictSolver: async function(data) {
            const { block } = data;
            const { values } = block;
            // 获取冲突双方的每一行内容
            const { former, current } = values;
            // 将所有需要保留的行都 push 到 `current` 中
            return block;
        },
    },
});
```

此外，如果这个函数的返回值为 `'ignored'`，则代表放弃处理本次冲突。

> 请注意：
> - 在增量覆盖时，每遇到一个冲突，Dollie 都会执行一次 `generator.conflictSolver` 函数
> - 在一个文件中，可能存在不止一处冲突
> - 如果上述函数返回值为 `null`，Dollie 会再一次抛出同样的冲突信息，直到函数返回值不再是 `null`

### 向用户获取解决方案

上文提到，Dollie 在遇到冲突后，会抛出冲突，通过 `generator.conflictSolver` 可以实现带有冲突区块信息的回调。处理冲突属于用户中断操作，因此需要交由用户代理完成（事实上，上文所述的所有内容都是围绕着用户代理的实现展开的）。

在一般情况下，`generator.conflictSolver` 可以承担向用户获取解决方案的责任。最简单的做法是将回调的形式参数中的冲突的每一行都打印在控制台中，由用户决定保留哪几行，并向用户代理输入。用户代理根据用户的输入解析成新的合并区块并返回给 Dollie，从而实现从用户侧获取冲突的解决方案。
