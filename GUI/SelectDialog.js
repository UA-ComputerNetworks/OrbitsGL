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
let selectedSatellites = []
let satelliteColorMap = {}

// Function to load the satellite names and colors from the file
FileInput.onchange = function (event) {
  const file = event.target.files[0] // Get the uploaded file
  if (file) {
    const reader = new FileReader() // Create a file reader to read the file
    reader.onload = function (e) {
      const lines = e.target.result.split('\n') // Read the file line by line
      SelectList.innerHTML = '' // Clear the list before loading new entries
      satelliteColorMap = {} // Clear the satellite-color map

      console.log('Reading satellite file...')
      lines.forEach((line) => {
        const parts = line.trim().split(' ') // Split line by space
        if (parts.length >= 4) {
          const satName = parts[0] // First part is the satellite name
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
      console.log('Satellite list and colors loaded:', satelliteColorMap) // Log satellite-color map
    }
    reader.onerror = function (e) {
      console.error('Error reading file:', e) // Log file read error
    }
    reader.readAsText(file) // Read the file as text
  } else {
    console.log('No file selected.') // Log when no file is selected
  }
}

// Function called when Enter button is clicked
SelectEnter.onclick = function () {
  if (satellites.length > 0) {
    console.log('Multi-selection of satellites')

    // Get selected satellite names
    selectedSatellites = Array.from(SelectList.selectedOptions).map(
      (option) => option.value
    )

    selectedSatellites.forEach((targetName) => {
      console.log('Selected satellite:', targetName)

      const satIndex = satNameToIndex[targetName] // Get index of the satellite
      const lines = satLines[satIndex] // Get the TLE lines for this satellite
      const satellite = satellites[satIndex] // Get the satellite object

      // Set the selected satellite and update TLE controls
      osvControls.targetName.setValue(targetName)
      satrec = satellite
      osvControls.source.setValue('TLE')

      // Update TLE controls based on the satellite's TLE lines
      updateTLEControls(targetName, lines[1], lines[2])

      // Apply color and size based on the input file
      const color = satelliteColorMap[targetName] || [200, 200, 200] // Default to grey
      highlightSatellite(targetName, color) // Highlight satellite with given color
    })
  }

  // Hide the container after selection
  SelectContainer.style.visibility = 'hidden'
}

// Function to highlight the selected satellite in the rendering system
function highlightSatellite(targetName, color) {
  // Logic to highlight satellite in visualization (for example, by changing its color and size)
  // This would interact with the rendering system (e.g., Orbits.js) to modify the satellite's appearance
  console.log(`Highlighting satellite: ${targetName} with color: ${color}`)
  // Example: Modify the satellite node size and color using Orbits.js rendering
  // drawSatelliteNode(targetName, size, color);  // Adjust this function based on your rendering system
}

// Function called when Cancel button is clicked
SelectCancel.onclick = function () {
  SelectContainer.style.visibility = 'hidden'
  console.log('Satellite selection canceled.')
}
