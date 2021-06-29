---
order: 2
toc: 'menu'
title: '进阶用法'
---

# 进阶用法

## 扩展脚手架

### 命名规范

扩展脚手架是一种可以对某一个主脚手架中的某些文件进行增量补充和覆盖的脚手架，Dollie 每次运行只能指定一个主脚手架，主脚手架可以依赖一个或多个扩展脚手架来对其本身进行补丁（Patch）操作。同样地，扩展脚手架也可以依赖一个或多个扩展脚手架。

> 扩展脚手架只能被主脚手架及其父级扩展脚手架依赖，而不能通过 Dollie 直接生成工程

扩展脚手架命名格式为 `$NAMESPACE/extend-scaffold-$EXTEND_SCAFFOLD_NAME#$BRANCH`。其中变量的含义如下：

- `$OWNER`：脚手架所在的 GitHub 命名空间，可以映射到 `https://github.com/$OWNER`。其默认值为 `dolliejs`
- `$EXTEND_SCAFFOLD_NAME`：脚手架名称，例如 `react-ts`、`react-sass`
- `$CHECKOUT`：脚手架所在的分支 ID（可以是某一次提交的 Commit ID，也可以是别名，如 `master`、`dev`）。默认值为 `master`
- `$ORIGIN`：脚手架采用的远程 Git 服务，目前支持的服务有 `github`、`gitlab` 和 `bitbucket`

用户在使用 Dollie 时可以仅输入 `$EXTEND_SCAFFOLD_NAME`，也可以输入完整的脚手架名称，Dollie 均可将其映射到正确的 URL 上（在脚手架仓库存在并且具有 `public` 权限的前提下）。

例子：

```
react-ts                -> https://github.com/dolliejs/extend-scaffold-react-ts/tree/master
dolliejs/scaffold-react -> https://github.com/dolliejs/extend-scaffold-react/tree/master
lenconda/vue-jsx        -> https://github.com/lenconda/extend-scaffold-vue-jsx/tree/master
angular-rxjs#dev        -> https://github.com/dolliejs/extend-scaffold-angular-rxjs/tree/dev
```

### 主要使用场景

- 主脚手架需要扩充多个纬度的功能（例如：React 主脚手架可能需要添加 TypeScript、Sass/Less/Stylus 预处理器、React Router、状态管理等功能或模块）
- 主脚手架只用于提供基础项目文件，而将其他代表各个模块或功能的文件存放于扩展脚手架中

### 声明依赖

Dollie 约定，在主脚手架或扩展脚手架的配置文件的 `questions` 字段中，如果某个问题的 `name` 字段为 `$DEPENDS_ON$`，用户对这个问题的回答内容将会被认为是扩展脚手架名称的输入。例如：

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

当用户的回答该问题时输入 `less` 时，Dollie 将会从 `https://github.com/dolliejs/extend-scaffold-less/tree/master` 下载该扩展脚手架的内容。

> `$DEPENDS_ON$` 在 Dollie 中是大小写敏感的

## 文件行为

Dollie 在脚手架配置文件中的 `files` 字段内定义了三个字段：`add`、`merge` 和 `delete`，其含义分别如下：

### `files.add`

当扩展脚手架将文件写入目标目录时，如果文件名能匹配到该项配置中的某一条正则表达式，Dollie 会将其直接添加到目标目录。如果目标目录存在同名文件，也会将其完全覆盖。

### `files.merge`

当扩展脚手架将文件写入目标目录时，如果文件名能匹配到该项配置中的某一条正则表达式，Dollie 将会记录其内容与文件初始内容的 Diff 结果，形成增量表（Patch Table），在最终写入文件内容时将该文件名下所有这样的增量表合并后作用到初始内容上。

### `files.delete`

当写入文件操作完成后，删除在该项配置的数组中的所有文件。Dollie 每次运行时，所有脚手架的该项配置中的值都会被叠加。例如：主脚手架的配置为：

```json
{
  "files": {
    "delete": [
      ".eslintignore"
    ]
  }
}
```

