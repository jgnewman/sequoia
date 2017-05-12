import assert from 'assert';
import { queriable } from '../bin/index';

describe('Queriable Arrays', function () {

  const base = [
    {id: 0, firstName: 'John', lastName: 'Newman'},
    {id: 1, firstName: 'John', lastName: 'Smith'},
    {id: 2, firstName: 'Lois', lastName: 'Lane'}
  ]

  it('should create a queriable array', function () {
    assert.equal(typeof queriable(base), 'object')
  })

  it('should return the original array', function () {
    const q = queriable(base);
    assert.equal(q.get(), base);
  })

  it('should return an item by index from the array', function () {
    const q = queriable(base);
    assert.equal(q.get(1), base[1]);
  })

  it('should count the items in the array', function () {
    const q = queriable(base);
    assert.equal(q.count(), base.length);
  })

  it('should get the first item', function () {
    const q = queriable(base);
    assert.equal(q.first(), base[0]);
  })

  it('should get the last item', function () {
    const q = queriable(base);
    assert.equal(q.last(), base[base.length - 1]);
  })

  it('should slice off the first item', function () {
    const q = queriable(base);
    assert.deepEqual(q.rest(), base.slice(1));
  })

  it('should slice off the last item', function () {
    const q = queriable(base);
    assert.deepEqual(q.lead(), base.slice(0, base.length - 1));
  })

  it('should retrieve a random item', function () {
    const q = queriable(base);
    const rand = q.random();
    assert.ok(base.indexOf(rand) > -1);
  })

  it('should subtract an item from the array', function () {
    const q = queriable(base);
    assert.deepEqual(q.subtract(1), [base[0], base[2]]);
  })

  it('should get the correct index of a specific item', function () {
    const q = queriable(base);
    assert.equal(q.getIndexWhere({id: 1}), 1);
  })

  it('should get the first match to a query', function () {
    const q = queriable(base);
    assert.equal(q.getOneWhere({firstName: 'John'}), base[0]);
  })

  it('should get all matches to a query', function () {
    const q = queriable(base);
    assert.equal(q.getAllWhere({firstName: 'John'}).length, 2);
  })

  it('should take all options into account when querying', function () {
    const q = queriable(base);
    assert.equal(q.getAllWhere({firstName: 'John', lastName: 'Newman'}).length, 1);
  })

})
