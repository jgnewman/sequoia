'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteData = exports.postData = exports.patchData = exports.getData = exports.dataRequest = exports.getConstantName = exports.createConstant = exports.constants = exports.render = exports.component = exports.reduce = exports.collect = exports.uuid = undefined;

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

var _store = require('./store');

Object.defineProperty(exports, 'reduce', {
  enumerable: true,
  get: function get() {
    return _store.reduce;
  }
});

var _component = require('./component');

Object.defineProperty(exports, 'component', {
  enumerable: true,
  get: function get() {
    return _component.component;
  }
});
Object.defineProperty(exports, 'render', {
  enumerable: true,
  get: function get() {
    return _component.render;
  }
});

var _constants = require('./constants');

Object.defineProperty(exports, 'constants', {
  enumerable: true,
  get: function get() {
    return _constants.constants;
  }
});
Object.defineProperty(exports, 'createConstant', {
  enumerable: true,
  get: function get() {
    return _constants.createConstant;
  }
});
Object.defineProperty(exports, 'getConstantName', {
  enumerable: true,
  get: function get() {
    return _constants.getConstantName;
  }
});

var _data = require('./data');

Object.defineProperty(exports, 'dataRequest', {
  enumerable: true,
  get: function get() {
    return _data.dataRequest;
  }
});
Object.defineProperty(exports, 'getData', {
  enumerable: true,
  get: function get() {
    return _data.getData;
  }
});
Object.defineProperty(exports, 'patchData', {
  enumerable: true,
  get: function get() {
    return _data.patchData;
  }
});
Object.defineProperty(exports, 'postData', {
  enumerable: true,
  get: function get() {
    return _data.postData;
  }
});
Object.defineProperty(exports, 'deleteData', {
  enumerable: true,
  get: function get() {
    return _data.deleteData;
  }
});

var _queriable = require('./queriable');

var _queriable2 = _interopRequireDefault(_queriable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.collect = _queriable2.default;

/*
 * Direct exports
 */


/*
 * Import-then-exports
 */