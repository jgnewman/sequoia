import assert from 'assert';
import React from 'react';
import { component } from '../bin/index';

describe('Components', function () {

  it('should create a connected react component', function () {

    const Example = component(() => {
      return () => <div>Hello, world!</div>
    })

    assert.ok(typeof Example === 'function')
    assert.equal(Example.name, 'Connect')

  })

})
