'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = queriable;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var secretKey = Symbol();

/**
 * Determines whether an item is a match for a collection
 * of query options.
 *
 * @param  {Object}  item     The item in question.
 * @param  {Object}  options  The query options.
 * @param  {Array}   keys     A pre-collect list of options keys.
 *
 * @return {Boolean} Whether or not the item matches.
 */
function isMatch(item, options, keys) {
  var itemMatches = true;
  keys.some(function (key) {
    if (item[key] !== options[key]) {
      itemMatches = false;
      return true;
    }
  });
  return itemMatches;
}

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
    if (isMatch(item, options, keys)) {
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
   * NOTE: Returns a NEW array.
   *
   * @param  {Number|Symbol} index  The index of the item to get.
   *                                If `secretKey`, returns the original array.
   *
   * @return {Any} The retrieved item.
   */


  _createClass(Queriable, [{
    key: 'get',
    value: function get(index) {
      var arr = this.__getArray(secretKey);
      if (index === secretKey) {
        return arr;
      } else {
        return index === undefined ? arr.slice() : arr[index];
      }
    }

    /**
     * Get the original array used for the queriable.
     *
     * @return {Array} The original array.
     */

  }, {
    key: 'getOriginal',
    value: function getOriginal() {
      return this.get(secretKey);
    }

    /**
     * Queries an array of objects.
     *
     * @param  {Object} options  Properties to match on each object.
     *
     * @return {Any} The index of the first match.
     */

  }, {
    key: 'getIndexWhere',
    value: function getIndexWhere(options) {
      return findMatchFor(options, this.get(secretKey)).index;
    }

    /**
     * Queries an array of objects.
     *
     * @param  {Object} options  Properties to match on each object.
     *
     * @return {Any} The first match.
     */

  }, {
    key: 'getOneWhere',
    value: function getOneWhere(options) {
      return findMatchFor(options, this.get(secretKey)).item;
    }

    /**
     * Queries an array of objects.
     *
     * @param  {Object} options  Properties to match on each object.
     *
     * @return {Array} Contains all the matching objects.
     */

  }, {
    key: 'getAllWhere',
    value: function getAllWhere(options) {
      var keys = Object.keys(options);
      return this.get(secretKey).filter(function (item) {
        return isMatch(item, options, keys);
      });
    }

    /**
     * Updates matches in an array of objects.
     * NOTE: Returns a NEW array.
     *
     * @param  {Object|Symbol}   options  Properties to match on each object.
     *                                    If `secretKey`, we'll automatch every item.
     * @param  {Object|Function} updates  The updates to make to matching objects.
     *                                    If a function, takes the item to update.
     *                                    Should return a new version of the item.
     *
     * @return {Array} Contains all the objects; contains the updates.
     */

  }, {
    key: 'updateAllWhere',
    value: function updateAllWhere(options, updates) {
      var optionKeys = Object.keys(options);
      var updatesIsFn = typeof updates === 'function';
      var updateKeys = updatesIsFn ? null : Object.keys(updates);

      return this.get(secretKey).map(function (item) {
        if (options === secretKey || isMatch(item, options, optionKeys)) {
          if (updatesIsFn) {
            return updates(item);
          } else {
            updateKeys.forEach(function (key) {
              item[key] = updates[key];
            });
          }
        }
        return item;
      });
    }

    /**
     * Find a single item matching the options and update it
     * then return a new array containing the updates.
     *
     * @param  {Object} options           Properties to match against.
     * @param  {Object|Function} updates  The updates to make to matching objects.
     *                                    If a function, takes the item to update.
     *                                    Should return a new version of the item.
     *
     * @return {Array} Contains all the objects; contains the updates.
     */

  }, {
    key: 'updateOneWhere',
    value: function updateOneWhere(options, updates) {
      var found = findMatchFor(options, this.get(secretKey));
      var updatesIsFn = typeof updates === 'function';
      var arrCopy = this.get();

      if (found.index === -1) {
        return arrCopy;
      } else {
        var item = found.item;
        var index = found.index;

        if (updatesIsFn) {
          item = updates(item);
        } else {
          Object.keys(updates).forEach(function (key) {
            item[key] = updates[key];
          });
        }

        arrCopy[index] = item;
        return arrCopy;
      }
    }

    /**
     * Allows updating all items in the array.
     * NOTE: Returns a NEW array.
     *
     * @param  {Object|Function} updates  The updates to make to matching objects.
     *                                    If a function, takes the item to update.
     *                                    Should return a new version of the item.
     *
     * @return {Array} Contains all of the updates.
     */

  }, {
    key: 'updateAll',
    value: function updateAll(updates) {
      return this.updateAllWhere(secretKey, updates);
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
    key: 'subtract',
    value: function subtract(index) {
      var arr = this.get(secretKey).slice();
      arr.splice(index, 1);
      return arr;
    }

    /**
     * Remove all items from the array that match the query and
     * return a new array.
     *
     * @param  {Object} options Properties to match on each object.
     *
     * @return {Array} A new array where an item has been removed.
     */

  }, {
    key: 'subtractAllWhere',
    value: function subtractAllWhere(options) {
      var keys = Object.keys(options);
      return this.get(secretKey).filter(function (item) {
        if (isMatch(item, options, keys)) {
          return false;
        }
        return true;
      });
    }

    /**
     * Remove the first item from the array that matches the query and
     * return a new array.
     *
     * @param  {Object} options Properties to match on each object.
     *
     * @return {Array} A new array where an item has been removed.
     */

  }, {
    key: 'subtractOneWhere',
    value: function subtractOneWhere(options) {
      var found = findMatchFor(options, this.get(secretKey));
      var arrCopy = this.get();
      if (found.index > -1) {
        arrCopy.splice(found.index, 1);
      }
      return arrCopy;
    }

    /**
     * Count the amount of items in the array.
     *
     * @return {Number} The number of items in the array.
     */

  }, {
    key: 'count',
    value: function count() {
      return this.get(secretKey).length;
    }

    /**
     * Count the amount of items that match the provided options.
     *
     * @return {Number} The number of matches.
     */

  }, {
    key: 'countAllWhere',
    value: function countAllWhere(options) {
      return this.getAllWhere(options).length;
    }

    /**
     * Get the first item in the array.
     */

  }, {
    key: 'first',
    value: function first() {
      return this.get(secretKey)[0];
    }

    /**
     * Get ALL BUT the first item in the array.
     */

  }, {
    key: 'rest',
    value: function rest() {
      var arr = this.get(secretKey);
      return arr.slice(1);
    }

    /**
     * Get the last item in the array.
     */

  }, {
    key: 'last',
    value: function last() {
      var arr = this.get(secretKey);
      return arr[arr.length - 1];
    }

    /**
     * Get ALL BUT the last item in the array.
     */

  }, {
    key: 'lead',
    value: function lead() {
      var arr = this.get(secretKey);
      return arr.slice(0, arr.length - 1);
    }

    /**
     * Get a random item in the array.
     */

  }, {
    key: 'random',
    value: function random() {
      var arr = this.get(secretKey);
      return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Add a new item to the front of the array.
     * NOTE: Returns a NEW array.
     *
     * @param  {Object} item  To be added.
     *
     * @return {Array} Includees the new item.
     */

  }, {
    key: 'prepend',
    value: function prepend(item) {
      var arr = this.get(secretKey).slice();
      arr.unshift(item);
      return arr;
    }

    /**
     * Add a new item to the back of the array.
     * NOTE: Returns a NEW array.
     *
     * @param  {Object} item  To be added.
     *
     * @return {Array} Includees the new item.
     */

  }, {
    key: 'append',
    value: function append(item) {
      var arr = this.get(secretKey).slice();
      arr.push(item);
      return arr;
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