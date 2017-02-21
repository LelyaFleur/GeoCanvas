angular.module('starter')
 
.controller('LoginController', function($scope, $rootScope, AuthService, $ionicPopup, $state) {
  if( $rootScope.coordinates.lat === undefined || $rootScope.coordinates.long === undefined) {
          $rootScope.coordinates.lat = 0.0;
          $rootScope.coordinates.long = 0.0;
        }
        
  $scope.user = {
    name: '',
    password: '',
    coordinates: {
      lat: $rootScope.coordinates.lat,
      long: $rootScope.coordinates.long
    }
  };

  $scope.login = function() {
    AuthService.login($scope.user).then(function(data) {
        $rootScope.username = data.username;
        $rootScope.userId = data.id;
        $rootScope.loggedIn = true; 
        
        $state.go('canvas');
       
      
    }, function(errMsg) {
      var alertPopup = $ionicPopup.alert({
        title: 'Authentication failed!',
        cssClass: 'popupDialog',
        template: errMsg
      });
       $rootScope.loggedIn = false;
    });
  };

  $scope.signup = function() {
    console.log("Entering into register");
      $state.go('register');
    }

})
 
.controller('RegisterController', function($scope, $rootScope, AuthService, $ionicPopup, $state , SharedData) {
  if( $rootScope.coordinates.lat === undefined || $rootScope.coordinates.long === undefined) {
    $rootScope.coordinates.lat = 0.0;
    $rootScope.coordinates.long = 0.0;
  }
  $scope.user = {
    name: '',
    telephone: undefined,
    coordinates: $rootScope.coordinates    
  };

  $scope.signup = function() {   

    AuthService.register($scope.user).then(function(msg) {
      $rootScope.loggedIn = false;
      $state.go('login');
      var alertPopup = $ionicPopup.alert({
        title: 'Success!',
        cssClass: 'popupDialog',
        template: msg
      });
    }, function(errMsg) {
      var alertPopup = $ionicPopup.alert({
        title: 'Failed!',
        cssClass: 'popupDialog',
        template: errMsg
      });
    });
  };
})

