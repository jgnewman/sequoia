'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Names all the axios methods we will proxy to.
 */
var methods = ['request', 'get', 'delete', 'head', 'options', 'post', 'put', 'patch'];

/*
 * The object we'll use to store our methods.
 * This will end up being exported.
 */
var http = {};

/*
 * Loop over all of our axios methods and populate the
 * http object with proxy methods.
 */
methods.forEach(function (methodName) {
  http[methodName] = function () {
    return _axios2.default[methodName].apply(_axios2.default, arguments);
  };
});

/*
 * Export the http object
 */
exports.default = http;