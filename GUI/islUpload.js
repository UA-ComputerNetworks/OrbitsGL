// // Object to store ISL data and styles with default settings
// const islData = {
//   links: [],
//   style: { color: [255, 255, 255], style: 'solid', width: 10 }, // Default style as an RGB array
// }

// // Function to handle ISL file upload
// function handleISLFileUpload(event) {
//   const file = event.target.files[0]
//   if (file) {
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       const content = e.target.result
//       parseISLFile(content)
//       console.log('Parsed ISL Links:', islData.links)
//     }
//     reader.readAsText(file)
//   }
// }

// // Function to handle ISL style file upload
// function handleISLStyleFileUpload(event) {
//   const file = event.target.files[0]
//   if (file) {
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       const content = e.target.result
//       parseISLStyleFile(content)
//       console.log('Parsed ISL Style:', islData.style)
//     }
//     reader.readAsText(file)
//   } else {
//     console.log(
//       'No ISL Style File uploaded, using default style:',
//       islData.style
//     )
//   }
// }

// // Parse ISL file containing satellite link information
// function parseISLFile(content) {
//   const lines = content.split('\n')
//   islData.links = lines
//     .map((line) => {
//       const [satellite1, satellite2] = line.split(',')
//       return { satellite1: satellite1.trim(), satellite2: satellite2.trim() }
//     })
//     .filter((link) => link.satellite1 && link.satellite2) // Filter out empty lines
// }

// // Parse ISL style file containing only default style information
// function parseISLStyleFile(content) {
//   const lines = content.split('\n').filter((line) => line.trim() !== '') // Ignore empty lines
//   if (lines.length > 0) {
//     // Assume we split into five parts: R, G, B, style, and width
//     const [r, g, b, style, width] = lines[0]
//       .split(',')
//       .map((value) => value.trim()) // Trim each part

//     // Parse RGB values as integers
//     const rgbValues = [parseInt(r), parseInt(g), parseInt(b)]
//     console.log('Parsed RGB values:', rgbValues) // Debugging log for RGB values

//     // Validate and set color
//     islData.style.color = rgbValues.every(
//       (num) => !isNaN(num) && num >= 0 && num <= 255
//     )
//       ? rgbValues
//       : islData.style.color // Use default if invalid

//     // Set style and width with validation
//     islData.style.style = style || islData.style.style // Use file or default style
//     islData.style.width =
//       width && !isNaN(parseFloat(width))
//         ? parseFloat(width)
//         : islData.style.width // Use file or default width
//   }
// }

// // Event listeners for file input elements with reset for each click
// const ISLFileInput = document.getElementById('ISLFileInput')
// const ISLStyleFileInput = document.getElementById('ISLStyleFileInput')

// ISLFileInput.addEventListener('click', (event) => {
//   event.target.value = '' // Reset the input value
// })
// ISLFileInput.addEventListener('change', handleISLFileUpload)

// ISLStyleFileInput.addEventListener('click', (event) => {
//   event.target.value = '' // Reset the input value
// })
// ISLStyleFileInput.addEventListener('change', handleISLStyleFileUpload)

// Old code

// Object to store ISL data and styles with default settings
const islData = {
  links: [],
  style: { color: [255, 255, 255], style: 'solid', width: 10 }, // Default style as an RGB array
}

// Function to handle ISL file upload
function handleISLFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      parseISLFile(content)
      console.log('Parsed ISL Links:', islData.links)
    }
    reader.readAsText(file)
  }
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

function parseISLFile(content) {
  const lines = content.split('\n')
  islData.links = lines
    .map((line) => {
      const [catalogNum1, catalogNum2] = line
        .split(',')
        .map((num) => num.trim())

      const satellite1 = satelliteCatalogMap[catalogNum1]
      const satellite2 = satelliteCatalogMap[catalogNum2]

      if (!satellite1 || !satellite2) {
        console.warn(
          `Catalog number not found: ${catalogNum1} or ${catalogNum2}`
        )
        return null // Skip invalid links
      }

      return { satellite1, satellite2 } // Use satellite names
    })
    .filter((link) => link !== null) // Remove invalid links

  console.log('Parsed ISL Links with Names:', islData.links)
}

// Parse ISL style file containing only default style information
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

// Event listeners for file input elements with reset for each click
const ISLFileInput = document.getElementById('ISLFileInput')
const ISLStyleFileInput = document.getElementById('ISLStyleFileInput')

ISLFileInput.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLFileInput.addEventListener('change', handleISLFileUpload)

ISLStyleFileInput.addEventListener('click', (event) => {
  event.target.value = '' // Reset the input value
})
ISLStyleFileInput.addEventListener('change', handleISLStyleFileUpload)
