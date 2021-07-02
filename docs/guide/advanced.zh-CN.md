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

在模板根目录中，建立一个名为 `extends` 的目录，在这个目录内存放所有扩展模板的目录。Dollie 将扩展模板目录名作为扩展模板的名称，并且大小写敏感。

例如，一个名为 `foo` 的扩展模板应该存放于模板根目录下的 `extends/foo` 目录中。

### 注册扩展模板配置

在模板配置文件中可以为所有扩展模板注册配置，除 `extendTemplates` 外，扩展模板的配置项与主模板配置项并无二致。在模板根目录的配置文件中的 `extendTemplates` 字段内添加以扩展模板名称（即扩展模板目录名）为键、以配置项为值的键值对即可注册扩展模板的配置。

例如，有一个名为 `foo` 扩展模板在配置文件中应该像下面的代码一样注册配置：

```json
{
    "questions": [
        // ...主模板问题
    ],
    // ...主模板其他配置
    "extendTemplates": {
        "foo": {
            // ...foo 扩展模板的配置
        }
    }
}
```

## 识别扩展模板

### 通过输入识别

Dollie 约定，在主模板或扩展模板的配置文件的 `questions` 字段中，如果某个问题的 `name` 字段为 `$EXTEND$`，用户对这个问题的回答内容将会被认为是扩展模板名称的输入。例如：

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

当用户的回答该问题时输入 `less` 时，Dollie 将会从 `https://github.com/dolliejs/extend-scaffold-less/tree/master` 下载该扩展模板的内容。

### 通过确认结果识别

### 通过列表/多选识别

> 请注意：
> - `$EXTEND$` 在 Dollie 中是**大小写敏感的**
> - 对于返回值为 `'null'`、空值的问题，Dollie 不会识别为任何扩展模板，因此**请不要将扩展模板命名为 `'null'`**

## 文件行为配置

Dollie 在模板配置文件中的 `files` 字段内定义了两个字段：`merge` 和 `delete`。对于上述所有字段，Dollie 都接受一个字符串数组作为每个字段的值，其中，数组元素为 [Glob 风格](https://en.wikipedia.org/wiki/Glob_(programming)) 的正则表达式用于匹配模板文件的相对路径（相对于项目根目录，以下简称“相对路径”）。

在生命周期内，Dollie 会遍历已生成的模板文件，若某个文件的相对路径在数组中匹配到了至少一次，那么 Dollie 将会对这个文件采取对应的策略。

对于上述两个字段，其含义分别如下：

### `files.merge`

Dollie 约定在增量覆盖时，所有扩展模板中的文件将会按照顺序依次覆盖主模板中的同名文件。但大多数情况下，模板的创建者和使用者都不希望已有的扩展模板对主模板同名文件的更改被新的扩展模板中的同名文件覆盖掉——他们希望保留每个扩展模板对同一文件的**所有更改**。

当扩展模板将文件写入目标目录时，如果文件名能匹配到该项配置中的某一条正则表达式，Dollie 将会记录其内容与文件初始内容的 Diff 结果，形成增量表（Patch Table），在最终写入文件内容时将该文件名下所有这样的增量表合并后作用到初始内容上。

### `files.delete`

在增量覆盖时，模板的创建者和使用者有时希望在某一个扩展模板生成完成后，删去已生成的某些文件，例如：一个 React 项目中如果使用了加入 TypeScript 支持的扩展模板，那么这个扩展模板就需要执行删除目录中使用 JavaScript 编写的代码文件。因此 `files.delete` 就能派上用场。

> 请注意：
> - Dollie 每次运行时，所有模板的上述两项配置中的值都会被叠加。

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
