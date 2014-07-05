var Proxy = function(url) {
    // provided url argument is assigned to the object
    this.url = url;
    this.matchers = [];
};

/**
* @method matchGet
*   
* @param pattern {String}
*/
Proxy.prototype.matchGet = function(pattern) {
    this.addMatcher('get', pattern);
};

Proxy.prototype.matchPost = function(pattern) {
    this.addMatcher('post', pattern);
};

Proxy.prototype.matchAll = function(pattern) {
    this.addMatcher('all', pattern);
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
        get: (type === 'get' || type === 'all'),
        post: (type === 'post' || type === 'all'),
        pattern: regex

    });
};

Proxy.prototype.isMatch = function(type, url) {
    for (var i in this.matchers) {
        if (this.matchers[i][type] === false) {
            continue;
        }

        //Assume regex
        if (this.matchers[i].pattern.test(url)) {
            return true;
        }
    }

    return false;
};

module.exports = Proxy;
