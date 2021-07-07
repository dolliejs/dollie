---
order: 2
toc: 'menu'
title: 'Advanced Usages'
---

# Advanced Usages

## Write an Extend Template

### General Usage Scenarios

- The main template needs to be expanded with multiple dimensions (e.g. React main template may need to add features or modules such as TypeScript, Sass/Less/Stylus preprocessor, React Router, state management, etc.)
- The main template is only used to provide the base project files, while other files representing individual modules or functions are stored in the extend template

### Storage Location

In the template root directory, create a directory named `extends` where all extend templates are stored. Dollie uses the extend template directory name as the name of the extend template and is case-sensitive.

For example, an extend template named `foo` should be stored in the `extends/foo` directory in the root of the template.

### Register Extend Template Configuration

You can register configurations for all extend templates in the template configuration file, and the configuration items for extend templates are the same as the main template configuration items except for `extendTemplates`. You can register the configuration of an extend template by adding a key-value pair with the extend template name (i.e., extend template directory name) as the key and the configuration item as the value in the `extendTemplates` field in the configuration file of the template root directory.

For example, there is a template named `foo` extend in the configuration file that should register the configuration like the following code:

```json
{
    "questions": [
        // ...main template questions
    ],
    // ...other main template questions
    "extendTemplates": {
        "foo": {
            // ...foo extend template configuration
        }
    }
}
```

## Identify Extend Templates

### Identify by Inputs

If a `question` has a `name` field of `$EXTEND$` and a `type` field of `input` in the questions field of the main template or extend template, the user's answer to this question will be recognized by Dollie as the extend template name. For example:

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

For example, if the user types `less`, Dollie will recognize and use `less` as the extend template to rely on during this lifecycle.

### Identify by Confirmination Result

In the `questions` field of the main or extend template, if the `name` field of a question is `$EXTEND:{name}$` and the `type` field is `confirm`, Dollie will recognize `{name}` as the extend template name when the user selects `y`. Otherwise, Dollie will not take any to identify the extend template. Example:

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

When the user confirms, Dollie identifies the `typescript` and uses it as an extend template relied on in this lifecycle, and Dollie takes no action when the user rejects it.

### Identify by List/Multi-selection

In the `questions` field of the main or extend template, if the `name` field of a question is `$EXTEND$` and the type field is `list` or `checkbox`, the `value` field of all the user's selected options will be recognized by Dollie and used as the extend template on which this lifecycle depends. Example:

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

When the user selects `'MobX'`, `mobx` will be recognized by Dollie and used as the extend template that this lifecycle relies on.

> Attention:
> - `$EXTEND$` is case-sensitive in Dollie
> - For questions with answers of `'null'`, null values, Dollie will not recognize any extend templates, so please **do not name extend templates as `'null'`**
> - When using list or multiple choice to identify extended templates, be careful not to confuse `name` and `value` in `choices`

## File Actions Configure

Dollie defines two fields in the `files` field of the template configuration file: `merge` and `delete`. For all of these fields, Dollie accepts an array of strings as the value of each field, where the elements of the array are [Glob-style](https://en.wikipedia.org/wiki/Glob_(programming)) regular expressions used to match the relative path of the template file (relative to the project root directory, hereinafter referred to as "relative path").

在生命周期内，Dollie 会遍历已生成的模板文件，若某个文件的相对路径在数组中匹配到了至少一次，那么 Dollie 将会对这个文件采取对应的策略。

对于上述两个字段，其含义分别如下：

### `files.merge`

Dollie 约定在增量覆盖时，所有扩展模板中的文件将会按照顺序依次覆盖主模板中的同名文件。但大多数情况下，模板的创建者和使用者都不希望已有的扩展模板对主模板同名文件的更改被新的扩展模板中的同名文件覆盖掉——他们希望保留每个扩展模板对同一文件的**所有更改**。

当扩展模板将文件写入目标目录时，如果文件名能匹配到该项配置中的某一条正则表达式，Dollie 将会记录其内容与文件初始内容的 Diff 结果，形成增量表（Patch Table），在最终写入文件内容时将该文件名下所有这样的增量表合并后作用到初始内容上。

### `files.delete`

在增量覆盖时，模板的创建者和使用者有时希望在某一个扩展模板生成完成后，删去已生成的某些文件，例如：一个 React 项目中如果使用了加入 TypeScript 支持的扩展模板，那么这个扩展模板就需要执行删除目录中使用 JavaScript 编写的代码文件。因此 `files.delete` 就能派上用场。

> 请注意：
> - Dollie 每次运行时，所有模板的上述两项配置中的值都会被叠加。

## `cleanups` Queue

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
