import { CompilerOptions } from 'typescript'
import { SpawnOptions } from 'child_process'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import spawn from 'cross-spawn'
import json5 from 'json5'

export interface tsconfig {
  extends?: string
  files?: string[]
  references?: tsconfig.Reference[]
  compilerOptions?: CompilerOptions
}

export async function tsconfig(base: string) {
  const config = await tsconfig.read(base)
  while (config.extends) {
    const parent = await tsconfig.read(resolve(base, '..', config.extends + '.json'))
    config.compilerOptions = {
      ...parent.compilerOptions,
      ...config.compilerOptions,
    }
    config.extends = parent.extends
  }
  return config
}

export namespace tsconfig {
  export interface Reference {
    path: string
  }

  export async function read(base: string) {
    const source = await readFile(base, 'utf8')
    return json5.parse(source) as tsconfig
  }
}

export default tsconfig

function spawnAsync(args: string[], options?: SpawnOptions) {
  const child = spawn(args[0], args.slice(1), { ...options, stdio: 'inherit' })
  return new Promise<number>((resolve) => {
    child.on('close', resolve)
  })
}

export async function compile(args: string[], options?: SpawnOptions) {
  const code = await spawnAsync(['tsc', ...args], options)
  if (code) process.exit(code)
}

export function option(args: string[], names: string[], fallback?: () => string, preserve = false) {
  const index = args.findIndex(arg => names.some(name => arg.toLowerCase() === name))
  if (index < 0) return fallback?.()
  const value = args[index + 1]
  if (!preserve) {
    args.splice(index, 2)
  }
  return value
}
