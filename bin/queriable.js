"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = queriable;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var secretKey = Symbol();

/**
 * Loop over an array of objects and return the first one
 * that matches the options.
 *
 * @param  {Object} options  Values to match on an array object.
 * @param  {Array}  inArray  Should be populated with objects.
 *
 * @return {Object} Should contain item and index.
 */
function findMatchFor() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var inArray = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var match = { item: undefined, index: -1 };
  var keys = Object.keys(options);
  inArray.some(function (item, index) {
    var itemMatches = true;
    keys.some(function (key) {
      if (item[key] !== options[key]) {
        itemMatches = false;
        return true;
      }
    });
    if (itemMatches) {
      match = { item: item, index: index };
      return true;
    }
  });
  return match;
}

/*
 * Wraps an array and provides useful methods for working with it.
 */

var Queriable = function () {
  function Queriable(array) {
    _classCallCheck(this, Queriable);

    this.__getArray = function (key) {
      return key === secretKey ? array || [] : null;
    };
  }

  /**
   * Get an item from the array or the whole array.
   *
   * @param  {Number} index  The index of the item to get.
   *
   * @return {Any} The retrieved item.
   */


  _createClass(Queriable, [{
    key: "get",
    value: function get(index) {
      var arr = this.__getArray(secretKey);
      return index === undefined ? arr : arr[index];
    }

    /**
     * Queries an array of objects.
     *
     * @param  {Object} options  Properties to match on each object.
     *
     * @return {Any} The index of the first match.
     */

  }, {
    key: "getIndexWhere",
    value: function getIndexWhere(options) {
      return findMatchFor(options, this.get()).index;
    }

    /**
     * Queries an array of objects.
     *
     * @param  {Object} options  Properties to match on each object.
     *
     * @return {Any} The first match.
     */

  }, {
    key: "getOneWhere",
    value: function getOneWhere(options) {
      return findMatchFor(options, this.get()).item;
    }

    /**
     * Queries an array of objects.
     *
     * @param  {Object} options  Properties to match on each object.
     *
     * @return {Array} Contains all the matching objects.
     */

  }, {
    key: "getAllWhere",
    value: function getAllWhere(options) {
      var keys = Object.keys(options);
      return this.get().filter(function (item) {
        var match = true;
        keys.some(function (key) {
          if (item[key] !== options[key]) {
            match = false;
            return true;
          }
        });
        return match;
      });
    }

    /**
     * Remove an item from the array at a particular index and
     * return a new array.
     *
     * @param  {Number} index The index of the item to remove.
     *
     * @return {Array} A new array where an item has been removed.
     */

  }, {
    key: "subtract",
    value: function subtract(index) {
      var arr = this.get().slice();
      arr.splice(index, 1);
      return arr;
    }

    /**
     * Count the amount of items in the array.
     *
     * @return {Number} The number of items in the array.
     */

  }, {
    key: "count",
    value: function count() {
      return this.get().length;
    }

    /**
     * Get the first item in the array.
     */

  }, {
    key: "first",
    value: function first() {
      return this.get()[0];
    }

    /**
     * Get ALL BUT the first item in the array.
     */

  }, {
    key: "rest",
    value: function rest() {
      var arr = this.get();
      return arr.slice(1);
    }

    /**
     * Get the last item in the array.
     */

  }, {
    key: "last",
    value: function last() {
      var arr = this.get();
      return arr[arr.length - 1];
    }

    /**
     * Get ALL BUT the last item in the array.
     */

  }, {
    key: "lead",
    value: function lead() {
      var arr = this.get();
      return arr.slice(0, arr.length - 1);
    }

    /**
     * Get a random item in the array.
     */

  }, {
    key: "random",
    value: function random() {
      var arr = this.get();
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }]);

  return Queriable;
}();

/**
 * Expose the queriable class in the form of a function.
 *
 * @param  {Array} array  Should be populated with objects.
 *
 * @return {Queriable}
 */


function queriable(array) {
  return new Queriable(array);
}