---
order: 2
toc: 'menu'
title: 'API'
nav:
  title: 'API'
  order: 2
---

# API

## `@dollie/core`

### 类型和接口

#### `MessageHandler`

接收并处理从 Dollie 上下文中发出的消息。

```typescript
type MessageHandler = (message: string) => void;
```

#### `ErrorHandler`

```typescript
type ErrorHandler = (error: Error) => void;
```

#### `InquirerAnswers`

Inquirer 问题回答格式。

```typescript
type InquirerAnswers = Record<string, any>;
```

#### `LoaderConfig`

Dollie 加载器配置，用于传递给 `Got` 实例。

```typescript
interface HttpOptions {
    // HTTP 本地代理 URL
    httpProxyUrl?: string;
    // 如果本地代理需要认证，请指定该选项
    httpProxyAuth?: string;
}

interface LoaderOptions extends HttpOptions {
    // 最大重试次数
    maximumRetryCount?: number;
}

type LoaderConfig = LoaderOptions & GotOptions;
```

#### `GeneratorConfig`

Dollie `Generator` 配置。

```typescript
interface GeneratorConfig {
    // Origin 配置
    origin?: OriginConfig;
    // Origin 函数列表
    origins?: Origin[];
    // 加载器配置，用于拉取模板、读取自定义 Origin 函数等
    loader?: LoaderConfig;
    // 向用户获取模板问题的回答
    getTemplateProps?: (questions: Question[]) => Promise<InquirerAnswers>;
    // 向用户报告冲突并获取冲突的解决方案
    conflictsSolver?: (data: ConflictSolverData) => Promise<ConflictSolveResult>;
    // 接收并处理从 Dollie 上下文中发出的消息
    onMessage?: MessageHandler;
}
```

依赖类型：

