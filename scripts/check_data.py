#!/usr/bin/env python3
import json
from pathlib import Path

# Check for scraped data files
data_dir = Path(__file__).parent / 'data'
files = list(data_dir.glob('properties_ca_selenium*.json'))

if not files:
    print('No data files found!')
else:
    # Use the latest file
    latest_file = max(files, key=lambda f: f.stat().st_mtime)
    print(f'Reading: {latest_file.name}\n')

    with open(latest_file) as f:
        data = json.load(f)

    print(f'Total properties: {len(data)}')
    print(f'\n=== City Distribution ===')

    cities = {}
    for prop in data:
        city = prop.get('city', 'Unknown')
        cities[city] = cities.get(city, 0) + 1

    for city, count in sorted(cities.items(), key=lambda x: -x[1])[:15]:
        print(f'{city}: {count}')

    print(f'\n=== Data Quality Check ===')
    has_price = sum(1 for p in data if p.get('price'))
    has_address = sum(1 for p in data if p.get('address'))
    has_image = sum(1 for p in data if p.get('image_url'))
    has_beds = sum(1 for p in data if p.get('bedrooms'))
    has_baths = sum(1 for p in data if p.get('bathrooms'))
    has_sqft = sum(1 for p in data if p.get('sqft'))

    print(f'Has price: {has_price}/{len(data)} ({has_price*100//len(data)}%)')
    print(f'Has address: {has_address}/{len(data)} ({has_address*100//len(data)}%)')
    print(f'Has image: {has_image}/{len(data)} ({has_image*100//len(data)}%)')
    print(f'Has bedrooms: {has_beds}/{len(data)} ({has_beds*100//len(data)}%)')
    print(f'Has bathrooms: {has_baths}/{len(data)} ({has_baths*100//len(data)}%)')
    print(f'Has sqft: {has_sqft}/{len(data)} ({has_sqft*100//len(data)}%)')

    print(f'\n=== Sample Property ===')
    if data:
        sample = data[0]
        print(f'Address: {sample.get("address", "N/A")}')
        print(f'City: {sample.get("city", "N/A")}')
        print(f'Price: ${sample.get("price", 0):,}')
        print(f'Beds: {sample.get("bedrooms", "N/A")}')
        print(f'Baths: {sample.get("bathrooms", "N/A")}')
        print(f'Sqft: {sample.get("sqft", "N/A")}')
