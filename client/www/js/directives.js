angular.module('starter')
.directive('input', function() {
  return {
    restrict: 'E',
    require: ['?^optionGroup','?ngModel'],
    link: function(scope, element, attrs, controllers) {
      var optionGroup = controllers[0];
      var ngModel = controllers[1];
      if ( attrs.type=='text' && optionGroup && ngModel ) {
        optionGroup.register(ngModel);
        scope.$watch(function() { return ngModel.$modelValue; }, optionGroup.validate );
        // In case we are adding and removing options dynamically we need to tidy up after outselves.
        scope.$on('$destroy', function() { 
        
          optionGroup.deregister(ngModel); 
        });
      }
    }
  };
})
.directive('optionGroup', function() {
  return {
    restrict: 'E',
    controller: function($scope, $attrs) {
      var self = this;
      var ngModels = [];
      var minRequired;
      self.validate = function() {
        var optionCount = 0;
        angular.forEach(ngModels, function(ngModel) {
          if ( ngModel.$modelValue ) {
            optionCount++;
          }
        });
        
        var minRequiredValidity = optionCount >= minRequired;
        angular.forEach(ngModels, function(ngModel) {
          ngModel.$setValidity('optionGroup-minRequired', minRequiredValidity, self);
        });
        var valueArr = ngModels.map(function(item){ return item.$modelValue });
        var isDuplicate = valueArr.some(function(item, idx){
         
           return valueArr.indexOf(item) != idx 
        });
       
        angular.forEach(ngModels, function(ngModel) {
          ngModel.$setValidity('duplicateValidator', !isDuplicate, self);
        });

      };
      
      self.register = function(ngModel) {
        ngModels.push(ngModel);
        self.validate();
      };
      
      self.deregister = function(ngModel) {
        var index = ngModels.indexOf(ngModel);

        if ( index != -1 ) {
          ngModels.splice(index, 1);
          self.validate();
        }
      };
        
      $scope.$watch($attrs.minRequired, function(value) {
     
        minRequired = parseInt(value, 10);
        self.validate();
      });
    }
  };
});

