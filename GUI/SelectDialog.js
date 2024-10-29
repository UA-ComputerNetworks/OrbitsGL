// Handling of TLE input dialog with file-based satellite name and color loading
const SelectEnter = document.getElementById('TLESelectEnter') // Button to confirm satellite selection
const SelectCancel = document.getElementById('TLESelectCancel') // Button to cancel selection
const SelectContainer = document.getElementById('TLESelectcontainer') // The container for the select dialog
const SelectList = document.getElementById('TLESelectlist') // The select list to allow satellite selection
const FileInput = document.getElementById('SatelliteFileInput') // File input to load satellite names and colors

// Enable multi-selection on the list
SelectList.multiple = true
SelectList.size = 10 // Show 10 satellite names at once

// Store the selected satellites and their colors
let selectedSatellites = [] // Array to store selected satellite objects
let satelliteColorMap = {} // Store color for each satellite

// Function to load the satellite names and colors from the file
FileInput.onchange = function (event) {
  const file = event.target.files[0] // Get the uploaded file
  if (file) {
    const reader = new FileReader() // Create a file reader to read the file
    reader.onload = function (e) {
      const lines = e.target.result.split('\n') // Read the file line by line
      SelectList.innerHTML = '' // Clear the list before loading new entries
      satelliteColorMap = {} // Clear the satellite-color map

      lines.forEach((line) => {
        const parts = line.trim().split(',') // Split line by commas
        if (parts.length >= 4) {
          const satName = parts[0].trim() // First part is the satellite name
          const color = [
            parseInt(parts[1]),
            parseInt(parts[2]),
            parseInt(parts[3]),
          ] // RGB values

          satelliteColorMap[satName] = color // Map satellite to its color

          // Add satellite to the select list
          const option = document.createElement('option')
          option.value = satName
          option.text = satName
          SelectList.appendChild(option)
        }
      })
      console.log('Satellite list and colors loaded:', satelliteColorMap)
    }
    reader.onerror = function (e) {
      console.error('Error reading file:', e)
    }
    reader.readAsText(file) // Read the file as text
  } else {
    console.log('No file selected.')
  }
}

SelectEnter.onclick = function () {
  selectedSatellites = Array.from(SelectList.selectedOptions).map(
    (option) => option.value
  )

  selectedSatellites.forEach((satName) => {
    const satIndex = satNameToIndex[satName] // Map name to TLE list
    const satellite = createSatelliteObject() // Initialize satellite object
    satellite.name = satName // Set the satellite's name

    const tleData = tleList[satIndex] // Get TLE data
    const { tleLine1, tleLine2 } = tleData // Extract TLE lines

    // Update `osvIn` with the initial telemetry based on TLE
    satellite.osvIn = sgp4.propagateFromTLE(tleLine1, tleLine2, today)

    // Now propagate this to get `osvProp` for the current time
    satellite.osvProp = sgp4.propagateFromTLE(tleLine1, tleLine2, today)

    // Compute Keplerian elements from `osvProp`
    satellite.kepler = Kepler.osvToKepler(
      satellite.osvProp.r,
      satellite.osvProp.v,
      satellite.osvProp.ts
    )

    console.log(`Satellite ${satIndex}: ${satName} OSV:`, satellite.osvProp)

    satellites[satIndex] = satellite // Store the satellite in the main array
    selectedSatellites.push({
      sat: satellite,
      color: satelliteColorMap[satName] || [200, 200, 200], // Assign color
    })
  })

  // Hide the selection dialog
  SelectContainer.style.visibility = 'hidden'
}

// Function called when Cancel button is clicked
SelectCancel.onclick = function () {
  SelectContainer.style.visibility = 'hidden'
  console.log('Satellite selection canceled.')
}

// Function to create a new satellite object with the required properties
function createSatelliteObject() {
  return {
    name: '', // Will be assigned when creating the satellite object
    osvIn: { r: [0.0, 0.0, 0.0], v: [0.0, 0.0, 0.0], ts: null }, // Input (raw) telemetry data
    osvProp: { r: [0.0, 0.0, 0.0], v: [0.0, 0.0, 0.0], ts: null }, // Propagated (calculated) telemetry
    kepler: { a: 0 }, // Orbital parameters (e.g., semi-major axis 'a')
    r_ECEF: [0, 0, 0], // Position in Earth-Centered Earth-Fixed coordinates
    v_ECEF: [0, 0, 0], // Velocity in ECEF coordinates
    alt: 0, // Altitude
    lon: 0, // Longitude
    lat: 0, // Latitude
  }
}
