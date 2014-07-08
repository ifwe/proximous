var httpProxy = require('http-proxy');
var EventEmitter = require('events').EventEmitter;

var Proximous = function(url) {
    // Constants
    this.POST = 'POST';
    this.GET = 'GET';
    this.ALL = 'ALL';

    // Events
    this.EVENT_MATCH = 'proxy:match';
    this.EVENT_NOT_MATCH = 'proxy:not_match';

    // provided url argument is assigned to the object
    this.url = url;
    this.matchers = [];

    // Web proxy
    this._proxy = httpProxy.createProxyServer();

    // Event emitter
    this.eventEmitter = new EventEmitter();
};

Proximous.prototype.matchGet = function(pattern) {
    this.addMatcher(this.GET, pattern);
};

Proximous.prototype.matchPost = function(pattern) {
    this.addMatcher(this.POST, pattern);
};

Proximous.prototype.matchAll = function(pattern) {
    this.addMatcher(this.ALL, pattern);
};

Proximous.prototype.excludeGet = function(pattern) {
    this.addExclusion(this.GET, pattern);
};

Proximous.prototype.excludePost = function(pattern) {
    this.addExclusion(this.POST, pattern);
};

Proximous.prototype.excludeAll = function(pattern) {
    this.addExclusion(this.ALL, pattern);
};

Proximous.prototype._toRegex = function(pattern) {
    if (pattern instanceof RegExp) {
        // Already a regex
        return pattern;
    }

    return new RegExp(
        // Match beginning of line
        "^" +
        pattern
            // Escape all regex chars except `*`
            .replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&')

            // Replaces `**` with regex to match any string of characters
            .replace(/\*{2,}/g, ".+")

            // Replaces `*` with regex to match any word character
            .replace(/\*/g, "\\w+") +
        // Match end of line
        "$"
    );
};

Proximous.prototype.addMatcher = function(type, pattern) {
    this.addRule(type, pattern, true);
};

Proximous.prototype.addExclusion = function(type, pattern) {
    this.addRule(type, pattern, false);
};

Proximous.prototype.addRule = function(type, pattern, match) {
    var regex = this._toRegex(pattern);
    this.matchers.push({
        GET: (type === this.GET || type === this.ALL),
        POST: (type === this.POST || type === this.ALL),
        pattern: regex,
        match: match
    });
};

Proximous.prototype.isMatch = function(type, url) {
    var matcher;
    var event;

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

// # Events
Proximous.prototype.onMatch = function(handler) {
    this.eventEmitter.on(this.EVENT_MATCH, handler);
};

Proximous.prototype.onNotMatch = function(handler) {
    this.eventEmitter.on(this.EVENT_NOT_MATCH, handler);
};

// Returns a function that can be used as Connect middleware. Connect expects the function to accept up to 3 arguments:
// 1. req: This request made by the client.
// 2. res: The response object that our web server will respond with.
// 3. next: A function that, if called, will iterate to the next middleware handler.
Proximous.prototype.middleware = function() {
    return function(req, res, next) {
        // Check if the request matches the configured list of methods/URLs to be proxied.
        var isMatch = this.isMatch(req.method, req.url);
        
        if (!isMatch) {
            // The request does not match any of the configured URLs/methods.
            // Emit a proxy exclude event
            this.eventEmitter.emit(this.EVENT_NOT_MATCH, req, res);

            // Continue to next middleware.
            return next();
        }

        // Emit a proxy match event
        this.eventEmitter.emit(this.EVENT_MATCH, req, res);

        // Proxy this request to the target host.
        this._proxy.web(req, res, {
            target: this.url
        });
    // Ensure function is bound to the correct scope when invoked by Connect
    }.bind(this);
};

module.exports = Proximous;
