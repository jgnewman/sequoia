import axios from 'axios';
import { internals, createError } from './utils';

const STATEKEY = Symbol();

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
  axios(settings)

    /*
     * When the request is successful, mark that in the state along with
     * the data. If there are any `ok` functions, fire them all.
     */
    .then(result => {
      dispatch({
        type: internals.DATA_TO_SUCCESS,
        payload: {
          id: settings.id,
          status: result.status,
          data: result.data
        }
      })
      extras.success.forEach(fn => fn(dispatch, result.data, result))
      return result;
    })

    /*
     * When the request errors, mark that in the state and store the
     * error message. Fire any `notOk` functions.
     */
    .catch(err => {
      const response = err.response || {};
      dispatch({
        type: internals.DATA_TO_ERROR,
        payload: {
          id: settings.id,
          status: response.status,
          errorMessage: err.message
        }
      })
      extras.fail.forEach(fn => fn(dispatch, err))
    });

  /*
   * As the request is being made, mark it as pending.
   */
  dispatch({
    type: internals.DATA_TO_PENDING,
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
export function createRestfulAction(settings) {
  const extras = { success: [], fail: [] };

  /*
   * Create an action thunk.
   */
  const thunk = (dispatch) => {
    return performRestfulAction(settings, extras, dispatch)
  }

  /*
   * Attach a function to the action thunk that allows you to run
   * more actions on success.
   */
  thunk.ok = fn => {
    extras.success.push(fn);
    return thunk;
  };

  /*
   * Attach a function to the action thunk that allows you to
   * run more actions on fail.
   */
  thunk.notOk = fn => {
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
export function createRestReducer(initialState) {
  return (state=initialState[internals.DATA], action) => {

    const id = action.payload ? action.payload.id : null;
    let newState = {};

    switch (action.type) {

      case internals.DATA_TO_DEFAULT:
        newState[id] = {
          ok           : false,
          status       : null,
          errorMessage : null,
          data         : null,
          pending      : false
        };
        return Object.assign({}, state, newState);

      case internals.DATA_TO_PENDING:
        const prevState = state[id] || {};
        newState[id] = {
          ok           : false,
          status       : prevState.status       || null,
          errorMessage : prevState.errorMessage || null,
          data         : prevState.data         || null,
          pending      : true
        };
        return Object.assign({}, state, newState);

      case internals.DATA_TO_ERROR:
        const errMessage = action.payload.errorMessage;
        const errStatus = action.payload.status;
        newState[id] = {
          ok           : false,
          status       : errStatus,
          errorMessage : errMessage,
          data         : null,
          pending      : false
        };
        return Object.assign({}, state, newState);

      case internals.DATA_TO_SUCCESS:
        const data = action.payload.data;
        const status = action.payload.status;
        newState[id] = {
          ok           : true,
          status       : status,
          errorMessage : null,
          data         : data,
          pending      : false
        };
        return Object.assign({}, state, newState);

      default:
        return state;
    }
  }
}

/**
 * Class for working with data on a private state section.
 *
 * @type {Class}
 */
export class DataAPI {

  /*
   * Provide fns for retrieving and dispatching to state. Users won't be
   * able to access these directly because you have to provide a
   * symbol key in order to use them.
   */
  constructor(getState, dispatch, getAppId) {
    this.__getState = key => key === STATEKEY ? getState(getAppId()) : null;
    this.__dispatch = (key, action) => key === STATEKEY && dispatch(getAppId(), action);
  }

  /**
   * Retrieve the most recent data returned by the server for a given
   * transaction.
   *
   * @param  {String} id The transaction identifier.
   *
   * @return {Serializable} The data if it exists or null.
   */
  value(id) {
    const state = this.__getState(STATEKEY)[internals.DATA][id];
    return state ? state.data : null;
  }

  /**
   * Determine whether a given transaction is currently pending.
   *
   * @param  {String} id The transaction identifier.
   *
   * @return {Boolean} Whether we are awaiting a response.
   */
  pending(id) {
    const state = this.__getState(STATEKEY)[internals.DATA][id];
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
  ok(id) {
    const state = this.__getState(STATEKEY)[internals.DATA][id];
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
  notOk(id) {
    const state = this.__getState(STATEKEY)[internals.DATA][id];
    return typeof state.status === 'number' && (state.status < 200 || state.status > 299);
  }

  /**
   * Retrieve the request status of the most recent transaction.
   *
   * @param  {String} id The transaction identifier.
   *
   * @return {Number|Null} The status code if it exists or null if not.
   */
  status(id) {
    const state = this.__getState(STATEKEY)[internals.DATA][id];
    return state ? state.status : null;
  }

  /**
   * Retrieve the error message for the most recent transaction.
   *
   * @param  {String} id The transaction identifier.
   *
   * @return {String|Null} The message if it exists or null
   */
  errorMsg(id) {
    const state = this.__getState(STATEKEY)[internals.DATA][id];
    return state ? state.errorMessage : null;
  }

  /**
   * Allows you to reset a transaction back to its default state.
   *
   * @param  {String} id The transaction identifier.
   *
   * @return {undefined}
   */
  reset(id) {
    this.__dispatch(STATEKEY, {
      type: internals.DATA_TO_DEFAULT,
      payload: { id : id }
    })
  }
}

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
export function dataRequest(settings) {
  if (!settings.id) {
    throw createError(
      `
        All data thunks must be created with an \`id\` setting that defines
        a value on the state where the request will be tracked.
      `
    )
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
export function getData(id, url, headers) {
  return dataRequest({ method: 'get', id: id, url: url, headers: headers || {} })
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
export function patchData(id, url, data, headers) {
  return dataRequest({ method: 'patch', id: id, url: url, data: data, headers: headers || {} })
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
export function postData(id, url, data, headers) {
  return dataRequest({ method: 'post', id: id, url: url, data: data, headers: headers || {} })
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
export function putData(id, url, data, headers) {
  return dataRequest({ method: 'put', id: id, url: url, data: data, headers: headers || {} })
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
export function deleteData(id, url, params, headers) {
  return dataRequest({ method: 'delete', id: id, url: url, params: params || {}, headers: headers || {} })
}
