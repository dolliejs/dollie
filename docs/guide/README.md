---
order: 0
toc: 'menu'
title: 'Guide'
nav:
  title: 'Documentation'
  order: 0
---

# Guide

## Introduction

### Naming

Dollie (IPA: *[dɒli]*), which was inspired by the world's first cloned sheep *Dolly* (pronounce the same as *Dollie*).

Dollie is a suite of engineering project efficiency tools designed to reduce the time and development costs of writing and maintaining templates to improve the efficiency of project start-ups and the reusability of engineering code. Dollie separates generator logic from templates, thereby significantly reducing costs in all areas.

### How Dollie Works

The following diagram provides an overview of how Dollie's core components communicate and coordinate with other peripheral components to achieve the desired functionality.

![structure](/public/images/structure.png)

Dollie's core component `@dollie/core`, the user agent and the Origin function work closely together, and Dollie's core component implements all the logic related to the project code generation and provides a series of APIs for transferring and receiving data with the user agent. The user agent generally means that Dollie core business logic is presented to the user and provides all the required interaction towards the user.

Dollie's official [CLI tool](/en-US/ecosystem/cli) `@dollie/cli` is an implementation of a user agent that helps users handle user interruptions during core component runs, such as asking users for EJS Props, handling conflicts caused by multiple incremental templates modifying the same file during overwriting, etc.

Since Dollie only allows pulling templates from remote locations, but it's a bit of a hassle to ask the user for a URL every time, Dollie provides an Origin mechanism to help you generate URLs and HTTP request headers with short strings for Dollie to choose the right Origin function and pull the templates.

Dollie has two built-in Origin functions, [GitHub](https://github.com/dolliejs/dollie/blob/master/packages/@dollie/origins/src/handlers/github.ts) and [GitLab](https://github.com/dolliejs/dollie/blob/master/packages/@dollie/origins/src/handlers/gitlab.ts), that can help you pull templates from GitHub and GitLab repositories respectively. After the user provides a template name string, Dollie will select the appropriate Origin function to parse the template name according to [certain rules](/guide/basic#template-name-resolution-rules), form the URL, and pull the template from Origin.

### Lifecycle

The diagram below depicts the lifecycle of Dollie's context. In simple usage cases, the lifecycle is not perceptible to the outside; however, for secondary development based on Dollie's core components, it is more necessary to understand the lifecycle functions and what Dollie does in each lifecycle function.

![lifecycle](/public/images/lifecycle.png)

## Features

- Cloud-based templates, ready to use, always keep the template version consistency
- Create templates quickly with very little or even no code
- Support incremental template overlays, easily generate multi-technology stack projects
- Support for configuration, extensive API to support secondary development and customization

## Terminology Specification

### `Generator`

Dollie's core component contains all of Dollie's business logic, from reading configuration, to pulling templates, generating project code files, injecting parameters, asking questions, resolving conflicts, etc. Dollie encapsulates each of these logics as individual methods in the generator to be called at lifecycle time.

> Dollie does not want to expose the `Generator` to the user, all business logic is carried by the lifecycle provided by the `Context`, so please do not import the `Generator` yourself.

### `Context`

Responsible for orchestrating the methods provided by `Generator` to form the lifecycle. The context exposes the `generate` method for the user to call and get the result of the project code generation.

### Main Template

Also called "Template", it is an entity that defines the directory structure and template of a project.

It can be parsed by the generator through agreed file naming rules and be copied and generated with the corresponding project files and directory structure.

In addition, it can determine the behavior of the generator when parsing a file or files in a template through an agreed configuration file.

### Extend Template

Also called "Incremental Template", it can only be depended on by the main template and cannot be read and run by the generator alone.

In each context, a template can specify multiple depended extension templates and overwrite or merge the contents of files in the dependency with existing files according to certain rules.

The extend templates can also specify multiple depended extend templates. Dollie enables extensibility and extension-level reusability through extension templates.

> Both the main template and the extend templates are written by the user, and the generator is the core module provided by Dollie

## Quick Start

### Environment Configuration

Dollie depends on [Node.js](https://nodejs.org/en/download/), and requires a version of v10.0.0 or higher:

```bash
node -v
v10.18.0
```

### Use Dollie Core

Install Dollie.js core components

```bash
npm i @dollie/core -S
npm i inquirer -S
```

Import the Dollie.js core components in any JavaScript code file:

```javascript
const fs = require('fs');
const path = require('path');
const { Context } = require('@dollie/core');
const inquirer = require('inquirer');

// invoke in a function
async function run() {
	// create a Dollie Context instance, pass project name,
	// the template to be used and generator configuration into it
	const context = new Context('foo', 'dolliejs/template-react', {
		generator: {
			getTemplateProps: async (questions) => {
	        	const answers = await inquirer.prompt(questions);
	        	return answers;
	        },
	        // ...other configuration
		},
	});

	// invoke generate to finish generating template,
	// it will return an object contains file pathnames
	// and contents when generator is finished
	const result = (await context.generate()) || {};
	const files = result.files || {};

	// iterate over the keys of this object, the key name is the relative
	// path, and the value is the file content
	for (const filePathname of Object.keys(files)) {
		// get current content of file
		const fileContent = files[filePathname];
		// write content into file system
		fs.writeFileSync(path.resolve(process.cwd(), name, filePathname), fileContent);
	}
};

run();
```
