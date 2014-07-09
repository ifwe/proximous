var httpProxy = require('http-proxy');
var EventEmitter = require('events').EventEmitter;

// Constants
var POST = 'POST';
var GET = 'GET';
var ALL = 'ALL';

// Events
var EVENT_MATCH = 'proxy:match';
var EVENT_NOT_MATCH = 'proxy:not_match';

var Proximous = function(url) {
    // provided url argument is assigned to the object
    this.url = url;
    this.matchers = [];

    // Web proxy
    this._proxy = httpProxy.createProxyServer();

    // Event emitter
    this.eventEmitter = new EventEmitter();
};

Proximous.prototype.matchGet = function(pattern, callback) {
    this.addMatcher(GET, pattern, callback);
};

Proximous.prototype.matchPost = function(pattern, callback) {
    this.addMatcher(POST, pattern, callback);
};

Proximous.prototype.matchAll = function(pattern, callback) {
    this.addMatcher(ALL, pattern, callback);
};

Proximous.prototype.excludeGet = function(pattern, callback) {
    this.addExclusion(GET, pattern, callback);
};

Proximous.prototype.excludePost = function(pattern, callback) {
    this.addExclusion(POST, pattern, callback);
};

Proximous.prototype.excludeAll = function(pattern, callback) {
    this.addExclusion(ALL, pattern, callback);
};

Proximous.prototype.addMatcher = function(method, pattern, callback) {
    this.addRule(method, pattern, true, callback);
};

Proximous.prototype.addExclusion = function(method, pattern, callback) {
    this.addRule(method, pattern, false, callback);
};

Proximous.prototype.addRule = function(method, pattern, match, callback) {
    var regex = patternToRegex(pattern);
    this.matchers.push({
        GET: (method === GET || method === ALL),
        POST: (method === POST || method === ALL),
        pattern: regex,
        match: match,
        callback: callback
    });
};

Proximous.prototype.isMatch = function(req, res, result) {
    var matcher;
    var event;
    var method = req.method;
    var url = req.url;

    for (var i = this.matchers.length - 1; i >= 0; i--) {
        matcher = this.matchers[i];

        if (false === matcher[method]) {
            // This matcher does not handle this method, so
            // continue to the next matcher
            continue;
        }

        if (matcher.pattern.test(url)) {
            if (matcher.callback) {
                // This matcher has a callback configured,
                // which can be used to modify the result.
                return matcher.callback(req, res, result);
            } else {
                // No callback is defined for this matcher,
                // so call `result()` immediately
                return result(matcher.match);
            }
        }
    }

    // Default to false if none of the rules match the request.
    return result(false);
};

// # Events
Proximous.prototype.onMatch = function(handler) {
    this.eventEmitter.on(EVENT_MATCH, handler);
};

Proximous.prototype.onNotMatch = function(handler) {
    this.eventEmitter.on(EVENT_NOT_MATCH, handler);
};

// Returns a function that can be used as Connect middleware. Connect expects the function
// to accept up to 3 arguments:
//   1. req: This request made by the client.
//   2. res: The response object that our web server will respond with.
//   3. next: A function that, if called, will iterate to the next middleware handler.
Proximous.prototype.middleware = function() {
    return function(req, res, next) {
        // Check if the request matches the configured list of methods/URLs to be proxied.
        this.isMatch(req, res, function(isMatch) {
            if (!isMatch) {
                // The request does not match any of the configured URLs/methods.
                // Emit a proxy exclude event
                this.eventEmitter.emit(EVENT_NOT_MATCH, req, res);

                // Continue to next middleware.
                return next();
            }

            // Emit a proxy match event
            this.eventEmitter.emit(EVENT_MATCH, req, res);

            // Proxy this request to the target host.
            this._proxy.web(req, res, {
                target: this.url
            });
        }.bind(this));
        
    // Ensure function is bound to the correct scope when invoked by Connect
    }.bind(this);
};

function patternToRegex(pattern) {
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
}

module.exports = Proximous;
