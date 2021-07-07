---
order: 2
toc: 'menu'
title: 'Advanced Usages'
---

# Advanced Usages

## Write an Extend Template

### General Usage Scenarios

- The main template needs to be expanded with multiple dimensions (e.g. React main template may need to add features or modules such as TypeScript, Sass/Less/Stylus preprocessor, React Router, state management, etc.)
- The main template is only used to provide the base project files, while other files representing individual modules or functions are stored in the extend template

### Storage Location

In the template root directory, create a directory named `extends` where all extend templates are stored. Dollie uses the extend template directory name as the name of the extend template and is case-sensitive.

For example, an extend template named `foo` should be stored in the `extends/foo` directory in the root of the template.

### Register Extend Template Configuration

You can register configurations for all extend templates in the template configuration file, and the configuration items for extend templates are the same as the main template configuration items except for `extendTemplates`. You can register the configuration of an extend template by adding a key-value pair with the extend template name (i.e., extend template directory name) as the key and the configuration item as the value in the `extendTemplates` field in the configuration file of the template root directory.

For example, there is a template named `foo` extend in the configuration file that should register the configuration like the following code:

```json
{
    "questions": [
        // ...main template questions
    ],
    // ...other main template questions
    "extendTemplates": {
        "foo": {
            // ...foo extend template configuration
        }
    }
}
```

## Identify Extend Templates

### Identify by Inputs

If a `question` has a `name` field of `$EXTEND$` and a `type` field of `input` in the questions field of the main template or extend template, the user's answer to this question will be recognized by Dollie as the extend template name. For example:

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

For example, if the user types `less`, Dollie will recognize and use `less` as the extend template to rely on during this lifecycle.

### Identify by Confirmination Result

In the `questions` field of the main or extend template, if the `name` field of a question is `$EXTEND:{name}$` and the `type` field is `confirm`, Dollie will recognize `{name}` as the extend template name when the user selects `y`. Otherwise, Dollie will not take any to identify the extend template. Example:

```json
{
    "questions": [
        {
            "name": "$EXTEND:typescript$",
            "message": "Would you want to use TypeScript in your project?",
            "type": "confirm"
        }
    ]
}
```

When the user confirms, Dollie identifies the `typescript` and uses it as an extend template relied on in this lifecycle, and Dollie takes no action when the user rejects it.

### Identify by List/Multi-selection

In the `questions` field of the main or extend template, if the `name` field of a question is `$EXTEND$` and the type field is `list` or `checkbox`, the `value` field of all the user's selected options will be recognized by Dollie and used as the extend template on which this lifecycle depends. Example:

```json
{
    "questions": [
        {
            "name": "$EXTEND$",
            "message": "Choose a state manager",
            "type": "list",
            "choices": [
                {
                    "name": "Redux",
                    "value": "redux"
                },
                {
                    "name": "MobX",
                    "value": "mobx"
                },
                {
                    "name": "Dva",
                    "value": "dva"
                }
            ]
        }
    ]
}
```

When the user selects `'MobX'`, `mobx` will be recognized by Dollie and used as the extend template that this lifecycle relies on.

> Attention:
> - `$EXTEND$` is case-sensitive in Dollie
> - For questions with answers of `'null'`, null values, Dollie will not recognize any extend templates, so please **do not name extend templates as `'null'`**
> - When using list or multiple choice to identify extended templates, be careful not to confuse `name` and `value` in `choices`

## File Actions Configure

