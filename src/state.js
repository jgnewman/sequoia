import { extend } from './utils';

let devMode = false;

const transforms = [];

/**
 * Throws an error if state values are not in object form.
 * 
 * @param {Maybe Object} stateVals A full collection of state values.
 * 
 * @return {undefined}
 */
function enforceObjectState(stateVals) {
  if (typeof stateVals !== 'object') {
    throw new Error('Application state must be an object.');
  }
}

/**
 * Logs a message to the console if dev mode
 * is enabled.
 * 
 * @param {Strings} message The message to log.
 * 
 * @return {undefined}
 */
function log(...message) {
  if (devMode) {
    console.log('[Sequoia State]', ...message);
  }
}

/**
 * @class
 * 
 * Allows you to collect a series of actions to perform and
 * only perform the last one asynchronously.
 */
class Resolver {

  /**
   * @constructor
   * 
   * @param {Object} state This resolver's initial state. 
   */
  constructor(state) {
    this.state = state;
    this.todo = null;
    this.hasTimeout = false;
    this.timeout = null;
  }

  /**
   * Take a function and queue it up as an action to perform.
   * Disregard the previous action. If we haven't already
   * set up a timeout to perform our action on the next run
   * loop, set one up.
   * 
   * @param {Function} action The action to perform.
   * 
   * @return {undefined}
   */
  add(action) {
    this.todo = action;
    if (!this.hasTimeout) {
      this.hasTimeout = true;
      this.timeout = setTimeout(() => {
        this.hasTimeout = false;
        this.timeout = null;
        this.todo(this.state);
        this.todo = null;
      }, 0);
    }
  }
}

/**
 * Allow the user to generate a state object.
 * 
 * @param {Object} vals The initial form of the state object.
 * 
 * @return {State} The state object, including methods.
 */
export function createState(vals={}) {
  let resolver;
  const watchers = [];
  const beforeSets = [];

  log('Detected state necessary. Creating state...');

  /*
   * Don't allow a non-object state.
   */
  enforceObjectState(vals);

  /*
   * Preload the state if we have preload data.
   */
  if (typeof window !== 'undefined' && window['@@SQ_Preload']) {
    vals = extend(window['@@SQ_Preload'], vals);
    log('Preloaded state with', window['@@SQ_Preload']);
  } else {
    log('No data found for preload.')
  }

  /*
   * Completes a set call by replacing the old values and
   * alerting all watchers.
   */
  const finishSet = newVals => {
    enforceObjectState(newVals);
    vals = newVals;
    resolver.add(thisState => {
      log(`Asynchronously notifying ${watchers.length} subscriber(s)...`);
      watchers.forEach(watcher => watcher(thisState))
    });
    log('State updated to', vals);
  };

  /*
   * These methods constitute the state object.
   */
  const methods = {

    /**
     * Retrieve the current state.
     * 
     * @param {String} namespace Optional. Allows you to get just
     *                           a namespace.
     * 
     * @return {Object} The current state values.
     */
    get(namespace) {
      return namespace ? vals[namespace] : vals;
    },

    /**
     * Determines whether the state is currently
     * empty.
     * 
     * @param {String} namespace Optional. Allows you to check a
     *                           single namespace for emptiness.
     * 
     * @return {Boolean}
     */
    isEmpty(namespace) {
      const toCheck = namespace ? (vals[namespace] || {}) : vals;
      return Object.keys(toCheck).length === 0;
    },

    /**
     * Allow the user to register a function that will
     * run every time a transformation is queued.
     * 
     * @param {Function} action Takes the new values about to be set.
     * 
     * @return {State} This state.
     */
    beforeTransform(action) {
      beforeSets.push(action);
      return this;
    },

    /**
     * Set a new state and alert all watchers.
     * 
     * @param {Object} newVals A new state to replace the old one.
     * 
     * @return {State} This state
     */
    set(newVals) {
      log('Replacing state...');
      if (vals === newVals) {
        throw new Error('State is immutable, you have to pass in a new state.');
      }
      beforeSets.forEach(action => action(newVals));
      finishSet(newVals);
      return this;
    },

    /**
     * Allows you to update the state with only a few values.
     * Performs an `Object.assign` and hands the result to `set`.
     * 
     * NOTE ANY AND ALL METHODS HERE THAT RESULT IN A STATE MUTATION
     * SHOULD CALL SET IN ORDER TO PERFORM THAT MUTATION.
     * 
     * @param {String} namespace Optional. The namespace to update.
     * @param {Object} newVals   The values to be updated.
     * 
     * @return {State} This state.
     */
    update(namespace, newVals) {
      const hasNamespace = arguments.length > 1;
      log('Update triggered for', hasNamespace ? `namespace ${namespace}` : 'full state', newVals);
      
      if (hasNamespace) {
        const newNamespace = extend(vals[namespace], newVals);
        return this.set(extend(vals, { [namespace]: newNamespace }))
      } else {
        return this.set(extend(vals, namespace));
      }
    },

    /**
     * Subscribes to changes on the state. Whenever the state
     * is set, a watcher is executed with the new state object.
     * 
     * @param {Function} watcher Runs when the state changes.
     * 
     * @return {State} This state.
     */
    watch(watcher) {
      watchers.push(watcher);
      return this;
    },

    /**
     * Unsubscribes a watcher function from state changes.
     * 
     * @param {Function} watcher A previously subscribed function.
     * 
     * @return {State} This state.
     */
    unwatch(watcher) {
      watchers.splice(watchers.indexOf(watcher, 1));
      return this;
    }
  };
  
  /*
   * Define the resolver so that state methods can use it.
   */
  resolver = new Resolver(methods);


  /*
   * Return the state object.
   */
  log('State created.');
  return methods;
}

/**
 * Allows user to get insight into the state
 * via console logs.
 * 
 * @return {undefined}
 */
export function enableDevMode() {
  devMode = true;
}

/**
 * Allows user to turn off state logging.
 * 
 * @return {undefined}
 */
export function disableDevMode() {
  devMode = false;
}

