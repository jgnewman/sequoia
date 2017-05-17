'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.component = component;
exports.render = render;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactReduxInfuser = require('react-redux-infuser');

var _reactReduxInfuser2 = _interopRequireDefault(_reactReduxInfuser);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _reactRedux = require('react-redux');

var _constants = require('./constants');

var _data = require('./data');

var _store = require('./store');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * First things first: You should never have to import react proper.
 * So in order to make JSX work, we need to make it a global.
 */
global.React = _react2.default;

/**
 * Translates traditional React PropTypes in to all caps prop types in order
 * to fit the scheme of constants in the framework better.
 *
 * @param  {Object|Function} val Something that can have properties attached to it.
 *
 * @return {Object|Function} The input with proptypes attached.
 */
function attachPropTypes(val) {
  Object.keys(_propTypes2.default).forEach(function (typeName) {
    val[typeName] = _propTypes2.default[typeName];
  });

  val.boolean = val.bool;
  val.function = val.func;
  return val;
}

/**
 * @class
 *
 * Designed to help with DOM reference capture.
 */

var Referencer = function () {
  function Referencer() {
    _classCallCheck(this, Referencer);

    this.__refs = {};
  }

  /*
   * Should be called on an element's ref attribute like
   * `ref={capturer.capture('foo')}`.
   * You can now reference that real DOM element
   */


  _createClass(Referencer, [{
    key: 'capture',
    value: function capture(name) {
      var _this = this;

      return function (elem) {
        return elem && (_this.__refs[name] = elem);
      };
    }

    /*
     * Return the current DOM element reference immediately.
     */

  }, {
    key: 'get',
    value: function get(name) {
      return this.__refs[name];
    }

    /*
     * Return the DOM reference on the next run loop.
     * Helps when you want to call things like focus or
     * scroll on an element.
     *
     * `after` is optional. If included, waits that amount
     * of time before returning the reference.
     */

  }, {
    key: 'getAsync',
    value: function getAsync(name, after, cb) {
      var _this2 = this;

      if (typeof after === 'function') {
        cb = after;
        after = 0;
      }
      setTimeout(function () {
        cb(_this2.__refs[name]);
      }, after);
    }
  }]);

  return Referencer;
}();

/*
 * Functionize our Referencer class.
 */


function referencer() {
  return new Referencer();
}

/**
 * Creates an object full of useful tools for a component to use.
 *
 * @param  {Object}  cache   Stores the result of using the component tools.
 * @param  {DataAPI} dataAPI An instance of the data api.
 *
 * @return {Object} Containing all the tools.
 */
