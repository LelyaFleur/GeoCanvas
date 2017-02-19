angular.module('starter')
 
.controller('LoginController', function($scope, $rootScope, AuthService, $ionicPopup, $state) {
  $scope.user = {
    name: '',
    password: ''
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

.controller('CanvasController', function($scope, /*$geolocation,*/$ionicPlatform, $cordovaGeolocation) {
   


  function findBoundingBox(points) {
    
    var boundingBox = {
      min : {x: Number.MAX_VALUE, y: Number.MAX_VALUE },
      max : {x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY}
    };

    points.forEach(function(point){
      if(point.x > boundingBox.max.x) {
        boundingBox.max.x = point.x;
      }

      if(point.y > boundingBox.max.y) {
        boundingBox.max.y = point.y;
      }

      if(point.x < boundingBox.min.x) {
        boundingBox.min.x = point.x;
      }

      if(point.y < boundingBox.min.y) {
        boundingBox.min.y = point.y;
      }

    });

    return boundingBox;

  }
 

 /*  $geolocation.watchPosition({
              timeout: 60000,
              maximumAge: 250,
              enableHighAccuracy: true
          });
  $scope.myPosition = $geolocation.position; // this object updates regularly, it has 'error' property which is a 'truthy' and also 'code' and 'message' property if an error occurs

  //It has all the location data 
  console.log("coord:" + $scope.myPosition.coords);

  //It's truthy and gets defined when error occurs 
  '$scope.myPosition.error'*/


  var watch;
  var watchOptions = {
    timeout : 5000,
    maximumAge: 3000,
    enableHighAccuracy: true // may cause errors if true
  };

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
      }, function(err) {
        // error
        console.log("polling error", err);
      });

    setTimeout(pollCurrentLocation, 1000);
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
    });
  };

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

  $scope.points = [
     { x: 25, y: 57},
     { x: 125, y: 7 },
     { x: 55, y: 68 },
      { x: 195, y: 37 },
     { x: 76, y: 35 },
     { x: 5, y: 207 },
  ];
  $scope.boundingBox = {};
  $scope.lat = 0;
  $scope.long = 0;

  $scope.boundingBox = findBoundingBox($scope.points);

  $ionicPlatform.ready(function() {
    watchCurrentLocation();

    pollCurrentLocation();
  });

  $scope.$on("$destroy", function() {
    if (watch) {
      watch.clearWatch();
    }
  });
      
});


