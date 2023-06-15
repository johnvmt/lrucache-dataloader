import { LRUCache } from "lru-cache";

class TTLItemLRUCache extends LRUCache {
    constructor(options = {}) {
        super(options);

        this._options = options;
    }

    get options() {
        return Object.freeze(this._options);
    }

    set(key, valueOrPromise, options) {
        // set item in cache after promise resolves, or immediately if not a promise
        const setResolvedValue = (value) => {
            const ttl = this._options.ttlFromItem
                ? this._options.ttlFromItem(value, key)
                : null; // default don't set TTL

            if(ttl)
                super.set(key, value, {ttl, ...options});
            else
                super.set(key, value, options);
        }

        if(valueOrPromise instanceof Promise) { // passed item is a promise (eg: from dataloader)
            if(this._options.ttlFromItem) // get ttl for item after resolved
                valueOrPromise.then(setResolvedValue);

            // temporarily set value as a promise; will be re-set when item resolves
            return super.set(key, valueOrPromise, options);
        }
        else // passed item is not a promise
            setResolvedValue(valueOrPromise);
    }
}

export default TTLItemLRUCache;
