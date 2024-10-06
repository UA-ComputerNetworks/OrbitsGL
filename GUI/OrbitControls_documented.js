/**
 * OrbitControls.js
 *
 * Description:
 * This file handles mouse and touch interactions with a WebGL canvas for controlling the camera's
 * view of the 3D scene. It allows the user to rotate the view and zoom in/out using mouse or touch gestures.
 *
 * Key Features:
 * - Dragging the mouse rotates the view by changing camera angles.
 * - Scrolling zooms in/out by changing the camera's distance.
 * - Touch gestures for both single-finger rotation and two-finger zooming.
 *
 * Usage:
 * Include this file in a WebGL project to enable interactive orbit controls on a canvas element.
 * The controls adjust the camera's longitude, latitude, and distance based on user input.
 *
 * Dependencies:
 * - `MathUtils.js` for various mathematical operations such as radian-degree conversion, angle manipulation.
 * - `cameraControls` object for manipulating the camera position based on user interactions.
 */

// Variables to store the initial click/touch coordinates and dragging state
var xStart = 0 // Initial X position when mouse/touch starts
var yStart = 0 // Initial Y position when mouse/touch starts
var dragX = 0 // X-coordinate after dragging
var dragY = 0 // Y-coordinate after dragging
var dragXStart = 0 // Initial X drag position in degrees
var dragYStart = 0 // Initial Y drag position in degrees

// Flags to track dragging and scaling
var drawing = false // Is the user dragging the mouse?
var scaling = false // Is the user performing a zoom gesture?
var zoomStart = 0 // Starting distance for zoom gestures
var distanceStart = 0 // Initial camera distance for zoom

// Get the WebGL canvas elements from the DOM
var canvas = document.querySelector('#canvas') // WebGL canvas
var canvasJs = document.querySelector('#canvasJs') // 2D overlay canvas for user interface

/**
 * Event handler for mouse down (when user clicks and holds on the canvas)
 *
 * This event starts tracking the position of the mouse for drag operations. It stores the
 * initial position where the mouse was clicked and captures the initial rotation of the camera
 * in degrees.
 */
canvasJs.addEventListener('mousedown', function (e) {
  // Store the initial position when the mouse is pressed down
  xStart = e.clientX
  yStart = e.clientY

  // Store the initial rotation of the camera
  dragXStart = -MathUtils.rad2Deg(rotZ)
  dragYStart = -MathUtils.rad2Deg(rotX) - 90

  // Add the event handler for mouse movement to handle dragging
  canvasJs.onmousemove = function (m) {
    // Calculate the new drag positions based on mouse movement
    dragX = dragXStart - (m.clientX - xStart) / 10.0
    dragY = dragYStart - (m.clientY - yStart) / 10.0

    // Normalize the rotation angles within the valid range
    if (dragX > 270.0) dragX -= 360.0
    if (dragX < -90.0) dragX += 360.0
    if (dragY > 180.0) dragY -= 360.0
    if (dragY < -180.0) dragY += 360.0

    // Convert the new drag values back to radians
    rotZ = MathUtils.deg2Rad(-dragX)
    rotX = MathUtils.deg2Rad(-90 - dragY)

    // Update the camera's longitude and latitude based on the new rotation
    cameraControls.lon.setValue(rotZToLon(MathUtils.rad2Deg(rotZ)))
    cameraControls.lat.setValue(rotXToLat(MathUtils.rad2Deg(rotX)))
  }
})

/**
 * Event handler for mouse up (when the user releases the mouse)
 *
 * This event stops the dragging behavior once the user releases the mouse.
 */
canvasJs.addEventListener('mouseup', function (e) {
  // Remove the onmousemove handler to stop dragging
  canvasJs.onmousemove = null
})

/**
 * Event handler for when the mouse leaves the canvas
 *
 * This event stops the dragging behavior if the mouse exits the canvas area while dragging.
 */
canvasJs.addEventListener('mouseleave', function (e) {
  // Remove the onmousemove handler to stop dragging
  canvasJs.onmousemove = null
})

/**
 * Event handler for mouse wheel (to handle zoom in/out)
 *
 * The user can zoom in and out by scrolling the mouse wheel, which adjusts the camera's
 * distance from the scene.
 */
canvasJs.addEventListener('wheel', function (e) {
  // Adjust the camera's distance based on the scroll direction
  distance *= e.deltaY * 0.0001 + 1
  cameraControls.distance.setValue(distance) // Update the camera distance
})

/**
 * touchMove - Function to handle touch movement (dragging or zooming)
 *
 * Handles touch gestures for both single-touch dragging and two-finger zooming.
 *
 * @param {TouchEvent} e - The touch event triggered during movement.
 */
