// ================================
// Global Variables for GUI Controls
// ================================

/**
 * Central object to manage all GUI functionalities.
 * Serves as the parent control for all GUI-related subgroups.
 */
var guiControls = null

/**
 * OSV Controls:
 * - Manages Orbit State Vector (OSV) visualization and real-time data.
 * - Examples:
 *    - Visualizing satellite positions and vectors.
 *    - Displaying orbit paths.
 */
var osvControls = {}

/**
 * Display Controls:
 * - Handles visual components and toggles for GUI elements.
 * - Examples:
 *    - Enabling/disabling grid lines.
 *    - Toggling visibility of satellite paths.
 */
var displayControls = {}

/**
 * TLE Controls:
 * - Provides functionalities to upload, manage, and visualize TLE files.
 * - Examples:
 *    - Uploading TLE files by satellite name or catalog number.
 *    - Selecting satellites dynamically for operations.
 */
var tleControls = {}

/**
 * Time Controls:
 * - Controls the simulation time and timewarp functionality.
 * - Examples:
 *    - Pausing or resuming the simulation.
 *    - Adjusting timewarp for faster or slower progression.
 */
var timeControls = {}

/**
 * Camera Controls:
 * - Manages the camera’s behavior, including movement and focus.
 * - Examples:
 *    - Centering on a specific satellite.
 *    - Rotating the view dynamically.
 */
var cameraControls = {}

/**
 * Frame Controls:
 * - Handles the reference frame for the visualization.
 * - Examples:
 *    - Switching between Earth-centered (ECEF) and inertial frames.
 *    - Changing coordinate systems.
 */
var frameControls = {}

/**
 * Kepler Controls:
 * - Displays Keplerian orbital parameters for selected satellites.
 * - Examples:
 *    - Showing semi-major axis, inclination, and eccentricity.
 *    - Visualizing real-time changes in orbital elements.
 */
var keplerControls = {}

function configureTime() {}

/**
 * Create GUI controls.
 */
