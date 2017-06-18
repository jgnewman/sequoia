'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _react = require('react');

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _utils = require('./utils');

var _state = require('./state');

var _decision = require('./decision');

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fauxState = void 0;
var noop = function noop() {
  return null;
};

/*
 * Will be used to map user's lifecycle methods
 * to React lifecycle methods.
 */
var LIFECYCLE_MAP = {
  beforeMount: 'componentWillMount',
  afterMount: 'componentDidMount',
  beforeUnmount: 'componentWillUnmount',
  beforeUpdate: 'componentWillUpdate',
  afterUpdate: 'componentDidUpdate',
  shouldUpdate: 'shouldComponentUpdate'
};

/*
 * For rare cases when a state may be desirable but is
 * NEVER updated, we can create a shared mock state.
 */
function mockState() {
  fauxState = fauxState || (0, _state.createState)({});
  return fauxState;
}

/**
 * Maps a value's type to it's corresponding
 * prop type.
 * 
 * @param {Any} val Some truthy value.
 * 
 * @return {Function} The corresponding prop type.
 */
function mapPropType(val) {
  var type = typeof val === 'undefined' ? 'undefined' : _typeof(val);
  if (type === 'boolean') return _propTypes2.default.bool;
  if (type === 'function') return _propTypes2.default.func;
  return _propTypes2.default[type] ? _propTypes2.default[type] : _propTypes2.default.any;
}

/**
 * Attaches a contextTypes object to a component.
 * 
 * @param {Component} component A component instance.
 * @param {Array}     userVals  Extra context items the user expects.
 * 
 * @return {undefined}
 */
function attachContextTypes(component) {
  var userVals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var contextTypes = {
    "@@SQ_State": _propTypes2.default.object,
    "@@SQ_Target": _propTypes2.default.string
  };
  userVals.forEach(function (val) {
    return contextTypes[val] = _propTypes2.default.any;
  });
  component.contextTypes = contextTypes;
}

/**
 * If an item exists, extend it with the extras. Otherwise,
 * return the extras.
 * 
 * @param {Maybe Object} item   To be extended if it exists.
 * @param {Object}       extras Included in final result.
 * 
 * @return {Object} Either an extended object or the extras.
 */
function extendIfExists(item, extras) {
  return item ? (0, _utils.extend)(item, extras) : extras;
}

/**
 * Generates a component that subscribes to the state.
 * When the state updates, it adds receives an extra prop called
 * "state" with all of the state values in it.
 * 
 * @param {Component} component  A React component.
 * @param {Object}    settings   Describes how the component should work.
 * 
 * @return {Component}
 */
