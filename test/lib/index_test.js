var proximity = require(LIB_DIR);

describe('Proximous', function() {

    beforeEach(function(){
        this.proxy = proximity('http://foo.bar');
    });

    it('is a function', function() {
        proximity.should.be.a('function');
    });
    it('returns a proxy instance', function(){
        this.proxy.should.be.a('object');
    });
    it('contains a url argument', function(){

        this.proxy.should.have.property('url', 'http://foo.bar');
    });
});
