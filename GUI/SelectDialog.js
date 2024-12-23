// Handling of satellite selection dialog
const SelectEnter = document.getElementById('TLESelectEnter')
const SelectCancel = document.getElementById('TLESelectCancel')
const SelectContainer = document.getElementById('TLESelectcontainer')
const SelectList = document.getElementById('TLESelectlist')
const FileInputByName = document.getElementById('SatelliteFileInputByName')
const FileInputByCatalog = document.getElementById(
  'SatelliteFileInputByCatalog'
)

// Enable multi-selection on the list
SelectList.multiple = true
SelectList.size = 10 // Show 10 satellites at once

let satelliteColorMap = {} // Store color for each satellite

// Function to load the satellite names and colors from a file
FileInputByName.onchange = function (event) {
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
          option.text = satName // Only the name for clarity
          SelectList.appendChild(option)
        } else {
          console.warn(`Invalid line format: ${line}`)
        }
      })

      console.log(
        'Satellite list and colors loaded by name:',
        satelliteColorMap
      )
    }
    reader.readAsText(file)
  } else {
    console.error('No file selected.')
  }
}

// Function to load the satellite catalog numbers and colors from a file
FileInputByCatalog.onchange = function (event) {
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
          const catalogNum = parts[0].trim()
          const color = [
            parseInt(parts[1]),
            parseInt(parts[2]),
            parseInt(parts[3]),
          ]

          // Map catalog number to satellite name using satelliteCatalogMap
          const satName = satelliteCatalogMap[catalogNum]

          if (satName) {
            satelliteColorMap[satName] = color

            const option = document.createElement('option')
            option.value = satName
            option.text = `${satName} (Catalog: ${catalogNum})` // Name and catalog for clarity
            SelectList.appendChild(option)
          } else {
            console.warn(
              `Catalog number ${catalogNum} not found in satelliteCatalogMap`
            )
          }
        } else {
          console.warn(`Invalid line format: ${line}`)
        }
      })

      console.log(
        'Satellite list and colors loaded by catalog:',
        satelliteColorMap
      )
    }
    reader.readAsText(file)
  } else {
    console.error('No file selected.')
  }
}

// Function to handle satellite selection on Enter button click
SelectEnter.onclick = function () {
  selectedSatellites = [] // Clear previous selection

  Array.from(SelectList.selectedOptions).forEach((option) => {
    const satName = option.value
    const satellite = satelliteObjects[satName]

    if (satellite) {
      satellite.color = satelliteColorMap[satName] || [200, 200, 200]
      selectedSatellites.push(satellite)
      console.log(`Selected Satellite: ${satName}, Color: [${satellite.color}]`)
    } else {
      console.warn(`Satellite ${satName} not found in satelliteObjects`)
    }
  })

  SelectContainer.style.visibility = 'hidden'
  console.log('Final selected satellites list:', selectedSatellites)
}

// Cancel button to hide the selection dialog
SelectCancel.onclick = function () {
  SelectContainer.style.visibility = 'hidden'
}
