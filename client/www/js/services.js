angular.module('starter')
 
.service('AuthService', function($q, $http, API_ENDPOINT) {
  var LOCAL_TOKEN_KEY = 'ezhikisawesome';
  var isAuthenticated = false;
  var authToken;
  var userInfo = {
          id : 0, 
          username : undefined          
  };


  function isValidValue(value){
        if(typeof(value) !== 'undefined' && value !== null && value !== ''){
            return true;
        }
        return false;
  }
 
  function loadUserCredentials() {
  
    localforage.getItem(LOCAL_TOKEN_KEY).then(function(value) {
      
        if(isValidValue(value)){
             useCredentials(value);
        } 
        restoreUserInfo();
               
    });
  }
 
  function storeUserCredentials(data) {
    var token = data.token;
    var id = data.id;
    var username = data.username;    
   
    localforage.setItem(LOCAL_TOKEN_KEY, token);
    localforage.setItem("id", id);
    localforage.setItem("username", username);
    
    useCredentials(token);

  }

  function restoreUserInfo(){
    var id = 0;
    var username = undefined;
    
    if(isAuthenticated){
      localforage.iterate(function(value, key, iterationNumber) {
        if (key === "id") {
            id = value;
            
        } else if(key === "username"){
            username = value;            
        } 
      }).then(function() {
          userInfo = 
          { 
            id : id, 
            username : username           
          }

      });
    }
    else {
       userInfo = 
      { 
          id : id, 
          username : username          
        }
    }
  }
 
  function useCredentials(token) {
    isAuthenticated = true;
    authToken = token;
 
    // Set the token as header for your requests!
    $http.defaults.headers.common.Authorization = authToken;
  }
 
  function destroyUserCredentials() {
    authToken = undefined;
    isAuthenticated = false;
    $http.defaults.headers.common.Authorization = undefined;  
    localforage.clear(function(err) {
    // Run this code once the database has been entirely deleted.
     console.log('localforage database is now empty.');
    });
  }
 
  var register = function(user) {
    return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/signup', user).then(function(result) {
        if (result.data.success) {
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      });
    });
  };
 
  var login = function(user) {
   
    return $q(function(resolve, reject) {

      $http.post(API_ENDPOINT.url + '/authenticate', user).then(function(result) {
        if (result.data.success) {
          storeUserCredentials(result.data);
          resolve(result.data);
        } else {
          reject(result.data.msg);
        }
      });
    });
  };
 
  var logout = function() {
   // destroyUserCredentials();
    return $q(function(resolve, reject) {
       localforage.clear(function(err) {
        authToken = undefined;
        isAuthenticated = false;
        $http.defaults.headers.common.Authorization = undefined;
         // Run this code once the database has been entirely deleted.
        console.log('localforage database is now empty.');
        console.log(err);
        resolve(authToken);
        resolve(isAuthenticated);
        resolve($http.defaults.headers.common.Authorization);
       
      });
    });
  };

  var resetpassword = function(user) {
     
      return $q(function(resolve, reject) {

        $http.post(API_ENDPOINT.url + '/resetpassword', user).then(function(result) {
          if (result.data.success) {            
            resolve(result.data);
          } else {
            reject(result.data.msg);
          }
        });
      });
  };
 
  

  var getUserCredentials = function() {
    var deferred = $q.defer();           
    var user = {
                    id :0,
                    username : undefined
               };    
   
   
      localforage.iterate(function(value, key, iterationNumber) {
        if (key === "id") {
            user.id = value;
           
        } else if(key === "username"){
            user.username = value;
            
        } 
      }).then(function() {         
          console.log(user);  
          deferred.resolve(user);

      });     
    return deferred.promise; 
    
  };

  var checkAuthentication = function(){
    var deferred = $q.defer(); 
    localforage.getItem(LOCAL_TOKEN_KEY).then(function(value) {
      
        if(isValidValue(value)){
           isAuthenticated = true;             
           deferred.resolve(isAuthenticated);
        } else {
          isAuthenticated = false;
          deferred.resolve(isAuthenticated);
        }     
    });
    return deferred.promise; 
  }
 
  loadUserCredentials();
 
  return {
    login: login,
    register: register,
    logout: logout,
    resetpassword: resetpassword,
    userInfo: /*function() {return userInfo;}*/getUserCredentials,
    isAuthenticated: function() {return isAuthenticated;}
  };
})
 
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
      }[response.status], response);
      return $q.reject(response);
    }
  };
})
 
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
})


.factory('SharedData', function () {
    var categories = [] ;
    var polls = [];
    var priorities = [];
    var currentPoll = {};
    return {
        updateCategories : function(cats) {
            categories = cats;
        },
        getCategories : function() {
         
            return categories;
        },
        updatePolls : function(pls) {
            polls = angular.copy(pls);
        },
        getPolls : function() {
            return polls;
        },
        setCurrentPoll: function(poll) {
          currentPoll = angular.copy(poll);
        },
        getCurrentPoll : function() {
            return currentPoll;
        },
        getPriorities : function() {
            return priorities;
        },        
        updatePriorities : function(prs) {
            priorities = angular.copy(prs);
        }
   };
})

.factory('Socket', function (socketFactory) {
  return socketFactory({
   
    ioSocket: io.connect('http://46.101.159.166:8080')
   //ioSocket: io.connect('http://127.0.0.1:8080')
    
  });
});



/*.factory('Socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});*/
