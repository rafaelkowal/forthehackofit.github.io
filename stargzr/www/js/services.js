angular.module('starter.services', ['ngResource'])
.factory('Actor', function($resource) {
  return $resource('/api/actors/:_name');
});