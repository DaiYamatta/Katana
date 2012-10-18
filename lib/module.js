var Fs      = require('fs');
var Path    = require('path');

var Config = App.Config;
var View   = App.View;
var Model  = App.Model;
var Router = require('./router');

var load  = App.Utils.load;
var merge = App.Utils.merge;

Class('Katana.Core.Module', {
  have: {
	name: 'Katana.Module',
	controllers: {}
  },
	
  methods: {
	initialize: function() {
	  var Module = this;
	},
	
	run: function(uri) {
	  uri = uri || '';
			
	  var args = Array.prototype.slice.call(arguments, 1);
		
	  return this._run(uri, args, false);
	},
		
	run_uri: function(uri, args, method) {
	  return this._run(uri, args, true, method);
	},
		
	_run: function(uri, args, use_routes, method) {
	  var Module = this;
			
	  method = method || 'get';
		
	  if (!use_routes) {
		uri = uri.replace('.', '/');
				
		uri = uri.replace(/^([a-z]+):/, function(_, m) {
	      method = m;

		  return '';
		});
	  }
			
	  var routing = merge({}, App.Config(Module.name + ':routing'));
			
	  if (!use_routes) { routing.routes = []; }
			
	  var route = Router.route(uri, method, routing, Module.name, use_routes);
			
	  route.arguments = args.concat(route.arguments);
			
	  var Controller = Module.controllers[route.directory + route.controller];
			
	  if (Controller != undefined) {
	    if (typeof(Controller[route.action]) === 'function') {
		  return Controller[route.action].apply(Controller, route.arguments);
		} else {
		  throw new Error('Could not find action '+ route.action +' for controller '+ route.controller +' in module '+ Module.name);
		}
	  } else {
		throw new Error('Could not find controller '+ route.controller +' for module '+ Module.name);
	  }
	}
  }
});

var modules = {};

module.exports = Module = function(module) {
  if (module === '*') {
	return modules;
  } else if (module) {
	return modules[module];
  }
	
  return Katana.Core.Module;
}

for (var module in App.info.katana.modules) {
  if (App.info.katana.modules[module].enabled) {
    modules[module] = module;
  }
}

App.on('boot.config', function(callback) {
  for (module in modules) {
	Config.load(module);
  }
	
  callback();
});

App.on('boot.models', function(callback) {
  var pending = Object.keys(modules).length;
	
  if (!pending) { callback(); }
	
  for (module in modules) {
	Model.load(module, function() {
  	  if (!--pending) { return callback(); }
	});
  }
});

App.on('boot.views', function(callback) {
  var pending = Object.keys(modules).length;
	
  if (!pending) { return callback(); }
	
  for (module in modules) {
	View.load(module, function() {
	  if (!--pending) { callback(); }
	})
  }
});

App.on('boot.modules', function(callback) {	
  for (module in modules) {
	modules[module] = require(root +'modules/'+ module);
  }
	
  callback();
});

App.on('boot.controllers', function(callback) {
  var pending = Object.keys(modules).length;
	
  if (!pending) { return callback(); }
	
  Object.keys(modules).forEach(function(module) {
	load(root +'modules/'+ module +'/controllers', function(error, controllers) {
	  if (error) { throw error; }
			
	  modules[module].controllers = controllers;
			
	  if (!--pending) { callback(); }
	});
  });
});
