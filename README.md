# LowLevelGraphicsDemo
Assignment in my Adv. Game Programming Class
## Controls
* W - Forward
* S - Back
* A - Slide Left
* D - Slide Right
* Q - Fall, E - Rise
* MouseRight - Look Right
* MouseLeft - Look Left

## Objects

#### Vertex - triple used for vertex modeling
* instance variables
  * x, y, z
* methods
  * getScaled(scalar): returns given vertex scaled by the given scalar
  * moveAbsolute(vertex): move in global space by the values of given vertex
  * shiftHorizontalRelativeToVector(vector, x): shift x units right or left relative to the given vector

#### Vector - triple used for vector modeling
* instance variables
  * x, y, z
* methods
  * length(): return the length of vector
  * normalize(): normalized to unit vector
  * rotateHorizontally(radians): rotate vector horizontally by radians
  * getScaled(scallar): returns vector scaled by the given scallar
  * toVertex(): returns the Vertex parallel of this triple

#### Polygon
* instance variables
  * vertices
  * color
* methods
  * none

#### Sphere
* instance variables
  * vertex
  * color
  * radius
* methods
  * none

#### Model
* instance variables
  * Polygon[] polygons
  * Sphere[] spheres
  * Vector direction
  * Vertex position
  * Vertex velocity
  * bool HasGravityEnabled
  * bool IsActive
* methods
  * update(fps): updates physics (relative to fps), deactivates if out of bounds

#### Camera
* instance variables
  * Vertex position
  * Vector vector
  * [int, int] ViewportSize
  * int zoom
  * int sensitivity: from 0 to 1, used for mouse
  * int speed
* special instance variables - i use these based on context to avoid computing everything twice
  * cashedVertices
  * cashedSphereCoords
  * cashedSphereRadius
  * anyVertexVisible
* methods
  * offsetToCamera(vertex): offsets vertex based on camera's position and rotation
  * applyDepthPerception(coords): transforms a 3D coord into a 2D coordinate on the screen
  * applyDimentionShift(3DVertex, 2DVertex): shift the dimention of vertex somewhere between 2D and 3D inclusive
  * polygonInView(polygon): returns bool if given polygon is in view, stores results in cashedVertices
  * sphereInView(sphere): returns bool if sphere is in view, stores result in cashed coords and radius
  * updateMotion(scene): updates motion of camera based on input and framerate taken from the scene

#### Scene
* instance variables
 * int framerate
 * Canvas canvas
 * Canvas.Context context
 * int zoom
 * Camera camera
 * String defaultFillStyle
 * String defaultStrokeStyle
 * Int[] keysDown - listener init by enableKeyboardEvents(this);
 * Array mouseCoords - listener init by enableMouseEvents(this);
 * Array mouseEvents - listener init by enableMouseEvents(this);
 * int dimentionShift - listener init by enableDimentionSlider(this);
* methods
 * renderModel(model): renders the given model only the screen - calls draw3DPolygon and draw3DSphere
 * draw3DPolygon(polygon): draws given 3D polygon onto the screen
 * draw3DSphere(sphere): draws sphere onto the screen
 * clearScreen(): clears the screen for the next frame


## Helpers

#### PolygonTemplates - blueprints for quick building of Models
* tiledFloor: generates a horizontal floor-like surface
* box: generates a box, currently mostly transparent because I haven't rendered things correctly in front of each other yet


#### MouseHelper
* popDisplacement - takes the difference from first two mouse positions
* popAllDisplacement - takes the difference from all saved mouse positions
* GetLookLeftScalar - returns 0 to 1, based on LookThreshold on left side
* GetLookRightScalar - returns 0 to 1, based on LookThreshold on right side
* GetLookHorizontalScalar - returns -1 to 1 based on previous two functions 

#### enableDimentionSlider(scene)
* Pass in the scene to listen to the dimentionSlider. Sets the scene to be displayed on a gradient between 2D and 3D. Currently it's broken. 
* To see it working go to commit 73f0513859304b381c4894d9e0dee73aeea20223

#### enableKeyboardEvents(scene)
Pass in the scene that will capture they keyboard presses

#### enableMouseEvents(scene)
Pass in the scene that will capture the x and y coordinates of mouse

## Constants

#### key
Keys to be used by the keyboard
w, a, s, d, q, e

#### LookThreshold
Range that the mouse can be from the edge of the screen

#### GRAVITY
Constant for gravity

#### OUT_OF_BOUNDS
The x, y, or z distance an object is allowed to be before deactivating