.controller('CanvasController', function($scope, $rootScope, $ionicPlatform, $cordovaGeolocation, $cordovaDeviceOrientation, Coordinates) {
  
  $scope.points = [];
  $scope.myposition = {x: 0, y: 0};
 

  Coordinates.all()
    .success(function(data) {
       $rootScope.allCoordinates = data; 
       console.log("creatures:" + data);
       var coords = [];
       var point = {x: 0, y : 0 };

       $rootScope.allCoordinates.forEach(function(creature) {
        console.log("name:" + creature.name, $rootScope.username);
        if(creature.name !== $rootScope.username) {
           point = {x: creature.coordinates.lat, y: creature.coordinates.long};
           coords.push(point);
        }        
       
       });

       $scope.points = coords;     
       console.log("points:" + $scope.points);
                    
    })
    .error(function(err){
      console.log(err);
    }); 
  

  var watch, watchCompass;
  var compassOptions = {
    frequency: 3000,
    filter: true     // if frequency is set, filter is ignored
  };
  var watchOptions = {
    timeout : 5000,
    maximumAge: 3000,
    enableHighAccuracy: true // may cause errors if true
  };


  var getCompass = function() {
    $cordovaDeviceOrientation.getCurrentHeading().then(function(result) {
       $scope.magneticHeading = result.magneticHeading;
       $scope.trueHeading = result.trueHeading;
       $scope.accuracy = result.headingAccuracy;
       $scope.timeStamp = result.timestamp;
    }, function(err) {
      // An error occurred
    });

    setTimeout(getCompass, 1000);

  }

  var watchCurrentCompass = function() {
    watchCompass = $cordovaDeviceOrientation.watchHeading(compassOptions).then(
      null,
      function(error) {
        // An error occurred
      },
      function(result) {   // updates constantly (depending on frequency value)
        $scope.magneticHeading = result.magneticHeading;
       $scope.trueHeading = result.trueHeading;
       $scope.accuracy = result.headingAccuracy;
       $scope.timeStamp = result.timestamp;
      });
  }


  var pollCurrentLocation = function() {
    $cordovaGeolocation.getCurrentPosition(watchOptions)
      .then(function (position) {
        var lat  = position.coords.latitude
        var long = position.coords.longitude

        console.log('polling lat long', lat, long);
        $scope.lastPollingLocation.lat = $scope.currentPollingLocation.lat;
        $scope.lastPollingLocation.long = $scope.currentPollingLocation.long;

        $scope.currentPollingLocation.lat = lat;
        $scope.currentPollingLocation.long = long;

        $scope.myposition.x = lat;
        $scope.myposition.y = long;

        coordObj = {  id : $rootScope.userId,
                       coordinates : $scope.currentPollingLocation
                    };

        Coordinates.sendCoordinates(coordObj)
        .success(function(data) {
           
        })
        .error(function(err){
          console.log(err);
        });

      }, function(err) {
        // error
        console.log("polling error", err);
      });

    setTimeout(pollCurrentLocation, 10000);
  };

  var watchCurrentLocation = function() {
    watch = $cordovaGeolocation.watchPosition(watchOptions);
    watch.then(
      null,
      function(err) {
        // error
        console.log("watch error", err);
      },
      function(position) {
        var lat  = position.coords.latitude
        var long = position.coords.longitude

        console.log('lat long', lat, long);
        $scope.lastLocation.lat = $scope.currentLocation.lat;
        $scope.lastLocation.long = $scope.currentLocation.long;

        $scope.currentLocation.lat = lat;
        $scope.currentLocation.long = long;

        Coordinates.all()
          .success(function(data) {
             $rootScope.allCoordinates = data; 
             console.log("creatures:" + data);
             var coords = [];

             $rootScope.allCoordinates.forEach(function(creature) {
                var point = {x: creature.coordinates.lat, y: creature.coordinates.long};
                if(creature.name !== $rootScope.username) {
                   point = {x: creature.coordinates.lat, y: creature.coordinates.long};
                   coords.push(point);
                }     
             });

             $scope.points = coords;     
             console.log("points:" + $scope.points);
            /* $scope.points = [
                   { x: 25, y: 57},
                   { x: 125, y: 7 },
                   { x: 55, y: 68 },
                   { x: 195, y: 37 },
                   { x: 76, y: 35 },
                   { x: 5, y: 207 },
                ];
                $scope.boundingBox = {};*/
                

                     
    })
    .error(function(err){
      console.log(err);
    });  
    });
  };



  //The heading in degrees from 0-359.99 at a single moment in time. (Number)
  $scope.magneticHeading = null;
  //The heading relative to the geographic North Pole in degrees 0-359.99 at a single moment in time. A negative value indicates that the true heading can't be determined. (Number)
  $scope.trueHeading = null;
  //The deviation in degrees between the reported heading and the true heading. (Number)
  $scope.accuracy = null;
  // The time at which this heading was determined. (DOMTimeStamp)
  $scope.timeStamp = null;


  $scope.lastLocation = {
    lat: null,
    long: null
  };

  $scope.currentLocation = {
    lat: null,
    long: null
  };

  $scope.lastPollingLocation = {
    lat: null,
    long: null
  };

  $scope.currentPollingLocation = {
    lat: null,
    long: null
  };

  $scope.lat = 0;
  $scope.long = 0;
  

  $ionicPlatform.ready(function() {
    watchCurrentCompass();
    getCompass();
    watchCurrentLocation();
    pollCurrentLocation();
  });

  $scope.$on("$destroy", function() {
    if (watch) {
      watch.clearWatch();
    }
    if(watchCompass) {
      watchCompass.clearWatch();
    }
  });
      
});


