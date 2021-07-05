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

其中，`template` 是交由 Dollie Origin 函数处理的

### 注册 Origin 函数

### 配置
