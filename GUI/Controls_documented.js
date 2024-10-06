// DatGUI controls: guiControls is used to manage user interface elements and settings for controlling the visualization.

// Detailed Breakdown of Controls.js:

// 	1.	Functionality:
// 	•	This file defines createControls(), a key function that generates the interactive UI using the dat.GUI library.
// 	•	The interface allows users to interact with visual settings, satellite orbits, telemetry, time manipulation, and camera controls for the OrbitsGL simulation.
// 	2.	Key Components:
// 	•	guiControls: This object holds settings related to satellite visualization, camera settings, grid, orbit toggles, and telemetry.
// 	•	dat.GUI: This library is used to create a structured user interface where each feature can be toggled or controlled.
// 	•	Display Controls: Enable/disable grid, orbit lines, map lines, and more.
// 	•	Time Controls: Let users adjust time warp, set the time, or reset the clock.
// 	•	Keplerian Elements: Adjust orbital parameters such as semi-major axis, eccentricity, and inclination.
// 	3.	Important Details:
// 	•	User Interface: The UI allows users to control almost every aspect of the satellite’s orbit and its visual representation.
// 	•	Telemetry: Users can toggle telemetry data or import TLE/OSV data.
// 	•	Time Manipulation: Users can simulate time progression or stop/modify time directly.
var guiControls = null

// OSV, display, TLE, time, camera, frame, and kepler controls manage different aspects of the interface.
var osvControls = {}
var displayControls = {}
var tleControls = {}
var timeControls = {}
var cameraControls = {}
var frameControls = {}
var keplerControls = {}

/**
 * createControls - Initializes and creates the user interface (UI) controls for OrbitsGL.
 *
 * This function sets up various UI elements using dat.GUI, allowing users to manipulate and interact with different aspects of the 3D rendering and satellite simulation, such as:
 * - Toggling grid lines, textures, satellite orbits, and Sun/Moon visibility.
 * - Controlling camera settings like field of view, rotation, and distance.
 * - Setting satellite telemetry and orbital parameters manually or via TLE (Two-Line Element) input.
 *
 * Key GUI Controls:
 * - `insertTLE()`: Prompts the user to insert TLE data.
 * - `insertOSV()`: Prompts the user to insert an Orbital State Vector (OSV).
 * - `selectTLE()`: Opens a list of predefined TLE data for the user to select from.
 * - `exportOSV()`: Exports the current OSV data into a string format.
 * - `timeControls`: Allows the user to manipulate time settings for orbit simulation.
 *
 * The controls are organized into folders within the dat.GUI interface, making them easy to navigate.
 *
 * Usage Example:
 * ```js
 * createControls();
 * ```
 *
 * Important Details:
 * - `dat.GUI` library is required for creating the GUI.
 * - Ensure that this function is called after initializing other necessary elements like shaders, earth models, etc.
 */
