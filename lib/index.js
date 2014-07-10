var Proximous = require('./Proximous');
var factory =  function(url,options) {
    // Factory function to create proxy objects

    // return instance
    return new factory.Proximous(url,options);
};

factory.Proximous = Proximous;
module.exports = factory;
