---
order: 1
toc: 'menu'
title: '基础用法'
---

# 基础用法

## 建立模板

### 目录结构

<Tree>
    <ul>
        <li>
            main
            <small>主模板目录</small>
            <ul>
                <li>
                    ...
                    <small>主模板文件</small>
                </li>
            </ul>
        </li>
        <li>
            extends
            <small>扩展模板目录</small>
            <ul>
                <li>
                    foo
                    <small>扩展模板 `foo` 根目录</small>
                    <ul>
                        <li>
                            ...
                            <small>扩展模板 `foo` 文件</small>
                        </li>
                    </ul>
                </li>
                <li>
                    bar
                    <small>扩展模板 `bar` 根目录</small>
                    <ul>
                        <li>
                            ...
                            <small>扩展模板 `bar` 文件</small>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
        <li>
            dollie.js | dollie.json
            <small>配置文件</small>
        </li>
    </ul>
</Tree>

### 动态模板文件

Dollie 约定：凡是以 `__template.`开头的字符串作为文件名的文件都将被认为是「动态文件」。动态文件将会被 [EJS](https://ejs.co) 引擎解析，并将一些配置项以 EJS Props 的形式作为变量注入，从而形成目标文件（目标文件的文件名见会被删去 `__template.`）内容。

> 当某个以 `.` 开头的文件需要作为模板文件时，请不要忘记忽略 `__template.` 末尾的点号。
>
> 例如：如果希望将 `.babelrc` 作为模板文件，其文件名将会是 `__template..babelrc`

例子：

```json
// __template.package.json
{
    "name": "<%= name %>",
    "dependencies": {
        // ...
    },
    "devDependencies": {
        // ...
    },
}
```

使用 `{ name: 'my-project' }` 注入时，输出文件将会是：

```json
// package.json
{
    "name": "my-project",
    "dependencies": {
        // ...
    },
    "devDependencies": {
        // ...
    },
}
```

### 配置文件

#### 文件类型及优先级

Dollie 提供配置文件来支持可配置化接口。目前 Dollie 会读取脚手架根目录下的 `dollie.json` 或 `dollie.js`（如果有的话）中的配置，以实现将某些行为和操作交给用户决定。

> 1. `dollie.json` 与 `dollie.js` 唯一的区别在于后者可以获得可编程化配置的支持
> 2. `dollie.js` 的优先级高于 `dollie.json`，当两者同时存在于一个脚手架时，后者将会被忽略
> 3. **配置文件是非必需的**。如果脚手架没有必须要使用配置文件的场景（例如：需要用户输入问题的回答），则不需要编写配置文件

#### 交互问题

Dollie 通过 [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#readme) 在 Interactive 模式下实现与用户的交互。当用户回答完问题后，其输入的结果将会作为 Props 与当前脚手架绑定，用于后续注入模板文件。

例子：

```json
{
    "questions": [
        {
            "name": "license",
            "message": "Please select a license",
            "type": "list",
            "choices": [
                {
                    "value": "mit",
                    "name": "MIT"
                },
                {
                    "value": "apache-2",
                    "name": "Apache License V2.0"
                },
                {
                    "value": "bsd",
                    "name": "BSD"
                }
            ]
        }
    ]
}
```

如果用户选择了第二项，则当前脚手架的 Props 将会是：

```js
{ license: 'apache-2' };
```

## 上传模板

Dollie 仅允许从互联网上拉取模板，并且目前仅支持 ZIP 类型的模板文件。因此，在编写好模板后，请将模板使用 ZIP 压缩并上传到互联网中，同时请确保向 Dollie 提供一个可以访问的 URL。

Dollie 内置对使用 GitHub 和 GitLab 托管模板的支持，并为其分别提供了[内置 Origin 函数](/zh-CN/api#内置-origins)。你可以直接将你编写好的模板提交给 GitHub 或 GitLab 托管。Dollie 的 GitHub 和 GitLab Origin 函数支持将模板仓库私有化（需要分别提供对应的 Access Token），对 GitLab 支持定义自托管服务域名等。因此，**通过 GitHub 或 GitLab 上传并托管模板可以满足绝大部分使用场景**，但 Dollie 仍然允许你注册[自定义的 Origin 函数](/zh-CN/guide/advanced#%E7%BC%96%E5%86%99-origin-%E5%87%BD%E6%95%B0)。

## 使用模板

### 模板名称解析规则

在使用模板时，Dollie 将会要求用户输入一个 `string` 类型的参数，我们把它叫做模板上下文 ID。这个参数的用途有：

- 传递给 Dollie `Generator`，由 `Generator` 解析字符串并选择合适的 Origin 函数
- `Generator` 调用 Origin 函数，将字符串传递给 Origin 函数
- Origin 函数根据输入的字符串和内部逻辑生成相应的 URL 和 HTTP 请求头，返回给 `Generator`

可被 Dollie 理解的模板上下文 ID 的格式为：`{origin}:{id}`，`origin` 用于帮助 `Generator` 选择 Origin 函数。该字段必须完全匹配[已注册的 Origin 函数名称](/zh-CN/guide/advanced#添加自定义-origin-函数)，并且是大小写敏感的。若 `Generator` 无法匹配到 Origin 函数，将会抛出错误并终止后续流程；如果用户没有传递上下文 ID 给 `Generator`，`Generator` 将会使用内置的 Origin 函数处理。

当 `Generator` 匹配到 Origin 函数时，将会调用这个函数，并将 `id` 作为形式参数传递给函数。此外，`Generator` 会接收 Origin 函数的执行结果，即模板 ZIP 文件的 URL 以及 HTTP 请求头，并继续后续流程。

### 创建 `Context` 实例

就像[使用 Dollie Core](/zh-CN/guide#使用-dollie-core) 一节中所述，请按照这一节中所描述的内容完成依赖的安装和准备工作。

你需要引入如下依赖：

```javascript
const fs = require('fs');
const path = require('path');
const { Context } = require('@dollie/core');
const inquirer = require('inquirer');
```

创建一个上下文，传入模板上下文 ID 和项目名称：

```javascript
// 创建一个 Dollie Context 实例，传入项目名称、使用的模板以及生成器配置
const context = new Context('foo', 'dolliejs/template-react', {
    generator: {
        getTemplateProps: async (questions) => {
            const answers = await inquirer.prompt(questions);
            return answers;
        },
        // ...其他配置项
    },
});
```

### 生成项目代码

上下文创建完成后，创建一个异步函数，在函数中调用 [`Context.prototype.generate`](/zh-CN/api#contextprototypegenerate-dolliegeneratorresult) 方法：

```javascript
async function run() {
    const result = await context.generate();
    // 根据 `result` 执行后续业务逻辑
}

run();
```

你将在 `result` 常量中获得本次生命周期结束后 Dollie 生成的目录结构及文件内容。你可以根据 `result` 进行后续的业务逻辑处理，例如写入文件到文件系统中，或任何其他用途。

### 使用 CLI

基于前文中提到的使用流程，根据大部分用户的需求，我们基于 Dollie 核心组件开发了一套开箱即用的命令行工具：Dollie CLI（包名：`@dollie/cli`）并纳入了 Dollie 的生态系统中，它能实现上述一切功能，并最终将你通过 Dollie 生成的项目代码目录结构和文件内容写入你的文件系统中。

你可以访问[这篇文档](/zh-CN/ecosystem/cli)进一步了解 Dollie CLI 的使用方法。
