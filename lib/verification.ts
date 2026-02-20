// Simple singleton store for verification state
// This allows sharing state between screens without complex context refactoring
// or navigation param limitation.

let isVerified = false;
let listeners: (() => void)[] = [];

export const verificationStore = {
    getVerified: () => isVerified,

    setVerified: (value: boolean) => {
        isVerified = value;
        listeners.forEach(l => l());
    },

    subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    reset: () => {
        isVerified = false;
        listeners.forEach(l => l());
    }
};
