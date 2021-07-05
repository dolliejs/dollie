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

Dollie `Context` 配置

```typescript
interface DollieConfig {
  generator?: DollieGeneratorConfig;
  onStatusChange?: StatusChangeHandler;
  onError?: ErrorHandler;
  onMessage?: MessageHandler;
}
```

依赖类型：

- [`DollieGeneratorConfig`](/zh-CN/api#dolliegeneratorconfig)
- [`StatusChangeHandler`](/zh-CN/api#statuschangehandler)
- [`ErrorHandler`](/zh-CN/api#errorhandler)
- [`MessageHandler`](/zh-CN/api#messagehandler)

#### `StatusChangeHandler`

```typescript
type StatusChangeHandler = (status: DollieContextStatusMap) => void;
```

依赖类型：

- [`DollieContextStatusMap`](/zh-CN/api#dolliecontextstatusmap)

#### `DollieContextStatusMap`

```typescript
interface DollieContextStatusMap {
  [key: string]: DollieContextStatus;
}
```

依赖类型：

- [`DollieContextStatus`](/zh-CN/api#dolliecontextstatus)

#### `DollieContextStatus`

```typescript
type DollieContextStatus = 'pending' | 'running' | 'finished';
```

#### `MergeBlock`

#### `ConflictResolverData`

#### `ConflictResolveResult`

### `Context`

### `parseDiffToMergeBlocks`

### `parseFileTextToMergeBlocks`

### `parseMergeBlocksToText`

## `@dollie/origins`

### 类型和接口

#### `DollieOriginMap`

#### `DollieOriginConfig`

#### `DollieOriginHandler`

#### `DollieOrigin`

#### `DollieOriginInfo`

#### `DollieOriginHeaders`

#### `DollieOriginConfig`

### 内置 Origins

### `loadOrigins`
