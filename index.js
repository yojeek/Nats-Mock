const Tasu = require('tasu');
const _ = require('lodash');

module.exports = class NatsMock {

    /**
     *
     * @param {Object} options - Tasu instance or NATS options
     */
    constructor(options) {

        // options is instance of nats
        if (options.hasOwnProperty('_nats')) {
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
        const mock = new RequestMock(this._tasu, topic, false);
        this._mocks.push(mock);
        return mock;
    }

    persist(topic) {
        const mock = new RequestMock(this._tasu, topic, true);
        this._mocks.push(mock);
        return mock;
    }

    cleanAll() {
        this._mocks.forEach(mock => mock.clear());
        this._mocks = [];
    }

};

class RequestMock {
    constructor(tasu, topic, isPersist) {
        this._tasu = tasu;
        this._numOfCalls = 0;
        this._persist = isPersist;
        this._subsId = tasu.listen(topic, this._callback.bind(this));

        // defaults if one of req() or res() omitted
        this._checkRequest = () => true;
        this._response = {};
    }

    get numOfCalls() {
        return this._numOfCalls;
    }

    req(bodyOrFunction) {
        if (typeof bodyOrFunction === 'function') {
            this._checkRequest = bodyOrFunction;
        } else {
            this._checkRequest = (req) => {
                return _.isMatch(req, bodyOrFunction);
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
        const payload = typeof req === 'string' ? JSON.parse(req) : req
        const result = await this._checkRequest(payload);
        if (result) {
            return this._response;
        } else {
            throw new Error(`Request expectation failed : ${JSON.stringify(payload)}`);
        }
    }

    isDone() {
        return this._numOfCalls;
    }

    clear() {
        if (this._subsId) {
            this._tasu.unsubscribe(this._subsId);
        }
    }
}
