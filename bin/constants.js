'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constants = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.createConstantsFromArray = createConstantsFromArray;
exports.createConstant = createConstant;
exports.getConstantName = getConstantName;

var _utils = require('./utils');

/*
 * A place to hold all of our constants.
 */
var constants = {};
var nameMap = {};

/**
 * Creates a new property in the constants registry whose value is a unique symbol.
 *
 * @param {String} name  The new property name.
 *
 * @return {undefined}
 */
function setConstant(name) {
  if (constants[name]) {

    throw (0, _utils.createError)('\n        Could not create constant `' + name + '` because a constant with the same\n        name already exists.\n      ');
  } else if (typeof name !== 'string') {

    throw (0, _utils.createError)('\n        Could not create constant `' + name + '` because it is of type ' + (typeof name === 'undefined' ? 'undefined' : _typeof(name)) + '\n        and constants must all be created from strings.\n      ');
  } else {

    var nameSymbol = Symbol();
    constants[name] = function () {
      return nameSymbol;
    };
    nameMap[nameSymbol] = name;
    return nameSymbol;
  }
}

/**
 * Loop over an array and create a constant for each one.
 *
 * @param  {Array} namesArray  Contains all the names for new constants.
 *
 * @return {undefined}
 */
function createConstantsFromArray(namesArray) {
  namesArray.forEach(function (name) {
    return setConstant(name);
  });
}

/**
 * Create a single constant and return its actual symbol.
 *
 * @param  {String} name The name of the constant.
 *
 * @return {Symbol} The actual constant.
 */
function createConstant(name) {
  return setConstant(name);
}

/**
 * Retrieve the serializable name of a constant.
 *
 * @param  {Symbol} constant The constant itself.
 *
 * @return {String} The name of the constant.
 */
function getConstantName(constant) {
  return nameMap[constant];
}

/*
 * Export the constants registry.
 */
exports.constants = constants;