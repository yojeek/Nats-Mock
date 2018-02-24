const {assert} = require('chai');
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


describe('Testing constructors', async () => {
    let mock;

    it('Create from options', async () => {
        mock = new NatsMock(options);
        await mock.connected();
    });

    it('Create from existed connection', async () => {
        mock = new NatsMock(nats);
        await mock.connected();
    });
});

describe('Testing method availability', async () => {
    let mock;

    before(async () =>{
        mock = new NatsMock(nats);
        await mock.connected();
    });

    after(async () => {
        mock.cleanAll();
    });

    it('should use object as request samlpe', async () => {
        const m = mock.once('mockTest.once')
                .req({a: 1, b: 2})
                .res({result: true});
        assert.isNotOk(m.isDone());
    });

    it('should use function as request sample', async () => {
        const m = mock.once('mockTest.once')
                .req(() => {return true})
                .res({result: true});
        assert.isNotOk(m.isDone());
    });
});

describe('Testing ONCE', async () => {
    let mock;
    let onceMock;

    before(async () =>{
        mock = new NatsMock(nats);
        await mock.connected();
        onceMock = mock.once('mockTest.once')
                .req({a: 1, b: 2})
                .res({result: true});

    });

    after(async () => {
        mock.cleanAll();
    });

    it('should mock object', async () => {
        const result=await nats.request('mockTest.once', {a: 1, b: 2});
        assert.isOk(onceMock.isDone());
        assert.isOk(result);
    });

    it('should FAIL (mock is already triggered)', async () => {
        const result=await nats.request('mockTest.once', {a: 1, b: 2})
                .catch(err => console.error(err));
        assert.isNotOk(result);
    });

});

describe('Testing PERSIST', async () => {
    let mock;
    let persistMock;

    before(async () =>{
        mock = new NatsMock(nats);
        await mock.connected();
        persistMock = mock.persist('mockTest.persistMock')
                .req({a: 1, b: 2})
                .res({result: true});
    });

    after(async () => {
        mock.cleanAll();
    });

    it('should mock object', async () => {
        const result=await nats.request('mockTest.persistMock', {a: 1, b: 2});
        assert.isOk(persistMock.isDone());
        assert.isOk(result);
        assert.equal(persistMock.numOfCalls(), 1);
    });

    it('should PASS (even mock is already triggered)', async () => {
        const result=await nats.request('mockTest.persistMock', {a: 1, b: 2})
                .catch(err => console.error(err));
        assert.isOk(result);
        assert.equal(persistMock.numOfCalls(), 2);
    });
});

describe('Testing RESPONSE', async () => {
    let mock;
    let onceMock;
    before(async () => {
        mock = new NatsMock(nats);
        await mock.connected();
    });

    after(async () => {
        mock.cleanAll();
    });

    it('should return {result: true, item: 20}', async () => {
        onceMock = mock.once('mockTest.once')
                .req({a: 1, b: 2})
                .res({result: true, item: 20});

        const result = await nats.request('mockTest.once', {a: 1, b: 2});
        assert.isOk(onceMock.isDone());
        assert.isOk(result);
        assert.isOk(result.result);
        assert.equal(result.item, 20);
    });
});

describe('Testing REQUEST VALIDATION', async () => {
    let mock;
    let onceMock;
    before(async () =>{
        mock = new NatsMock(nats);
        await mock.connected();
    });

    after(async () => {
        mock.cleanAll();
    });

    it('use object as sample', async () => {
        onceMock = mock.once('mockTest.once')
                .req({a: 1, b: 2})
                .res({result: true});

        const result=await nats.request('mockTest.once', {a: 1, b: 2});
        assert.isOk(onceMock.isDone());
        assert.isOk(result);
    });

    it('should FAIL (object NOT good)', async () => {
        onceMock = mock.once('mockTest.once')
                .req({a: 1, b: 2})
                .res({result: true});
        const result=await nats.request('mockTest.once', {a: 2, b: 2})
                .catch(err => console.error(err));
        assert.isOk(onceMock.isDone());
        assert.isNotOk(result);
    });

    it('use function as sample', async () => {
        onceMock = mock.once('mockTest.once')
                .req(()=> true)
                .res({result: true});

        const result=await nats.request('mockTest.once', {a: 1, b: 2});
        assert.isOk(onceMock.isDone());
        assert.isOk(result);
    });

    it('should FAIL', async () => {
        onceMock = mock.once('mockTest.once')
                .req(()=> false)
                .res({result: true});

        const result=await nats.request('mockTest.once', {a: 2, b: 2})
                .catch(err => console.error(err));
        assert.isOk(onceMock.isDone());
        assert.isNotOk(result);
    });

    it('use ASYNC function as sample (success)', async () => {
        onceMock = mock.once('mockTest.once')
                .req(() => new Promise(resolve => resolve(true)))
                .res({result: true});

        const result=await nats.request('mockTest.once', {a: 1, b: 2});
        assert.isOk(onceMock.isDone());
        assert.isOk(result);
    });

    it('use ASYNC function as sample (FAIL)', async () => {
        onceMock = mock.once('mockTest.once')
                .req(() => new Promise((resolve, reject) => reject(true)))
                .res({result: true});

        const result=await nats.request('mockTest.once', {a: 1, b: 2})
                .catch(err => console.error(err));
        assert.isOk(onceMock.isDone());
        assert.isNotOk(result);
    });
});