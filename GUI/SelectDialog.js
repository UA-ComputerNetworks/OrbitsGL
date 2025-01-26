/**
 * Satellite Selection and Color Processing
 *
 * This code handles the selection and processing of satellite data based on
 * uploaded files. Users can upload files by Satellite Name or Catalog Number,
 * and the corresponding satellites are processed with their respective colors.
 */

/**
 * Global Variables
 */

// File input elements for selecting TLE data
const FileInputByName = document.getElementById('SelectTLEFileInputByName') // Input for satellite name files
const FileInputByCatalog = document.getElementById(
  'SelectTLEFileInputByCatalog'
) // Input for satellite catalog files

// Map to store satellite colors based on their names or catalog numbers
let satelliteColorMap = {}

/**
 * Function to load satellite data by Name.
 *
 * Reads the uploaded file, extracts satellite names and their respective colors,
 * and stores them in the `satelliteColorMap`.
 *
 * @param {Event} event - The file input change event.
 */
FileInputByName.onchange = function (event) {
  const file = event.target.files[0] // Get the uploaded file
  if (file) {
    const reader = new FileReader() // Initialize file reader
    reader.onload = function (e) {
      const lines = e.target.result.split('\n') // Split file content by lines
      satelliteColorMap = {} // Clear the color map for new data

      lines.forEach((line) => {
        const parts = line.trim().split(',') // Split line by commas
        if (parts.length >= 4) {
          const satName = parts[0].trim() // Satellite name
          const color = [
            parseInt(parts[1]), // Red value
            parseInt(parts[2]), // Green value
            parseInt(parts[3]), // Blue value
          ]

          satelliteColorMap[satName] = color // Map satellite name to color

          console.log(`Loaded Satellite Name: ${satName}, Color: ${color}`)
        } else if (line.trim() !== '') {
          console.warn(`Invalid line format: ${line}`) // Log invalid lines
        }
      })

      console.log(
        'Satellite list and colors loaded by Name:',
        satelliteColorMap
      )

      // Trigger satellite processing
      processSatelliteSelection()
    }
    reader.readAsText(file) // Read file content
  } else {
    console.error('No file selected for Satellite Names.')
  }
}

/**
 * Function to load satellite data by Catalog Number.
 *
 * Reads the uploaded file, extracts catalog numbers, maps them to satellite names
 * using `satelliteCatalogMap`, and stores the corresponding colors.
 *
 * @param {Event} event - The file input change event.
 */
FileInputByCatalog.onchange = function (event) {
  const file = event.target.files[0] // Get the uploaded file
  if (file) {
    const reader = new FileReader() // Initialize file reader
    reader.onload = function (e) {
      const lines = e.target.result.split('\n') // Split file content by lines
      satelliteColorMap = {} // Clear the color map for new data

      lines.forEach((line) => {
        const parts = line.trim().split(',') // Split line by commas
        if (parts.length >= 4) {
          const catalogNum = parts[0].trim() // Catalog number
          const color = [
            parseInt(parts[1]), // Red value
            parseInt(parts[2]), // Green value
            parseInt(parts[3]), // Blue value
          ]

          // Map catalog number to satellite name using satelliteCatalogMap
          const satName = satelliteCatalogMap[catalogNum]

          if (satName) {
            satelliteColorMap[satName] = color // Map satellite name to color

            console.log(
              `Loaded Satellite from Catalog: ${satName} (Catalog: ${catalogNum}), Color: ${color}`
            )
          } else {
            console.warn(
              `Catalog number ${catalogNum} not found in satelliteCatalogMap`
            )
          }
        } else if (line.trim() !== '') {
          console.warn(`Invalid line format: ${line}`) // Log invalid lines
        }
      })

      console.log(
        'Satellite list and colors loaded by Catalog:',
        satelliteColorMap
      )

      // Trigger satellite processing
      processSatelliteSelection()
    }
    reader.readAsText(file) // Read file content
  } else {
    console.error('No file selected for Satellite Catalog.')
  }
}

/**
 * Function to process the selected satellites.
 *
 * Matches satellites in `satelliteObjects` with those in `satelliteColorMap`,
 * applies their colors, and updates the `selectedSatellites` array.
 */
function processSatelliteSelection() {
  selectedSatellites = [] // Clear previous selection

  // Iterate through all satellites in the color map
  Object.keys(satelliteColorMap).forEach((satName) => {
    const satellite = satelliteObjects[satName] // Get satellite object

    if (satellite) {
      satellite.color = satelliteColorMap[satName] || [200, 200, 200] // Apply color or default
      selectedSatellites.push(satellite) // Add to selected satellites

      console.log(`Selected Satellite: ${satName}, Color: ${satellite.color}`)
    } else {
      console.warn(`Satellite ${satName} not found in satelliteObjects`)
    }
  })

  console.log('Final selected satellites list:', selectedSatellites)
}
