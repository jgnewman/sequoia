import { createError } from './utils';

const registry = {};

/**
 * Allow users to create and reference constants.
 *
 * Constants are accessible in the form of functions that always
 * return the same symbol. This way you get an error in the console
 * if you make a mistake.
 *
 * @param  {String} name The name of the new constant.
 *
 * @return {Symbol} The symbol for the new constant.
 */
export function constants(name) {

  if (typeof name !== 'string') {
    throw createError(`Constants must be built from strings.`);
  }

  if (typeof constants[name] === 'function') {
    throw createError(`A constant named ${name} already exists.`);
  }

  registry[name] = Symbol();
  constants[name] = () => registry[name];
  return registry[name];
}
