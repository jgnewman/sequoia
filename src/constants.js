import { createError } from './utils';

/*
 * A place to hold all of our constants.
 */
const constants = {};
const nameMap = {};

/**
 * Creates a new property in the constants registry whose value is a unique symbol.
 *
 * @param {String} name  The new property name.
 *
 * @return {undefined}
 */
function setConstant(name) {
  if (constants[name]) {

    throw createError(
      `
        Could not create constant \`${name}\` because a constant with the same
        name already exists.
      `
    )

  } else if (typeof name !== 'string') {

    throw createError(
      `
        Could not create constant \`${name}\` because it is of type ${typeof name}
        and constants must all be created from strings.
      `
    )

  } else {

    const nameSymbol = Symbol();
    constants[name] = () => nameSymbol;
    nameMap[nameSymbol] = name;
    return nameSymbol;

  }
}

/**
 * Loop over an array and create a constant for each one.
 *
 * @param  {Array} namesArray  Contains all the names for new constants.
 *
 * @return {undefined}
 */
export function createConstantsFromArray(namesArray) {
  namesArray.forEach(name => setConstant(name))
}

/**
 * Create a single constant and return its actual symbol.
 *
 * @param  {String} name The name of the constant.
 *
 * @return {Symbol} The actual constant.
 */
export function createConstant(name) {
  return setConstant(name);
}

/**
 * Retrieve the serializable name of a constant.
 *
 * @param  {Symbol} constant The constant itself.
 *
 * @return {String} The name of the constant.
 */
export function getConstantName(constant) {
  return nameMap[constant];
}

/*
 * Export the constants registry.
 */
export { constants };
