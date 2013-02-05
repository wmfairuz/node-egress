exports.Route = Route;

function Route ( path ) {
    var self = this; 

    var children = {},
	methods = {},
	isParam,
	str; /* if param, stripped of leading : */

    this.path = function( path ) {
	if(typeof path === 'string') {
	    if(path == '/' || path == '')
		return self;

	    path = splitPath(path);
	} else if(path instanceof Array) {
	    if(path.length == 0)
		return self;
	} else {
	    throw TypeError('Path must be string or array');
	}

	var step = path[0];
	var next = path.slice(1);

	if(children[step]) {
	    return children[step].path(next);
	} else {
	    var route = buildRoute(path);
	    children[step] = route;
	    return route.path(next);
	}
    };

    this.append = function ( route ) {
	/* TODO: flesh this out */
	self.children[route.str] = route;
    };

    [   'get',
	'post',
	'put',
	'delete',
	'head',
	'options',
	'patch'
    ].forEach(function (method) {
	self[method] = function(callback) {
	    self.methods[method] = callback;

	    return self;
	};
    });

    /* Construct the instance */
    path = fixPath(path);
};

/* Route returned is of the first node in the path */
function buildRoute( path ) {
    
}

function fixPath( path ) {
    if(typeof path === 'string') {
	return splitPath(path);
    } else if(path instanceof Array) {
	return path;
    } else {
	throw TypeError('Path must be string or array');
    }
}

function splitPath( path ) {
    return (path.trim()
	    .replace(/^\/+/, '')
	    .replace(/\/+$/, '')
	    .split('/'));
}
