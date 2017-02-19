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
    var Creature = require('./models/creature');   
    
    var port        = process.env.PORT || 3000;
    var jwt         = require('jwt-simple');
    var server = null;
    var io = null;
    
    // configuration =================

    // CORS
    app.use(function(req, res, next) {
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
   /* apiRoutes.post('/signup', function(req, res) {
      console.log("creating profile...");
      if (!req.body.name || !req.body.password) {
        res.json({success: false, msg: "Si us plau, introdueix la informaciño necesària de l'usuari"});
      } else {
        var newUser = new User({
          name: req.body.name,
          password: req.body.password          
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

*/

    apiRoutes.post('/signup', function(req, res) {
      console.log("creating profile...");
      console.log("coordinates:" + req.body.coordinates);
      if (!req.body.name || !req.body.telephone) {
        res.json({success: false, msg: "Please, enter the necessary information of the user"});
      } else {
        var newCreature = new Creature({
          name: req.body.name,
          telephone: req.body.telephone,
          coordinates: req.body.coordinates          
        });
        // save the user
        newCreature.save();
        res.json({success: true, msg: 'New user has been created'});       
      }
    });
     
    // connect the api routes under /api/*
    app.use('/api', apiRoutes);

    // route to authenticate a user (POST http://localhost:8080/api/authenticate)
    apiRoutes.post('/authenticate', function(req, res) {
      console.log(req.body);
      
      Creature.findOne({
        name: req.body.name
      }, function(err, creature) {
        if (err) throw err;
        console.log("creature:" + creature);
        if (!creature) {
          res.send({success: false, msg: "Cannot find the user"});
        } else {
          // check if telephone matches
          if(creature.telephone === req.body.telephone) {
            // if user is found and password is right create a token
             var token = jwt.encode(creature, config.secret);
             res.json({success: true, token: 'JWT ' + token, id: creature._id, username: creature.name, coordinates: creature.coordinates});
          } else {
            res.send({success: false, msg: "Telephone doesn't match"});
          }          
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

    //get all coordinates
    apiRoutes.get('/coordinates', function(req, res){        
        Creature.find(null, function(err, creature) {
            if (err)
            res.send(err);
            var coord = {username : creature.name,
                        coordinates: creature.coordinates};
            console.log("Name:" + coord.username);
            console.log("Coordinates:" + coord.coordinates);
            res.json(coord); 
        });
    });

    //get coordinates by user
    apiRoutes.get('/coordinates/:id', function(req, res) {  
        var id = req.params.id;       
        Creature.findbyId(id, {coordinates :1}, function(err, coordinates){
            if (err)
            res.send(err);
            console.log("Coordinates:" + coordinates);
            res.json(coordinates); 
        });
    });

    //save coordinates by user
    apiRoutes.post('/coordinates', function(req, res) {  
        var id = req.body.id;
        var coords = req.body.coordinates;  
        console.log("user is:" + id);
        console.log("coordinates:" + coords)     
        Creature.findOne({_id: id}, function(err, creature) {
            if (err)
            res.send(err);

            creature.coordinates = coords;           
            creature.save(function(err) {
              if (err) {
                return res.json({success: false, msg: "Coordinates could not been saved"});
              }
              res.json({success: true, msg: 'Coordinates has been saved'});
            });
        });
    });





   


   
    
   