import { CompilerOptions } from 'typescript'
import { readFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { alias, boolean } from './types'
import { fork, ForkOptions } from 'child_process'
import json5 from 'json5'

export class TsConfig {
  extends?: string
  files?: string[]
  references?: TsConfig.Reference[]
  compilerOptions: CompilerOptions = {}

  constructor(public cwd: string, public args: string[]) {}

  private index(key: string) {
    const names = [key, ...alias[key] || []].map(word => word.length > 1 ? `--${word}` : `-${word}`)
    return this.args.findIndex(arg => names.some(name => arg.toLowerCase() === name))
  }

  get(key: string, fallback: string): string
  get<K extends string>(key: K): CompilerOptions[K]
  get(key: string, fallback?: any) {
    const index = this.index(key)
    if (index < 0) return fallback ?? this.compilerOptions[key]
    if (boolean.includes(key)) {
      return this.args[index + 1] !== 'false'
    } else {
      return this.args[index + 1]
    }
  }

  set(key: string, value: string, override = true) {
    const index = this.index(key)
    if (index < 0) {
      this.args.push(`--${key}`, value)
    } else if (override) {
      this.args.splice(index + 1, 1, value)
    }
  }
}

export namespace TsConfig {
  export interface Reference {
    path: string
  }
}

const cache = new Map<string, TsConfig>()

export async function read(filename: string) {
  if (cache.has(filename)) return cache.get(filename)
  const source = await readFile(filename, 'utf8')
  const data = json5.parse(source) as TsConfig
  cache.set(filename, data)
  return data
}

export async function load(cwd: string, args: string[] = []) {
  const config = new TsConfig(cwd, args)
  let filename = resolve(cwd, config.get('project', 'tsconfig.json'))
  const data = await read(filename)
  while (data.extends) {
    filename = resolve(dirname(filename), data.extends + '.json')
    if (!filename.endsWith('.json')) filename += '.json'
    const parent = await read(filename)
    data.compilerOptions = {
      ...parent.compilerOptions,
      ...data.compilerOptions,
    }
    data.extends = parent.extends
  }
  Object.assign(config, data)
  return config
}

export async function compile(args: string[], options?: ForkOptions) {
  const child = fork(require.resolve('typescript/bin/tsc'), args, { stdio: 'inherit', ...options })
  return new Promise<number>((resolve) => {
    child.on('close', resolve)
  })
}
