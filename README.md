Egress - a pragmatic router
===========================

Introduction
------------

Egress is a routing module indended primarily for the creation of RESTful interfaces with an intuitive and powerful and intuitive API.

Usage Guide
-----------

	var Route = require('egress').Route;

You will mostly work with the `Route` class to build routes. A `Route` has both response functions and child routes. Child routes are accessed with the `Route#path` function. Child routes are *implicit*, meaning they are created by `path` if they don't exist yet. If ambiguous routes are requested (generally multiple ':param' nodes), `path` will throw an error.

`Route` objects can be combined with `Route#append`, which is essentially an explicit form of `path`. You will usually need to create at least one `Route` with which to build all others, and that can be done with:

	var root = new Route();
	
This will create an empty route which represents the root path `/`. You can also initialize the `Route` with a path:

	var account = new Route('/account');
	
Egress is very tolerant of slashes before and after routes, so `new Route('account')` and `new Route('account/')` would have behaved the same way.

Do add HTTP method responses to a route, you use the `Route#method` functions. Available methods are:

`Route#get`
`Route#post`
`Route#put`
`Route#delete`
`Route#head`
`Route#options`

They take the form: `Route#method(<callback>)` where callback is `function (req, res)`. Methods can be chained together with the `.` operator, for example:

	root.path('/account/:account/messages')
		.get(function(req, res) {
		
		})
		.post(function(req, res) {
		
		});
		
The `Route#pre(<callback>)` function allows work to be done before checking a `Route`'s methods or children. The callback takes the form `function(req, res, next)` and `next()` must be called by the function for routing to continue, as in Connect middleware. `Route#pre` will be evaluated before any method functions on that `Route`.

	myRoute.path('a').path('b').path('c') === myRoute.path('a/b/c')
	
	true

API
---
