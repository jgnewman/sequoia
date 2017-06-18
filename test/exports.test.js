import assert from 'assert';
import * as allExports from '../bin/index';

describe('Exports', function () {

  it('should not export any undefined values', function () {

    Object.keys(allExports).forEach(key => {
      assert.ok(allExports[key])
    })

  })

})
