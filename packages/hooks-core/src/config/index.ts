import { existsSync } from 'fs'
import createJITI from 'jiti'
import _ from 'lodash'
import { sync } from 'pkg-dir'
import path from 'upath'

import { HooksGatewayAdapterStatic } from '..'
import { EventGateway } from '../gateway/event/gateway'
import { HTTPGateway } from '../gateway/http/gateway'
import { ProjectConfig, UserConfig } from '../types/config'
import { validateArray } from '../validator'
import { ignorePattern } from './ignorePattern'

export function getProjectRoot(cwd?: string) {
  return sync(cwd) || process.cwd()
}

export const PRE_DEFINE_PROJECT_CONFIG = Symbol.for('PRE_DEFINE_PROJECT_CONFIG')

export function setConfig(config: Partial<ProjectConfig>) {
  globalThis[PRE_DEFINE_PROJECT_CONFIG] = config
}

export function getConfig(cwd?: string): ProjectConfig {
  const userConfig = globalThis[PRE_DEFINE_PROJECT_CONFIG]
    ? globalThis[PRE_DEFINE_PROJECT_CONFIG]
    : getConfigFromFile(cwd)

  const builtinGateways = new Set<HooksGatewayAdapterStatic>()
  for (const route of userConfig.routes) {
    if (route.basePath) builtinGateways.add(HTTPGateway)
    if (route.event) builtinGateways.add(EventGateway)
  }
  userConfig.gateway = userConfig.gateway || []
  userConfig.gateway.push(...builtinGateways)

  return _.defaultsDeep({}, userConfig, {
    source: './src/apis',
    dev: {
      ignorePattern,
    },
    build: {
      viteOutDir: './build',
      outDir: './dist',
    },
    request: {
      client: '@midwayjs/hooks-core/request',
    },
  })
}

function getConfigFromFile(cwd?: string) {
  const root = getProjectRoot(cwd)

  const configs = {
    ts: path.join(root, 'midway.config.ts'),
    js: path.join(root, 'midway.config.js'),
  }

  if (!existsSync(configs.ts) && !existsSync(configs.js)) {
    throw new Error(
      `[ERR_INVALID_CONFIG] midway.config.ts is not found, root: ${root}`
    )
  }

  const userConfig = existsSync(configs.ts)
    ? requireByJiti<UserConfig>(configs.ts)
    : requireByJiti<UserConfig>(configs.js)

  return userConfig
}

export function defineConfig(config: UserConfig): UserConfig {
  validateArray(config.routes, 'defineConfig.routes')
  return config
}

const requireByJiti = <T = unknown>(id: string): T => {
  const jiti = createJITI()
  const contents = jiti(id)
  if ('default' in contents) return contents.default
  return contents
}
