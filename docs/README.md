---
title: Dollie.js
hero:
  title: Dollie.js
  desc: Accelerate the process of project creation and initialization with such set of utilities
  actions:
    - text: Documentation
      link: /guide
footer:
  Open-Source Licensed By MIT
  <br />Copyright © 2021 to today, Dollie.js and its contributors
  <br />Powered by [dumi](https://d.umijs.org)
---

<div style="height: 20px;"></div>

# Installation

```bash
$ npm i @dollie/cli -g
```

# Usage

## Use CLI

In the shell, run

```bash
$ dollie
```

or

```bash
$ dollie compose ./config.yml
```

## Use API

Install the NPM dependency which contains the Dollie APIs in your project

```bash
$ npm i @dollie/core -S
```

import dependency, and invoke appropriate API to run the core functionality of Dollie

```js
const dollie = require('@dollie/core');

async function app() {
	try {
		await dollie.interactive();
	} catch (e) {
		dollie.log(e.toString());
		process.exit(1);
	}
}

app();
```
