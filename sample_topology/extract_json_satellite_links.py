import json
import os


def extract_satellite_interlinks(input_filepath="sample_edges_2024-10-03.json", output_filepath="satellite_interlinks.txt"):
    """
    Reads a JSON file containing satellite links (edges), extracts the catalog
    numbers for connected pairs (sat1 and sat2), and saves them to a new 
    text file with columns: sat1CatalogNum, sat2CatalogNum.

    The script assumes the input file is in the same directory and contains
    a list of objects, each with 'sat1' and 'sat2' keys.
    """

    # 1. Check if the input file exists
    if not os.path.exists(input_filepath):
        print(f"Error: Input file '{input_filepath}' not found.")
        return

    print(f"Reading topology data from: {input_filepath}")

    try:
        # 2. Read the JSON content
        with open(input_filepath, 'r') as f:
            data = json.load(f)

        # Ensure the loaded data is a list (array of edge objects)
        if not isinstance(data, list):
            print("Error: JSON data is not a list of satellite links.")
            return

        # 3. Process the data and prepare the output content
        output_lines = []

        # Add the header line
        header = "sat1CatalogNum,sat2CatalogNum"
        output_lines.append(header)

        # Iterate over each link (edge) and extract the required fields
        for link in data:
            try:
                # Use str() just in case the numbers were parsed as integers,
                # though the input shows them as strings.
                sat1_id = str(link['sat1'])
                sat2_id = str(link['sat2'])

                # Format the line as requested: sat1, sat2 separated by a comma
                output_lines.append(f"{sat1_id},{sat2_id}")
            except KeyError as e:
                print(f"Warning: Skipping a record missing a key: {e}")

        # 4. Write the extracted content to the output file
        with open(output_filepath, 'w') as f:
            f.write('\n'.join(output_lines))

        print(f"\nSuccessfully extracted {len(output_lines) - 1} interlinks.")
        print(f"Output saved to: {output_filepath}")

    except json.JSONDecodeError:
        print(f"Error: Could not parse JSON data from {input_filepath}.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    # Assuming the input file is named sample_edges_2024-10-03.json
    extract_satellite_interlinks()
