var Vertex = function(x, y, z){
  this.x = x;
  this.y = y;
  this.z = z;

  this.add = function(vertex){
    this.x += vertex.x;
    this.y += vertex.y;
    this.z += vertex.z;
  }

  this.getScaled = function(scallar){
    return new Vertex(this.x * scallar, this.y * scallar, this.z * scallar);
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

var Model = function(polygons, position, direction){
  this.polygons = polygons ? polygons : [];
  this.position = position ? position : new Vertex(0, 0, 0);
  this.direction = direction ? direction : new Vector(0, 0, 1);
}

var ModelTemplates = {
  //tileSize and colors are optional
  tiledFloor: function(startX, startZ, width, length, tileSize, colors){
    var tileSize = tileSize ? tileSize : 100;
    var colors = colors ? colors : ['red', 'black'];
    var y = 0;
    var floor = new Model();
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
        floor.polygons.push(polygon);
      }
    }

    return floor;
  }
}

var Camera = function(position, vector, viewportSize, zoom){
  this.position = position;
  this.vector = vector;
  this.viewportSize = viewportSize;
  this.zoom = zoom;
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

      //camera position offset
      point.x -= this.position.x;
      point.y -= this.position.y;
      point.z -= this.position.z;

      var tX = point.x * cos - point.z * sin;
      var tZ = point.x * sin + point.z * cos;

      //provides the depth
      var x = tZ == 0 ? tX : (tX * this.zoom) / (tZ + this.zoom)
      var y = tZ == 0 ? point.y : (point.y * this.zoom) / (tZ + this.zoom);

      this.cashedVertices.push([x, -y]);

      //it checks if the vertex z coord is in front of the camera
      if(tZ > 0){
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
    }
    return anyVertexVisible;
  }
}

var Scene = function(canvasId){
  this.framerate = 30;
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

  this.keysDown = null;
  this.mouseEvents = [];
  enableKeyboardEvents(this);
  enableMouseEvents(this);

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

var key = {
  w: 87, a: 65, s: 83, d: 68, q: 81, e: 69
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
  var canvasBounds = scene.canvas.getBoundingClientRect();
  var widthRatio = scene.canvas.width / canvasBounds.width;
  var heightRatio = scene.canvas.height / canvasBounds.height;

  document.onmousemove = function(e){
    //left = 1, right = 2, middle = 4;
    //if left button click included in all other clicks
    //if(e.buttons % 2 == 1){
    //restrict pushing to this 'stack' if it get's overloaded
      if(scene.mouseEvents.length < 20){
        var x = (e.clientX - canvasBounds.left) * widthRatio;
        var y = (e.clientY - canvasBounds.top) * heightRatio;
        //when elements get shifted of, I want it to be like a queue instead of a stack
        if(y >= 0 && y < 500)
          scene.mouseEvents.push({x, y}); //temp fix to not having control of mouse
      }
    //}
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
  }
}