function generateComponentTools(cache, dataAPI) {
  var stateSelectors = [];
  (0, _utils.assertNesting)(cache, 'i');

  /*
   * We're gonna take inspiration from `combineReducers` and turn
   * `mapStateToProps` into a function that executes multiple state
   * mapping functions.
   */
  cache.i.values = function (state) {
    var out = {};
    stateSelectors.forEach(function (selector) {
      out = Object.assign({}, out, selector(state));
    });
    return out;
  };

  return {

    /*
     * Allow ref capture
     */
    referencer: referencer,

    /*
     * Provide access to the data API
     */
    data: dataAPI,

    /*
     * Provide prop type handling
     */
    ensure: attachPropTypes(function (settings) {
      return cache.e = settings;
    }),

    /*
     * Provide a function that selects state values and converts them to props
     */
    infuseState: function infuseState(stateSelect) {
      return stateSelectors.push(stateSelect);
    },

    /*
     * Infuse in a single function and convert it to an action
     */
    infuseActions: function infuseActions(name, val) {
      var actions = (0, _utils.assertNesting)(cache, 'i', 'actions');
      (typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' ? cache.i.actions = Object.assign(cache.i.actions, name) : actions[name] = val;
    },

    /*
     * Infuse in a single function and bind it to the container
     */
    infuseBinders: function infuseBinders(name, val) {
      var binders = (0, _utils.assertNesting)(cache, 'i', 'binders');
      (typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' ? cache.i.binders = Object.assign(cache.i.binders, name) : binders[name] = val;
    },

    /*
     * Infuse in a single function and add it to the props
     */
    infuseModules: function infuseModules(name, val) {
      var modules = (0, _utils.assertNesting)(cache, 'i', 'modules');
      (typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' ? cache.i.modules = Object.assign(cache.i.modules, name) : modules[name] = val;
    },

    /*
     * Use a single object to create packs of actions, binders, and modules
     */
    infuse: function infuse(settings) {
      settings.binders && (cache.i.binders = Object.assign({}, cache.i.binders || {}, settings.binders));
      settings.actions && (cache.i.actions = Object.assign({}, cache.i.actions || {}, settings.actions));
      settings.modules && (cache.i.modules = Object.assign({}, cache.i.modules || {}, settings.modules));
      settings.state && stateSelectors.push(settings.state);
    }
  };
}

/**
 * Takes a function and returns a sweet-azz component.
 *
 *   component(({ infuse, ensure }) => {
 *     infuse({ values: state => ({ foo: state.foo, bar: state.bar }) });
 *     ensure({ foo: ensure.string, bar: ensure.string });
 *     return ({ foo, bar }) => <div>{foo}{bar}</div>
 *   })
 *
 * @param  {Function}  componentFunction Called with a collection of tools for building the component.
 *
 * @return {Component} A react component.
 */
function component(componentFunction) {
  var dataToggler = (0, _utils.toggleSymbols)();
  var appId = void 0;
  var dataCache = void 0;

  /*
   * Create the tools that will get passed into the componentFunction.
   */
  var setup = {};
  var getAppId = function getAppId() {
    return appId;
  };
  var tools = generateComponentTools(setup, new _data.DataAPI(_store.getState, _store.dispatchToState, getAppId));

  /*
   * Call the componentFunction with its controller functions.
   * Then attach prop types to the result.
   */
  var Component = componentFunction(tools);
  Component.propTypes = setup.e || {};

  /*
   * Enforce dumb components.
   */
  if (Component.prototype instanceof _react2.default.Component) {
    throw (0, _utils.createError)('\n        Components must return functions. React component classes are not\n        allowed because they have too many potential pitfalls.\n      ');
  }

  /*
   * This part is a little bit of magic. Essentially, we need components to re-render
   * whenever data updates so their api functions within render methods will actually
   * run. However, we don't want to pass the data itself into the props because the
   * whole point is to not give users tools to screw themselves over.
   *
   * So here we infuse a prop called `__dataSymbol` whose value will always be
   * one of two Symbol constants, making it useless to the user. Whenever the state updates,
   * we'll check to see if @@SQ_DATA has been updated. If so, we'll toggle the symbols,
   * thus causing the component to re-render. If not, we'll return the current symbol
   * and the compnent will not necessarily re-render.
   */
  tools.infuseState(function (state) {
    var out = {};

    /*
     * Cause component to re-render when data changes.
     */
    if (dataCache === state[_utils.internals.DATA]) {
      out.__dataSymbol = dataToggler.current();
    } else {
      out.__dataSymbol = dataToggler();
      dataCache = state[_utils.internals.DATA];
    }

    /*
     * Provide state location as a prop.
     */
    out.location = state[_utils.internals.ROUTING];

    /*
     * HACK:
     * Take this opportunity to make sure the data API can
     * access the APP ID.
     *
     * It would be nice to not have to weirdly do this inside of
     * mapStateToProps.
     */
    appId = appId || state[_utils.internals.APP_META].appId;
    return out;
  });

  /*
   * If we are using infused actions or values, use reduxInfuse to add
   * everything in. Otherwise, manually add in binders and modules.
   */
  if (setup.i && (setup.i.actions || setup.i.values)) {
    Component = (0, _reactReduxInfuser2.default)(Component, setup.i || {});
  }

  /*
   * Return the component.
   */
  return Component;
}

/**
 * Initializes the application by rendering it into a provided
 * element.
 *
 * @param  {JSX}    app      The user's application.
 * @param  {Object} settings Putting this together.
 *
 * @return {Render} The result of calling ReactDOM.render
 */
function render(app, settings) {
  var target = typeof settings.target === 'string' ? document.querySelector(settings.target) : settings.target;
  var appId = (0, _uuid2.default)();

  /*
   * If the user has not provided state config, prepare a minimal
   * state config so that all other functionality that needs state
   * will have it.
   */
  if (!settings.stateConfig) {
    settings.stateConfig = {
      initialState: {},
      reducers: {}
    };
  }

  /*
   * Generate constants before anything else happens
   */
  (0, _constants.createConstantsFromArray)(settings.constants || []);

  /*
   * Initialze the store and render it into a provider.
   */
  return _reactDom2.default.render(_react2.default.createElement(
    _reactRedux.Provider,
    { store: (0, _store.initializeStore)(settings.stateConfig, appId) },
    app
  ), target);
}