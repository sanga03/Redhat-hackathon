(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    //Allow using this built library as an AMD module
    //in another project. That other project will only
    //see this AMD call, not the internal modules in
    //the closure below.
    define([], factory);
  } else {
    //Browser globals case. Just assign the
    //result to a property on the global.
    root.JSO = factory();
  }
}(this, function () {
  //almond, and your modules will be inlined here
  /**
   * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
   * Available via the MIT or new BSD license.
   * see: http://github.com/jrburke/almond for details
   */
  //Going sloppy to avoid 'use strict' string cost, but strict practices should
  //be followed.
  /*jslint sloppy: true */
  /*global setTimeout: false */

  var requirejs, require, define;
  (function (undef) {
    var main, req, makeMap, handlers,
      defined = {},
      waiting = {},
      config = {},
      defining = {},
      hasOwn = Object.prototype.hasOwnProperty,
      aps = [].slice,
      jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
      return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
      var nameParts, nameSegment, mapValue, foundMap, lastIndex,
        foundI, foundStarMap, starI, i, j, part,
        baseParts = baseName && baseName.split("/"),
        map = config.map,
        starMap = (map && map['*']) || {};

      //Adjust any relative paths.
      if (name && name.charAt(0) === ".") {
        //If have a base name, try to normalize against it,
        //otherwise, assume it is a top-level require that will
        //be relative to baseUrl in the end.
        if (baseName) {
          //Convert baseName to array, and lop off the last part,
          //so that . matches that "directory" and not name of the baseName's
          //module. For instance, baseName of "one/two/three", maps to
          //"one/two/three.js", but we want the directory, "one/two" for
          //this normalization.
          baseParts = baseParts.slice(0, baseParts.length - 1);
          name = name.split('/');
          lastIndex = name.length - 1;

          // Node .js allowance:
          if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
            name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
          }

          name = baseParts.concat(name);

          //start trimDots
          for (i = 0; i < name.length; i += 1) {
            part = name[i];
            if (part === ".") {
              name.splice(i, 1);
              i -= 1;
            } else if (part === "..") {
              if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                //End of the line. Keep at least one non-dot
                //path segment at the front so it can be mapped
                //correctly to disk. Otherwise, there is likely
                //no path mapping for a path starting with '..'.
                //This can still fail, but catches the most reasonable
                //uses of ..
                break;
              } else if (i > 0) {
                name.splice(i - 1, 2);
                i -= 2;
              }
            }
          }
          //end trimDots

          name = name.join("/");
        } else if (name.indexOf('./') === 0) {
          // No baseName, so this is ID is resolved relative
          // to baseUrl, pull off the leading dot.
          name = name.substring(2);
        }
      }

      //Apply map config if available.
      if ((baseParts || starMap) && map) {
        nameParts = name.split('/');

        for (i = nameParts.length; i > 0; i -= 1) {
          nameSegment = nameParts.slice(0, i).join("/");

          if (baseParts) {
            //Find the longest baseName segment match in the config.
            //So, do joins on the biggest to smallest lengths of baseParts.
            for (j = baseParts.length; j > 0; j -= 1) {
              mapValue = map[baseParts.slice(0, j).join('/')];

              //baseName segment has  config, find if it has one for
              //this name.
              if (mapValue) {
                mapValue = mapValue[nameSegment];
                if (mapValue) {
                  //Match, update name to the new value.
                  foundMap = mapValue;
                  foundI = i;
                  break;
                }
              }
            }
          }

          if (foundMap) {
            break;
          }

          //Check for a star map match, but just hold on to it,
          //if there is a shorter segment match later in a matching
          //config, then favor over this star map.
          if (!foundStarMap && starMap && starMap[nameSegment]) {
            foundStarMap = starMap[nameSegment];
            starI = i;
          }
        }

        if (!foundMap && foundStarMap) {
          foundMap = foundStarMap;
          foundI = starI;
        }

        if (foundMap) {
          nameParts.splice(0, foundI, foundMap);
          name = nameParts.join('/');
        }
      }

      return name;
    }

    function makeRequire(relName, forceSync) {
      return function () {
        //A version of a require function that passes a moduleName
        //value for items that may need to
        //look up paths relative to the moduleName
        return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
      };
    }

    function makeNormalize(relName) {
      return function (name) {
        return normalize(name, relName);
      };
    }

    function makeLoad(depName) {
      return function (value) {
        defined[depName] = value;
      };
    }

    function callDep(name) {
      if (hasProp(waiting, name)) {
        var args = waiting[name];
        delete waiting[name];
        defining[name] = true;
        main.apply(undef, args);
      }

      if (!hasProp(defined, name) && !hasProp(defining, name)) {
        throw new Error('No ' + name);
      }
      return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
      var prefix,
        index = name ? name.indexOf('!') : -1;
      if (index > -1) {
        prefix = name.substring(0, index);
        name = name.substring(index + 1, name.length);
      }
      return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
      var plugin,
        parts = splitPrefix(name),
        prefix = parts[0];

      name = parts[1];

      if (prefix) {
        prefix = normalize(prefix, relName);
        plugin = callDep(prefix);
      }

      //Normalize according
      if (prefix) {
        if (plugin && plugin.normalize) {
          name = plugin.normalize(name, makeNormalize(relName));
        } else {
          name = normalize(name, relName);
        }
      } else {
        name = normalize(name, relName);
        parts = splitPrefix(name);
        prefix = parts[0];
        name = parts[1];
        if (prefix) {
          plugin = callDep(prefix);
        }
      }

      //Using ridiculous property names for space reasons
      return {
        f: prefix ? prefix + '!' + name : name, //fullName
        n: name,
        pr: prefix,
        p: plugin
      };
    };

    function makeConfig(name) {
      return function () {
        return (config && config.config && config.config[name]) || {};
      };
    }

    handlers = {
      require: function (name) {
        return makeRequire(name);
      },
      exports: function (name) {
        var e = defined[name];
        if (typeof e !== 'undefined') {
          return e;
        } else {
          return (defined[name] = {});
        }
      },
      module: function (name) {
        return {
          id: name,
          uri: '',
          exports: defined[name],
          config: makeConfig(name)
        };
      }
    };

    main = function (name, deps, callback, relName) {
      var cjsModule, depName, ret, map, i,
        args = [],
        callbackType = typeof callback,
        usingExports;

      //Use name if no relName
      relName = relName || name;

      //Call the callback to define the module, if necessary.
      if (callbackType === 'undefined' || callbackType === 'function') {
        //Pull out the defined dependencies and pass the ordered
        //values to the callback.
        //Default to [require, exports, module] if no deps
        deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
        for (i = 0; i < deps.length; i += 1) {
          map = makeMap(deps[i], relName);
          depName = map.f;

          //Fast path CommonJS standard dependencies.
          if (depName === "require") {
            args[i] = handlers.require(name);
          } else if (depName === "exports") {
            //CommonJS module spec 1.1
            args[i] = handlers.exports(name);
            usingExports = true;
          } else if (depName === "module") {
            //CommonJS module spec 1.1
            cjsModule = args[i] = handlers.module(name);
          } else if (hasProp(defined, depName) ||
            hasProp(waiting, depName) ||
            hasProp(defining, depName)) {
            args[i] = callDep(depName);
          } else if (map.p) {
            map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
            args[i] = defined[depName];
          } else {
            throw new Error(name + ' missing ' + depName);
          }
        }

        ret = callback ? callback.apply(defined[name], args) : undefined;

        if (name) {
          //If setting exports via "module" is in play,
          //favor that over return value and exports. After that,
          //favor a non-undefined return value over exports use.
          if (cjsModule && cjsModule.exports !== undef &&
            cjsModule.exports !== defined[name]) {
            defined[name] = cjsModule.exports;
          } else if (ret !== undef || !usingExports) {
            //Use the return value from the function.
            defined[name] = ret;
          }
        }
      } else if (name) {
        //May just be an object definition for the module. Only
        //worry about defining if have a module name.
        defined[name] = callback;
      }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
      if (typeof deps === "string") {
        if (handlers[deps]) {
          //callback in this case is really relName
          return handlers[deps](callback);
        }
        //Just return the module wanted. In this scenario, the
        //deps arg is the module name, and second arg (if passed)
        //is just the relName.
        //Normalize module name, if it contains . or ..
        return callDep(makeMap(deps, callback).f);
      } else if (!deps.splice) {
        //deps is a config object, not an array.
        config = deps;
        if (config.deps) {
          req(config.deps, config.callback);
        }
        if (!callback) {
          return;
        }

        if (callback.splice) {
          //callback is an array, which means it is a dependency list.
          //Adjust args if there are dependencies
          deps = callback;
          callback = relName;
          relName = null;
        } else {
          deps = undef;
        }
      }

      //Support require(['a'])
      callback = callback || function () {};

      //If relName is a function, it is an errback handler,
      //so remove it.
      if (typeof relName === 'function') {
        relName = forceSync;
        forceSync = alt;
      }

      //Simulate async callback;
      if (forceSync) {
        main(undef, deps, callback, relName);
      } else {
        //Using a non-zero value because of concern for what old browsers
        //do, and latest browsers "upgrade" to 4 if lower value is used:
        //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
        //If want a value immediately, use require('id') instead -- something
        //that works in almond on the global level, but not guaranteed and
        //unlikely to work in other AMD implementations.
        setTimeout(function () {
          main(undef, deps, callback, relName);
        }, 4);
      }

      return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
      return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

      //This module may not have dependencies
      if (!deps.splice) {
        //deps is not an array, so probably means
        //an object literal or factory function for
        //the value. Adjust args.
        callback = deps;
        deps = [];
      }

      if (!hasProp(defined, name) && !hasProp(waiting, name)) {
        waiting[name] = [name, deps, callback];
      }
    };

    define.amd = {
      jQuery: true
    };
  }());

  define("almond", function () {});

  define('utils', ['require', 'exports', 'module'], function (require, exports, module) {


    var utils = {};


    /*
     * Returns epoch, seconds since 1970.
     * Used for calculation of expire times.
     */
    utils.epoch = function () {
      return Math.round(new Date().getTime() / 1000.0);
    };


    /*
     * Returns a random string used for state
     */
    utils.uuid = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };



    utils.parseQueryString = function (qs) {
      var e,
        a = /\+/g, // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) {
          return decodeURIComponent(s.replace(a, " "));
        },
        q = qs,
        urlParams = {};

      /* jshint ignore:start */
      while (e = r.exec(q)) {
        urlParams[d(e[1])] = d(e[2]);
      };
      /* jshint ignore:end */

      return urlParams;
    };





    /**
     * Utility: scopeList(scopes )
     * Takes a list of scopes that might be overlapping, and removed duplicates,
     * then concatenates the list by spaces and returns a string.
     * 
     * @param  {[type]} scopes [description]
     * @return {[type]}        [description]
     */
    utils.scopeList = function (scopes) {
      return utils.uniqueList(scopes).join(' ');
    };


    utils.uniqueList = function (items) {
      var uniqueItems = {};
      var resultItems = [];
      for (var i = 0; i < items.length; i++) {
        uniqueItems[items[i]] = 1;
      }
      for (var key in uniqueItems) {
        if (uniqueItems.hasOwnProperty(key)) {
          resultItems.push(key);
        }
      }
      return resultItems;
    };





    /*
     * Returns a random string used for state
     */
    utils.uuid = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    /**
     * A log wrapper, that only logs if logging is turned on in the config
     * @param  {string} msg Log message
     */
    utils.log = function (msg) {
      // if (!options.debug) return;
      if (!console) return;
      if (!console.log) return;

      // console.log("LOG(), Arguments", arguments, msg)
      if (arguments.length > 1) {
        console.log(arguments);
      } else {
        console.log(msg);
      }

    };

    /**
     * Set the global options.
     */
    // utils.setOptions = function(opts) {
    // 	if (!opts) return;
    // 	for(var k in opts) {
    // 		if (opts.hasOwnProperty(k)) {
    // 			options[k] = opts[k];
    // 		}
    // 	}
    // 	log("Options is set to ", options);
    // }


    /* 
     * Takes an URL as input and a params object.
     * Each property in the params is added to the url as query string parameters
     */
    utils.encodeURL = function (url, params) {
      var res = url;
      var k, i = 0;
      var firstSeparator = (url.indexOf("?") === -1) ? '?' : '&';
      for (k in params) {
        res += (i++ === 0 ? firstSeparator : '&') + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }
      return res;
    };

    /*
     * Returns epoch, seconds since 1970.
     * Used for calculation of expire times.
     */
    utils.epoch = function () {
      return Math.round(new Date().getTime() / 1000.0);
    };




    return utils;

  });
  //define(['utils'], function(utils) {

  define('store', ['require', 'exports', 'module', './utils'], function (require, exports, module) {

    var utils = require('./utils');
    var store = {};


    /**
    	saveState stores an object with an Identifier.
    	TODO: Ensure that both localstorage and JSON encoding has fallbacks for ancient browsers.
    	In the state object, we put the request object, plus these parameters:
    	  * restoreHash
    	  * providerID
    	  * scopes

     */
    store.saveState = function (state, obj) {
      localStorage.setItem("state-" + state, JSON.stringify(obj));
    };

    /**
     * getStage()  returns the state object, but also removes it.
     * @type {Object}
     */
    store.getState = function (state) {
      // log("getState (" + state+ ")");
      var obj = JSON.parse(localStorage.getItem("state-" + state));
      localStorage.removeItem("state-" + state);
      return obj;
    };


    /**
     * A log wrapper, that only logs if logging is turned on in the config
     * @param  {string} msg Log message
     */
    var log = function (msg) {
      // if (!options.debug) return;
      if (!console) return;
      if (!console.log) return;

      // console.log("LOG(), Arguments", arguments, msg)
      if (arguments.length > 1) {
        console.log(arguments);
      } else {
        console.log(msg);
      }

    };


    /*
     * Checks if a token, has includes a specific scope.
     * If token has no scope at all, false is returned.
     */
    store.hasScope = function (token, scope) {
      var i;
      if (!token.scopes) return false;
      for (i = 0; i < token.scopes.length; i++) {
        if (token.scopes[i] === scope) return true;
      }
      return false;
    };

    /*
     * Takes an array of tokens, and removes the ones that
     * are expired, and the ones that do not meet a scopes requirement.
     */
    store.filterTokens = function (tokens, scopes) {
      var i, j,
        result = [],
        now = utils.epoch(),
        usethis;

      if (!scopes) scopes = [];

      for (i = 0; i < tokens.length; i++) {
        usethis = true;

        // Filter out expired tokens. Tokens that is expired in 1 second from now.
        if (tokens[i].expires && tokens[i].expires < (now + 1)) usethis = false;

        // Filter out this token if not all scope requirements are met
        for (j = 0; j < scopes.length; j++) {
          if (!store.hasScope(tokens[i], scopes[j])) usethis = false;
        }

        if (usethis) result.push(tokens[i]);
      }
      return result;
    };


    /*
     * saveTokens() stores a list of tokens for a provider.

    	Usually the tokens stored are a plain Access token plus:
    	  * expires : time that the token expires
    	  * providerID: the provider of the access token?
    	  * scopes: an array with the scopes (not string)
     */
    store.saveTokens = function (provider, tokens, clientId) {
      // log("Save Tokens (" + provider+ ")");
      var token = JSON.stringify(tokens);
      //@lgonzale change --> Encrypting the token before save
      var encryptedToken = CryptoJS.AES.encrypt(token, provider + clientId);

      localStorage.setItem("tokens-" + provider, encryptedToken);
    };

    store.getTokens = function (provider, clientId) {
      // log("Get Tokens (" + provider+ ")");
      //@lgonzale change --> Decrypting the token before save
      var encryptedToken = localStorage.getItem("tokens-" + provider);
      var tokens = [];
      if (encryptedToken) {
        var tokenStr = CryptoJS.AES.decrypt(encryptedToken, provider + clientId);
        tokens = JSON.parse(tokenStr.toString(CryptoJS.enc.Utf8));
      }
      log("Token received", tokens);
      return tokens;
    };
    store.wipeTokens = function (provider) {
      localStorage.removeItem("tokens-" + provider);
    };
    /*
     * Save a single token for a provider.
     * This also cleans up expired tokens for the same provider.
     */
    store.saveToken = function (provider, token, clientId) {
      var tokens = this.getTokens(provider, clientId);
      tokens = store.filterTokens(tokens);
      tokens.push(token);
      this.saveTokens(provider, tokens, clientId);
    };

    /*
     * Get a token if exists for a provider with a set of scopes.
     * The scopes parameter is OPTIONAL.
     */
    store.getToken = function (provider, scopes, clientId) {
      var tokens = this.getTokens(provider, clientId);
      tokens = store.filterTokens(tokens, scopes);
      if (tokens.length < 1) return null;
      return tokens[0];
    };



    return store;
  });

  define('Config', [], function () {
    // Credits to Ryan Lynch
    // http://stackoverflow.com/questions/11197247/javascript-equivalent-of-jquerys-extend-method
    var extend = function (a) {
      for (var i = 1; i < a.length; i++)
        for (var key in a[i])
          if (a[i].hasOwnProperty(key))
            a[0][key] = a[i][key];
      return a[0];
    };


    var Config = function () {
      var ca = [{}];
      for (var i = 0; i < arguments.length; i++) {
        ca.push(arguments[i]);
      }
      this.config = extend(ca);
    };

    Config.prototype.has = function (key) {
      var pointer = this.config;
      var splittedKeys = key.split('.');
      var i = 0;

      for (i = 0; i < splittedKeys.length; i++) {
        if (pointer.hasOwnProperty(splittedKeys[i])) {
          pointer = pointer[splittedKeys[i]];
        } else {
          return false;
        }
      }
      return true;
    };

    Config.prototype.get = function (key, defaultValue, isRequired) {

      // console.log("about to load config", key, this.config);

      isRequired = isRequired || false;

      var pointer = this.config;

      var splittedKeys = key.split('.');
      var i = 0;

      // console.log("splittedKeys", splittedKeys); 

      for (i = 0; i < splittedKeys.length; i++) {

        if (pointer.hasOwnProperty(splittedKeys[i])) {
          // console.log("POINTING TO " + splittedKeys[i]);
          pointer = pointer[splittedKeys[i]];
        } else {
          pointer = undefined;
          break;
        }
      }

      if (typeof pointer === 'undefined') {
        if (isRequired) {
          throw new Error("Configuration option [" + splittedKeys[i] + "] required but not provided.");
        }
        return defaultValue;
      }
      return pointer;
    };

    return Config;
  });
  /**
   * JSO - Javascript OAuth Library
   * 	Version 2.0
   *  UNINETT AS - http://uninett.no
   *  Author: Andreas Åkre Solberg <andreas.solberg@uninett.no>
   *  Licence: 
   *   	
   *  Documentation available at: https://github.com/andreassolberg/jso
   */

  define('jso', ['require', 'exports', 'module', './store', './utils', './Config'], function (require, exports, module) {

    var
      default_config = {
        "lifetime": 3600,
        "debug": true,
        "foo": {
          "bar": "lsdkjf"
        }
      };

    var store = require('./store');
    var utils = require('./utils');
    var Config = require('./Config');





    var JSO = function (config) {

      this.config = new Config(default_config, config);
      this.providerID = this.getProviderID();

      JSO.instances[this.providerID] = this;

      this.callbacks = {};

      this.callbacks.redirect = JSO.redirect;

      // console.log("Testing configuration object");
      // console.log("foo.bar.baz (2,false)", this.config.get('foo.bar.baz', 2 ) );
      // console.log("foo.bar.baz (2,true )", this.config.get('foo.bar.baz', 2, true ) );
    };

    JSO.internalStates = [];
    JSO.instances = {};
    JSO.store = store;
    JSO.utils = utils;

    console.log("RESET internalStates array");


    JSO.enablejQuery = function ($) {
      JSO.$ = $;
    };


    JSO.redirect = function (url, callback) {
      window.location = url;
    };

    JSO.prototype.inappbrowser = function (params) {
      var that = this;
      return function (url, callback) {


        var onNewURLinspector = function (ref) {
          return function (inAppBrowserEvent) {

            //  we'll check the URL for oauth fragments...
            var url = inAppBrowserEvent.url;
            utils.log("loadstop event triggered, and the url is now " + url);

            if (that.URLcontainsToken(url)) {
              // ref.removeEventListener('loadstop', onNewURLinspector);
              setTimeout(function () {
                ref.close();
              }, 500);


              that.callback(url, function () {
                // When we've found OAuth credentials, we close the inappbrowser...
                utils.log("Closing window ", ref);
                if (typeof callback === 'function') callback();
              });
            }

          };
        };

        var target = '_blank';
        if (params.hasOwnProperty('target')) {
          target = params.target;
        }
        var options = {};

        utils.log("About to open url " + url);

        var ref = window.open(url, target, options);
        utils.log("URL Loaded... ");
        ref.addEventListener('loadstart', onNewURLinspector(ref));
        utils.log("Event listeren ardded... ", ref);


        // Everytime the Phonegap InAppBrowsers moves to a new URL,



      };
    };

    JSO.prototype.on = function (eventid, callback) {
      if (typeof eventid !== 'string') throw new Error('Registering triggers on JSO must be identified with an event id');
      if (typeof callback !== 'function') throw new Error('Registering a callback on JSO must be a function.');

      this.callbacks[eventid] = callback;
    };


    /**
     * We need to get an identifier to represent this OAuth provider.
     * The JSO construction option providerID is preferred, if not provided
     * we construct a concatentaion of authorization url and client_id.
     * @return {[type]} [description]
     */
    JSO.prototype.getProviderID = function () {

      var c = this.config.get('providerID', null);
      if (c !== null) return c;

      var client_id = this.config.get('client_id', null, true);
      var authorization = this.config.get('authorization', null, true);

      return authorization + '|' + client_id;
    };




    /**
     * Do some sanity checking whether an URL contains a access_token in an hash fragment.
     * Used in URL change event trackers, to detect responses from the provider.
     * @param {[type]} url [description]
     */
    JSO.prototype.URLcontainsToken = function (url) {
      // If a url is provided 
      if (url) {
        // utils.log('Hah, I got the url and it ' + url);
        if (url.indexOf('#') === -1) return false;
        h = url.substring(url.indexOf('#'));
        // utils.log('Hah, I got the hash and it is ' +  h);
      }

      /*
       * Start with checking if there is a token in the hash
       */
      if (h.length < 2) return false;
      if (h.indexOf("access_token") === -1) return false;
      return true;
    };

    /**
     * Check if the hash contains an access token. 
     * And if it do, extract the state, compare with
     * config, and store the access token for later use.
     *
     * The url parameter is optional. Used with phonegap and
     * childbrowser when the jso context is not receiving the response,
     * instead the response is received on a child browser.
     */
    JSO.prototype.callback = function (url, callback, providerID) {
      var
        atoken,
        h = window.location.hash,
        now = utils.epoch(),
        state,
        instance;

      //utils.log("JSO.prototype.callback() " + url + " callback=" + typeof callback);

      // If a url is provided 
      if (url) {
        // utils.log('Hah, I got the url and it ' + url);
        if (url.indexOf('#') === -1) return;
        h = url.substring(url.indexOf('#'));
        // utils.log('Hah, I got the hash and it is ' +  h);
      }

      /*
       * Start with checking if there is a token in the hash
       */
      if (h.length < 2) return;
      if (h.indexOf("access_token") === -1) return;
      h = h.substring(1);
      atoken = utils.parseQueryString(h);

      if (atoken.state) {
        state = store.getState(atoken.state);
        $("#responseToken").val(atoken.id_token);
        getUserData(atoken.id_token);
      } else {
        if (!providerID) {
          throw "Could not get [state] and no default providerid is provided.";
        }
        state = {
          providerID: providerID
        };
      }


      if (!state) throw "Could not retrieve state";
      if (!state.providerID) throw "Could not get providerid from state";
      if (!JSO.instances[state.providerID]) throw "Could not retrieve JSO.instances for this provider.";

      instance = JSO.instances[state.providerID];

      /**
       * If state was not provided, and default provider contains a scope parameter
       * we assume this is the one requested...
       */
      if (!atoken.state && co.scope) {
        state.scopes = instance._getRequestScopes();
        utils.log("Setting state: ", state);
      }
      utils.log("Checking atoken ", atoken, " and instance ", instance);

      /*
       * Decide when this token should expire.
       * Priority fallback:
       * 1. Access token expires_in
       * 2. Life time in config (may be false = permanent...)
       * 3. Specific permanent scope.
       * 4. Default library lifetime:
       */
      if (atoken.expires_in) {
        atoken.expires = now + parseInt(atoken.expires_in, 10);
      } else if (instance.config.get('default_lifetime', null) === false) {
        // Token is permanent.
      } else if (instance.config.has('permanent_scope')) {
        if (!store.hasScope(atoken, instance.config.get('permanent_scope'))) {
          atoken.expires = now + 3600 * 24 * 365 * 5;
        }
      } else if (instance.config.has('default_lifetime')) {
        atoken.expires = now + instance.config.get('default_lifetime');
      } else {
        atoken.expires = now + 3600;
      }

      /*
       * Handle scopes for this token
       */
      if (atoken.scope) {
        atoken.scopes = atoken.scope.split(" ");
      } else if (state.scopes) {
        atoken.scopes = state.scopes;
      }



      store.saveToken(state.providerID, atoken, this.config.get('client_id', null, true));

      if (state.restoreHash) {
        window.location.hash = state.restoreHash;
      } else {
        window.location.hash = '';
      }


      utils.log(atoken);

      utils.log("Looking up internalStates storage for a stored callback... ", "state=" + atoken.state, JSO.internalStates);

      if (JSO.internalStates[atoken.state] && typeof JSO.internalStates[atoken.state] === 'function') {
        utils.log("InternalState is set, calling it now!");
        JSO.internalStates[atoken.state](atoken);
        delete JSO.internalStates[atoken.state];
      }


      utils.log("Successfully obtain a token, now call the callback, and may be the window closes", callback);

      if (typeof callback === 'function') {
        callback(atoken);
      }

      // utils.log(atoken);

    };

    JSO.prototype.dump = function () {

      var txt = '';
      var tokens = store.getTokens(this.providerID, this.config.get('client_id', null, true));
      txt += 'Tokens: ' + "\n" + JSON.stringify(tokens, undefined, 4) + '\n\n';
      txt += 'Config: ' + "\n" + JSON.stringify(this.config, undefined, 4) + "\n\n";
      return txt;
    };

    JSO.prototype._getRequestScopes = function (opts) {
      var scopes = [],
        i;
      /*
       * Calculate which scopes to request, based upon provider config and request config.
       */
      if (this.config.get('scopes') && this.config.get('scopes').request) {
        for (i = 0; i < this.config.get('scopes').request.length; i++) scopes.push(this.config.get('scopes').request[i]);
      }
      if (opts && opts.scopes && opts.scopes.request) {
        for (i = 0; i < opts.scopes.request.length; i++) scopes.push(opts.scopes.request[i]);
      }
      return utils.uniqueList(scopes);
    };

    JSO.prototype._getRequiredScopes = function (opts) {
      var scopes = [],
        i;
      /*
       * Calculate which scopes to request, based upon provider config and request config.
       */
      if (this.config.get('scopes') && this.config.get('scopes').require) {
        for (i = 0; i < this.config.get('scopes').require.length; i++) scopes.push(this.config.get('scopes').require[i]);
      }
      if (opts && opts.scopes && opts.scopes.require) {
        for (i = 0; i < opts.scopes.require.length; i++) scopes.push(opts.scopes.require[i]);
      }
      return utils.uniqueList(scopes);
    };

    JSO.prototype.getToken = function (callback, opts) {
      // var scopesRequest  = this._getRequestScopes(opts);

      var scopesRequire = this._getRequiredScopes(opts);
      var token = store.getToken(this.providerID, scopesRequire, this.config.get('client_id', null, true));

      if (token) {
        return callback(token);
      } else {
        this._authorize(callback, opts);
      }

    };

    JSO.prototype.checkToken = function (opts) {
      // var scopesRequest  = this._getRequestScopes(opts);

      var scopesRequire = this._getRequiredScopes(opts);
      return store.getToken(this.providerID, scopesRequire, this.config.get('client_id', null, true));
    };


    // exp.jso_ensureTokens = function (ensure) {
    // 	var providerid, scopes, token;
    // 	for(providerid in ensure) {
    // 		scopes = undefined;
    // 		if (ensure[providerid]) scopes = ensure[providerid];
    // 		token = store.getToken(providerid, scopes);

    // 		utils.log("Ensure token for provider [" + providerid + "] ");
    // 		utils.log(token);

    // 		if (token === null) {
    // 			jso_authrequest(providerid, scopes);
    // 		}
    // 	}


    // 	return true;
    // }


    JSO.prototype._authorize = function (callback, opts) {
      var
        request,
        authurl,
        scopes;

      var authorization = this.config.get('authorization', null, true);
      var client_id = this.config.get('client_id', null, true);
      var token = this.config.get('response_type', null, true);
      var nonce = this.config.get('nonce', null, true);

      utils.log("About to send an authorization request to this entry:", authorization);
      utils.log("Options", opts, "callback", callback);


      request = {
        "response_type": token,
        "state": utils.uuid(),
        "nonce": nonce,
        "client_id": client_id
      };



      if (callback && typeof callback === 'function') {
        utils.log("About to store a callback for later with state=" + request.state, callback);
        JSO.internalStates[request.state] = callback;
      }

      if (this.config.has('redirect_uri')) {
        request.redirect_uri = this.config.get('redirect_uri', '');
      }

      request.client_id = client_id;



      /*
       * Calculate which scopes to request, based upon provider config and request config.
       */
      scopes = this._getRequestScopes(opts);
      if (scopes.length > 0) {
        request.scope = utils.scopeList(scopes);
      }

      utils.log("DEBUG REQUEST");
      utils.log(request);

      authurl = utils.encodeURL(authorization, request);

      // We'd like to cache the hash for not loosing Application state. 
      // With the implciit grant flow, the hash will be replaced with the access
      // token when we return after authorization.
      if (window.location.hash) {
        request.restoreHash = window.location.hash;
      }
      request.providerID = this.providerID;
      if (scopes) {
        request.scopes = scopes;
      }


      utils.log("Saving state [" + request.state + "]");
      utils.log(JSON.parse(JSON.stringify(request)));

      store.saveState(request.state, request);
      this.gotoAuthorizeURL(authurl, callback);
    };


    JSO.prototype.gotoAuthorizeURL = function (url, callback) {


      if (!this.callbacks.redirect || typeof this.callbacks.redirect !== 'function')
        throw new Error('Cannot redirect to authorization endpoint because of missing redirect handler');

      this.callbacks.redirect(url, callback);

    };

    JSO.prototype.wipeTokens = function () {
      store.wipeTokens(this.providerID);
    };


    JSO.prototype.ajax = function (settings) {

      var
        allowia,
        scopes,
        token,
        providerid,
        co;

      var that = this;

      if (!JSO.hasOwnProperty('$')) throw new Error("JQuery support not enabled.");

      oauthOptions = settings.oauth || {};

      var errorOverridden = settings.error || null;
      settings.error = function (jqXHR, textStatus, errorThrown) {
        utils.log('error(jqXHR, textStatus, errorThrown)');
        utils.log(jqXHR);
        utils.log(textStatus);
        utils.log(errorThrown);

        if (jqXHR.status === 401) {

          utils.log("Token expired. About to delete this token");
          utils.log(token);
          that.wipeTokens();

        }
        if (errorOverridden && typeof errorOverridden === 'function') {
          errorOverridden(jqXHR, textStatus, errorThrown);
        }
      };


      return this.getToken(function (token) {
        utils.log("Ready. Got an token, and ready to perform an AJAX call", token);

        if (that.config.get('presenttoken', null) === 'qs') {
          // settings.url += ((h.indexOf("?") === -1) ? '?' : '&') + "access_token=" + encodeURIComponent(token["access_token"]);
          if (!settings.data) settings.data = {};
          settings.data.access_token = token.access_token;
        } else {
          if (!settings.headers) settings.headers = {};
          settings.headers.Authorization = "Bearer " + token.access_token;
        }
        utils.log('$.ajax settings', settings);
        return JSO.$.ajax(settings);

      }, oauthOptions);

    };

    /**
     * @lgonzale change must detail
     */
    JSO.prototype.saveCallbackAction = function (action) {
      store.saveState('action', action);
    };

    /**
     * @lgonzale change must detail
     */
    JSO.prototype.saveCallbackPage = function (page) {
      store.saveState('page', page);

    };

    /**
     * @lgonzale change must detail
     */
    JSO.prototype.getCallbackAction = function () {
      return store.getState('action');
    };

    /**
     * @lgonzale change must detail
     */
    JSO.prototype.getCallbackPage = function () {
      return store.getState('page');

    };


    return JSO;


  });

  //The modules for your project will be inlined above
  //this snippet. Ask almond to synchronously require the
  //module value for 'main' here and return it as the
  //value to use for the public API for the built file.
  return require('jso');
}));


