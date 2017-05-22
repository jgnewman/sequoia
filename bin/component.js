'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.component = component;

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 *
 * Provides tools for configuring a component.
 */
var ComponentKit = function () {

  /*
   * Build the instance with a storage place.
   */
  function ComponentKit(cache, getStoreWrapper) {
    _classCallCheck(this, ComponentKit);

    this.__cache = cache;

    /*
     * Give the user a data api for accessing Copenhagen data on
     * the state.
     */
    this.data = new _data.DataAPI(getStoreWrapper);

    /*
     * Map PropTypes to ensure, but don't do it if we
     * already did it.
     */
    if (_propTypes2.default.string !== this.ensure.string) {
      Object.assign(this.ensure, _propTypes2.default);
    }
  }

  /**
   * Allow the user to validate prop types on a component.
   *
   * @param  {Object} propTypes Defines the prop types.
   *
   * @return {ComponentKit}
   */


  _createClass(ComponentKit, [{
    key: 'ensure',
    value: function ensure(propTypes) {
      var typeCache = this.__cache.propTypes = this.__cache.propTypes || {};
      (0, _utils.mapObject)(propTypes, function (val, propType) {
        return typeCache[propType] = val;
      });
      return this;
    }

    /**
     * Allow the user to map state to props.
     *
     * @param  {Function} infuser Takes `state` and returns a collection of props.
     *
     * @return {ComponentKit}
     */

  }, {
    key: 'infuseState',
    value: function infuseState(infuser) {
      this.__cache.stateInfusers = this.__cache.stateInfusers || [];
      this.__cache.stateInfusers.push(infuser);
      return this;
    }

    /**
     * Allow the user to run event handlers with both event and current props.
     *
     * @param  {Object} handlers The handlers to infuse.
     *
     * @return {ComponentKit}
     */

  }, {
    key: 'infuseHandlers',
    value: function infuseHandlers(handlers) {
      this.__cache.handlers = this.__cache.handlers || {};
      Object.assign(this.__cache.handlers, handlers);
      return this;
    }

    /**
     * Allow the user to map dispatch to props.
     *
     * @param  {Function} infuser Takes `actionSymbols` and returns a collection of action functions.
     *
     * @return {ComponentKit}
     */

  }, {
    key: 'infuseActions',
    value: function infuseActions(infuser) {
      this.__cache.actionInfusers = this.__cache.actionInfusers || [];
      this.__cache.actionInfusers.push(infuser);
      return this;
    }
  }]);

  return ComponentKit;
}();

/**
 * Create a function that can be used to trap references
 * to elements when used in a `ref=` attribute. Subsequently
 * you will be able to use `ref.get` to retrieve the element.
 *
 * @return {Function} The referencer.
 */


function createReferencer() {
  var captures = {};

  /*
   * Used like `ref={ref('foo')}`.
   * It returns a function that captures the element under the given name.
   */
  var ref = function ref(name) {
    return function (elem) {
      if (elem) {
        captures[name] = elem;
      }
    };
  };

  /*
   * Retrieves one of our captured references by name.
   */
  ref.get = function (name) {
    return captures[name];
  };

  /*
   * Retrieves a captured reference by name after some time.
   * Useful for cases when you need to call `scroll` or `focus`.
   */
  ref.getAsync = function (name, duration, callback) {
    if (typeof duration === 'function') {
      callback = duration;
      duration = 0;
    }
    setTimeout(function () {
      callback(captures[name]);
    }, duration);
  };

  return ref;
}

/**
 * Generates a function that calls dispatch on a store.
 *
 * @param  {StoreWrapper} storeWrapper A storeWrapper instance.
 * @param  {Object}       actionProps  The object ultimately containing all of the actions.
 * @param  {Function}     fn           A function that returns an action to be dispatched.
 *
 * @return {Function} The new dispatcher function.
 */
function createDispatcher(storeWrapper, actionProps, fn) {

  /*
   * This will be the actual action function.
   */
  return function (payload) {

    /*
     * If the user gave us a function, we call it here. We end up with
     * the type needed for the dispatch.
     */
    var actionType = typeof fn === 'function' ? fn(payload) : fn;

    /*
     * If we got a thunk, re-wrap it so that it access to the other
     * actions as well.
     */
    if (typeof actionType === 'function') {
      var origActionType = actionType;
      actionType = function actionType(dispatch) {
        return origActionType(actionProps);
      };
    }

    /*
     * If the action type was a string, make an object out of
     * it. Otherwise, we assume it's already an object or a thunk.
     */
    if (typeof actionType === 'string') {
      actionType = { type: actionType };
    }

    /*
     * Dispatch the action type
     */
    return storeWrapper.dispatch(actionType);
  };
}

