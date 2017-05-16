'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataAPI = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createRestfulAction = createRestfulAction;
exports.createRestReducer = createRestReducer;
exports.dataRequest = dataRequest;
exports.getData = getData;
exports.patchData = patchData;
exports.postData = postData;
exports.putData = putData;
exports.deleteData = deleteData;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var STATEKEY = Symbol();

/**
 * Triggers a call through axios associated with a property on the
 * state. That property will be an object tracking the individual
 * sub state of the request.
 *
 * @param  {Object}   settings   Determines how to perform the request. Especially...
 *                               - id: The name of the state property.
 * @param  {Object}   extras     Contains extra actions to run when the request finishes.
 * @param  {Function} dispatch   Redux's dispatch function.
 *
 * @return {undefined}
 */
function performRestfulAction(settings, extras, dispatch) {
  (0, _axios2.default)(settings)

  /*
   * When the request is successful, mark that in the state along with
   * the data. If there are any `ok` functions, fire them all.
   */
  .then(function (result) {
    dispatch({
      type: _utils.internals.DATA_TO_SUCCESS,
      payload: {
        id: settings.id,
        status: result.status,
        data: result.data
      }
    });
    extras.success.forEach(function (fn) {
      return fn(dispatch, result.data, result);
    });
    return result;
  })

  /*
   * When the request errors, mark that in the state and store the
   * error message. Fire any `notOk` functions.
   */
  .catch(function (err) {
    var response = err.response || {};
    dispatch({
      type: _utils.internals.DATA_TO_ERROR,
      payload: {
        id: settings.id,
        status: response.status,
        errorMessage: err.message
      }
    });
    extras.fail.forEach(function (fn) {
      return fn(dispatch, err);
    });
  });

  /*
   * As the request is being made, mark it as pending.
   */
  dispatch({
    type: _utils.internals.DATA_TO_PENDING,
    payload: {
      id: settings.id
    }
  });
}

/**
 * Generates a thunk action for performing a restful transaction.
 *
 * @param  {Object} settings  Determines how to perform the request.
 *
 * @return {Function} A thunk action.
 */
function createRestfulAction(settings) {
  var extras = { success: [], fail: [] };

  /*
   * Create an action thunk.
   */
  var thunk = function thunk(dispatch) {
    return performRestfulAction(settings, extras, dispatch);
  };

  /*
   * Attach a function to the action thunk that allows you to run
   * more actions on success.
   */
  thunk.ok = function (fn) {
    extras.success.push(fn);
    return thunk;
  };

  /*
   * Attach a function to the action thunk that allows you to
   * run more actions on fail.
   */
  thunk.notOk = function (fn) {
    extras.fail.push(fn);
    return thunk;
  };

  return thunk;
}

/**
 * Normalizes state reductions for REST actions.
 *
 * @param  {Object} state   A portion of the state.
 * @param  {Object} action  Contains type and payload.
 *
 * @return {Object} The reduced state
 */
function createRestReducer(initialState) {
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState[_utils.internals.DATA];
    var action = arguments[1];


    var id = action.payload ? action.payload.id : null;
    var newState = {};

    switch (action.type) {

      case _utils.internals.DATA_TO_DEFAULT:
        newState[id] = {
          ok: false,
          status: null,
          errorMessage: null,
          data: null,
          pending: false
        };
        return Object.assign({}, state, newState);

      case _utils.internals.DATA_TO_PENDING:
        var prevState = state[id] || {};
        newState[id] = {
          ok: false,
          status: prevState.status || null,
          errorMessage: prevState.errorMessage || null,
          data: prevState.data || null,
          pending: true
        };
        return Object.assign({}, state, newState);

      case _utils.internals.DATA_TO_ERROR:
        var errMessage = action.payload.errorMessage;
        var errStatus = action.payload.status;
        newState[id] = {
          ok: false,
          status: errStatus,
          errorMessage: errMessage,
          data: null,
          pending: false
        };
        return Object.assign({}, state, newState);

      case _utils.internals.DATA_TO_SUCCESS:
        var data = action.payload.data;
        var status = action.payload.status;
        newState[id] = {
          ok: true,
          status: status,
          errorMessage: null,
          data: data,
          pending: false
        };
        return Object.assign({}, state, newState);

      default:
        return state;
    }
  };
}

/**
 * Class for working with data on a private state section.
 *
 * @type {Class}
 */

