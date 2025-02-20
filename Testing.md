# Testing Guide

This document provides detailed steps for testing all major functionalities of the satellite visualization system. It includes information on file locations, feature-specific instructions, and expected outcomes.

---

## 1. Select Satellite Functionality (Select TLE)

### Description:

- Allows the user to upload TLE files and visualize satellites.
- Satellites can be selected by **Name** or **Catalog Number** for additional operations.
- File names and colors are used for visual differentiation.

### Steps:

1. Navigate to the **`Testing/SelectSatellite_Testing`** folder.
2. Upload the required TLE file:
   - **File**: `Starlink_20231116160005.txt` (TLE file for testing).
   - Use the **Insert TLE List** option in the GUI to populate the satellites.
3. Open the **Select TLE by Name** or **Select TLE by Catalog** options in the GUI:
   - **For Name**:
     - Upload `SelectTLE_Testing_ByName.txt` (formatted as `satelliteName,R,G,B`).
   - **For Catalog**:
     - Upload `SelectTLE_Testing_ByCatalog.txt` (formatted as `catalogNumber,R,G,B`).
4. Verify visualization:
   - Selected satellites appear with their assigned colors.
   - If a satellite does not have a color in the file, it defaults to `[200, 200, 200]`.
5. Toggle Satellite Orbit Lines:
   - In the **Display** section of the GUI, enable or disable **Orbit Lines**.

### Expected Results:

- Satellites from the uploaded TLE file populate the selection dialog.
- Satellites display with the correct colors based on the file.
- Orbit lines toggle correctly based on the **Orbit Lines** option.

### File Location for Testing:

- TLE File: `Testing/SelectSatellite_Testing/Starlink_20231116160005.txt`
- Name File: `Testing/SelectSatellite_Testing/SelectTLE_Testing_ByName.txt`
- Catalog File: `Testing/SelectSatellite_Testing/SelectTLE_Testing_ByCatalog.txt`

---

## 2. Inter-Satellite Links (ISL)

### Description:

- Enables visualization of links between satellites based on provided files.
- Supports files specifying ISLs by **Name** or **Catalog Number**.
- Optional styles for ISLs can include color, width, and line type.

### Steps:

1. Navigate to the **`Testing/InterSatellite_Link_Testing`** folder.
2. Upload the required files:
   - **TLE File**: `Starlink_70_20231030160003.txt` via **Insert TLE List**.
   - **ISL by Name**:
     - Upload `ISL_ByName_Testing.txt` (formatted as `satelliteName1,satelliteName2`).
   - **ISL by Catalog**:
     - Upload `ISL_ByCatalog_Testing.txt` (formatted as `catalogNumber1,catalogNumber2`).
3. Verify visualization:
   - Links appear between specified satellites.

### Expected Results:

- ISL connections render between satellites.

### File Location for Testing:

- TLE File: `Testing/InterSatellite_Link_Testing/Starlink_70_20231030160003.txt`
- ISL Name File: `Testing/InterSatellite_Link_Testing/ISL_ByName_Testing.txt`
- ISL Catalog File: `Testing/InterSatellite_Link_Testing/ISL_ByCatalog_Testing.txt`

---

## 3. Multi-TLE File Handling

### Description:

- Supports uploading multiple TLE files for satellites.
- Files are sorted by **epoch time** and dynamically switched during the simulation based on the current time.

### Steps:

1. Navigate to the **`Testing/MultiTLE_Testing`** folder.
2. Upload multiple TLE files via the **Insert TLE List** option.
   - Files should have timestamps in their names, e.g., `Starlink_20231101000000.txt`.
3. Enable the **Start from Present Time** toggle or keep it off:
   - **Enabled**: The simulation uses the current system time.
   - **Disabled**: The simulation uses the epoch time of the first satellite in the file.
4. Adjust the simulation time using the **Time Warp** feature:
   - Increase/decrease warp size to observe dynamic switching.
5. Verify:
   - Files are sorted by timestamp.
   - The system switches files based on the simulation time.

### Expected Results:

- TLE files are correctly sorted by timestamp.
- Dynamic switching occurs between TLE files as the simulation time progresses.

### File Location for Testing:

- TLE Files:
  - `Testing/MultiTLE_Testing/Starlink_20231101000000.txt`
  - `Testing/MultiTLE_Testing/Starlink_20231102000000.txt`

---

## 4. Shortest Path Visualization

### Description:

- Renders precomputed shortest paths between satellites at different timestamps.
- Uses input files that specify paths over time.
- By default, the simulation starts at the **epoch time** of the first satellite in the uploaded **TLE file**.
- The displayed shortest path updates dynamically based on **time wrapping**.

### Steps:

1. Navigate to the **`Testing/Shortest_Path_Testing`** folder.

2. **Upload the Required TLE File**:

   - **File**: `Starlink_70_20231030160003.txt`
   - Upload it via **Insert TLE List** in the GUI.
   - This initializes the satellites in the system.

