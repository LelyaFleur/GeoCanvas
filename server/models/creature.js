var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Creature = new Schema({
  name: String,
  telephone: Number,
  coordinates: {
    lat: Number,
    long: Number
  }  
});

module.exports = mongoose.model('creature', Creature);