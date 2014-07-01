angular.module('starter.services', ['ngResource'])
.factory('Actors', function($resource) {
  return $resource('api/actors/');
})
.factory('Actor', function($resource) {
  return $resource('/api/actors/:_id');
});