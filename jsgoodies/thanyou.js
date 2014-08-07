var Mentor = function (props, message) {
	var p = props, m = message;
	this.name = p.name ? p.name : "Yoda";
	this.message = (!!m) ? m : "I like to teach";
	this.level = p.level ? p.level : 100; 
};

var Disciple = function ()  {
	Mentor.apply(this, arguments);
};

var props = {
	name: "Luke Skywalker",
	level: 75
};

var student = new Disciple(props);