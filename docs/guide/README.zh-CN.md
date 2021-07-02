---
order: 0
toc: 'menu'
title: '指南'
nav:
  title: '用户文档'
  order: 0
---

# 指南

## 介绍

### 命名

Dollie（国际标准音标：*[dɒli]*），命名的灵感来源于全球首例克隆羊 *Dolly*（音同 *Dollie*）。

Dollie 是一款工程项目效率工具套件，旨在降低模板编写与维护的时间成本和开发成本，以提高项目起步的效率和工程代码的可复用性。Dollie 将生成器逻辑和模板分离，从而很大程度地降低各方面的成本。

### Dollie 是如何运行的

下图可以大致描述 Dollie 核心组件如何与其他外围组件沟通协调并实现预期功能。

![structure](/public/images/structure.png)

Dollie 的成功运行离不开核心组件 `@dollie/core`、用户代理和 Origin 函数的紧密合作。Dollie 核心组件实现了与项目代码生成的一切相关逻辑，并提供了一系列 API 用于与用户代理传送和接收数据。用户代理一般是指将 Dollie 核心业务逻辑展现给用户，并面向用户提供一切所需要的交互。Dollie 官方提供的 [CLI 工具](/zh-CN/ecosystem#cli) `@dollie/cli` 就是用户代理的一种实现，它可以帮助用户处理核心组件运行过程中的用户中断操作，例如向用户询问 EJS Props、处理由于多个增量模板在覆盖过程中对同一文件的修改所导致的冲突等。

由于 Dollie 只允许从远程拉取模板，但每次都向用户索取 URL 显得有些麻烦，因此 Dollie 提供了 Origin 机制帮助用户以较简短的字符串让 Dollie 选择合适的 Origin 函数生成 URL 和 HTTP 请求头，并实现模板的拉取。Dollie 内置了两个 Origin 函数，分别是 [GitHub](https://github.com/dolliejs/dollie/blob/master/packages/@dollie/origins/src/handlers/github.ts) 和 [GitLab](https://github.com/dolliejs/dollie/blob/master/packages/@dollie/origins/src/handlers/gitlab.ts)，它们可以分别帮助你从 GitHub 和 GitLab 仓库中拉取所需模板。在用户提供模板名称字符串后，Dollie 将会选择合适的 Origin 函数按照[一定的规则](/zh-CN/guide/basic#模板名称解析规则)解析模板名称，最终形成 URL 并从 Origin 拉取模板。

### 生命周期

下图描述了 Dollie 上下文的生命周期。在简单使用的情况下，生命周期对于外部来说是不可感知的；但对于基于 Dollie 核心组件进行二次开发的情况，理解生命周期函数以及掌握 Dollie 会在每个生命周期函数中做哪些事就比较有必要了。

![lifecycle](/public/images/lifecycle.png)

## 特性

- 模板云端化，即用即取，时刻保持模板版本一致性
- 编写极少代码甚至无需编写代码即可快速制作模板
- 支持模板增量覆盖，轻松生成多技术栈工程
- 支持传入配置、提供大量 API 以支持二次开发和定制

## 术语规范

### 生成器（`Generator`）

Dollie 最核心的组件，包含 Dollie 的一切业务逻辑，从读取配置，到拉取模板、生成项目代码文件、注入参数、询问、解决冲突等逻辑。Dollie 将这些逻辑分别封装为生成器中的各个方法，以供生命周期时调用。

> Dollie 不希望将 `Generator` 暴露给用户，所有业务逻辑均由上下文所提供的生命周期承载，因此请勿自行引入 `Generator`。

### 上下文（`Context`）

负责编排 `Generator` 所提供的方法，形成生命周期。上下文暴露了 `generate` 方法，以供使用者调用并获得项目代码生成结果。

### 主模板（Template）

又称为「模板」，是定义一个项目的目录结构和模板的实体。

可以通过约定的文件命名规则被生成器解析，并被复制并生成相应的项目文件和目录结构。

此外，它还可以通过约定的配置文件决定生成器在解析模板中的某个或某些文件时的行为。

### 扩展模板（Extend Template）

又称为「增量模板」，只能被主模板依赖而不能单独被生成器读取运行。

在每个上下文中，模板可以指定多个依赖，并根据一定的规则将依赖中的文件覆盖或与已有文件内容合并。

依赖也可以指定多个依赖。Dollie 通过扩展模板实现可扩展性和扩展层级的可复用性

> 主模板和扩展模板均由用户编写，生成器是 Dollie 提供的核心模块

## 快速上手

### 环境配置

Dollie 依赖 [Node.js](https://nodejs.org/en/download/)，并且要求其版本在 v10.0.0 以上：

```bash
$ node -v
v10.18.0
```

### 使用 Dollie Core

安装 Dollie.js 核心套件

```bash
$ npm i @dollie/core -S
$ npm i inquirer -S
```

在任意一个 JavaScript 代码文件中引入 Dollie.js 核心套件：

```javascript
const fs = require('fs');
const path = require('path');
const { Context } = require('@dollie/core');
const inquirer = require('inquirer');

// 在一个函数中调用
async function run() {
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

	// 调用 generate 方法完成模板生成，生成完毕后会返回包含文件路径和内容的对象
	const result = (await context.generate()) || {};
	const files = result.files || {};

	// 遍历这个对象的键，键名是相对路径，值是文件内容
	for (const filePathname of Object.keys(files)) {
		// 获取当前文件内容
		const fileContent = files[filePathname];
		// 写入内容到的文件系统中
		fs.writeFileSync(path.resolve(process.cwd(), name, filePathname), fileContent);
	}
};

run();
```
