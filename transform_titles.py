import csv
import re

def transform_title(title):
    title = title.strip()
    # Remove "Women's " prefix
    clean_title = re.sub(r"^Women's\s+", "", title)

    # Check for " - NAME" pattern
    name_match = re.search(r"\s+-\s+([a-zA-Z0-9]+)$", clean_title)
    if name_match:
        name = name_match.group(1)
        # Remove the name part to find the product type
        base_part = clean_title[:name_match.start()]
        # Heuristic: Remove known colors from base_part
        colors = [
            "Khaki", "White-Green", "Blue", "Pink", "Yellow", "White", "Purple",
            "Black", "Brown", "Panna", "Green", "Grey", "Burgundy", "Leopard Print",
            "White-Yellow", "White-Pink", "White-Black", "Lavender", "Orange", "Red", "Beige"
        ]
        # Sort colors by length desc to match "White-Green" before "White"
        colors.sort(key=len, reverse=True)

        product_type = base_part
        for color in colors:
            # Remove color if it's a whole word
            product_type = re.sub(r"\b" + re.escape(color) + r"\b", "", product_type).strip()

        # Clean up extra spaces
        product_type = re.sub(r"\s+", " ", product_type).strip()

        return f"{product_type} {name}"

    # Standard case: [Product Type] [Color]
    # "Khaki Gym Shorts" -> "Gym Shorts Khaki"
    # "White-Green Leggings" -> "Leggings White-Green"

    # We need to identify the color and move it to the end.
    # Or rather, identify the product type and the color.

    colors = [
        "Khaki", "White-Green", "Blue", "Pink", "Yellow", "White", "Purple",
        "Black", "Brown", "Panna", "Green", "Grey", "Burgundy", "Leopard Print",
        "White-Yellow", "White-Pink", "White-Black", "Lavender", "Orange", "Red", "Beige"
    ]

    found_color = None
    product_type = clean_title

    # Sort colors by length desc to match "White-Green" before "White"
    colors.sort(key=len, reverse=True)

    for color in colors:
        if re.search(r"\b" + re.escape(color) + r"\b", clean_title, re.IGNORECASE):
            # Found the color.
            # We want to preserve the case from the original title if possible, or use the standard one?
            # The examples show "Khaki" -> "Khaki", "White-Green" -> "White-Green".
            # Let's extract the actual matched string to preserve case if needed,
            # but the examples seem to use Title Case for colors.

            # Remove color from product type
            pattern = r"\b" + re.escape(color) + r"\b"
            match = re.search(pattern, clean_title, re.IGNORECASE)
            if match:
                found_color = match.group(0) # Use the case found in the string
                product_type = re.sub(pattern, "", clean_title, flags=re.IGNORECASE).strip()
                break

    # Clean up product type
    product_type = re.sub(r"\s+", " ", product_type).strip()

    if found_color:
        return f"{product_type} {found_color}"

    # Fallback if no color found or other pattern
    return clean_title

