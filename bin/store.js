'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StoreWrapper = exports.secretStoreKey = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.onCreateStore = onCreateStore;

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _reduxPersist = require('redux-persist');

var _constants = require('redux-persist/constants');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Holds references to hooks to run when stores are created.
 */
var storeHooks = [];

/*
 * For any internal store related stuff.
 */
var secretStoreKey = exports.secretStoreKey = Symbol();

/**
 * @class
 *
 * Creates a more robust Store object that allows us to more easily
 * reason about what's going on with our Stores.
 */

var StoreWrapper = exports.StoreWrapper = function () {

  /**
   * @constructor
   *
   * @param  {Object} settings User config for the store.
   *
   * @return {undefined}
   */
  function StoreWrapper(settings) {
    _classCallCheck(this, StoreWrapper);

    this.settings = settings;
    this.initialState = {};
    this.store = null;
    this.rulesCache = {};
    this.actionNames = {};
    this.create();
  }

  /**
   * Returns the actual store.
   *
   * @return {Redux Store}
   */


  _createClass(StoreWrapper, [{
    key: 'get',
    value: function get(secretKey) {
      return this.store ? this.store(secretKey) : null;
    }

    /**
     * Creates a new namespace on the initialState.
     *
     * @param  {String} name The name of the namespace.
     *
     * @return {undefined}
     */

  }, {
    key: 'createNamespace',
    value: function createNamespace(name) {
      this.initialState[name] = this.initialState[name] || {};
    }

    /**
     * Creates a new micro-reducer for this store.
     *
     * @param  {String|Symbol} name      The action type associated with the reducer.
     * @param  {String|Symbol} substate  The namespace on the state associated with the rule.
     * @param  {Function}      reducer   How to reduce this action. Takes update, substate, payload.
     *
     * @return {undefined}
     */

  }, {
    key: 'registerRule',
    value: function registerRule(name, substate, reducer) {
      var ruleName = substate + ':' + name;
      if (this.rulesCache[ruleName]) {
        throw (0, _utils.createError)('A rule with the name ' + name + ' already exists.');
      }

      this.actionNames[substate] = this.actionNames[substate] || {};
      this.actionNames[substate][name] = ruleName;

      this.rulesCache[ruleName] = { substate: substate, reducer: reducer };

      /*
       * Automatically dispatch default rules on register.
       */
      name === 'DEFAULT' && this.dispatch({ type: substate + ':DEFAULT' });
    }

    /**
     * Manually dispatch an action.
     *
     * @param  {Object} action  Contains `type` and whatever else.
     *
     * @return {undefined}
     */

  }, {
    key: 'dispatch',
    value: function dispatch(action) {
      var store = this.get(secretStoreKey);
      store.dispatch(action);
    }

    /**
     * Wraps redux's composse function to add in redux
     * dev tools if it's available in the environment.
     *
     * @param  {Any} args The arguments we want to pass to compose.
     *
     * @return {Function} The result of calling redux's compose.
     */

  }, {
    key: 'compose',
    value: function compose() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!this.settings.disableDevTools && global.__REDUX_DEVTOOLS_EXTENSION__) {
        args.push(global.__REDUX_DEVTOOLS_EXTENSION__());
      }
      return _redux.compose.apply(null, args);
    }

    /**
     * Create a single reducer that will serve to pull micro-reducers
     * from a rules cache as named by action type and run only that function,
     * as opposed to running EVERY action through EVERY case in EVERY reducer
     * function as is tradition.
     *
     * @return {Object} A new state.
     */

  }, {
    key: 'reduce',
    value: function reduce() {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialState;
      var action = arguments[1];


      /*
       * Should look like: `UPDATE_FOO: { substate: 'app', reducer: Function }`
       */
      var rule = this.rulesCache[action.type];

      /*
       * If a rule for this action type exists...
       */
      if (rule) {

        /*
         * Call the rule's reducer with the current substate and action.payload.
         * Afterward, attach the new substate to the full state.
         */
        var newSubstate = rule.reducer(state[rule.substate] || {}, action.payload);
        return Object.assign({}, state, _defineProperty({}, rule.substate, newSubstate));
      } else if (action.type === _constants.REHYDRATE) {
        var _Object$assign2;

        /*
         * In case anything is listening for the reydrated event, this is where
         * it happens.
         */
        setTimeout(function () {
          (0, _utils.publish)(_utils.INTERNALS.REHYDRATED);
        }, 0);

        /*
         * When autoPersist attempts to rehydrate, clear out any existing
         * data and don't overwrite hash path stuff.
         */
        return Object.assign({}, state, (_Object$assign2 = {}, _defineProperty(_Object$assign2, _utils.INTERNALS.DATA_REF, {}), _defineProperty(_Object$assign2, _utils.INTERNALS.HASH_PATH, Object.assign({}, state[_utils.INTERNALS.HASH_PATH])), _Object$assign2));

        /*
         * If no rule for the action type exists, return the state.
         */
      } else {
        return state;
      }
    }

    /**
     * Actually create the redux store.
     *
     * @return {undefined}
     */

  }, {
    key: 'create',
    value: function create() {

      /*
       * Give the user thunk middleware for free. We'll need it.
       */
      var middleware = this.settings.stateMiddleware || [];
      typeof middleware === 'function' && (middleware = [middleware]);
      middleware.unshift(_reduxThunk2.default);

      /*
       * Create the actual store.
       */
      var store = (0, _redux.createStore)(this.reduce.bind(this), this.initialState, this.compose(_redux.applyMiddleware.apply(undefined, _toConsumableArray(middleware)), this.settings.disableAutoPersist ? function (next) {
        return function (action) {
          return next(action);
        };
      } : (0, _reduxPersist.autoRehydrate)()));

      /*
       * Provide means to access the store if we have a secret key for it.
       */
      this.store = function (secretKey) {
        return secretKey === secretStoreKey ? store : null;
      };

      /*
       * If the user hasn't disabled auto persistence, go ahead and set up persist.
       */
      if (!this.settings.disableAutoPersist) {
        this.settings.autoPersist = this.settings.autoPersist || {};
        (0, _reduxPersist.persistStore)(store, this.settings.autoPersist, this.settings.autoPersist.done || function () {});
      }

      /*
       * Run all store creation hooks.
       */
      storeHooks.forEach(function (hook) {
        return hook(store);
      });
    }
  }]);

  return StoreWrapper;
}();

/**
 * Register functions that will run on each new store when it
 * is created.
 *
 * @param  {Function} hook  The function to run. Takes the store.
 *
 * @return {undefined}
 */


function onCreateStore(hook) {
  storeHooks.push(hook);
}