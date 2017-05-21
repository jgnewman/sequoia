import assert from 'assert';
import { constants } from '../bin/index';

describe('Constants', function () {

  it('should create a single constant', function () {

    assert.equal(typeof constants('MOCHA_TEST_CONSTANT'), 'symbol')

  })

  it('should retrieve a constant', function () {

    assert.equal(typeof constants.MOCHA_TEST_CONSTANT(), 'symbol')

  })

  it('should disallow duplicate constants', function () {

    assert.throws(() => constants('MOCHA_TEST_CONSTANT'))

  })

  it('should enforce constants built from strings', function () {

    assert.throws(() => constants(100))

  })
})
