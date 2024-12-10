/**
 * This script handles the input of Two-Line Elements (TLE) for satellite tracking. It allows users
 * to input TLE data through either a textarea or a file upload. The input is processed and displayed
 * in various controls. Key functionalities include:
 *
 * - TLE input through text or file
 * - Validation of TLE format
 * - Display and manipulation of TLE data through controls
 * - File reading and parsing
 */

// Handling of TLE input dialog elements from the HTML page.
const TLEEnter = document.getElementById('TLEEnter')
const TLECancel = document.getElementById('TLECancel')
const TLEfileInput = document.getElementById('TLEfile') // Added file input for reading files

/**
 * Event handler for the 'Enter' button click. Processes the TLE input from the textarea or file.
 * If a file is uploaded, it reads the file, otherwise it reads from the textarea.
 */
TLEEnter.onclick = function () {
  const TLEcontainer = document.getElementById('TLEcontainer')
  const TLEinput = document.getElementById('TLEinput')
  TLEcontainer.style.visibility = 'hidden'

  // Check if a file is selected for input
  if (TLEfileInput.files.length > 0) {
    const file = TLEfileInput.files[0]
    const reader = new FileReader()

    // Read the file content
    reader.onload = function (event) {
      const fileContent = event.target.result
      console.log('File content:', fileContent) // Debugging: log file content to ensure it's read correctly
      processTLE2(fileContent) // Process TLE after reading the file
    }

    // Read the file as text
    reader.readAsText(file)
  } else {
    // If no file is selected, use the textarea value
    const tleIn = TLEinput.value
    processTLE(tleIn) // Process TLE from textarea
  }
}

/**
 * Event handler for the 'Cancel' button click. Resets the input fields and hides the container.
 */
TLECancel.onclick = function () {
  const TLEcontainer = document.getElementById('TLEcontainer')
  const TLEinput = document.getElementById('TLEinput')
  TLEcontainer.style.visibility = 'hidden'
  TLEinput.value = '' // Clear the textarea
  TLEfileInput.value = '' // Clear the file input field
}

/**
 * Processes TLE data. This function handles both the input from the textarea and file.
 * It splits the TLE string into lines and validates the format before updating controls.
 *
 * @param {string} tleIn - TLE data input (in string format).
 */
function processTLE(tleIn) {
  const lines = tleIn.split('\n')
  console.log('TLE lines:', lines) // Debugging: log lines to ensure it's split correctly

  if (lines.length >= 3) {
    const targetName = lines[0] // Name of the satellite
    const line1 = lines[1] // First line of TLE data
    const line2 = lines[2] // Second line of TLE data

    // Validate if the lines follow the TLE format
    if (line1.startsWith('1') && line2.startsWith('2')) {
      osvControls.targetName.setValue(targetName) // Update target name control

      const tle = sgp4.tleFromLines(lines) // Parse TLE lines
      satrec = sgp4.createTarget(tle) // Create target for satellite tracking

      osvControls.source.setValue('TLE') // Set the source of data as TLE
      updateTLEControls(targetName, line1, line2) // Update other TLE-related controls
    } else {
      window.alert('Invalid TLE format.') // Alert the user if TLE format is incorrect
    }
  } else {
    window.alert('Not enough TLE lines provided.') // Alert the user if TLE data is incomplete
  }
}

/**
 * Updates the TLE controls (UI) with the TLE data.
 *
 * @param {string} targetName - The name of the satellite.
 * @param {string} line1 - The first line of the TLE data.
 * @param {string} line2 - The second line of the TLE data.
 */
function updateTLEControls(targetName, line1, line2) {
  tleControls.tleSatName.setValue(targetName)
  tleControls.tleLaunchYear.setValue(line1.substring(9, 11).replace(/ /g, '_'))
  tleControls.tleLaunchNumber.setValue(
    line1.substring(11, 14).replace(/ /g, '_')
  )
  tleControls.tlePiece.setValue(line1.substring(14, 17).replace(/ /g, '_'))
  tleControls.tleYear.setValue(line1.substring(18, 20).replace(/ /g, ''))
  tleControls.tleDay.setValue(line1.substring(20, 32).replace(/ /g, ''))
  tleControls.tleBalDer.setValue(line1.substring(33, 43).replace(/ /g, ''))
  tleControls.tleDragTerm.setValue(line1.substring(53, 61).replace(/ /g, '_'))
  tleControls.tleElemSetNumber.setValue(
    line1.substring(64, 68).replace(/ /g, '_')
  )

  tleControls.tleCatalogNo.setValue(line2.substring(2, 7).replace(/ /g, ''))
  tleControls.tleInclination.setValue(line2.substring(8, 16).replace(/ /g, ''))
  tleControls.tleRA.setValue(line2.substring(17, 25).replace(/ /g, ''))
  tleControls.tleEccentricity.setValue(
    '0.' + line2.substring(26, 33).replace(/ /g, '')
  )
  tleControls.tleArgPerigee.setValue(line2.substring(34, 42).replace(/ /g, ''))
  tleControls.tleMeanAnomaly.setValue(line2.substring(43, 51).replace(/ /g, ''))
  tleControls.tleMeanMotion.setValue(line2.substring(52, 63).replace(/ /g, ''))
  tleControls.tleRev.setValue(line2.substring(63, 68).replace(/ /g, '_'))
}

/**
 * Computes the checksum for a TLE line. The checksum is calculated by summing
 * the digits and adding 1 for minus signs.
 *
 * @param {string} line - A single line of the TLE data.
 * @returns {number} The checksum (mod 10).
 */