function createControls() {
  const initDate = new Date()

  // Initialize and define GUI controls with default values.
  guiControls = new (function () {
    // Orbit and visualization control settings.
    this.enableOrbit = true
    this.enableGrid = true
    this.enableMap = true
    this.enableVisibility = true
    this.enableTextures = true
    this.enableSun = true
    this.enableMoon = true
    this.enableSubSolar = false
    this.enableList = false
    this.locationLon = 24.66
    this.locationLat = 60.21
    this.gridLonResolution = 30
    this.gridLatResolution = 30
    this.orbitsBefore = 1.0
    this.orbitsAfter = 1.0
    this.orbitPoints = 100
    this.satelliteScale = 1.0
    this.colorGrid = [80, 80, 80]
    this.colorMap = [80, 80, 120]
    this.colorOrbit = [127, 127, 127]
    this.colorSatellite = [200, 200, 200]
    this.activeScale = 2.0

    // Time settings
    this.deltaDays = 0
    this.deltaHours = 0
    this.deltaMins = 0
    this.deltaSecs = 0
    this.showTargetName = true
    this.showListNames = false
    this.showLocal = false
    this.showUtc = true
    this.showJulian = false
    this.showSunRa = false
    this.showSunDecl = false
    this.showSunLatitude = false
    this.showSunLongitude = false
    this.showMoonRa = false
    this.showMoonDecl = false
    this.showMoonLatitude = false
    this.showMoonLongitude = false
    this.showTelemetry = false
    this.showOsvGM2000 = false
    this.showOsvECEF = false
    this.showIssLocation = true
    this.showIssElements = false

    // Date and time controls (start with the current date/time).
    this.dateYear = initDate.getFullYear()
    this.dateMonth = initDate.getMonth() + 1
    this.dateDay = initDate.getDate()
    this.timeHour = initDate.getHours()
    this.timeMinute = initDate.getMinutes()
    this.timeSecond = initDate.getSeconds()

    // TLE and OSV settings.
    this.tleSatName = 'ISS (ZARYA)'
    this.osvYear = 2021
    this.osvMonth = 11
    this.osvDay = 22
    this.osvHour = 0
    this.osvMinute = 43
    this.osvSecond = 0
    this.osvX = 0.0
    this.osvY = 0.0
    this.osvZ = 0.0
    this.osvVx = 0.0
    this.osvVy = 0.0
    this.osvVz = 0.0

    // GitHub link for the project.
    this.GitHub = function () {
      window.open('https://github.com/vsr83/OrbitsGL', '_blank').focus()
    }
  })()

  /**
   * Configure time settings, allowing users to manually manipulate time for the simulation.
   */
  function configureTime() {
    if (!guiControls.enableClock) {
      const newDate = new Date(
        guiControls.dateYear,
        parseInt(guiControls.dateMonth) - 1,
        guiControls.dateDay,
        guiControls.timeHour,
        guiControls.timeMinute,
        guiControls.timeSecond
      ).getTime()

      const today = new Date().getTime()
      dateDelta = newDate - today
    }
  }

  // Create and configure dat.GUI user interface.
  gui = new dat.GUI()

  // OSV (Orbital State Vector) related controls.
  osvControls.targetName = gui
    .add(guiControls, 'targetName')
    .name('Target Name')
  osvControls.insertTLE = gui.add(guiControls, 'insertTLE').name('Insert TLE')
  osvControls.insertList = gui
    .add(guiControls, 'insertList')
    .name('Insert TLE List')
  osvControls.selectTLE = gui.add(guiControls, 'selectTLE').name('Select TLE')
  osvControls.insertOSV = gui.add(guiControls, 'insertOSV').name('Insert OSV')
  osvControls.exportOSV = gui.add(guiControls, 'exportOSV').name('Export OSV')
  osvControls.source = gui
    .add(guiControls, 'source', ['Telemetry', 'OEM', 'TLE', 'OSV'])
    .name('Data Source')

  // Time control configuration.
  timeControls.enableClock = gui
    .add(guiControls, 'enableClock')
    .name('Enable Clock')

  // Display controls (visual elements like grid, textures, Sun, Moon).
  const displayFolder = gui.addFolder('Display')
  displayControls.enableGrid = displayFolder
    .add(guiControls, 'enableGrid')
    .name('Grid Lines')
  displayControls.enableMap = displayFolder
    .add(guiControls, 'enableMap')
    .name('Map Lines')
  displayControls.enableTextures = displayFolder
    .add(guiControls, 'enableTextures')
    .name('Textures')
  displayControls.enableVisibility = displayFolder
    .add(guiControls, 'enableVisibility')
    .name('Show Visibility')
  displayControls.enableSubSolar = displayFolder
    .add(guiControls, 'enableSubSolar')
    .name('Subsolar Point')
  displayControls.enableOrbit = displayFolder
    .add(guiControls, 'enableOrbit')
    .name('Orbit Lines')
  displayControls.enableSun = displayFolder
    .add(guiControls, 'enableSun')
    .name('Sun Orbit')
  displayControls.enableList = displayFolder
    .add(guiControls, 'enableList')
    .name('Show List')

  // Configure time-related folders and controls (warp time, set clock).
  const timeFolder = gui.addFolder('Time')
  timeControls.warpSeconds = timeFolder
    .add(guiControls, 'warpSeconds', -60, 60, 1)
    .onChange(configureTime)
    .name('Warp Size')
  timeFolder.add(guiControls, 'timeWarp').name('Time Warp')

  // Other time settings (Year, Month, Day, Hour, Minute, Second)
  timeControls.yearControl = timeFolder
    .add(guiControls, 'dateYear', 1980, 2040, 1)
    .onChange(configureTime)
    .name('Year')
  timeControls.monthControl = timeFolder
    .add(guiControls, 'dateMonth', 1, 12, 1)
    .onChange(configureTime)
    .name('Month')
  timeControls.dayControl = timeFolder
    .add(guiControls, 'dateDay', 1, 31, 1)
    .onChange(configureTime)
    .name('Day')
  timeControls.hourControl = timeFolder
    .add(guiControls, 'timeHour', 0, 23, 1)
    .onChange(configureTime)
    .name('Hour')
  timeControls.minuteControl = timeFolder
    .add(guiControls, 'timeMinute', 0, 59, 1)
    .onChange(configureTime)
    .name('Minute')
  timeControls.secondControl = timeFolder
    .add(guiControls, 'timeSecond', 0, 59, 1)
    .onChange(configureTime)
    .name('Second')

  // Keplerian Elements controls (semi-major axis, eccentricity, inclination, etc.)
  const keplerFolder = gui.addFolder('Keplerian Elements')
  keplerControls.keplerFix = keplerFolder
    .add(guiControls, 'keplerFix')
    .name('Override')
  keplerControls.keplere = keplerFolder
    .add(guiControls, 'keplere', 0.0, 0.95, 0.0001)
    .name('Eccentricity')
  keplerControls.keplera = keplerFolder
    .add(guiControls, 'keplera', 1.0, 1e5, 0.1)
    .name('Semimajor Axis')

  // Caption controls to display time, Sun/Moon details, and telemetry.
  const textFolder = gui.addFolder('Caption')
  textFolder.add(guiControls, 'showTargetName').name('Target Name')
  textFolder.add(guiControls, 'showLocal').name('Local Time')
  textFolder.add(guiControls, 'showUtc').name('UTC Time')
  textFolder.add(guiControls, 'showJulian').name('Julian Time')
  textFolder.add(guiControls, 'showSunRa').name('Sun Right Ascension')
  textFolder.add(guiControls, 'showSunDecl').name('Sun Declination')
  textFolder.add(guiControls, 'showMoonRa').name('Moon Right Ascension')
  textFolder.add(guiControls, 'showMoonDecl').name('Moon Declination')

  // TLE (Two-Line Element) controls.
  const tleFolder = gui.addFolder('Two-Line Element')
  tleControls.createTLE = tleFolder
    .add(guiControls, 'createTLE')
    .name('Export TLE')
  tleControls.createTLEOSV = tleFolder
    .add(guiControls, 'createTLEOSV')
    .name('Fill from OSV')
}
