import _ from 'lodash';

const errorCodeMap = {
  ERR_PARAMETER_INVALID: 'ERR_PARAMETER_INVALID',
  ERR_ORIGIN_HANDLER_NOT_SPECIFIED: 'ERR_ORIGIN_HANDLER_NOT_SPECIFIED',
  ERR_URL_PARSE: 'ERR_URL_PARSE',
  ERR_TEMPLATE_FILE_NOT_FOUND: 'ERR_TEMPLATE_FILE_NOT_FOUND',
  ERR_TEMPLATE_ENTRY_ILLEGAL: 'ERR_TEMPLATE_ENTRY_ILLEGAL',
  ERR_HTTP: 'ERR_HTTP',
  ERR_MODULE_NOT_FOUND: 'ERR_MODULE_NOT_FOUND',
  ERR_MODULE_INVALID: 'ERR_MODULE_INVALID',
  ERR_MODULE_VALIDATE_FAILED: 'ERR_MODULE_VALIDATE_FAILED',
};

class BaseError extends Error {
  public constructor(public code: string, reason?: string) {
    super(reason);
  }
}

export class ContextError extends BaseError {
  public constructor(code: string, reason?: string) {
    super(code, reason);
  }
}

export class HTTPError extends BaseError {
  public constructor(
    public httpCode: string,
    public statusCode: string | number,
    reason?: string,
  ) {
    super(errorCodeMap.ERR_HTTP, reason);
  }
}

export class ParameterInvalidError extends ContextError {
  public constructor(parameterId: string) {
    super(
      errorCodeMap.ERR_PARAMETER_INVALID,
      `Invalid parameter: \`${parameterId}\``,
    );
  }
}

export class OriginHandlerNotSpecifiedError extends ContextError {
  public constructor() {
    super(
      errorCodeMap.ERR_ORIGIN_HANDLER_NOT_SPECIFIED,
      'Origin handler not specified',
    );
  }
}

export class URLParseError extends ContextError {
  public constructor() {
    super(errorCodeMap.ERR_URL_PARSE, 'Url parse error');
  }
}

export class TemplateFileNotFound extends ContextError {
  public constructor() {
    super(errorCodeMap.ERR_TEMPLATE_FILE_NOT_FOUND, 'Template file not found');
  }
}

export class ModuleNotFoundError extends ContextError {
  public constructor(moduleId: string) {
    super(
      errorCodeMap.ERR_MODULE_NOT_FOUND,
      `Module ${moduleId} not found`,
    );
  }
}

export class ModuleInvalidError extends ContextError {
  public constructor(moduleId: string) {
    super(
      errorCodeMap.ERR_MODULE_INVALID,
      `Module ${moduleId} is in a wrong format`,
    );
  }
}

export class ModuleValidateError extends ContextError {
  public constructor(moduleId: string) {
    super(
      errorCodeMap.ERR_MODULE_VALIDATE_FAILED,
      `Validation for module ${moduleId} failed due to template author's config`,
    );
  }
}

export class IllegalTemplateConfigError extends ContextError {
  public constructor() {
    super('Validation for template config failed due to security issues');
  }
}
