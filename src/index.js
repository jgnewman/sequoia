import React from 'react';
import { merge } from './utils';
import { collect } from './collect';
import { component } from './component';
import { application } from './application';
import { constants, uuid } from './constants';
import { Redirect, When, Otherwise, Switch, Preload } from './premade';
import { pathMatch, subPathMatch, hashMatch, subHashMatch } from './routing';

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
  cloneElement: React.cloneElement,
  merge: merge,
  uuid: uuid,
  pathMatch: pathMatch,
  subPathMatch: subPathMatch,
  hashMatch: hashMatch,
  subHashMatch: subHashMatch,

  /*
   * Pre-made components
   */
  Preload: Preload,
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

if (typeof module !== 'undefined') {
  module.exports = exports = exp;
}
