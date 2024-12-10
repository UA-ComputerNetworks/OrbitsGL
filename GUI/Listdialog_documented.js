/**
 * ListDialog.js
 *
 * Description:
 * This file handles the processing of TLE (Two-Line Element) data input from users, either through manual input or by uploading a file.
 * It provides functionality for handling satellite data, parsing TLE lines, and creating the appropriate satellite tracking objects using the SGP4 model.
 *
 * Key Features:
 * - Users can enter TLE data manually or upload a file containing TLE data.
 * - Parses the TLE data to create satellite tracking objects.
 * - Updates a list of satellite names and links them to their respective satellite objects.
 * - Provides search/autocomplete functionality based on the entered satellite names.
 *
 * Usage:
 * Include this file in a web application that requires the user to enter or upload satellite TLE data for tracking.
 * The TLE data is processed, and the resulting satellite information is displayed in a dropdown list.
 *
 * Dependencies:
 * - The `sgp4` library is used to create satellite tracking objects based on the parsed TLE data.
 * - The file references elements from the HTML DOM, such as buttons and input fields, and uses them to display or hide content.
 *
 * File Breakdown:
 * 1. DOM Elements: References to buttons, input fields, and containers in the HTML.
 * 2. File Reading: Handles file input for reading TLE files.
 * 3. TLE Processing: Processes manually entered or file-uploaded TLE data and creates satellite objects.
 * 4. Satellite List: Populates a dropdown list of satellite names for selection.
 * 5. Autocomplete: Adds satellite names to an autocomplete list for search functionality.
 */

// DOM Element references for buttons, input fields, and containers
const ListEnter = document.getElementById('TLEListEnter') // Button to process the entered TLE data
const ListCancel = document.getElementById('TLEListCancel') // Button to cancel and hide the TLE input form
const TLEinput = document.getElementById('TLEListinput') // Text area for entering TLE data manually
const TLEFileInput = document.getElementById('TLEFileInput') // Input element for uploading a TLE file

// Debugging logs to ensure that the DOM elements are properly referenced
console.log('TLE Enter button:', ListEnter)
console.log('TLE Cancel button:', ListCancel)
console.log('TLE input area:', TLEinput)
console.log('TLE file input:', TLEFileInput)

/**
 * Event handler for when a TLE file is uploaded.
 *
 * This function reads the uploaded file and displays its content in the TLE input text area.
 * It uses the FileReader API to read the file as text.
 *
 * @param {Event} event - The file input change event when a file is uploaded.
 */
TLEFileInput.onchange = function (event) {
  const file = event.target.files[0] // Get the first file from the input
  if (file) {
    const reader = new FileReader() // Create a FileReader to read the file
    reader.onload = function (e) {
      console.log('File loaded successfully.')
      TLEinput.value = e.target.result // Display the file content in the TLE input text area
    }
    reader.onerror = function (e) {
      console.error('Error reading file:', e) // Log any errors during file reading
    }
    reader.readAsText(file) // Read the file as text (TLE data is plain text)
  } else {
    console.log('No file selected.') // Log a message if no file was selected
  }
}

/**
 * Event handler for when the Enter button is clicked.
 *
 * This function processes the TLE data entered in the text area or uploaded via a file.
 * It parses the TLE data, creates satellite tracking objects using the SGP4 model, and updates
 * the list of satellite names displayed in a dropdown select list.
 */
