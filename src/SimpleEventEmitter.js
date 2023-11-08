class SimpleEventEmitter {
    constructor() {
        this._allEventListeners = new Set();
        this._allEventOnceListeners = new Set();

        this._namedEventListeners = new Map();
        this._namedEventOnceListeners = new Map();
    }

    allOn(allListener) {
        this._allEventListeners.add(allListener);
    }

    allOnce(allListener) {
        this.allOn(allListener);
        this._allEventOnceListeners.add(allListener);
    }

    allOff(allListener) {
        this._allEventListeners.delete(allListener);
        this._allEventOnceListeners.delete(allListener);
    }

    on(eventName, listener) {
        this.off(eventName, listener); // remove event listener before trying to re-add

        if(!this._namedEventListeners.has(eventName))
            this._namedEventListeners.set(eventName, new Set());

        this._namedEventListeners.get(eventName).add(listener);
    }

    once(eventName, listener) {
        this.on(eventName, listener);

        if(!this._namedEventOnceListeners.has(eventName))
            this._namedEventOnceListeners.set(eventName, new Set());

        const onceEventListeners = this._namedEventOnceListeners.get(eventName);

        onceEventListeners.add(listener);
    }

    off(eventName, listener) {
        if(this._namedEventListeners.has(eventName)) {
            const listeners = this._namedEventListeners.get(eventName);
            listeners.delete(listener);

            if(listeners.size === 0)
                this._namedEventListeners.delete(eventName);
        }

        if(this._namedEventOnceListeners.has(eventName)) {
            const listeners = this._namedEventOnceListeners.get(eventName);
            listeners.delete(listener);

            if(listeners.size === 0)
                this._namedEventOnceListeners.delete(eventName);
        }
    }

    listenerCount(eventName) {
        const onListenerCount = this._namedEventListeners.has(eventName)
            ? this._namedEventListeners.get(eventName).size
            : 0;

        const onceListenerCount = this._namedEventOnceListeners.has(eventName)
            ? this._namedEventOnceListeners.get(eventName).size
            : 0;

        return onListenerCount + onceListenerCount;
    }

    emit(eventName, ...args) {
        // emit to all-event listeners first
        for(const allListener of this._allEventListeners) {
            try {
                allListener(eventName, ...args);

                if(this._allEventOnceListeners.has(allListener)) // once listener
                    this.allOff(allListener);
            }
            catch(error) {
                if(this._namedEventListeners.has("error")) // has error listeners
                    this.emit("error", error);
                else
                    throw error;
            }

        }

        if(this._namedEventListeners.has(eventName)) {
            for(const listener of this._namedEventListeners.get(eventName)) {
                try {
                    listener(...args);

                    if(this._namedEventOnceListeners.has(eventName) && this._namedEventOnceListeners.get(eventName).has(listener)) // once listener
                        this.off(eventName, listener);
                }
                catch(error) {
                    if(this._namedEventListeners.has("error")) // has error listeners
                        this.emit("error", error);
                    else
                        throw error;
                }
            }
        }
    }
}

export default SimpleEventEmitter;