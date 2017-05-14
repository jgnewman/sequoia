import assert from 'assert';
import { queriable } from '../bin/index';

describe('Queriable Arrays', function () {

  function base() {
    return [
      {id: 0, firstName: 'John', lastName: 'Newman'},
      {id: 1, firstName: 'John', lastName: 'Smith'},
      {id: 2, firstName: 'Lois', lastName: 'Lane'}
    ]
  }

  it('should create a queriable array', function () {
    assert.equal(typeof queriable(base()), 'object')
  })

  it('should return a copy of the original array', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    assert.notEqual(q.get(), baseArray);
    assert.deepEqual(q.get(), baseArray);
  })

  it('should return the original array', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    assert.equal(q.getOriginal(), baseArray);
  })

  it('should return an item by index from the array', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    assert.equal(q.get(1), baseArray[1]);
  })

  it('should count the items in the array', function () {
    const q = queriable(base());
    assert.equal(q.count(), base().length);
  })

  it('should get the first item', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    assert.equal(q.first(), baseArray[0]);
  })

  it('should get the last item', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    assert.equal(q.last(), baseArray[baseArray.length - 1]);
  })

  it('should slice off the first item', function () {
    const q = queriable(base());
    assert.deepEqual(q.rest(), base().slice(1));
  })

  it('should slice off the last item', function () {
    const q = queriable(base());
    assert.deepEqual(q.lead(), base().slice(0, base().length - 1));
  })

  it('should retrieve a random item', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const rand = q.random();
    assert.ok(baseArray.indexOf(rand) > -1);
  })

  it('should subtract an item from the array', function () {
    const q = queriable(base());
    assert.deepEqual(q.subtract(1), [base()[0], base()[2]]);
  })

  it('should get the correct index of a specific item', function () {
    const q = queriable(base());
    assert.equal(q.getIndexWhere({id: 1}), 1);
  })

  it('should get the first match to a query', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    assert.equal(q.getOneWhere({firstName: 'John'}), baseArray[0]);
  })

  it('should get all matches to a query', function () {
    const q = queriable(base());
    assert.equal(q.getAllWhere({firstName: 'John'}).length, 2);
  })

  it('should take all options into account when querying', function () {
    const q = queriable(base());
    assert.equal(q.getAllWhere({firstName: 'John', lastName: 'Newman'}).length, 1);
  })

  it('should count the items matching a query', function () {
    const q = queriable(base());
    assert.equal(q.countAllWhere({ firstName: 'John' }), 2);
  })

  it('should subtract the items matching a query', function () {
    const q = queriable(base());
    assert.equal(q.subtractAllWhere({ firstName: 'John' }).length, 1);
  })

  it('should subtract the first item matching a query', function () {
    const q = queriable(base());
    assert.equal(q.subtractOneWhere({ firstName: 'John' }).length, 2);
  })

  it('should update the items matching a query', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const updated = q.updateAllWhere({ firstName: 'John' }, { firstName: 'Patrick' });
    assert.equal(queriable(updated).getAllWhere({firstName: 'Patrick'}).length, 2);
  })

  it('should update the items matching a query via a function', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const updated = q.updateAllWhere({ firstName: 'John' }, item => {
      item.firstName = 'Patrick';
      return item;
    });
    assert.equal(queriable(updated).getAllWhere({firstName: 'Patrick'}).length, 2);
  })

  it('should update all the items', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const updated = q.updateAll({ firstName: 'Patrick' });
    assert.equal(queriable(updated).getAllWhere({firstName: 'Patrick'}).length, 3);
  })

  it('should prepend an item', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const newItem = {id: 3, firstName: 'New', lastName: 'Item'};
    const updated = q.prepend(newItem);
    assert.equal(updated.length, 4);
    assert.equal(updated[0], newItem);
  })

  it('should append an item', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const newItem = {id: 3, firstName: 'New', lastName: 'Item'};
    const updated = q.append(newItem);
    assert.equal(updated.length, 4);
    assert.equal(updated[3], newItem);
  })

  it('should update the first item matching a query', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const updated = q.updateOneWhere({ firstName: 'John' }, { firstName: 'Patrick' });
    assert.equal(queriable(updated).getAllWhere({firstName: 'Patrick'}).length, 1);
  })

  it('should update the first item matching a query via a function', function () {
    const baseArray = base();
    const q = queriable(baseArray);
    const updated = q.updateOneWhere({ firstName: 'John' }, item => {
      item.firstName = 'Patrick';
      return item;
    });
    assert.equal(queriable(updated).getAllWhere({firstName: 'Patrick'}).length, 1);
  })

})