function robustifyComponent(component, settings) {
  var ruleCache = void 0;
  var stateCache = void 0;

  /*
   * Create a more robust React component that can handle
   * state subscriptions and context bindings.
   */

  var StateBinding = function (_ReactComponent) {
    _inherits(StateBinding, _ReactComponent);

    /**
     * @constructor
     * The component state will be used to track the global
     * state values. This will cause re-renders whenever
     * state changes occur.
     */
    function StateBinding() {
      _classCallCheck(this, StateBinding);

      var _this = _possibleConstructorReturn(this, (StateBinding.__proto__ || Object.getPrototypeOf(StateBinding)).call(this));

      _this.state = {};
      _this.watcher = function (newState) {
        _this.setState((0, _utils.extend)(_this.state, newState.get()));
      };

      /*
       * If we're getting rendered into the DOM, track
       * hash paths on the state. Whenever a hash path
       * changes, trap that so we can trigger a re-render.
       */
      if (settings.el && typeof window !== 'undefined') {
        _this.state.hash = (0, _decision.getLocationContext)().hash;
        window.addEventListener('hashchange', function () {
          _this.setState((0, _utils.extend)(_this.state, {
            "@@SQ_Hash": (0, _decision.getLocationContext)().hash
          }));
        });
      }

      return _this;
    }

    /**
     * Provide all child components with necessary context
     * properties.
     */


    _createClass(StateBinding, [{
      key: 'getChildContext',
      value: function getChildContext() {
        var childContext = void 0;

        /*
         * Ensure there is a state.
         */
        !stateCache && this.ensureState();

        /*
         * If our context is already marked as rendered and we have
         * an `el` property, throw an error.
         */
        if (this.context["@@SQ_Target"] && settings.el) {
          throw new Error('Component already lives in a rendered nesting.');
        }

        /*
         * Children should be given access to a state property
         * as well as a current hash and render target if we're rendering.
         */
        childContext = {
          "@@SQ_State": stateCache,
          "@@SQ_Target": this.context["@@SQ_Target"] || settings.el
        };

        /*
         * Dynamically add any extra context provided
         * by the user.
         */
        if (settings.childContext) {
          Object.assign(childContext, settings.childContext);
        }

        return childContext;
      }

      /**
       * Whenever this component is preparing to mount,
       * subscribe it to the state.
       */

    }, {
      key: 'componentWillMount',
      value: function componentWillMount() {
        this.ensureState();
        stateCache.watch(this.watcher);
      }

      /**
       * Whenever this component is preparing to be
       * removed, unsubscribe it from the state.
       */

    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        stateCache.unwatch(this.watcher);
      }

      /**
       * Guarantees that we have a state object to work with.
       * Order of priority will be:
       * - a pre-existing state we've already ensured exists
       * - a manually provided state
       * - an existing context state
       * - a new state we create
       */

    }, {
      key: 'ensureState',
      value: function ensureState() {
        stateCache = stateCache || settings.state || this.context["@@SQ_State"] || (0, _state.createState)({});
      }

      /**
       * Adds extra props as necessary to the child output.
       * Also ensures state exists and that any initial
       * state rule is automatically called.
       */

    }, {
      key: 'genProps',
      value: function genProps() {
        var newProps = {};

        /*
         * Make sure a state exists.
         */
        !stateCache && this.ensureState();

        /*
         * If we haven't cached rules yet, cache them
         * and execute the initial rule. If we have
         * a cache, pass that cache in as props.
         */
        if (settings.createRules) {
          if (!ruleCache) {
            ruleCache = settings.createRules(stateCache, _http2.default);
            ruleCache.initial && ruleCache.initial();
          }
          newProps.rules = extendIfExists(this.props.rules, ruleCache);
        }

        /*
         * Merge extra props with our natural props.
         */
        return (0, _utils.extend)(this.props, newProps);
      }

      /**
       * Render out the provided component.
       */

    }, {
      key: 'render',
      value: function render() {
        return React.createElement(component, this.genProps(), this.props.children);
      }
    }]);

    return StateBinding;
  }(_react.Component);

  /*
   * Make sure children of our component will have access to
   * the necessary context properties.
   */


  StateBinding.childContextTypes = {
    "@@SQ_State": _propTypes2.default.object,
    "@@SQ_Target": _propTypes2.default.string
  };

  /*
   * Dynamically add childContextTypes if the user
   * has specified a child context.
   */
  if (settings.childContext) {
    (0, _utils.forProps)(settings.childContext, function (item, name) {
      StateBinding.childContextTypes[name] = mapPropType(item);
    });
  }

  /*
   * Make sure our component has access to all of the
   * context properties it needs and return it.
   */
  attachContextTypes(StateBinding);
  return StateBinding;
}

/**
 * Generates handler functions and caches them.
 * 
 * @param {Object}   handlers     A package of handlers described by the user.
 * @param {Function} getProps     Retrieves component props.
 * @param {Function} getRefs      Retrieves a component's refs.
 * 
 * @return {undefined}
 */
function createHandlers(handlers, getProps, getRefs) {
  var out = {};
  var pack = function pack(evt) {
    return { evt: evt, props: getProps(), refs: getRefs() };
  };
  (0, _utils.forProps)(handlers, function (fn, name) {
    out[name] = function (evt) {
      return fn(pack(evt));
    };
    out[name].with = function () {
      for (var _len = arguments.length, extra = Array(_len), _key = 0; _key < _len; _key++) {
        extra[_key] = arguments[_key];
      }

      return function (evt) {
        return fn.apply(undefined, [pack(evt)].concat(extra));
      };
    };
  });
  return out;
}

/**
 * Generates real lifecycle methods from abstracted ones.
 * 
 * @param {Object} proto   A component prototype.
 * @param {Object} methods Abstracted methods.
 * 
 * @return {undefined}
 */
function buildLifecycle(proto, methods) {
  (0, _utils.forProps)(methods, function (method, name) {

    /*
     * This proxy function may take an additional argument, such as
     * prevState or nextProps. It then calls our user function with
     * either 2 or 3 arguments:
     * 1. props
     * 2. additional argument if it's truty or refs if not
     * 3. refs if the additional argument was truthy
     * It is not written in arrow notation because it needs
     * access to `this` component.
     */
    proto[LIFECYCLE_MAP[name]] = function (addtl) {
      var rest = [this.refs];
      addtl && rest.unshift(addtl);
      return method.apply(undefined, [this.genProps()].concat(rest));
    };
  });
}

