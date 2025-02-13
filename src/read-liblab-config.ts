import fs from 'fs-extra'
import { LibLabConfig } from './types/liblab-config'
import { DEFAULT_LIBLAB_CONFIG_PATH } from './constants'

export async function readLiblabConfig(
  configPath: string = DEFAULT_LIBLAB_CONFIG_PATH
): Promise<LibLabConfig> {
  if (!(await fs.pathExists(configPath))) {
    throw new Error('liblab.config.json not found in the root directory.')
  }

  try {
    return (await fs.readJson(configPath)) as LibLabConfig
  } catch (error) {
    // @ts-expect-error if customers removed liblab.config.json
    throw new Error(`Error reading liblab.config.json: ${error.message}`)
  }
}
