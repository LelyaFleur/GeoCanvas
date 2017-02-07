angular.module('starter')
 
.controller('LoginController', function($scope, $rootScope, AuthService, User, $ionicPopup, $state) {
  $scope.user = {
    name: '',
    password: ''
  };

   function showResetPassword() {
       $scope.data = {
             name: $rootScope.username,
             password: ''
       };

      var myPopup = $ionicPopup.show({
        template: "<input type='password' class = 'text-center round' style='font-size:22px!important; width: 100%' placeholder='Contrasenya' ng-model='data.password'>",
        title: 'Restablir la Contrasenya',
        cssClass: 'popupDialog',      
        scope: $scope,
        buttons: [
         
          {
            text: '<b>Guardar</b>',
            type: 'button-dark',
            onTap: function(e) {
              if (!$scope.data.password) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();                
              } else {
                console.log("password:" + $scope.data.username);
                console.log("password:" + $scope.data.password);
                User.updatePassword($scope.data)
                .success(function(data){
                  var alertPopup = $ionicPopup.alert({
                    title: 'Canvi de contrassenya!',
                    cssClass: 'popupDialog',
                    template: data.msg
                  });
                   $state.go('tabs.categories');   
                })
                .error(function(err){
                  var alertPopup = $ionicPopup.alert({
                    title: 'Canvi de contrassenya!',
                    cssClass: 'popupDialog',
                    template: err.msg
                  });
                  console.log(err);
                });
              }
            }
          }
        ]
      });
   };

  $scope.login = function() {
    AuthService.login($scope.user).then(function(data) {
      if(data.temporal) {
        $rootScope.priority_name = data.priority;     
        $rootScope.username = data.username;
        $rootScope.userId = data.id;
        $rootScope.loggedIn = true;
        $rootScope.adminpower = data.adminpower;
        
        showResetPassword();
      } else {
       /* if(data.priority === 'Administrador'){
         $state.go('tabs.super-admin');
        }
        else {*/
           $state.go('tabs.canvas');
      
     
        $rootScope.priority_name = data.priority;     
        $rootScope.username = data.username;
        $rootScope.userId = data.id;
        $rootScope.loggedIn = true;
      //  $rootScope.adminpower = data.adminpower;
      }
      
    }, function(errMsg) {
      var alertPopup = $ionicPopup.alert({
        title: 'Autentificació fallida!',
        cssClass: 'popupDialog',
        template: errMsg
      });
       $rootScope.loggedIn = false;
    });
  };

  $scope.signup = function(){
      $state.go('register');
    }

  
  $scope.showResetPassword = function() {
      $scope.data = {}; 
     
      var myPopup = $ionicPopup.show({
        template: '<input style="font-size: 22px; width: 100%"" placeholder="Nom d&#39;usuari" ng-model="data.name">',
        title: 'Restablir la contrasenya',
        cssClass: 'popupDialog',      
        scope: $scope,
        buttons: [
          { text: 'Cancel·lar' },
          {
            text: '<b>Enviar</b>',
            type: 'button-dark',
            onTap: function(e) {
              if (!$scope.data.name) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();                
              } else {
                AuthService.resetpassword($scope.data).then(function(data)
                {
                    var alertPopup = $ionicPopup.alert({
                    title: 'Correu enviat!',
                    cssClass: 'popupDialog',
                    template: data.msg
                  });
                }, function(errMsg) {
                  var alertPopup = $ionicPopup.alert({
                    title: 'Autentificació fallida!',
                    cssClass: 'popupDialog',
                    template: errMsg
                  });
                   $rootScope.loggedIn = false;
                });
              }
            }
          }
        ]
      });
    };

})
 
.controller('RegisterController', function($scope, AuthService, $ionicPopup, $state , SharedData) {
  $scope.user = {
    name: '',
    password: ''    
  };

  $scope.signup = function() {   

    AuthService.register($scope.user).then(function(msg) {
     // $state.go('tabs.login');
      var alertPopup = $ionicPopup.alert({
        title: 'Registre correcte!',
        cssClass: 'popupDialog',
        template: msg
      });
    }, function(errMsg) {
      var alertPopup = $ionicPopup.alert({
        title: 'Registre fallit!',
        cssClass: 'popupDialog',
        template: errMsg
      });
    });
  };
});