其依赖的扩展脚手架中的配置为（假设本次运行主脚手架仅依赖此扩展脚手架）：

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

Dollie 采用非贪婪的覆盖原则写入扩展脚手架中的文件。

当 Dollie 在将扩展脚手架中的文件写入目标目录时，如果该文件既不能被 `files.add` 匹配，也不能被 `files.merge` 匹配，并且目标目录中不存在同名文件，Dollie 将会忽略这个文件。但若目标目录中存在同名文件，Dollie 将会用当前扩展脚手架的文件内容覆盖到目标目录的同名文件中。

> 1. 对于主脚手架中的任何文件，上述覆盖规则无效
> 2. `files.add` 和 `files.merge` 仅对扩展脚手架有效

## `endScripts` 函数

Dollie 在 `.dollie.js` 的 `endScripts` 提供了函数的支持，用户可以在该项配置中提供一个带有 Dollie 上下文的回调函数.

Dollie 的上下文暴露了封装的 `fs` 实用工具以及被 Dollie 解析后的脚手架配置树（即包含依赖关系的脚手架基本信息）：

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

## 处理冲突

当不同的扩展脚手架对同一文件的同一行产生了一个或多个补丁时，Dollie 就会判定该文件该行存在冲突。冲突的双方分别被称为 `former` 和 `current`，但通常情况下，Dollie 会把所有的冲突归为后者。

Dollie 为用户提供了几种解决冲突的选项：

### 直接选择保留区块

![dollie_advanced_conflict_select_directly](/public/images/dollie_advanced_conflict_select_directly.gif)

### 手动选择保留行

![dollie_advanced_conflict_select_manually](/public/images/dollie_advanced_conflict_select_manually.gif)

### 编辑冲突区块

![dollie_advanced_conflict_edit](/public/images/dollie_advanced_conflict_edit.gif)

当然，用户也可以放弃冲突处理。被放弃处理冲突的文件将会被 Dollie 以 Git 风格标注：

![dollie_advanced_conflict_example](/public/images/dollie_advanced_conflict_example.jpg)

## Dollie Compose

Dollie Compose 是 Dollie 提供的一种便捷的方式，用于通过配置代替交互式命令行中处理交互问题和冲突的过程。

### 基本语法

Dollie Compose 的配置文件采用 YAML 语法，用户需要在每个配置文件中指定项目名称和主脚手架：

```yml
# config.yml
project_name: project

scaffold_config:
  scaffold_name: react
  dependencies:
    - scaffold_name: react-ts
    - scaffold_name: react-less
```

执行：

```bash
$ dollie compose ./config.yml
```

Dollie 将会读取其中的内容并解析生成脚手架依赖关系树，随后递归拉取所有脚手架，并写入目标目录：

![dollie_advanced_compose](/public/images/dollie_advanced_compose.gif)

### 指定 Props

在每个脚手架中指定 `props` 字段：

```yml
# config.yml
project_name: project

scaffold_config:
  scaffold_name: react
  props:
    license: mit
    author: lenconda <i@lenconda.top>
  dependencies:
    - scaffold_name: react-ts
    - scaffold_name: react-less
```

### 处理冲突

在 YAML 配置文件最顶层指定 `conflict_keeps` 字段：

```yml
conflict_keeps:
  package.json:
    -
      all
```

此处代表保留冲突双方所有的行

```yml
conflict_keeps:
  package.json:
    -
      former
```

此处代表保留冲突双方中属于 `former` 的行

```yml
conflict_keeps:
  package.json:
    -
      former:
        - 0
      current:
        - 0
        - 1
        - 2
```

此处代表保留 `former` 的第一行以及 `current` 的前三行

```yml
conflict_keeps:
  package.json:
    - |
      "dep1": "^1.0.0",
      "dep2": "^2.0.0",
```

此处代表使用 `"dep1": "^1.0.0",\n"dep2": "^2.0.0",\n` 代替该处冲突区域的内容
