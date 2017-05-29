import React from 'react';
import { merge } from './utils';
import { collect } from './collect';
import { component } from './component';
import { application } from './application';
import { constants, uuid } from './constants';
import { Redirect, When, Otherwise, Switch } from './premade';

/*
 * Package up our exports
 */
const exp = {

  /*
   * Functions
   */
  application: application,
  collect: collect,
  component: component,
  constants: constants,
  createElement: React.createElement,
  merge: merge,
  uuid: uuid,

  /*
   * Pre-made components
   */
  Otherwise: Otherwise,
  Redirect: Redirect,
  Switch: Switch,
  When: When
}

/*
 * Export for Node and the browser.
 */
if (typeof window !== 'undefined') {
  window.Sequoia = exp;
}

if (typeof module !== 'undefined' || typeof exports !== 'undefined') {
  module.exports = exports = exp;
}