/**
 * Generates a basic component.
 * 
 * @param {Object|Function} settings Describes how this component should work.
 * 
 * @return {Component}
 */
function createBasicComponent(settings) {
  var propCache = void 0;
  var helperCache = void 0;
  var expectedContext = void 0;
  var TypeChecker = void 0;

  /*
   * If the user provided a stateless component function, pass it
   * create a bare bones settings object out of it.
   */
  if (typeof settings === 'function') {
    settings = { render: settings };
  }

  /*
   * Because of the way we're generating new props, we'll need
   * a no-op component for proxying a proptype check.
   */
  if (settings.ensure) {
    TypeChecker = function TypeChecker() {};
    TypeChecker.displayName = ('\n      TypeChecker:' + (settings.name || settings.render.name || 'Component') + '\n    ').trim();
    TypeChecker.propTypes = settings.ensure(_propTypes2.default);
  }

  /*
   * Gather up the names of desired items to pull
   * from context.
   */
  if (settings.contextProps) {
    expectedContext = settings.contextProps;
  }

  /*
   * Generate the new React component.
   */

  var Component = function (_ReactComponent2) {
    _inherits(Component, _ReactComponent2);

    function Component() {
      _classCallCheck(this, Component);

      return _possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).apply(this, arguments));
    }

    _createClass(Component, [{
      key: 'genProps',


      /**
       * Infuses extra props such as state mappings into
       * the component's full collection of props.
       */
      value: function genProps() {
        var _this3 = this;

        var newProps = {};

        /*
         * Map state values to component props.
         */
        if (settings.observe) {
          var state = this.context['@@SQ_State'] || mockState();
          Object.assign(newProps, settings.observe(state.get()));
        }

        /*
         * If we haven't cached handlers yet, cache them
         * for later use. If we have a cache, pass that
         * cache in as props.
         */
        if (settings.handlers) {
          newProps.handlers = createHandlers(settings.handlers, function () {
            return _this3.genProps();
          }, function () {
            return _this3.refs;
          });
        }

        /*
         * If the user wants to manually add some helpers,
         * do that here and cache them.
         */
        if (settings.helpers) {
          helperCache = helperCache || settings.helpers;
          newProps.helpers = extendIfExists(this.props.helpers, helperCache);
        }

        /*
         * For any expected context values,
         * grab them and drop them in.
         */
        if (expectedContext) {
          expectedContext.forEach(function (name) {
            newProps[name] = _this3.context[name];
          });
        }

        /*
         * Merge the inherited props and the new props.
         */
        return (0, _utils.extend)(this.props, newProps);
      }

      /**
       * Renders the component's output.
       * If we have a proxy component, instantiate it for type checking.
       */

    }, {
      key: 'render',
      value: function render() {
        var props = this.genProps();
        TypeChecker && React.createElement(TypeChecker, props);
        return (settings.render || noop)(this.genProps());
      }
    }], [{
      key: 'name',


      /**
       * Determines how to retrieve the component's name so
       * that it shows up properly in dev tools and such.
       */
      get: function get() {
        return settings.name || settings.render.name || 'Component';
      }
    }]);

    return Component;
  }(_react.Component);

  /*
   * If we have any lifecycle methods, add them to the
   * component.
   */


  if (settings.createLifecycle) {
    var lifecycle = settings.createLifecycle();
    buildLifecycle(Component.prototype, lifecycle || {});
  }

  /*
   * Make sure our component has access to all of the
   * context properties it needs and return it.
   */
  Component.displayName = Component.name;
  attachContextTypes(Component, expectedContext);
  return Component;
}

/**
 * Allow users to generate components.
 * 
 * @param {Object|Function} settings  Describes how the component should work.
 * 
 * @return {Component}
 */
function component(settings) {
  var Component = createBasicComponent(settings);

  /*
   * A state must exist if we want to render this component, if
   * it wants to use a manually-named state, or if it wants to
   * create state transformation rules. In that case, we'll
   * robustify this component by subscribing it to a state.
   */
  if (settings.el || settings.state || settings.createRules || settings.childContext) {
    Component = robustifyComponent(Component, settings);
  }

  /*
   * If we want to render this state and the window object exists,
   * go ahead and render it into the named root.
   */
  if (settings.el && typeof window !== 'undefined') {
    _reactDom2.default.render(React.createElement(Component, null), document.querySelector(settings.el));
  }

  return Component;
}

exports.default = component;