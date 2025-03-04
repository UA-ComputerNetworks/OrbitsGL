// ===================================
// Global Elements for TLE Operations
// ===================================

/**
 * `ListEnter` - Button for confirming TLE data entry.
 * `ListCancel` - Button for cancelling TLE data input.
 * `TLEinput` - Textarea for displaying selected TLE files.
 * `TLEFileInput` - File input for uploading multiple TLE files.
 */
const ListEnter = document.getElementById('TLEListEnter')
const ListCancel = document.getElementById('TLEListCancel')
const TLEinput = document.getElementById('TLEListinput')
const TLEFileInput = document.getElementById('TLEFileInput')

// ================================
// Global Data Storage and Utilities
// ================================

/**
 * `satelliteCatalogMap` - Maps catalog numbers to satellite names.
 * `tleFiles` - Stores uploaded TLE files along with their content and timestamps.
 */
let satelliteCatalogMap = {}
let tleFiles = [] // Array to store uploaded TLE files and their data

/**
 * Extracts the catalog number from the first line of a TLE.
 * @param {string} tleLine1 - The first line of a TLE.
 * @returns {string} Catalog number extracted from the TLE.
 */
function extractCatalogNumber(tleLine1) {
  return tleLine1.substring(2, 7).trim()
}

/**
 * Extracts the timestamp from a TLE filename.
 * Assumes filenames follow the pattern `*_YYYYMMDDHHMMSS.txt`.
 * @param {string} filename - TLE filename.
 * @returns {number|null} Timestamp in milliseconds, or null if invalid format.
 */
function extractTimestamp(filename) {
  const match = filename.match(/_(\d{14})\.txt$/)
  return match
    ? new Date(
        parseInt(match[1].slice(0, 4)), // Year
        parseInt(match[1].slice(4, 6)) - 1, // Month (0-based)
        parseInt(match[1].slice(6, 8)), // Day
        parseInt(match[1].slice(8, 10)), // Hour
        parseInt(match[1].slice(10, 12)), // Minute
        parseInt(match[1].slice(12)) // Second
      ).getTime()
    : null
}

// ===================================
// Handling File Upload for TLE Files
// ===================================

/**
 * Handles multiple file uploads and parses their content.
 * Populates the `tleFiles` array and updates the textarea for display.
 */
TLEFileInput.onchange = function (event) {
  const files = Array.from(event.target.files) // Get all selected files
  if (!files || files.length === 0) {
    console.warn('No files selected.')
    return
  }

  console.log(`Processing ${files.length} file(s)...`)
  tleFiles = [] // Clear previous file data
  satelliteCatalogMap = {}
  satellites = []
  satelliteNames = []
  satNameToIndex = []
  satIndexToName = []
  satelliteObjects = {}

  // Clear textarea and list uploaded filenames
  TLEinput.value = '' // Clear previous content

  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = function (e) {
      const content = e.target.result
      let timestamp = extractTimestamp(file.name) // Try to extract timestamp

      if (!timestamp) {
        console.warn(
          `Invalid filename format: ${file.name}, using current time as timestamp.`
        )
        timestamp = Date.now() // Assign current system time if no timestamp is found
      }

      // Extract constellation name from filename (Example: "Starlink_20231101000004.txt")
      const constellationName = file.name.split('_')[0]

      // Store file content along with timestamp
      tleFiles.push({ name: file.name, content, timestamp })
      console.log(
        `Loaded file: ${file.name}, Timestamp: ${new Date(timestamp)}`
      )

      // Update `targetName` dynamically in GUI
      if (window.guiControls) {
        window.guiControls.targetName = constellationName
      }

      // Append to textarea for display
      TLEinput.value += `${file.name}\n`
    }

    reader.onerror = function (e) {
      console.error(`Error reading file ${file.name}:`, e)
    }

    reader.readAsText(file)
  })

  // Sort files after all are loaded
  setTimeout(() => {
    tleFiles.sort((a, b) => a.timestamp - b.timestamp)
    console.log('Sorted TLE files:', tleFiles)
  }, 100) // Ensure all file reads complete before sorting
}

// ============================
// Processing a Single TLE File
// ============================
/**
 * Processes the content of a single TLE file.
 * Parses the TLE lines and updates satellite-related data.
 * @param {string} content - TLE file content.
 * @param {string} filename - TLE filename.
 */
