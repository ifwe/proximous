var httpProxy = require('http-proxy');

var Proxy = function(url) {
    // Constants
    this.POST = 'POST';
    this.GET = 'GET';
    this.ALL = 'ALL';

    // Finds all regex characters except for `*`
    this.REGEX_ESCAPE = /[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g;
    
    // Matches two or more sequential `*`
    this.REGEX_GLOB_MULTI_STAR = /\*{2,}/g;
    
    // Matches a single `*`
    this.REGEX_GLOB_SINGLE_STAR = /\*/g;

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

Proxy.prototype.excludeGet = function(pattern) {
    this.addExclusion(this.GET, pattern);
};

Proxy.prototype.excludePost = function(pattern) {
    this.addExclusion(this.POST, pattern);
};

Proxy.prototype.excludeAll = function(pattern) {
    this.addExclusion(this.ALL, pattern);
};

Proxy.prototype._toRegex = function(pattern) {
    if (pattern instanceof RegExp) {
        // Already a regex
        return pattern;
    }

    return new RegExp(
        // Match beginning of line
        "^" +
        pattern
            // Escape all regex chars except `*`
            .replace(this.REGEX_ESCAPE, '\\$&')

            // Replaces `**` with regex to match any string of characters
            .replace(this.REGEX_GLOB_MULTI_STAR, ".+")

            // Replaces `*` with regex to match any word character
            .replace(this.REGEX_GLOB_SINGLE_STAR, "\\w+") +
        // Match end of line
        "$"
    );
};

Proxy.prototype.addMatcher = function(type, pattern) {
    this.addRule(type, pattern, true);
};

Proxy.prototype.addExclusion = function(type, pattern) {
    this.addRule(type, pattern, false);
};

Proxy.prototype.addRule = function(type, pattern, match) {
    var regex = this._toRegex(pattern);
    this.matchers.push({
        GET: (type === this.GET || type === this.ALL),
        POST: (type === this.POST || type === this.ALL),
        pattern: regex,
        match: match
    });
};

Proxy.prototype.isMatch = function(type, url) {
    var matcher;

    for (var i = this.matchers.length - 1; i >= 0; i--) {
        matcher = this.matchers[i];

        if (matcher[type] === false) {
            continue;
        }

        if (matcher.pattern.test(url)) {
            return matcher.match;
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
