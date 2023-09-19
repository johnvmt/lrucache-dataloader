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
        // handle this in the cache instead of the dataloader, as would be standard
        if(options.cacheKeyFn)
            mergedLRUCacheOptions.keyFn = options.cacheKeyFn;

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
    }

    async load(...args) {
        const result = await super.load(...args);
        if(result instanceof Error) // fixes issue where subsequent loads return the error instead of throwing it
            throw result;
        return result;
    }

    get cache() {
        return this._cache;
    }
}

export default TTLItemLRUCacheDataLoader;
