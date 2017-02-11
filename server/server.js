// set up ========================
    var express  = require('express');
    var app      = express(); 
    var querystring = require('querystring');              
    var mongoose = require('mongoose'); 
    var morgan = require('morgan');                         // log requests to the console (express4)
    var bodyParser = require('body-parser');                // pull information from HTML POST (express4)
    var methodOverride = require('method-override');        // simulate DELETE and PUT (express4)
    var http = require('http');
    var path = require('path');
    var passport = require('passport');   
    var expressSession = require('express-session'); 
    var nodemailer = require('nodemailer');

    var smtpTransport = require('nodemailer-smtp-transport');
    var config  = require('./config/database'); // get db config file  
    var lt = require('long-timeout'); 
   
    var User = require('./models/user');     
    
    var port        = process.env.PORT || 8000;
    var jwt         = require('jwt-simple');
    var server = null;
    var io = null;


    // watch survey states
    function startPoll(poll) {
        var id = poll._id;        
        
        var now = new Date().valueOf();
        var time = poll.publishDate.startDate.valueOf() - now;       
        
        setTimeout(function () {
            Poll.findOne({_id: id}, {submissions:0}, function (err, poll) {
                poll.lifeCycleState = 1;
                poll.save();
                io.sockets.emit('status', { status: 1, id: poll._id, poll: ""});
                endPoll(poll);
                // TODO Call io
            });
        }, time);
        
    }

  
   /* function setLongTimeout(callback, ms) {
      if (typeof callback !== 'function')
        throw new Error('Callback must be a function');
       ms = parseInt(ms);
       if (Number.isNaN(ms))
        throw new Error('Delay must be an integer');

      var args = Array.prototype.slice.call(arguments,2);
      console.log("args:" + args);
      var cb = callback.bind.apply(callback, [this].concat(args));

      var longTimeout = {
        timer: null,
        clear: function() {
          if (this.timer)
            clearTimeout(this.timer);
        }
      };

      var max = 2147483647;
      if (ms <= max) 
        longTimeout.timer = setTimeout(cb, ms);
      else {
        var count = Math.floor(ms / max); // the number of times we need to delay by max
        var rem = ms % max; // the length of the final delay
        (function delay() {
          if (count > 0) {
            count--;
            longTimeout.timer = setTimeout(delay, max);
          } else {
            longTimeout.timer = setTimeout(cb, rem);
          }
        })();
      }
      return longTimeout;
    }*/


    function clearLongTimeout(longTimeoutObject) {
      if (longTimeoutObject && 
          typeof longTimeoutObject.clear === 'function')
        longTimeoutObject.clear()
    }

    function endPoll(poll) {
        var id = poll._id;
        var now = new Date().valueOf();
        var time = poll.publishDate.endDate.valueOf() - now;
        // console.log("poll question:" + poll.question);
        // console.log("now:" + now);
        // console.log("end:" + poll.publishDate.endDate.valueOf());
        // console.log("time:" + time);  
        // console.log("lifeCycle:" + poll.lifeCycleState);
        // console.log("Before timeout");  
        /* setLongTimeout(function(id) {
            console.log("id:" + id);
            Poll.findOne({_id: id}, {submissions:0}, function (err, poll) {
                poll.lifeCycleState = 2;               
                poll.save();
                console.log("Life cycle changed: " + poll.question);
                io.sockets.emit('status', { status: 2, id: poll._id, poll: poll });
            });
         }, time); */

         lt.setTimeout(function() {
            Poll.findOne({_id: id}, {submissions:0}, function (err, poll) {
                            poll.lifeCycleState = 2;               
                            poll.save();
                            console.log("Life cycle changed: " + poll.question);
                            io.sockets.emit('status', { status: 2, id: poll._id, poll: poll });
                        });
            }, time);
    }


     function checkStates(err, polls) {
        var now = new Date().valueOf();
        console.log("Checking states...");       
        polls.forEach(function (poll) {
         //   console.log("Poll name:" + poll.question);
          //  var start = poll.publishDate.startDate.valueOf();
            var end = poll.publishDate.endDate.valueOf();
         //  console.log("end:" + poll.publishDate.endDate);
          // console.log("now:"+ new Date());
            if (now >= end) {
                poll.lifeCycleState = 2;
            } else if (poll.validated) {
                poll.lifeCycleState = 1;
            } else {
                poll.lifeCycleState = 0;
            }
          //  console.log("lifeCycle:" + poll.lifeCycleState);
            poll.save();

           /* switch (poll.lifeCycleState) {
                case 0:
                    startPoll(poll);
                    break;
                case 1:
                    endPoll(poll);
                    break;
            }*/

            if(poll.lifeCycleState === 1) {
                endPoll(poll);
            }

        });       
    }
   

    /*
    npm install nodemailer-smtp-transport*/
    var transporter = nodemailer.createTransport(smtpTransport({
    host: 'smtp.esquerra.cat',
    port: 465,
    secure: true, // use SSL 
    auth: {
            user: 'fedgirona@esquerra.cat',
            pass: '@Ultonia23'
        },   
    tls: {
        rejectUnauthorized: false
    }
    }));
  /*  var smtpConfig = {
    host: 'smtp.esquerra.cat',
    port: 465,
    secure: true, // use SSL 
    auth: {
        user: 'fedgirona@esquerra.cat',
        pass: '@Ultonia23'
    }
    };

    var transporter = nodemailer.createTransport('smtps://lelya.fleur%40gmail.com:svinka5pyatochok@smtp.gmail.com');*/

    /*
    //http://stackoverflow.com/questions/26099487/smtp-using-nodemailer-in-nodejs-without-gmail
    var smtpTransport = nodemailer.createTransport('SMTP', {
    host: 'yourserver.com',
    port: 25,
    auth: {
        user: 'username',
        pass: 'password'
    }
    });*/
    
    // configuration =================

    // CORS
    app.use(function(req, res, next) {
       /* res.header('Access-Control-Allow-Origin', "*");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();*/

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });


    // get our request parameters
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
     
    // log to console
    app.use(morgan('dev'));
     
    // Use the passport package in our application
    app.use(passport.initialize());

   
     
    // demo Route (GET http://localhost:8080)
    app.get('/', function(req, res) {
      res.send('Hello! The API is at http://localhost:' + port + '/api');
    });
     
    // Start the server
    server = app.listen(port);
    console.log('Play the game: http://localhost:' + port);
    io = require('socket.io').listen(server);
    // connect to database
    mongoose.connect(config.database);
     
    // pass passport for configuration
    require('./config/passport')(passport);
  //  Poll.find(checkStates);

    // routes ======================================================================

    // bundle our routes
    var apiRoutes = express.Router();
    //User 
    // create a new user account (POST http://localhost:8080/api/signup)
    apiRoutes.post('/signup', function(req, res) {
      if (!req.body.name || !req.body.password) {
        res.json({success: false, msg: "Si us plau, introdueix la informaciño necesària de l'usuari"});
      } else {
        var newUser = new User({
          name: req.body.name,
          password: req.body.password,
          fullname: req.body.fullname,
          sex: req.body.sex,
          email: req.body.email,
          direction: req.body.direction,
          tel: req.body.tel,
          priority: req.body.priority,
          adminpower: req.body.adminpower,
          temporal:false
        });
        // save the user
        newUser.save(function(err) {
          if (err) {
            return res.json({success: false, msg: "Aquest nom d'usuari ja existeix"});
          }
          res.json({success: true, msg: 'Nou usuari creat correctament'});
        });
      }
    });
     
    // connect the api routes under /api/*
    app.use('/api', apiRoutes);

    // route to authenticate a user (POST http://localhost:8080/api/authenticate)
    apiRoutes.post('/authenticate', function(req, res) {
      console.log(req.body);
      
      User.findOne({
        name: req.body.name
      }, function(err, user) {
        if (err) throw err;
        console.log("user:" + user);
        if (!user) {
          res.send({success: false, msg: "No s'ha trobat l'usuari."});
        } else {
          // check if password matches
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              var token = jwt.encode(user, config.secret);
              // return the information including token as JSON
              res.json({success: true, token: 'JWT ' + token, id: user._id, username: user.name, priority: user.priority, adminpower: user.adminpower, temporal: user.temporal});
            } else {
              res.send({success: false, msg: 'Contrassenya errònia'});
            }
          });
        }
      });
    });
    // route to a restricted info (GET http://localhost:8080/api/memberinfo)
    apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
      var token = getToken(req.headers);
      if (token) {
        var decoded = jwt.decode(token, config.secret);
        User.findOne({
          name: decoded.name
        }, function(err, user) {
            if (err) throw err;
     
            if (!user) {
              return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
            } else {
              res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!'});
            }
        });
      } else {
        return res.status(403).send({success: false, msg: 'No token provided.'});
      }
    });

     // forget password
    apiRoutes.post('/resetpassword', function(req, res) {
      console.log(req.body);
      
      User.findOne({
        name: req.body.name
      }, function(err, user) {
        if (err) throw err;
        console.log("user:" + user);
        if (!user) {
          res.send({success: false, message: "No s'ha trobat l'usuari."});
        } else {
           
                var tempPassword = user.name + Math.floor((Math.random() * 100) + 1);
                console.log(tempPassword);
                // setup e-mail data with unicode symbols 
               /* var mailOptions = {
                    from: '"Esquerra Republicana de Catalunya" <fedgirona@esquerra.cat>', // sender address 
                    to: user.email, // list of receivers 
                    subject: 'Restablir contrassenya', // Subject line 
                    text: 'La teva contrassenya temporal', // plaintext body 
                    html: '<b>{{tempPassword}}</b>' // html body 
                };*/


                // create template based sender function 
                var sendPwdReset = transporter.templateSender({
                    subject: 'Restablir contrassenya per usuari {{username}}!',
                    text: 'Hola, {{username}}, la teva contrassenya temporal és: {{reset}}',
                    html: '<b>Hola, <strong>{{fullname}}</strong>, si us plau restableix la contrassenya: {{reset}}</p>'
                }, {
                    from: '"Esquerra Republicana de Catalunya" <fedgirona@esquerra.cat>',
                });
                 
                // use template based sender to send a message 
                sendPwdReset({
                    to: user.email
                }, {
                    username: user.name,
                    fullname: user.fullname,
                    reset: tempPassword
                }, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                    
                        user.password = tempPassword;
                        user.temporal = true;
                        user.save(function(err) {
                          if (err) {
                            return res.json({success: false, msg: 'Contrassenya no cambiada.'});
                          }
                          
                          res.json({success: true, msg: 'Hem enviat una contrassenya temporal al teu correu.'});
                        });
                                 
                });


     
                // send mail with defined transport object 
              /*  transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                    
                        user.password = tempPassword;
                        user.save(function(err) {
                          if (err) {
                            return res.json({success: false, msg: 'Contrassenya no cambiada.'});
                          }
                          user.temporary = true;
                          res.json({success: true, msg: 'Hem enviat una contrassenya temporal al teu correu.'});
                        });
                                 
                });*/
           
            
        }
      });
    });

     
    getToken = function (headers) {
      if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
          return parted[1];
        } else {
          return null;
        }
      } else {
        return null;
      }
    };
    //==================================================================

    // api ---------------------------------------------------------------------
    function findIndex(submissions, key, valuetosearch) {
 
        for (var i = 0; i < submissions.length; i++) {
         
            if (submissions[i][key] === valuetosearch) {
                 return i;
            }
        }
        return -1;
    }

    //get all Users
    apiRoutes.get('/users', function(req,res){        
        User.find({'priority': {'$ne': 'Administrador'}}, {password :0}, function(err, users){
            if (err)
            res.send(err);
            console.log("Users:" + users);
            res.json(users); 
        });
    });

    //get user by id
    apiRoutes.get('/users/:id', function(req,res){ 
        var id = req.params.id;       
        User.findById(id, {password :0}, function(err, user){
            if (err)
            res.send(err);
            console.log("User:" + user);
            res.json(user); 
        });
    });

    // change user password
    apiRoutes.post('/users/password', function(req, res){
       
        console.log("user:" + req.body);
        console.log("user name:" + req.body.name);
        console.log("password:" + req.body.password);

        User.findOne({name: req.body.name}, function(err, user) {
            user.password = req.body.password;
            user.temporal = false;
            user.save(function(err) {
              if (err) {
                return res.json({success: false, msg: "La contrassenya no s'ha  pogut canviar."});
              }
              res.json({success: true, msg: 'Contrassenya canviada correctament.'});
            });
        });
    });

    // change user's fullname
    apiRoutes.put('/users/fullname', function(req, res){
        var id = req.body.id;
        var fullname = req.body.fullname;
                
        User.update({_id: id}, {'$set' : {'fullname' : fullname}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'User fullname updated!'});
        })
    });

    //change user's email
    apiRoutes.put('/users/email', function(req, res){
        var id = req.body.id;
        var email = req.body.email;
                
        User.update({_id: id}, {'$set' : {'email' : email}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'User email updated!'});
        })
    });

    // change user's adminpower
    apiRoutes.put('/users/adminpower', function(req, res){
        
        var id = req.body._id;
        var power = req.body.adminpower;
                
        User.update({_id: id}, {'$set' : {'adminpower' : power}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'User power updated!'});
        })
    });

    // change user's priority
    apiRoutes.put('/users/priority', function(req, res){
        var users = req.body;
        var id = req.body._id;
        var priority = req.body.priority;
        
        User.update({_id: id}, {'$set' : {'priority' : priority}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'User priority updated!'});
        })
    });

    // add phone number
    apiRoutes.put('/users/newphone', function(req, res){
        
        var id = req.body.id;
        var telNumber = req.body.number;
        console.log("id:" + id);
        console.log("telNumber:" + telNumber);
        
        User.update({_id: id}, {'$addToSet' : {'tel': {'number' : telNumber}}}).exec(function( err, data ){
            if (err) console.log(err);
            User.findById(id, {password :0}, function(err, user){
                if (err)
                    res.send(err);
                console.log("User:" + user);
                res.json(user); 
            });
        }); 
    });
    
    // change phone number
    apiRoutes.put('/users/phone', function(req, res){
        
        var id = req.body.id;
        var telNumberOld = req.body.numberOld;
        var telNumber= req.body.number;
        console.log("id:" + id);
        console.log("telNumber:" + telNumber);
        console.log("telNumberOld:" + telNumberOld);
        
        User.update({_id: id, 'tel.number': telNumberOld}, {'$set' : {'tel.$.number' : telNumber}}).exec(function( err, data ){
            if (err) console.log(err);
             User.findById(id, {password :0}, function(err, user){
                if (err)
                    res.send(err);
                console.log("User:" + user);
                res.json(user); 
            });
        }); 
    });

    // delete phone number
    apiRoutes.put('/users/removephone', function(req, res){
        
        var id = req.body.id;
        var telNumber = req.body.number;
        console.log("id:" + id);
        console.log("telNumber:" + telNumber);
        
        User.update({_id: id}, {'$pull' : {'tel': {'number' : telNumber}}}).exec(function( err, data ){
            if (err) console.log(err);
            res.json({message: 'Phone number removed'});
        }); 
    });   

    //get all Priorities
    apiRoutes.get('/priorities/:checkempty', function(req, res){
        var checkempty = req.params.checkempty;
        console.log("inside priorities");
        Priority.find().sort({level: 1}).exec(function (err, priorities) {
            if(err)
                res.send(err);
            console.log("Priorities:" + priorities);
            if(checkempty){
                User.find(function(err, users){
                    if(err) res.send(err);
                    priorities.forEach(function(priority){
                        priority.number = 0;
                        users.forEach(function(user){
                            if(priority.name === user.priority){
                               priority.number++; 
                            }
                        });
                        console.log("priority number: " + priority.number);
                    })
                    console.log("updated priorities:" + priorities);
                    res.json(priorities);
                });
            } else {
                res.json(priorities);
            }
            
        });
    });

     // update priority
    apiRoutes.put('/priorities', function(req, res) {
        var old_name = undefined;
        var id = req.body.id;
        var name = req.body.name;
        var level = req.body.level;
        Priority.findById(id, function(err, priority){
            if(err) console.log(err);
            old_name = priority.name; 
            Priority.update({_id: id}, {'$set' : {'name': name, 'level': level}}).exec(function( err, data ){
                if(err) console.log(err);
                User.find({priority : old_name}, function(err, users){
                    users.forEach(function(user){
                        user.prioirity = name;
                        user.save();
                    });

                    Poll.find(function(err, polls){
                        if(err) console.log(err);
                        polls.forEach(function(poll){
                            if(poll.priority.watch === old_name){
                                poll.priority.watch = name;
                               
                            }
                            if(poll.priority.vote === old_name){
                                poll.priority.vote = name;                               
                            }
                            if(poll.priority.result === old_name){
                                poll.priority.result = name;                               
                            }
                            poll.save();
                        });                        
                        res.json({ message: 'Priority updated' });
                    });
                });
            });           
        });
        
    });

    // create priority
    apiRoutes.post('/priorities', function(req, res){

        var newPriority = new Priority(req.body);
        // save the category and check for errors
        //todo priority adjustment
        newPriority.save(function(err) {
            if (err)
                res.send(err);
         
            var crescendo = 0;
            Priority.find().sort({level: 1}).exec(function (err, priorities) {
                if (err)
                res.send(err);
                console.log("priorities:" + priorities);
                var crescendo = 0;
                priorities.forEach(function(priority){
                    crescendo += 10;
                    if(priority.level !== 0){
                        priority.level = crescendo;    
                    }
                    priority.save();
                    });
                   
                    res.json(priorities);
            });
            
        });

    });

    //delete priority
    apiRoutes.delete('/priorities/:id', function(req, res){     
        console.log("id:" + req.params.id);
        Priority.remove({
           _id: req.params.id 
        },function(err, priority){
            if(err)
                res.send(err);

            /*    res.json({message: 'priority removed'});*/

            var crescendo = 0;
            Priority.find().sort({level: 1}).exec(function (err, priorities) {
                if (err)
                res.send(err);
                console.log("priorities:" + priorities);
                var crescendo = 0;
                priorities.forEach(function(priority){
                    crescendo += 10;
                    if(priority.level !== 0){
                        priority.level = crescendo;    
                    }
                    priority.save();
                    });
                   
                    res.json(priorities);
            });
        });
    });

    function map_priority(priorities, name){
        var level = 25;
        priorities.forEach(function(priority){
            if(priority.name === name){
                level = priority.level;
            }
         });
        return level;
    };

    // get all polls matching category and priority
    apiRoutes.get('/polls/:category/:priority/:user_id', function(req, res) {

        var category = req.params.category;
        var priority_name = req.params.priority;
        var user_id = req.params.user_id;
        var level = 25;
        var filtered_polls = [];
        console.log("category:" + category);
        console.log("priority:" + priority_name);
        // use mongoose to get all polls in the database
        if(category === "all"){
            Poll.find(function(err, polls){
                if(err)
                    res.send(err);
                var state = undefined;
                polls.forEach(function(poll){
                    if(poll.totalVotes > 0) {
                        if(poll.lifeCycleState === 2 && poll.showResults) {
                            state = 2;
                        } else {
                            state = 1;                           
                        }
                    } else {
                       state = 1; 
                    }

                    poll.state = state;
                    filtered_polls.push(poll);
                });
                res.json(filtered_polls);
            });
        } else {
            Poll.find({category: category}, function(err, polls) {          
           
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
                Priority.find(function(err, priorities){
                    level = map_priority(priorities, priority_name);
                    if(priority_name === "Administrador"){
                        var state = undefined;
                        polls.forEach(function(poll){
                            if(poll.totalVotes > 0) {
                                if(poll.lifeCycleState === 2 && poll.showResults) {
                                    state = 2;
                                } else {
                                    state = 1;                           
                                }
                            } else {
                               state = 1; 
                            }
                            poll.state = state;
                            filtered_polls.push(poll);
                        });
                    }else {
                       polls.forEach(function(poll){
                            var pollId = poll._id;
                            var state = undefined;
                            if(map_priority(priorities, poll.priority.watch) >= level) {
                               
                                if(map_priority(priorities, poll.priority.vote) >= level) {
                                
                                    console.log("votes:" + findIndex(poll.submissions, "user", user_id));
                                    if(findIndex(poll.submissions, "user_id", user_id) >= 0){
                                        console.log("The user has already voted");
                                        if(map_priority(priorities, poll.priority.result) >= level){
                                            if(poll.lifeCycleState === 2 && poll.showResults){
                                                console.log("The show results are active");
                                                state = 2; //result
                                            } else {
                                                console.log("The show results are not active, but the user has alredy voted");
                                                state = 3; //result cannot be shown, but voted
                                            }
                                            
                                         } else {
                                            state = 1; //watch
                                         }
                                    } else {
                                        console.log("Check if poll date is expired! If not - vote");
                                        if(poll.lifeCycleState === 2) {
                                            if(poll.showResults && poll.totalVotes > 0) {
                                               state = 2; 
                                            }else {
                                                console.log("poll date is expired! Cannot vote.");
                                            state = 1;
                                            }
                                            
                                        } else {
                                            console.log("poll date is not expired! Can vote.");
                                            if(poll.validated) {
                                                 state = 0; //vote
                                            }
                                           
                                        }
                                        
                                    }
                                } else {
                                    if(poll.totalVotes > 0 ) {
                                        console.log("The user cannot vote this poll!");
                                        if(map_priority(priorities, poll.priority.result) >= level) {
                                           console.log("But can see the results");
                                           if(poll.lifeCycleState === 2 && poll.showResults) {                                                
                                                state = 2; //result
                                            } else {
                                                state = 3; //result cannot be shown, but voted
                                            }
                                        } else {
                                           state = 1; //watch
                                       } 
                                    } else{
                                        state = 1; //watch
                                    }                            
                                }
                                console.log("the state is:" + state);
                                poll.state = state; 
                                filtered_polls.push(poll); 
                            }  
                        });  
                    }
                    
              
                    res.json(filtered_polls); // return all polls in JSON format
                });
            });    
        }  
    });

    // get poll by id
    apiRoutes.get('/polls/:id', function(req, res) {
        var pollId = req.params.id;
        Poll.findById(pollId, function(err, poll) {
          if (err) 
            res.send(err)
            // show the one survey           
            res.json(poll);
        });
    });
    
     // create poll 
    apiRoutes.post('/polls'/*, auth*/, function(req, res) {
        console.log("new poll:" + req.body);
        var poll = new Poll(req.body);      // create a new instance of the Poll model        
        var priority_name = req.body.priority;
        var category = req.body.category;
        var username = req.body.username;
        // save the survey and check for errors
        poll.save(function(err) {
            if (err)
                res.send(err);

            //res.send("Ok!");
            
           /* Poll.find(function(err, polls) {
                if (err)
                    res.send(err)
                console.log(polls);
                res.json(polls);
            });*/

            Poll.findById({_id: poll._id}, function(err, poll) {          
           
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                console.log(poll);              
                
                res.json(poll); // return poll in JSON format
            });            
        });

    });

    // update poll
    apiRoutes.put('/polls/:id/:user_id/', function(req, res) {
        
        var id = req.params.id;
        var user_id = req.params.user_id;
        var username =  req.body.username;
        var submission = req.body.submission;
        console.log(submission);
        Poll.update({_id: id}, {'$addToSet' : {'submissions': {'user_id': user_id, 'username' : username}}}).exec(function( err, data ){
            if(err) console.log(err);
           
            if(data){
               Poll.findOne({ _id: id }, function (err, doc){ 
                   if(err) console.log(err);
                   doc.choices.id(submission.answerId).votes += 1;
                   console.log("votes:" + doc.choices.id(submission.answerId).votes);
                   doc.totalVotes += 1;
                   // io.sockets.emit('votes', {number: doc.totalVotes, id: id});
                   doc.save();
                   console.log("Really updated poll:" + doc);
                   res.json(doc);
                }); 

            } else {
                res.json({ message: 'Did not update!' });
            }
        });
    });

    //edit poll
    apiRoutes.put('/admin/polls'/*, auth*/, function(req, res) {
        
        var id = req.body._id;               

        var edition = req.body;
        console.log(edition); 
           
       Poll.findOne({ _id: id }, function (err, doc){ 
           if(err) console.log(err);
          
           doc.question = edition.question;
           doc.choices = edition.choices;
           doc.category = edition.category; 
           doc.priority = edition.priority;
           doc.active = edition.active;
           doc.validated = edition.validated;
           doc.notification = edition.notification;
           doc.publishDate = edition.publishDate;

           doc.save();
           Poll.find(function(err, polls){
                if(err)
                    res.send(err);
                 console.log("polls:" + polls);
                res.json(polls);
            });
        });
    });


    function checkPollState(poll){
        var now = new Date().valueOf();
        console.log("Checking states...");

        var start = poll.publishDate.startDate.valueOf();
        var end = poll.publishDate.endDate.valueOf();
        if (now >= end) {
            poll.lifeCycleState = 2;
        } else if(poll.validated){
           poll.lifeCycleState = 1; 
        } else {
            poll.lifeCycleState = 0;
        }
            
        poll.save();    

       /* switch (poll.lifeCycleState) {
           case 0:
                startPoll(poll);
                break
            case 1:
                endPoll(poll);
                break;
        }  */

         if(poll.lifeCycleState === 1) {
                endPoll(poll);
            }     
    };


    //valudate/invalidate poll
    apiRoutes.put('/polls/validate', function(req, res){
        
        var id = req.body._id;
        var validated = req.body.validated;
        var lifeCycleState = req.body.lifeCycleState;
        var createdby = req.body.createdby;
        var startDate = req.body.publishDate.startDate;
        var endDate = req.body.publishDate.endDate;
        console.log("id:" + id);
        console.log("validated:" + validated);                
      /*  Poll.update({_id: id}, {'$set' : {'validated' : validated}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'Poll validation updated!'});
        })*/
         Poll.findOne({ _id: id }, function (err, doc){ 
           if(err) console.log(err);
           
           doc.validated = validated;
           doc.lifeCycleState = lifeCycleState;
           doc.createdby = createdby;
           doc.publishDate.startDate = startDate;
           doc.publishDate.endDate = endDate;
           doc.save();
           checkPollState(doc);
           res.json({message: 'Poll validation updated!'});          
        });
    });

    //activate/deactivate poll
    apiRoutes.put('/polls/active', function(req, res){
        
        var id = req.body._id;
        var active = req.body.active;
                        
        Poll.update({_id: id}, {'$set' : {'active' : active}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'Poll activation updated!'});
        })
    });

    //show/hide results
    apiRoutes.put('/polls/showresults', function(req, res){
        
        var id = req.body._id;
        var showresults = req.body.showResults;  
        console.log("showResults: "+ req.body.showResults);     
                
        Poll.update({_id: id}, {'$set' : {'showResults' : showresults}}).exec(function(err, data){
            if (err) console.log(err);
            res.json({message: 'Poll showresults updated!'});
        })
    });

    // delete poll
    apiRoutes.delete('/polls/:id'/*, auth*/, function(req, res) {
        var priority_name = "Usuari no identificat";       
        var user_id = req.params.user_id;
       /* User.findOne({_id: user_id}, function(err, user){
            if(err) res.send(err)
                priority_name = user.priority;
                console.log("priority: " + priority);*/
                Poll.remove({_id : req.params.id}, function(err, poll) {
                    if (err)  res.send(err);
                    res.json({message: 'Poll removed'});
             
                   /* Poll.find({category: category}, function(err, polls) {
                        if (err)
                            res.send(err)
                            Priority.find(function(err, priorities) {
                                level = map_priority(priorities, priority_name);

                                polls.forEach(function(poll){
                                    var pollId = poll._id;
                                    var state = undefined;
                                    if(map_priority(priorities, poll.priority.watch) >= level){
                                       
                                        if(map_priority(priorities, poll.priority.vote) >= level){
                                        
                                        console.log("votes:" + findIndex(poll.submissions, "user_id", user_id));
                                        if(findIndex(poll.submissions, "user_id", user_id)>=0){
                                            console.log("Im here!");
                                            if(map_priority(priorities, poll.priority.result) >= level){
                                                console.log("inside result");
                                                state = 2; //result
                                             }else{
                                                state = 1; //watch
                                             }
                                        } else{
                                            console.log("Im inside zero!");
                                            state = 0; //vote
                                        }
                                    } else {
                                        if(poll.totalVotes > 0 ){
                                            if(map_priority(priorities, poll.priority.result) >= level)
                                            {
                                               state = 2; //result
                                            }else{
                                               state = 1; //watch
                                           } 
                                        }else{
                                            state = 1; //watch
                                        }                            
                                    }
                                        console.log("the state is:" + state);
                                        poll.state = state; 
                                        filtered_polls.push(poll); 
                                    }  
                                }); 
                          
                                res.json(filtered_polls); // return all polls in JSON format
                            });
                    });
            });*/
        });

    });

    // get all categories
    apiRoutes.get('/categories/:priority/:user_id', function(req, res) {

        var priority_name = req.params.priority;
        var user_id = req.params.user_id;
        console.log("I'm here");
        var level = 25;
        var voted = 0;

        // use mongoose to get all categories in the database
        Category.find(null, function(err, categories) {  

            Priority.find(function(err, priorities) {
                level = map_priority(priorities, priority_name);   
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                Poll.find(function(err, polls){
                    if (err)
                    res.send(err)

                    categories.forEach(function(category){
                        category.number = 0; 
                        category.numberVote = 0;                     

                        polls.forEach(function(poll){
                            var pollId = poll._id;
                            var state = undefined;
                            if(poll.validated === true /*&& poll.active === true*/) {
                               if(map_priority(priorities, poll.priority.watch) >= level) { 
                                    if (poll.category == category.category) {
                                        category.number ++;
                                        if(map_priority(priorities, poll.priority.vote) >= level) {
                                            if(findIndex(poll.submissions, "user_id", user_id) >= 0) {
                                                 voted ++;
                                            } else {
                                                if(poll.lifeCycleState === 1) {
                                                    category.numberVote ++;
                                                }
                                                
                                            }
                                        }
                                        
                                    }               
                                } 
                            }
                            
                        });

                       //  console.log("category number: " + category.number);
                    });
                    console.log("categories:" + categories);
                    res.json(categories); //   
                      
                });
                 
            }); 
        });
    });

    // check if a category is empty
    apiRoutes.get('/categories/:category', function(req, res) {
        var category = req.params.category;
               
        console.log("category:" + category);
       
        // use mongoose to get all surveys in the database
        Poll.find({category: category}, function(err, polls) {          
           
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
            console.log("length:" + polls.length);

            if (polls.length > 0){
                res.send("0");
            }
            else {
                res.send("1");
            }
        });
    });

    // rename category
    apiRoutes.put('/categories/:category'/*, auth*/, function(req, res) {
        var category = req.params.category;        
        var newName = req.body.category;
       
        console.log("category:" + category);
        console.log("new name:" + newName);
        Category.findOne({category: category}, function(err, doc){
            if (err)
                res.send(err)

            console.log("category:" + doc);
            doc.category = newName;
            doc.save();

            //update category in all polls
            Poll.find({category: category}, function(err, polls) {          
           
                // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                if (err)
                    res.send(err)
                console.log("length:" + polls.length);

                if (polls.length > 0){
                   polls.forEach(function(poll){
                     poll.category = newName;
                     poll.save();
                   });
                   res.json({ message: 'Category is renamed!' });;
                }
                else {
                    res.json({ message: 'Category is empty. No need to udate polls' });;
                }
            });

        });
        
    });

    // get category by id
    apiRoutes.get('/categories/:id', function(req, res) {
        var categoryId = req.params.id;
        Category.findById(categoryId, function(err, category) {
          if (err) 
            res.send(err)
            // show one category           
            res.json(category);
        });
    });

     // create category 
    apiRoutes.post('/categories'/*, auth*/, function(req, res) {
        
        var category = new Category(req.body);      // create a new instance of the Category model
        category.number = 0;
        // save the category and check for errors
        category.save(function(err) {
            if (err)
                res.send(err);
            console.log("category id:" + category._id)
            
            Category.findById(category._id, function(err, category) {
                if (err)
                    res.send(err)
                res.json(category);
            });
            
        });

    });

    // delete category
    apiRoutes.delete('/categories/:id'/*, auth*/, function(req, res) {
        Category.remove({
            _id : req.params.id
        }, function(err, category) {
            if (err)
                res.send(err);
         
            // get and return all the categories after you delete another
            Category.find(function(err, categories) {
                if (err)
                    res.send(err)

                res.json({message:'category removed'});
            });
        });
    });



   
    
   