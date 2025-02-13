"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdkLanguageEngineMap = exports.SdkEngineVersions = exports.SdkEngines = void 0;
exports.getSdkEngine = getSdkEngine;
const language_1 = require("./language");
var SdkEngines;
(function (SdkEngines) {
    SdkEngines["CodeGen"] = "code-gen";
    SdkEngines["SdkGen"] = "sdk-gen";
})(SdkEngines || (exports.SdkEngines = SdkEngines = {}));
var SdkEngineVersions;
(function (SdkEngineVersions) {
    SdkEngineVersions["CodeGen"] = "1.1.41";
    SdkEngineVersions["SdkGen"] = "2.0.20";
})(SdkEngineVersions || (exports.SdkEngineVersions = SdkEngineVersions = {}));
exports.sdkLanguageEngineMap = {
    [language_1.Language.java]: SdkEngines.CodeGen,
    [language_1.Language.python]: SdkEngines.CodeGen,
    [language_1.Language.typescript]: SdkEngines.CodeGen,
    [language_1.Language.go]: SdkEngines.SdkGen,
    [language_1.Language.csharp]: SdkEngines.SdkGen,
    [language_1.Language.terraform]: SdkEngines.SdkGen,
    [language_1.Language.swift]: SdkEngines.SdkGen,
    [language_1.Language.php]: SdkEngines.SdkGen
};
function getSdkEngine(language, liblabVersion) {
    if (!liblabVersion || liblabVersion === '1') {
        const engine = exports.sdkLanguageEngineMap[language];
        if (!engine) {
            throw new Error(`Unsupported language: ${language}`);
        }
        return engine;
    }
    return SdkEngines.SdkGen;
}
//# sourceMappingURL=sdk-language-engine-map.js.map