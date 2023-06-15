# lrucache-dataloader
Node.js Data Loader with LRU cache and configurable TTL per item

## Example

    import {TTLItemLRUCacheDataLoader} from "lrucache-dataloader";
    
    const loader = async (keys) => {
        console.log("GET", keys);
        await sleep(1000);
        return keys.map(key => {
            return {
                key: key,
                value: new Date(),
                ttl: 3000
            }
        });
    }
    
    const userLoader = new TTLItemLRUCacheDataLoader(loader, {
        lruCacheMax: 100,
        lruCacheTTL: 5000, // default TTL
        lruCacheTTLFromItem: (item) => {
            return item.ttl;
        },
        lruCacheValueFromItem: (item) => {
            return item.value;
        }
    });
    
    (async () => {
        console.log("PRE", await userLoader.load('1000'));
        await sleep(1000);
        console.log("POST", await userLoader.load('1000'));
    })();
