import { LRUCache } from "lru-cache";
import EventEmitter from "eventemitter3";

class TTLItemLRUCache extends LRUCache {
    constructor(options = {}) {
        super(options);

        this._options = options;
        this._eventEmitter = new EventEmitter();
    }

    get options() {
        return Object.freeze(this._options);
    }

    on(...args) {
        return this._eventEmitter.on(...args);
    }

    off(...args) {
        return this._eventEmitter.off(...args);
    }

    once(...args) {
        return this._eventEmitter.once(...args);
    }

    /**
     * Generally, converts the key to a scalar
     * @param key
     * @returns {*}
     * @private
     */
    _cacheKey(key) {
        if(this._options.keyFn)
            return this._options.keyFn(key);
        else
            return key;
    }

    /**
     * Adds a subscription for a key
     * @param key
     * @param callback
     * @returns {GenericSubscription}
     */
    subscribe(key, callback) {
        const cacheKey = this._cacheKey(key);
        const subscriptionKey = TTLItemLRUCache._itemEmitterEventKey(cacheKey);

        if(this._eventEmitter.listenerCount(subscriptionKey) === 0)
            this._eventEmitter.emit('subscription:on', key);

        this.on(subscriptionKey, callback);

        let canceled = false;
        return () => {
            if(!canceled) {
                this.off(subscriptionKey, callback);

                if(this._eventEmitter.listenerCount(subscriptionKey) === 0)
                    this._eventEmitter.emit('subscription:off', key);

                canceled = true;
            }
        }
    }

    /**
     *
     * @param key
     */
    delete(key) {
        const cacheKey = this._cacheKey(key);
        const subscriptionKey = TTLItemLRUCache._itemEmitterEventKey(cacheKey);
        super.delete(cacheKey);
        this._eventEmitter.emit(subscriptionKey, 'delete');
    }

    /**
     *
     * @param key
     * @param args
     * @returns {*}
     */
    has(key, ...args) {
        const cacheKey = this._cacheKey(key);
        return super.has(cacheKey);
    }

    /**
     *
     * @param key
     * @param args
     * @returns {*}
     */
    get(key, ...args) {
        const cacheKey = this._cacheKey(key);
        return  super.get(cacheKey);
    }

    /**
     *
     * @param key
     * @param valueOrPromise
     * @param options
     */
    set(key, valueOrPromise, options) {
        // set item in cache after promise resolves, or immediately if not a promise
        const cacheKey = this._cacheKey(key);
        const subscriptionKey = TTLItemLRUCache._itemEmitterEventKey(cacheKey);

        const setResolvedValue = (value) => {
            const ttl = this._options.ttlFromItem
                ? this._options.ttlFromItem(value, key)
                : null; // use default TTL

            if(ttl)
                super.set(cacheKey, value, {ttl, ...options});
            else
                super.set(cacheKey, value, options);
            this._eventEmitter.emit(subscriptionKey, 'set', value);
        }

        if(valueOrPromise instanceof Promise) { // passed item is a promise (eg: from dataloader)
            // temporarily set value as a promise; will be re-set when item resolves
            super.set(cacheKey, valueOrPromise, options);

            // set resolved value or error in the cache
            valueOrPromise
                .then(setResolvedValue)
                .catch(setResolvedValue);
        }
        else // passed item is not a promise
            setResolvedValue(valueOrPromise);
    }

    static _itemEmitterEventKey(cacheKey) {
        return `item:${cacheKey}`;
    }
}

export default TTLItemLRUCache;
