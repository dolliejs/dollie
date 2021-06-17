"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const create_1 = __importDefault(require("../create"));
exports.default = create_1.default('github', {
    configPaths: ['token'],
    getTemplateUrl: async (name) => {
        if (!lodash_1.default.isString(name)) {
            return '';
        }
        const [repository, checkout = ''] = name.split('@');
        return `https://api.github.com/repos/${repository}/zipball${checkout ? `/${checkout}` : ''}`;
    },
});
