---
order: 1
toc: 'menu'
title: '基础用法'
---

# 基础用法

## 术语规范

- 生成器：包含 Dollie 的所有生命周期，以及其中的业务逻辑，负责拉取、读取、写入脚手架模板等关键业务流程。Dollie 目前提供三种生成器：`DollieInteractiveGenerator`、`DollieComposeGenerator` 和 `DollieContainerGenerator`
- 主脚手架：又称为「模板」，是定义一个项目的目录结构和模板的实体。可以通过一定的文件命名规则被生成器解析，并被复制到用户指定的目标目录中。此外，它还可以通过约定的配置文件决定生成器在解析脚手架中的某个或某些文件时的行为
- 扩展脚手架：又称为「增量脚手架」，只能被脚手架依赖而不能单独被生成器读取运行。在每个项目生成器中的脚手架可以指定多个依赖，并根据一定的规则将依赖中的文件覆盖或合并到已有的文件中。依赖也可以指定多个依赖。Dollie 通过扩展脚手架实现可扩展性和扩展层级的可复用性

> 主脚手架和扩展脚手架均由用户编写，生成器是 Dollie 提供的核心模块

## 创建脚手架

### 命名规范

Dollie 根据用户输入的脚手架名称确定脚手架在 GitHub 上的 URL。主脚手架命名格式为 `$OWNER/scaffold-$SCAFFOLD_NAME#$CHECKOUT@$ORIGIN`。其中变量的含义如下：

- `$OWNER`：脚手架所在的 GitHub 命名空间，可以映射到 `https://github.com/$OWNER`。其默认值为 `dolliejs`
- `$SCAFFOLD_NAME`：脚手架名称，例如 `react`、`react-ts`
- `$CHECKOUT`：脚手架所在的分支 ID（可以是某一次提交的 Commit ID，也可以是别名，如 `master`、`dev`）。默认值为 `master`
- `$ORIGIN`：脚手架采用的远程 Git 服务，目前支持的服务有 `github`、`gitlab` 和 `bitbucket`

> 受 [BLM](https://blacklivesmatter.com/) 运动影响，GitHub 已将（在其平台上创建的）仓库的默认主分支名更改为 `main`。为了规避可能由此引起的 404 问题，在解析脚手架 URL 时，如果 `$CHECKOUT` 为 `master` 或者未指定（即使用默认值）并且使用 `master` 作为分支名会得到 404 错误，Dollie 会将 `$CHECKOUT` 切换至 `main` 再尝试拉取，如果再次得到 404 错误，Dollie 才会最终向用户抛出错误

用户在使用 Dollie 时可以仅输入 `$SCAFFOLD_NAME`，也可以输入完整的脚手架名称，Dollie 均可将其映射到正确的 URL 上（在脚手架仓库存在并且具有 `public` 权限的前提下）。

例子：

```
react                   -> https://github.com/dolliejs/scaffold-react/tree/master
dolliejs/scaffold-react -> https://github.com/dolliejs/scaffold-react/tree/master
lenconda/vue            -> https://github.com/lenconda/scaffold-vue/tree/master
angular#dev             -> https://github.com/dolliejs/scaffold-angular/tree/dev
lenconda/vue#dev@gitlab -> https://gitlab.com/lenconda/scaffold-vue/-/tree/dev
```

### 建立仓库

1. 前往 GitHub 创建一个以 `scaffold-` 或 `extend-scaffold-` 开头的仓库，请注意将开放程度设置为公开（Public）
2. 将脚手架中的所有文件提交到仓库中

## 配置文件

Dollie 提供配置文件来支持可配置化接口。目前 Dollie 会读取脚手架根目录下的 `.dollie.json` 或 `.dollie.js`（如果有的话）中的配置，以实现将某些行为和操作交给用户决定。

> 1. `.dollie.json` 与 `.dollie.js` 唯一的区别在于后者可以实现编程化操作
> 2. `.dollie.js` 的优先级高于 `.dollie.json`，当两者同时存在于一个脚手架时，后者将会被忽略
> 3. **配置文件是非必需的**。如果脚手架没有必须要使用配置文件的场景（例如：需要用户输入问题的回答），则不需要编写配置文件

### 交互问题

Dollie 通过 [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#readme) 在 Interactive 模式下实现与用户的交互。当用户回答完问题后，其输入的结果将会作为 Props 与当前脚手架绑定，用于后续注入模板文件。

> 1. 在 Compose 模式下，配置文件中所有的 `questions` 字段中的问题都将会失效
> 2. 请不要使用 `name` 作为 `Inquirer.Question` 的 `name`，因为它已经被 Dollie 内置了

例子：

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

如果用户选择了第二项，则当前脚手架的 Props 将会是：

```js
{ license: 'apache-2' };
```

### `installers`

Dollie 在该字段中内置了三种安装方法：`npm`、`yarn` 和 `bower`，分别对应 Yeoman 的 `Generator.prototype.npmInstall`、`Generator.prototype.yarnInstall` 以及 `Generator.prototype.bowerInstall`。

在写入目标目录完成后，Dollie 将会调用该字段的安装方法。在默认情况下，如果用户不指定该字段，Dollie 将默认执行 `npm` 安装方法。如果不希望 Dollie 执行任何安装方法，可以将该字段设置为 `[]`。

### `endScripts`

Dollie 在配置文件中提供 `endScripts` 字段，用户可以在其中多个字符串或函数代码，用于在所有脚手架中的文件写入目标目录完成后执行。

例子：

```json
{
  "endScripts": [
    "ls -al",
    "cat package.json"
  ]
}
```

## 模板文件

Dollie 约定：凡是以 `__template.`开头的字符串作为文件名的文件都将被认为是模板文件。模板文件将会被 [EJS](https://ejs.co) 引擎解析，并将一些 Props 作为变量注入，从而形成目标文件（目标文件的文件名见会被删去 `__template.`）。

> 当某个以 `.` 开头的文件需要作为模板文件时，请不要忘记忽略 `__template.` 末尾的点号，例如：如果希望将 `.babelrc` 作为模板文件，其文件名将会是 `__template..babelrc`

例子：

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

使用 `{ name: 'my-project' }` 注入时，输出文件将会是：

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
