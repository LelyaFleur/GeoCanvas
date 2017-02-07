// category model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Categories = new Schema({
  category: String,
  shortname: String,
  number: Number,
  numberVote: Number
});

module.exports = mongoose.model('categories', Categories);