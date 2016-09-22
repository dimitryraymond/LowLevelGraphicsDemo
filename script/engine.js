var Vertex = function(x, y, z){
  this.x = x;
  this.y = y;
  this.z = z;

  this.getScaled = function(scallar){
    return new Vertex(this.x * scallar, this.y * scallar, this.z * scallar);
  }

  this.moveAbsolute = function(vertex){
    this.x += vertex.x;
    this.y += vertex.y;
    this.z += vertex.z;
  }

  this.shiftHorizontalRelativeToVector = function(vector, x){
    this.x -= (vector.z * -x);
    this.z += (vector.x * -x);
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
    return new Vertex(this.x, this.y, this.z);
  }
}

var Model = function(polygons, position, direction, velocity, gravityEnabled){
  this.polygons = polygons ? polygons : [];
  this.direction = direction ? direction : new Vector(0, 0, 1);
  this.position = position ? position : new Vertex(0, 0, 0);
  this.velocity = velocity ? velocity : new Vertex(0, 0, 0);
  this.HasGravityEnabled = gravityEnabled;

  this.update = function(fps){
    //update motion
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;

    if(this.HasGravityEnabled)
      this.velocity.y += (GRAVITY / fps);
  }
}

var ModelTemplates = {
  //tileSize and colors are optional
  tiledFloor: function(startX, startZ, width, length, tileSize, colors){
    var tileSize = tileSize ? tileSize : 100;
    var colors = colors ? colors : ['red', 'black'];
    var y = 0;
    var floorPolygons = [];
    var tileCountX = Math.floor(width / tileSize);
    var tileCountZ = Math.floor(length / tileSize);

    for(var x = 0; x < tileCountX; x++){
      for(var z = 0; z < tileCountZ; z++){
        var polygon = new Polygon(
          [new Vertex(x * tileSize + startX, y, z * tileSize + startZ),
          new Vertex((x + 1) * tileSize + startX, y, z * tileSize + startZ),
          new Vertex((x + 1) * tileSize + startX, y, (z + 1) * tileSize + startZ),
          new Vertex(x * tileSize + startX, y, (z + 1) * tileSize + startZ)]
        );
        if((x + z) % 2 == 0)
          polygon.color = colors[0];
        else
          polygon.color = colors[1];
        floorPolygons.push(polygon);
      }
    }

    return floorPolygons;
  },
  box: function(x, y, z, width, height, depth, color){
    var boxPolygons = [];
    //back
    boxPolygons.push(new Polygon(
      [new Vertex(x, y, z + depth),
      new Vertex(x + width, y, z + depth),
      new Vertex(x + width, y + height, z + depth),
      new Vertex(x, y + height, z + depth)],
      'rgba(0, 0, 0, .4)' //need to hardcode other color to be sure my rendering is done correctly
    ));
    //right
    boxPolygons.push(new Polygon(
      [new Vertex(x + width, y, z),
      new Vertex(x + width, y, z + depth),
      new Vertex(x + width, y + height, z + depth),
      new Vertex(x + width, y + height, z)],
      'rgba(255, 0, 0, .2)' //need to hardcode other color to be sure my rendering is done correctly
    ));
    //top
    boxPolygons.push(new Polygon(
      [new Vertex(x, y + height, z),
      new Vertex(x + width, y + height, z),
      new Vertex(x + width, y + height, z + depth),
      new Vertex(x, y + height, z + depth)],
      'rgba(0, 255, 255, .2)' //need to hardcode other color to be sure my rendering is done correctly
    ));
    //bottom
    boxPolygons.push(new Polygon(
      [new Vertex(x, y, z),
      new Vertex(x + width, y, z),
      new Vertex(x + width, y, z + depth),
      new Vertex(x, y, z + depth)],
      'rgba(127, 127, 255, .2)' //need to hardcode other color to be sure my rendering is done correctly
    ));
    //left
    boxPolygons.push(new Polygon(
      [new Vertex(x, y, z + depth),
      new Vertex(x, y, z),
      new Vertex(x, y + height, z),
      new Vertex(x, y + height, z + depth)],
      'rgba(0, 255, 0, .2)' //need to hardcode other color to be sure my rendering is done correctly
    ));
    //front
    boxPolygons.push(new Polygon(
      [new Vertex(x, y, z),
      new Vertex(x + width, y, z),
      new Vertex(x + width, y + height, z),
      new Vertex(x, y + height, z)],
      color
    ));
    return boxPolygons;
  }
}

