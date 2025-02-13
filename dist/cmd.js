"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmd = cmd;
const process_1 = __importDefault(require("process"));
const child_process_1 = require("child_process");
const cmdOutput = [];
async function cmd(...command) {
    const spawnProcess = (0, child_process_1.spawn)(command[0], command.slice(1), {
        env: {
            ...process_1.default.env
        }
    });
    return new Promise((resolve, reject) => {
        spawnProcess.stdout.on('data', handleProcessData);
        spawnProcess.stderr.on('data', handleProcessData);
        spawnProcess.on('exit', code => {
            if (code === 0) {
                resolve(code);
            }
            else {
                reject(new Error(`Command '${command.join(' ')}' exited with code ${code}`));
            }
        });
        spawnProcess.on('error', err => {
            reject(err);
        });
    });
}
function handleProcessData(data) {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (!cmdOutput.includes(line) || cmdOutput.includes('Owner:')) {
            console.log(line);
            cmdOutput.push(line);
        }
    }
}
//# sourceMappingURL=cmd.js.map