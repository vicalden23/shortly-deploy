var path = require('path');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')
  },
  useNullAsDefault: true
});
var db = require('bookshelf')(knex);

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('baseUrl', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('users').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function (user) {
      user.increments('id').primary();
      user.string('username', 100).unique();
      user.string('password', 100);
      user.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

module.exports = db;
;var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save().then(function(newLink) {
          Links.add(newLink);
          res.status(200).send(newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username })
    .fetch()
    .then(function(user) {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, function(match) {
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        });
      }
    });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username })
    .fetch()
    .then(function(user) {
      if (!user) {
        var newUser = new User({
          username: username,
          password: password
        });
        newUser.save()
          .then(function(newUser) {
            Users.add(newUser);
            util.createSession(req, res, newUser);
          });
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    });
};

exports.navToLink = function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};;var request = require('request');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

exports.isLoggedIn = function(req, res) {
  return req.session ? !!req.session.user : false;
};

exports.checkUser = function(req, res, next) {
  if (!exports.isLoggedIn(req)) {
    res.redirect('/login');
  } else {
    next();
  }
};

exports.createSession = function(req, res, newUser) {
  return req.session.regenerate(function() {
      req.session.user = newUser;
      res.redirect('/');
    });
};
