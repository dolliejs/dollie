---
order: 1
toc: 'menu'
title: 'CLI'
---

# CLI

## 介绍

Dollie CLI 是一个基于 Dollie Core API 开发的具有完整功能的用户代理的实现，它提供最简单的方式帮助你快速上手 Dollie Core 的使用，而无需自己实现一个用户代理。Dollie CLI 旨在提供开箱即用的 Dollie 使用体验，同时也针对大部分用户人群的使用场景提供了适当的优化和设计，从而使用户可以更加专注于编写 Dollie 项目模板，而无需关注具体的 API 使用方法。

## 安装

> **Node.js 版本要求**
>
> Dollie CLI 3.x 需要 [Node.js](http://nodejs.org) v10.x 或更高版本。

使用下列命令安装 Dollie CLI

```bash
npm install @dollie/cli -g
```

安装完成后，你可以在命令行中访问 `dollie` 命令。

你可以通过简单运行如下命令以验证 Dollie CLI 是否安装成功：

```bash
dollie --version
```

或

```bash
dollie --help
```

## 使用方法

### 创建一个项目

执行以下命令，使用已存在的模板来创建一个新的项目：

```bash
dollie init <template> <project_name> 
```

其中，`template` 是交由 Dollie Origin 函数处理的[上下文 ID](/zh-CN/guide/basic#模板名称解析规则)。

例子：

使用 GitHub 上 Dollie 官方提供的 [`template-react`](https://github.com/dolliejs/template-react) 模板创建一个名为 `test` 的项目：

```bash
dollie init github:dolliejs/template-react test
```

在执行上述命令后，Dollie 核心组件将会从 [https://github.com/dolliejs/template-react](https://github.com/dolliejs/template-react) 中拉取模板，读取模板中的 `dollie.js` 中的 `questions` 字段并由 CLI 通过 [Inquirer](https://www.npmjs.com/package/inquirer) 提出问题：

![cli-init-project.jpg](/public/images/cli-init-project.jpg)

你必须按照提问内容回答完所有的问题：

![cli-answer-questions.jpg](/public/images/cli-answer-questions.jpg)

问题回答完成后，Dollie 核心组件开始生成项目代码。如果 Dollie 在上下文中生成的项目代码中未检测到[存在冲突](/guide/advanced#为什么会产生冲突)，将会直接把最终结果返回给 CLI，并由 CLI 将生成结果写入到你的文件系统中：

![cli-init-result.jpg](/public/images/cli-init-result.jpg)

### 解决文件冲突

正如上文所说的，如果 Dollie 发现有任何一个文件存在冲突的情况，将会由 Dollie 核心组件抛出依次抛出冲突信息，CLI 将会接收这些信息并向用户发送中断以寻求用户的反馈，最终将用户的选择返回给 Dollie 核心组件。

我们还是以上面的例子为基础，展示 Dollie CLI 提供解决冲突的方式。我们在回答模板问题时，选择 TypeScript、Less 和 Redux 技术栈，在生成项目代码时，上述选择将会同时向 `package.json` 和 `src/App.tsx` 的同一行之后添加各自的内容，从而导致冲突的产生：

![conflict-selections.jpg](/public/images/conflict-selections.jpg)

CLI 提供 3 种解决冲突的方式：选择需要保留的冲突组、逐行手动选择需要保留的行、打开 [Vim 编辑器](https://www.vim.org/)编辑。

我们依次选用这三种方式展示解决冲突的过程：

#### 选择需要保留的冲突组

Dollie 会将冲突的行全部放置于 `current` 数组中，并在 CLI 提示时为每一行添加 `[current]` 前缀。Dollie 会在使用这种方式选择需要保留的行时，会向用户提供四种选择：

- 保留所有行
- 保留 `former` 里的所有行（相当于全部丢弃）
- 保留 `current` 里的所有行（相当于全部保留）
- 丢弃所有行

![cli-conflict-select-group.jpg](/public/images/cli-conflict-select-group.jpg)

#### 逐行手动选择需要保留的行

Dollie 基于 Inquirer 多选框提供了手动选择需要保留的行的功能，相较于第一种方式，这种方式更加灵活和清晰：

![cli-conflict-select-lines.jpg](/public/images/cli-conflict-select-lines.jpg)

使用键盘的上/下键选中需要保留的行，按空格键选中，即可决定保留这一行。

#### 打开 Vim 编辑器编辑

Dollie 借助 Inquirer 的能力实现了打开 Vim 编辑器并提供给用户编辑的功能。用户可以选择打开 Vim 编辑器编辑冲突区块的内容，选择自己所需要的行以及添加、修改、删除任何内容：

![cli-conflict-vim.jpg](/public/images/cli-conflict-vim.jpg)

Vim 保存的结果将会作为已解决的冲突区块的最终内容。

### 注册 Origin 函数

准备好可以被 Dollie 理解的 [Origin 函数文件](/zh-CN/guide/advanced#文件内容)并[存放至合适的位置](/zh-CN/guide/advanced#文件存放位置)，执行以下命令：

```bash
dollie origin add <name> <pathname>
```

例如：

```bash
dollie origin add custom_github ~/github.origin.js
```

在使用 `dollie init` 命令生成项目代码时，就可以通过 `custom_github` 使用这个 Origin 函数：

```bash
dollie init custom_github:foo bar
```

### 配置

Dollie CLI 以设置键值对的方式实现参数配置，并向用户提供如下配置项：

```typescript
interface CLIConfig {
    origin?: Record<string, any>;    // Origin 函数配置，可以传递任何值
    // 拉取模板的加载器配置
    loader?: {
        httpProxyUrl?: string;       // 加载器使用的本地代理 URL
        httpProxyAuth?: string;      // 如果本地代理使用认证，那么就必须填写这个字段
        maximumRetryCount?: string;  // 最大重试次数
    };
}
```

Dollie 只允许用户以 [Lodash `get` 风格](https://lodash.com/docs#set)设置配置项。例如，如果希望修改加载器使用的本地代理的 URL，可以执行下面的命令：

```bash
dollie config set loader.httpProxyUrl http://127.0.0.1:1086
```

同时，Dollie `config` 命令还支持 `delete` 和 `get` 两个子命令，其中访问配置项的方式与 `config set` 相同。
