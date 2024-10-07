// /**
//  * selectDialog.js
//  *
//  * Description:
//  * This file manages the functionality of handling the TLE (Two-Line Element) input dialog for satellite tracking.
//  * It allows the user to select a satellite from a pre-populated list of TLEs, which then updates the satellite tracking system.
//  * The dialog contains controls for entering or canceling the selection process.
//  *
//  * Key Features:
//  * - Handles selection of a satellite from a list of TLEs.
//  * - Updates the satellite's data in the control system once a selection is made.
//  * - Provides cancel functionality to hide the selection dialog without making any changes.
//  *
//  * Usage:
//  * This script should be included in a web application that handles satellite tracking via TLE input.
//  * It interacts with the broader system's satellite tracking controls and updates the corresponding target data based on user input.
//  *
//  * Dependencies:
//  * - Requires global variables such as `satellites`, `satNameToIndex`, `satLines`, and `osvControls`.
//  * - Relies on the `updateTLEControls` function to handle the TLE data update process.
//  *
//  * File Breakdown:
//  * 1. `SelectEnter` and `SelectCancel`: DOM elements representing the Enter and Cancel buttons.
//  * 2. `SelectContainer`: The container that holds the satellite selection dialog.
//  * 3. `SelectList`: The dropdown or list element where the user selects a satellite.
//  * 4. Event Handlers: Handles the actions when the Enter or Cancel buttons are clicked.
//  */

// // DOM element references for the TLE input dialog controls
// const SelectEnter = document.getElementById('TLESelectEnter') // Enter button for submitting the selected satellite
// const SelectCancel = document.getElementById('TLESelectCancel') // Cancel button for closing the dialog
// const SelectContainer = document.getElementById('TLESelectcontainer') // The container that holds the selection dialog
// const SelectList = document.getElementById('TLESelectlist') // The dropdown or list that contains satellite names

// /**
//  * SelectEnter.onclick
//  *
//  * This event handler is triggered when the user clicks the "Enter" button to select a satellite from the list.
//  *
//  * How it works:
//  * 1. Checks if there are any satellites in the `satellites` array.
//  * 2. Retrieves the selected satellite's name from `SelectList` and finds the corresponding satellite object and TLE data.
//  * 3. Updates the `osvControls` (satellite tracking controls) with the selected satellite's name and sets the source to "TLE".
//  * 4. Calls the `updateTLEControls` function to update the TLE data in the user interface.
//  * 5. Hides the selection container after the satellite is selected.
//  *
//  * @event {MouseEvent} onclick - The event triggered by clicking the "Enter" button.
//  */
// SelectEnter.onclick = function () {
//   // Check if there are satellites available for selection
//   if (satellites.length > 0) {
//     console.log(SelectList.value) // Log the selected satellite name to the console

//     // Get the selected satellite's name and retrieve its index from the `satNameToIndex` mapping
//     const targetName = SelectList.value
//     const satIndex = satNameToIndex[targetName]
//     const lines = satLines[satIndex] // Get the TLE lines for the selected satellite
//     const satellite = satellites[satIndex] // Get the satellite object

//     // Update the target name in the satellite tracking controls
//     osvControls.targetName.setValue(targetName)

//     // Set the selected satellite object in the global `satrec`
//     satrec = satellites[satIndex]

//     // Set the data source to "TLE"
//     osvControls.source.setValue('TLE')

//     // Update the TLE controls with the selected satellite's TLE lines
//     updateTLEControls(targetName, lines[1], lines[2])
//   }

//   // Hide the selection container after the satellite has been selected
//   SelectContainer.style.visibility = 'hidden'
// }

// /**
//  * SelectCancel.onclick
//  *
//  * This event handler is triggered when the user clicks the "Cancel" button to close the TLE input dialog without making a selection.
//  *
//  * How it works:
//  * - It simply hides the selection container, effectively canceling the input process.
//  *
//  * @event {MouseEvent} onclick - The event triggered by clicking the "Cancel" button.
//  */
// SelectCancel.onclick = function () {
//   // Hide the selection container when the user clicks "Cancel"
//   SelectContainer.style.visibility = 'hidden'
// }

// /**
//  * Summary:
//  * - This file handles the selection of satellites from a list using TLE data.
//  * - The user can either select a satellite and update the tracking system or cancel the selection.
//  * - The `SelectEnter` button triggers an update of the selected satellite's TLE data, while `SelectCancel` simply hides the dialog.
//  *
//  * How it Works:
//  * - The user selects a satellite from the dropdown list.
//  * - When the "Enter" button is clicked, the system retrieves the selected satellite's TLE data and updates the satellite tracking controls.
//  * - The TLE controls are updated by calling the `updateTLEControls` function, and the container is hidden after selection.
//  *
//  * Dependencies:
//  * - This file interacts with global arrays (`satellites`, `satNameToIndex`, `satLines`) and control elements like `osvControls`.
//  * - The `updateTLEControls` function is necessary to handle the actual TLE data update.
//  *
//  * Breakdown and Summary Inside the File:

// 	1.	SelectEnter.onclick: Handles the selection of a satellite from the dropdown list. Once selected, it updates the global satellite tracking controls with the TLE data for that satellite. The dialog is then hidden.
// 	2.	SelectCancel.onclick: Hides the selection container when the user cancels the operation by clicking the “Cancel” button.
//  */
