# Proximous - NPM Module

Proximous allows you to easily proxy some or all requests to a destination server. All requests that
are not proxied will be passed through to the Express app.

## Usage

    // Load the module
    var proximous = require('proximous');

    // Create a proxy with target destination using factory function
    var proxy = proximous('http://www.mysite.com:80');
    // or
    var proxy = proximous({
        host: 'www.mysite.com',
        secure: false,
        port: 80
    });

    // Configure proxy, uses LIFO when checking requests.

    // all requests to '/index.html' are proxied, including GET and POST
    proxy.matchAll('/index.html');

    // proxy only GET requests that match URL
    proxy.matchGet('/home.html');

    // proxy only POST requests that match URL
    proxy.matchPost('/register.html');

    // proxy using wildcards
    proxy.matchGet('/css/*.css'); // matches '/css/styles.css' as well as '/css/subdir/morestyles.css'

    // proxy using regular expression
    proxy.matchGet(/^\/css\/.*\.css$/); // same as '/css/*.css'

    // proxy everything!
    proxy.matchAll('*');

    // blacklist ensures matched URLs are not proxied
    proxy.excludeGet('/profile/*');            // ensures that all profile pages are never proxied
    proxy.excludePost('/submit-photo.html');   // POSTs to this URL will never be proxied
    proxy.excludeAll('/chat.html');            // GETs and POSTs to this URL will never be proxied

    // Observe events
    proxy.onMatch(function(req, res) {
        // Will be called each time a request matches the proxy configuration
    });

    proxy.onNotMatch(function(req, res) {
        // Will be called each time a request does not match the proxy configuration
    });

    // Register callbacks to bypass rule matching (supports async!)
    proxy.matchGet('/foo/bar', function(req, res, result) {
        setTimeout(function() {
            result(true); // or `false` to force a no-match
        }, 100);
    });

    // Once configured, set up proxy as middleware
    var http = require('http');
    var express = require('express');
    var app = express();
    app.use(proxy.middleware());

    http.createServer(app).listen(3000, function() {
        console.log('Express server with proxy listening on port 3000');
    });
