'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _uuid = require('uuid');

Object.defineProperty(exports, 'uuid', {
  enumerable: true,
  get: function get() {
    return _uuid.v4;
  }
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

var _collect = require('./collect');

Object.defineProperty(exports, 'collect', {
  enumerable: true,
  get: function get() {
    return _collect.collect;
  }
});

var _constants = require('./constants');

Object.defineProperty(exports, 'constants', {
  enumerable: true,
  get: function get() {
    return _constants.constants;
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