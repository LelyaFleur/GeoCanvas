// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova', /* 'ngGeolocation',*/ 'monospaced.elastic', 'ngInputModified', 'ion-datetime-picker', 'ngMessages', 'btford.socket-io'])

  .run(function ($rootScope, $state, $location, $cordovaGeolocation, $q, $http, $ionicPlatform, $ionicPickerI18n, AuthService, Coordinates, SharedData, AUTH_EVENTS) {    
    
    $rootScope.coordinates = {
      lat: 0.0,
      long: 0.0
    };
    
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
         
          $rootScope.coordinates.lat = lat;
          $rootScope.coordinates.long = long;
        }, function(err) {
          // error
          console.log("polling error", err);
        });

      setTimeout(pollCurrentLocation, 1000);
    };


    AuthService.userInfo().then(function(user){       
        
      $rootScope.userId = user.id;
      $rootScope.loggedIn = AuthService.isAuthenticated();
      $rootScope.username = user.username;       
      $rootScope.$broadcast('resolved', 'resolved root scope');
      console.log("is Authenticated: " + $rootScope.loggedIn);
      console.log("username: " + $rootScope.username);
      if($rootScope.loggedIn) {
        coordObj = {  id : $rootScope.userId,
                      coordinates : $rootScope.coordinates
                    };

        Coordinates.sendCoordinates(coordObj)
        .success(function(data){
            Coordinates.all()
            .success(function(data) {
               $rootScope.allCoordinates = data;
               $state.go('canvas');
            })
            .error(function(err){
              console.log(err);
            });
        })
        .error(function(err){
          console.log(err);
        })
        
        $state.go('canvas');
      }
      
    });

        
    $rootScope.destroySession = function() {
      return $q(function(resolve, reject) {

          AuthService.logout().then(function(result){
              resolve(result);
          });
      }); 
    };   
 
   $rootScope.logout = function() {

     localforage.clear(function(err) {
        
        $http.defaults.headers.common.Authorization = undefined;
        $rootScope.message = 'Logged out.';
        $rootScope.loggedIn = false;           
        $state.go('login', null, {reload:true});
       
      });    
  };     

   $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {

      
      if (!AuthService.isAuthenticated()) {  
      
        if(next.name !== 'login' && next.name !== 'register') {
          event.preventDefault();
         
          $state.go('login');
        }
      } 
    });

    $ionicPlatform.ready(function() {

     /* $cordovaPlugin.someFunction().then(success, error);*/


      if(window.cordova && window.cordova.plugins.Keyboard) {
       
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);        
        cordova.plugins.Keyboard.disableScroll(true);
      }

      if (window.cordova && $cordovaKeyboard) {
         $cordovaKeyboard.hideAccessoryBar(true);
      }
      
      if (window.StatusBar) {
         //StatusBar.styleDefault();
         StatusBar.hide();
      }

      pollCurrentLocation();
     /* ionic.Platform.fullScreen();
      if (window.StatusBar) {
        return StatusBar.hide();
      }*/

   });
})

.config(function($stateProvider, $urlRouterProvider, socketFactoryProvider) {

   
  $stateProvider 
   /* .state('tabs',{
       url: '/tab',
       abstract: true,
       cache: false,
       templateUrl: 'templates/tabs.html' 
    })  */  
     .state('canvas',{
          url: '/canvas',
          cache: false,
          templateUrl: 'templates/canvas.html',
          controller: 'CanvasController' 
      })

      .state('login',{
          url: '/login', 
          cache: false,         
          templateUrl: 'templates/login.html',
          controller: 'LoginController'
      })      

      .state('register', {
          url: '/register',
          cache: false,
          templateUrl: 'templates/register.html',
          controller: 'RegisterController'
      })      
    
    $urlRouterProvider.otherwise('/canvas');
})