/**
 * Create a new component.
 *
 * @param  {Function} generator  Takes an application kit and returns a render function.
 *
 * @return {Component} A React component.
 */
function component(generator) {
  var storeWrapper = void 0;
  var getStoreWrapper = function getStoreWrapper(secretKey) {
    return secretKey === _store.secretStoreKey ? storeWrapper : null;
  };

  var dataToggler = (0, _utils.toggleSymbols)();
  var prevData = {};

  /*
   * When the generator runs, it will populate the cache (via kit methods) with
   * data informing how to map state to props, create actions, etc.
   */
  var cache = {};
  var renderFn = generator(new ComponentKit(cache, getStoreWrapper));

  /*
   * Create a proxy component so that we can access render and context.
   */
  var Component = function (_React$Component) {
    _inherits(Component, _React$Component);

    function Component() {
      _classCallCheck(this, Component);

      return _possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).call(this));
    }

    _createClass(Component, [{
      key: 'render',
      value: function render() {

        /*
         * The referencer prop will be specific to each component and can
         * be used to trap `ref={...}` references.
         */
        var referencer = createReferencer();
        var newProps = Object.assign({}, this.props, { ref: referencer });

        /*
         * Trap a reference to the storeWrapper so that our
         * data API will be able to use it.
         */
        storeWrapper = this.context[_utils.INTERNALS.STORE_REF];

        /*
         * If the user has specified action infusers, loop over each group and
         * merge them together into a prop called `actions` that dispatches the
         * action to the store. The reason we don't use mapDispatchToProps is
         * because we need access to the actionNames on the storeWrapper.
         */
        if (cache.actionInfusers) {
          var actionProps = {};

          cache.actionInfusers.forEach(function (infuser) {
            Object.assign(actionProps, newProps.actions || {}, // Merge any any actions passed in from the parent.
            (0, _utils.mapObject)(infuser(storeWrapper.actionNames, _data.requestsPackage), function (fn) {
              return createDispatcher(storeWrapper, actionProps, fn);
            }));
          });

          newProps = Object.assign({}, newProps, { actions: actionProps });
        }

        /*
         * If the user has specified handlers, make them more robust by
         * converting each one into a function that is called both with
         * the event object and the current props.
         */
        if (cache.handlers) {
          var newHandlers = (0, _utils.mapObject)(cache.handlers, function (val, key) {
            return function (evt) {
              return val(evt, newProps);
            };
          });
          var mergedHandlers = newProps.handlers ? Object.assign({}, newProps.handlers, newHandlers) : newHandlers;
          newProps = Object.assign({}, newProps, { handlers: mergedHandlers });
        }

        return renderFn(newProps);
      }
    }]);

    return Component;
  }(_react2.default.Component);

  /*
   * Make sure every component can access the store wrapper
   * we got from our custom provider.
   */
  Component.contextTypes = _defineProperty({}, _utils.INTERNALS.STORE_REF, _propTypes2.default.object.isRequired);

  /*
   * Attach prop types to the component if necessary.
   */
  if (cache.propTypes) {
    Component.propTypes = cache.propTypes;
  }

  /*
   * To map state to props, loop over all state infusers and call
   * each one with the state. Merge all their outputs together and
   * return the result.
   */
  function mapStateToProps(state) {
    var out = {};

    /*
     * Assign props from all of the state infusers.
     */
    if (cache.stateInfusers) {
      cache.stateInfusers.forEach(function (infuser) {
        Object.assign(out, infuser(state));
      });
    }

    /*
     * Cause the component to re-render when data changes by
     * toggling a symbol on its props when the incoming data
     * is different.
     */
    if (prevData === state[_utils.INTERNALS.DATA_REF]) {
      out.__dataSymbol = dataToggler.current();
    } else {
      out.__dataSymbol = dataToggler();
      prevData = state[_utils.INTERNALS.DATA_REF];
    }

    /*
     * Provide state location as a prop.
     */
    out.location = state[_utils.INTERNALS.HASH_PATH];

    return out;
  }

  /*
   * Return a connected component so we can make use of
   * mapStateToProps
   */
  return (0, _reactRedux.connect)(mapStateToProps, function () {
    return {};
  })(Component);
}