- [`MessageHandler`](/zh-CN/api#messagehandler)
- [`InquirerAnswers`](/zh-CN/api#dollieanswers)
- [`LoaderConfig`](/zh-CN/api#loaderconfig)
- [`ConflictSolveResult`](/zh-CN/api#conflictresolveresult)
- [`ConflictSolverData`](/zh-CN/api#conflictresolverdata)
- [`OriginConfig`](/zh-CN/api#dollieoriginconfig)
- [`Origin`](/zh-CN/api#dollieorigin)

#### `Config`

Dollie `Context` 配置。

```typescript
interface Config {
    // `Generator` 配置
    generator?: GeneratorConfig;
    // 生命周期状态变更接收函数
    onStatusChange?: StatusChangeHandler;
    // 错误信息接收函数
    onError?: ErrorHandler;
    // 一般信息接收函数
    onMessage?: MessageHandler;
}
```

依赖类型：

- [`GeneratorConfig`](/zh-CN/api#dolliegeneratorconfig)
- [`StatusChangeHandler`](/zh-CN/api#statuschangehandler)
- [`ErrorHandler`](/zh-CN/api#errorhandler)
- [`MessageHandler`](/zh-CN/api#messagehandler)

#### `StatusChangeHandler`

上下文运行时状态变更接收函数。

```typescript
type StatusChangeHandler = (status: ContextStatusMap) => void;
```

依赖类型：

- [`ContextStatusMap`](/zh-CN/api#dolliecontextstatusmap)

#### `ContextStatusMap`

上下文生命周期函数执行状态表，键名为生命周期函数名，值为上下文运行时状态。

```typescript
interface ContextStatusMap {
    [key: string]: ContextStatus;
}
```

依赖类型：

- [`ContextStatus`](/zh-CN/api#dolliecontextstatus)

#### `ContextStatus`

上下文运行时状态：

- `pending`：等待执行
- `running`：正在执行
- `finished`：已结束

```typescript
type ContextStatus = 'pending' | 'running' | 'finished';
```

#### `MergeBlock`

```typescript
interface MergeBlock {
    // `OK` 代表无冲突，`CONFLICT` 代表存在冲突
    status: 'OK' | 'CONFLICT';
    values: {
        former: string[],
        current: string[],
    };
    // 如果被用户忽略，这个值为 `true`
    ignored?: boolean;
}
```

#### `ConflictResolverData`

Dollie 上下文向用户代理提供的冲突数据。

```typescript
interface ConflictBlockMetadata {
    // 文件路径
    pathname: string;
    // 此冲突在当前文件中的位次
    index: number;
}

interface ConflictSolverData extends ConflictBlockMetadata {
    // 冲突区块
    block: MergeBlock;
    // 冲突文件内容
    content: string;
    // 该文件中冲突数量
    total: number;
}
```

依赖类型：

- [`MergeBlock`](/zh-CN/api#mergeblock)

#### `ConflictResolveResult`

用户处理冲突后返回的冲突解决方案。

- `MergeBlock`：对 `ConflictSolverData` 中的 `block` 解决完冲突后的结果。

```typescript
type ConflictSolveResult = MergeBlock | 'ignored' | null;
```

#### `GeneratorResult`

Dollie 生成器生成的结果。

```typescript
interface GeneratorResult {
    // 文件列表，键名为文件路径，值为文件内容。
    // 如果是文本文件，值的类型为 string，如果是二进制文件，则值的类型为 Buffer
    files: Record<string, string | Buffer>;
    // 所有被忽略冲突的文件的路径
    conflicts: string[];
}
```

#### `DiffChange`

记录 Dollie 在合并同一文件的更改时产生的对比数据。

```typescript
interface Change {
    count?: number;
    value: string;
    added?: boolean;
    removed?: boolean;
}

interface DiffChange extends Change {
    conflicted?: boolean;
    conflictGroup?: 'former' | 'current';
    lineNumber: number;
}
```

### `Context`

#### `constructor(projectName: string, templateOriginName: string, config: Config)`

Dollie `Context` 的构造函数，在实例化 `Context` 时，需要传递如下参数：

- `projectName`：生成项目的名称
- `templateOriginName`：生成项目时所需要的[模板上下文 ID](/zh-CN/guide/basic#模板名称解析规则)
- `config`：Dollie 上下文配置

依赖类型：

- [`Config`](/zh-CN/api#dollieconfig)

#### `Context.prototype.generate(): GeneratorResult`

通过调用此方法，可以启动 Dollie 上下文的生命周期，最后返回 Dollie 生成器生成的项目代码文件数据。

依赖类型：

- [`GeneratorResult`](/zh-CN/api#dolliegeneratorresult)

### `parseDiffToMergeBlocks(changes: DiffChange[]): MergeBlock[]`

从 `DiffChange` 数组解析为 `MergeBlock` 数组。

依赖类型：

- [`DiffChange`](/zh-CN/api#diffchange)
- [`MergeBlock`](/zh-CN/api#mergeblock)

### `parseFileTextToMergeBlocks(content: string): MergeBlock[]`

从字符串解析为 `MergeBlock` 数组。

依赖类型：

- [`MergeBlock`](/zh-CN/api#mergeblock)

### `parseMergeBlocksToText(blocks: MergeBlock[]): string`

从 `MergeBlock` 数组解析为字符串内容。

依赖类型：

- [`MergeBlock`](/zh-CN/api#mergeblock)

## `@dollie/origins`

### 类型和接口

#### `OriginMap`

Dollie Origin 函数列表，键名为函数名称，值为 Origin 函数或文件路径。其中文件路径可以是本地文件系统的相对路径也可以是一个互联网 URL。

```typescript
type OriginMap = Record<string, string | OriginHandler>;
```

依赖类型：

- [`OriginHandler`](/zh-CN/api#dollieoriginhandler)

#### `OriginConfig`

当作形式参数传递给各个 Origin 函数的类型，由各个 Origin 函数自行读取解析，可以是任意键值对。

```typescript
type OriginConfig = Record<string, any>;
```

#### `OriginHandler`

Origin 函数，这个函数必须返回指定的 Origin 信息，以供生成器使用。

```typescript
type OriginHandler = (
    // 上下文 ID
    id: string,
    // 由函数自身定义的配置项，可以是任意键值对
    config: OriginConfig,
    // 一个 `Got` 实例，用于帮助 Origin 函数发送请求
    request: Got,
) => Promise<OriginInfo>;
```

依赖类型：

- [`OriginConfig`](/zh-CN/api#dollieoriginconfig)
- [`OriginInfo`](/zh-CN/api#dollieorigininfo)

#### `Origin`

Dollie Origin 函数列表项。

```typescript
interface Origin {
    // Origin 函数名称
    name: string;
    // Origin 函数体
    handler: OriginHandler;
};
```

依赖类型：

- [`OriginHandler`](/zh-CN/api#dollieoriginhandler)

#### `OriginInfo`

标准的、可被 Dollie 生成器理解的 Origin 信息。用作 Origin 函数返回值。

```typescript
interface OriginInfo {
    // 供生成器拉取模板的最终 URL
    url: string;
    // 生成器拉取模板时所使用的 HTTP 请求头
    headers?: OriginHeaders;
}
```

依赖类型：

- [`OriginHeaders`](/zh-CN/api#dollieoriginheaders)

#### `OriginHeaders`

生成器拉取模板时所使用的 HTTP 请求头。

```typescript
type OriginHeaders = Record<string, any>;
```

### 内置 Origin 函数

#### `github`

配置项：

- `token: string` 在 Dollie 生成器拉取私有 GitHub 仓库时作为认证使用

#### `gitlab`

配置项：

- `token: string` 在 Dollie 生成器拉取私有 GitLab 仓库时作为认证使用
- `host: string` 当模板存储于自托管形式的 GitLab 服务时，指定域名
- `protocol: string` 当模板存储于自托管形式的 GitLab 服务时，指定协议类型，支持 `http` 和 `https`

### `loadOrigins(config: OriginMap): Promise<Origin[]>`

根据所提供的 Dollie Origin 函数键值对加载所有 Origin 函数，并返回 Dollie 生成器可以理解的数据。

参数：

- `config: OriginMap` Origin 函数键值对配置

返回值：

`Promise<Origin[]>`

依赖类型：

- [`Origin`](/zh-CN/api#dollieorigin)
- [`OriginMap`](/zh-CN/api#dollieoriginmap)

## 模板配置

```typescript
interface TemplateConfig {
    // 主模板问题
    questions?: Question[];
    // 主模板文件行为配置
    files?: TemplateFileConfig;
    // 主模板 cleanup 函数
    cleanups?: TemplateCleanUpFunction[];
    // 扩展模板配置
    extendTemplates?: ExtendTemplateConfig;
}
```

依赖类型：

```typescript
// 扩展模板配置
type ExtendTemplateConfig = Record<string, Omit<TemplateConfig, 'extendTemplates'>>;
// cleanup 函数
type TemplateCleanUpFunction = (data: TemplateCleanupData) => MergeTable;
// Dollie 文件行为策略函数
type DeleteConfigHandler = (
    // 模板配置内容
    templateConfig: TemplateConfig,
    // 已命中的扩展模板列表
    targets: string[],
) => Promise<string | string[]>;

interface TemplateFileConfig {
    merge?: string[];
    delete?: (string | DeleteConfigHandler)[];
}
```
