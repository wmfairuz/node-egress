var url = require('url');

function Route( path ) {
    var self = this;

    path = '/' + (path.trim()
		  .replace(/^\/+/, '')
		  .replace(/\/+$/, ''));

    self.path = path;

    //Transform the path into a regexp
    self.paramNames = [];
    var regex = path.replace(/:(\w+)/g, function(match, p1) {
	self.paramNames.push(p1);
	return '([\\w%:\\$\\+]+)';
    });

    regex = '^' + regex + '/?';

    self.regex = new RegExp(regex);

    self.methods = { };
    
    [   'get',
	'post',
	'put',
	'del',
	'head',
	'options',
	'patch'
    ].forEach(function ( method ) {
	self[method] = function ( callback ) {
	    self.methods[method] = callback;

	    return self;
	};
    });

    self.pre = function( callback ) {
	self.methods.pre = callback;

	return self;
    };

    self.resolve = function(path, req, res, next) {
	var results = path.match(self.regex);
	if(results) {
	    var params = {};

	    for(var i = 0; i < self.paramNames.length; i++) {
		var name = self.paramNames[i];
		params[name] = decodeURI(decodeURIComponent(results[i+1]));
	    }

	    req.params = params;

	    if(results[0] == results.input) {
		function doMethod() {
		    var method = ({
			'GET': 'get',
			'POST': 'post',
			'OUT': 'put',
			'DELETE': 'del',
			'HEAD': 'head',
			'OPTIONS': 'options',
			'PATCH': 'patch'
		    })[req.method];

		    if(method && self.methods[method]) {
			self.methods[method](req, res);
		    } else {
			/* Route found, but method not defined */
			res.writeHead(405);
			res.end();
		    }
		}

		if(self.methods.pre) {
		    self.methods.pre(req, res, function() {
			doMethod();
		    });
		} else {
		    doMethod();
		}

	    } else {
		if(self.methods.pre) {
		    self.methods.pre(req, res, next);
		} else {
		    next();
		}
	    }
	} else {
	    next();
	}
    };
};

function Router() {
    var self = this;

    var routes = self.routes = []; /* normalized path string to Route */

    /* TODO: normalize paths */
    self.path = function(path) {
	var route;

	for(var i in routes) {
	    route = routes[i];
	    var results = path.match(route.regex);

	    if(results && results[0].length == results.input.length) {
		for(var j = 0; j < results.length-1 && j < route.paramNames.length; j++) {
		    var name = route.paramNames[j];
		    if(name != results[j+1].substr(1) ) {
			throw new Error('Ambiguous parameters in duplicate path: ' + path);
		    }
		}

		return route;
	    }
	}

	/* No existing route found */
	route = new Route(path);
	routes.push(route);

	/*
	 * TODO: sort hard paths before soft paths (params), e.g.
	 * 
	 * /account/guest
	 * before
	 * /account/:id
	 * 
	 */
	routes.sort(function(a, b) {
	    return a.regex.source.length - b.regex.source.length;
	});

	return route;
    };

    /* Calls next if no path is matched */
    self.resolve = function(path, req, res, next) {
	var i = 0;

	(function process() {
	    if(i < routes.length) {
		routes[i].resolve(path, req, res, function() {
		    i++;
		    return process();
		});
	    } else {
		next();
		i = routes.length;
	    }
	})();
    };

    /* TODO: append() needs to be much more robust, e.g.:
     * check for clashing, ambiguity, be more forgiving with
     * prefix, etc.
     */

    //Use append to modularize your routes
    //prefix expected to be '(/<step>)+'
    self.append = function(prefix, router) {
	router.routes.forEach(function(route) {
	    //yucky
	    var nr = new Route(prefix + route.path);
	    nr.methods = route.methods;
	    nr.pre = route.pre;

	    routes.push(nr);
	});

	routes.sort(function(a, b) {
	    return a.regex.source.length - b.regex.source.length;
	});
    };

    /* Use with Connect */
    self.middleware = function() {
	return (function(req, res, next) {
	    self.resolve(url.parse(req.url).pathname, req, res, next);
	});
    };
}

module.exports.Router = Router;