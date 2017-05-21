import axios from 'axios';

import { INTERNALS } from './utils';
import { secretStoreKey } from './store';

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

const ACTION_STRING = `${INTERNALS.DATA_REF}:${INTERNALS.DATA_RULE}`;

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
        type: ACTION_STRING,
        payload: {
          id: settings.id,
          subrule: INTERNALS.DATA_SUCCESS,
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
        type: ACTION_STRING,
        payload: {
          id: settings.id,
          subrule: INTERNALS.DATA_ERROR,
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
    type: ACTION_STRING,
    payload: {
      id: settings.id,
      subrule: INTERNALS.DATA_PENDING
    }
  });
}


/**
 * Generates a reducer rule for working with data.
 *
 * @return {Function} Will be triggered by data actions.
 */
export function createRestRule() {
  return (update, substate, payload) => {

    const id      = payload.id;
    const subrule = payload.subrule;
    const errMsg  = payload.errMsg;
    const status  = payload.status;
    const data    = payload.data;

    switch (subrule) {

      case INTERNALS.DATA_DEFAULT:
        return update(substate, {
          [id]: {
            ok           : false,
            status       : null,
            errorMessage : null,
            data         : null,
            pending      : false
          }
        })

      case INTERNALS.DATA_PENDING:
        const prevState = substate[id] || {};
        return update(substate, {
          [id]: {
            ok           : false,
            status       : prevState.status       || null,
            errorMessage : prevState.errorMessage || null,
            data         : prevState.data         || null,
            pending      : true
          }
        })

      case INTERNALS.DATA_ERROR:
        throw new Error()
        return update(substate, {
          [id]: {
            ok           : false,
            status       : status,
            errorMessage : errMsg,
            data         : null,
            pending      : false
          }
        })

      case INTERNALS.DATA_SUCCESS:
        return update(substate, {
          [id]: {
            ok           : true,
            status       : status,
            errorMessage : null,
            data         : data,
            pending      : false
          }
        })

      default:
        return update(substate);

    }
  }
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

/*
 * A package of functions that generate data thunks.
 */
export const requestsPackage = {

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
  request: function (settings) {
    if (!settings.id) {
      throw createError(
        `
          All data actions must be created with an identifier that defines
          a value on the state where the request will be tracked.
        `
      )
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
  get: function (id, url, headers) {
    return this.request({ method: 'get', id: id, url: url, headers: headers || {} })
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
  patch: function (id, url, data, headers) {
    return this.request({ method: 'patch', id: id, url: url, data: data, headers: headers || {} })
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
  post: function (id, url, data, headers) {
    return this.request({ method: 'post', id: id, url: url, data: data, headers: headers || {} })
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
  put: function (id, url, data, headers) {
    return this.request({ method: 'put', id: id, url: url, data: data, headers: headers || {} })
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
  delete: function (id, url, params, headers) {
    return this.request({ method: 'delete', id: id, url: url, params: params || {}, headers: headers || {} })
  }

};

/**
 * Class for working with data on a private state section.
 *
 * @type {Class}
 */
export class DataAPI {

  /*
   * Intantiate the class.
   * `getStoreWrapper` must be called with `secretStoreKey`
   */
  constructor(getStoreWrapper) {
    this.__getStoreWrapper = getStoreWrapper;
  }

  /*
   * An internal method for retrieving a portion of the data state.
   */
  __getDataState(secretKey, id) {
    return this.__getStoreWrapper(secretKey)
               .get(secretKey)
               .getState()[INTERNALS.DATA_REF][id];
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
    const state = this.__getDataState(secretStoreKey, id);
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
    const state = this.__getDataState(secretStoreKey, id);
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
    const state = this.__getDataState(secretStoreKey, id);
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
    const state = this.__getDataState(secretStoreKey, id);
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
    const state = this.__getDataState(secretStoreKey, id);
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
    const state = this.__getDataState(secretStoreKey, id);
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
    const storeWrapper = this.__getStoreWrapper(secretStoreKey);
    storeWrapper.dispatch({
      type: ACTION_STRING,
      payload: {
        id: id,
        subrule: INTERNALS.DATA_DEFAULT
      }
    });
  }
}
