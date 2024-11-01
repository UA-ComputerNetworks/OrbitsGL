const ListEnter = document.getElementById('TLEListEnter')
const ListCancel = document.getElementById('TLEListCancel')
const TLEinput = document.getElementById('TLEListinput')
const TLEFileInput = document.getElementById('TLEFileInput') // File input element

// Debug to ensure elements are found
console.log('TLE Enter button:', ListEnter)
console.log('TLE Cancel button:', ListCancel)
console.log('TLE input area:', TLEinput)
console.log('TLE file input:', TLEFileInput)

// Global dictionary to store satellite objects by name
let satelliteObjects = {}

// Function to handle file reading
TLEFileInput.onchange = function (event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      console.log('File loaded successfully.')
      TLEinput.value = e.target.result // Set file content into textarea for consistency
    }
    reader.onerror = function (e) {
      console.error('Error reading file:', e)
    }
    reader.readAsText(file)
  } else {
    console.log('No file selected.')
  }
}

ListEnter.onclick = function () {
  console.log('Enter button clicked.')

  const TLEcontainer = document.getElementById('TLEListcontainer')
  const TLEselectList = document.getElementById('TLESelectlist')
  console.log('TLE Container:', TLEcontainer)
  console.log('TLE Select List:', TLEselectList)

  // Hiding the container (for UI logic)
  TLEcontainer.style.visibility = 'hidden'

  const tleIn = TLEinput.value
  if (!tleIn) {
    console.error('No TLE input provided.')
    return
  }

  const lines = tleIn.split('\n')
  const numElem = (lines.length + 1) / 3

  console.log('Processing TLE data...')
  console.log('TLE input value:', tleIn)
  console.log('Number of lines:', lines.length)
  console.log('Number of elements (calculated):', Math.floor(numElem))

  satellites = []
  satelliteNames = []
  satNameToIndex = []
  satIndexToName = []
  let innerHTML = ''

  autoCompleteTargetList.length = 0
  for (let indElem = 0; indElem < Math.floor(numElem); indElem++) {
    let title = lines[indElem * 3].trim()

    if (satelliteNames.includes(title)) {
      title = title + '_' + indElem
    }

    const tleLine1 = lines[indElem * 3 + 1]
    const tleLine2 = lines[indElem * 3 + 2]

    console.log(`TLE Element ${indElem}:`, title, tleLine1, tleLine2)

    try {
      const tle = sgp4.tleFromLines([
        lines[indElem * 3],
        lines[indElem * 3 + 1],
        lines[indElem * 3 + 2],
      ])

      // satRec is different from satrec.

      const satRec = sgp4.createTarget(tle)

      satellites.push(satRec)
      satLines.push([title, tleLine1, tleLine2])
      satelliteNames.push(title)
      autoCompleteTargetList.push(title)
      satNameToIndex[title] = indElem
      satIndexToName.push(title)

      const osvProp = sgp4.propagateTargetTs(satRec, new Date(), 0.0)
      if (keplerParams && keplerParams.a) {
        // Only store if valid
        satelliteObjects[title] = {
          name: title,
          satrec: satRec,
          osvIn: osvProp, // Raw telemetry
          osvProp: osvProp, // Propagated telemetry
          kepler: keplerParams, // Keplerian parameters
          r_ECEF: [0, 0, 0],
          v_ECEF: [0, 0, 0],
          alt: 0,
          lon: 0,
          lat: 0,
          color: [200, 200, 200], // Default color, can be updated in SelectDialog
        }
      } else {
        console.warn(`Kepler data missing for ${title}`)
      }
    } catch (error) {
      console.error('Error creating target from TLE:', error)
    }
  }

  console.log('Satellite names before sorting:', satelliteNames)
  satelliteNames.sort()
  console.log('Satellite names after sorting:', satelliteNames)

  for (let indName = 0; indName < satelliteNames.length; indName++) {
    const satName = satelliteNames[indName]
    innerHTML += '<option value="' + satName + '">' + satName + '</option>'
  }

  autoCompleteJS.data.src = satelliteNames

  // Clear the text area for performance reasons
  TLEinput.value = ''

  // Populate the select list with TLE satellite names
  TLEselectList.innerHTML = innerHTML
  displayControls.enableList.setValue(true)

  console.log('TLE Select List updated.')
}

ListCancel.onclick = function () {
  const TLEcontainer = document.getElementById('TLEListcontainer')
  TLEcontainer.style.visibility = 'hidden'
  console.log('TLE input cancelled.')
}