function checksumTLE(line) {
  let checksum = 0

  for (let ind = 0; ind < line.length; ind++) {
    const char = line[ind]

    if ('0123456789'.indexOf(char) > -1) {
      checksum += parseInt(char)
    } else if (char == '-') {
      checksum++ // Add 1 for each '-' character
    }
  }

  return checksum % 10 // Return checksum mod 10
}

/**
 * Converts a floating point value with a configurable number of decimals to a formatted string.
 * This function ensures that numbers below 1000 are padded correctly.
 *
 * @param {number} value - The floating point value.
 * @param {number} decimals - The number of decimal places.
 * @returns {string} The formatted string.
 */
function createTLEFloat34(value, decimals) {
  let padding = ''

  if (value < 100.0 && value >= 10.0) {
    padding = ' '
  } else if (value < 10.0) {
    padding = '  '
  }

  return padding + value.toFixed(decimals)
}

/**
 * Converts a floating point value to a string with 8 decimals and value below 100.
 *
 * @param {number} value - The floating point value.
 * @returns {string} The formatted string.
 */
function createTLEFloat28(value) {
  let padding = ''

  if (value < 10.0) {
    padding = ' '
  }

  return padding + value.toFixed(8)
}

/**
 * Creates a TLE from the current user inputs in the controls.
 *
 * @returns {string} The generated TLE as a string.
 */
function createTLE() {
  const line0 = guiControls.tleSatName
  const catalogNumber = guiControls.tleCatalogNo.replace(/_/g, ' ') + 'U'
  const intDesign =
    guiControls.tleLaunchYear +
    guiControls.tleLaunchNumber +
    guiControls.tlePiece.replace(/_/g, ' ')
  const epoch =
    guiControls.tleYear +
    createTLEFloat34(parseFloat(guiControls.tleDay), 8).replace(/ /g, '0')
  let balDer = parseFloat(guiControls.tleBalDer.replace(/_/g, '')).toFixed(8)

  if (balDer >= 0.0) {
    balDer = ' ' + balDer.substring(1, 10)
  } else {
    balDer = '-' + balDer.substring(2, 11)
  }

  const secDer = ' 00000+0'
  let dragTerm = guiControls.tleDragTerm.replace(/_/g, ' ')
  const elemSetNumber = guiControls.tleElemSetNumber.replace(/_/g, ' ')

  let line1 = `1 ${catalogNumber} ${intDesign} ${epoch} ${balDer} ${secDer} ${dragTerm} 0 ${elemSetNumber}`

  const inclination = createTLEFloat34(
    parseFloat(guiControls.tleInclination),
    4
  )
  const RA = createTLEFloat34(parseFloat(guiControls.tleRA), 4)
  const eccentricity = parseFloat(guiControls.tleEccentricity)
    .toFixed(7)
    .substring(2, 10)
  const argPerigee = createTLEFloat34(parseFloat(guiControls.tleArgPerigee), 4)
  const meanAnomaly = createTLEFloat34(
    parseFloat(guiControls.tleMeanAnomaly),
    4
  )
  const meanMotion = createTLEFloat28(parseFloat(guiControls.tleMeanMotion))
  const revolution = guiControls.tleRev.replace('_', ' ')

  let line2 = `2 ${catalogNumber.substring(
    0,
    5
  )} ${inclination} ${RA} ${eccentricity} ${argPerigee} ${meanAnomaly} ${meanMotion} ${revolution}`

  line1 = line1 + checksumTLE(line1)
  line2 = line2 + checksumTLE(line2)

  return `${line0}\n${line1}\n${line2}`
}

/**
 * Creates a TLE from an OSV (Orbital State Vector).
 * The OSV is converted to Keplerian elements, then the TLE is generated.
 */
function createTLEOSV() {
  const osvProp = ISS.osvProp
  const ts = osvProp.ts
  const kepler = Kepler.osvToKepler(osvProp.r, osvProp.v, ts)

  const utcDiffMinutes = ts.getTimezoneOffset()
  const epochYear = ts.getUTCFullYear()
  const yearStart = new Date(epochYear, 0, 0)
  let diff = ts - yearStart
  diff += 1000 * 60 * utcDiffMinutes
  const msPerDay = 86400.0 * 1000.0
  const epochDay = diff / msPerDay

  tleControls.tleLaunchYear.setValue('00')
  tleControls.tleLaunchNumber.setValue('000')
  tleControls.tlePiece.setValue('A__')
  tleControls.tleYear.setValue(epochYear.toString().substring(2, 4))
  tleControls.tleDay.setValue(epochDay)
  tleControls.tleBalDer.setValue('_.00000000')
  tleControls.tleDragTerm.setValue('_00000-1')
  tleControls.tleElemSetNumber.setValue('_999')
  tleControls.tleCatalogNo.setValue('00000')
  tleControls.tleInclination.setValue(kepler.incl)
  tleControls.tleRA.setValue(kepler.Omega)
  tleControls.tleEccentricity.setValue(kepler.ecc_norm)
  tleControls.tleArgPerigee.setValue(kepler.omega)
  tleControls.tleMeanAnomaly.setValue(kepler.M)

  const period = Kepler.computePeriod(kepler.a, kepler.mu)
  const meanMotion = 86400.0 / period
  tleControls.tleMeanMotion.setValue(meanMotion)

  tleControls.tleRev.setValue('00000')
}
