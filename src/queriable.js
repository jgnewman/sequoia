const secretKey = Symbol();

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
  let itemMatches = true;
  keys.some(key => {
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
function findMatchFor(options={}, inArray=[]) {
  let match = {item: undefined, index: -1};
  const keys = Object.keys(options);
  inArray.some((item, index) => {
    if (isMatch(item, options, keys)) {
      match = {item: item, index: index};
      return true;
    }
  })
  return match;
}

/*
 * Wraps an array and provides useful methods for working with it.
 */
class Queriable {

  constructor(array) {
    this.__getArray = key => key === secretKey ? array || [] : null;
  }

  /**
   * Get an item from the array or the whole array.
   *
   * @param  {Number} index  The index of the item to get.
   *
   * @return {Any} The retrieved item.
   */
  get(index) {
    const arr = this.__getArray(secretKey);
    return index === undefined ? arr : arr[index];
  }

  /**
   * Queries an array of objects.
   *
   * @param  {Object} options  Properties to match on each object.
   *
   * @return {Any} The index of the first match.
   */
  getIndexWhere(options) {
    return findMatchFor(options, this.get()).index;
  }

  /**
   * Queries an array of objects.
   *
   * @param  {Object} options  Properties to match on each object.
   *
   * @return {Any} The first match.
   */
  getOneWhere(options) {
    return findMatchFor(options, this.get()).item;
  }

  /**
   * Queries an array of objects.
   *
   * @param  {Object} options  Properties to match on each object.
   *
   * @return {Array} Contains all the matching objects.
   */
  getAllWhere(options) {
    const keys = Object.keys(options);
    return this.get().filter(item => {
      return isMatch(item, options, keys);
    })
  }

  /**
   * Updates matches in an array of objects.
   * NOTE: Returns a NEW array.
   *
   * @param  {Object} options  Properties to match on each object.
   * @param  {Object} updates  The updates to make to matching objects.
   *
   * @return {Array} Contains all the objects; contains the updates.
   */
  updateWhere(options, updates) {
    const optionKeys = Object.keys(options);
    const updateKeys = Object.keys(updates);

    return this.get().map(item => {
      if (isMatch(item, options, optionKeys)) {
        updateKeys.forEach(key => {
          item[key] = updates[key];
        });
      }
      return item;
    })
  }

  /**
   * Remove an item from the array at a particular index and
   * return a new array.
   *
   * @param  {Number} index The index of the item to remove.
   *
   * @return {Array} A new array where an item has been removed.
   */
  subtract(index) {
    const arr = this.get().slice();
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
  subtractWhere(options) {
    const keys = Object.keys(options);
    return this.get().filter(item => {
      if (isMatch(item, options, keys)) {
        return false;
      }
      return true;
    })
  }

  /**
   * Count the amount of items in the array.
   *
   * @return {Number} The number of items in the array.
   */
  count() {
    return this.get().length;
  }

  /**
   * Count the amount of items that match the provided options.
   *
   * @return {Number} The number of matches.
   */
  countWhere(options) {
    return this.getAllWhere(options).length;
  }

  /**
   * Get the first item in the array.
   */
  first() {
    return this.get()[0];
  }

  /**
   * Get ALL BUT the first item in the array.
   */
  rest() {
    const arr = this.get();
    return arr.slice(1);
  }

  /**
   * Get the last item in the array.
   */
  last() {
    const arr = this.get();
    return arr[arr.length - 1];
  }

  /**
   * Get ALL BUT the last item in the array.
   */
  lead() {
    const arr = this.get();
    return arr.slice(0, arr.length - 1);
  }

  /**
   * Get a random item in the array.
   */
  random() {
    const arr = this.get();
    return arr[Math.floor(Math.random() * arr.length)];
  }

}

/**
 * Expose the queriable class in the form of a function.
 *
 * @param  {Array} array  Should be populated with objects.
 *
 * @return {Queriable}
 */
export default function queriable(array) {
  return new Queriable(array);
}
