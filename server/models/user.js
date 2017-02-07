

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var telNumberSchema = new mongoose.Schema({ 
  _id:false, 
  number: Number
});

var UserSchema = new Schema({
  name: {
        type: String,
        unique: true,
        required: true
    },
  password: {
        type: String,
        required: true
    },
  fullname: String,
  sex: String,
  email: String,
  direction: String,
  tel: [telNumberSchema],
  priority: String,
  adminpower: Boolean,
  temporal: Boolean
});
 
UserSchema.pre('save', function (next) {
    var user = this;
    console.log("isModified:" + this.isModified('password'));
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }

            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});
 
UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};
 
module.exports = mongoose.model('users', UserSchema);