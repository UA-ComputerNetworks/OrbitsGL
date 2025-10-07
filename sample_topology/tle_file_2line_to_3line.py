import os


def prepare_tle_file(input_filename):
    """
    Reads a TLE file structured as (Line 1, Line 2, Line 1, Line 2, ...)
    and converts it into the required 3-line format (Name, Line 1, Line 2)
    by inserting a padded name line for each satellite.

    :param input_filename: The path to the input TLE file.
    :return: The path to the new 3-line formatted TLE file.
    """
    try:
        with open(input_filename, 'r') as f:
            raw_lines = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_filename}")
        return None

    if len(raw_lines) % 2 != 0:
        print("Error: TLE file contains an odd number of data lines. Please check file integrity.")
        return None

    processed_lines = []

    # Process lines in pairs (Line 1 and Line 2)
    for i in range(0, len(raw_lines), 2):
        line1 = raw_lines[i]
        line2 = raw_lines[i + 1]

        # Ensure we are processing actual TLE lines
        if not line1.startswith('1 ') or not line2.startswith('2 '):
            print(
                f"Warning: Skipping malformed TLE set starting at line {i+1}.")
            continue

        # Extract Catalog Number (NORAD ID) from Line 1 (Columns 3-7, Index 2-6)
        # Note: TLE format specifies fixed columns, but slicing is more robust here.
        cat_num = line1[2:7].strip()

        # Construct the satellite name, padded to exactly 24 characters.
        # This padding is CRITICAL for TLE parsers like SGP4 to correctly read
        # the Epoch time which starts immediately after the 24th character of Line 0.
        base_name = f"STARLINK-{cat_num}"
        padded_title = base_name.ljust(24)

        # Assemble the 3-line set
        processed_lines.append(padded_title)  # Line 0 (Name, 24 chars)
        processed_lines.append(line1)        # Line 1 (TLE Data)
        processed_lines.append(line2)        # Line 2 (TLE Data)

    # Determine the output filename
    base, ext = os.path.splitext(input_filename)
    output_filename = f"{base}_3LINE{ext}"

    # Write the new file
    with open(output_filename, 'w') as f:
        f.write('\n'.join(processed_lines))

    print("-" * 40)
    print("TLE Conversion Successful.")
    print(f"Converted {len(raw_lines) // 2} satellites to 3-line format.")
    print(f"New file saved as: {output_filename}")
    print(
        f"Content Preview (Sat 1):\n{processed_lines[0]}\n{processed_lines[1]}\n{processed_lines[2]}")
    print("-" * 40)

    return output_filename

# Example Usage (replace 'your_input_file.txt' with your actual TLE file name)
# Note: Since the simulation environment doesn't allow direct file I/O,
# this usage example is commented out but shows how you would run it in Python.


prepare_tle_file('Starlink_20241003080801.txt')
