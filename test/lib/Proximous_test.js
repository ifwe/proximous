/*jshint expr: true*/
var Proximous = require(LIB_DIR + '/Proximous');
var httpProxy = require('http-proxy');

describe('Proximous', function() {
    beforeEach(function() {
        this.proxyStub = { web: sinon.spy() };
        sinon.stub(httpProxy, 'createProxyServer').returns(this.proxyStub);
        this.proxy = new Proximous('http://foo.bar');
    });

    afterEach(function() {
        httpProxy.createProxyServer.restore();
    });

    describe('middleware()', function() {
        beforeEach(function() {
            this.proxy.matchGet('/get');
            this.proxy.matchPost('/post');
            this.proxy.matchAll('/all');
            this.proxy.matchGet('/glob/get/*/index.html');
            this.proxy.matchPost('/glob/post/*/index.html');
            this.proxy.matchAll('/glob/all/*/index.html');
            this.proxy.matchGet('/glob2/get/**/index.html');
            this.proxy.matchPost('/glob2/post/**/index.html');
            this.proxy.matchAll('/glob2/all/**/index.html');
            this.proxy.matchGet(/foo/);
            this.proxy.matchPost(/bar/);
            this.proxy.matchAll(/baz/);
            this.proxy.matchAll(/derp/);
            this.proxy.excludeGet('/exclude/get/derp');
            this.proxy.excludePost('/exclude/post/derp');
            this.proxy.excludeAll('/exclude/all/derp');
            this.middleware = this.proxy.middleware();
            this.res = {};
            this.nextSpy = sinon.spy();
        });

        var matchingRequests = [
            { method: 'GET', url: '/get' },
            { method: 'GET', url: '/anything/foo/anything' },
            { method: 'GET', url: '/anything/baz/anything' },
            { method: 'GET', url: '/anything/derp/anything' },
            { method: 'POST', url: '/post' },
            { method: 'POST', url: '/anything/bar/anything' },
            { method: 'POST', url: '/anything/baz/anything' },
            { method: 'POST', url: '/anything/derp/anything' },
            { method: 'GET', url: '/all' },
            { method: 'POST', url: '/all' },

            // Globs
            { method: 'GET', url: '/glob/get/anything/index.html' },
            { method: 'POST', url: '/glob/post/anything/index.html' },
            { method: 'GET', url: '/glob/all/anything/index.html' },
            { method: 'POST', url: '/glob/all/anything/index.html' },
            { method: 'GET', url: '/glob2/get/anything/anything/anything/index.html' },
            { method: 'POST', url: '/glob2/post/anything/anything/anything/index.html' },
            { method: 'GET', url: '/glob2/all/anything/anything/anything/index.html' },
            { method: 'POST', url: '/glob2/all/anything/anything/anything/index.html' }
        ];

        var nonMatchingRequests = [
            { method: 'GET', url: '/nomatch' }, // url does not match
            { method: 'GET', url: '/post' }, // method does not match
            { method: 'GET', url: '/anything/bar/anything' }, // url does not match regex for GET
            { method: 'POST', url: '/nomatch' }, // url does not match
            { method: 'POST', url: '/get' }, // method does not match
            { method: 'POST', url: '/anything/foo/anything' }, // url does not match regex for POST
            { method: 'GET', url: '/exclude/get/derp' }, // url is excluded for GET
            { method: 'POST', url: '/exclude/post/derp' }, // url is excluded for POST
            { method: 'GET', url: '/exclude/all/derp' }, // url is excluded for ALL
            { method: 'POST', url: '/exclude/all/derp' }, // url is excluded for ALL

            // Globs
            { method: 'GET', url: '/glob/get/anything/anything/anything/index.html' }, // Not a multi-glob
            { method: 'POST', url: '/glob/post/anything/anything/anything/index.html' }, // Not a multi-glob
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

    describe('events', function() {
        beforeEach(function() {
            this.proxy.matchGet('/get');
            this.middleware = this.proxy.middleware();
        });

        describe('onMatch()', function() {
            beforeEach(function() {
                this.req = { method: 'GET', url: '/get' };
                this.res = {};
            });

            it('emits proxy:match event', function(done) {
                var handler = function(_req, _res) {
                    _req.should.equal(this.req);
                    _res.should.equal(this.res);
                    done();
                }.bind(this);
                this.proxy.onMatch(handler);
                this.middleware(this.req, this.res);
            });

            it('does not emit proxy:exclude event', function(done) {
                var handler = function(_req, _res) {
                    done('proxy:exclude event should not have been emitted');
                }.bind(this);
                this.proxy.onNotMatch(handler);
                this.middleware(this.req, this.res);
                setTimeout(done, 10);
            });
        });

        describe('onNotMatch()', function() {
            beforeEach(function() {
                this.req = { method: 'GET', url: '/no-match' };
                this.res = {};
                this.nextSpy = sinon.spy();
            });

            it('emits proxy:exclude event', function(done) {
                var handler = function(_req, _res) {
                    // console.log(_req, _res);
                    _req.should.equal(this.req);
                    _res.should.equal(this.res);
                    done();
                }.bind(this);
                this.proxy.onNotMatch(handler);
                this.middleware(this.req, this.res, this.nextSpy);
            });

            it('does not emit proxy:match event', function(done) {
                var handler = function(_req, _res) {
                    done('proxy:match event should not have been emitted');
                }.bind(this);
                this.proxy.onMatch(handler);
                this.middleware(this.req, this.res, this.nextSpy);
                setTimeout(done, 10);
            });
        });
    });

    describe('callbacks', function() {
        it('proxies request if callback calls result with `true`', function(done) {
            var _this = this;
            var req = { method: 'GET', url: '/get' };
            var res = {};
            var nextSpy = sinon.spy();
            this.proxy.matchGet('/get', function(req, res, result) {
                setTimeout(function() {
                    result(true);
                    _this.proxyStub.web.calledOnce.should.be.true;
                    _this.proxyStub.web.calledWith(req, res, { target: 'http://foo.bar' }).should.be.true;
                    nextSpy.called.should.be.false;
                    done();
                });
            });
            var middleware = this.proxy.middleware();
            middleware(req, res, nextSpy);
        });

        it('does not proxy request if callback calls result with `false`', function(done) {
            var req = { method: 'GET', url: '/get' };
            var res = {};
            var nextSpy = sinon.spy();
            this.proxy.matchGet('/get', function(req, res, result) {
                setTimeout(function() {
                    result(false);
                    nextSpy.called.should.be.true;
                    done();
                });
            });
            var middleware = this.proxy.middleware();
            middleware(req, res, nextSpy);
        });
    });
});
