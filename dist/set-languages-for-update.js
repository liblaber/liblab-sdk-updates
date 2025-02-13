"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bumpSdkVersionOrDefault = bumpSdkVersionOrDefault;
exports.setLanguagesForUpdate = setLanguagesForUpdate;
const semver_1 = __importDefault(require("semver"));
const sdk_language_engine_map_1 = require("./types/sdk-language-engine-map");
const read_liblab_config_1 = require("./read-liblab-config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const fetch_git_repo_files_1 = require("./fetch-git-repo-files");
const constants_1 = require("./constants");
async function bumpSdkVersionOrDefault(language, githubOrg, githubRepoName, liblabVersion, languageVersion) {
    const currentSdkVersion = await (0, fetch_git_repo_files_1.fetchCurrentSdkVersion)(language, githubOrg, githubRepoName);
    if (!currentSdkVersion) {
        console.log(`No SDK version set for ${language}, setting default version ${constants_1.DEFAULT_SDK_VERSION}`);
        return constants_1.DEFAULT_SDK_VERSION;
    }
    const currentSdkVersionSemVer = semver_1.default.parse(currentSdkVersion);
    if (!currentSdkVersionSemVer) {
        console.log(`The ${language} SDK version ${currentSdkVersion} is not a valid semver format. Defaulting to ${constants_1.DEFAULT_SDK_VERSION}.`);
        return constants_1.DEFAULT_SDK_VERSION;
    }
    const shouldBumpMajor = languageVersion &&
        semver_1.default.parse(languageVersion)?.major.toString() !== liblabVersion;
    const bumpedSdkVersion = shouldBumpMajor
        ? `${currentSdkVersionSemVer.inc('major').major.toString()}.0.0`
        : currentSdkVersionSemVer.inc('patch').version;
    console.log(`Bumping ${shouldBumpMajor ? 'major' : 'patch'} SDK version for ${language} from ${currentSdkVersion} to ${bumpedSdkVersion}`);
    return bumpedSdkVersion;
}
async function setLanguagesForUpdate(configPath = constants_1.DEFAULT_LIBLAB_CONFIG_PATH) {
    const liblabConfig = await (0, read_liblab_config_1.readLiblabConfig)(configPath);
    const languagesToUpdate = [];
    for (const language of liblabConfig.languages) {
        const languageOption = liblabConfig.languageOptions[language];
        if (!languageOption) {
            console.log(`${language} does not have languageOptions.${language} defined. Skipping ${language} SDK updates.`);
            continue;
        }
        if (!languageOption.githubRepoName) {
            console.log(`${language} does not have languageOptions.${language}.githubRepoName defined. Skipping ${language} SDK updates.`);
            continue;
        }
        const manifest = await (0, fetch_git_repo_files_1.fetchManifestFile)(liblabConfig.publishing.githubOrg, languageOption.githubRepoName);
        if (
        // No manifest means that the SDK hasn't been built before, therefor we want to update
        !manifest ||
            (await shouldUpdateLanguage(language, manifest.liblabVersion, liblabConfig))) {
            const liblabVersion = languageOption.liblabVersion || liblabConfig.liblabVersion || '1';
            languageOption.sdkVersion = await bumpSdkVersionOrDefault(language, liblabConfig.publishing.githubOrg, languageOption.githubRepoName, liblabVersion, manifest?.liblabVersion);
            languagesToUpdate.push(language);
        }
        else {
            console.log(`SDK in ${language} is already generated with latest liblab.`);
        }
    }
    if (languagesToUpdate.length > 0) {
        liblabConfig.languages = [...languagesToUpdate];
        await fs_extra_1.default.writeJson(configPath, liblabConfig, { spaces: 2 });
    }
    return languagesToUpdate;
}
async function shouldUpdateLanguage(language, languageVersion, liblabConfig) {
    const [latestCodeGenVersion, latestSdkGenVersion] = [
        sdk_language_engine_map_1.SdkEngineVersions.CodeGen,
        sdk_language_engine_map_1.SdkEngineVersions.SdkGen
    ];
    const codeGenHasNewVersion = semver_1.default.gt(latestCodeGenVersion, languageVersion);
    const sdkGenHasNewVersion = semver_1.default.gt(latestSdkGenVersion, languageVersion);
    const liblabVersion = liblabConfig.languageOptions[language]?.liblabVersion ||
        liblabConfig.liblabVersion;
    if (liblabVersion === '1') {
        return ((codeGenHasNewVersion &&
            isSupported(sdk_language_engine_map_1.SdkEngines.CodeGen, language, liblabVersion)) ||
            (sdkGenHasNewVersion &&
                isSupported(sdk_language_engine_map_1.SdkEngines.SdkGen, language, liblabVersion)));
    }
    else if (liblabVersion === '2') {
        return sdkGenHasNewVersion;
    }
    throw new Error(`Unsupported liblabVersion: ${liblabVersion} in liblab.config.json.`);
}
function isSupported(sdkEngine, language, liblab) {
    try {
        return (0, sdk_language_engine_map_1.getSdkEngine)(language, liblab) === sdkEngine;
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=set-languages-for-update.js.map