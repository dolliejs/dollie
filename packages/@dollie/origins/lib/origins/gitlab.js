"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const got_1 = __importDefault(require("got"));
const create_1 = __importDefault(require("../create"));
exports.default = create_1.default('gitlab', {
    configPaths: ['token', 'host', 'port', 'protocol'],
    getTemplateUrl: async (name, config) => {
        if (!lodash_1.default.isString(name)) {
            return '';
        }
        const { protocol = 'https', host = 'gitlab.com', token = '', } = config;
        const [repository, checkout = ''] = name.split('@');
        const [repositoryOwner] = name.split('/');
        const res = await got_1.default(`${protocol}://${host}/api/v4/users/${repositoryOwner}/projects`, {
            timeout: 10000,
            retry: 3,
            headers: token ? { token } : {},
        });
        const projects = (JSON.parse(res.body || '[]') || []);
        const targetProject = projects.filter((project) => project.path_with_namespace === repository)[0];
        if (!targetProject) {
            return '';
        }
        return `https://gitlab.com/api/v4/projects/${targetProject.id}/repository/archive.zip${checkout ? `?sha=${checkout}` : ''}`;
    },
    getHeaders: async (name, config) => {
        const { token = '', } = config;
        return { token };
    },
});
