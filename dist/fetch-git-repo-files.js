"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCurrentSdkVersion = fetchCurrentSdkVersion;
exports.fetchManifestFile = fetchManifestFile;
exports.fetchFileFromBranch = fetchFileFromBranch;
const language_1 = require("./types/language");
const rest_1 = require("@octokit/rest");
const constants_1 = require("./constants");
const octokit = new rest_1.Octokit({ auth: process.env.GITHUB_TOKEN });
async function fetchCurrentSdkVersion(language, githubOrg, githubRepoName) {
    try {
        switch (language) {
            case language_1.Language.java: {
                const pomXml = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'pom.xml',
                    repo: githubRepoName
                });
                const versionMatch = pomXml.match(/<version>([\d.]+)<\/version>/);
                return versionMatch ? versionMatch[1] : undefined;
            }
            case language_1.Language.typescript: {
                const packageJsonContent = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'package.json',
                    repo: githubRepoName
                });
                const packageJson = JSON.parse(packageJsonContent);
                return packageJson.version || undefined;
            }
            case language_1.Language.python: {
                const setupPy = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'package.json',
                    repo: githubRepoName
                });
                const versionMatch = setupPy.match(/version='([\d.]+)'/);
                return versionMatch ? versionMatch[1] : undefined;
            }
            case language_1.Language.csharp: {
                const csproj = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'Project.csproj', // Adjust the path as per your C# project structure
                    repo: githubRepoName
                });
                const versionMatch = csproj.match(/<Version>([\d.]+)<\/Version>/);
                return versionMatch ? versionMatch[1] : undefined;
            }
            case language_1.Language.php: {
                const composerJsonContent = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'composer.json',
                    repo: githubRepoName
                });
                const composerJson = JSON.parse(composerJsonContent);
                return composerJson.version || undefined;
            }
            case language_1.Language.swift: {
                const swiftPackageContent = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'Package.swift',
                    repo: githubRepoName
                });
                const versionMatch = swiftPackageContent.match(/version: '([\d.]+)'/);
                return versionMatch ? versionMatch[1] : undefined;
            }
            case language_1.Language.go: {
                const goModContent = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'go.mod',
                    repo: githubRepoName
                });
                const versionMatch = goModContent.match(/v([\d.]+)/);
                return versionMatch ? versionMatch[1] : undefined;
            }
            case language_1.Language.terraform: {
                const versionsTf = await fetchFileFromBranch({
                    owner: githubOrg,
                    path: 'versions.tf',
                    repo: githubRepoName
                });
                const versionMatch = versionsTf.match(/required_version = "([\d.]+)"/);
                return versionMatch ? versionMatch[1] : undefined;
            }
            default: {
                return undefined;
            }
        }
    }
    catch (error) {
        console.log(`Unable to fetch current ${language} SDK version from SDK repository ${githubOrg}/${githubRepoName}.`);
        return undefined;
    }
}
async function fetchManifestFile(githubOrg, githubRepoName) {
    try {
        const remoteManifestJson = await fetchFileFromBranch({
            owner: githubOrg,
            path: constants_1.MANIFEST_PATH,
            repo: githubRepoName
        });
        return JSON.parse(remoteManifestJson);
    }
    catch (error) {
        console.log(`Unable to fetch .manifest.json file from ${githubOrg}/${githubRepoName}`);
    }
}
async function fetchFileFromBranch({ owner, path, repo }) {
    const { data } = await octokit.repos.getContent({
        owner,
        path,
        repo
    });
    if (Array.isArray(data) || data.type !== 'file' || data.size === 0) {
        throw new Error(`Could not read content of file ${path} from repository ${repo}`);
    }
    return Buffer.from(data.content, 'base64').toString('utf8');
}
//# sourceMappingURL=fetch-git-repo-files.js.map