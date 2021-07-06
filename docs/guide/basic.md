---
order: 1
toc: 'menu'
title: 'Basic Usages'
---

# Basic Usages

## Create a Template

### Directory Structure

<Tree>
    <ul>
        <li>
            main
            <small>main template dir</small>
            <ul>
                <li>
                    ...
                    <small>main template files</small>
                </li>
            </ul>
        </li>
        <li>
            extends
            <small>extend templates dir</small>
            <ul>
                <li>
                    foo
                    <small>extend template `foo` root dir</small>
                    <ul>
                        <li>
                            ...
                            <small>extend template `foo` files</small>
                        </li>
                    </ul>
                </li>
                <li>
                    bar
                    <small>extend template `bar` root dir</small>
                    <ul>
                        <li>
                            ...
                            <small>extend template `bar` files</small>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
        <li>
            dollie.js | dollie.json
            <small>configuration file</small>
        </li>
    </ul>
</Tree>

### Dynamic Template Files

Dollie constraint that any file with a string starting with `__template.` as the filename will be considered as a "dynamic file". The dynamic file will be parsed by the [EJS](https://ejs.co) engine and configuration items will be injected as variables in the form of EJS Props to form the target file (the target file will have the `__template.` removed from its filename).

> When a file starting with `.`, please don't forget to ignore the dot at the end of `__template.` when a file starting with `.` needs to be used as a template file.
>
> For example, if you want to use `.babelrc` as a template file, the file name will be `__template..babelrc`

Example:

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

When inject props using `{ name: 'my-project' }`, the output content of the file will be:

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

### Configuration File

#### File Types and Priorities

Dollie provides configuration files to support the configurable interface. Currently Dollie reads configuration from `dollie.json` or `dollie.js` (if available) in the scaffolding root directory to enable certain behaviors and actions to be left to the user's decision.

> 1. The only difference between `dollie.json` and `dollie.js` is that the latter can get programmable configuration support
> 2. `dollie.js` has higher priority than `dollie.json`, and when both are present in a scaffold, the latter will be ignored
> 3. **Configuration files are non-required**. If there are no scenarios where the scaffold must use a configuration file (e.g., requiring the user to enter an answer to a question), then a configuration file is not required

#### Interact Questions

Dollie interacts with the user in Interactive mode via [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#readme). After the user answers the question, the result of their input is bound to the current scaffold as props for subsequent injection into the template file.

Example:

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

If the user selects the second option, the current props for the scaffold will be:

```js
{ license: 'apache-2' };
```

## Upload Template

Dollie only allows templates to be pulled from the Internet and currently only supports templates of the ZIP format. Therefore, once you have written your template, please compress it in a ZIP file and upload it to the Internet, and make sure you provide Dollie with an accessible URL.

Dollie has built-in support for hosting templates using GitHub and GitLab, and provides a [built-in Origin function](/zh-CN/api#内置-origins) for each. You can submit your templates directly to GitHub or GitLab, Dollie's GitHub and GitLab Origin functions support making template repositories private (with separate access tokens), defining self-hosted service domains for GitLab, and more. So, **uploading and hosting templates via GitHub or GitLab will work for most scenarios**, but Dollie still allows you to [register custom Origin functions](/zh-CN/guide/advanced#%E7%BC%96%E5%86%99-origin-%E5%87%BD%E6%95%B0).

## Use Templates

### Template Name Resolution Rules

在使用模板时，Dollie 将会要求用户输入一个 `string` 类型的参数，我们把它叫做模板上下文 ID。这个参数的用途有：

- 传递给 Dollie `Generator`，由 `Generator` 解析字符串并选择合适的 Origin 函数
- `Generator` 调用 Origin 函数，将字符串传递给 Origin 函数
- Origin 函数根据输入的字符串和内部逻辑生成相应的 URL 和 HTTP 请求头，返回给 `Generator`

可被 Dollie 理解的模板上下文 ID 的格式为：`{origin}:{id}`，`origin` 用于帮助 `Generator` 选择 Origin 函数。该字段必须完全匹配[已注册的 Origin 函数名称](/zh-CN/guide/advanced#添加自定义-origin-函数)，并且是大小写敏感的。若 `Generator` 无法匹配到 Origin 函数，将会抛出错误并终止后续流程；如果用户没有传递 `origin` 给 `Generator`，`Generator` 将会使用内置的 Origin 函数处理。

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

上下文创建完成后，创建一个异步函数，在函数中调用 `Context.prototype.generate` 方法：

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

你可以访问[这篇文档](/zh-CN/ecosystem#cli)进一步了解 Dollie CLI 的使用方法。
