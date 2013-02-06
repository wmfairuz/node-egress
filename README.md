Egress - a pragmatic router
===========================

Introduction
------------

Egress is a routing module indended primarily for the creation of RESTful APIs.

Usage Guide
-----------

	var Router = require('egress').Router;

You will mostly work with the `Router` class to build routes. A `Router` has both response functions and child routes. The `Router#path` function returns a `Route`. Routes are implicit, meaning they are created by `path` if they don't exist yet. If ambiguous routes are requested, `path` will throw an error.

`Router` objects can be combined with `Router#append`. This allows you do modularize your route definitions, for example:

	var root = new Router();
	
	var articles = new Router();
	articles.path(':id')
		.get(function(req, res) {
			/* Render and return the article */
		})
		.del(function(req, res) {
			/* Delete the article */
		});
		
	root.append('articles', articles);
	
	/* root now has the route '/articles/:id' which will accept GET and DELETE requests */
	
> Note: combining routes is very messy right now, and should only be done once routes are completely built, as route information is copied over rather than kept as a reference.

To add HTTP method responses to a route, you use the method functions. Available methods are:

* `Route#get` GET
* `Router#post` POST
* `Route#put` PUT
* `Router#del` DELETE
* `Route#head` HEAD
* `Router#options` OPTIONS

They take the form: `Route#<method>(<callback>)` where callback is `function (req, res)`. Methods can be chained together with the `.` operator, for example:

	root.path('/account/:account/messages')
		.get(function(req, res) {
		
		})
		.post(function(req, res) {
		
		});
		
The `Route#pre(<callback>)` function allows work to be done before checking a route's methods or children. The callback takes the form `function(req, res, next)` and `next()` must be called by the callback for routing to continue. `Route#pre` will be evaluated before any method functions on that `Route`.

Egress is *just* a router, not a framework. You can use it in your own framework by calling `Router#resolve(path, req, res, next)`. `next()` will be called by the router if no routes are matched (i.e. 404). The path argument should just be the pathname, with no host or query information. Egress can also easily be used with Connect or another Connect-campatible framework with the `Router#middleware()` function, e.g.:

	var root = new Router();
	
	...

	var server = connect().
		use(connect.logger()).
		use(root.middleware()).
		use(function(req, res) {
			res.statusCode = 404;
			res.end('404 Not Found\n');
		}).
	    listen(8080);