var DataAPI = exports.DataAPI = function () {

  /*
   * Provide fns for retrieving and dispatching to state. Users won't be
   * able to access these directly because you have to provide a
   * symbol key in order to use them.
   */
  function DataAPI(getState, dispatch, getAppId) {
    _classCallCheck(this, DataAPI);

    this.__getState = function (key) {
      return key === STATEKEY ? getState(getAppId()) : null;
    };
    this.__dispatch = function (key, action) {
      return key === STATEKEY && dispatch(getAppId(), action);
    };
  }

  /**
   * Retrieve the most recent data returned by the server for a given
   * transaction.
   *
   * @param  {String} id The transaction identifier.
   *
   * @return {Serializable} The data if it exists or null.
   */


  _createClass(DataAPI, [{
    key: 'value',
    value: function value(id) {
      var state = this.__getState(STATEKEY)[_utils.internals.DATA][id];
      return state ? state.data : null;
    }

    /**
     * Determine whether a given transaction is currently pending.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {Boolean} Whether we are awaiting a response.
     */

  }, {
    key: 'pending',
    value: function pending(id) {
      var state = this.__getState(STATEKEY)[_utils.internals.DATA][id];
      return state ? state.pending : false;
    }

    /**
     * Determine whether data exists for a given transaction. Note that `false`
     * does not equate to an error state. The result will be true only if
     * a transaction is complete and data exists. It will be false if the
     * transaction has not fired yet or is still pending.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {Boolean}
     */

  }, {
    key: 'ok',
    value: function ok(id) {
      var state = this.__getState(STATEKEY)[_utils.internals.DATA][id];
      return state ? state.ok : false;
    }

    /**
     * Determine whether a given transaction has actually failed. Note that `false`
     * does not equate to a success state. The result will be true only if a
     * transaction has completed but did not produce a status code in the 200 range.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {Boolean}
     */

  }, {
    key: 'notOk',
    value: function notOk(id) {
      var state = this.__getState(STATEKEY)[_utils.internals.DATA][id];
      return typeof state.status === 'number' && (state.status < 200 || state.status > 299);
    }

    /**
     * Retrieve the request status of the most recent transaction.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {Number|Null} The status code if it exists or null if not.
     */

  }, {
    key: 'status',
    value: function status(id) {
      var state = this.__getState(STATEKEY)[_utils.internals.DATA][id];
      return state ? state.status : null;
    }

    /**
     * Retrieve the error message for the most recent transaction.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {String|Null} The message if it exists or null
     */

  }, {
    key: 'errorMsg',
    value: function errorMsg(id) {
      var state = this.__getState(STATEKEY)[_utils.internals.DATA][id];
      return state ? state.errorMessage : null;
    }

    /**
     * Allows you to reset a transaction back to its default state.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {undefined}
     */

  }, {
    key: 'reset',
    value: function reset(id) {
      this.__dispatch(STATEKEY, {
        type: _utils.internals.DATA_TO_DEFAULT,
        payload: { id: id }
      });
    }
  }]);

  return DataAPI;
}();

/**
 * Make a data request.
 *
 * @param  {Object} settings Takes the following keys:
 *                           - stateProp: *{String} The name of the property in the data portion of the state.
 *                           - method: *{String} 'get', 'post', 'put', 'delete'.
 *                           - url: *{String} Where to make the request.
 *                           - data: {Object} Data to send
 *                           - headers: {Object} Headers to include.
 *                           - ... All other axios settings arguments ...
 *
 * @return {Function} A thunk action.
 */


function dataRequest(settings) {
  if (!settings.id) {
    throw (0, _utils.createError)('\n        All data thunks must be created with an `id` setting that defines\n        a value on the state where the request will be tracked.\n      ');
  }
  return createRestfulAction(settings);
}

/**
 * Shortcut for making a GET request.
 *
 * @param  {String} id       This data point's unique identifier.
 * @param  {String} url      Where the data is.
 * @param  {Object} headers  Optional. Headers to pass in.
 *
 * @return {Function} A thunk action.
 */
function getData(id, url, headers) {
  return dataRequest({ method: 'get', id: id, url: url, headers: headers || {} });
}

/**
 * Shortcut for making a PATCH request.
 *
 * @param  {String} id       This data point's unique identifier.
 * @param  {String} url      Where the data should go.
 * @param  {Object} data     Data to send.
 * @param  {Object} headers  Optional. Headers to pass in.
 *
 * @return {Function} A thunk action.
 */
function patchData(id, url, data, headers) {
  return dataRequest({ method: 'patch', id: id, url: url, data: data, headers: headers || {} });
}

/**
 * Shortcut for making a POST request.
 *
 * @param  {String} id       This data point's unique identifier.
 * @param  {String} url      Where the data should go.
 * @param  {Object} data     Data to send.
 * @param  {Object} headers  Optional. Headers to pass in.
 *
 * @return {Function} A thunk action.
 */
function postData(id, url, data, headers) {
  return dataRequest({ method: 'post', id: id, url: url, data: data, headers: headers || {} });
}

/**
 * Shortcut for making a PUT request.
 *
 * @param  {String} id       This data point's unique identifier.
 * @param  {String} url      Where the data should go.
 * @param  {Object} data     Data to send.
 * @param  {Object} headers  Optional. Headers to pass in.
 *
 * @return {Function} A thunk action.
 */
function putData(id, url, data, headers) {
  return dataRequest({ method: 'put', id: id, url: url, data: data, headers: headers || {} });
}

/**
 * Shortcut for making a DELETE request.
 *
 * @param  {String} id       This data point's unique identifier.
 * @param  {String} url      Where the data lives.
 * @param  {Object} params   Optional. Extra delete parameters.
 * @param  {Object} headers  Optional. Headers to pass in.
 *
 * @return {Function} A thunk action.
 */
function deleteData(id, url, params, headers) {
  return dataRequest({ method: 'delete', id: id, url: url, params: params || {}, headers: headers || {} });
}