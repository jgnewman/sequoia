const SECRETKEY = Symbol();

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
    this.__getArray = key => key === SECRETKEY ? array || [] : null;
  }

  /**
   * Get an item from the array or the whole array.
   * NOTE: Returns a NEW array.
   *
   * @param  {Number|Symbol} index  The index of the item to get.
   *                                If `SECRETKEY`, returns the original array.
   *
   * @return {Any} The retrieved item.
   */
  get(index) {
    const arr = this.__getArray(SECRETKEY);
    if (index === SECRETKEY) {
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
  getOriginal() {
    return this.get(SECRETKEY);
  }

  /**
   * Queries an array of objects.
   *
   * @param  {Object} options  Properties to match on each object.
   *
   * @return {Any} The index of the first match.
   */
  getIndexWhere(options) {
    return findMatchFor(options, this.get(SECRETKEY)).index;
  }

  /**
   * Queries an array of objects.
   *
   * @param  {Object} options  Properties to match on each object.
   *
   * @return {Any} The first match.
   */
  getOneWhere(options) {
    return findMatchFor(options, this.get(SECRETKEY)).item;
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
    return this.get(SECRETKEY).filter(item => {
      return isMatch(item, options, keys);
    })
  }

  /**
   * Updates matches in an array of objects.
   * NOTE: Returns a NEW array.
   *
   * @param  {Object|Symbol}   options  Properties to match on each object.
   *                                    If `SECRETKEY`, we'll automatch every item.
   * @param  {Object|Function} updates  The updates to make to matching objects.
   *                                    If a function, takes the item to update.
   *                                    Should return a new version of the item.
   *
   * @return {Array} Contains all the objects; contains the updates.
   */
  updateAllWhere(options, updates) {
    const optionKeys  = Object.keys(options);
    const updatesIsFn = typeof updates === 'function';
    const updateKeys  = updatesIsFn ? null : Object.keys(updates);

    return this.get(SECRETKEY).map(item => {
      if (options === SECRETKEY || isMatch(item, options, optionKeys)) {
        if (updatesIsFn) {
          return updates(item);
        } else {
          updateKeys.forEach(key => {
            item[key] = updates[key];
          });
        }
      }
      return item;
    })
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
  updateOneWhere(options, updates) {
    const found = findMatchFor(options, this.get(SECRETKEY));
    const updatesIsFn = typeof updates === 'function';
    const arrCopy = this.get();

    if (found.index === -1) {
      return arrCopy;
    } else {
      let item = found.item;
      const index = found.index;

      if (updatesIsFn) {
        item = updates(item);
      } else {
        Object.keys(updates).forEach(key => {
          item[key] = updates[key];
        })
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
  updateAll(updates) {
    return this.updateAllWhere(SECRETKEY, updates);
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
    const arr = this.get(SECRETKEY).slice();
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
  subtractAllWhere(options) {
    const keys = Object.keys(options);
    return this.get(SECRETKEY).filter(item => {
      if (isMatch(item, options, keys)) {
        return false;
      }
      return true;
    })
  }

  /**
   * Remove the first item from the array that matches the query and
   * return a new array.
   *
   * @param  {Object} options Properties to match on each object.
   *
   * @return {Array} A new array where an item has been removed.
   */
  subtractOneWhere(options) {
    const found = findMatchFor(options, this.get(SECRETKEY));
    const arrCopy = this.get();
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
  count() {
    return this.get(SECRETKEY).length;
  }

  /**
   * Count the amount of items that match the provided options.
   *
   * @return {Number} The number of matches.
   */
  countAllWhere(options) {
    return this.getAllWhere(options).length;
  }

  /**
   * Get the first item in the array.
   */
  first() {
    return this.get(SECRETKEY)[0];
  }

  /**
   * Get ALL BUT the first item in the array.
   */
  rest() {
    const arr = this.get(SECRETKEY);
    return arr.slice(1);
  }

  /**
   * Get the last item in the array.
   */
  last() {
    const arr = this.get(SECRETKEY);
    return arr[arr.length - 1];
  }

  /**
   * Get ALL BUT the last item in the array.
   */
  lead() {
    const arr = this.get(SECRETKEY);
    return arr.slice(0, arr.length - 1);
  }

  /**
   * Get a random item in the array.
   */
  random() {
    const arr = this.get(SECRETKEY);
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
  prepend(item) {
    const arr = this.get(SECRETKEY).slice();
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
  append(item) {
    const arr = this.get(SECRETKEY).slice();
    arr.push(item);
    return arr;
  }

}

/**
 * Expose the queriable class in the form of a function.
 *
 * @param  {Array} array  Should be populated with objects.
 *
 * @return {Queriable}
 */
export function collect(array) {
  return new Queriable(array);
}
