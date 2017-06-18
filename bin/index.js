'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _utils = require('./utils');

var _state = require('./state');

var _decision = require('./decision');

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _collect = require('./collect');

var _collect2 = _interopRequireDefault(_collect);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _premade = require('./premade');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getHttpApi() {
  return _http2.default;
}

/*
 * Make sure the React global exists.
 */
global.React = _react2.default;

/*
 * Package up our exports
 */
var exp = {
  extend: _utils.extend,
  uuid: _uuid2.default,
  createState: _state.createState,
  enableDevMode: _state.enableDevMode,
  disableDevMode: _state.disableDevMode,
  component: _component2.default,
  collect: _collect2.default,
  pick: _decision.pick,
  when: _decision.when,
  setLocationContext: _decision.setLocationContext,
  Preload: _premade.Preload,
  createElement: _react2.default.createElement,
  cloneElement: _react2.default.cloneElement,
  getHttpApi: getHttpApi
};

/*
 * Export for Node and the browser.
 */
if (typeof window !== 'undefined') {
  window.Sequoia = exp;
  window.React = _react2.default;
}

if (typeof module !== 'undefined') {
  module.exports = exports = exp;
}