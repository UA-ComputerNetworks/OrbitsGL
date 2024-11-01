// Handling of TLE input dialog.
const ListEnter = document.getElementById('TLEListEnter')
const ListCancel = document.getElementById('TLEListCancel')
const TLEinput = document.getElementById('TLEListinput')
const TLEFileInput = document.getElementById('TLEFileInput')

// Store satellites data as an object
let satellites = {}

// Function to handle the TLE file upload
TLEFileInput.onchange = function (event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      TLEinput.value = e.target.result
    }
    reader.readAsText(file)
  }
}

// Function to process TLE data on Enter button click
ListEnter.onclick = function () {
  const tleData = TLEinput.value
  if (!tleData) {
    console.error('No TLE input provided.')
    return
  }

  const lines = tleData.trim().split('\n')
  satellites = {} // Clear previous satellites data

  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i].trim()
    const line1 = lines[i + 1]?.trim()
    const line2 = lines[i + 2]?.trim()

    if (line1 && line2 && line1.startsWith('1') && line2.startsWith('2')) {
      try {
        const satRec = sgp4.tleFromLines([name, line1, line2])
        satellites[name] = {
          satRec,
          name,
          color: [200, 200, 200], // Default color
          osvProp: null,
        }
        console.log(`Satellite added: ${name}`)
      } catch (error) {
        console.error(`Error creating target for ${name}:`, error)
      }
    } else {
      console.warn(`Invalid TLE data for ${name}`)
    }
  }

  console.log('Satellites loaded:', satellites)
}

// Cancel button to hide TLE input form
ListCancel.onclick = function () {
  document.getElementById('TLEListcontainer').style.visibility = 'hidden'
}
