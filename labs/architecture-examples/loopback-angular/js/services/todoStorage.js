/*global todomvc */
'use strict';

(function () {
  var isServer = process && typeof process.exit === 'function' && process.argv;
  var isClient = !isServer && typeof window !== 'undefined';
  var hasRequire = typeof module !== 'undefined' && module.exports;

  if (hasRequire) {
    module.exports = Repo;
  }

  if(isClient) {
    todomvc.factory('Repo', function () {
      return Repo;
    });
  }

  function Repo(name, $scope) {
    this.$scope = $scope;
    this.name = name;
    this.objects = [];
    this.storage = new Storage(name);
  }

  if(isServer) {
    var ctor = 
    Repo.sharedCtor = function(name, fn) {
      var repo = new Repo(name);
      fn(null, repo);
    }

    ctor.accepts = {arg: 'name', type: 'string'};
    ctor.returns = {arg: 'repo', type: 'object'};

    Repo.model = require('loopback').Model.extend('commit');
  }

  Repo.prototype.checkout = function(commit) {
    var data = this.getSync(commit);

    if(isArray(data)) {
      this.clear();
      for(var i = 0; i < data.length; i++) {
        objects.push(data[i]);
      }
    }
  }

  // replace any local data with an exact copy
  // of what exists remotely
  Repo.prototype.clone = function() {
    var objects = this.objects;

    // clear the current set of objects
    this.clear();
  }

  Repo.prototype.clear = function() {
    this.objects.splice(0, this.objects.length);
  }

  Repo.prototype.stage = function() {
    var stage = [];
    var objects = this.objects;
    var obj;
    var stagedObject;

    for(var i = 0; i < objects.length; i++) {
      obj = objects[i];
      stagedObject = {};
      for(var key in obj) {
        if(obj.hasOwnProperty(key) && key.substr(0, 1) !== '$') {
          stagedObject[key] = obj[key];
        }
      }
      stage.push(stagedObject);
    }
    this.staged = JSON.stringify({
      parent: this.head,
      objects: stage
    });
  }

  Repo.hash = function(str) {
    var hash = 0;

    for(var i = 0; i < str.length; i++) {
      hash += str.charCodeAt(i);
    }

    return hash;
  }

  Repo.prototype.commit = function() {
    if(this.staged) {
      this.head = Repo.hash(this.staged);
      this.storage.put(this.head, this.staged);
      delete this.staged;
    } else {
      console.log('nothing to commit...');
    }
  }

  Repo.prototype.push = function(objects, fn) {
    if(isClient) {
      this.invoke('push', this.objects, fn);
    } else {
      this.storage.put(objects, fn);
    }
  }

  Repo.prototype.pull = function(fn) {
    if(isClient) {
      // fetch
      // look at head
    } else {
      // XXX - this is weird / wrong
      this.storage.get(fn);
    }
  }

  Repo.prototype.fetch = function() {
    // fetch only the commits from the server
  }

  Repo.prototype.getSync = function(commit) {
    var str = storage.getSync(commit);
    return JSON.parse(str);
  }

  var types = {
    REMOVE: 1,
    ADD: 2,
    CONFLICT: 3
  };

  Repo.diff = function(commitA, commitB) {
    // XXX order the commits... currently we assume they are given in order
    var tablesB = createLookupTables(commitB);
    var indexB = tables.indexB;
    var hashA, hashB, objA, objB, valA, valB;
    var changes = [];
    var diff = {changes: changes};
    var changeHash = {};

    for(var id in indexB) {
      if(indexB.hasOwnProperty(id)) {
        hashA = tablesA.hashes[id];
        hashB = tablesB.hashes[id];

        if(hashA !== hashB) {
          objA = indexA[id];
          objB = indexB[id];

          if(!exists(objA) && exists(objB)) {
            changes.push({type: types.ADD, obj: obj, index: indexB[id]});
          }
      
          if(exists(objA) && !exists(objB)) {
            changes.push({type: types.REMOVE, obj: obj, index: indexB[id]});
          }

          var keysA = Object.keys(objA);
          var keysB = Object.keys(objB);
          var uniqueKeys = mergeArrays(keysA, keysB);

          for(var key in uniqueKeys) {
            valA = objA[key];
            valB = objB[key];
            if(valA !== valB) {
              if(valA === null || valA === undefined) {
                changes.push({type: types.ADD, obj: obj, key: key});
              } else if(valB === null || valB === undefined) {
                changes.push({type: types.REMOVE, obj: obj, key: key});
              } else {
                diff.conflicts = true;
                changes.push({type: types.CONFLICT, obj: obj, key: key});
              }
            }
          }
        }
      }
    }

    return changes;
  }

  function exists(obj) {
    return obj !== null && obj !== undefined && obj !== '' && obj !== 0;
  }

  function mergeArrays(arrA, arrB) {
    var result = {};
    var val;

    for(var i = 0; i < Math.max(arrA.length, arrB.length); i++) {
      if(arrA[i]) {
        result[arrA[i]] = true;
      }
      if(arrB[i]) {
        result[arrB[i]] = true;
      }
    }

    return result;
  }

  Repo.prototype.merge = function(commitA, commitB, handleConflicts) {
    if(!(this.hasCommit(commitA) && this.hasCommit(commitB)) {
      throw new Error('cannot merge commits that do not exist');
    }

    var diff = Repo.diff(commitA, commitB);
    var changes = diff.changes;
    var change;
    var mergeCommit = {parent: commitB};

    if(diff.conflicts) {
      mergeCommit = handleConflicts(diff);
    }

    var objsA = this.storage.getSync(commitA);
    var objsB = this.storage.getSync(commitB);
    var objsR = [];

    for(var i = 0; i < changes.length; i++) {
      change = changes[i];

      switch(change.type) {
        case types.REMOVE:

        break;
        case types.ADD:
        break;
        case types.CONFLICT:
          // ignore
        break;
      }
    }
  }

  function createLookupTables(objects) {
    var result = {
      index: {},
      hash: {}
    };
    var cur;
    var curHash;

    for(var i = 0; i < objects.length; i++) {
      cur = objects[i];
      curHash = Repo.hash(cur);
      result.hash[curHash] = i;
      result.index[cur.id] = cur;
    }

    return index;
  }

  Repo.prototype.hasCommit = function(commit) {
    return !!this.storage.getSync(commit);
  }

  function Storage(key) {
    this.key = key;
  }

  Storage.prototype.put = function(value, fn) {
    if(isClient) {
      try {
        localStorage.setItem(this.key, this.staged); 
      } catch(e) {
        return fn(e);
      }
    } else {
      Repo.model.upsert(this.key, {
        value: value
      });
    }
  }

  Storage.prototype.get = function(fn) {
    var value;

    if(isClient) {
      try {
        value this.getSync();
      } catch(e) {
        return fn(e);
      }

      fn(null, value);
    } else {
      Repo.model.findById(this.key, function(err, obj) {
        if(err) {
          fn(err);
        } else {
          fn(null, obj.value);
        }
      });
    }
  }

  if(isClient) {
    Storage.prototype.getSync = function() {
      return localStorage.getItem(this.key);
    }
  }

  function isArray(obj) {
    return 
      obj &&
      typeof obj === 'object'
      typeof obj.length === 'number'
      typeof obj.splice === 'function';
  }

})();