function processTLEFile(content, filename) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const numElem = Math.floor(lines.length / 3) // Determine number of TLE sets

  console.log(`Processing TLE file: ${filename}`)
  satellites = []
  satelliteNames = []
  satNameToIndex = []
  satIndexToName = []
  satelliteObjects = {}
  satelliteCatalogMap = {}

  for (let indElem = 0; indElem < numElem; indElem++) {
    let title = lines[indElem * 3].trim()

    // Check if title starts with '0 ', indicating the second TLE format
    if (title.startsWith('0 ')) {
      title = title.substring(2) // Remove the leading "0 "
    }

    if (satelliteNames.includes(title)) {
      title += `_${indElem}`
    }

    const tleLine1 = lines[indElem * 3 + 1]
    const tleLine2 = lines[indElem * 3 + 2]

    const catalogNum = extractCatalogNumber(tleLine1)
    satelliteCatalogMap[catalogNum] = title

    if (indElem === 0) {
      const epochString = tleLine1.substring(18, 32).trim()
      const year = parseInt(epochString.substring(0, 2), 10)
      const days = parseFloat(epochString.substring(2))
      const fullYear = year < 57 ? 2000 + year : 1900 + year

      firstSatelliteEpoch = new Date(Date.UTC(fullYear, 0, 1))
      firstSatelliteEpoch.setUTCDate(days)
      console.log('Epoch time of the first satellite:', firstSatelliteEpoch)
    }

    try {
      const tle = sgp4.tleFromLines([title, tleLine1, tleLine2])
      const satRec = sgp4.createTarget(tle)

      satellites.push(satRec)
      satelliteNames.push(title)
      satNameToIndex[title] = indElem
      satIndexToName.push(title)

      const osvProp = sgp4.propagateTargetTs(satRec, today, 0.0)
      const keplerParams = Kepler.osvToKepler(osvProp.r, osvProp.v, osvProp.ts)

      if (keplerParams && keplerParams.a) {
        satelliteObjects[title] = {
          name: title,
          satrec: satRec,
          osvIn: osvProp,
          osvProp: osvProp,
          kepler: keplerParams,
          r_ECEF: [0, 0, 0],
          v_ECEF: [0, 0, 0],
          alt: 0,
          lon: 0,
          lat: 0,
          color: [200, 200, 200],
        }
      } else {
        console.warn(`Kepler data missing for ${title}`)
      }
    } catch (error) {
      console.error(`Error creating target for ${title}:`, error)
    }
  }

  console.log('Satellites processed:', satelliteObjects)
  console.log(satellites)
  console.log(satelliteNames)
  displayControls.enableList.setValue(true)
}

// ===========================
// Event Handlers for Buttons
// ===========================

/**
 * Handles the "Enter" button click for processing TLE files.
 */
ListEnter.onclick = function () {
  console.log('Enter button clicked.')
  const TLEcontainer = document.getElementById('TLEListcontainer')
  TLEcontainer.style.visibility = 'hidden'

  if (tleFiles.length === 0) {
    console.error('No TLE files uploaded.')
    return
  }

  const firstFile = tleFiles[0]
  processTLEFile(firstFile.content, firstFile.name)
}

/**
 * Handles the "Cancel" button click for hiding the TLE input container.
 */
ListCancel.onclick = function () {
  const TLEcontainer = document.getElementById('TLEListcontainer')
  TLEcontainer.style.visibility = 'hidden'
  console.log('TLE input cancelled.')
}

// ==========================
// File Switching Logic
// ==========================

/**
 * Checks and switches TLE files based on the current simulation time.
 */
function checkAndSwitchFiles() {
  if (!tleFiles || tleFiles.length === 0) {
    console.warn('No TLE files available for switching.')
    return
  }

  const currentTime = today.getTime()

  console.log(`Current Time: ${currentTime}`)
  console.log(`Current File Index: ${currentFileIndex}`)
  console.log(
    `Current File Timestamp: ${
      tleFiles[currentFileIndex] ? tleFiles[currentFileIndex].timestamp : 'N/A'
    }`
  )

  // Check forward switching
  if (
    currentFileIndex < tleFiles.length - 1 &&
    currentTime >= tleFiles[currentFileIndex + 1].timestamp
  ) {
    currentFileIndex++
    const nextFile = tleFiles[currentFileIndex]
    console.log(
      `Switching to next file: ${nextFile.name} at ${new Date(
        nextFile.timestamp
      )}`
    )
    processTLEFile(nextFile.content, nextFile.name)
  }

  // Check backward switching
  if (
    currentFileIndex > 0 &&
    currentTime < tleFiles[currentFileIndex].timestamp
  ) {
    currentFileIndex--
    const prevFile = tleFiles[currentFileIndex]
    console.log(
      `Switching to previous file: ${prevFile.name} at ${new Date(
        prevFile.timestamp
      )}`
    )
    processTLEFile(prevFile.content, prevFile.name)
  }
}
