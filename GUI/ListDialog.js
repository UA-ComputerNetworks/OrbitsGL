// Get references to the buttons and input fields from the DOM
const ListEnter = document.getElementById('TLEListEnter') // Enter button for processing TLE input
const ListCancel = document.getElementById('TLEListCancel') // Cancel button to hide the TLE input form
const TLEinput = document.getElementById('TLEListinput') // Text area for manually entering TLE data
const TLEFileInput = document.getElementById('TLEFileInput') // File input element for uploading TLE files

// Debug logs to confirm that the DOM elements are properly referenced
console.log('TLE Enter button:', ListEnter)
console.log('TLE Cancel button:', ListCancel)
console.log('TLE input area:', TLEinput)
console.log('TLE file input:', TLEFileInput)

// Function to handle the reading of a TLE file when uploaded
TLEFileInput.onchange = function (event) {
  const file = event.target.files[0] // Get the first file (should be a TLE file)
  if (file) {
    const reader = new FileReader() // Create a new file reader to read the file
    reader.onload = function (e) {
      console.log('File loaded successfully.')
      TLEinput.value = e.target.result // Load the content of the file into the text area for display
    }
    reader.onerror = function (e) {
      console.error('Error reading file:', e) // Log an error if file reading fails
    }
    reader.readAsText(file) // Read the file as text (TLE data is plain text)
  } else {
    console.log('No file selected.') // Log a message if no file was selected
  }
}

// Function to handle what happens when the Enter button is clicked
ListEnter.onclick = function () {
  console.log('Enter button clicked.')

  // Get the container and select list elements for displaying satellite names
  const TLEcontainer = document.getElementById('TLEListcontainer')
  const TLEselectList = document.getElementById('TLESelectlist')
  console.log('TLE Container:', TLEcontainer)
  console.log('TLE Select List:', TLEselectList)

  // Hide the container once the TLE is submitted (UI logic)
  TLEcontainer.style.visibility = 'hidden'

  const tleIn = TLEinput.value // Get the value (TLE data) from the text area
  if (!tleIn) {
    console.error('No TLE input provided.') // If no input, log an error
    return
  }

  // Split the TLE data into lines
  const lines = tleIn.split('\n')
  const numElem = (lines.length + 1) / 3 // Calculate the number of TLE records

  console.log('Processing TLE data...')
  console.log('TLE input value:', tleIn)
  console.log('Number of lines:', lines.length)
  console.log('Number of elements (calculated):', Math.floor(numElem)) // Log the number of TLEs

  // Initialize arrays to store satellite data
  satellites = []
  satelliteNames = []
  satNameToIndex = []
  satIndexToName = []
  let innerHTML = '' // HTML for populating the select list

  // Clear the autocomplete target list (for search functionality)
  autoCompleteTargetList.length = 0

  // Loop over the number of TLE elements
  for (let indElem = 0; indElem < Math.floor(numElem); indElem++) {
    let title = lines[indElem * 3].trim() // Get the satellite name (1st line of the TLE)

    // Ensure that satellite names are unique by adding an index if necessary
    if (satelliteNames.includes(title)) {
      title = title + '_' + indElem
    }

    // Get the two TLE lines (orbital parameters)
    const tleLine1 = lines[indElem * 3 + 1]
    const tleLine2 = lines[indElem * 3 + 2]

    console.log(`TLE Element ${indElem}:`, title, tleLine1, tleLine2)

    try {
      // Parse the TLE into an object usable by the SGP4 propagation library
      const tle = sgp4.tleFromLines([
        lines[indElem * 3],
        lines[indElem * 3 + 1],
        lines[indElem * 3 + 2],
      ])
      // Create an SGP4 object that will track the satellite's position
      const satrec = sgp4.createTarget(tle)

      satellites.push(satrec) // Store the satellite object
      satLines.push([title, tleLine1, tleLine2]) // Store the TLE lines
      satelliteNames.push(title) // Store the satellite name
      autoCompleteTargetList.push(title) // Add satellite name to the autocomplete list
      satNameToIndex[title] = indElem // Map satellite name to its index
      satIndexToName.push(title) // Map index to satellite name
    } catch (error) {
      console.error('Error creating target from TLE:', error) // Log any parsing errors
    }
  }

  // Sort satellite names alphabetically
  console.log('Satellite names before sorting:', satelliteNames)
  satelliteNames.sort()
  console.log('Satellite names after sorting:', satelliteNames)

  // Generate the HTML options for the select list
  for (let indName = 0; indName < satelliteNames.length; indName++) {
    const satName = satelliteNames[indName]
    innerHTML += '<option value="' + satName + '">' + satName + '</option>'
  }

  // Update the autocomplete list with satellite names
  autoCompleteJS.data.src = satelliteNames

  // Clear the text area to improve performance
  TLEinput.value = ''

  // Populate the select list with the satellite names
  TLEselectList.innerHTML = innerHTML
  displayControls.enableList.setValue(true) // Enable the satellite list display

  console.log('TLE Select List updated.')
}

// Cancel button logic to hide the TLE input form
ListCancel.onclick = function () {
  const TLEcontainer = document.getElementById('TLEListcontainer')
  TLEcontainer.style.visibility = 'hidden'
  console.log('TLE input cancelled.')
}
