"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const createTemplateOrigin = (name, metadata) => {
    if (!lodash_1.default.isString(name)) {
        return null;
    }
    return {
        name,
        handler: async (templateName, config) => {
            const { getTemplateUrl, getHeaders, configPaths } = metadata;
            if (!lodash_1.default.isFunction(getTemplateUrl)) {
                return null;
            }
            const originConfig = lodash_1.default.pick(lodash_1.default.get(config, name) || {}, configPaths || []);
            return {
                url: await getTemplateUrl(templateName, originConfig),
                headers: lodash_1.default.isFunction(getHeaders) ? await getHeaders(templateName, originConfig) : {},
            };
        },
    };
};
exports.default = createTemplateOrigin;
