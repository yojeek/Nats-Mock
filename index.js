const Tasu = require('tasu');
const _ = require('lodash');

module.exports = class NatsMock {

    /**
     *
     * @param {Object} options - Tasu instance or NATS options
     */
    constructor(options) {
        if (options instanceof Tasu) {
            this._tasu = options;
        } else {
            this._tasu = new Tasu(options);
        }
        this._mocks = [];
    }

    connected() {
        return this._tasu.readyPromise;
    }

    once(topic) {
        const mock = new SigleMock(this._tasu, topic, false);
        this._mocks.push(mock);
        return mock;
    }

    persist(topic) {
        const mock = new SigleMock(this._tasu, topic, true);
        this._mocks.push(mock);
        return mock;
    }

    cleanAll() {
        this._mocks.forEach(mock => mock.clear());
        this._mocks = [];
    }

};

class SigleMock {
    constructor(tasu, topic, isPersist) {
        this._tasu = tasu;
        this._numOfCalls = 0;
        this._persist = isPersist;
        this._subsId = tasu.listen(topic, natsMw(this._callback.bind(this)));
    }

    req(bodyOrFunction) {
        if (typeof bodyOrFunction === 'function') {
            this._checkRequest = bodyOrFunction;
        } else {
            this._checkRequest = (req) => {
                return _.isEqual(req, bodyOrFunction);
            };
        }
        return this;
    }

    res(mockObject) {
        this._response = mockObject;
        return this;
    }

    async _callback(req) {

        // Unsubscribe if we need mock once!
        if (!this._persist) {
            this._tasu.unsubscribe(this._subsId);
            this._subsId = undefined;
        }

        this._numOfCalls += 1;
        const result = await this._checkRequest(req);
        if (result) {
            return this._response;
        } else {
            throw new Error('NatsMock. Request expectaion failed!');
        }
    }

    isDone() {
        return this._numOfCalls;
    }

    numOfCalls() {
        return this._numOfCalls;
    }

    clear() {
        if (this._subsId) {
            this._tasu.unsubscribe(this._subsId);
        }
    }
}

function natsMw(fn) {
    return function (data, done) {
        if (Object.getPrototypeOf(fn).constructor.name !==
            'AsyncFunction') {
            throw new Error('natsMw should be used on async functions');
        }
        fn(data, done).then(val => {
            done(null, val === undefined ? null : val);
        }).catch(err => {
            console.error(err);
            done(err);
        });
    }
}
