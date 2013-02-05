function Route( path ) {
    var self = this;

    path = '/' + (path.trim()
		  .replace(/^\/+/, '')
		  .replace(/\/+$/, ''));

    self.path = path;

    //Transform the path into a regexp
    var paramNames = self.paramNames = [];
    var regex = path.replace(/:(\w+)/g, function(match, p1) {
	paramNames.push(p1);
	return '([\\w%:\\$\\+]+)';
    });

    regex = '^' + regex + '/?';

    self.regex = new RegExp(regex);

    self.methods = { };
    
    [   'get',
	'post',
	'put',
	'delete',
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

	    for(var i = 0; i < paramNames.length; i++) {
		var name = paramNames[i];
		params[name] = results[i+1];
	    }

	    req.params = params;

	    if(results[0] == results.input) {
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

	    } else {
		if(self.methods.pre) {
		    self.methods.pre(res, req, next);
		} else {
		    next();
		}
	    }
	} else {
	    next();
	}
    };
};

module.exports = function() {
    var self = this;

    var routes = []; /* normalized path string to Route */

    /* TODO: normalize paths */
    self.path = function(path) {
	var route;

	for(var i in routes) {
	    route = routes[i];
	    var results = path.match(route.regex);

	    if(results && results[0].length == results.input.length) {
		for(var j = 0; j < results.length-1; j++) {
		    var name = route.paramNames[i];
		    if(name != results[j+1].slice(1)) {
			throw new Error('Ambiguous parameters in duplicate path: ' + path);
		    }
		}

		return route;
	    }
	}

	/* No existing route found */
	route = new Route(path);
	routes.push(route);
	routes.sort(function(a, b) {
	    return a.regex.source.length - b.regex.source.length;
	});

	return route;
    };

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
};
