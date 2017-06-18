import axios from 'axios';

/*
 * Names all the axios methods we will proxy to.
 */
const methods = [
  'request',
  'get',
  'delete',
  'head',
  'options',
  'post',
  'put',
  'patch'
];

/*
 * The object we'll use to store our methods.
 * This will end up being exported.
 */
const http = {};

/*
 * Loop over all of our axios methods and populate the
 * http object with proxy methods.
 */
methods.forEach(methodName => {
  http[methodName] = (...args) => {
    return axios[methodName](...args);
  };
});

/*
 * Export the http object
 */
export default http;