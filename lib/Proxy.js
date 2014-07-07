var httpProxy = require('http-proxy');

var Proxy = function(url) {
    // Constants
    this.POST = 'POST';
    this.GET = 'GET';
    this.ALL = 'ALL';

    // provided url argument is assigned to the object
    this.url = url;
    this.matchers = [];

    // Web proxy
    this._proxy = httpProxy.createProxyServer();
};

Proxy.prototype.matchGet = function(pattern) {
    this.addMatcher(this.GET, pattern);
};

Proxy.prototype.matchPost = function(pattern) {
    this.addMatcher(this.POST, pattern);
};

Proxy.prototype.matchAll = function(pattern) {
    this.addMatcher(this.ALL, pattern);
};

Proxy.prototype.addMatcher = function(type, pattern) {
    var regex;

    if (typeof pattern === "string") {
         regex = new RegExp("^" + pattern.replace(
            /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
            "\\$&") + "$"
         );
    } else {
        regex = pattern;
    }

    this.matchers.push({
        GET: (type === this.GET || type === this.ALL),
        POST: (type === this.POST || type === this.ALL),
        pattern: regex
    });
};

Proxy.prototype.isMatch = function(type, url) {
    // TODO: Make this LIFO instead of FIFO
    for (var i in this.matchers) {
        if (this.matchers[i][type] === false) {
            continue;
        }

        // Assume regex
        if (this.matchers[i].pattern.test(url)) {
            return true;
        }
    }

    return false;
};

// Returns a function that can be used as Connect middleware. Connect expects the function to accept up to 3 arguments:
//   1. req: This request made by the client.
//   2. res: The response object that our web server will respond with.
//   3. next: A function that, if called, will iterate to the next middleware handler.
Proxy.prototype.middleware = function() {
    return function(req, res, next) {
        // Check if the request matches the configured list of methods/URLs to be proxied.
        if (!this.isMatch(req.method, req.url)) {
            // The request does not match any of the configured URLs/methods, continue to next middleware.
            return next();
        }

        // Proxy this request to the target host.
        this._proxy.web(req, res, {
            target: this.url
        });
    // Ensure function is bound to the correct scope when invoked by Connect
    }.bind(this);
};

module.exports = Proxy;
