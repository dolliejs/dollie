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

安装 Dollie.js 核心套件

```bash
$ npm i @dollie/core -S
```

在任意一个 JavaScript 脚本中引入 Dollie.js 核心套件：

```javascript

const { Context } = require('@dollie/core');

const context = new Context();
```
