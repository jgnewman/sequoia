'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utils = require('./utils');

var _collect = require('./collect');

var _component = require('./component');

var _application = require('./application');

var _constants = require('./constants');

var _premade = require('./premade');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Package up our exports
 */
var exp = {

  /*
   * Functions
   */
  application: _application.application,
  collect: _collect.collect,
  component: _component.component,
  constants: _constants.constants,
  createElement: _react2.default.createElement,
  merge: _utils.merge,
  uuid: _constants.uuid,

  /*
   * Pre-made components
   */
  Otherwise: _premade.Otherwise,
  Redirect: _premade.Redirect,
  Switch: _premade.Switch,
  When: _premade.When
};

/*
 * Export for Node and the browser.
 */
if (typeof window !== 'undefined') {
  window.Sequoia = exp;
}

if (typeof module !== 'undefined' || typeof exports !== 'undefined') {
  module.exports = exports = exp;
}