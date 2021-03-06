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
            points: "=",
            compass: "=",
            mypostition: "="                     
        },
     
    link: function(scope, element){
      var ctx = element[0].getContext('2d');

      // variable that decides if something should be drawn on mousemove
      var drawing = false;

      // The percentage of the screen that we want populated with data.
      // Must be between 0.5 and 1.0.
      var screenPercentage = 0.9;
      //var screenMargin = (1.0 - screenPercentage) / 2.0;

      var canvas = element[0];
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      var context = canvas.getContext('2d');

      // the last coordinates before the current move
      var lastX;
      var lastY;
      //console.log("points:" + scope.points);
      //console.log("boundingBox:" + scope.bounding);
      // var boundingBox = JSON.parse(scope.boundingBox);
      //var points = JSON.parse(scope.points);
      var points = scope.points;
      var myPosition = {x: 41.9725233, y : 2.7842};
      /*var points = points = [];
      var point1 = {x: 200.0, y: 100.0};
      points.push(point1);
      var currentPositionX = 0.0;
      var currentPositionY = 0.0;*/
      var pointsTransformed = []

      var compass = scope.compass;
      //var scaleFactor = computeScaleFactor();
      //console.log("ScaleFactor: " + scaleFactor);
      //drawPoints();

      function processPoints(){
           points.forEach(function(point){
            var φ1 = myPosition.x * Math.PI / 180, φ2 = point.x * Math.PI / 180, Δλ = (myPosition.y-point.y) * Math.PI / 180, R = 6371e3; // gives d in metres
            var d = Math.acos( Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ) ) * R;
            var y = Math.sin(myPosition.y-point.y) * Math.cos(φ2);
            var x = Math.cos(φ1)*Math.sin(φ2) -
            Math.sin(φ1)*Math.cos(φ2)*Math.cos(myPosition.y-point.y);
            var brng = Math.atan2(y, x) * 180 / Math.PI;
            var unitVector = {x: Math.sin(brng * Math.PI / 180), y: Math.cos(brng * Math.PI / 180)};
            var actualVector = {x: unitVector.x * d, y: unitVector.y * d};
            pointsTransformed.push(actualVector);
            console.log("Bearing: " + brng);
           });
      }

      function drawPoints() {
        scaleFactor = computeScaleFactor();
        console.log("ScaleFactor: " + scaleFactor);
        radius = 2;
        processPoints();
        context.clearRect(0, 0, canvas.width, canvas.height);

        var centerX = window.innerWidth / 2.0;
        var centerY = window.innerHeight / 2.0;
        //console.log("CenterX: " + centerX);
        //console.log("CenterY: " + centerY);


        // We draw the other user
        pointsTransformed.forEach(function(point){
          console.log("Fem punt!");
          //console.log("CurrentPosition: " + myPosition.x + " " + myPosition.y);
          //console.log("CurrentPoint: " + point.x + " " + point.y);
          /*console.log("step0X: " + point.x);
          console.log("step0Y: " + point.y);
          console.log("step1X: " + (point.x - currentPositionX));
          console.log("step1Y: " + (point.y - currentPositionY));
          console.log("step2X: " + ((point.x - currentPositionX) * scaleFactor));
          console.log("step2Y: " + ((point.y - currentPositionY) * scaleFactor));
          console.log("PointX: " + ((point.x - currentPositionX) * scaleFactor) + centerX);
          console.log("PointY: " + ((point.y - currentPositionY) * scaleFactor) + centerY);*/
          context.beginPath();    
          context.arc((point.x * scaleFactor) + centerX , (point.y * scaleFactor) + centerY, radius, 0, 2 * Math.PI, false);
          context.fillStyle = 'blue';
          context.fill();
          context.lineWidth = 0.5;
          context.strokeStyle = '#007AFF';
          context.stroke();     
        });

        // We draw ourselves
        radius = 5;
        context.beginPath();    
          context.arc(centerX , centerY, radius, 0, 2 * Math.PI, false);
          context.fillStyle = 'red';
          context.fill();
          context.lineWidth = 0.5;
          context.strokeStyle = '#ff0000';
          context.stroke();    
      }

      function computeScaleFactor() {
        var radius = 0.0;
        console.log("Hola!");
        console.log("points:" + points.length);
        points.forEach(function(point){
          console.log("Coucou!");
          var φ1 = myPosition.x * Math.PI / 180, φ2 = point.x * Math.PI / 180, Δλ = (myPosition.y-point.y) * Math.PI / 180, R = 6371e3; // gives d in metres
          var d = Math.acos( Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ) ) * R;
          var currentRadius = d;
          //var currentRadius = Math.sqrt((point.x- myPosition.x) * (point.x- myPosition.x) + (point.y- myPosition.y) * (point.y- myPosition.y));
          //console.log("Current Radius Before: " + currentRadius);
          if( currentRadius > radius ) {
            //console.log("Current Radius After: " + currentRadius);
            radius = currentRadius;
          }
        });
        console.log("Radius = " + radius);

        if(radius > 0) {
          return screenPercentage * Math.min(window.innerWidth, window.innerHeight) / (2.0 * radius); //2.0 because we want to reach just half of the screen (we start in the middle).
        }
        return 0;
      }

      /*var boundingBox = findBoundingBox(points); 
      var range_x = (boundingBox.max.x - boundingBox.min.x) / screenPercentage;
      var range_y = (boundingBox.max.y - boundingBox.min.y) / screenPercentage;
      var useHeight = 0;

      var coeff = getConversionFactor();      

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
      
      function drawPoints() {

        boundingBox = findBoundingBox(points); 
        // We want our world to fit a percentage of the screen.
        range_x = (boundingBox.max.x - boundingBox.min.x) / screenPercentage;
        range_y = (boundingBox.max.y - boundingBox.min.y) / screenPercentage;
        useHeight = 0;

        coeff = getConversionFactor();
        

        // Code to remember the original boundingBox in order to be able to print it on screen.
        // NOTE: Asigning boundingBox to a var doesn't seem to work.
        boundingBoxOriginalMinX = boundingBox.min.x;
        boundingBoxOriginalMinY = boundingBox.min.y;
        boundingBoxOriginalMaxX = boundingBox.max.x;
        boundingBoxOriginalMaxY = boundingBox.max.y;

        // Desplacem el minim i el màxim de la Bounding Box de manera que el nou món ens quedi centrat.
        boundingBox.min.x -= range_x * screenMargin;
        boundingBox.min.y -= range_y * screenMargin;
        boundingBox.max.x += range_x * screenMargin;
        boundingBox.max.y += range_y * screenMargin;

        // Calculem el centre del nostre món transformat a pantalla.
        centerWorldXOld = (boundingBox.max.x + boundingBox.min.x) / 2.0; 
        centerWorldYOld = (boundingBox.max.y + boundingBox.min.y) / 2.0;
        centerWorldX = (centerWorldXOld - boundingBox.min.x) * coeff;
        centerWorldY = (centerWorldYOld - boundingBox.min.y) * coeff;

        // El comparem amb el centre real de la pantalla de cares a poder resituar el món i que coincideixin.
        diffX =(window.innerWidth / 2.0) - centerWorldX;
        diffY = (window.innerHeight / 2.0) - centerWorldY;

        radius = 5;

        context.clearRect(0, 0, canvas.width, canvas.height);

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


      }      

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

      function draw(lX, lY, cX, cY) {
        // line from
        ctx.moveTo(lX,lY);
        // to
        ctx.lineTo(cX,cY);
        // color
        ctx.strokeStyle = "#4bf";
        // draw it
        ctx.stroke();
      }*/

      scope.$watchGroup(['points', 'compass', 'myposition'], function(newVal, oldVal) {
          points = newVal[0];          
          compass = newVal[1];
          //myPosition = newVal[2];
          drawPoints();        
      });

    }
  };
});







