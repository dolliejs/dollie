"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitlabOrigin = exports.githubOrigin = exports.createTemplateOrigin = void 0;
const create_1 = __importDefault(require("./create"));
exports.createTemplateOrigin = create_1.default;
const github_1 = __importDefault(require("./origins/github"));
exports.githubOrigin = github_1.default;
const gitlab_1 = __importDefault(require("./origins/gitlab"));
exports.gitlabOrigin = gitlab_1.default;
