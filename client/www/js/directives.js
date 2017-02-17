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
})

.directive("drawing", function(){
  return {
    restrict: "A",
     scope: {
            points: '@',
            bounding: '@'            
        },
    link: function(scope, element){
      var ctx = element[0].getContext('2d');

      // variable that decides if something should be drawn on mousemove
      var drawing = false;

      // The percentage of the screen that we want populated with data.
      // Must be between 0.5 and 1.0.
      var screenPercentage = 0.9;
      var screenMargin = (1.0 - screenPercentage) / 2.0;

      // the last coordinates before the current move
      var lastX;
      var lastY;
      console.log("points:" + scope.points);
      var boundingBox = JSON.parse(scope.bounding);
      var points = JSON.parse(scope.points);
      
      var canvas = element[0];
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      // We want our world to fit a percentage of the screen.
      var range_x = (boundingBox.max.x - boundingBox.min.x) / screenPercentage;
      var range_y = (boundingBox.max.y - boundingBox.min.y) / screenPercentage;
      var useHeight = 0;

      var coeff = getConversionFactor();

      var context = canvas.getContext('2d');

      // Code to remember the original boundingBox in order to be able to print it on screen.
      // NOTE: Asigning boundingBox to a var doesn't seem to work.
      var boundingBoxOriginalMinX = boundingBox.min.x;
      var boundingBoxOriginalMinY = boundingBox.min.y;
      var boundingBoxOriginalMaxX = boundingBox.max.x;
      var boundingBoxOriginalMaxY = boundingBox.max.y;

      // Desplacem el minim i el màxim de la Bounding Box de manera que el nou món ens quedi centrat.
      boundingBox.min.x -= range_x * screenMargin;
      boundingBox.min.y -= range_y * screenMargin;
      boundingBox.max.x += range_x * screenMargin;
      boundingBox.max.y += range_y * screenMargin;

      // Calculem el centre del nostre món transformat a pantalla.
      var centerWorldXOld = (boundingBox.max.x + boundingBox.min.x) / 2.0; 
      var centerWorldYOld = (boundingBox.max.y + boundingBox.min.y) / 2.0;
      var centerWorldX = (centerWorldXOld - boundingBox.min.x) * coeff;
      var centerWorldY = (centerWorldYOld - boundingBox.min.y) * coeff;

      // El comparem amb el centre real de la pantalla de cares a poder resituar el món i que coincideixin.
      var diffX =(window.innerWidth / 2.0) - centerWorldX;
      var diffY = (window.innerHeight / 2.0) - centerWorldY;

      var radius = 5;

      // Pintem la Bounding Box Original
      context.beginPath();    
      context.arc(((boundingBoxOriginalMinX - boundingBox.min.x) * coeff) + diffX, ((boundingBoxOriginalMinY - boundingBox.min.y) * coeff) + diffY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'red';
      context.fill();
      context.lineWidth = 0.5;
      context.strokeStyle = '#ff0000';
      context.stroke();     

      context.beginPath();  
      context.arc(((boundingBoxOriginalMinX - boundingBox.min.x) * coeff) + diffX, ((boundingBoxOriginalMaxY - boundingBox.min.y) * coeff) + diffY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'red';
      context.fill();
      context.lineWidth = 0.5;
      context.strokeStyle = '#ff0000';
      context.stroke();  

      context.beginPath();  
      context.arc(((boundingBoxOriginalMaxX - boundingBox.min.x) * coeff) + diffX, ((boundingBoxOriginalMaxY - boundingBox.min.y) * coeff) + diffY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'red';
      context.fill();
      context.lineWidth = 0.5;
      context.strokeStyle = '#ff0000';
      context.stroke();  

      context.beginPath();  
      context.arc(((boundingBoxOriginalMaxX - boundingBox.min.x) * coeff) + diffX, ((boundingBoxOriginalMinY - boundingBox.min.y) * coeff) + diffY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'red';
      context.fill();
      context.lineWidth = 0.5;
      context.strokeStyle = '#ff0000';
      context.stroke();      
      // Fi pintar Bounding Box Original
      
      points.forEach(function(point) {
        context.beginPath();
        var x = point.x - boundingBox.min.x;
        var y = point.y - boundingBox.min.y;
        radius = 3;

        context.arc((x*coeff) + diffX, (y*coeff) + diffY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = 'blue';
        context.fill();
        context.lineWidth = 0.5;
        context.strokeStyle = '#007AFF';
        context.stroke();
      });

     /* context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'green';
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#003300';
      context.stroke();*/


      /*element.bind('mousedown', function(event){
        if(event.offsetX!==undefined){
          lastX = event.offsetX;
          lastY = event.offsetY;
        } else { // Firefox compatibility
          lastX = event.layerX - event.currentTarget.offsetLeft;
          lastY = event.layerY - event.currentTarget.offsetTop;
        }

        // begins new line
        ctx.beginPath();

        drawing = true;
      });
      element.bind('mousemove', function(event){
        if(drawing){
          // get current mouse position
          if(event.offsetX!==undefined){
            currentX = event.offsetX;
            currentY = event.offsetY;
          } else {
            currentX = event.layerX - event.currentTarget.offsetLeft;
            currentY = event.layerY - event.currentTarget.offsetTop;
          }

          draw(lastX, lastY, currentX, currentY);

          // set current coordinates to last one
          lastX = currentX;
          lastY = currentY;
        }

      });
      element.bind('mouseup', function(event){
        // stop drawing
        drawing = false;
      });*/

      function getConversionFactor() {

        var ratio_world = range_x / range_y;

        var ratio_screen = window.innerWidth / window.innerHeight;

        if(ratio_world < ratio_screen) {
          // use height
          useHeight = 1;
          return window.innerHeight/range_y;
        } else {
          //use width 
          return window.innerWidth/range_x;
        }

      }

      // canvas reset
      function reset(){
       element[0].width = element[0].width; 
      }

      function draw(lX, lY, cX, cY){
        // line from
        ctx.moveTo(lX,lY);
        // to
        ctx.lineTo(cX,cY);
        // color
        ctx.strokeStyle = "#4bf";
        // draw it
        ctx.stroke();
      }
    }
  };
});







