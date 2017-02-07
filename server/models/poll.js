var mongoose = require('mongoose');
//var voteSchema = new mongoose.Schema({ ip: 'String' });
var choiceSchema = new mongoose.Schema({ 	
	text: String,
	votes: Number
});

var userSchema = new mongoose.Schema({
	_id:false,
	user_id: String,
	username: String
});

var PollSchema = new mongoose.Schema({
	priority: {vote: String, watch: String, result: String},
	category: String,	
	question: String,
 	choices: [choiceSchema],
	submissions: [userSchema],
	state: Number,
	lifeCycleState: Number,
	publishDate: { startDate: Date, endDate: Date },
	totalVotes: Number,
	active: Boolean,
	validated: Boolean,
	notification: Boolean,
	showResults: Boolean,
	createdby: userSchema
});

// return the model

module.exports = mongoose.model('polls', PollSchema);