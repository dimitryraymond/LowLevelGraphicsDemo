var Vertex = function(x, y, z){
  this.x = x;
  this.y = y;
  this.z = z;

  this.add = function(vertex){
    this.x += vertex.x;
    this.y += vertex.y;
    this.z += vertex.z;
  }
}

var Polygon = function(vertices, color){
  this.vertices = vertices;
  this.color = color;
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

  this.normalize = function(){
    var tX = this.x / this.length();
    var tY = this.y / this.length();
    var tZ = this.z / this.length();

    this.x = tX;
    this.y = tY;
    this.z = tZ;
  }

  //rotate horizontally left
  this.rotateHorizontally = function(radians){
    var tempX = Math.cos(radians) * this.x - Math.sin(radians) * this.z;
    var tempY = this.y;
    var tempZ = Math.sin(radians) * this.x + Math.cos(radians) * this.z;

    this.x = tempX;
    this.y = tempY;
    this.z = tempZ;
  }

  this.getScaled = function(scallar){
    return new Vector(this.x * scallar, this.y * scallar, this.z * scallar);
  }

  this.toVertex = function(){
    return new Vertex(x, y, z);
  }
}

var Camera = function(position, vector, viewportSize, zoom){
  this.position = position;
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
    //clear cache before this polygon gets processed
    this.cashedVertices = [];

    var tLength = this.vector.length();
    var sin = this.vector.x / tLength;
    var cos = this.vector.z / tLength;

    var anyVertexVisible = false;
    for(var i = 0; i < polygon.vertices.length; i++){
      var point = polygon.vertices[i];

      var tX = point.z * sin + point.x * cos;
      var tZ = point.z * cos - point.x * sin;

      tX = -tX;

      var x = tZ == 0 ? tX : (tX * this.zoom) / (tZ + this.zoom)
      var y = tZ == 0 ? point.y : (point.y * this.zoom) / (tZ + this.zoom);

      this.cashedVertices.push([x, -y]);

      //tZ > ... can shortcircuit and make this faster since it generates a subset of the desired results
      //it checks if the vertex z coord is in front of the camera
      if(tZ > this.zOverflowThreshold ||
        (x >= -this.viewportSize[0] / 2 && x <= this.viewportSize[0] / 2 &&
         y >= -this.viewportSize[1] / 2 && y <= this.viewportSize[1] / 2)){
        anyVertexVisible = true;
      }
    }
    return anyVertexVisible;
  }
}

var Canvas = function(canvasId){
  this.canvas = document.getElementById(canvasId);
  this.ctx = this.canvas.getContext("2d");
  this.zoom = 600;
  this.camera = new Camera(new Vertex(0, 0, 0), new Vector(0, 0, 1), [this.canvas.width, this.canvas.height], this.zoom);
  this.defaultFillStyle = 'black';
  this.defaultStrokeStyle = 'black';
  this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = this.defaultFillStyle;
  this.ctx.strokeStyle = this.defaultStrokeStyle;

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
