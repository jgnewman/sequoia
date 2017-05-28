'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.application = application;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _reactRedux = require('react-redux');

var _utils = require('./utils');

var _store = require('./store');

var _data = require('./data');

var _routing = require('./routing');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
 * First things first: You should never have to import react proper.
 * So in order to make JSX work, we need to make it a global.
 */
global.React = _react2.default;

/**
 * @class
 *
 * Allows us to reference the correct store from deep within our nesting.
 */

var CustomProvider = function (_React$Component) {
  _inherits(CustomProvider, _React$Component);

  /*
   * Build the class.
   */
  function CustomProvider() {
    _classCallCheck(this, CustomProvider);

    return _possibleConstructorReturn(this, (CustomProvider.__proto__ || Object.getPrototypeOf(CustomProvider)).call(this));
  }

  /*
   * Add a property to nested children called .context."@@SQ_Store"
   * that will contain the store wrapper instance.
   */


  _createClass(CustomProvider, [{
    key: 'getChildContext',
    value: function getChildContext() {
      return _defineProperty({}, _utils.INTERNALS.STORE_REF, this.props[_utils.INTERNALS.STORE_REF]);
    }

    /*
     * Render out a provider to get the react-redux benefits
     */

  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        _reactRedux.Provider,
        { store: this.props[_utils.INTERNALS.STORE_REF].get(_store.secretStoreKey) },
        _react.Children.only(this.props.children)
      );
    }
  }]);

  return CustomProvider;
}(_react2.default.Component);

/*
 * Make sure the "@@SQ_Store" context prop always exists.
 */


CustomProvider.childContextTypes = _defineProperty({}, _utils.INTERNALS.STORE_REF, _propTypes2.default.object.isRequired);

/**
 * @class
 *
 * Provides tools for configuring an application.
 */

var AppKit = function () {

  /*
   * Build the instance with a storage place.
   */
  function AppKit(cache) {
    _classCallCheck(this, AppKit);

    this.cache = cache;
  }

  /**
   * Allow the user to perform advanced configurations.
   *
   * @param  {Object} settings The users's settings.
   *
   * @return {AppKit}
   */


  _createClass(AppKit, [{
    key: 'config',
    value: function config(settings) {
      this.cache.config = settings;
      return this;
    }

    /**
     * Allow the user to determine where to render their application.
     *
     * @param  {String|Element} target The html target for rendering.
     *
     * @return {AppKit}
     */

  }, {
    key: 'renderIn',
    value: function renderIn(target) {
      if (this.cache.target) {
        throw (0, _utils.createError)('The `renderIn` function can only be called once per application.');
      }
      this.cache.target = typeof target === 'string' ? document.querySelector(target) : target;
      return this;
    }

    /**
     * Provides an intuitive technique for setting up initial state
     * and defining rules for it.
     *
     * @param  {String} namespace The name of the affected namespace on the state.
     * @param  {Object} rulesObj  Describes the rules for updating this namespace.
     *
     * @return {AppKit}
     */

  }, {
    key: 'createRules',
    value: function createRules(namespace, rulesObj) {
      this.cache.rules = this.cache.rules || {};
      this.cache.rules[namespace] = this.cache.rules[namespace] || {};
      Object.assign(this.cache.rules[namespace], rulesObj);
      return this;
    }
  }]);

  return AppKit;
}();

/**
 * Determines whether or not to delay app rendering until after state
 * rehydration.
 *
 * Rehydration occurs by default so we'll delay render if there's no config.
 * By the same token, we WON'T delay render if rehydration is disabled.
 * If the user has provided autopersist config and disabled the render delay, we won't delay.
 * Otherwise, we will delay render.
 *
 * @param  {Object|undefined} config The user's application config.
 *
 * @return {Boolean} Whether or not to delay render
 */


function shouldDelayRender(config) {
  if (!config) return true;
  if (config.disableAutoPersist) return false;
  if (config.autoPersist && config.autoPersist.disableRenderDelay) return false;
  return true;
}

/**
 * Create a new application.
 * TODO: Don't allow this to be called inside the nested children of another application call.
 *
 * @param  {Function} generator  Takes an application kit and returns a render function.
 *
 * @return {Component} A React component.
 */
function application(generator) {
  var appCache = {};
  var Application = generator(new AppKit(appCache));
  var storeWrapper = new _store.StoreWrapper(appCache.config || {});

  /*
   * If the component returns pure JSX, wrap it in a function.
   */
  if (Application && Application.$$typeof === Symbol.for('react.element')) {
    var App = Application;
    Application = function Application() {
      return App;
    };
  }

  /*
   * Create the function that will render the application.
   * When we render, pass the storeWrapper down through the
   * context tree.
   */
  var render = function render() {
    _reactDom2.default.render(_react2.default.createElement(CustomProvider, _defineProperty({}, _utils.INTERNALS.STORE_REF, storeWrapper), _react2.default.createElement(Application, null)), appCache.target);
  };

  /*
   * Register our implicit data namespace and rules.
   */
  storeWrapper.createNamespace(_utils.INTERNALS.DATA_REF);
  storeWrapper.registerRule(_utils.INTERNALS.DATA_RULE, _utils.INTERNALS.DATA_REF, (0, _data.createRestRule)());

  /*
   * Register our implicit routing namespace and rules.
   */
  storeWrapper.createNamespace(_utils.INTERNALS.HASH_PATH);
  storeWrapper.registerRule('DEFAULT', _utils.INTERNALS.HASH_PATH, (0, _routing.createHashRule)());

  /*
   * If the user created rules, register them.
   */
  if (appCache.rules) {

    /*
     * For every namespaced ruleset, create a namespace in the initialState.
     */
    (0, _utils.mapObject)(appCache.rules, function (namespace, namespaceName) {
      storeWrapper.createNamespace(namespaceName);

      /*
       * Register each of our rules to be used by the reducer. If the
       * rule is DEFAULT, it will automatically trigger it immediately to
       * populate the namespace.
       */
      (0, _utils.mapObject)(namespace, function (rule, ruleName) {
        storeWrapper.registerRule(ruleName, namespaceName, rule);
      });
    });
  }

  /*
   * Render the application either immediately or after rehydration has
   * completed.
   */
  if (shouldDelayRender(appCache.config)) {
    (0, _utils.subscribe)(_utils.INTERNALS.REHYDRATED, render);
  } else {
    render();
  }
}