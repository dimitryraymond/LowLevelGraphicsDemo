var Vertex = function(x, y, z){
  this.x = x;
  this.y = y;
  this.z = z;
}

var Vector = function(x, y, z){
  if(x == 0 && y == 0 && z == 0){
    throw "One of the coords must be non-zero";
  }
  else{
    this.x = x;
    this.y = y;
    this.z = z;
  }

  this.length = function(){
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  this.getHorizontalAngle = function(){
    return
  }

  this.normalize = function(){
    var tX = this.x / this.length();
    var tY = this.y / this.length();
    var tZ = this.z / this.length();

    this.x = tX;
    this.y = tY;
    this.z = tZ;
  }

  this.rotateHorizontally = function(unit){
    var tempX = Math.cos(unit) * this.x - Math.sin(unit) * this.z;
    var tempY = this.y;
    var tempZ = Math.sin(unit) * this.x + Math.cos(unit) * this.z;

    this.x = tempX;
    this.y = tempY;
    this.z = tempZ;
  }
}

var Camera = function(vector, viewportSize, zoom){
  this.vector = vector;
  this.viewportSize = viewportSize;
  this.zoom = zoom;
  this.zOverflowThreshold = -100;
  if(this.vector.y != 0){
    throw "Rotation only around Y axis is implemented so, only horizontal vectors allowed for the camera";
  }

  //when I check if the polygon is in view, i can avoid redoing the claculations by putting the results in here
  this.cashedVertices = [];

  this.polygonInView = function(polygon){
    //clear cache before this polygon
    this.cashedVertices = [];

    var sin = this.vector.x / this.vector.length();
    var cos = this.vector.z / this.vector.length();

    var anyOnScreen = false;
    for(var i = 0; i < polygon.vertices.length; i++){
      var point = polygon.vertices[i];

      var tX = point.z * sin + point.x * cos;
      var tZ = point.z * cos - point.x * sin;

      tX = -tX;

      var x = tZ == 0 ? tX : (tX * this.zoom) / (tZ + this.zoom)
      var y = tZ == 0 ? point.y : (point.y * this.zoom) / (tZ + this.zoom);

      this.cashedVertices.push([x, -y]);

      //tZ > 0 can shortcircuit and make this faster sice it generates a subset of the desired results
      //it checks if the vertex z coord is in front of the camera
      if(tZ > this.zOverflowThreshold ||
        (x >= -this.viewportSize[0] / 2 && x <= this.viewportSize[0] / 2 &&
         y >= -this.viewportSize[1] / 2 && y <= this.viewportSize[1] / 2)){
        anyOnScreen = true;
      }
    }
    return anyOnScreen;
  }
}

var Polygon = function(vertices, color){
  this.vertices = vertices;
  this.color = color;
}

var Canvas = function(canvasId){
  this.canvas = document.getElementById(canvasId);
  this.ctx = this.canvas.getContext("2d");
  this.zoom = 600;
  this.camera = new Camera(new Vector(0, 0, 1), [this.canvas.width, this.canvas.height], this.zoom);
  this.defaultFillStyle = 'black';
  this.defaultStrokeStyle = 'black';
  this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = this.defaultFillStyle;
  this.ctx.strokeStyle = this.defaultStrokeStyle;

  // this.drawLine = function(x1, y1, x2, y2, color){
  //   this.ctx.beginPath();
  //   this.ctx.moveTo(x1, y1);
  //   this.ctx.lineTo(x2, y2);
  //   if(color != null){
  //     this.ctx.strokeStyle = color;
  //     this.ctx.stroke();
  //     this.ctx.strokeStyle = this.defaultStrokeStyle;
  //   }
  //   else
  //   {
  //     this.ctx.stroke();
  //   }
  //   this.ctx.closePath();
  // }
  //
  // this.drawCircle = function(x, y, radius, color){
  //   this.ctx.beginPath();
  //   this.ctx.arc(x, y, radius, 0, 2*Math.PI);
  //   if(color != null){
  //     this.ctx.strokeStyle = color;
  //     this.ctx.stroke();
  //     this.ctx.strokeStyle = this.defaultStrokeStyle;
  //   }
  //   else
  //   {
  //     this.ctx.stroke();
  //   }
  //   this.ctx.closePath();
  // }
  //
  // this.drawText = function(text, x, y, color){
  //   if(color != null){
  //     this.ctx.fillStyle = color;
  //     this.ctx.fillText(text, x, y);
  //     this.ctx.fillStyle = this.defaultFillStyle;
  //   }
  //   else
  //   {
  //     this.ctx.fillText(text, x, y);
  //   }
  // }
  //
  // this.drawRect = function(x, y, width, height, color){
  //   if(color != null){
  //     this.ctx.fillStyle = color;
  //     this.ctx.fillRect(x, y, width, height);
  //     this.ctx.fillStyle = this.defaultFillStyle;
  //   }
  //   else
  //   {
  //     this.ctx.fillRect(x, y, width, height);
  //   }
  // }

  this.draw3DPolygon = function(polygon){
    if(this.camera.polygonInView(polygon)){
      this.ctx.beginPath();
      var coords = this.camera.cashedVertices[0];
      this.ctx.moveTo(coords[0], coords[1]);
      for(var i = 1; i < this.camera.cashedVertices.length; i++){
        var coords = this.camera.cashedVertices[i];
        this.ctx.lineTo(coords[0], coords[1]);
      }
      this.ctx.closePath();

      this.ctx.fillStyle = polygon.color;
      this.ctx.fill();
    }
  }

  this.clearScreen = function(){
    //temporarily set the context to default in order to clear it
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
}

var myCanvas = new Canvas('myCanvas');
myCanvas.camera.vector = new Vector(0, 0, 20)

function displayRow(item, index, array){
  var y = item;
  for(var i = -5; i < 5; i++){
    for(var z = -5; z < 5; z++){
      var polygon = new Polygon([new Vertex(i * 100, y, z * 100),
        new Vertex((i + 1) * 100, y, z * 100),
        new Vertex((i + 1) * 100, y, (z + 1) * 100),
        new Vertex(i * 100, y, (z + 1) * 100)]);
      if((i + z) % 2 == 0)
        polygon.color = 'red';
      else
        polygon.color = 'black';
      myCanvas.draw3DPolygon(polygon);
    }
  }
}

function render(){
  myCanvas.clearScreen();
  [-250, 50].forEach(displayRow);
}

document.addEventListener('keydown', function(event) {
    if(event.keyCode == 37) {
        myCanvas.camera.vector.rotateHorizontally(Math.PI / 16);
        render();
    }
    else if(event.keyCode == 39) {
        myCanvas.camera.vector.rotateHorizontally(- Math.PI / 16);
        render();
    }
});

render();
