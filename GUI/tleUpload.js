const tleData = {
  files: [], // Store the TLE file content here
}

// Function to handle TLE file uploads
function handleTLEFileUpload(event) {
  const files = event.target.files // Get the files from the input
  Array.from(files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = function (e) {
      const content = e.target.result
      tleData.files.push(content) // Store file content
      console.log('Loaded TLE file:', file.name)
    }
    reader.readAsText(file)
  })
}

// Attach event listener to TLE file input
document
  .getElementById('TLEMultipleFileInput')
  .addEventListener('change', handleTLEFileUpload)

// Function to process the TLE data
document
  .getElementById('processTLEFilesButton')
  .addEventListener('click', function () {
    console.log('Processing TLE Files:', tleData.files)
    // Add logic to parse and use TLE data
  })
