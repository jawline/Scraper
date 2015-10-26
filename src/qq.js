var registry = require('npm-stats')();

function Query(sQueries) {
    this._nRunning = sQueries || 5;
    this._hitCallbacks = [];
    this._doneCallbacks = [];
    this._lfDepList = [];
}

var prototype = Query.prototype;

prototype.onHit = function(cb) {
    this._hitCallbacks.push(cb);
    return this;
}

prototype.lookingFor = function(dep) {
    this._lfDepList.push(dep);
    return this;
}

prototype.done = function(cb) {
    this._doneCallbacks.push(cb);
    return this;
}

prototype.start = function() {
    this._finished = 0;
    registry.list(null, function(err, data) {
        if (!err) {
            this._listFetched(data);
        } else {
            this._fireDone(err);
        }
    }.bind(this));
    return this;
}

prototype._listFetched = function(data) {
    this._itemList = data;

    console.log('Collected packages metadata. Querying package.json. ' + data.length + ' items to query');

    var nRunning = this._nRunning;
    var nPerEach = data.length / nRunning;

    console.log('Setting up ' + nRunning + ' concurrent queries');

    for (var i = 0; i < nRunning; i++) {
        var start = i * nPerEach;
        var last = i === (nRunning - 1);
        this._eat(start, last ? data.length : (start + nPerEach));
        console.log(i + ' started eating');
    }
}

prototype._handlePackage = function(data) {

    var match = false;

    this._lfDepList.forEach(function (item) {
    	if (!!data.dependencies[item]) {
    		match = true;
    	}
    });

    if (match) {
    	this._hitCallbacks(data);
	}
}

prototype._fireHits = function(data) {
    this._hitCallbacks.forEach(function(cb) {
        cb(data);
    });
}

prototype._fireDone = function(err) {
    this._doneCallbacks.forEach(function(cb) {
        cb(err);
    });
}

prototype._eat = function(i, m) {

    if (i < this._itemList.length && i <= m) {
        registry.module(this._itemList[i]).latest(function(err, data) {

            if (!err) {
                this._handlePackage(data);
            } else {
                console.log('ERROR: Could not query ' + this._itemList[i]);
            }

            this._eat(i + 1, m);
        }.bind(this));
    } else {
        this._finished++;
        if (this._finished >= this._nRunning) {
            this._fireDone();
        }
    }
}

module.exports = Query;