var Camera = function(position, vector, viewportSize, zoom, sensitivity, scene){
  this.position = position;
  this.vector = vector;
  this.viewportSize = viewportSize;
  this.zoom = zoom;
  this.sensitivity = sensitivity;
  this.speed = 50;
  if(this.vector.y != 0){
    throw "Rotation only around Y axis is implemented, so only horizontal vectors allowed for the camera";
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

      //camera position offset
      point.x -= this.position.x;
      point.y -= this.position.y;
      point.z -= this.position.z;

      //point is rotated relative to camera
      var tX = point.x * cos - point.z * sin;
      var tY = point.y;
      var tZ = point.x * sin + point.z * cos;

      //provides depth perception
      var x = tZ == 0 ? tX : (tX * this.zoom) / (tZ + this.zoom)
      var y = tZ == 0 ? point.y : (point.y * this.zoom) / (tZ + this.zoom);

      //from 0 to 1 | 0 = 2D, 1 = 3D, > 1 = nonsense
      var dimentionShift = scene.dimentionShift;
      if(dimentionShift == 1)
        this.cashedVertices.push([x, -y]);
      else
        this.cashedVertices.push([x * dimentionShift + tX * (1 - dimentionShift), -(y * dimentionShift + tY * (1 - dimentionShift))]);

      //it checks if the vertex z coord is in front of the camera
      if(tZ > 0){
        if(dimentionShift == 1){
          //occlusion culling TODO: does canvas already do this? I noticed no difference
          if(x > viewportSize[0] / 2 || x < -viewportSize[0] / 2){
            //point is too far to the side
          }
          else if(y > viewportSize[1] / 2 || y < -viewportSize[1] / 2){
            //point is too far high or low
          }
          else{
            anyVertexVisible = true;
          }
        }
        else{
          anyVertexVisible = true;
        }
      }
    }
    return anyVertexVisible;
  }

  this.updateMotion = function(scene){
    var lookHorizontalScalar = MouseHelper.GetLookHorizontalScalar(scene);
    if(lookHorizontalScalar != 0){
      this.vector.rotateHorizontally(-1 * lookHorizontalScalar * Math.PI / 15);
    }

    if(scene.keysDown[key.d]) { // if d
      this.position.shiftHorizontalRelativeToVector(this.vector, this.speed);
    }
    if(scene.keysDown[key.a]) { // if a
      this.position.shiftHorizontalRelativeToVector(this.vector, -this.speed);
    }
    if(scene.keysDown[key.w]){ // if w
      this.position.moveAbsolute(this.vector.toVertex().getScaled(this.speed));
    }
    if(scene.keysDown[key.s]){ // if s
      this.position.moveAbsolute(this.vector.toVertex().getScaled(-this.speed));
    }
    if(scene.keysDown[key.q]){ // if q
      this.position.moveAbsolute(new Vertex(0, -this.speed, 0));
    }
    if(scene.keysDown[key.e]){ // if e
      this.position.moveAbsolute(new Vertex(0, this.speed, 0));
    }
  }
}

