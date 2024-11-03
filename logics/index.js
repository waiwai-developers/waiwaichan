const loadModule = async () => {
    return await import('./index.mjs');
};

module.exports = loadModule;
