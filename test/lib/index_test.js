/*jshint expr: true*/
var factory = require(LIB_DIR);
var Proximous = require(LIB_DIR + '/Proximous');

describe('Proximous', function() {
    beforeEach(function() {
        this.options = {
            foo:'bar'
        };
        factory.Proximous = sinon.spy();
        this.proxy = factory('http://foo.bar',this.options);
    });

    it('is a function', function() {
        factory.should.be.a('function');
    });

    it('returns a proxy instance', function() {
        this.proxy.should.be.a('object');
    });

    it('contains a url argument', function() {
        factory.Proximous.lastCall.args[0].should.equal('http://foo.bar');
    });

    it('passes options as second argument to new proximous constructor',function(){
        factory.Proximous.calledWithNew().should.be.true;
        factory.Proximous.lastCall.args[1].should.equal(this.options);
    });
});
