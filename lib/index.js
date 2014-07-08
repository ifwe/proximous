var Proximous = require('./Proximous');

module.exports = function(url) {
    // Factory function to create proxy objects

    // return instance
    return new Proximous(url);
};
