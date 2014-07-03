var Proxy = require(LIB_DIR + '/Proxy.js');

describe('Proxy', function() {
    beforeEach(function() {
        this.proxy = new Proxy('http://foo.bar');
    });

    describe('matchGet', function(){
        it('should be a function', function() {
            this.proxy.matchGet.should.be.a('function');
        });
    });

    describe('isMatch', function() {
        it('matches get with exact string match', function() {
            this.proxy.matchGet('/index.html');
            this.proxy.isMatch('get', '/index.html').should.be.true;
        });
        it('doesn\'t match get with exact string match', function() {
            this.proxy.matchGet('/home.html');
            this.proxy.isMatch('get', '/index.html').should.be.false;
        });       
        it('returns false if type doesn\'t match', function() {
            this.proxy.matchGet('/index.html');
            this.proxy.isMatch('post', '/index.html').should.be.false;
        });
        it('returns true if type and url matches any of the matchers', function() {
            this.proxy.matchGet('/index.html');
            this.proxy.matchGet('/index1.html');
            this.proxy.matchGet('/index2.html');
            this.proxy.isMatch('get', '/index1.html').should.be.true;
        });

        it('matches post with exact string match', function() {
            this.proxy.matchPost('/index.html');
            this.proxy.isMatch('post', '/index.html').should.be.true;
        });

        it('matches all with exact string match', function() {
            this.proxy.matchAll('/index.html');
            this.proxy.isMatch('post', '/index.html').should.be.true;
            this.proxy.isMatch('get', '/index.html').should.be.true;
        });

        it('matches get with regex', function() {
            this.proxy.matchGet(/bar/);
            this.proxy.isMatch('get', '/foo/bar.html').should.be.true;
        });
    });
});
