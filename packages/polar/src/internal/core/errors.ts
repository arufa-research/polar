import { getClosestCallerPackage } from '../util/caller-package';
import { replaceAll } from '../util/strings';
import { ErrorDescriptor, ERRORS, getErrorCode } from './errors-list';

export class PolarError extends Error {
  public static isPolarError (other: any): other is PolarError {
    return (
      other !== undefined && other !== null && other._isPolarError === true
    );
  }

  public static isPolarErrorType (
    other: any,
    descriptor: ErrorDescriptor
  ): other is PolarError {
    return (
      PolarError.isPolarError(other) &&
      other.errorDescriptor.number === descriptor.number
    );
  }

  public readonly errorDescriptor: ErrorDescriptor;
  public readonly number: number;
  public readonly messageArguments: Record<string, any>;
  public readonly parent?: Error;

  private readonly _isPolarError: boolean;

  constructor (
    errorDescriptor: ErrorDescriptor,
    messageArguments: Record<string, any> = {},
    parentError?: Error
  ) {
    const prefix = `${getErrorCode(errorDescriptor)}: `;

    const formattedMessage = applyErrorMessageTemplate(
      errorDescriptor.message,
      messageArguments
    );

    super(prefix + formattedMessage);

    this.errorDescriptor = errorDescriptor;
    this.number = errorDescriptor.number;
    this.messageArguments = messageArguments;

    if (parentError instanceof Error) {
      this.parent = parentError;
    }

    this._isPolarError = true;
    Object.setPrototypeOf(this, PolarError.prototype);
  }
}

/**
 * This class is used to throw errors from polar plugins made by third parties.
 */
export class PolarPluginError extends Error {
  public static isPolarPluginError (other: any): other is PolarPluginError {
    return (
      other !== undefined &&
      other !== null &&
      other._isPolarPluginError === true
    );
  }

  public readonly parent?: Error;
  public readonly pluginName: string;

  private readonly _isPolarPluginError: boolean;

  /**
   * Creates a PolarPluginError.
   *
   * @param pluginName The name of the plugin.
   * @param message An error message that will be shown to the user.
   * @param parent The error that causes this error to be thrown.
   */
  public constructor (pluginName: string, message: string, parent?: Error);

  /**
   * A DEPRECATED constructor that automatically obtains the caller package and
   * use it as plugin name.
   *
   * @deprecated Use the above constructor.
   *
   * @param message An error message that will be shown to the user.
   * @param parent The error that causes this error to be thrown.
   */
  public constructor (message: string, parent?: Error);

  public constructor (
    pluginNameOrMessage: string,
    messageOrParent?: string | Error,
    parent?: Error
  ) {
    if (typeof messageOrParent === 'string') {
      super(messageOrParent);
      this.pluginName = pluginNameOrMessage;
      this.parent = parent;
    } else {
      super(pluginNameOrMessage);
      this.pluginName = getClosestCallerPackage()!;
      this.parent = messageOrParent;
    }

    this._isPolarPluginError = true;
    Object.setPrototypeOf(this, PolarPluginError.prototype);
  }
}

/**
 * This function applies error messages templates like this:
 *
 *  - Template is a string which contains a variable tags. A variable tag is a
 *    a variable name surrounded by %. Eg: %plugin1%
 *  - A variable name is a string of alphanumeric ascii characters.
 *  - Every variable tag is replaced by its value.
 *  - %% is replaced by %.
 *  - Values can't contain variable tags.
 *  - If a variable is not present in the template, but present in the values
 *    object, an error is thrown.
 *
 * @param template The template string.
 * @param values A map of variable names to their values.
 */
export function applyErrorMessageTemplate (
  template: string,
  values: { [templateVar: string]: any }
): string {
  return _applyErrorMessageTemplate(template, values, false);
}

/* eslint-disable sonarjs/cognitive-complexity */
function _applyErrorMessageTemplate (
  template: string,
  values: { [templateVar: string]: any },
  isRecursiveCall: boolean
): string {
  if (!isRecursiveCall) {
    for (const variableName of Object.keys(values)) {
      if (variableName.match(/^[a-zA-Z][a-zA-Z0-9]*$/) === null) {
        throw new PolarError(ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME, {
          variable: variableName
        });
      }

      const variableTag = `%${variableName}%`;

      if (!template.includes(variableTag)) {
        throw new PolarError(ERRORS.INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING, {
          variable: variableName
        });
      }
    }
  }

  if (template.includes('%%')) {
    return template
      .split('%%')
      .map((part) => _applyErrorMessageTemplate(part, values, true))
      .join('%');
  }

  for (const variableName of Object.keys(values)) {
    let value: string;

    if (values[variableName] === undefined) {
      value = 'undefined';
    } else if (values[variableName] === null) {
      value = 'null';
    } else {
      value = values[variableName].toString();
    }

    if (value === undefined) {
      value = 'undefined';
    }

    const variableTag = `%${variableName}%`;

    if (value.match(/%([a-zA-Z][a-zA-Z0-9]*)?%/) !== null) {
      throw new PolarError(
        ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG,
        { variable: variableName }
      );
    }

    template = replaceAll(template, variableTag, value);
  }

  return template;
}

export function assertPolarInvariant (
  invariant: boolean,
  message: string
): asserts invariant {
  if (!invariant) {
    throw new PolarError(ERRORS.GENERAL.ASSERTION_ERROR, { message });
  }
}
