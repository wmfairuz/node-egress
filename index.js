function Route( path ) {
    var self = this;

    path = '/' + (path.trim()
		  .replace(/^\/+/, '')
		  .replace(/\/+$/, ''));

    self.path = path;

    //Transform the path into a regexp
    var paramNames = [];
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
	    if(results[0] == results.input) {
		var params = {};
		for(var i = 0; i < paramNames.length; i++) {
		    var name = paramNames[i];
		    params[name] = results[i+1];
		}

		req.params = params;
		
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
		    self.methods[method](req, res);;
		} else {
		    console.log('405 Method not allowed');
		    /* Method not allowed */
		    /*res.writeHead(405);
		    res.end();*/
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

	    var result = path.match(route.regex);
	    /* if is a full match */
	    if(result && result[0].length == result.input.length) {
		return route;
	    }
	}

	route = new Route(path);
	routes.push(route);
	routes.sort(function(a, b) {
	    return a.regex.source.length - b.regex.source.length;
	});

	console.log(routes);

	return route;
    };

    self.resolve = function(path, req, res) {
	var i = 0;

	(function process() {
	    if(i < routes.length) {
		routes[i].resolve(path, req, res, function() {
		    i++;
		    return process();
		});
	    } else {
		/* ??? */
		console.log('Route not matched');
	    }
	})();
    };
};