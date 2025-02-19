import { LibLabConfig, LiblabVersion } from './types/liblab-config'
import { Language } from './types/language'
import semver from 'semver'
import {
  getSdkEngine,
  SdkEngines,
  SdkEngineVersions
} from './types/sdk-language-engine-map'
import { readLiblabConfig } from './read-liblab-config'
import fs from 'fs-extra'
import {
  fetchCurrentSdkVersion,
  fetchManifestFile
} from './fetch-git-repo-files'
import { DEFAULT_LIBLAB_CONFIG_PATH, DEFAULT_SDK_VERSION } from './constants'

export async function bumpSdkVersionOrDefault(
  language: Language,
  githubOrg: string,
  githubRepoName: string,
  liblabVersion: LiblabVersion,
  languageVersion?: string
): Promise<string> {
  const currentSdkVersion = await fetchCurrentSdkVersion(
    language,
    githubOrg,
    githubRepoName
  )

  if (!currentSdkVersion) {
    console.log(
      `No SDK version set for ${language}, setting default version ${DEFAULT_SDK_VERSION}`
    )
    return DEFAULT_SDK_VERSION
  }

  const currentSdkVersionSemVer = semver.parse(currentSdkVersion)

  if (!currentSdkVersionSemVer) {
    console.log(
      `The ${language} SDK version ${currentSdkVersion} is not a valid semver format. Defaulting to ${DEFAULT_SDK_VERSION}.`
    )
    return DEFAULT_SDK_VERSION
  }

  const shouldBumpMajor =
    languageVersion &&
    semver.parse(languageVersion)?.major.toString() !== liblabVersion

  const bumpedSdkVersion = shouldBumpMajor
    ? `${currentSdkVersionSemVer.inc('major').major.toString()}.0.0`
    : currentSdkVersionSemVer.inc('patch').version

  console.log(
    `Bumping ${shouldBumpMajor ? 'major' : 'patch'} SDK version for ${language} from ${currentSdkVersion} to ${bumpedSdkVersion}`
  )

  return bumpedSdkVersion
}

export async function setLanguagesForUpdate(
  configPath: string = DEFAULT_LIBLAB_CONFIG_PATH
): Promise<string[]> {
  const liblabConfig = await readLiblabConfig(configPath)
  const languagesToUpdate = []

  for (const language of liblabConfig.languages) {
    const languageOption = liblabConfig.languageOptions[language]

    if (!languageOption) {
      console.log(
        `${language} does not have languageOptions.${language} defined. Skipping ${language} SDK updates.`
      )
      continue
    }

    if (!languageOption.githubRepoName) {
      console.log(
        `${language} does not have languageOptions.${language}.githubRepoName defined. Skipping ${language} SDK updates.`
      )
      continue
    }

    const manifest = await fetchManifestFile(
      liblabConfig.publishing.githubOrg,
      languageOption.githubRepoName
    )

    if (
      // No manifest means that the SDK hasn't been built before, therefor we want to update
      !manifest ||
      (await shouldUpdateLanguage(
        language,
        manifest.liblabVersion,
        liblabConfig
      ))
    ) {
      const liblabVersion =
        languageOption.liblabVersion || liblabConfig.liblabVersion || '1'
      languageOption.sdkVersion = await bumpSdkVersionOrDefault(
        language,
        liblabConfig.publishing.githubOrg,
        languageOption.githubRepoName,
        liblabVersion,
        manifest?.liblabVersion
      )
      languagesToUpdate.push(language)
    } else {
      console.log(`SDK in ${language} is already generated with latest liblab.`)
    }
  }

  if (languagesToUpdate.length > 0) {
    liblabConfig.languages = [...languagesToUpdate]
    await fs.writeJson(configPath, liblabConfig, { spaces: 2 })
  }

  return languagesToUpdate
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
    liblabConfig.languageOptions[language]?.liblabVersion ||
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
