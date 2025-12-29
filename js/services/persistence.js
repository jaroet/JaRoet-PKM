(function(J) {
    const requestPersistence = async () => {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persisted();
            if (isPersisted) return true;
            
            const granted = await navigator.storage.persist();
            console.log(`Storage persistence request: ${granted ? 'GRANTED' : 'DENIED'}`);
            return granted;
        }
        return false;
    };

    const checkPersistence = async () => {
        if (navigator.storage && navigator.storage.persisted) {
            return await navigator.storage.persisted();
        }
        return false;
    };

    J.Services.Persistence = {
        requestPersistence,
        checkPersistence
    };
})(window.Jaroet);