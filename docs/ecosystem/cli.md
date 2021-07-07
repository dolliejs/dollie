---
order: 1
toc: 'menu'
title: 'CLI'
---

# CLI

## Introduction

Dollie CLI is a fully functional user agent implementation based on the Dollie Core API, which provides the easiest way to get started with Dollie Core without having to implement a user agent by yourself. The Dollie CLI is designed to provide an out-of-the-box Dollie experience and is optimized and designed for most user scenarios, allowing users to focus on writing Dollie project templates without focusing on specific API usage.

## Installation

> **Node.js Version Requirements**
>
> Dollie CLI 3.x requires [Node.js](http://nodejs.org) v10.x or higher.

Use the following command to install the Dollie CLI:

```bash
npm install @dollie/cli -g
```

Once the installation is complete, you can access the dollie command from the command line.

You can verify that the Dollie CLI is installed successfully by simply running the following command:

```bash
dollie --version
```

or

```bash
dollie --help
```

## Usages

### Create a Project

Execute the following command to create a new project using an existing template:

```bash
dollie init <template> <project_name> 
```

where `template` is the [context ID](/guide/basic#template-name-resolution-rules) to be handled by the Dollie Origin function.

Example:

Create a project called `test` using the official [`template-react`](https://github.com/dolliejs/template-react) template provided by Dollie on GitHub:

```bash
dollie init github:dolliejs/template-react test
```

After executing the above command, the Dollie core component will pull the template from [https://github.com/dolliejs/template-react](https://github.com/dolliejs/template-react), read the `questions` field in the `dollie.js` in the template and have the CLI ask the questions via [Inquirer](https://www.npmjs.com/package/inquirer).

![cli-init-project.jpg](/public/images/cli-init-project.jpg)

You must answer all the questions as they are asked:

![cli-answer-questions.jpg](/public/images/cli-answer-questions.jpg)

Once the questions are answered, the Dollie core component starts generating the project code. If Dollie does not [detect a conflict](/guide/advanced#why-conflict-arises) in the project code generated in the context, it will return the final result directly to the CLI, which will write the generated result to your file system.

![cli-init-result.jpg](/public/images/cli-init-result.jpg)

### Handling File Conflict

As mentioned above, if Dollie detects a conflict in any of the files, it will be thrown by the Dollie core component in turn, and the CLI will receive this information and send an interrupt to the user for feedback, and ultimately return the user's choice to the Dollie core component.

Let's use the above example as a basis to show the way Dollie CLI provides conflict resolution. When we answer the template question by selecting the TypeScript, Less and Redux technology stacks, the above choices will result in conflicts when generating the project code by adding their respective content to both `package.json` and `src/App.tsx` after the same line.

![conflict-selections.jpg](/public/images/conflict-selections.jpg)

The CLI provides 3 ways to resolve conflicts: select the conflict group to be preserved, manually select the rows to be preserved line by line, and open the [Vim editor](https://www.vim.org/) to edit.

We choose each of these three approaches in turn to demonstrate the process of conflict resolution:

#### Select the Conflict Group to be Preserved

Dollie will place all conflicting lines in the `values.current` array and prefix each line with `[current]` when prompted by the CLI. Dollie will offer the user two options when selecting lines to keep using this method.

- Keep all groups
- Discard all groups

![cli-conflict-select-group.jpg](/public/images/cli-conflict-select-group.jpg)

#### Manually Select the Rows to be Preserved Line by Line

Dollie's Inquirer-based multi-select box provides the ability to manually select the rows to be retained, which is more flexible and clearer than the first approach:

![cli-conflict-select-lines.jpg](/public/images/cli-conflict-select-lines.jpg)

Use the up/down keys of the keyboard to select the row you want to keep and press the space bar to select it to decide to keep the row.

#### Open Vim Editor

Dollie leverages the power of Inquirer to open the Vim editor and make it available to users for editing. Users can choose to open the Vim editor to edit the contents of a conflict block, select the lines they want and add, modify, or delete anything:

![cli-conflict-vim.jpg](/public/images/cli-conflict-vim.jpg)

The result saved by Vim will be the final content of the resolved conflict block.

### Register Origin Functions

To prepare an [origin function file](/guide/advanced#file-content) that can be understood by Dollie and store it in a [suitable location](/guide/advanced#file-storage-location), execute the following command.

```bash
dollie origin add <name> <pathname>
```

Example:

```bash
dollie origin add custom_github ~/github.origin.js
```

The origin function can be used via `custom_github` when the project code is generated using the `dollie init` command.

```bash
dollie init custom_github:foo bar
```

### Configuration

The Dollie CLI implements parameter configuration in the form of setting key-value pairs and provides the user with the following configuration items:

```typescript
interface CLIConfig {
    origin?: Record<string, any>;    // origin function configuration, can pass any value
    // loader configuration for pulling templates
    loader?: {
        httpProxyUrl?: string;       // the local proxy URL used by the loader
        httpProxyAuth?: string;      // ff the local agent uses authentication, then this field must be filled in
        maximumRetryCount?: string;  // maximum number of retries
    };
}
```

Dollie only allows users to set configuration items in [Lodash `set`](https://lodash.com/docs#set) style. For example, if you wish to modify the URL of the local proxy used by the loader, you can execute the following command:

```bash
dollie config set loader.httpProxyUrl http://127.0.0.1:1086
```

The Dollie `config` command also supports two subcommands, `delete` and `get`, which access the configuration items in the same way as `config set`.
