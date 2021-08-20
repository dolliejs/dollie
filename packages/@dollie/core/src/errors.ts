import _ from 'lodash';

const errorCodeMap = {
  ERR_PARAMETER_INVALID: 'ERR_PARAMETER_INVALID',
  ERR_ORIGIN_HANDLER_NOT_SPECIFIED: 'ERR_ORIGIN_HANDLER_NOT_SPECIFIED',
  ERR_URL_PARSE: 'ERR_URL_PARSE',
  ERR_TEMPLATE_FILE_NOT_FOUND: 'ERR_TEMPLATE_FILE_NOT_FOUND',
  ERR_TEMPLATE_ENTRY_ILLEGAL: 'ERR_TEMPLATE_ENTRY_ILLEGAL',
  ERR_HTTP: 'ERR_HTTP',
  ERR_COMPONENT_NOT_FOUND: 'ERR_COMPONENT_NOT_FOUND',
  ERR_COMPONENT_INVALID: 'ERR_COMPONENT_INVALID',
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

export class ComponentNotFoundError extends ContextError {
  public constructor(componentId: string) {
    super(
      errorCodeMap.ERR_COMPONENT_NOT_FOUND,
      `Component ${componentId} not found`,
    );
  }
}

export class ComponentInvalidError extends ContextError {
  public constructor(componentId: string) {
    super(
      errorCodeMap.ERR_COMPONENT_INVALID,
      `Component ${componentId} is in a wrong format`,
    );
  }
}