ListEnter.onclick = function () {
  console.log('Enter button clicked.')

  // Get references to the container and select list for displaying satellite names
  const TLEcontainer = document.getElementById('TLEListcontainer')
  const TLEselectList = document.getElementById('TLESelectlist')
  console.log('TLE Container:', TLEcontainer)
  console.log('TLE Select List:', TLEselectList)

  // Hide the container once the TLE is submitted (UI logic)
  TLEcontainer.style.visibility = 'hidden'

  const tleIn = TLEinput.value // Get the TLE data from the text area
  if (!tleIn) {
    console.error('No TLE input provided.') // Log an error if no input was provided
    return
  }

  // Split the TLE data into lines for processing
  const lines = tleIn.split('\n')
  const numElem = (lines.length + 1) / 3 // Calculate the number of TLE records (3 lines per satellite)

  console.log('Processing TLE data...')
  console.log('TLE input value:', tleIn)
  console.log('Number of lines:', lines.length)
  console.log('Number of elements (calculated):', Math.floor(numElem)) // Log the calculated number of TLE elements

  // Initialize arrays to store satellite data
  satellites = []
  satelliteNames = []
  satNameToIndex = []
  satIndexToName = []
  let innerHTML = '' // HTML to populate the select list

  // Clear the autocomplete target list (for search functionality)
  autoCompleteTargetList.length = 0

  // Loop over the number of TLE elements and process each satellite
  for (let indElem = 0; indElem < Math.floor(numElem); indElem++) {
    let title = lines[indElem * 3].trim() // Get the satellite name (1st line of the TLE)

    // Ensure that satellite names are unique by appending an index if necessary
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
      // Create an SGP4 object to track the satellite's position
      const satrec = sgp4.createTarget(tle)

      satellites.push(satrec) // Store the satellite object
      satLines.push([title, tleLine1, tleLine2]) // Store the TLE lines for future reference
      satelliteNames.push(title) // Store the satellite name
      autoCompleteTargetList.push(title) // Add the satellite name to the autocomplete list
      satNameToIndex[title] = indElem // Map the satellite name to its index
      satIndexToName.push(title) // Map the index to the satellite name
    } catch (error) {
      console.error('Error creating target from TLE:', error) // Log any parsing errors
    }
  }

  // Sort satellite names alphabetically for display
  console.log('Satellite names before sorting:', satelliteNames)
  satelliteNames.sort()
  console.log('Satellite names after sorting:', satelliteNames)

  // Generate HTML options for the dropdown select list
  for (let indName = 0; indName < satelliteNames.length; indName++) {
    const satName = satelliteNames[indName]
    innerHTML += '<option value="' + satName + '">' + satName + '</option>'
  }

  // Update the autocomplete list with the satellite names
  autoCompleteJS.data.src = satelliteNames

  // Clear the text area to improve performance
  TLEinput.value = ''

  // Populate the select list with the satellite names
  TLEselectList.innerHTML = innerHTML
  displayControls.enableList.setValue(true) // Enable the satellite list display

  console.log('TLE Select List updated.')
}

/**
 * Event handler for the Cancel button.
 *
 * This function hides the TLE input form when the Cancel button is clicked.
 */
ListCancel.onclick = function () {
  const TLEcontainer = document.getElementById('TLEListcontainer')
  TLEcontainer.style.visibility = 'hidden' // Hide the TLE input container
  console.log('TLE input cancelled.')
}

/**
 * Summary:
 * This file handles the user interaction for entering or uploading TLE data in the application.
 * It processes the input data to create satellite objects using the SGP4 propagation model.
 * The satellite names are displayed in a dropdown list, and the autocomplete functionality allows users
 * to search for specific satellites by name.
 *
 * Breakdown:
 * 1. **DOM Elements**: References to the buttons, text areas, and file input fields used in the UI.
 * 2. **File Reading**: Handles reading TLE files via the FileReader API when a file is uploaded by the user.
 * 3. **TLE Processing**: Parses the TLE data entered by the user (either manually or from a file) and creates
 *    satellite tracking objects using the SGP4 library.
 * 4. **Satellite List**: Populates a dropdown list with the satellite names derived from the TLE data.
 * 5. **Autocomplete**: Adds the satellite names to an autocomplete list for easy searching.
 *
 * How it Works:
 * - The user can enter or upload TLE data, which is then processed to create satellite tracking objects.
 * - The satellite names are displayed in a select list, and users can search for specific satellites using autocomplete.
 * - The cancel button hides the input form without processing any data.
 *
 * This file is essential for handling TLE input in satellite tracking applications.
 */
