/**
 * Inter-Satellite Link (ISL) File Management and Styling
 *
 * This script handles the management of ISL data, including uploading files
 * for satellite links and their styles. Users can upload ISL files by
 * satellite name or catalog number and optionally define styles for ISL links.
 */

/**
 * Global ISL Data Object
 *
 * Stores ISL links and styles with default settings.
 */
const islData = {
  links: [], // Store links in a unified format as objects { satellite1, satellite2 }
  style: { color: [255, 255, 255], style: 'solid', width: 10 }, // Default link style
}

/**
 * Function to handle ISL file upload by Satellite Name.
 *
 * Reads and processes an ISL file that specifies links by satellite names.
 *
 * @param {Event} event - The file input change event.
 */
function handleISLFileUploadByName(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseISLFile(content, 'name') // Indicate the parsing type (by name)
      console.log('Parsed ISL Links by Name:', islData.links)
    }
    reader.readAsText(file)
  }
}

/**
 * Function to handle ISL file upload by Catalog Number.
 *
 * Reads and processes an ISL file that specifies links by satellite catalog numbers.
 *
 * @param {Event} event - The file input change event.
 */
function handleISLFileUploadByCatalog(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseISLFile(content, 'catalog') // Indicate the parsing type (by catalog)
      console.log('Parsed ISL Links by Catalog Number:', islData.links)
    }
    reader.readAsText(file)
  }
}

/**
 * Function to parse ISL files.
 *
 * Processes ISL files and resolves links using either satellite names or catalog numbers.
 *
 * @param {string} content - File content as a string.
 * @param {string} type - The parsing type ('name' or 'catalog').
 */
function parseISLFile(content, type) {
  const lines = content.split('\n')
  islData.links = lines
    .map((line) => {
      const [item1, item2] = line.split(',').map((item) => item.trim())

      if (type === 'catalog') {
        // Resolve catalog numbers to satellite names
        const satellite1 = satelliteCatalogMap[item1]
        const satellite2 = satelliteCatalogMap[item2]

        if (!satellite1 || !satellite2) {
          console.warn(`Catalog number not found: ${item1} or ${item2}`)
          return null // Skip invalid links
        }

        return { satellite1, satellite2 } // Use satellite names
      } else if (type === 'name') {
        // Directly use satellite names
        return { satellite1: item1, satellite2: item2 }
      }
    })
    .filter((link) => link !== null) // Remove invalid links
}

/**
 * Function to handle ISL style file upload.
 *
 * Reads and processes a style file to define ISL link styles.
 *
 * @param {Event} event - The file input change event.
 */
function handleISLStyleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseISLStyleFile(content)
      console.log('Parsed ISL Style:', islData.style)
    }
    reader.readAsText(file)
  } else {
    console.log(
      'No ISL Style File uploaded, using default style:',
      islData.style
    )
  }
}

/**
 * Function to parse ISL style files.
 *
 * Extracts style data (color, line style, width) from a given style file.
 *
 * @param {string} content - File content as a string.
 */
function parseISLStyleFile(content) {
  const lines = content.split('\n').filter((line) => line.trim() !== '') // Ignore empty lines
  if (lines.length > 0) {
    const [r, g, b, style, width] = lines[0]
      .split(',')
      .map((value) => value.trim())
    const rgbValues = [parseInt(r), parseInt(g), parseInt(b)]

    islData.style.color = rgbValues.every(
      (num) => !isNaN(num) && num >= 0 && num <= 255
    )
      ? rgbValues
      : islData.style.color

    islData.style.style = style || islData.style.style
    islData.style.width =
      width && !isNaN(parseFloat(width))
        ? parseFloat(width)
        : islData.style.width
  }
}

/**
 * Event Listeners for File Input Elements
 *
 * Resets input values on click and triggers appropriate upload handlers on change.
 */

// Event listeners for Satellite Name input
const ISLFileInputByName = document.getElementById('ISLFileInputByName')
ISLFileInputByName.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLFileInputByName.addEventListener('change', handleISLFileUploadByName)

// Event listeners for Catalog Number input
const ISLFileInputByCatalog = document.getElementById('ISLFileInputByCatalog')
ISLFileInputByCatalog.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLFileInputByCatalog.addEventListener('change', handleISLFileUploadByCatalog)

// Event listener for ISL Style input
const ISLStyleFileInputByName = document.getElementById(
  'ISLStyleFileInputByName'
)
ISLStyleFileInputByName.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLStyleFileInputByName.addEventListener('change', handleISLStyleFileUpload)
