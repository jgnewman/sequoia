'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _premade = require('./premade');

Object.keys(_premade).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _premade[key];
    }
  });
});

var _utils = require('./utils');

Object.defineProperty(exports, 'merge', {
  enumerable: true,
  get: function get() {
    return _utils.merge;
  }
});

var _collect = require('./collect');

Object.defineProperty(exports, 'collect', {
  enumerable: true,
  get: function get() {
    return _collect.collect;
  }
});

var _component = require('./component');

Object.defineProperty(exports, 'component', {
  enumerable: true,
  get: function get() {
    return _component.component;
  }
});

var _application = require('./application');

Object.defineProperty(exports, 'application', {
  enumerable: true,
  get: function get() {
    return _application.application;
  }
});

var _constants = require('./constants');

Object.defineProperty(exports, 'constants', {
  enumerable: true,
  get: function get() {
    return _constants.constants;
  }
});
Object.defineProperty(exports, 'uuid', {
  enumerable: true,
  get: function get() {
    return _constants.uuid;
  }
});