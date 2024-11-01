// Handling of satellite selection dialog
const SelectEnter = document.getElementById('TLESelectEnter')
const SelectCancel = document.getElementById('TLESelectCancel')
const SelectContainer = document.getElementById('TLESelectcontainer')
const SelectList = document.getElementById('TLESelectlist')
const FileInput = document.getElementById('SatelliteFileInput')

// Enable multi-selection on the list
SelectList.multiple = true
SelectList.size = 10 // Show 10 satellite names at once

let satelliteColorMap = {} // Store color for each satellite
let selectedSatellites = [] // Store final selected satellites

// Function to load the satellite names and colors from the file
FileInput.onchange = function (event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const lines = e.target.result.split('\n')
      SelectList.innerHTML = '' // Clear the list before loading new entries
      satelliteColorMap = {} // Clear the satellite-color map

      lines.forEach((line) => {
        const parts = line.trim().split(',')
        if (parts.length >= 4) {
          const satName = parts[0].trim()
          const color = [
            parseInt(parts[1]),
            parseInt(parts[2]),
            parseInt(parts[3]),
          ]

          satelliteColorMap[satName] = color

          const option = document.createElement('option')
          option.value = satName
          option.text = satName
          SelectList.appendChild(option)
        }
      })
      console.log('Satellite list and colors loaded:', satelliteColorMap)
    }
    reader.readAsText(file)
  }
}

// Function to handle satellite selection on Enter button click
SelectEnter.onclick = function () {
  selectedSatellites = [] // Clear previous selection

  Array.from(SelectList.selectedOptions).forEach((option) => {
    const satName = option.value
    const satellite = satellites[satName]

    if (satellite) {
      satellite.color = satelliteColorMap[satName] || [200, 200, 200]
      selectedSatellites.push(satellite)
      console.log(`Selected Satellite: ${satName}, Color: [${satellite.color}]`)
    } else {
      console.warn(`Satellite ${satName} not found in satellites list`)
    }
  })

  SelectContainer.style.visibility = 'hidden'
  console.log('Final selected satellites list:', selectedSatellites)
}

// Cancel button to hide the selection dialog
SelectCancel.onclick = function () {
  SelectContainer.style.visibility = 'hidden'
}
