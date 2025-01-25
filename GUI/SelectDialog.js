// File input elements for Name and Catalog
const FileInputByName = document.getElementById('SelectTLEFileInputByName')
const FileInputByCatalog = document.getElementById(
  'SelectTLEFileInputByCatalog'
)

// Map to store satellite colors
let satelliteColorMap = {}

// Function to load satellite data by Name
FileInputByName.onchange = function (event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const lines = e.target.result.split('\n')
      satelliteColorMap = {} // Clear the color map

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

          console.log(`Loaded Satellite Name: ${satName}, Color: ${color}`)
        } else if (line.trim() !== '') {
          console.warn(`Invalid line format: ${line}`)
        }
      })

      console.log(
        'Satellite list and colors loaded by Name:',
        satelliteColorMap
      )

      // Trigger satellite processing
      processSatelliteSelection()
    }
    reader.readAsText(file)
  } else {
    console.error('No file selected for Satellite Names.')
  }
}

// Function to load satellite data by Catalog
FileInputByCatalog.onchange = function (event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const lines = e.target.result.split('\n')
      satelliteColorMap = {} // Clear the color map

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

            console.log(
              `Loaded Satellite from Catalog: ${satName} (Catalog: ${catalogNum}), Color: ${color}`
            )
          } else {
            console.warn(
              `Catalog number ${catalogNum} not found in satelliteCatalogMap`
            )
          }
        } else if (line.trim() !== '') {
          console.warn(`Invalid line format: ${line}`)
        }
      })

      console.log(
        'Satellite list and colors loaded by Catalog:',
        satelliteColorMap
      )

      // Trigger satellite processing
      processSatelliteSelection()
    }
    reader.readAsText(file)
  } else {
    console.error('No file selected for Satellite Catalog.')
  }
}

// Function to process the selected satellites
function processSatelliteSelection() {
  selectedSatellites = [] // Clear previous selection

  Object.keys(satelliteColorMap).forEach((satName) => {
    const satellite = satelliteObjects[satName]

    if (satellite) {
      satellite.color = satelliteColorMap[satName] || [200, 200, 200] // Apply color
      selectedSatellites.push(satellite) // Add to selected satellites

      console.log(`Selected Satellite: ${satName}, Color: ${satellite.color}`)
    } else {
      console.warn(`Satellite ${satName} not found in satelliteObjects`)
    }
  })

  console.log('Final selected satellites list:', selectedSatellites)
}