/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS = CryptoJS || function (u, p) {
  var d = {},
    l = d.lib = {},
    s = function () {},
    t = l.Base = {
      extend: function (a) {
        s.prototype = this;
        var c = new s;
        a && c.mixIn(a);
        c.hasOwnProperty("init") || (c.init = function () {
          c.$super.init.apply(this, arguments)
        });
        c.init.prototype = c;
        c.$super = this;
        return c
      },
      create: function () {
        var a = this.extend();
        a.init.apply(a, arguments);
        return a
      },
      init: function () {},
      mixIn: function (a) {
        for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
        a.hasOwnProperty("toString") && (this.toString = a.toString)
      },
      clone: function () {
        return this.init.prototype.extend(this)
      }
    },
    r = l.WordArray = t.extend({
      init: function (a, c) {
        a = this.words = a || [];
        this.sigBytes = c != p ? c : 4 * a.length
      },
      toString: function (a) {
        return (a || v).stringify(this)
      },
      concat: function (a) {
        var c = this.words,
          e = a.words,
          j = this.sigBytes;
        a = a.sigBytes;
        this.clamp();
        if (j % 4)
          for (var k = 0; k < a; k++) c[j + k >>> 2] |= (e[k >>> 2] >>> 24 - 8 * (k % 4) & 255) << 24 - 8 * ((j + k) % 4);
        else if (65535 < e.length)
          for (k = 0; k < a; k += 4) c[j + k >>> 2] = e[k >>> 2];
        else c.push.apply(c, e);
        this.sigBytes += a;
        return this
      },
      clamp: function () {
        var a = this.words,
          c = this.sigBytes;
        a[c >>> 2] &= 4294967295 <<
          32 - 8 * (c % 4);
        a.length = u.ceil(c / 4)
      },
      clone: function () {
        var a = t.clone.call(this);
        a.words = this.words.slice(0);
        return a
      },
      random: function (a) {
        for (var c = [], e = 0; e < a; e += 4) c.push(4294967296 * u.random() | 0);
        return new r.init(c, a)
      }
    }),
    w = d.enc = {},
    v = w.Hex = {
      stringify: function (a) {
        var c = a.words;
        a = a.sigBytes;
        for (var e = [], j = 0; j < a; j++) {
          var k = c[j >>> 2] >>> 24 - 8 * (j % 4) & 255;
          e.push((k >>> 4).toString(16));
          e.push((k & 15).toString(16))
        }
        return e.join("")
      },
      parse: function (a) {
        for (var c = a.length, e = [], j = 0; j < c; j += 2) e[j >>> 3] |= parseInt(a.substr(j,
          2), 16) << 24 - 4 * (j % 8);
        return new r.init(e, c / 2)
      }
    },
    b = w.Latin1 = {
      stringify: function (a) {
        var c = a.words;
        a = a.sigBytes;
        for (var e = [], j = 0; j < a; j++) e.push(String.fromCharCode(c[j >>> 2] >>> 24 - 8 * (j % 4) & 255));
        return e.join("")
      },
      parse: function (a) {
        for (var c = a.length, e = [], j = 0; j < c; j++) e[j >>> 2] |= (a.charCodeAt(j) & 255) << 24 - 8 * (j % 4);
        return new r.init(e, c)
      }
    },
    x = w.Utf8 = {
      stringify: function (a) {
        try {
          return decodeURIComponent(escape(b.stringify(a)))
        } catch (c) {
          throw Error("Malformed UTF-8 data");
        }
      },
      parse: function (a) {
        return b.parse(unescape(encodeURIComponent(a)))
      }
    },
    q = l.BufferedBlockAlgorithm = t.extend({
      reset: function () {
        this._data = new r.init;
        this._nDataBytes = 0
      },
      _append: function (a) {
        "string" == typeof a && (a = x.parse(a));
        this._data.concat(a);
        this._nDataBytes += a.sigBytes
      },
      _process: function (a) {
        var c = this._data,
          e = c.words,
          j = c.sigBytes,
          k = this.blockSize,
          b = j / (4 * k),
          b = a ? u.ceil(b) : u.max((b | 0) - this._minBufferSize, 0);
        a = b * k;
        j = u.min(4 * a, j);
        if (a) {
          for (var q = 0; q < a; q += k) this._doProcessBlock(e, q);
          q = e.splice(0, a);
          c.sigBytes -= j
        }
        return new r.init(q, j)
      },
      clone: function () {
        var a = t.clone.call(this);
        a._data = this._data.clone();
        return a
      },
      _minBufferSize: 0
    });
  l.Hasher = q.extend({
    cfg: t.extend(),
    init: function (a) {
      this.cfg = this.cfg.extend(a);
      this.reset()
    },
    reset: function () {
      q.reset.call(this);
      this._doReset()
    },
    update: function (a) {
      this._append(a);
      this._process();
      return this
    },
    finalize: function (a) {
      a && this._append(a);
      return this._doFinalize()
    },
    blockSize: 16,
    _createHelper: function (a) {
      return function (b, e) {
        return (new a.init(e)).finalize(b)
      }
    },
    _createHmacHelper: function (a) {
      return function (b, e) {
        return (new n.HMAC.init(a,
          e)).finalize(b)
      }
    }
  });
  var n = d.algo = {};
  return d
}(Math);
(function () {
  var u = CryptoJS,
    p = u.lib.WordArray;
  u.enc.Base64 = {
    stringify: function (d) {
      var l = d.words,
        p = d.sigBytes,
        t = this._map;
      d.clamp();
      d = [];
      for (var r = 0; r < p; r += 3)
        for (var w = (l[r >>> 2] >>> 24 - 8 * (r % 4) & 255) << 16 | (l[r + 1 >>> 2] >>> 24 - 8 * ((r + 1) % 4) & 255) << 8 | l[r + 2 >>> 2] >>> 24 - 8 * ((r + 2) % 4) & 255, v = 0; 4 > v && r + 0.75 * v < p; v++) d.push(t.charAt(w >>> 6 * (3 - v) & 63));
      if (l = t.charAt(64))
        for (; d.length % 4;) d.push(l);
      return d.join("")
    },
    parse: function (d) {
      var l = d.length,
        s = this._map,
        t = s.charAt(64);
      t && (t = d.indexOf(t), -1 != t && (l = t));
      for (var t = [], r = 0, w = 0; w <
        l; w++)
        if (w % 4) {
          var v = s.indexOf(d.charAt(w - 1)) << 2 * (w % 4),
            b = s.indexOf(d.charAt(w)) >>> 6 - 2 * (w % 4);
          t[r >>> 2] |= (v | b) << 24 - 8 * (r % 4);
          r++
        } return p.create(t, r)
    },
    _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
  }
})();
(function (u) {
  function p(b, n, a, c, e, j, k) {
    b = b + (n & a | ~n & c) + e + k;
    return (b << j | b >>> 32 - j) + n
  }

  function d(b, n, a, c, e, j, k) {
    b = b + (n & c | a & ~c) + e + k;
    return (b << j | b >>> 32 - j) + n
  }

  function l(b, n, a, c, e, j, k) {
    b = b + (n ^ a ^ c) + e + k;
    return (b << j | b >>> 32 - j) + n
  }

  function s(b, n, a, c, e, j, k) {
    b = b + (a ^ (n | ~c)) + e + k;
    return (b << j | b >>> 32 - j) + n
  }
  for (var t = CryptoJS, r = t.lib, w = r.WordArray, v = r.Hasher, r = t.algo, b = [], x = 0; 64 > x; x++) b[x] = 4294967296 * u.abs(u.sin(x + 1)) | 0;
  r = r.MD5 = v.extend({
    _doReset: function () {
      this._hash = new w.init([1732584193, 4023233417, 2562383102, 271733878])
    },
    _doProcessBlock: function (q, n) {
      for (var a = 0; 16 > a; a++) {
        var c = n + a,
          e = q[c];
        q[c] = (e << 8 | e >>> 24) & 16711935 | (e << 24 | e >>> 8) & 4278255360
      }
      var a = this._hash.words,
        c = q[n + 0],
        e = q[n + 1],
        j = q[n + 2],
        k = q[n + 3],
        z = q[n + 4],
        r = q[n + 5],
        t = q[n + 6],
        w = q[n + 7],
        v = q[n + 8],
        A = q[n + 9],
        B = q[n + 10],
        C = q[n + 11],
        u = q[n + 12],
        D = q[n + 13],
        E = q[n + 14],
        x = q[n + 15],
        f = a[0],
        m = a[1],
        g = a[2],
        h = a[3],
        f = p(f, m, g, h, c, 7, b[0]),
        h = p(h, f, m, g, e, 12, b[1]),
        g = p(g, h, f, m, j, 17, b[2]),
        m = p(m, g, h, f, k, 22, b[3]),
        f = p(f, m, g, h, z, 7, b[4]),
        h = p(h, f, m, g, r, 12, b[5]),
        g = p(g, h, f, m, t, 17, b[6]),
        m = p(m, g, h, f, w, 22, b[7]),
        f = p(f, m, g, h, v, 7, b[8]),
        h = p(h, f, m, g, A, 12, b[9]),
        g = p(g, h, f, m, B, 17, b[10]),
        m = p(m, g, h, f, C, 22, b[11]),
        f = p(f, m, g, h, u, 7, b[12]),
        h = p(h, f, m, g, D, 12, b[13]),
        g = p(g, h, f, m, E, 17, b[14]),
        m = p(m, g, h, f, x, 22, b[15]),
        f = d(f, m, g, h, e, 5, b[16]),
        h = d(h, f, m, g, t, 9, b[17]),
        g = d(g, h, f, m, C, 14, b[18]),
        m = d(m, g, h, f, c, 20, b[19]),
        f = d(f, m, g, h, r, 5, b[20]),
        h = d(h, f, m, g, B, 9, b[21]),
        g = d(g, h, f, m, x, 14, b[22]),
        m = d(m, g, h, f, z, 20, b[23]),
        f = d(f, m, g, h, A, 5, b[24]),
        h = d(h, f, m, g, E, 9, b[25]),
        g = d(g, h, f, m, k, 14, b[26]),
        m = d(m, g, h, f, v, 20, b[27]),
        f = d(f, m, g, h, D, 5, b[28]),
        h = d(h, f,
          m, g, j, 9, b[29]),
        g = d(g, h, f, m, w, 14, b[30]),
        m = d(m, g, h, f, u, 20, b[31]),
        f = l(f, m, g, h, r, 4, b[32]),
        h = l(h, f, m, g, v, 11, b[33]),
        g = l(g, h, f, m, C, 16, b[34]),
        m = l(m, g, h, f, E, 23, b[35]),
        f = l(f, m, g, h, e, 4, b[36]),
        h = l(h, f, m, g, z, 11, b[37]),
        g = l(g, h, f, m, w, 16, b[38]),
        m = l(m, g, h, f, B, 23, b[39]),
        f = l(f, m, g, h, D, 4, b[40]),
        h = l(h, f, m, g, c, 11, b[41]),
        g = l(g, h, f, m, k, 16, b[42]),
        m = l(m, g, h, f, t, 23, b[43]),
        f = l(f, m, g, h, A, 4, b[44]),
        h = l(h, f, m, g, u, 11, b[45]),
        g = l(g, h, f, m, x, 16, b[46]),
        m = l(m, g, h, f, j, 23, b[47]),
        f = s(f, m, g, h, c, 6, b[48]),
        h = s(h, f, m, g, w, 10, b[49]),
        g = s(g, h, f, m,
          E, 15, b[50]),
        m = s(m, g, h, f, r, 21, b[51]),
        f = s(f, m, g, h, u, 6, b[52]),
        h = s(h, f, m, g, k, 10, b[53]),
        g = s(g, h, f, m, B, 15, b[54]),
        m = s(m, g, h, f, e, 21, b[55]),
        f = s(f, m, g, h, v, 6, b[56]),
        h = s(h, f, m, g, x, 10, b[57]),
        g = s(g, h, f, m, t, 15, b[58]),
        m = s(m, g, h, f, D, 21, b[59]),
        f = s(f, m, g, h, z, 6, b[60]),
        h = s(h, f, m, g, C, 10, b[61]),
        g = s(g, h, f, m, j, 15, b[62]),
        m = s(m, g, h, f, A, 21, b[63]);
      a[0] = a[0] + f | 0;
      a[1] = a[1] + m | 0;
      a[2] = a[2] + g | 0;
      a[3] = a[3] + h | 0
    },
    _doFinalize: function () {
      var b = this._data,
        n = b.words,
        a = 8 * this._nDataBytes,
        c = 8 * b.sigBytes;
      n[c >>> 5] |= 128 << 24 - c % 32;
      var e = u.floor(a /
        4294967296);
      n[(c + 64 >>> 9 << 4) + 15] = (e << 8 | e >>> 24) & 16711935 | (e << 24 | e >>> 8) & 4278255360;
      n[(c + 64 >>> 9 << 4) + 14] = (a << 8 | a >>> 24) & 16711935 | (a << 24 | a >>> 8) & 4278255360;
      b.sigBytes = 4 * (n.length + 1);
      this._process();
      b = this._hash;
      n = b.words;
      for (a = 0; 4 > a; a++) c = n[a], n[a] = (c << 8 | c >>> 24) & 16711935 | (c << 24 | c >>> 8) & 4278255360;
      return b
    },
    clone: function () {
      var b = v.clone.call(this);
      b._hash = this._hash.clone();
      return b
    }
  });
  t.MD5 = v._createHelper(r);
  t.HmacMD5 = v._createHmacHelper(r)
})(Math);
(function () {
  var u = CryptoJS,
    p = u.lib,
    d = p.Base,
    l = p.WordArray,
    p = u.algo,
    s = p.EvpKDF = d.extend({
      cfg: d.extend({
        keySize: 4,
        hasher: p.MD5,
        iterations: 1
      }),
      init: function (d) {
        this.cfg = this.cfg.extend(d)
      },
      compute: function (d, r) {
        for (var p = this.cfg, s = p.hasher.create(), b = l.create(), u = b.words, q = p.keySize, p = p.iterations; u.length < q;) {
          n && s.update(n);
          var n = s.update(d).finalize(r);
          s.reset();
          for (var a = 1; a < p; a++) n = s.finalize(n), s.reset();
          b.concat(n)
        }
        b.sigBytes = 4 * q;
        return b
      }
    });
  u.EvpKDF = function (d, l, p) {
    return s.create(p).compute(d,
      l)
  }
})();
CryptoJS.lib.Cipher || function (u) {
  var p = CryptoJS,
    d = p.lib,
    l = d.Base,
    s = d.WordArray,
    t = d.BufferedBlockAlgorithm,
    r = p.enc.Base64,
    w = p.algo.EvpKDF,
    v = d.Cipher = t.extend({
      cfg: l.extend(),
      createEncryptor: function (e, a) {
        return this.create(this._ENC_XFORM_MODE, e, a)
      },
      createDecryptor: function (e, a) {
        return this.create(this._DEC_XFORM_MODE, e, a)
      },
      init: function (e, a, b) {
        this.cfg = this.cfg.extend(b);
        this._xformMode = e;
        this._key = a;
        this.reset()
      },
      reset: function () {
        t.reset.call(this);
        this._doReset()
      },
      process: function (e) {
        this._append(e);
        return this._process()
      },
      finalize: function (e) {
        e && this._append(e);
        return this._doFinalize()
      },
      keySize: 4,
      ivSize: 4,
      _ENC_XFORM_MODE: 1,
      _DEC_XFORM_MODE: 2,
      _createHelper: function (e) {
        return {
          encrypt: function (b, k, d) {
            return ("string" == typeof k ? c : a).encrypt(e, b, k, d)
          },
          decrypt: function (b, k, d) {
            return ("string" == typeof k ? c : a).decrypt(e, b, k, d)
          }
        }
      }
    });
  d.StreamCipher = v.extend({
    _doFinalize: function () {
      return this._process(!0)
    },
    blockSize: 1
  });
  var b = p.mode = {},
    x = function (e, a, b) {
      var c = this._iv;
      c ? this._iv = u : c = this._prevBlock;
      for (var d = 0; d < b; d++) e[a + d] ^=
        c[d]
    },
    q = (d.BlockCipherMode = l.extend({
      createEncryptor: function (e, a) {
        return this.Encryptor.create(e, a)
      },
      createDecryptor: function (e, a) {
        return this.Decryptor.create(e, a)
      },
      init: function (e, a) {
        this._cipher = e;
        this._iv = a
      }
    })).extend();
  q.Encryptor = q.extend({
    processBlock: function (e, a) {
      var b = this._cipher,
        c = b.blockSize;
      x.call(this, e, a, c);
      b.encryptBlock(e, a);
      this._prevBlock = e.slice(a, a + c)
    }
  });
  q.Decryptor = q.extend({
    processBlock: function (e, a) {
      var b = this._cipher,
        c = b.blockSize,
        d = e.slice(a, a + c);
      b.decryptBlock(e, a);
      x.call(this,
        e, a, c);
      this._prevBlock = d
    }
  });
  b = b.CBC = q;
  q = (p.pad = {}).Pkcs7 = {
    pad: function (a, b) {
      for (var c = 4 * b, c = c - a.sigBytes % c, d = c << 24 | c << 16 | c << 8 | c, l = [], n = 0; n < c; n += 4) l.push(d);
      c = s.create(l, c);
      a.concat(c)
    },
    unpad: function (a) {
      a.sigBytes -= a.words[a.sigBytes - 1 >>> 2] & 255
    }
  };
  d.BlockCipher = v.extend({
    cfg: v.cfg.extend({
      mode: b,
      padding: q
    }),
    reset: function () {
      v.reset.call(this);
      var a = this.cfg,
        b = a.iv,
        a = a.mode;
      if (this._xformMode == this._ENC_XFORM_MODE) var c = a.createEncryptor;
      else c = a.createDecryptor, this._minBufferSize = 1;
      this._mode = c.call(a,
        this, b && b.words)
    },
    _doProcessBlock: function (a, b) {
      this._mode.processBlock(a, b)
    },
    _doFinalize: function () {
      var a = this.cfg.padding;
      if (this._xformMode == this._ENC_XFORM_MODE) {
        a.pad(this._data, this.blockSize);
        var b = this._process(!0)
      } else b = this._process(!0), a.unpad(b);
      return b
    },
    blockSize: 4
  });
  var n = d.CipherParams = l.extend({
      init: function (a) {
        this.mixIn(a)
      },
      toString: function (a) {
        return (a || this.formatter).stringify(this)
      }
    }),
    b = (p.format = {}).OpenSSL = {
      stringify: function (a) {
        var b = a.ciphertext;
        a = a.salt;
        return (a ? s.create([1398893684,
          1701076831
        ]).concat(a).concat(b) : b).toString(r)
      },
      parse: function (a) {
        a = r.parse(a);
        var b = a.words;
        if (1398893684 == b[0] && 1701076831 == b[1]) {
          var c = s.create(b.slice(2, 4));
          b.splice(0, 4);
          a.sigBytes -= 16
        }
        return n.create({
          ciphertext: a,
          salt: c
        })
      }
    },
    a = d.SerializableCipher = l.extend({
      cfg: l.extend({
        format: b
      }),
      encrypt: function (a, b, c, d) {
        d = this.cfg.extend(d);
        var l = a.createEncryptor(c, d);
        b = l.finalize(b);
        l = l.cfg;
        return n.create({
          ciphertext: b,
          key: c,
          iv: l.iv,
          algorithm: a,
          mode: l.mode,
          padding: l.padding,
          blockSize: a.blockSize,
          formatter: d.format
        })
      },
      decrypt: function (a, b, c, d) {
        d = this.cfg.extend(d);
        b = this._parse(b, d.format);
        return a.createDecryptor(c, d).finalize(b.ciphertext)
      },
      _parse: function (a, b) {
        return "string" == typeof a ? b.parse(a, this) : a
      }
    }),
    p = (p.kdf = {}).OpenSSL = {
      execute: function (a, b, c, d) {
        d || (d = s.random(8));
        a = w.create({
          keySize: b + c
        }).compute(a, d);
        c = s.create(a.words.slice(b), 4 * c);
        a.sigBytes = 4 * b;
        return n.create({
          key: a,
          iv: c,
          salt: d
        })
      }
    },
    c = d.PasswordBasedCipher = a.extend({
      cfg: a.cfg.extend({
        kdf: p
      }),
      encrypt: function (b, c, d, l) {
        l = this.cfg.extend(l);
        d = l.kdf.execute(d,
          b.keySize, b.ivSize);
        l.iv = d.iv;
        b = a.encrypt.call(this, b, c, d.key, l);
        b.mixIn(d);
        return b
      },
      decrypt: function (b, c, d, l) {
        l = this.cfg.extend(l);
        c = this._parse(c, l.format);
        d = l.kdf.execute(d, b.keySize, b.ivSize, c.salt);
        l.iv = d.iv;
        return a.decrypt.call(this, b, c, d.key, l)
      }
    })
}();
(function () {
  for (var u = CryptoJS, p = u.lib.BlockCipher, d = u.algo, l = [], s = [], t = [], r = [], w = [], v = [], b = [], x = [], q = [], n = [], a = [], c = 0; 256 > c; c++) a[c] = 128 > c ? c << 1 : c << 1 ^ 283;
  for (var e = 0, j = 0, c = 0; 256 > c; c++) {
    var k = j ^ j << 1 ^ j << 2 ^ j << 3 ^ j << 4,
      k = k >>> 8 ^ k & 255 ^ 99;
    l[e] = k;
    s[k] = e;
    var z = a[e],
      F = a[z],
      G = a[F],
      y = 257 * a[k] ^ 16843008 * k;
    t[e] = y << 24 | y >>> 8;
    r[e] = y << 16 | y >>> 16;
    w[e] = y << 8 | y >>> 24;
    v[e] = y;
    y = 16843009 * G ^ 65537 * F ^ 257 * z ^ 16843008 * e;
    b[k] = y << 24 | y >>> 8;
    x[k] = y << 16 | y >>> 16;
    q[k] = y << 8 | y >>> 24;
    n[k] = y;
    e ? (e = z ^ a[a[a[G ^ z]]], j ^= a[a[j]]) : e = j = 1
  }
  var H = [0, 1, 2, 4, 8,
      16, 32, 64, 128, 27, 54
    ],
    d = d.AES = p.extend({
      _doReset: function () {
        for (var a = this._key, c = a.words, d = a.sigBytes / 4, a = 4 * ((this._nRounds = d + 6) + 1), e = this._keySchedule = [], j = 0; j < a; j++)
          if (j < d) e[j] = c[j];
          else {
            var k = e[j - 1];
            j % d ? 6 < d && 4 == j % d && (k = l[k >>> 24] << 24 | l[k >>> 16 & 255] << 16 | l[k >>> 8 & 255] << 8 | l[k & 255]) : (k = k << 8 | k >>> 24, k = l[k >>> 24] << 24 | l[k >>> 16 & 255] << 16 | l[k >>> 8 & 255] << 8 | l[k & 255], k ^= H[j / d | 0] << 24);
            e[j] = e[j - d] ^ k
          } c = this._invKeySchedule = [];
        for (d = 0; d < a; d++) j = a - d, k = d % 4 ? e[j] : e[j - 4], c[d] = 4 > d || 4 >= j ? k : b[l[k >>> 24]] ^ x[l[k >>> 16 & 255]] ^ q[l[k >>>
          8 & 255]] ^ n[l[k & 255]]
      },
      encryptBlock: function (a, b) {
        this._doCryptBlock(a, b, this._keySchedule, t, r, w, v, l)
      },
      decryptBlock: function (a, c) {
        var d = a[c + 1];
        a[c + 1] = a[c + 3];
        a[c + 3] = d;
        this._doCryptBlock(a, c, this._invKeySchedule, b, x, q, n, s);
        d = a[c + 1];
        a[c + 1] = a[c + 3];
        a[c + 3] = d
      },
      _doCryptBlock: function (a, b, c, d, e, j, l, f) {
        for (var m = this._nRounds, g = a[b] ^ c[0], h = a[b + 1] ^ c[1], k = a[b + 2] ^ c[2], n = a[b + 3] ^ c[3], p = 4, r = 1; r < m; r++) var q = d[g >>> 24] ^ e[h >>> 16 & 255] ^ j[k >>> 8 & 255] ^ l[n & 255] ^ c[p++],
          s = d[h >>> 24] ^ e[k >>> 16 & 255] ^ j[n >>> 8 & 255] ^ l[g & 255] ^ c[p++],
          t =
          d[k >>> 24] ^ e[n >>> 16 & 255] ^ j[g >>> 8 & 255] ^ l[h & 255] ^ c[p++],
          n = d[n >>> 24] ^ e[g >>> 16 & 255] ^ j[h >>> 8 & 255] ^ l[k & 255] ^ c[p++],
          g = q,
          h = s,
          k = t;
        q = (f[g >>> 24] << 24 | f[h >>> 16 & 255] << 16 | f[k >>> 8 & 255] << 8 | f[n & 255]) ^ c[p++];
        s = (f[h >>> 24] << 24 | f[k >>> 16 & 255] << 16 | f[n >>> 8 & 255] << 8 | f[g & 255]) ^ c[p++];
        t = (f[k >>> 24] << 24 | f[n >>> 16 & 255] << 16 | f[g >>> 8 & 255] << 8 | f[h & 255]) ^ c[p++];
        n = (f[n >>> 24] << 24 | f[g >>> 16 & 255] << 16 | f[h >>> 8 & 255] << 8 | f[k & 255]) ^ c[p++];
        a[b] = q;
        a[b + 1] = s;
        a[b + 2] = t;
        a[b + 3] = n
      },
      keySize: 8
    });
  u.AES = p._createHelper(d)
})();
