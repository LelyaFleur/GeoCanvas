//priority model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Priority = new Schema({
	name: String,
	level: Number,
	number: Number
});

module.exports = mongoose.model('priorities', Priority);
