'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataAPI = exports.requestsPackage = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createDefaultState = createDefaultState;
exports.createPendingState = createPendingState;
exports.createErrorState = createErrorState;
exports.createSuccessState = createSuccessState;
exports.createRestRule = createRestRule;
exports.createRestfulAction = createRestfulAction;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*

How this works:

When you infuseActions, you get a couple tools:

  kit.infuseActions((rules, reqs) => ({
    updateFoo: rules.app.UPDATE_FOO,
    getData: reqs.get('MY_DATA', '/conversations/:id')
  }))

Each req type should create a thunk that requests data.
Within component kits, you'll get a data tool that allows you to
interface with data.

  return props => {
    <When ok={data.ok('MY_DATA')}>
      { data.value('MY_DATA') }
    </When>
  }

To make this work, we'll need a store wrapper. On that wrapper we'll
generate a secret namespace for storing data. We'll also register a
micro-reducer for handling requests.

Where it ties in:

- The namespace and rest reducer are registered within `application`.
- The requests package is handed to actions when they are created within `component`.
- The data api is instantiated within `component` when we create a new component kit.
- Since data doesn't flow through as normal props, each component carries a symbol prop
  that changes when the data is different, causing the component's render function to
  run.

*/

var ACTION_STRING = _utils.INTERNALS.DATA_REF + ':' + _utils.INTERNALS.DATA_RULE;

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
      type: ACTION_STRING,
      payload: {
        id: settings.id,
        subrule: _utils.INTERNALS.DATA_SUCCESS,
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
      type: ACTION_STRING,
      payload: {
        id: settings.id,
        subrule: _utils.INTERNALS.DATA_ERROR,
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
    type: ACTION_STRING,
    payload: {
      id: settings.id,
      subrule: _utils.INTERNALS.DATA_PENDING
    }
  });
}

/**
 * Creates a default data state.
 *
 * @return {Object} A data state object.
 */
function createDefaultState() {
  return {
    ok: false,
    status: null,
    errorMessage: null,
    data: null,
    pending: false,
    requested: false
  };
}

/**
 * Creates a pending data state.
 *
 * @param {Object} prevState The previous state of this data
 *
 * @return {Object} A data state object.
 */
function createPendingState(prevState) {
  return {
    ok: false,
    status: prevState.status || null,
    errorMessage: prevState.errorMessage || null,
    data: prevState.data || null,
    pending: true,
    requested: true
  };
}

/**
 * Creates an errored data state.
 *
 * @param {Number} status The response status code.
 * @param {String} errMsg The error message.
 *
 * @return {Object} A data state object.
 */
function createErrorState(status, errMsg) {
  return {
    ok: false,
    status: status,
    errorMessage: errMsg,
    data: null,
    pending: false,
    requested: true
  };
}

/**
 * Creates a successful data state.
 *
 * @param {Number} status The response status code.
 * @param {Any}    data   The returned data.
 *
 * @return {Object} A data state object.
 */
function createSuccessState(status, data) {
  return {
    ok: true,
    status: status,
    errorMessage: null,
    data: data,
    pending: false,
    requested: true
  };
}

/**
 * Generates a reducer rule for working with data.
 *
 * @return {Function} Will be triggered by data actions.
 */
function createRestRule() {
  return function (substate, payload) {

    var id = payload.id;
    var subrule = payload.subrule;
    var errMsg = payload.errMsg;
    var status = payload.status;
    var data = payload.data;

    switch (subrule) {

      case _utils.INTERNALS.DATA_DEFAULT:
        return (0, _utils.merge)(substate, _defineProperty({}, id, createDefaultState()));

      case _utils.INTERNALS.DATA_PENDING:
        var prevState = substate[id] || {};
        return (0, _utils.merge)(substate, _defineProperty({}, id, createPendingState(prevState)));

      case _utils.INTERNALS.DATA_ERROR:
        return (0, _utils.merge)(substate, _defineProperty({}, id, createErrorState(status, errMsg)));

      case _utils.INTERNALS.DATA_SUCCESS:
        return (0, _utils.merge)(substate, _defineProperty({}, id, createSuccessState(status, data)));

      default:
        return (0, _utils.merge)(substate);

    }
  };
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
   * The first two arguments are the actions associated with this component and
   * the getState function. We don't need either of those, just the native dispatch.
   */
  var thunk = function thunk(_, __, dispatch) {
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

/*
 * A package of functions that generate data thunks.
 */
var requestsPackage = exports.requestsPackage = {

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
  request: function request(settings) {
    if (!settings.id) {
      throw createError('\n          All data actions must be created with an identifier that defines\n          a value on the state where the request will be tracked.\n        ');
    }
    return createRestfulAction(settings);
  },

  /**
   * Shortcut for making a GET request.
   *
   * @param  {String} id       This data point's unique identifier.
   * @param  {String} url      Where the data is.
   * @param  {Object} headers  Optional. Headers to pass in.
   *
   * @return {Function} A thunk action.
   */
  get: function get(id, url, headers) {
    return this.request({ method: 'get', id: id, url: url, headers: headers || {} });
  },

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
  patch: function patch(id, url, data, headers) {
    return this.request({ method: 'patch', id: id, url: url, data: data, headers: headers || {} });
  },

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
  post: function post(id, url, data, headers) {
    return this.request({ method: 'post', id: id, url: url, data: data, headers: headers || {} });
  },

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
  put: function put(id, url, data, headers) {
    return this.request({ method: 'put', id: id, url: url, data: data, headers: headers || {} });
  },

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
  delete: function _delete(id, url, params, headers) {
    return this.request({ method: 'delete', id: id, url: url, params: params || {}, headers: headers || {} });
  }

};

/**
 * Class for working with data on a private state section.
 *
 * @type {Class}
 */

var DataAPI = exports.DataAPI = function () {

  /*
   * Intantiate the class.
   * `getStoreWrapper` must be called with `INTERNALS.INTERNAL_KEY`
   */
  function DataAPI(getStoreWrapper) {
    _classCallCheck(this, DataAPI);

    this.__getStoreWrapper = getStoreWrapper;
  }

  /*
   * An internal method for retrieving a portion of the data state.
   */


  _createClass(DataAPI, [{
    key: '__getDataState',
    value: function __getDataState(secretKey, id) {
      return this.__getStoreWrapper(secretKey).get(secretKey).getState()[_utils.INTERNALS.DATA_REF][id];
    }

    /**
     * Retrieve the most recent data returned by the server for a given
     * transaction.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {Serializable} The data if it exists or null.
     */

  }, {
    key: 'value',
    value: function value(id) {
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
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
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
      return state ? state.pending : false;
    }

    /**
     * Determine whether a given transaction was initiated.
     *
     * @param  {String} id The transaction identifier.
     *
     * @return {Boolean} Whether the transaction was initiated.
     */

  }, {
    key: 'requested',
    value: function requested(id) {
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
      return state ? state.requested : false;
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
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
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
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
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
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
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
      var state = this.__getDataState(_utils.INTERNALS.INTERNAL_KEY, id);
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
      var storeWrapper = this.__getStoreWrapper(_utils.INTERNALS.INTERNAL_KEY);
      storeWrapper.dispatch({
        type: ACTION_STRING,
        payload: {
          id: id,
          subrule: _utils.INTERNALS.DATA_DEFAULT
        }
      });
    }
  }]);

  return DataAPI;
}();