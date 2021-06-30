---
order: 0
toc: 'menu'
title: '指南'
nav:
  title: '用户文档'
  order: 0
---

# 指南

## 什么是 Dollie

Dollie（国际标准音标：*[dɒli]*）是工程项目效率工具套件，基于 [Yeoman](https://yeoman.io/) 封装，旨在降低脚手架编写与维护的时间成本和开发成本，以提高项目起步、复用的效率。但与 Yeoman 不同，Dollie 将生成器逻辑和脚手架模板分离，从而极大程度地降低上手成本。

## 特性

- 脚手架云端化，即用即取，时刻保持脚手架版本一致性
- 编写极少代码甚至无需编写代码即可快速制作脚手架
- 支持脚手架增量覆盖，轻松生成多技术栈工程
- 同时支持交互式命令行和一键式配置化生成项目
- 支持传入配置、提供大量 API 以支持二次开发和定制

## 快速上手

### 环境配置

Dollie 依赖 [Node.js](https://nodejs.org/en/download/)，并且要求其版本在 v10.0.0 以上：

```bash
$ node -v
v10.18.0
```

### 生成项目工程

在 Shell 中执行

```bash
$ dollie
```

根据提示回答完所有交互问题即可：

![dollie_guide_quickstart.gif](https://i.loli.net/2021/02/23/6C1gY32NwkZ45d9.gif)
