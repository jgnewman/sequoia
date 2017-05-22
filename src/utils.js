const symbol1 = Symbol();
const symbol2 = Symbol();

const events = {};

/**
 * Some internal system constants.
 *
 * @type {Object}
 */
export const INTERNALS = {
  STORE_REF    : "@@SQ_Store",
  DATA_REF     : "@@SQ_Data",
  DATA_RULE    : "@@SQ_DataRule",
  DATA_DEFAULT : "@@SQ_DataDefault",
  DATA_PENDING : "@@SQ_DataPending",
  DATA_ERROR   : "@@SQ_DataError",
  DATA_SUCCESS : "@@SQ_DataSuccess",
  HASH_PATH    : "@@SQ_HashPath",
  REHYDRATED   : "@@SQ_Rehydrated"
}

/*
 * Fake `window` if we don't have it.
 */
export const win = typeof window !== 'undefined' ? window : {
  location: {search: '', hash: ''},
  addEventListener: function () {}
};

/**
 * Calls `forEach` on an object and returns a new
 * object with mapped values.
 *
 * @param  {Object}   obj       Plain object.
 * @param  {Function} iterator  Takes val, key.
 *
 * @return {Object} New object with same keys, new vals.
 */
export function mapObject(obj, iterator) {
  const out = {};
  Object.keys(obj).forEach(key => {
    out[key] = iterator(obj[key], key);
  })
  return out;
}

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

/**
 * Remove all the named properties from an object.
 *
 * @param  {Object}  obj   The object to start from.
 * @param  {Array}   props The names of properties to remove.
 *
 * @return {Object}  A new object where `props` have been excluded.
 */
export function removeProps(obj, props) {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (props.indexOf(key) === -1) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

/**
 * Subscribe to an internal event.
 *
 * @param  {String}   eventName The name of the event.
 * @param  {Function} handler   Handles the event.
 *
 * @return {undefined}
 */
export function subscribe(eventName, handler) {
  events[eventName] = events[eventName] || [];
  events[eventName].push(handler);
}

/**
 * Publish an internal event.
 *
 * @param  {String} eventName The name of the event.
 * @param  {Any}    args      Passed to all event handlers.
 *
 * @return {undefined}
 */
export function publish(eventName, ...args) {
  if (events[eventName]) {
    events[eventName].forEach(handler => handler(...args));
  }
}

/**
 * Wraps Object.assign to assign multiple props into a new object.
 *
 * @param  {Objects} objects The objects to be merged together.
 *
 * @return {Object}
 */
export function merge(...objects) {
  return Object.assign({}, ...objects);
}
