import DataLoader from "dataloader";
import TTLItemLRUCache from "./TTLItemLRUCache.js";

class TTLItemLRUCacheDataLoader extends DataLoader {
    /**
     *
     * @param batchLoadByKey
     * @param options
     */
    constructor(batchLoadByKey, options = {}) {
        const mergedDataLoaderOptions = {};
        const mergedLRUCacheOptions = {};

        // use "hash" to hash an object used as a key
        const cacheKeyFn = options.cacheKeyFn
            ? options.cacheKeyFn // user-supplied function (hash, etc.)
            : key => key; // default, pass through key

        // pass options to DataLoader
        for(let optionKey of [
            'batch',
            'maxBatchSize',
            'batchScheduleFn',
            'cache',
            'name'
        ]) {
            if(optionKey in options)
                mergedDataLoaderOptions[optionKey] = options[optionKey];
        }

        mergedDataLoaderOptions.cacheKeyFn = cacheKeyFn; // pass cache key fn to dataloader

        // max items in LRU cache
        if(options.lruCacheMax)
            mergedLRUCacheOptions.max = options.lruCacheMax;

        // default TTL in milliseconds for LRU cache items
        if(options.lruCacheTTL)
            mergedLRUCacheOptions.ttl = options.lruCacheTTL;

        // function to get TTL from item
        if(options.lruCacheTTLFromItem)
            mergedLRUCacheOptions.ttlFromItem = options.lruCacheTTLFromItem;

        const cacheMap = new TTLItemLRUCache(mergedLRUCacheOptions);
        super(batchLoadByKey, {
            ...mergedDataLoaderOptions,
            cacheMap: cacheMap
        });

        this._cache = cacheMap; // expose cacheMap
        this._cacheKeyFn = cacheKeyFn;
    }

    async load(...args) {
        const result = await super.load(...args);
        if(result instanceof Error) // fixes issue where subsequent loads return the error instead of throwing it
            throw result;
        return result;
    }

    /**
     * Extend dataloader, Returns cache key given the external key
     * @param key
     */
    cacheKey(key) {
        return this._cacheKeyFn(key);
    }

    get cache() {
        return this._cache;
    }

    /**
     * Adds a subscription for a key
     * @param key
     * @param callback
     * @returns {GenericSubscription}
     */
    subscribe(key, callback) {
        const cacheKey = this.cacheKey(key); // transform external key to cache key
        return this.cache.subscribe(cacheKey, callback);
    }

    /**
     * Returns number of subscribers for a key
     * @param key
     * @returns {*}
     */
    subscribers(key) {
        const cacheKey = this.cacheKey(key); // transform external key to cache key
        return this.cache.subscribers(cacheKey);
    }
}

export default TTLItemLRUCacheDataLoader;