Dollie defines two fields in the `files` field of the template configuration file: `merge` and `delete`. For all of these fields, Dollie accepts an array of strings as the value of each field, where the elements of the array are [Glob-style](https://en.wikipedia.org/wiki/Glob_(programming)) regular expressions used to match the relative path of the template file (relative to the project root directory, hereinafter referred to as "relative path").

During the lifecycle, Dollie iterates through the generated project files and if the relative path of a file matches at least once in the array, then Dollie will take the corresponding policy for that file.

For each of the two fields above, the meaning is as follows:

### `files.merge`

Dollie specifies that during incremental overwriting, all files in the extend template will overwrite the files of the same name in the main template in order. In most cases, however, the creators and users of the template do not want the changes made by existing extend template to the main template's file with the same name to be overwritten by the file with the same name in other extend template - they want to **keep all the changes made by each extend template to the same file**.

When the extend template writes a file to the target directory, if the file name matches one of the regular expressions in the configuration, Dollie will record the Diff result between its content and the initial content of the file, forming a patch table that will be merged with all such incremental tables under the file name and applied to the initial content when the file is finally written.

### `files.delete`

In the case of incremental overlays, the creator and user of a template sometimes want to delete some of the generated files after an extended template has been generated, for example, if a React project uses an extend template that adds TypeScript support, then the extend template needs to delete the code files written in JavaScript in the directory. This is where `files.delete` comes in handy.

> Attention
> - Dollie overlays the values in the above two configurations for all templates (including main template and extend templates)  every time

## `cleanups` Queue

Dollie allows users to define some cleanup functions for manipulating the generated project directory structure and file contents before Dollie generates the final file results. For example, the following could be written in dollie.js in the template root directory:

```js
module.exports = {
    // ...other main template configuration
    cleanups: [
        async function(context) {
            if (context.exists('tsconfig.json')) {
                context.deleteFiles(['src/index.js']);
            }
        },
        // ...
    ],
};
```

What the above cleanup function does is: after Dollie generates the project code file and directory structure, run the above function and delete the old JavaScript file if` tsconfig.json` exists in the project.

> Attention
> - The cleanup function configuration is not valid in the JSON type configuration file
> - Dollie provides support for cleanup functions for both main and extend templates

## Write Origin Functions

### File Content

Dollie accepts only JavaScript files, in which values of type `Function` must be exported using `module.exports`. The exported function must return an object, where the `url` field is a string, which is required, and `headers` is a key-value pair that sets the HTTP request headers, which is not required.

As an example, Dollie's built-in[ GitHub Origin function](https://github.com/dolliejs/dollie/blob/master/packages/@dollie/origins/src/handlers/github.ts) looks like this (after the JS transformation):

```js
const _ = require('lodash');

module.exports = async (id, config = {}) => {
    if (!id) {
        return null;
    }

    const [repository, checkout = ''] = id.split('@');

    const token = config.token || '';

    return {
        url: `https://api.github.com/repos/${repository}/zipball${checkout ? `/${checkout}` : ''}`,
        headers: token ? {
            'Authorization': `token ${token}`,
        } : {},
    };
};
```

### File Storage Location

Origin function files can be stored in an Internet location that can be accessed via URLs over the HTTP or HTTPS protocols, or on the local filesystem (only in the case that Node.js has permission to read these files).

### Register an Origin Function

When creating a `Context` instance, you can register an origin function by passing a key-value pair to Dollie with the origin function name as the key and the URL of the origin function via the `Generator` configuration at `generator.origins`:

```js
const context = new Context('foo', 'example_origin:bar', {
    generator: {
        origins: {
            example_origin: 'https://example.com/origins/example_origin.js',
        },
    },
});
```

### Setup Parameters

When creating a `Context` instance, the parameters of the origin function can be set by passing a key-value pair to Dollie via the `Generator` configuration at `generator.origin`:

```js
const context = new Context('foo', 'example_origin:bar', {
    generator: {
        // ...other generator configuration
        origin: {
            foo: 'bar',
        },
    },
});
```

`{ foo: 'bar' }` will be passed as a second formal parameter when Dollie calls the origin function.

## Handling File Conflict

### Why Conflict Arises

Since Dollie supports incremental overlays of project code via extend templates, when multiple extend templates add content from the same line of a file at the same time, Dollie cannot determine if all the content added needs to be retained. So Dollie will determine this as a conflict, overlay all the additions made by the extend templates as a merge block, mark the merge block as a conflict block marker, and then leave it up to the user to decide whether to keep each line in the block or not.

### Receive Conflicts Thrown by Dollie Core

When instantiating a `Context`, a function can be passed to `generator.conflictSolver` that passes the current conflict block as a callback form parameter and returns the resolved merged block:

```js
const context = new Context('foo', 'example_origin:bar', {
    generator: {
        // ...other generator configuration
        conflictSolver: async function(data) {
            const { block } = data;
            const { values } = block;
            // get every line of content from both sides of the conflict
            const { former, current } = values;
            // push all rows that need to be preserved to `current`
            return block;
        },
    },
});
```

In addition, if the return value of this function is `'ignored'`, it means that the handling of this conflict is abandoned.

> Attention:
> - During incremental overlay, Dollie executes the `generator.conflictSolver` function once for each conflict encountered
> - There may be more than one conflict in a file
> - If the above function returns a `null` value, Dollie will throw the same conflict message again until the function returns a value that is no longer `null`

### Get Solutions from Users

As mentioned above, Dollie throws a conflict when it encounters one, and a callback with information about the conflicting block can be implemented via `generator.conflictSolver`. Conflict handling is a user-interrupt operation and therefore needs to be left to the user agent (in fact, everything described above revolves around the implementation of the user agent).

In the general case, `generator.conflictSolver` can take the responsibility of getting the solution from the user. The simplest way to do this is to print each line of the conflict in the callback's formal parameters in the console and let the user decide which lines to keep and enter them to the user agent. The user agent parses the user's input into a new merge block and returns it to Dollie, thereby fetching the solution to the conflict from the user's side.
