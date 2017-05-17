'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Switch = exports.Otherwise = exports.When = exports.Redirect = undefined;

var _utils = require('./utils');

var _routing = require('./routing');

var _component = require('./component');

var NON_NATIVE_PROPS = ['location', '__dataSymbol'];

/**
 * A component for redirecting our path.
 */
var Redirect = exports.Redirect = (0, _component.component)(function () {
  return function (props) {
    if (!props.to) {
      _utils.win.location.href = '/';
    } else if (props.to[0] === '#') {
      _utils.win.location.hash = props.to;
    } else {
      _utils.win.location.href = props.to;
    }
    return null;
  };
});

/**
 * A component for rendering children under some condition.
 */
var When = exports.When = (0, _component.component)(function () {
  return function (props) {

    /*
     * Throw an error if props are malformed.
     */
    var vetted = props.preVet || (0, _routing.vetProps)(props);

    /*
     * If the props didn't resolve in a way that would allow
     * rendering children, don't render any.
     */
    if (!vetted.resolves) {
      return null;

      /*
       * If we had a successful resolution...
       */
    } else {

      /*
       * If we have actual children. Render out the child.
       */
      if (vetted.hasChildren) {
        var childIsNativeDom = typeof props.children.type === 'string' && /^[a-z]/.test(props.children.type);
        var propsToRemove = ['component', 'preVet'].concat(vetted.exclusives);

        if (childIsNativeDom) {
          propsToRemove = propsToRemove.concat(NON_NATIVE_PROPS);
        }

        return React.cloneElement(props.children, (0, _utils.removeProps)(props, propsToRemove), props.children.props.children);

        /*
         * Othwerwise, render an instance of the component named in the
         * `component` prop.
         */
      } else {
        return !props.component ? null : React.createElement(props.component, (0, _utils.removeProps)(props, ['component', 'preVet'].concat(vetted.exclusives)), props.children);
      }
    }
  };
});

/**
 * A wrapper over the `When` component that always tests truthily.
 * It can only be instantiated as the child of a `Switch` instance.
 *
 * @param {Object} props The component props.
 */
var Otherwise = exports.Otherwise = (0, _component.component)(function () {
  return function (props) {
    if (!props.preVet) {
      throw (0, _utils.createError)('\n          The `Otherwise` component can only be used as a child of the\n          `Switch` component. Otherwise it\'s redundant.\n        ');
    } else {
      var cleanProps = (0, _utils.removeProps)(props, props.preVet.exclusives);
      var newProps = Object.assign({}, cleanProps, { isTrue: true });
      return React.createElement(When, newProps, props.children);
    }
  };
});

/**
 * Expects each child to be an instance of `When` or `Otherwise`. Selects the first truthy
 * child and renders that one.
 *
 * @param {Object} props The component props.
 */
var Switch = exports.Switch = (0, _component.component)(function () {
  return function (props) {
    var chosen = null;
    var vetting = void 0;

    /*
     * Loop over the children and vet their props. Capture the first
     * one that successfully vets.
     */
    (0, _routing.arrayifyChildren)(props.children).some(function (child) {
      var vetted = (0, _routing.vetProps)(child.props, child.type === Otherwise);
      if (vetted.resolves) {
        chosen = child;
        vetting = vetted;
        return true;
      }
    });

    /*
     * Return a clone of the element so we don't need to vet it again.
     */
    return !chosen ? null : React.cloneElement(chosen, Object.assign({}, chosen.props, { preVet: vetting }), chosen.props.children);
  };
});