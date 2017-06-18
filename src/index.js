import React from 'react';
import uuid from 'uuid';
import { extend } from './utils';
import { createState, enableDevMode, disableDevMode } from './state';
import { pick, when, setLocationContext } from './decision';
import component from './component';
import collect from './collect';
import http from './http';
import { Preload } from './premade';

function getHttpApi() {
  return http;
}

/*
 * Make sure the React global exists.
 */
global.React = React;

/*
 * Package up our exports
 */
const exp = {
  extend,
  uuid,
  createState,
  enableDevMode,
  disableDevMode,
  component,
  collect,
  pick,
  when,
  setLocationContext,
  Preload,
  createElement: React.createElement,
  cloneElement: React.cloneElement,
  getHttpApi
};

/*
 * Export for Node and the browser.
 */
if (typeof window !== 'undefined') {
  window.Sequoia = exp;
  window.React = React;
}

if (typeof module !== 'undefined') {
  module.exports = exports = exp;
}
