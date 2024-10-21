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
    const satIndex = satNameToIndex[satName]
    const satellite = satellites[satIndex]
    if (!satellite) {
      console.error(
        `No satellite data found for "${satName}" at index ${satIndex}`
      )
      return
    }

    // Apply color and store the satellite
    const color = satelliteColorMap[satName] || [200, 200, 200]
    highlightSatelliteNode(satName, color) // Function to highlight with the correct color
  })

  // Hide the selection dialog
  SelectContainer.style.visibility = 'hidden'
}

// Function called when Cancel button is clicked
SelectCancel.onclick = function () {
  SelectContainer.style.visibility = 'hidden'
  console.log('Satellite selection canceled.')
}

function highlightSatelliteNode(satName, color) {
  const index = satNameToIndex[satName]
  if (index === undefined) {
    console.error(`No index found for satellite: ${satName}`)
    return
  }

  const satellite = satellites[index]
  if (!satellite) {
    console.error(`No satellite found for: ${satName}`)
    return
  }

  // Update the shaders or geometry for the satellite's color
  console.log('Highllight satellite node reached\n')
}
