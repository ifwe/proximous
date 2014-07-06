/*jshint expr: true*/
var proximous = require(LIB_DIR);

describe('Proximous', function() {

    beforeEach(function() {
        this.proxy = proximous('http://foo.bar');
    });

    it('is a function', function() {
        proximous.should.be.a('function');
    });

    it('returns a proxy instance', function() {
        this.proxy.should.be.a('object');
    });

    it('contains a url argument', function() {
        this.proxy.should.have.property('url', 'http://foo.bar');
    });
});
