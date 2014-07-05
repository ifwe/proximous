var Proxy = require('./Proxy');

module.exports = function(url) {
    // Factory function to create proxy objects

    // return instance
    return new Proxy(url);
};
