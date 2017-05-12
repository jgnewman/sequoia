const symbol1 = Symbol();
const symbol2 = Symbol();

/**
 * Creates a nice error object. Not automatically thrown.
 *
 * @param  {String} message The error message.
 *
 * @return {Error}  The new error object.
 */
export function createError(message) {
  return new Error('[sequoia] ' + message.trim().replace(/\n\s+/g, ' '));
}

/**
 * Makes sure a given level of nesting exists in an object. For example:
 *
 *   assertNesting(foo, 'a', 'b', 'c') === foo { a: { b: { c: { } } } }
 *
 * @param  {Object} obj  The initial object that may or may not be nested.
 * @param  {String} nest Names of nested object properties we need.
 *
 * @return {Object} The deepest nested object.
 */
export function assertNesting(obj, ...nest) {
  let prevLevel = obj;
  nest.forEach(level => {
    prevLevel[level] = prevLevel[level] || {};
    prevLevel = prevLevel[level];
  })
  return prevLevel;
}

/**
 * A strange little function factory where the created function toggles
 * between 2 symbols whenever it's called.
 *
 * @return {Function} The toggler.
 */
export function toggleSymbols() {
  let activeSym = symbol1;
  const out = () => {
    activeSym = activeSym === symbol1 ? symbol2 : symbol1;
    return activeSym;
  };
  out.current = () => activeSym;
  return out;
}
