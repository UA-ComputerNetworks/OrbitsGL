# Testing

## 1. Select Satellite Functionality

### Steps:

1. Navigate to the `Testing/SelectSatellite_Testing` folder.
2. Upload the required TLE file:
   - **File:** `Starlink_20231116160005.txt`
   - Use the **Insert TLE List** option in the GUI to populate the satellites.
3. Open the **Select Dialog** in the GUI:
   - Select one of the provided files in the folder:
     - `SelectDialog_Testing1.txt`
     - `SelectDialog_Testing2.txt`
   - Alternatively, directly select satellites populated in the dialog (from the uploaded TLE list) but the satellites will be default colored.
4. Verify satellite visualization:
   - Select satellites from the dialog. The selected satellites should appear in the visualization but without colors by default.
5. **Toggle Satellite Orbit Lines:**
   - Go to the **Display** section of the GUI.
   - Enable/disable **Orbit Lines** to show or hide the orbit paths for the selected satellites.

### Expected Results:

- Satellites from the uploaded TLE file populate the selection dialog.
- Selected satellites display in the visualization.
- Orbit lines are visible when **Orbit Lines** is enabled and disappear when toggled off.

---

## 2. Inter-Satellite Link (ISL) Visualizations

### Steps:

1. Navigate to the `InterSatellite_Link_Testing` folder.
2. Upload the required files:
   - **TLE File:** `Starlink_70_20231030160003.txt` via **Insert TLE List**.
   - **ISL File:** `ISL_Satellites.txt` via the **ISL Upload** option.
3. We have ISL_Style.txt option but it is still not decided how to utilize it. So, we haven't implemented it yet. It does not work. Please do not use this.

4. Verify the visualization:
   - Links between the satellites specified in `ISL_Satellites.txt` should appear.

### Expected Results:

- ISL connections render between specified satellite pairs.

---

## 3. Start from Present Time/Epoch Time

### Steps:

1. Test the **Start From Present** toggle in the **Time** section of the GUI:
   - **Start From Present:**
     - The simulation starts from the current system time.
     - Time wrapping updates dynamically.
   - **Start From Present OFF:**
     - The simulation starts from the epoch time of the first satellite in the uploaded TLE file (`Starlink_20231116160005.txt` or `Starlink_70_20231030160003.txt`).
2. Use the **Insert TLE List** option to upload one of the TLE files.
3. Observe how the simulation time changes based on the toggle.

### Expected Results:

- When **Start From Present**, the simulation uses the system clock for time progression.
- When **Start From Present**, the simulation uses the epoch time of the first satellite from the uploaded TLE file.

---

## 4. Time Wrapping

### Steps:

1. Enable the **Time Warp** feature in the **Time** section of the GUI.
2. Adjust the **warp size** (in seconds) to control how fast time progresses in the simulation.
3. Test with both **Start From Present ON** and **Start From Present OFF** modes.

### Expected Results:

- Time wrapping accelerates or decelerates time progression based on the warp size value.
- Time wrapping works independently of the "Start From Present" toggle.

---

## 5. Toggle Satellite Orbit Lines

### Steps:

1. Upload the required TLE file as described in **Select Satellite Functionality**.
2. In the **Display** section of the GUI, locate the **Orbit Lines** toggle option.
3. Toggle **Orbit Lines** on or off to control the visibility of the orbit paths for selected satellites.

### Expected Results:

- Orbit lines for selected satellites are visible when **Orbit Lines** is enabled.
- Orbit lines disappear when **Orbit Lines** is toggled off.

---

## 6. Feature Request for Custom Time

### Implemented Features:

1. The ability to start simulations from:
   - **Current Time (Start from Present Time)**
   - **Epoch Time of the First Satellite**
2. Time wrapping that works independently of the time source.
3. Orbit lines that can be toggled on or off for selected satellites.
