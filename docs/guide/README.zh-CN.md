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

Dollie（国际标准音标：*[dɒli]*），名称灵感来源于全球首例克隆羊 *Dolly*。Dollie 是工程项目效率工具套件，旨在降低脚手架编写与维护的时间成本和开发成本，以提高项目起步的效率和工程代码的可复用性。Dollie 将生成器逻辑和脚手架模板分离，从而极大程度地降低上手成本。

## 特性

- 脚手架云端化，即用即取，时刻保持脚手架版本一致性
- 编写极少代码甚至无需编写代码即可快速制作脚手架
- 支持脚手架增量覆盖，轻松生成多技术栈工程
- 支持传入配置、提供大量 API 以支持二次开发和定制

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
