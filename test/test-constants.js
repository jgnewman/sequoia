import assert from 'assert';
import { constants, createConstant, getConstantName } from '../bin/index';

describe('Constants', function () {

  it('should create a single constant', function () {

    assert.equal(typeof createConstant('MOCHA_TEST_CONSTANT'), 'symbol')

  })

  it('should retrieve a constant', function () {

    assert.equal(typeof constants.MOCHA_TEST_CONSTANT(), 'symbol')

  })

  it('should retrieve a constant name', function () {

    assert.equal(getConstantName(constants.MOCHA_TEST_CONSTANT()), 'MOCHA_TEST_CONSTANT')

  })

  it('should disallow duplicate constants', function () {

    assert.throws(() => createConstant('MOCHA_TEST_CONSTANT'))

  })

  it('should enforce constants built from strings', function () {

    assert.throws(() => createConstant(100))

  })
})
