import { CompilerOptions } from 'typescript'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import json5 from 'json5'

interface tsconfig {
  extends?: string
  files?: string[]
  references?: tsconfig.Reference[]
  compilerOptions?: CompilerOptions
}

async function tsconfig(base: string) {
  const config = await tsconfig.load(base)
  while (config.extends) {
    const parent = await tsconfig.load(resolve(base, '..', config.extends + '.json'))
    config.compilerOptions = {
      ...parent.compilerOptions,
      ...config.compilerOptions,
    }
    config.extends = parent.extends
  }
  return config
}

namespace tsconfig {
  export interface Reference {
    path: string
  }

  export async function load(base: string) {
    const source = await readFile(base, 'utf8')
    return json5.parse(source) as tsconfig
  }
}

export = tsconfig
