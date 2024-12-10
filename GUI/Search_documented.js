/**
 * search.js
 *
 * Description:
 * This file manages the target selection functionality in the application. It utilizes an autocomplete feature
 * to allow users to search for and select a satellite by name. Once a target is selected, the appropriate
 * satellite's data is updated and the corresponding TLE information is set.
 *
 * Key Features:
 * - Autocomplete search functionality for selecting satellites.
 * - Updates the target name and TLE data upon selection.
 *
 * Usage:
 * Include this file in a web application that requires searching and selecting satellite targets by name.
 * It integrates with the autoComplete.js library for providing search functionality and automatically updates
 * the selected target's data.
 *
 * Dependencies:
 * - The `autoComplete.js` library is used to provide the autocomplete feature.
 * - It interacts with other controls such as `osvControls` and `satellites` from the broader application context.
 *
 * File Breakdown:
 * 1. `setTarget`: Function that updates the target satellite based on the selection.
 * 2. `autoCompleteJS`: Initialization of the autocomplete search functionality using the `autoComplete.js` library.
 */

// Declare an empty array to store the list of satellite names for autocomplete suggestions
const autoCompleteTargetList = []

/**
 * setTarget
 *
 * This function is called when a target satellite is selected from the autocomplete list.
 * It updates the relevant data in the application by setting the selected target's name, TLE data, and satellite object.
 *
 * How it works:
 * 1. Retrieves the index of the selected satellite from the `satNameToIndex` mapping.
 * 2. Fetches the corresponding satellite's TLE lines and satellite object.
 * 3. Updates the satellite tracking controls (`osvControls`) and sets the TLE source to "TLE".
 * 4. Calls the `updateTLEControls` function to update the TLE data in the UI.
 *
 * @param {string} targetName - The name of the selected target satellite.
 */
function setTarget(targetName) {
  const satIndex = satNameToIndex[targetName] // Get the index of the satellite based on its name
  const lines = satLines[satIndex] // Get the TLE lines for the selected satellite
  const satellite = satellites[satIndex] // Get the satellite object

  // Update the target name in the satellite tracking controls
  osvControls.targetName.setValue(targetName)

  // Set the selected satellite object in the global `satrec`
  satrec = satellites[satIndex]

  // Set the data source to "TLE"
  osvControls.source.setValue('TLE')

  // Update the TLE controls with the selected satellite's TLE lines
  updateTLEControls(targetName, lines[1], lines[2])
}

/**
 * autoCompleteJS
 *
 * Initializes the `autoComplete.js` library to provide search and selection functionality for satellites.
 *
 * How it works:
 * - Uses the `autoCompleteTargetList` array to provide suggestions based on user input.
 * - When a selection is made, it triggers the `setTarget` function to update the application with the selected satellite's data.
 *
 * Key Configuration:
 * - `placeHolder`: Sets the placeholder text in the search input.
 * - `data.src`: Points to the satellite names stored in `autoCompleteTargetList`.
 * - `resultItem.highlight`: Enables highlighting of matching characters in the result items.
 * - `resultsList.tabSelect`: Allows tabbing through the results.
 * - `events.input.selection`: Handles the selection of a result from the autocomplete list and updates the input field.
 *
 * The configuration and behavior of `autoComplete.js` make it a flexible and user-friendly search tool.
 */
const autoCompleteJS = new autoComplete({
  placeHolder: 'Search for a target', // Placeholder text in the search input box
  data: {
    src: autoCompleteTargetList, // Source of data for autocomplete (list of satellite names)
    cache: true, // Enable caching of search results for improved performance
  },
  resultItem: {
    highlight: true, // Highlight matching text in the search results
  },
  resultsList: {
    tabSelect: true, // Allow the user to select results using the Tab key
    noResults: true, // Display a "No results" message if no matches are found
  },
  events: {
    input: {
      /**
       * Handles the selection of a search result from the autocomplete list.
       *
       * When the user selects a satellite from the autocomplete suggestions, this event handler is triggered.
       * It sets the selected satellite name in the input field and calls the `setTarget` function to update the application with the selected satellite's data.
       *
       * @param {Event} event - The selection event triggered by the autocomplete.
       */
      selection: (event) => {
        const selection = event.detail.selection.value // Get the selected satellite name
        autoCompleteJS.input.value = selection // Set the input field to the selected name
        setTarget(selection) // Call setTarget to update the application with the selected satellite
      },
    },
  },
})

/**
 * Summary:
 * - This file provides search functionality for selecting satellites using the `autoComplete.js` library.
 * - It handles the search input, result selection, and updates the application's satellite data accordingly.
 * - The `setTarget` function is responsible for updating the target satellite and related TLE data when a selection is made.
 *
 * How it Works:
 * - The user types a satellite name into the search input.
 * - The `autoComplete.js` library provides suggestions based on the available satellite names in the `autoCompleteTargetList`.
 * - When a user selects a satellite, the `setTarget` function is called, which updates the tracking system with the selected satellite's name and TLE data.
 *
 * Dependencies:
 * - The file relies on the global arrays `satNameToIndex`, `satLines`, and `satellites` for storing satellite information.
 * - It integrates with the `osvControls` and `updateTLEControls` to handle TLE updates and satellite tracking.
 */

// Breakdown:

// 	1.	setTarget Function:
// 	•	This function is triggered when a satellite is selected from the autocomplete search results. It updates the system by setting the satellite’s name, TLE data, and tracking controls.
// 	2.	autoCompleteJS Initialization:
// 	•	The autocomplete search is set up using the autoComplete.js library, providing real-time suggestions from the autoCompleteTargetList array, which contains satellite names.
// 	3.	Autocomplete Event Handling:
// 	•	When a selection is made from the search results, the selection event handler updates the input field with the selected satellite name and calls the setTarget function to load the satellite data.

// This structure ensures that the user can efficiently search for satellites, and the system will automatically update with the corresponding satellite data, making the user experience seamless.
