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

#### `DollieAnswers`

Inquirer 问题回答格式。

```typescript
type DollieAnswers = Record<string, any>;
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

#### `DollieGeneratorConfig`

Dollie `Generator` 配置。

```typescript
interface DollieGeneratorConfig {
    // Origin 配置
    origin?: DollieOriginConfig;
    // 自定义 Origin 函数列表，键对应的值可以是路径也可以是 Origin 函数
    origins?: DollieOriginMap;
    // 加载器配置，用于拉取模板、读取自定义 Origin 函数等
    loader?: LoaderConfig;
    // 向用户获取模板问题的回答
    getTemplateProps?: (questions: DollieQuestion[]) => Promise<DollieAnswers>;
    // 向用户报告冲突并获取冲突的解决方案
    conflictsSolver?: (data: ConflictSolverData) => Promise<ConflictSolveResult>;
    // 接收并处理从 Dollie 上下文中发出的消息
    onMessage?: MessageHandler;
}
```

依赖类型：

- [`MessageHandler`](/zh-CN/api#messagehandler)
- [`DollieAnswers`](/zh-CN/api#dollieanswers)
- [`LoaderConfig`](/zh-CN/api#loaderconfig)
- [`ConflictSolveResult`](/zh-CN/api#conflictresolveresult)
- [`ConflictSolverData`](/zh-CN/api#conflictresolverdata)
- [`DollieOriginConfig`](/zh-CN/api#dollieoriginconfig)
- [`DollieOriginMap`](/zh-CN/api#dollieoriginmap)

#### `DollieConfig`

Dollie `Context` 配置。

```typescript
interface DollieConfig {
    // `Generator` 配置
    generator?: DollieGeneratorConfig;
    // 生命周期状态变更接收函数
    onStatusChange?: StatusChangeHandler;
    // 错误信息接收函数
    onError?: ErrorHandler;
    // 一般信息接收函数
    onMessage?: MessageHandler;
}
```

依赖类型：

- [`DollieGeneratorConfig`](/zh-CN/api#dolliegeneratorconfig)
- [`StatusChangeHandler`](/zh-CN/api#statuschangehandler)
- [`ErrorHandler`](/zh-CN/api#errorhandler)
- [`MessageHandler`](/zh-CN/api#messagehandler)

#### `StatusChangeHandler`

上下文运行时状态变更接收函数。

```typescript
type StatusChangeHandler = (status: DollieContextStatusMap) => void;
```

依赖类型：

- [`DollieContextStatusMap`](/zh-CN/api#dolliecontextstatusmap)

#### `DollieContextStatusMap`

上下文生命周期函数执行状态表，键名为生命周期函数名，值为上下文运行时状态。

```typescript
interface DollieContextStatusMap {
    [key: string]: DollieContextStatus;
}
```

依赖类型：

- [`DollieContextStatus`](/zh-CN/api#dolliecontextstatus)

#### `DollieContextStatus`

上下文运行时状态：

- `pending`：等待执行
- `running`：正在执行
- `finished`：已结束

```typescript
type DollieContextStatus = 'pending' | 'running' | 'finished';
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

- `MergeBlock`：对 `ConflictSolverData` 中的 `block` 解决完冲突。

```typescript
type ConflictSolveResult = MergeBlock | 'ignored' | null;
```

#### `DollieGeneratorResult`

Dollie 生成器生成的结果。

```typescript
interface DollieGeneratorResult {
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

#### `constructor(projectName: string, templateOriginName: string, config: DollieConfig)`

Dollie `Context` 的构造函数，在实例化 `Context` 时，需要传递如下参数：

- `projectName`：生成项目的名称
- `templateOriginName`：生成项目时所需要的[模板上下文 ID](/zh-CN/guide/basic#模板名称解析规则)
- `config`：Dollie 上下文配置

依赖类型：

- [`DollieConfig`](/zh-CN/api#dollieconfig)

#### `Context.prototype.generate(): DollieGeneratorResult`

通过调用此方法，可以启动 Dollie 上下文的生命周期，最后返回 Dollie 生成器生成的项目代码文件数据。

依赖类型：

- [`DollieGeneratorResult`](/zh-CN/api#dolliegeneratorresult)

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

#### `DollieOriginMap`

Dollie Origin 函数列表，键名为函数名称，值为 Origin 函数或文件路径。其中文件路径可以是本地文件系统的相对路径也可以是一个互联网 URL。

```typescript
type DollieOriginMap = Record<string, string | DollieOriginHandler>;
```

#### `DollieOriginConfig`

#### `DollieOriginHandler`

#### `DollieOrigin`

#### `DollieOriginInfo`

#### `DollieOriginHeaders`

#### `DollieOriginConfig`

### 内置 Origin 函数

#### `github`

#### `gitlab`

### `loadOrigins(config: DollieOriginMap): Promise<DollieOrigin[]>`
