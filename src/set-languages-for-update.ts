import { Octokit } from '@octokit/rest'
import { Manifest } from './types/manifest'
import { LibLabConfig, LiblabVersion } from './types/liblab-config'
import { Language } from './types/language'
import semver from 'semver'
import {
  getSdkEngine,
  SdkEngines,
  SdkEngineVersions
} from './types/sdk-language-engine-map'
import { LIBLAB_CONFIG_PATH, readLiblabConfig } from './read-liblab-config'
import fs from 'fs-extra'

const MANIFEST_PATH = '.manifest.json'

const DEFAULT_SDK_VERSION = '1.0.0'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export function bumpSdkVersionOrDefault(
  language: Language,
  liblabConfig: LibLabConfig,
  languageVersion?: string
): string {
  const languageOptions = liblabConfig.languageOptions
  const currentSdkVersion = languageOptions[language]?.sdkVersion

  if (!currentSdkVersion) {
    console.log(
      `No SDK version set for ${language}, setting default version ${DEFAULT_SDK_VERSION}`
    )
    return DEFAULT_SDK_VERSION
  }

  const sdkVersion = semver.parse(currentSdkVersion)

  if (!sdkVersion) {
    throw new Error(`The ${language} SDK version is not a valid semver format.`)
  }

  const liblabVersion =
    languageOptions[language].liblabVersion || liblabConfig.liblabVersion

  const shouldBumpMajor =
    languageVersion &&
    semver.parse(languageVersion)?.major !== semver.parse(liblabVersion)?.major
  const bumpedSdkVersion = shouldBumpMajor
    ? sdkVersion.inc('major').version
    : sdkVersion.inc('patch').version

  console.log(
    `Bumping SDK version for ${language} from ${currentSdkVersion} to ${bumpedSdkVersion}`
  )

  return bumpedSdkVersion
}

export async function setLanguagesForUpdate(): Promise<string[]> {
  const liblabConfig = await readLiblabConfig()
  const languagesToUpdate = []

  for (const language of liblabConfig.languages) {
    const manifest = await fetchManifestForLanguage(language, liblabConfig)
    if (
      // No manifest means that the SDK hasn't been built before, therefor we want to update
      !manifest ||
      (await shouldUpdateLanguage(
        language,
        manifest.liblabVersion,
        liblabConfig
      ))
    ) {
      liblabConfig.languageOptions[language].sdkVersion =
        bumpSdkVersionOrDefault(language, liblabConfig, manifest?.liblabVersion)
      languagesToUpdate.push(language)
    }
  }

  if (languagesToUpdate.length > 0) {
    liblabConfig.languages = [...languagesToUpdate]
    await fs.writeJson(LIBLAB_CONFIG_PATH, liblabConfig, { spaces: 2 })
  }

  return languagesToUpdate
}

async function fetchManifestForLanguage(
  language: Language,
  config: LibLabConfig
): Promise<Manifest | undefined> {
  try {
    const remoteManifestJson = await fetchFileFromBranch({
      owner: config.publishing.githubOrg,
      path: MANIFEST_PATH,
      repo: config.languageOptions[language].githubRepoName
    })

    return JSON.parse(remoteManifestJson)
  } catch (error) {
    console.log(
      `Unable to fetch .manifest.json file from ${config.publishing.githubOrg}/${config.languageOptions[language].githubRepoName}`
    )
  }
}

async function shouldUpdateLanguage(
  language: Language,
  languageVersion: string,
  liblabConfig: LibLabConfig
): Promise<boolean> {
  const [latestCodeGenVersion, latestSdkGenVersion] = [
    SdkEngineVersions.CodeGen,
    SdkEngineVersions.SdkGen
  ]

  const codeGenHasNewVersion = semver.gt(latestCodeGenVersion, languageVersion)
  const sdkGenHasNewVersion = semver.gt(latestSdkGenVersion, languageVersion)

  const liblabVersion =
    liblabConfig.languageOptions[language].liblabVersion ||
    liblabConfig.liblabVersion

  if (liblabVersion === '1') {
    return (
      (codeGenHasNewVersion &&
        isSupported(SdkEngines.CodeGen, language, liblabVersion)) ||
      (sdkGenHasNewVersion &&
        isSupported(SdkEngines.SdkGen, language, liblabVersion))
    )
  } else if (liblabVersion === '2') {
    return sdkGenHasNewVersion
  }

  throw new Error(
    `Unsupported liblabVersion: ${liblabVersion} in liblab.config.json.`
  )
}

function isSupported(
  sdkEngine: SdkEngines,
  language: Language,
  liblab: LiblabVersion
): boolean {
  try {
    return getSdkEngine(language, liblab) === sdkEngine
  } catch (e) {
    return false
  }
}

async function fetchFileFromBranch({
  owner,
  path,
  repo
}: {
  owner: string
  path: string
  repo: string
}): Promise<string> {
  const { data } = await octokit.repos.getContent({
    owner,
    path,
    repo
  })

  if (Array.isArray(data) || data.type !== 'file' || data.size === 0) {
    throw new Error(
      `Could not read content of file ${path} from repository ${repo}`
    )
  }

  return Buffer.from(data.content, 'base64').toString('utf8')
}
