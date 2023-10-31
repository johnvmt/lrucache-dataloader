import { LRUCache } from "lru-cache";
import EventEmitter from "./SimpleEventEmitter.js";

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
     * Delete item from cache
     * @param key
     */
    delete(key) {
        const value = this.get(key);
        super.delete(key);

        this._emitItemAction("delete", key, value);
    }

    /**
     * Set value in cache, optionally getting TTL from value
     * Sets item in cache after promise resolves, or immediately if not a promise
     * @param key
     * @param valueOrPromise
     * @param options
     */
    set(key, valueOrPromise, options) {
        const setResolvedValue = (value) => {
            const ttl = this._options.ttlFromItem
                ? this._options.ttlFromItem(value, key)
                : null; // use default TTL

            if(ttl)
                super.set(key, value, {ttl, ...options});
            else
                super.set(key, value, options);

            this._emitItemAction("set", key, value);
        }

        if(valueOrPromise instanceof Promise) { // passed item is a promise (eg: from dataloader)
            // temporarily set value as a promise; will be re-set when item resolves
            super.set(key, valueOrPromise, options);

            // set resolved value or error in the cache
            valueOrPromise
                .then(setResolvedValue)
                .catch(setResolvedValue);
        }
        else // passed item is not a promise
            setResolvedValue(valueOrPromise);
    }

    /**
     * Emit an action on a cache item to listeners
     * @param action
     * @param key
     * @param value
     * @private
     */
    _emitItemAction(action, key, value) {
        this._eventEmitter.emit(TTLItemLRUCache._actionEmitterEventKey(action), key, value);
        this._eventEmitter.emit(TTLItemLRUCache._itemEmitterEventKey(key), action, value);
    }

    /**
     * Returns even key for ache action (set, delete)
     * @param action
     * @returns {string}
     * @private
     */
    static _actionEmitterEventKey(action) {
        return `cache:${action}`;
    }

    /**
     * Returns event key for item
     * @param key
     * @returns {string}
     * @private
     */
    static _itemEmitterEventKey(key) {
        return `item:${key}`;
    }
}

export default TTLItemLRUCache;
