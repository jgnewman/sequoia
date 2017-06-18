/**
 * Loops over properties in an object calling an iterator for
 * each one.
 * 
 * @param {Object}   object   The object to loop over.
 * @param {Function} iterator Takes val, key. 
 * 
 * @return {undefined}
 */
export function forProps(object, iterator) {
  Object.keys(object).forEach(key => {
    iterator(object[key], key);
  })
}

/**
 * Shortcuts Object.assign to create a new object.
 * 
 * @param {Objects} objects Objects with properties to copy.
 * 
 * @return {Object} A new object containing all properties.
 */
export function extend(...objects) {
  return Object.assign({}, ...objects);
}

/**
 * Allows us to create a new object with some properties
 * removed.
 * 
 * @param {Object} object From which to remove properties.
 * @param {Array}  list   Names of properties to remove.
 * 
 * @return {Object} A new object minus named properties.
 */
export function removeProps(object, list) {
  const out = {};
  forProps(object, (val, key) => {
    if (list.indexOf(key) === -1) {
      out[key] = val;
    }
  });
  return out;
}