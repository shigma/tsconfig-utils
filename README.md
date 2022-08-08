# tsconfig-utils

[![npm](https://img.shields.io/npm/v/tsconfig-utils?style=flat-square)](https://www.npmjs.com/package/tsconfig-utils)

A collection of utilities for working with `tsconfig.json` files.

## Usage

```ts
import tsconfig from 'tsconfig-utils'

// load a tsconfig.json file,
// resolving "extends" fields recursively
await tsconfig('/path/to/tsconfig.json')
```
