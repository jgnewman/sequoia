'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.createState = createState;
exports.enableDevMode = enableDevMode;
exports.disableDevMode = disableDevMode;

var _utils = require('./utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var devMode = false;

var transforms = [];

/**
 * Throws an error if state values are not in object form.
 * 
 * @param {Maybe Object} stateVals A full collection of state values.
 * 
 * @return {undefined}
 */
function enforceObjectState(stateVals) {
  if ((typeof stateVals === 'undefined' ? 'undefined' : _typeof(stateVals)) !== 'object') {
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
function log() {
  if (devMode) {
    var _console;

    for (var _len = arguments.length, message = Array(_len), _key = 0; _key < _len; _key++) {
      message[_key] = arguments[_key];
    }

    (_console = console).log.apply(_console, ['[Sequoia State]'].concat(message));
  }
}

/**
 * @class
 * 
 * Allows you to collect a series of actions to perform and
 * only perform the last one asynchronously.
 */

var Resolver = function () {

  /**
   * @constructor
   * 
   * @param {Object} state This resolver's initial state. 
   */
  function Resolver(state) {
    _classCallCheck(this, Resolver);

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


  _createClass(Resolver, [{
    key: 'add',
    value: function add(action) {
      var _this = this;

      this.todo = action;
      if (!this.hasTimeout) {
        this.hasTimeout = true;
        this.timeout = setTimeout(function () {
          _this.hasTimeout = false;
          _this.timeout = null;
          _this.todo(_this.state);
          _this.todo = null;
        }, 0);
      }
    }
  }]);

  return Resolver;
}();

/**
 * Allow the user to generate a state object.
 * 
 * @param {Object} vals The initial form of the state object.
 * 
 * @return {State} The state object, including methods.
 */


function createState() {
  var vals = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var resolver = void 0;
  var watchers = [];
  var beforeSets = [];

  log('Detected state necessary. Creating state...');

  /*
   * Don't allow a non-object state.
   */
  enforceObjectState(vals);

  /*
   * Preload the state if we have preload data.
   */
  if (typeof window !== 'undefined' && window['@@SQ_Preload']) {
    vals = (0, _utils.extend)(window['@@SQ_Preload'], vals);
    log('Preloaded state with', window['@@SQ_Preload']);
  } else {
    log('No data found for preload.');
  }

  /*
   * Completes a set call by replacing the old values and
   * alerting all watchers.
   */
  var finishSet = function finishSet(newVals) {
    enforceObjectState(newVals);
    vals = newVals;
    resolver.add(function (thisState) {
      log('Asynchronously notifying ' + watchers.length + ' subscriber(s)...');
      watchers.forEach(function (watcher) {
        return watcher(thisState);
      });
    });
    log('State updated to', vals);
  };

  /*
   * These methods constitute the state object.
   */
  var methods = {

    /**
     * Retrieve the current state.
     * 
     * @param {String} namespace Optional. Allows you to get just
     *                           a namespace.
     * 
     * @return {Object} The current state values.
     */
    get: function get(namespace) {
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
    isEmpty: function isEmpty(namespace) {
      var toCheck = namespace ? vals[namespace] || {} : vals;
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
    beforeTransform: function beforeTransform(action) {
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
    set: function set(newVals) {
      log('Replacing state...');
      if (vals === newVals) {
        throw new Error('State is immutable, you have to pass in a new state.');
      }
      beforeSets.forEach(function (action) {
        return action(newVals);
      });
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
    update: function update(namespace, newVals) {
      var hasNamespace = arguments.length > 1;
      log('Update triggered for', hasNamespace ? 'namespace ' + namespace : 'full state', newVals);

      if (hasNamespace) {
        var newNamespace = (0, _utils.extend)(vals[namespace], newVals);
        return this.set((0, _utils.extend)(vals, _defineProperty({}, namespace, newNamespace)));
      } else {
        return this.set((0, _utils.extend)(vals, namespace));
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
    watch: function watch(watcher) {
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
    unwatch: function unwatch(watcher) {
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
function enableDevMode() {
  devMode = true;
}

/**
 * Allows user to turn off state logging.
 * 
 * @return {undefined}
 */
function disableDevMode() {
  devMode = false;
}