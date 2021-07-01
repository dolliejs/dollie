---
order: 1
toc: 'menu'
title: '基础用法'
---

# 基础用法

## 建立模板

### 目录结构

<Tree>
  <ul>
    <li>
      file
      <small>comments</small>
      <!--
      <ul>
        <li>
          file
          <small>comments</small>
        </li>
        <li>
          ...
          <ul>
            <li>...</li>
          </ul>
        </li>
      </ul>
      -->
    </li>
  </ul>
</Tree>

### 上传模板

1. 前往 GitHub 创建一个以 `scaffold-` 或 `extend-scaffold-` 开头的仓库，请注意将开放程度设置为公开（Public）
2. 将脚手架中的所有文件提交到仓库中

## 内置 Origin 列表

## 动态文件

Dollie 约定：凡是以 `__template.`开头的字符串作为文件名的文件都将被认为是「动态文件」。动态文件将会被 [EJS](https://ejs.co) 引擎解析，并将一些配置项以 EJS Props 的形式作为变量注入，从而形成目标文件（目标文件的文件名见会被删去 `__template.`）内容。

> 当某个以 `.` 开头的文件需要作为模板文件时，请不要忘记忽略 `__template.` 末尾的点号。
>
> 例如：如果希望将 `.babelrc` 作为模板文件，其文件名将会是 `__template..babelrc`

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

## 模板配置文件

### 文件类型及优先级

Dollie 提供配置文件来支持可配置化接口。目前 Dollie 会读取脚手架根目录下的 `dollie.json` 或 `dollie.js`（如果有的话）中的配置，以实现将某些行为和操作交给用户决定。

> 1. `dollie.json` 与 `dollie.js` 唯一的区别在于后者可以实现编程化操作
> 2. `dollie.js` 的优先级高于 `dollie.json`，当两者同时存在于一个脚手架时，后者将会被忽略
> 3. **配置文件是非必需的**。如果脚手架没有必须要使用配置文件的场景（例如：需要用户输入问题的回答），则不需要编写配置文件

### 交互问题

Dollie 通过 [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#readme) 在 Interactive 模式下实现与用户的交互。当用户回答完问题后，其输入的结果将会作为 Props 与当前脚手架绑定，用于后续注入模板文件。

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
