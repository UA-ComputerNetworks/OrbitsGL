// Object to store ISL data and styles with default settings
const islData = {
  links: [], // Store links in a unified format
  style: { color: [255, 255, 255], style: 'solid', width: 10 }, // Default style as an RGB array
}

// Function to handle ISL file upload by satellite name
function handleISLFileUploadByName(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseISLFile(content, 'name') // Indicate it's by satellite name
      console.log('Parsed ISL Links by Name:', islData.links)
    }
    reader.readAsText(file)
  }
}

// Function to handle ISL file upload by catalog number
function handleISLFileUploadByCatalog(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseISLFile(content, 'catalog') // Indicate it's by catalog number
      console.log('Parsed ISL Links by Catalog Number:', islData.links)
    }
    reader.readAsText(file)
  }
}

// Function to parse ISL file and resolve links by name or catalog number
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

// Function to handle ISL style file upload
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

// Parse ISL style file containing default style information
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

// Event listeners for file input elements
const ISLFileInputByName = document.getElementById('ISLFileInputByName')
const ISLFileInputByCatalog = document.getElementById('ISLFileInputByCatalog')
const ISLStyleFileInputByName = document.getElementById(
  'ISLStyleFileInputByName'
)

// Event listeners for Satellite Name input
ISLFileInputByName.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLFileInputByName.addEventListener('change', handleISLFileUploadByName)

// Event listeners for Catalog Number input
ISLFileInputByCatalog.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLFileInputByCatalog.addEventListener('change', handleISLFileUploadByCatalog)

// Event listener for ISL Style input
ISLStyleFileInputByName.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLStyleFileInputByName.addEventListener('change', handleISLStyleFileUpload)