def main():
    input_file = 'products_export_1 (1).csv'
    output_file = 'shopify_import.csv'

    title_map = {} # To store transformed titles and their original handles/titles for deduplication

    with open(input_file, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            handle = row['Handle']
            original_title = row['Title']

            # Skip rows without titles (variant rows often have empty titles in some exports,
            # but here we see Title populated for the first row of a product)
            if not original_title:
                continue

            new_title = transform_title(original_title)

            # Store for deduplication
            if new_title not in title_map:
                title_map[new_title] = []
            title_map[new_title].append({'handle': handle, 'original_title': original_title})

    # Deduplication pass
    with open(output_file, mode='w', encoding='utf-8', newline='') as outfile:
        fieldnames = ['Handle', 'Title']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

import csv
import re

def transform_title(title):
    title = title.strip()
    # Remove "Women's " prefix
    clean_title = re.sub(r"^Women's\s+", "", title)

    # Check for " - NAME" pattern
    name_match = re.search(r"\s+-\s+([a-zA-Z0-9]+)$", clean_title)
    if name_match:
        name = name_match.group(1)
        # Remove the name part to find the product type
        base_part = clean_title[:name_match.start()]
        # Heuristic: Remove known colors from base_part
        colors = [
            "Khaki", "White-Green", "Blue", "Pink", "Yellow", "White", "Purple",
            "Black", "Brown", "Panna", "Green", "Grey", "Burgundy", "Leopard Print",
            "White-Yellow", "White-Pink", "White-Black", "Lavender", "Orange", "Red", "Beige"
        ]
        # Sort colors by length desc to match "White-Green" before "White"
        colors.sort(key=len, reverse=True)

        product_type = base_part
        for color in colors:
            # Remove color if it's a whole word
            product_type = re.sub(r"\b" + re.escape(color) + r"\b", "", product_type).strip()

        # Clean up extra spaces
        product_type = re.sub(r"\s+", " ", product_type).strip()

        return f"{product_type} {name}"

    # Standard case: [Product Type] [Color]
    # "Khaki Gym Shorts" -> "Gym Shorts Khaki"
    # "White-Green Leggings" -> "Leggings White-Green"

    # We need to identify the color and move it to the end.
    # Or rather, identify the product type and the color.

    colors = [
        "Khaki", "White-Green", "Blue", "Pink", "Yellow", "White", "Purple",
        "Black", "Brown", "Panna", "Green", "Grey", "Burgundy", "Leopard Print",
        "White-Yellow", "White-Pink", "White-Black", "Lavender", "Orange", "Red", "Beige"
    ]

    found_color = None
    product_type = clean_title

    # Sort colors by length desc to match "White-Green" before "White"
    colors.sort(key=len, reverse=True)

    for color in colors:
        if re.search(r"\b" + re.escape(color) + r"\b", clean_title, re.IGNORECASE):
            # Found the color.
            # We want to preserve the case from the original title if possible, or use the standard one?
            # The examples show "Khaki" -> "Khaki", "White-Green" -> "White-Green".
            # Let's extract the actual matched string to preserve case if needed,
            # but the examples seem to use Title Case for colors.

            # Remove color from product type
            pattern = r"\b" + re.escape(color) + r"\b"
            match = re.search(pattern, clean_title, re.IGNORECASE)
            if match:
                found_color = match.group(0) # Use the case found in the string
                product_type = re.sub(pattern, "", clean_title, flags=re.IGNORECASE).strip()
                break

    # Clean up product type
    product_type = re.sub(r"\s+", " ", product_type).strip()

    if found_color:
        return f"{product_type} {found_color}"

    # Fallback if no color found or other pattern
    return clean_title

def main():
    input_file = 'products_export_1 (1).csv'
    output_file = 'shopify_import.csv'

    title_map = {} # To store transformed titles and their original handles/titles for deduplication

    with open(input_file, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            handle = row['Handle']
            original_title = row['Title']

            # Skip rows without titles (variant rows often have empty titles in some exports,
            # but here we see Title populated for the first row of a product)
            if not original_title:
                continue

            new_title = transform_title(original_title)

            # Store for deduplication
            if new_title not in title_map:
                title_map[new_title] = []
            title_map[new_title].append({'handle': handle, 'original_title': original_title})

    # Deduplication pass
    with open(output_file, mode='w', encoding='utf-8', newline='') as outfile:
        fieldnames = ['Handle', 'Title']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for title, items in title_map.items():
            if len(items) == 1:
                writer.writerow({'Handle': items[0]['handle'], 'Title': title})
            else:
                # Handle duplicates
                print(f"Deduplicating '{title}'...")
                temp_titles = []
                for item in items:
                    handle = item['handle']
                    suffix = ""
                    # Try to find a number in the handle
                    num_match = re.search(r"-(\d+)$", handle)

                    if num_match:
                        suffix = f" {num_match.group(1)}"
                    else:
                        # Fallback: try to find distinguishing part
                        parts = handle.split('-')
                        if parts:
                            last_part = parts[-1]
                            if not last_part.isdigit() and last_part.lower() not in title.lower():
                                suffix = f" {last_part.capitalize()}"
                            elif len(parts) > 1 and parts[-1].isdigit():
                                suffix = f" {parts[-1]}"

                    temp_titles.append({'handle': handle, 'base_title': title, 'suffix': suffix})

                # Check for collisions in generated titles
                seen_titles = {}
                for t in temp_titles:
                    full_title = f"{t['base_title']}{t['suffix']}"
                    if full_title not in seen_titles:
                        seen_titles[full_title] = []
                    seen_titles[full_title].append(t)

                for full_title, collision_items in seen_titles.items():
                    if len(collision_items) == 1:
                        writer.writerow({'Handle': collision_items[0]['handle'], 'Title': full_title})
                    else:
                        # Secondary deduplication using first part of handle
                        for item in collision_items:
                            handle = item['handle']
                            parts = handle.split('-')
                            first_part = parts[0].capitalize() if parts else ""
                            # If first part is already in title, maybe use second?
                            # But let's stick to first part for now as observed difference.

                            final_suffix = item['suffix']
                            if first_part and first_part.lower() not in full_title.lower():
                                final_suffix = f"{item['suffix']} {first_part}"

                            final_title = f"{item['base_title']}{final_suffix}"
                            writer.writerow({'Handle': handle, 'Title': final_title})

    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    main()
