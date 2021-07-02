---
order: 2
toc: 'menu'
title: '进阶用法'
---

# 进阶用法

## 编写扩展模板

### 主要使用场景

- 主模板需要扩充多个维度的功能（例如：React 主模板可能需要添加 TypeScript、Sass/Less/Stylus 预处理器、React Router、状态管理等功能或模块）
- 主模板只用于提供基础项目文件，而将其他代表各个模块或功能的文件存放于扩展模板中

### 存放位置

### 注册扩展模板配置

## 使用扩展模板

Dollie 约定，在主模板或扩展模板的配置文件的 `questions` 字段中，如果某个问题的 `name` 字段为 `$DEPENDS_ON$`，用户对这个问题的回答内容将会被认为是扩展模板名称的输入。例如：

```json
{
  "questions": [
    {
      "name": "$DEPENDS_ON$",
      "message": "Input the css preprocessor",
      "type": "input"
    }
  ]
}
```

当用户的回答该问题时输入 `less` 时，Dollie 将会从 `https://github.com/dolliejs/extend-scaffold-less/tree/master` 下载该扩展模板的内容。

> `$DEPENDS_ON$` 在 Dollie 中是**大小写敏感的**

## 文件行为配置

Dollie 在模板配置文件中的 `files` 字段内定义了两个字段：`merge` 和 `delete`，其含义分别如下：

### `files.merge`

Dollie 约定在增量覆盖时，所有扩展模板中的文件将会按照顺序依次覆盖主模板中的同名文件。但大多数情况下，模板的创建者和使用者都不希望已有的扩展模板对主模板同名文件的更改被新的扩展模板中的同名文件覆盖掉——他们希望保留每个扩展模板对同一文件的**所有更改**。

当扩展模板将文件写入目标目录时，如果文件名能匹配到该项配置中的某一条正则表达式，Dollie 将会记录其内容与文件初始内容的 Diff 结果，形成增量表（Patch Table），在最终写入文件内容时将该文件名下所有这样的增量表合并后作用到初始内容上。

### `files.delete`

在增量覆盖时，模板的创建者和使用者有时希望在某一个扩展模板生成完成后，删去已生成的某些文件，例如：一个 React 项目中如果使用了加入 TypeScript 支持的扩展模板，那么这个扩展模板就需要执行删除目录中使用 JavaScript 编写的代码文件。因此 `files.delete` 就能派上用场。

当写入文件操作完成后，删除在该项配置的数组中的所有文件。Dollie 每次运行时，所有模板的该项配置中的值都会被叠加。

例如：主模板的配置为：

```json
{
  "files": {
    "delete": [
      ".eslintignore"
    ]
  }
}
```

其依赖的扩展模板中的配置为（假设本次运行主模板仅依赖此扩展模板）：

```json
{
  "files": {
    "delete": [
      "src/(.*).js(x?)"
    ]
  }
}
```

则最终的结果为：

```json
{
  "delete": [
    ".eslintignore",
    "src/(.*).js(x?)"
  ]
}
```

当 Dollie 在将扩展模板中的文件写入目标目录时，如果该文件既不能被 `files.add` 匹配，也不能被 `files.merge` 匹配，并且目标目录中不存在同名文件，Dollie 将会忽略这个文件。但若目标目录中存在同名文件，Dollie 将会用当前扩展模板的文件内容覆盖到目标目录的同名文件中。

> 请注意：
> 1. 对于主模板中的任何文件，上述覆盖规则无效
> 2. `files.merge` 仅对扩展模板有效

## `cleanups` 队列

Dollie 在 `.dollie.js` 的 `endScripts` 提供了函数的支持，用户可以在该项配置中提供一个带有 Dollie 上下文的回调函数.

Dollie 的上下文暴露了封装的 `fs` 实用工具以及被 Dollie 解析后的模板配置树（即包含依赖关系的模板基本信息）：

例如：

```js
module.exports = {
  endScripts: [
    (context) => {
      if (context.fs.exists('tsconfig.json')) {
        fs.remove('src/App.js');
        fs.remove('src/index.js');
      }
    },
  ],
};
```

上述代码会在 Dollie 写入目标目录完毕后执行，当项目根目录存在 TypeScript 的配置时，删除 JSX 代码文件。

> 上下文中的 `fs` 都是以项目根目录作为基础路径的，使用时无需调用 `path.resolve` 等相关方法即可进行文件操作

## 编写 Origin 函数

### 文件内容

### 文件存放位置

### 注册 Origin 函数

## 处理文件冲突

### 为什么会产生冲突

### 接收 Dollie Core 抛出的冲突

### 向用户报告冲突并寻求解决方案

### 向 Dollie Core 告知解决方案
