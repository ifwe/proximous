/*jshint expr: true*/
var Proxy = require(LIB_DIR + '/Proxy');
var httpProxy = require('http-proxy');

describe('Proxy', function() {
    beforeEach(function() {
        this.proxyStub = { web: sinon.spy() };
        sinon.stub(httpProxy, 'createProxyServer').returns(this.proxyStub);
        this.proxy = new Proxy('http://foo.bar');
    });

    afterEach(function() {
        httpProxy.createProxyServer.restore();
    });

    describe('matchGet()', function() {
        it('should be a function', function() {
            this.proxy.matchGet.should.be.a('function');
        });
    });

    describe('isMatch()', function() {
        it('matches get with exact string match', function() {
            this.proxy.matchGet('/index.html');
            this.proxy.isMatch('GET', '/index.html').should.be.true;
        });

        it('doesn\'t match get with exact string match', function() {
            this.proxy.matchGet('/home.html');
            this.proxy.isMatch('GET', '/index.html').should.be.false;
        });

        it('returns false if type doesn\'t match', function() {
            this.proxy.matchGet('/index.html');
            this.proxy.isMatch('POST', '/index.html').should.be.false;
        });

        it('returns true if type and url matches any of the matchers', function() {
            this.proxy.matchGet('/index.html');
            this.proxy.matchGet('/index1.html');
            this.proxy.matchGet('/index2.html');
            this.proxy.isMatch('GET', '/index1.html').should.be.true;
        });

        it('matches post with exact string match', function() {
            this.proxy.matchPost('/index.html');
            this.proxy.isMatch('POST', '/index.html').should.be.true;
        });

        it('matches all with exact string match', function() {
            this.proxy.matchAll('/index.html');
            this.proxy.isMatch('POST', '/index.html').should.be.true;
            this.proxy.isMatch('GET', '/index.html').should.be.true;
        });

        it('matches get with regex', function() {
            this.proxy.matchGet(/bar/);
            this.proxy.isMatch('GET', '/foo/bar.html').should.be.true;
        });

        it('matches post with regex', function() {
            this.proxy.matchPost(/bar/);
            this.proxy.isMatch('POST', '/foo/bar.html').should.be.true;
        });
    });

    describe('middleware()', function() {
        beforeEach(function() {
            this.proxy.matchGet('/get');
            this.proxy.matchPost('/post');
            this.proxy.matchAll('/all');
            this.proxy.matchGet(/foo/);
            this.proxy.matchPost(/bar/);
            this.proxy.matchAll(/baz/);
            this.middleware = this.proxy.middleware();
            this.res = {};
            this.nextSpy = sinon.spy();
        });

        var matchingRequests = [
            { method: 'GET', url: '/get' },
            { method: 'GET', url: '/anything/foo/anything' },
            { method: 'GET', url: '/anything/baz/anything' },
            { method: 'POST', url: '/post' },
            { method: 'POST', url: '/anything/bar/anything' },
            { method: 'POST', url: '/anything/baz/anything' },
            { method: 'GET', url: '/all' },
            { method: 'POST', url: '/all' }
        ];

        var nonMatchingRequests = [
            { method: 'GET', url: '/nomatch' }, // url does not match
            { method: 'GET', url: '/post' }, // method does not match
            { method: 'GET', url: '/anything/bar/anything' }, // url does not match regex for GET
            { method: 'POST', url: '/nomatch' }, // url does not match
            { method: 'POST', url: '/get' }, // method does not match
            { method: 'POST', url: '/anything/foo/anything' } // url does not match regex for POST
        ];

        matchingRequests.forEach(function(req) {
            it('proxies matching request: ' + JSON.stringify(req), function() {
                this.middleware(req, this.res, this.nextSpy);
                this.proxyStub.web.calledOnce.should.be.true;
                this.proxyStub.web.calledWith(req, this.res, { target: 'http://foo.bar' }).should.be.true;
                this.nextSpy.called.should.be.false;
            });
        });

        nonMatchingRequests.forEach(function(req) {
            it('does not proxy non-matching request: ' + JSON.stringify(req), function() {
                this.middleware(req, this.res, this.nextSpy);
                this.proxyStub.web.called.should.be.false;
                this.nextSpy.called.should.be.true;
            });
        });
    });
});
