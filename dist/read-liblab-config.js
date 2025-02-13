"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLiblabConfig = readLiblabConfig;
const fs_extra_1 = __importDefault(require("fs-extra"));
const constants_1 = require("./constants");
async function readLiblabConfig(configPath = constants_1.DEFAULT_LIBLAB_CONFIG_PATH) {
    if (!(await fs_extra_1.default.pathExists(configPath))) {
        throw new Error('liblab.config.json not found in the root directory.');
    }
    try {
        return (await fs_extra_1.default.readJson(configPath));
    }
    catch (error) {
        // @ts-expect-error if customers removed liblab.config.json
        throw new Error(`Error reading liblab.config.json: ${error.message}`);
    }
}
//# sourceMappingURL=read-liblab-config.js.map