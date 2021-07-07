---
order: 1
toc: 'menu'
title: 'Basic Usages'
---

# Basic Usages

## Create a Template

### Directory Structure

<Tree>
    <ul>
        <li>
            main
            <small>main template dir</small>
            <ul>
                <li>
                    ...
                    <small>main template files</small>
                </li>
            </ul>
        </li>
        <li>
            extends
            <small>extend templates dir</small>
            <ul>
                <li>
                    foo
                    <small>extend template `foo` root dir</small>
                    <ul>
                        <li>
                            ...
                            <small>extend template `foo` files</small>
                        </li>
                    </ul>
                </li>
                <li>
                    bar
                    <small>extend template `bar` root dir</small>
                    <ul>
                        <li>
                            ...
                            <small>extend template `bar` files</small>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
        <li>
            dollie.js | dollie.json
            <small>configuration file</small>
        </li>
    </ul>
</Tree>

### Dynamic Template Files

Dollie constraint that any file with a string starting with `__template.` as the filename will be considered as a "dynamic file". The dynamic file will be parsed by the [EJS](https://ejs.co) engine and configuration items will be injected as variables in the form of EJS Props to form the target file (the target file will have the `__template.` removed from its filename).

> When a file starting with `.`, please don't forget to ignore the dot at the end of `__template.` when a file starting with `.` needs to be used as a template file.
>
> For example, if you want to use `.babelrc` as a template file, the file name will be `__template..babelrc`

Example:

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

When inject props using `{ name: 'my-project' }`, the output content of the file will be:

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

### Configuration File

#### File Types and Priorities

Dollie provides configuration files to support the configurable interface. Currently Dollie reads configuration from `dollie.json` or `dollie.js` (if available) in the scaffolding root directory to enable certain behaviors and actions to be left to the user's decision.

> 1. The only difference between `dollie.json` and `dollie.js` is that the latter can get programmable configuration support
> 2. `dollie.js` has higher priority than `dollie.json`, and when both are present in a scaffold, the latter will be ignored
> 3. **Configuration files are non-required**. If there are no scenarios where the scaffold must use a configuration file (e.g., requiring the user to enter an answer to a question), then a configuration file is not required

#### Interact Questions

Dollie interacts with the user in Interactive mode via [Inquirer.js](https://github.com/SBoudrias/Inquirer.js#readme). After the user answers the question, the result of their input is bound to the current scaffold as props for subsequent injection into the template file.

Example:

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

If the user selects the second option, the current props for the scaffold will be:

```js
{ license: 'apache-2' };
```

## Upload Template

Dollie only allows templates to be pulled from the Internet and currently only supports templates of the ZIP format. Therefore, once you have written your template, please compress it in a ZIP file and upload it to the Internet, and make sure you provide Dollie with an accessible URL.

Dollie has built-in support for hosting templates using GitHub and GitLab, and provides a [built-in Origin function](/zh-CN/api#内置-origins) for each. You can submit your templates directly to GitHub or GitLab, Dollie's GitHub and GitLab Origin functions support making template repositories private (with separate access tokens), defining self-hosted service domains for GitLab, and more. So, **uploading and hosting templates via GitHub or GitLab will work for most scenarios**, but Dollie still allows you to [register custom Origin functions](/zh-CN/guide/advanced#%E7%BC%96%E5%86%99-origin-%E5%87%BD%E6%95%B0).

## Use Templates

### Template Name Resolution Rules

When using a template, Dollie will ask the user to pass a parameter of string type, which we call the template context ID. The purpose of this parameter is:

- Pass it to the Dollie `Generator`, which parses the string and selects the appropriate Origin function
- `Generator` calls the Origin function and passes the string to the Origin function
- The Origin function generates the appropriate URL and HTTP request headers based on the input string and internal logic, and returns them to `Generator`

The template context ID that Dollie understands is in the format `{origin}:{id}`, `origin` is used to help `Generator` select the Origin function. This field must match the registered Origin function name exactly and be case sensitive. If the `Generator` cannot match the Origin function, an error will be thrown and the process will be terminated; if the user does not pass the context ID to the `Generator`, the `Generator` will use the built-in Origin function to handle it.

When `Generator` matches the Origin function, it will call the function and pass the `id` as a formal parameter to the function. In addition, `Generator` receives the result of the Origin function, which is the URL of the template ZIP file and the HTTP request header, and continues the process.

### Create a `Context` Instance

As described in the section [Use Dollie Core](/guide#use-dollie-core), please complete the installation and preparation of the dependencies as described in this section.

You need to import the following dependencies:

```javascript
const fs = require('fs');
const path = require('path');
const { Context } = require('@dollie/core');
const inquirer = require('inquirer');
```

Create a context, pass the template context ID and the project name:

```javascript
// create a Dollie Context instance, pass project name, template that would be used
// and the generator configuration
const context = new Context('foo', 'dolliejs/template-react', {
    generator: {
        getTemplateProps: async (questions) => {
            const answers = await inquirer.prompt(questions);
            return answers;
        },
        // ...other configuration
    },
});
```

### Generate Project Code

Once the context is created, an asynchronous function is created in which the [`Context.prototype.generate`](/api#contextprototypegenerate-dolliegeneratorresult) method is called:

```javascript
async function run() {
    const result = await context.generate();
    // Execute subsequent business logic based on `result`
}

run();
```

You will get the directory structure and file contents generated by Dollie at the end of this lifecycle in the `result`. You can use the `result` for subsequent business logic, such as writing files to the file system, or any other purpose.

### Use CLI

Based on the usage mentioned in the previous article, and based on the needs of most users, we developed a set of out-of-the-box command line tools based on Dollie's core components: Dollie CLI (package name: `@dollie/cli`) and incorporated into the Dollie ecosystem, which does everything mentioned above and eventually writes the directory structure and file contents of the project code you generate through Dollie to your filesystem.

You can visit [this document](/ecosystem/cli) to learn more about how to use the Dollie CLI.