var Scene = function(canvasId){
  this.framerate = 30;
  this.canvas = document.getElementById(canvasId);
  this.ctx = this.canvas.getContext("2d");
  this.zoom = 600;
  this.camera = new Camera(new Vertex(0, 0, 0), new Vector(0, 0, 1), [this.canvas.width, this.canvas.height], this.zoom, .5, this);
  this.defaultFillStyle = 'black';
  this.defaultStrokeStyle = 'black';
  this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
  this.ctx.font = "30px Arial";
  this.ctx.fillStyle = this.defaultFillStyle;
  this.ctx.strokeStyle = this.defaultStrokeStyle;

  this.keysDown = null;
  enableKeyboardEvents(this);

  this.mouseCoords = null;
  this.mouseEvents = null;
  enableMouseEvents(this);

  this.dimentionShift = 1;
  enableDimentionSlider(this);

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

  this.renderModel = function(model){
    for(var i = 0; i < model.polygons.length; i++){
      var polygon = new Polygon([], model.polygons[i].color);

      //offset position of polygon's vertices relative to polygons parent model
      for(var j = 0; j < model.polygons[i].vertices.length; j++){
        var vertex = new Vertex(0, 0, 0);
        vertex.x = model.polygons[i].vertices[j].x + model.position.x;
        vertex.y = model.polygons[i].vertices[j].y + model.position.y;
        vertex.z = model.polygons[i].vertices[j].z + model.position.z;
        polygon.vertices.push(vertex);
      }

      this.draw3DPolygon(polygon);
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

//Global Constants
var key = {
  w: 87, a: 65, s: 83, d: 68, q: 81, e: 69
}

var LookThreshold = {
  Weak: 100, Med: 50
}

var GRAVITY = -90;

function enableDimentionSlider(scene){
  var slider = document.getElementById('dimentionSlider');
  slider.onchange = function(){
    scene.dimentionShift = parseInt(slider.value) / 10;
  }
}

function enableKeyboardEvents(scene){
  scene.keysDown = new Array(256);
  for(var i = 0; i < 256; i++){
    scene.keysDown[i] = false;
  }

  document.onkeydown = function(e){
    scene.keysDown[e.keyCode] = true;
  }

  document.onkeyup = function(e){
    scene.keysDown[e.keyCode] = false;
  }
}

//push mouseCoords onto this 'queue' with mousemove events, as events get used they will get shifted off
function enableMouseEvents(scene){
  scene.mouseCoords = {x:scene.canvas.width / 2, y: scene.canvas.height / 2};
  scene.mouseEvents = [];
  var canvasBounds = scene.canvas.getBoundingClientRect();
  var widthRatio = scene.canvas.width / canvasBounds.width;
  var heightRatio = scene.canvas.height / canvasBounds.height;

  document.onmousemove = function(e){
    var x = (e.clientX - canvasBounds.left) * widthRatio;
    var y = (e.clientY - canvasBounds.top) * heightRatio;

    scene.mouseCoords = {x, y};
    //when elements get shifted off, I want it to be like a queue instead of a stack
    if(scene.mouseEvents.length < 20){
      scene.mouseEvents.push({x, y});
    }
  }
}

var MouseHelper = {

  //get the difference from the earliest
  popDisplacement: function(scene){
    //there's no difference between elements if there is only 1 element
    if(scene.mouseEvents.length > 1){
      var dX = scene.mouseEvents[1].x - scene.mouseEvents[0].x;
      var dY = scene.mouseEvents[1].y - scene.mouseEvents[0].y;

      scene.mouseEvents.shift();

      return({dX, dY});
    }
  },

  popAllDisplacement: function(scene){
    //there's no difference between elements if there is only 1 element
    if(scene.mouseEvents.length > 1){
      var dX = scene.mouseEvents[scene.mouseEvents.length - 1].x - scene.mouseEvents[0].x;
      var dY = scene.mouseEvents[scene.mouseEvents.length - 1].y - scene.mouseEvents[0].y;

      //keep the most recent element to be able to reference it in next difference calculation
      scene.mouseEvents = [scene.mouseEvents[scene.mouseEvents.length - 1]];
      scene.mouseEvents = [];
      return({dX, dY});
    }
  },

  GetLookLeftScalar: function(scene){
    var x = scene.mouseCoords.x;
    if(x < 0)
      return(1 * scene.camera.sensitivity); //strong
    else if(x < LookThreshold.Med)
      return(.5 * scene.camera.sensitivity); //med
    else if(x < LookThreshold.Weak)
      return(.25 * scene.camera.sensitivity); //weak
    else
      return(0);  //none
  },

  GetLookRightScalar: function(scene){
    var x = scene.mouseCoords.x;
    if(x > scene.canvas.width)
      return(1 * scene.camera.sensitivity); //strong
    else if(x > scene.canvas.width - LookThreshold.Med)
      return(.5 * scene.camera.sensitivity); //medium
    else if (x > scene.canvas.width - LookThreshold.Weak)
      return(.25 * scene.camera.sensitivity); //weak
    else
      return(0); //none
  },

  GetLookHorizontalScalar: function(scene){
    var lookLeftScalar = MouseHelper.GetLookLeftScalar(scene);
    if(lookLeftScalar != 0){
      return -1 * lookLeftScalar;
    }
    else{
      return MouseHelper.GetLookRightScalar(scene);
    }
  }
}
