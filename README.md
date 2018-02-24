# Nats-Mock

Usage
=====

Create an instance Mock:

```js
const NatsMock = require('./');

const options = {
    maxReconnectAttempts: -1,
    reconnectTimeWait: 250,
    url: 'nats://localhost:4222',
    group: 'natsMock',
    requestTimeout: 100,
};

const mock = new NatsMock(options);
```
or attach to existed [Tasu](https://github.com/yentsun/tasu/) instance

```js
const Nats = require('tasu');
const NatsMock = require('./');

const options = {
    maxReconnectAttempts: -1,
    reconnectTimeWait: 250,
    url: 'nats://localhost:4222',
    group: 'natsMock',
    requestTimeout: 100,
};

const nats=new Nats(options);
const mock = new NatsMock(nats);
```

ensure that it's connected to NATS server
```js
await mock.connected();
```

set up onetime mock
```js
const onceMock = mock.once('mockTest.once')
        .req({a: 1, b: 2})
        .res({result: true});
```

or persistent one
```js
const persistMock = mock.persist('mockTest.once')
        .req({a: 1, b: 2})
        .res({result: true});
```

Request validation
==================

Passing exact object (compared using `lodash.isEqual`)
```js
const persistMock = mock.persist('mockTest.once')
        .req({a: 1, b: 2})
        .res({result: true});
```

Passing function
```js
const persistMock = mock.persist('mockTest.once')
        .req((data)=> data.someField === 'some value')
        .res({result: true});
```

Passing async function
```js
const persistMock = mock.persist('mockTest.once')
        .req((data)=> await someAsyncFunction(data))
        .res({result: true});
```

Return result
=============

```js
        .res({result: true, value: 'some value'});
```

Checking result
===============

```js
assert.isOk(onceMock.isDone());
```

```js
assert.equal(persistMock.numOfCalls(), 2);
```

Other
===============

if you have other questions: @see `tests.js`
