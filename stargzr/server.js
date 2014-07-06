var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1/stargzr');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

mongoose.set('_debug', true);

var request = require('request');
var async = require('async');
// d9e6e07490160fe90b54a6609dbde93b
// https://api.themoviedb.org/3/movie/550?api_key=


var starSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    portrait: String,
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    movies: [{}],
    aka: String,
    summary: String,
    birthday: Date,
    birthplace: String,
    profile: String,
    biography: String,
    slug: String
});

starSchema.pre('save', function(next) {
  this.slug = slugify(this.name);
  this.movies.map(function(movie) {
    movie.slug = slugify(movie.title);
  });
  next();
});

var userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String
});

var movieSchema = new mongoose.Schema({
  _id: Number,
  backdrop_path: String,
  genres: [{}],
  imdb_id: String,
  original_title: String,
  title: { type: String, required: true },
  overview: String,
  poster_path: String,
  release_date: Date,
  status: String,
  tagline: String,
  cast: [{}],
  vote_average: Number,
  vote_count: Number,
  slug: { type: String, unique: true }
});

movieSchema.pre('save', function(next) {
  this.slug = slugify(this.title);
  next();
});

function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

var Star = mongoose.model('Star', starSchema);
var User = mongoose.model('User', userSchema);
var Movie = mongoose.model('Movie', movieSchema);

/*** Schedule cron tasks ***/
var agenda  = require('agenda')({ db: { address: "127.0.0.1:27017/stargzr" } });
var _ = require('lodash');
var apiUrl = "https://api.themoviedb.org/3/",
    apiKey = "d9e6e07490160fe90b54a6609dbde93b";

agenda.define('get latest', { priority: 'high', concurrency: 10 }, function(job, done) {
    async.waterfall([
      /* get the basic start info */
      function (callback) {
        request(apiUrl+job.attrs.data+'?api_key='+apiKey, function (err, response, body) {
            if (err) return next(err);
            var data = JSON.parse(body);
            //console.log(data);
            _.each(data.results, function(person) {
              var star = new Star({
                  _id: person.id,
                  name: person.name,
                  portrait: person.profile_path
              });
              callback(err, star);
              //console.log(star);
            }); 
          });
      },
      /* then get the advance info */
      function (star, callback) {
        //console.log(star);
        request(apiUrl+"person/"+star._id+"?api_key="+apiKey, function (err, response, body) {
          if (err) return next(err);
          var meta = JSON.parse(body);
              //console.log(meta);
              star.aka = meta.also_known_as;
              star.biography = meta.biography;
              star.birthday = meta.birthday;
              star.birthplace = meta.place_of_birth;
               //console.log(star);
          callback(err, star);
        });

      },
      /* let's get all the movies where the star played */
      function (star, callback) {
        request(apiUrl+"person/"+star._id+"/movie_credits"+"?api_key="+apiKey, function (err, response, body) {
          if(err) return next(error);
          var playedIn = JSON.parse(body);
          star.movies = playedIn.cast;
          callback(err, star);
        });
      }
    ], function (err, star) {
      if (err) {
        console.log(err);
        return;
      }
      star.save(function(err, star) {
        if (err) return;
      });
      done();
    });
  
});

var dailyPull = agenda.schedule('daily pull', 'get latest', 'person/popular');
    dailyPull.repeatEvery('0 16 15 * *').save();

//agenda.start();

agenda.on('start', function(job) {
  console.log("Job %s starting", job.attrs.name);
  //console.log(JSON.stringify(job));
});

agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'www')));


// var stars = [
//     {
//         _id: 1,
//         name: "Samuel L. Jackson",
//         movies: [
//             { title: "Turbo", year: "2013" },
//             { title: "Avengers", year: "2012" }
//         ]
//     },
//     {
//         _id: 2,
//         name: "Bill Murray",
//         movies: [
//             { title: "Ghostbusters", year: "1985" },
//             { title: "Me, Myself and I", year: "2002" }
//         ]
//     }
// ];

// api routes

// all stars
app.get('/api/actors', function(req, res, next) {
  var query = Star.find();
  query.limit(30);
  query.exec(function(err, stars) {
    if (err) return next(err);
    res.send(stars);
  });
});

// get one star
app.get('/api/actors/:_id/:slug', function(req, res, next) {
    console.log(req.params);
    Star.findById(req.params._id, function(err, star) {
        if(err)
            return next(err);
        console.log(star);
        res.send(star);
    });
});

// get a movie
app.get('/api/movies/:_id/:slug', function (req, res, next) {
  Movie.findById(req.params._id, function (err, movie) {
    if (err) return next(err);
    if(!!movie) {
      res.send(movie);
    } else {
      request(apiUrl+"movie/"+req.params._id+"?api_key="+apiKey, function (err, response, body) {
        if(err) return next(err);
        var _movie = JSON.parse(body);
        console.log(_movie);
        var movie = new Movie(_movie);
        movie.save(function(err, m) {
          if (err) return;
        });
        res.send(movie);
      });
    }
  });
});

app.get('/hello', function(req, res, next) {
    res.send("Hello");
});

app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