function touchMove(e) {
  // If scaling (two fingers for zoom), calculate the zoom factor
  if (scaling) {
    const dist = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    )

    // Adjust the distance based on the pinch gesture
    distance = distanceStart * (0.001 * (zoomStart - dist) + 1)
    cameraControls.distance.setValue(distance)
    e.preventDefault() // Prevent default scrolling behavior

    return // Exit the function since it's a zoom gesture
  }

  // For single-touch drag, handle camera rotation
  const m = e.touches[0] // Get the first touch point

  // Calculate the new drag positions based on touch movement
  dragX = dragXStart - (m.clientX - xStart) / 10.0
  dragY = dragYStart - (m.clientY - yStart) / 10.0

  // Normalize the rotation angles within the valid range
  if (dragX > 270.0) dragX -= 360.0
  if (dragY > 180.0) dragY -= 360.0
  if (dragX < -90.0) dragX += 360.0
  if (dragY < -180.0) dragY += 360.0

  // Convert the new drag values back to radians and update rotation
  rotZ = MathUtils.deg2Rad(-dragX)
  rotX = MathUtils.deg2Rad(-90 - dragY)

  // Update the camera's longitude and latitude based on the touch drag
  cameraControls.lon.setValue(rotZToLon(MathUtils.rad2Deg(rotZ)))
  cameraControls.lat.setValue(rotXToLat(MathUtils.rad2Deg(rotX)))
}

/**
 * Event handler for touch start (when the user touches the screen)
 *
 * This event starts tracking touch gestures, including single-touch for dragging and
 * two-finger pinch gestures for zooming. It stores the initial positions of the touch points
 * and prepares for the interaction.
 */
document.addEventListener(
  'touchstart',
  function (e) {
    if (e.touches.length == 1) {
      // Single touch for dragging
      // Store the initial touch position
      xStart = e.touches[0].clientX
      yStart = e.touches[0].clientY

      // Store the initial rotation of the camera
      dragXStart = -MathUtils.rad2Deg(rotZ)
      dragYStart = -MathUtils.rad2Deg(rotX) - 90

      // Add the touch move event listener to handle dragging
      document.addEventListener('touchmove', touchMove, { passive: false })
    }
    if (e.touches.length == 2) {
      // Two fingers for zooming
      distanceStart = distance // Store the initial distance for zooming
      zoomStart = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      ) // Calculate the distance between the two touch points
      scaling = true // Set the scaling flag to true (indicating a zoom gesture)
      e.preventDefault() // Prevent default behavior (like scrolling)
    }
  },
  { passive: false }
) // Add event listener with passive set to false to allow prevention of default behavior

/**
 * Event handler for touch end (when the user lifts their fingers off the screen)
 *
 * This event stops the touch movement behavior, removing the touch move event listener,
 * and resets any zoom interaction flags.
 */
document.addEventListener('touchend', function (e) {
  document.removeEventListener('touchmove', touchMove) // Remove the touch move listener when the touch ends
  scaling = false // Reset the scaling flag
})

/**
 * File Breakdown:
 *
 * 1. Global Variables:
 * - `xStart`, `yStart`: Store the initial X and Y positions when the user starts dragging/touching the screen.
 * - `dragX`, `dragY`: Store the updated X and Y positions after dragging.
 * - `dragXStart`, `dragYStart`: Initial drag positions for rotation in degrees.
 * - `drawing`, `scaling`: Flags to track if the user is dragging (rotating) or scaling (zooming).
 * - `zoomStart`, `distanceStart`: Initial zoom values for pinch gestures.
 *
 * 2. Mouse Event Handling:
 * - `mousedown`: Starts tracking the initial mouse position for drag operations. Adds the mouse move event to handle dragging.
 * - `mouseup`: Stops the drag operation by removing the mouse move event.
 * - `mouseleave`: Stops dragging when the mouse leaves the canvas area.
 * - `wheel`: Handles zooming in/out by adjusting the camera's distance when the user scrolls the mouse wheel.
 *
 * 3. Touch Event Handling:
 * - `touchstart`: Handles single-finger dragging and two-finger zoom gestures. It tracks the initial positions and flags for drag/zoom.
 * - `touchmove`: Updates the camera rotation or zoom based on touch movement.
 * - `touchend`: Stops the touch movement behavior when the user lifts their fingers.
 *
 * 4. Mathematical Calculations:
 * - The code frequently uses conversions between degrees and radians using `MathUtils.rad2Deg()` and `MathUtils.deg2Rad()`.
 * - It normalizes angles to prevent excessive rotation beyond the bounds.
 *
 * 5. Camera Control:
 * - The `cameraControls` object is used to update the camera's longitude, latitude, and distance based on user interactions.
 * - Functions like `rotZToLon()` and `rotXToLat()` convert rotation values into usable longitude and latitude coordinates for camera adjustments.
 *
 * Summary:
 * This file enables mouse and touch-based interaction with the 3D scene. The user can rotate the camera by dragging and zoom in/out with the scroll wheel or pinch gestures. The code leverages event listeners for interaction and relies on mathematical operations to smoothly update camera angles and distances.
 */
