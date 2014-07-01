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
// d9e6e07490160fe90b54a6609dbde93b
// https://api.themoviedb.org/3/movie/550?api_key=


var actorSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    also_known_as: String,
    summary: String,
    birthday: Date,
    place_of_birth: String,
    profile_path: String,
    portrait: String,
    biography: String,
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    movies: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Movie'
    }]
});

var userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String
});

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

var Actor = mongoose.model('Actor', actorSchema);
var User = mongoose.model('User', userSchema);

/*** Schedule cron tasks ***/
var agenda  = require('agenda')({ db: { address: "127.0.0.1:27017/stargzr" } });
var _ = require('lodash');

agenda.define('get latest', function(job, done) {
    request('https://api.themoviedb.org/3/'+job.attrs.data+'?api_key=d9e6e07490160fe90b54a6609dbde93b', function (error, response, body) {
        if (error) return next(error);
      //console.log('Status:', response.statusCode);
      //console.log('Headers:', JSON.stringify(response.headers));
      //console.log('Response:', JSON.parse(body).results);
      var data = JSON.parse(body);
      _.each(data.results, function(person) {
        var actor = new Actor({
            _id: person.id,
            name: person.name,
            also_known_as: person.also_known_as,
            biography: person.biography,
            portrait: person.profile_path,
            birthday: person.birthday,
            place_of_birth: person.place_of_birth
        });
        //console.log(actor);
        actor.save(function(err, actor) {
            if (err) return console.error(err);
        });
      });
      done();
    });
    
});

agenda.schedule('daily pull', 'get latest', 'person/popular').repeatEvery('1 days');
agenda.start();

agenda.on('start', function(job) {
  console.log("Job %s starting", job.attrs.name);
  console.log(JSON.stringify(job));
});

agenda.on('complete', function(job) {
  console.log("Job %s finished", job.attrs.name);
});

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var actors = [
    {
        _id: 1,
        name: "Samuel L. Jackson",
        movies: [
            { title: "Turbo", year: "2013" },
            { title: "Avengers", year: "2012" }
        ]
    },
    {
        _id: 2,
        name: "Bill Murray",
        movies: [
            { title: "Ghostbusters", year: "1985" },
            { title: "Me, Myself and I", year: "2002" }
        ]
    }
];

// api routes

// all actors
app.get('/api/actors', function(req, res, next) {
  var query = Actor.find();
  query.limit(30);
  query.exec(function(err, actors) {
    if (err) return next(err);
    res.send(actors);
  });
});

// get one actor
app.get('/api/actors/:id', function(req, res, next) {
    Actor.findById(req.params.id, function(err, actor) {
        if(err)
            return next(err);
        //console.log(actor);
        res.send(actor);
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
