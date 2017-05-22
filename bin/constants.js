'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uuid = undefined;
exports.constants = constants;

var _utils = require('./utils');

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registry = {};

/**
 * Allow users to create and reference constants.
 *
 * Constants are accessible in the form of functions that always
 * return the same symbol. This way you get an error in the console
 * if you make a mistake.
 *
 * @param  {String} name The name of the new constant.
 *
 * @return {Symbol} The symbol for the new constant.
 */
function constants(name) {

  if (!arguments.length) {
    name = (0, _uuid2.default)();
  }

  if (typeof name !== 'string') {
    throw (0, _utils.createError)('Constants must be built from strings.');
  }

  if (typeof constants[name] === 'function') {
    throw (0, _utils.createError)('A constant named ' + name + ' already exists.');
  }

  registry[name] = Symbol();
  constants[name] = function () {
    return registry[name];
  };
  return registry[name];
}

exports.uuid = _uuid2.default;