function createControls() {
  const initDate = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
      new Date().getUTCHours(),
      new Date().getUTCMinutes(),
      new Date().getUTCSeconds()
    )
  )

  guiControls = new (function () {
    //this.preset = "Start";
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

    //this.enableLocation = false;
    this.displayTwilight = true
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
    this.dateYear = initDate.getUTCFullYear()
    this.dateMonth = initDate.getUTCMonth() + 1
    this.dateDay = initDate.getUTCDate()
    this.timeHour = initDate.getUTCHours()
    this.timeMinute = initDate.getUTCMinutes()
    this.timeSecond = initDate.getUTCSeconds()
    this.GitHub = function () {
      window
        .open(
          'https://github.com/UA-ComputerNetworks/OrbitsGL/tree/TLE',
          '_blank'
        )
        .focus()
    }
    this.warpSeconds = 1
    this.timeWarp = false
    this.lockLonRot = false
    this.lockLatRot = false

    this.lon = 0.0
    this.lat = 0.0
    this.distance = a * 5.0

    this.upLon = 0.0
    this.upLat = 90.0
    this.fov = 30

    this.frame = 'ECEF'

    this.source = 'Telemetry'
    this.enableClock = false
    this.targetName = 'ISS (ZARYA)'
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

    this.tleSatName = 'ISS (ZARYA)'
    this.tleLaunchYear = '98'
    this.tleLaunchNumber = '067'
    this.tlePiece = 'A__'
    this.tleYear = '21'
    this.tleDay = '356.70730882'
    this.tleBalDer = '_.00006423'
    this.tleSecDer = '_00000+0'
    this.tleDragTerm = '_12443-3'
    this.tleElemSetNumber = '_999'
    this.tleCatalogNo = '25544'
    this.tleInclination = '51.6431'
    this.tleRA = '130.5342'
    this.tleEccentricity = '0.0004540'
    this.tleArgPerigee = '343.5826'
    this.tleMeanAnomaly = '107.2903'
    this.tleMeanMotion = '15.49048054'
    this.tleRev = '31781'

    this.keplere = 0.0
    this.keplera = 6800
    this.kepleri = 0.0
    this.keplerOmega = 0.0
    this.kepleromega = 0.0
    this.keplerM = 0.0
    this.keplerFix = false

    // Initialize OSV from a string.
    this.insertOSV = function () {
      var osvIn = prompt(
        'Orbit State Vector',
        '2021-12-05T18:10:00.000 5326.946850262350 4182.210271432980 -611.867277305457 -3.37162589413797 3.42675425977118 -5.96208196793267'
      )
      if (osvIn) {
        osvControls.targetName.setValue('Manual OSV')
        osvControls.source.setValue('OSV')

        const terms = osvIn.split(' ')
        const timeStamp = new Date(terms[0] + 'Z')
        const posX = parseFloat(terms[1])
        const posY = parseFloat(terms[2])
        const posZ = parseFloat(terms[3])
        const velX = parseFloat(terms[4])
        const velY = parseFloat(terms[5])
        const velZ = parseFloat(terms[6])

        console.log('Time stamp: ' + timeStamp)
        console.log('Position X: ' + posX)
        console.log('Position Y: ' + posY)
        console.log('Position Z: ' + posZ)
        console.log('Velocity X: ' + velX)
        console.log('Velocity Y: ' + velY)
        console.log('Velocity Z: ' + velZ)

        osvControls.osvYear.setValue(timeStamp.getFullYear())
        osvControls.osvMonth.setValue(timeStamp.getMonth() + 1)
        osvControls.osvDay.setValue(timeStamp.getDate())
        osvControls.osvHour.setValue(timeStamp.getHours())
        osvControls.osvMinute.setValue(timeStamp.getMinutes())
        osvControls.osvSecond.setValue(timeStamp.getSeconds())
        osvControls.osvX.setValue(posX)
        osvControls.osvY.setValue(posY)
        osvControls.osvZ.setValue(posZ)
        osvControls.osvVx.setValue(velX * 1000)
        osvControls.osvVy.setValue(velY * 1000)
        osvControls.osvVz.setValue(velZ * 1000)
      }
    }

    // // Initialize TLE from a string.
    // this.insertTLE = function () {
    //   const TLEcontainer = document.getElementById('TLEcontainer')
    //   TLEcontainer.style.visibility = 'visible'
    //   const TLEinput = document.getElementById('TLEinput')
    //   TLEinput.focus()
    // }

    // Initialize TLE from a string.
    this.insertList = function () {
      const listContainer = document.getElementById('TLEListcontainer')
      listContainer.style.visibility = 'visible'
      const TLEinput = document.getElementById('TLEListinput')
      TLEinput.focus()
    }

    // Export OSV into a string.
    this.exportOSV = function () {
      const osv = ISS.osvProp
      const timeString = osv.ts.toISOString().slice(0, -1)
      const posString =
        osv.r[0] * 0.001 + ' ' + osv.r[1] * 0.001 + ' ' + osv.r[2] * 0.001
      const velString =
        osv.v[0] * 0.001 + ' ' + osv.v[1] * 0.001 + ' ' + osv.v[2] * 0.001
      window.alert(timeString + ' ' + posString + ' ' + velString)
    }

    this.createTLE = function () {
      const lines = createTLE()

      const TLEcontainer = document.getElementById('TLEcontainer')
      TLEcontainer.style.visibility = 'visible'
      const TLEinput = document.getElementById('TLEinput')
      TLEinput.focus()
      TLEinput.value = lines
    }

    this.createTLEOSV = function () {
      createTLEOSV()
    }
  })()

  gui = new dat.GUI({ width: 250 }) // Adjust the width as needed

  osvControls.targetName = gui
    .add(guiControls, 'targetName')
    .name('Target Name')

  osvControls.insertList = gui
    .add(guiControls, 'insertList')
    .name('Insert TLE List')

  // Select TLE controls.

  // Adding "Select TLE" options to GUI
  guiControls.selectTLEByName = function () {
    console.log('Select TLE by Name triggered')
    document.getElementById('SelectTLEFileInputByName').click()
  }

  guiControls.selectTLEByCatalog = function () {
    console.log('Select TLE by Catalog triggered')
    document.getElementById('SelectTLEFileInputByCatalog').click()
  }

  // Add Select TLE Folder to GUI
  const tleFolder2 = gui.addFolder('Select TLE')
  tleFolder2.add(guiControls, 'selectTLEByName').name('Select TLE by Name')
  tleFolder2
    .add(guiControls, 'selectTLEByCatalog')
    .name('Select TLE by Catalog Number')

  // Moving ISL features to the top.

  // Define upload functions in guiControls

  guiControls.uploadISLFileByName = function () {
    document.getElementById('ISLFileInputByName').click() // Trigger ISL upload by name
  }

  guiControls.uploadISLFileByCatalog = function () {
    document.getElementById('ISLFileInputByCatalog').click() // Trigger ISL upload by catalog number
  }

  guiControls.uploadISLStyleFile = function () {
    document.getElementById('ISLStyleFileInputByName').click() // Trigger hidden style file input
  }

  // Add an "Inter-Satellite Links" folder to GUI
  // Add ISL upload options
  const islFolder = gui.addFolder('Inter-Satellite Links')
  islFolder
    .add(guiControls, 'uploadISLFileByName')
    .name('Upload ISL by SatName')
  islFolder
    .add(guiControls, 'uploadISLFileByCatalog')
    .name('Upload ISL by Catalog Number')
  islFolder.add(guiControls, 'uploadISLStyleFile').name('Upload ISL Style File')

  osvControls.source = gui
    .add(guiControls, 'source', ['Telemetry', 'OEM', 'TLE', 'OSV'])
    .name('Data Source')

  // Enable clock.
  timeControls.enableClock = gui
    .add(guiControls, 'enableClock')
    .name('Start from Present time')

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
  displayControls.enableListNames = displayFolder
    .add(guiControls, 'showListNames')
    .name('Show Names')
  //displayFolder.add(guiControls, 'enableMoon').name('Show Moon');
  const lonControl = displayFolder
    .add(guiControls, 'gridLonResolution', 1, 180, 1)
    .name('Grid Lon. Resolution')
    .onChange(function () {
      earthShaders.updateGrid(
        guiControls.gridLonResolution,
        guiControls.gridLatResolution
      )
    })
  const latControl = displayFolder
    .add(guiControls, 'gridLatResolution', 1, 180, 1)
    .name('Grid Lat. Resolution')
    .onChange(function () {
      earthShaders.updateGrid(
        guiControls.gridLonResolution,
        guiControls.gridLatResolution
      )
    })
  displayFolder
    .add(guiControls, 'orbitsBefore', 0, 5, 0.1)
    .name('Orbits Before')
  displayFolder.add(guiControls, 'orbitsAfter', 0, 5, 0.1).name('Orbits After')
  displayFolder
    .add(guiControls, 'orbitPoints', 10, 1000, 1)
    .name('Points per Orbit')
  displayFolder
    .add(guiControls, 'satelliteScale', 0.1, 10.0, 0.1)
    .name('Satellite Scaling')
  displayFolder
    .add(guiControls, 'activeScale', 0.1, 10.0, 0.1)
    .name('Point Size')
    .onChange(function () {
      pointShaders.pointSize = guiControls.activeScale
    })
  displayFolder
    .addColor(guiControls, 'colorGrid')
    .name('Grid Color')
    .onChange(function () {
      earthShaders.colorGrid = guiControls.colorGrid
      earthShaders.setColorsGrid()
    })
  displayFolder
    .addColor(guiControls, 'colorMap')
    .name('Map Color')
    .onChange(function () {
      earthShaders.colorMap = guiControls.colorMap
      earthShaders.setColorsMap()
    })
  displayFolder
    .addColor(guiControls, 'colorOrbit')
    .name('Orbit Color')
    .onChange(function () {
      lineShaders.colorOrbit = guiControls.colorOrbit
    })
  displayFolder
    .addColor(guiControls, 'colorSatellite')
    .name('Point Color')
    .onChange(function () {
      pointShaders.colorPoint = guiControls.colorSatellite
    })

  const cameraFolder = gui.addFolder('Camera')
  cameraControls.frame = cameraFolder
    .add(guiControls, 'frame', ['ECEF', 'J2000'])
    .name('Frame')

  cameraFolder.add(guiControls, 'fov', 1, 180, 1).name('Field of View')
  cameraFolder.add(guiControls, 'lockLonRot').name('Lock Longitude')
  cameraFolder.add(guiControls, 'lockLatRot').name('Lock Latitude')
  cameraControls.lon = cameraFolder
    .add(guiControls, 'lon', -180, 180, 0.1)
    .name('Longitude')
  cameraControls.lat = cameraFolder
    .add(guiControls, 'lat', -180, 180, 0.1)
    .name('Latitude')
  cameraControls.distance = cameraFolder
    .add(guiControls, 'distance', a * 1.01, 1000000, 100)
    .name('Distance')
  cameraFolder.add(guiControls, 'upLon', -180, 180, 1).name('Longitude Up')
  cameraFolder.add(guiControls, 'upLat', -90, 90, 1).name('Latitude Up')

  const timeFolder = gui.addFolder('Time')
  timeControls.warpSeconds = timeFolder
    .add(guiControls, 'warpSeconds', -60, 60, 1)
    .onChange(configureTime)
    .name('Warp Size')
  timeFolder.add(guiControls, 'timeWarp').name('Time Warp')
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
    .add(guiControls, 'timeHour', 0, 24, 1)
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

  timeControls.deltaDayControl = timeFolder
    .add(guiControls, 'deltaDays', -185, 185, 1)
    .name('Delta Days')
  timeControls.deltaHourControl = timeFolder
    .add(guiControls, 'deltaHours', -12, 12, 1)
    .name('Delta Hours')
  timeControls.deltaMinuteControl = timeFolder
    .add(guiControls, 'deltaMins', -30, 30, 1)
    .name('Delta Minutes')
  timeControls.deltaSecControl = timeFolder
    .add(guiControls, 'deltaSecs', -30, 30, 1)
    .name('Delta Seconds')
  timeFolder
    .add(
      {
        reset: function () {
          var resetDate = new Date()
          timeControls.deltaDayControl.setValue(0)
          timeControls.deltaSecControl.setValue(0)
          timeControls.deltaMinuteControl.setValue(0)
          timeControls.deltaHourControl.setValue(0)
          timeControls.yearControl.setValue(resetDate.getFullYear())
          timeControls.monthControl.setValue(resetDate.getMonth() + 1)
          timeControls.dayControl.setValue(resetDate.getDate())
          timeControls.hourControl.setValue(resetDate.getHours())
          timeControls.minuteControl.setValue(resetDate.getMinutes())
          timeControls.secondControl.setValue(resetDate.getSeconds())

          dateDelta = 0
        },
      },
      'reset'
    )
    .name('Reset Time')
  timeFolder
    .add(
      {
        setClockFromOsv: function () {
          timeControls.enableClock.setValue(0)
          timeControls.yearControl.setValue(osvControls.osvYear.getValue())
          timeControls.monthControl.setValue(osvControls.osvMonth.getValue())
          timeControls.dayControl.setValue(osvControls.osvDay.getValue())
          timeControls.hourControl.setValue(osvControls.osvHour.getValue())
          timeControls.minuteControl.setValue(osvControls.osvMinute.getValue())
          timeControls.secondControl.setValue(osvControls.osvSecond.getValue())
        },
      },
      'setClockFromOsv'
    )
    .name('Set From OSV')
  timeFolder
    .add(
      {
        setClockFromTle: function () {
          timeControls.enableClock.setValue(0)
          const tleYear = parseInt('20' + guiControls.tleYear)
          timeControls.yearControl.setValue(tleYear)
          let tleDate = new Date(tleYear, 0, 0)
          tleDate = new Date(
            tleDate.getTime() + guiControls.tleDay * 86400.0 * 1000.0
          )
          const utcDiffMinutes = tleDate.getTimezoneOffset()
          tleDate = new Date(tleDate.getTime() - utcDiffMinutes * 60.0 * 1000.0)

          console.log(tleDate)
          console.log(guiControls.tleDay)
          timeControls.monthControl.setValue(tleDate.getMonth() + 1)
          timeControls.dayControl.setValue(tleDate.getDate())
          timeControls.hourControl.setValue(tleDate.getHours())
          timeControls.minuteControl.setValue(tleDate.getMinutes())
          timeControls.secondControl.setValue(tleDate.getSeconds())
        },
      },
      'setClockFromTle'
    )
    .name('Set From TLE')

  const textFolder = gui.addFolder('Caption')
  textFolder.add(guiControls, 'showTargetName').name('Target Name')
  textFolder.add(guiControls, 'showLocal').name('Local Time')
  textFolder.add(guiControls, 'showUtc').name('UTC Time')
  textFolder.add(guiControls, 'showJulian').name('Julian Time')
  textFolder.add(guiControls, 'showSunRa').name('Sun Right Ascension')
  textFolder.add(guiControls, 'showSunDecl').name('Sun Declination')
  textFolder.add(guiControls, 'showSunLongitude').name('Sun Longitude')
  textFolder.add(guiControls, 'showSunLatitude').name('Sun Latitude')
  textFolder.add(guiControls, 'showMoonRa').name('Moon Right Ascension')
  textFolder.add(guiControls, 'showMoonDecl').name('Moon Declination')
  textFolder.add(guiControls, 'showMoonLongitude').name('Moon Longitude')
  textFolder.add(guiControls, 'showMoonLatitude').name('Moon Latitude')
  textFolder.add(guiControls, 'showTelemetry').name('Telemetry')
  textFolder.add(guiControls, 'showOsvGM2000').name('OSV J2000')
  textFolder.add(guiControls, 'showOsvECEF').name('OSV ECEF')
  textFolder.add(guiControls, 'showIssLocation').name('Geodetic Coordinates')
  textFolder.add(guiControls, 'showIssElements').name('Osculating Elements')

  const tleFolder = gui.addFolder('Two-Line Element')
  tleControls.createTLE = tleFolder
    .add(guiControls, 'createTLE')
    .name('Export TLE')
  tleControls.createTLEOSV = tleFolder
    .add(guiControls, 'createTLEOSV')
    .name('Fill from OSV')
  tleControls.tleSatName = tleFolder
    .add(guiControls, 'tleSatName')
    .name('Satellite Name')
  tleControls.tleLaunchYear = tleFolder
    .add(guiControls, 'tleLaunchYear')
    .name('Launch Year')
  tleControls.tleLaunchNumber = tleFolder
    .add(guiControls, 'tleLaunchNumber')
    .name('Launch Number')
  tleControls.tlePiece = tleFolder
    .add(guiControls, 'tlePiece')
    .name('Piece of Launch')
  tleControls.tleYear = tleFolder.add(guiControls, 'tleYear').name('Epoch Year')
  tleControls.tleDay = tleFolder.add(guiControls, 'tleDay').name('Epoch Day')
  tleControls.tleBalDer = tleFolder
    .add(guiControls, 'tleBalDer')
    .name('Mean Motion 1st Der')
  // tleControls.tleSecDer = tleFolder.add(guiControls, 'tleSecDer').name('Mean Motion 2st Der');
  tleControls.tleDragTerm = tleFolder
    .add(guiControls, 'tleDragTerm')
    .name('The drag term')
  tleControls.tleElemSetNumber = tleFolder
    .add(guiControls, 'tleElemSetNumber')
    .name('Element Set Number')

  tleControls.tleCatalogNo = tleFolder
    .add(guiControls, 'tleCatalogNo')
    .name('Catalog Number')
  tleControls.tleInclination = tleFolder
    .add(guiControls, 'tleInclination')
    .name('Inclination')
  tleControls.tleRA = tleFolder
    .add(guiControls, 'tleRA')
    .name('RA of Asc. Node')
  tleControls.tleEccentricity = tleFolder
    .add(guiControls, 'tleEccentricity')
    .name('Eccentricity')
  tleControls.tleArgPerigee = tleFolder
    .add(guiControls, 'tleArgPerigee')
    .name('Argument of Perigee')
  tleControls.tleMeanAnomaly = tleFolder
    .add(guiControls, 'tleMeanAnomaly')
    .name('Mean Anomaly')
  tleControls.tleMeanMotion = tleFolder
    .add(guiControls, 'tleMeanMotion')
    .name('Mean Motion')
  tleControls.tleRev = tleFolder
    .add(guiControls, 'tleRev')
    .name('Revolution Number')

  const osvFolder = gui.addFolder('Orbit State Vector')
  osvControls.osvYear = osvFolder
    .add(guiControls, 'osvYear', 1980, 2040, 1)
    .name('OSV Year')
  osvControls.osvMonth = osvFolder
    .add(guiControls, 'osvMonth', 1, 12, 1)
    .name('OSV Month')
  osvControls.osvDay = osvFolder
    .add(guiControls, 'osvDay', 1, 31, 1)
    .name('OSV Day')
  osvControls.osvHour = osvFolder
    .add(guiControls, 'osvHour', 0, 23, 1)
    .name('OSV Hour')
  osvControls.osvMinute = osvFolder
    .add(guiControls, 'osvMinute', 0, 59, 1)
    .name('OSV Minute')
  osvControls.osvSecond = osvFolder
    .add(guiControls, 'osvSecond', 0, 59, 1)
    .name('OSV Second')
  osvControls.osvX = osvFolder
    .add(guiControls, 'osvX', -100000, 100000, 0.000001)
    .name('X (km)')
  osvControls.osvY = osvFolder
    .add(guiControls, 'osvY', -100000, 100000, 0.000001)
    .name('Y (km)')
  osvControls.osvZ = osvFolder
    .add(guiControls, 'osvZ', -100000, 100000, 0.000001)
    .name('Z (km)')
  osvControls.osvVx = osvFolder
    .add(guiControls, 'osvVx', -100000, 100000, 0.000001)
    .name('Vx (m/s)')
  osvControls.osvVy = osvFolder
    .add(guiControls, 'osvVy', -100000, 100000, 0.000001)
    .name('Vy (m/s)')
  osvControls.osvVz = osvFolder
    .add(guiControls, 'osvVz', -100000, 100000, 0.000001)
    .name('Vz (m/s)')

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
  keplerControls.kepleri = keplerFolder
    .add(guiControls, 'kepleri', 0.0, 180.0, 0.001)
    .name('Inclination')
  keplerControls.keplerOmega = keplerFolder
    .add(guiControls, 'keplerOmega', 0.0, 359.99, 0.001)
    .name('Long. Asc. Node')
  keplerControls.kepleromega = keplerFolder
    .add(guiControls, 'kepleromega', 0.0, 359.99, 0.001)
    .name('Arg. Perigee')
  keplerControls.keplerM = keplerFolder
    .add(guiControls, 'keplerM', 0.0, 359.99, 0.001)
    .name('Mean Anomaly')

  // Custom feature for satellite scale.

  // guiControls.selectedSatelliteSize = 0.05 // Default size multiplier

  // displayFolder
  //   .add(guiControls, 'selectedSatelliteSize', 0.1, 5.0, 0.1)
  //   .name('Selected Satellite Size')
  //   .onChange(function () {
  //     updateSelectedSatelliteSizes()
  //   })

  gui.add(guiControls, 'GitHub')

  // Keeping the OSV features in the bottom.

  osvControls.insertOSV = gui.add(guiControls, 'insertOSV').name('Insert OSV')
  osvControls.exportOSV = gui.add(guiControls, 'exportOSV').name('Export OSV')

  // Add Shortest Path Visualization folder
  const shortestPathFolder = gui.addFolder('Shortest Path Visualization')

  // Add GUI controls for file upload
  guiControls.uploadShortestPathFile = function () {
    document.getElementById('ShortestPathFileInput').click() // Trigger file upload directly
  }

  // Add options to the GUI
  shortestPathFolder
    .add(guiControls, 'uploadShortestPathFile')
    .name('Upload Shortest Path File')
}
