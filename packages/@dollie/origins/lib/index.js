"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitlabOrigin = exports.githubOrigin = void 0;
const github_1 = __importDefault(require("./github"));
exports.githubOrigin = github_1.default;
const gitlab_1 = __importDefault(require("./gitlab"));
exports.gitlabOrigin = gitlab_1.default;
