# [Katana](https://github.com/Shogun147/Katana) 

Easy to use, hmvc scalable web framework for any Node.js samurai, focuses on simplicity, maintainability and performance.

## Contents

* [Features](#features)
* [Installation](#installation)
* [Quick start](#quick-start)
* [Routing](#routing)
* [Modules](#modules)
* [Controllers](#controllers)
  * [Hooks](#hooks)
* [Models](#models)
* [Views](#views)
* [Events](#events)
* [Sessions](#sessions)
* [Examples](#examples)
* [Contributing](#contributing)
* [License](#license)

## Features

* Powerful, flexible classical router
* Scalable through HMVC architecture 
* Environment based configuration
* Application quick generators
* Cookies and Session support
* Templating, partials support
* Fully non-blocking
* …

## Installation

Fastest way to get Katana is to install it with NPM:

    $ npm install -g katana

## Quick start

The quickest way to start is to utilize the Katana executable to generate an application:

    $ katana create app
    $ cd app
    $ npm install

The app path is optional and is relative to current path.

Then you are ready to start the server:

    $ node app

### Basic application layout after creation will look like this:
    .
    ├── app.js
    ├── application
    │   ├── config
    │   │   ├── development
    │   │   │   ├── application.js
    │   │   │   ├── routing.js
    │   │   │   └── stores.js
    │   │   └── production
    │   ├── controllers
    │   │   └── home.js
    │   ├── models
    │   └── views
    │       └── index.html
    ├── modules
    ├── public
    │   ├── images
    │   ├── scripts
    │   └── styles
    └── temp

## Routing

Classical routing is one the most powerful futures of Katana framework. It uses uri segments to determine the controller and action for a requested URI.<br>
So unlike in other Node.js framework you may just add controllers and actions without the need to create routing rules, but also let you write your own rules which may change the path.<br>
Without any rules, uri path will be treated as: http://katana:8000/`controller`/`action`/`arg1`/../`argN`

So if uri path is: `http://katana:8000/account/login`<br>
Then `controller=account` and `action=login`.

If there no uri segments then default path will be used, `home` as controller and `index` as action.

You can also rewrite path by set the routing rule, for example to view user profile:

    routes: {
      // each request method may have it's own routes
      get: [
        ['user/:user_id', 'users/profile']
      ]

      // also you can set routes for all methods
      all: [
        // if routes will not match for requested method then will try this routes
      ]
    }

or you may set request method as route prefix:


    routes: [
      ['get user/:user_id', 'users/profile'], // will route this for get method
      ['* user/:user_id', 'users/profile'] // all methods
      ['user/:user_id', 'users/profile'] // if not set then will check all methods
    ]


This will set `controller=users` and `action=profile` and user_id will be available as `Request.params.user_id`.

Or you may pass this request to mvc module:

    routes: {
      get: [
        ['user/:user_id', '#auth/users/profile']
      ]
    }

The `#` symbol meen that this request will pass to `auth` module, `controller=users` and `action=profile`.

You could also set format for user_id like so:

    routes: {
      get: [
        ['user/:user_id([0-9]+)', '#auth/users/profile']
      ]
    }

`!important:` mvc modules may have their own routing rules.

More examples:
  
    ['news/:category/rss.:format(xml|json)?', 'news/rss'] will allow:
     news/any_category/rss
     news/any_category/rss.xml
     news/any_category/rss.json

     and News controller:

     methods: {
       rss: function(Response, Request) {
         // Now we can use Request.params.category and Request.params.format
         var format = Request.params.format || 'xml'; // default xml

         ...
       }
     }

## Modules

In Katana modules can be used as mvc part or your application or as middleware.

For mvc modules you can use routing the same way as for main mvc.<br>
Also you can run them as widgets by calling run method: 

    Module('auth').run('users/list');

This will run `list` action of `users` controller from `auth` module.

Middleware modules can listen specific application events and interact as they need.

For example auth module can look like this:

    var User = App.Model('auth:user'); // get user model of auth module

    // listen new request event
    App.on('request', function(Request, Response, callback) {
      Request.user = new User(Request.session);

      callback(); // callback when we're done here, required for application to continue
    });

and then in our controller we can access user object as `Request.user`.

## Controllers

Controllers are almost most important part of any application, they handle incoming requests and send responses.

A simple controller looks like this:

    // define our controller Class
    Class('Home_Controller', {
      isa: App.Controller, // extend Katana Core Controller

      methods: {
        index: function(Response, Request) {
          Response.send('Hello World!');
        }
      }
    });

    module.exports = new Home_Controller;

And now we can access this `index` action by opening http://katana:8000/, without any uri path this will use default controller and action from config which are `home` and `index`. Also we can access them directly by opening http://katana:8000/`home`/ with `index` as default action or http://katana:8000/`home`/`index`.

### Hooks

Due the power of Joose [Method Modifiers](http://joose.github.com/Joose/doc/html/Joose/Manual/MethodModifiers.html) (`before`, `after`, `override` and `around`) we may change the way class methods are called, actions that may happen before or after method call or even modify results that they could return.

For example let's restrict index method only for logged in users:

    Class('Home_Controller', {
      isa: App.Controller,

      methods: {
        index: function(Response, Request) {
          Response.send('Hello World!');
        }
      },

      around: {
        // the same name for the method we want to wrap
        index: function(method, Response, Request) {
          var User = Request.user;

          // if the user is not logged in then redirect to login page
          if (!User.logged_in()) {
            return Request.redirect('/login');
          }

          // else wee call original method
          method(Response, Request);
        }
      }
    });

The `call` modifier allow as to use regular expressions and apply that hook to all methods that matches the condition.

For example let's restrict access for all methods:

    Class('Home_Controller', {
      isa: App.Controller,

      methods: {
        index: function(Response, Request) {
          Response.send('Hello World!');
        }
      },

      call: {
        // use regexp instead of methods name
        // this will apply to all controller methods calls
       '.*': function(method, Response, Request) {
          var User = Request.user;

          // if the user is not logged in then redirect to login page
          if (!User.logged_in()) {
            return Request.redirect('/login');
          }

          // else we call original method
          method(Response, Request);
        }
      }
    });


## Models

Katana did not limit the developer to define a model in some way or to use a specific module. It just autoload all from the models directory of application or a module and store them in a local registry.

You can access them like this:<br>

    var News = App.Model('news'); // get model object

To get a model from module you need to separate module name and model path with colon `:`, for example to get `user` model of `auth` module call: `App.Model('auth:user')`.

Model file can look like this:

    var Mongoose = App.Store('mongoose'); // get mongoose connection, look at stores config file
    var Schema = require('mongoose').Schema;

    var User = new Schema({
      username: String,
      password: String,
      email: String,
      signed_at: Date,
      roles: ['user', 'moderator', 'administrator']
    });

    module.exports = Mongoose.model('User', User);

## Views

To render a view you can use a few methods:

    var View = App.View;

    Class('Home_Controller', {
      isa: App.Controller,

      methods: {
        index: function(Response, Request) {
          // directly render and send a view content
          Response.render('index', { title: 'Hello World' }); // this will render index.html file from views

          // get rendered content
          var content = View.render('index', { title: 'Hello World' });
          // and latter send response
          Response.send(content);

          // render a view from module
          Users.find({}, function(error, users) {
            if (error) { return Response.send('Error! Blablabla'); }

            // again module name separated by colon, and then path to the view
            var list = View.render('auth:list', users);

            Response.render('index', { users: list });
          });
        }
      }
    });

Controllers can also have their global data, which will be passed for the this.render calls:
  
    Class('Home_Controller', {
      isa: App.Controller,
    
      have: {
        // set global controller data
        data: {
          title: 'This is title for all pages for this controller',
          total_requests: 0
        }
      },
    
      methods: {
        index: function(Response) {
          // you can also set global controller data from actions
          this.set('copyright', 'blablabla');
          // or
          this.data.total_requests++;
        
          // by render the view with this.render method, the controller data will pass to this view
          var content = this.render('index'); // <?-title?>, <?-total_requests?>
        
          // we may also rewrite globals by set them on render
          var content = this.render('index', { title: 'This is rewritted title', foo: 'bar' });
        
          Response.send(content);
        }
      }
    });

## Events

Katana application emit specific events for different steps.
Few of them are available for middlewares, the others are for bootstrap control flow.

For example, `auth` module can listen `request` event to assign a user model for request (see Modules).

Or a `chat` module which need application server to create a socket.io server.

    var socket_io = require('socket.io');
    var io;

    // ready event is emitted when Http.Server start listening
    App.on('ready', function(callback) {
	  io = socket_io.listen(App.server);
	
	  io.sockets.on('connection', function (socket) {
	    // …
	  });
	
	  callback();
    });

## Sessions

Katana has build in module for supporting sessions.
This gives you a way to associate data with each particular visitor of your app and have that data persist between requests.

### Data stores
For now Katana support only 2 session data stores (more to come):

* **Memory** (by default): useful for development. Session data is saved in memory at worker-process level, which means this will not work with cluster. Also, all sessions disappear when app is restarted.

* **Redis**: Sessions are saved in a redis noSQL database and persist across app restarts. Requires a Redis server or clusters.

### Using sessions

First of all you need to enable sessions in application config file.
The default session config look like this:

    session: {
      // enable or disable session support
		  enabled: true,
		
		  // session identifier name for cookie of
		  key_name: 'session_id',
		
		  // session id length
		  key_length: 32,
		
		  // lifetime before delete inactive session
		  lifetime: 1000 * 60 * 60 * 24 * 7,
		
		  // session store, one from config/stores.js
		  store: 'redis',
		
      // default data for new sessions
		  defaults: {
		  
		  }
    }

Once you enable sessions, the session object will be assigned to each request and data will be loaded automatically from the session store.
Then this object could be accessed as `Request.session`.
For now available public methods are `set`, `get` and `remove`.

Example counter of user requests:

    index: function(Response, Request) {
      var Session = Request.session;

      // get current requests count, default 0
      var counter = Session.get('requests', 0);

      counter++;

      // set new value
      Session.set('requests', counter);

      // Session data will be automatically saved in store before sending response
      // Also will save session id in the cookie with key_name from config
      Response.send('You have visited this page '+ counter +' times');
    }

## Examples

* [ToDo](https://github.com/Shogun147/Katana-ToDo) - Simple todo application

## Contributing
Anyone interested or who like the framework idea can contribute by sending new ideas, issues or pull requests. Any help would be appreciated.

## License
The MIT License

Copyright © 2012 D.G. Shogun <Shogun147@gmail.com>




























