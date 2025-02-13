"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const core = __importStar(require("@actions/core"));
const set_languages_for_update_1 = require("./set-languages-for-update");
const cmd_1 = require("./cmd");
const constants_1 = require("./constants");
const LIBLAB_TOKEN_INPUT_KEY = 'liblab_token';
const LIBLAB_GITHUB_TOKEN_INPUT_KEY = 'liblab_github_token';
const LIBLAB_CONFIG_PATH = 'liblab_config_path';
const GITHUB_TOKEN_ENV_VAR_NAME = 'GITHUB_TOKEN';
const LIBLAB_TOKEN_ENV_VAR_NAME = 'LIBLAB_TOKEN';
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
    try {
        const liblabToken = core.getInput(LIBLAB_TOKEN_INPUT_KEY, {
            required: true
        });
        const liblabGithubToken = core.getInput(LIBLAB_GITHUB_TOKEN_INPUT_KEY, {
            required: true
        });
        const liblabConfigPath = core.getInput(LIBLAB_CONFIG_PATH, {
            required: false
        }) || constants_1.DEFAULT_LIBLAB_CONFIG_PATH;
        core.exportVariable(LIBLAB_TOKEN_ENV_VAR_NAME, liblabToken);
        core.exportVariable(GITHUB_TOKEN_ENV_VAR_NAME, liblabGithubToken);
        core.exportVariable(LIBLAB_CONFIG_PATH, liblabConfigPath);
        const languagesToUpdate = await (0, set_languages_for_update_1.setLanguagesForUpdate)();
        if (!languagesToUpdate) {
            core.info('************ No languages need an update. Skipping the builds. ************');
            core.setOutput('status', 'skipped');
            return;
        }
        core.info(`************ Languages that need update: ${languagesToUpdate.join(', ')} ************`);
        core.info('************ Building SDKs ************');
        await (0, cmd_1.cmd)('npx', '--yes', 'liblab', 'build', '--yes');
        core.info('************ Finished building SDKs ************');
        core.info('************ Publishing PRs ************');
        await (0, cmd_1.cmd)('npx', '--yes', 'liblab', 'pr');
        core.info('************ Finished publishing PRs ************');
        core.setOutput('status', `success`);
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) {
            core.setOutput('status', 'failed');
            core.setFailed(error.message);
        }
    }
}
//# sourceMappingURL=main.js.map