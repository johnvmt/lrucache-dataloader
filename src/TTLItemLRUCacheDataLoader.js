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
        if(options.cacheKeyFn)
            mergedDataLoaderOptions.cacheKeyFn = options.cacheKeyFn;

        // max items in LRU cache
        if(options.lruCacheMax)
            mergedLRUCacheOptions.max = options.lruCacheMax;

        // default TTL in milliseconds for LRU cache items
        if(options.lruCacheTTL)
            mergedLRUCacheOptions.ttl = options.lruCacheTTL;

        // function to get TTL from item
        if(options.lruCacheTTLFromItem)
            mergedLRUCacheOptions.ttlFromItem = options.lruCacheTTLFromItem;

        super(batchLoadByKey, {
            ...mergedDataLoaderOptions,
            cacheMap: new TTLItemLRUCache(mergedLRUCacheOptions)
        });
    }
}

export default TTLItemLRUCacheDataLoader;