3. **Upload the Shortest Path File**:

   - **File**: `shortestpath.txt`
   - Upload it in the **Shortest Path Visualization** section of the GUI.
   - The file should have the following format:
     ```
     timestamp,satellite1,satellite2,satellite3,…
     2023-10-30T13:00:00Z,55275,55279,55277,55400
     ```
   - This file contains **precomputed shortest paths** for specific timestamps.

4. **Verify Initial Path Visualization**:

   - The system reads `shortestpath.txt` in **ShortestPathFile.js**.
   - The parsed data is stored in an array `shortestPaths[]`:
     - `shortestPaths[i].timestamp` holds the timestamp.
     - `shortestPaths[i].satelliteIds` holds the ordered satellite path.
   - The **correct shortest path** should be drawn between the satellites at the current simulation time.

5. **Use Time Warp to Observe Path Changes**:

   - Enable **Time Warp** in the **Time** section.
   - Adjust the **warp size** to move through different timestamps.
   - As time progresses, the system updates the displayed shortest path.
   - The function `visualizeShortestPaths()`:
     - Selects the closest timestamp in `shortestpath.txt`.
     - Updates the displayed path accordingly.

6. **Confirm Path Transitions**:
   - If the simulation time is **before the first timestamp**, the **first path** in the file is used.
   - If the simulation time is **after the last timestamp**, the **last path** in the file is used.
   - If the simulation time is **between two timestamps**, the **closest available path** is displayed.
   - Ensure smooth transitions of paths as time progresses.

### Expected Results:

- The **shortest path updates dynamically** based on simulation time.
- Paths change as **Time Warp** progresses.
- The correct sequence of satellites is highlighted.
- If no valid timestamp is found, **no path is displayed**.

### Issues That Can Break Visualization:

| Issue                            | Cause                               | Solution                                       |
| -------------------------------- | ----------------------------------- | ---------------------------------------------- |
| Time Not Updating Correctly      | Simulation time not advancing       | Ensure time is updating correctly              |
| File Not Parsed Properly         | `shortestPaths` is empty            | Verify file format and parsing                 |
| Missing Satellite Data           | A satellite ID is not in the system | Check if satellites exist in uploaded TLE file |
| Wrong Coordinate Transformations | ECEF/J2000 conversions failing      | Debug matrix transformation logic              |

### File Location for Testing:

- **TLE File**: `Testing/Shortest_Path_Testing/Starlink_70_20231030160003.txt`
- **Path File**: `Testing/Shortest_Path_Testing/shortestpath.txt`

## 5. Start from Present Time or Epoch Time

### Description:

- Determines the starting time for the simulation:
  - **Start from Present Time**: Uses the system clock.
  - **Start from Epoch Time**: Uses the epoch of the first satellite in the uploaded TLE file.

### Steps:

1. Upload the required TLE file using **Insert TLE List**.
2. Toggle **Start from Present Time** in the **Time** section:
   - **Enabled**: The system clock is used.
   - **Disabled**: The epoch time of the first satellite is used.
3. Verify time progression in the GUI.

### Expected Results:

- **Enabled**: The simulation time matches the system clock.
- **Disabled**: The simulation starts from the first satellite's epoch.

### File Location for Testing:

- TLE File: `Testing/StartTime_Testing/Starlink_20231116160005.txt`

---

## 6. Time Wrapping

### Description:

- Adjusts the speed of time progression in the simulation.

### Steps:

1. Enable the **Time Warp** feature in the **Time** section.
2. Adjust the warp size (in seconds).
3. Observe the effect on satellite motion and file switching.

### Expected Results:

- Time progression speeds up or slows down based on the warp size.

## 6. Toggle Satellite Orbit Lines

### Steps:

1. Upload the required TLE file as described in **Select Satellite Functionality**.
2. In the **Display** section of the GUI, locate the **Orbit Lines** toggle option.
3. Toggle **Orbit Lines** on or off to control the visibility of the orbit paths for selected satellites.

### Expected Results:

- Orbit lines for selected satellites are visible when **Orbit Lines** is enabled.
- Orbit lines disappear when **Orbit Lines** is toggled off.

---

## Testing Checklist

| Feature                  | Action                            | Expected Outcome                    |
| ------------------------ | --------------------------------- | ----------------------------------- |
| Insert TLE               | Upload a TLE file                 | Satellites parsed and visualized    |
| Select TLE by Name       | Upload Select TLE by Name file    | Satellites and colors visualized    |
| Select TLE by Catalog    | Upload Select TLE by Catalog file | Satellites and colors visualized    |
| ISL Upload by Name       | Upload ISL file by Name           | ISLs drawn between satellites       |
| ISL Upload by Catalog    | Upload ISL file by Catalog        | ISLs drawn between satellites       |
| ISL Style                | Upload ISL style file             | ISL lines styled as specified       |
| Multi-TLE File Handling  | Upload multiple TLE files         | Epoch-based file switching verified |
| Start from Present/Epoch | Toggle start mode                 | Correct simulation time behavior    |
| Time Wrapping            | Adjust warp size                  | Time progression changes observed   |

---
