import os
import random
import string
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
from collections import defaultdict
import time

# Database configuration
DB_CONFIG = {
    'host': os.getenv("DB_HOST", "localhost"),
    'port': int(os.getenv("DB_PORT", "3306")),
    'user': os.getenv("DB_USER", "root"),
    'password': os.getenv("DB_PASSWORD", "admin"),
    'database': os.getenv("DB_NAME", "agentdb")
}

# User data
users = [
    {"id": 2, "name": "bharath kamal", "email": "datlabharath92@gmail.com", "mobile": "9908984918", "age": 22},
    {"id": 3, "name": "Atul", "email": "atul@mail.com", "mobile": "7878874654", "age": 22},
    {"id": 5, "name": "Anna Paul", "email": "anna@mail.com", "mobile": "9854562556", "age": 24},
    {"id": 6, "name": "Aryan Singh", "email": "aryan@mail.com", "mobile": "7474858512", "age": 14},
    {"id": 7, "name": "Nidhi Kaur", "email": "nidhi@mail.com", "mobile": "9696858512", "age": 13},
    {"id": 8, "name": "Manoj Kumar", "email": "manoj@mail.com", "mobile": "8484565632", "age": 40},
    {"id": 9, "name": "Manikant Reddy", "email": "manikant@mail.com", "mobile": "9595757542", "age": 48},
    {"id": 10, "name": "Smriti Pal", "email": "smriti@mail.com", "mobile": "6868959574", "age": 34},
    {"id": 11, "name": "Sahil Khan", "email": "sahil@mail.com", "mobile": "8585646474", "age": 33},
    {"id": 12, "name": "Asha Katri", "email": "asha@mail.com", "mobile": "9475865255", "age": 13}
]

# Bay data
bays = [
    {"id": 1, "name": "Cricket", "price": 1500.00},
    {"id": 2, "name": "Football", "price": 1200.00},
    {"id": 3, "name": "Golf", "price": 1800.00},
    {"id": 4, "name": "VVIP Room", "price": 2500.00},
    {"id": 5, "name": "Mega Screen", "price": 800.00},
    {"id": 6, "name": "PlayStation Room", "price": 600.00}
]

def get_bay_name_by_id(bay_id):
    for bay in bays:
        if bay["id"] == bay_id:
            return bay["name"]
    return "Bay not found"

def get_food_name_by_id(extra_id):
    for extra in extras:
        if extra["id"] == extra_id:
            return extra["name"]
    return "extra not found"
# Extras data
extras = [
    {"id": 1, "name": "Margherita Pizza", "price": 299.00},
    {"id": 2, "name": "Peppy Paneer Pizza", "price": 349.00},
    {"id": 3, "name": "Peri Peri Fries", "price": 129.00},
    {"id": 4, "name": "Onion Rings", "price": 129.00},
    {"id": 5, "name": "Veg Sandwich", "price": 149.00},
    {"id": 6, "name": "Grilled Cheese Sandwich", "price": 159.00},
    {"id": 7, "name": "Chicken Nuggets", "price": 179.00},
    {"id": 8, "name": "Coke", "price": 79.00},
    {"id": 9, "name": "Pepsi", "price": 79.00},
    {"id": 10, "name": "Sprite", "price": 79.00},
    {"id": 11, "name": "Fanta", "price": 79.00},
    {"id": 12, "name": "Veg Biryani", "price": 249.00},
    {"id": 13, "name": "Chicken Biryani", "price": 329.00},
    {"id": 14, "name": "Paneer Tikka Masala", "price": 299.00},
    {"id": 15, "name": "Paneer Butter Masala", "price": 279.00},
    {"id": 16, "name": "Butter Chicken", "price": 349.00},
    {"id": 17, "name": "Dal Makhani", "price": 229.00},
    {"id": 18, "name": "Mango Lassi", "price": 119.00},
    {"id": 19, "name": "Sweet Lassi", "price": 109.00},
    {"id": 20, "name": "Gulab Jamun", "price": 109.00},
    {"id": 21, "name": "Jalebi", "price": 119.00},
    {"id": 22, "name": "Chocolate Brownie", "price": 159.00},
    {"id": 23, "name": "Tiramisu", "price": 159.00},
    {"id": 24, "name": "Ice Cream Sundae", "price": 199.00},
    {"id": 25, "name": "Spaghetti Carbonara", "price": 329.00},
    {"id": 26, "name": "Lasagna", "price": 349.00},
    {"id": 27, "name": "Bruschetta", "price": 179.00},
    {"id": 28, "name": "Risotto ai Funghi", "price": 299.00},
    {"id": 29, "name": "Garlic Bread", "price": 129.00},
    {"id": 30, "name": "Masala Dosa", "price": 149.00},
    {"id": 31, "name": "Idli Sambar", "price": 129.00},
    {"id": 32, "name": "Poha", "price": 99.00},
    {"id": 33, "name": "Upma", "price": 109.00},
    {"id": 34, "name": "Samosa (2 pcs)", "price": 99.00},
    {"id": 35, "name": "Paneer Pakora", "price": 149.00},
    {"id": 36, "name": "Veg Cutlet", "price": 119.00},
    {"id": 37, "name": "Veg Spring Rolls", "price": 179.00},
    {"id": 38, "name": "Fresh Lime Soda", "price": 79.00},
    {"id": 39, "name": "Mango Juice", "price": 129.00}
]

# Time slots
time_slots = [
    "10:00-12:00", "12:00-14:00", "14:00-16:00", 
    "16:00-18:00", "18:00-20:00", "20:00-22:00"
]

# Age-based correlations
def get_age_group(age):
    if age <= 14: return "child"
    elif 15 <= age <= 24: return "young_adult"
    elif 25 <= age <= 40: return "adult"
    else: return "senior"

# Define correlations
bay_correlations = {
    "child": {
        "bays": [
            {"id": 5, "name": "Mega Screen", "weight": 40},
            {"id": 6, "name": "PlayStation Room", "weight": 40},
            {"id": 2, "name": "Football", "weight": 15},
            {"id": 1, "name": "Cricket", "weight": 5}
        ]
    },
    "young_adult": {
        "bays": [
            {"id": 1, "name": "Cricket", "weight": 30},
            {"id": 2, "name": "Football", "weight": 30},
            {"id": 4, "name": "VVIP Room", "weight": 20},
            {"id": 3, "name": "Golf", "weight": 10},
            {"id": 5, "name": "Mega Screen", "weight": 5},
            {"id": 6, "name": "PlayStation Room", "weight": 5}
        ]
    },
    "adult": {
        "bays": [
            {"id": 3, "name": "Golf", "weight": 35},
            {"id": 4, "name": "VVIP Room", "weight": 35},
            {"id": 1, "name": "Cricket", "weight": 15},
            {"id": 2, "name": "Football", "weight": 15}
        ]
    },
    "senior": {
        "bays": [
            {"id": 3, "name": "Golf", "weight": 50},
            {"id": 4, "name": "VVIP Room", "weight": 30},
            {"id": 1, "name": "Cricket", "weight": 10},
            {"id": 2, "name": "Football", "weight": 10}
        ]
    }
}

extra_correlations = {
    "child": [3, 4, 7, 8, 9, 10, 11, 24, 34, 38, 39],  # Fries, nuggets, sodas, ice cream, samosas
    "young_adult": [1, 2, 3, 4, 7, 8, 9, 10, 12, 13, 16, 24, 25, 26],  # Pizzas, biryanis, pasta, chicken
    "adult": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 28, 29, 30, 31],  # Indian mains, desserts, Italian
    "senior": [17, 18, 19, 20, 21, 30, 31, 32, 33, 35]  # Traditional Indian foods, lassi, snacks
}

# Date range (2024-2025)
start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 6, 14)
total_days = (end_date - start_date).days + 1

def connect_to_db():
    """Establish database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Database connection failed: {e}")
        return None

def generate_booking_ref():
    """Generate unique booking reference"""
    return 'STK' + ''.join(random.choices(string.digits, k=9))

def select_bay(age_group):
    """Select bay based on age group correlation"""
    group_data = bay_correlations[age_group]
    bays = [b["id"] for b in group_data["bays"]]
    weights = [b["weight"] for b in group_data["bays"]]
    return random.choices(bays, weights=weights)[0]

def select_extras(age_group):
    """Select extras based on age group correlation"""
    # 70% chance to order extras
    if random.random() > 0.7:
        return "", 0.0
    
    # Select 1-3 extras
    num_extras = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
    selected = random.sample(extra_correlations[age_group], num_extras)
    
    # Format extras string and calculate price
    extras_str = []
    total_price = 0.0
    for extra_id in selected:
        # Find extra details
        extra = next((e for e in extras if e["id"] == extra_id), None)
        if not extra:
            continue
        
        # Random quantity (1-3)
        quantity = random.choices([1, 2, 3], weights=[80, 15, 5])[0]
        extras_str.append(f"{quantity}-{get_food_name_by_id(extra_id)}")
        total_price += extra["price"] * quantity
    
    return ",".join(extras_str), total_price

def get_bay_price(bay_id):
    """Get price for a bay"""
    bay = next((b for b in bays if b["id"] == bay_id), None)
    return bay["price"] if bay else 0.0

def create_booking(user_id, age_group, booking_date, time_slot):
    """Create a booking record"""
    # Select bay based on age correlation
    bay_id = select_bay(age_group)
    bay_price = get_bay_price(bay_id)
    
    # Select participants based on age group
    if age_group == "child":
        participants = random.choices([1, 2, 3, 4], weights=[30, 40, 20, 10])[0]
    elif age_group == "young_adult":
        participants = random.choices([2, 3, 4, 5], weights=[20, 30, 30, 20])[0]
    else:  # adult/senior
        participants = random.choices([1, 2, 3, 4], weights=[20, 30, 30, 20])[0]
    
    # Select extras
    extras_str, extras_price = select_extras(age_group)
    
    # Calculate total price
    total_price = bay_price + extras_price
    
    return {
        "booking_ref": generate_booking_ref(),
        "user_id": user_id,
        "bay_id": bay_id,
        "booking_date": booking_date,
        "time_slot": time_slot,
        "participants": participants,
        "extras": extras_str,
        "booking_price": total_price
    }

def insert_bookings(bookings):
    """Insert bookings into database in batches"""
    conn = connect_to_db()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Insert in batches of 100
        for i in range(0, len(bookings), 100):
            batch = bookings[i:i+100]
            values = []
            for b in batch:
                values.append((
                    b["booking_ref"],
                    b["user_id"],
                    get_bay_name_by_id(b["bay_id"]),
                    b["booking_date"],
                    b["time_slot"],
                    b["participants"],
                    b["extras"],
                    b["booking_price"]
                ))
            
            query = """
                INSERT INTO bookings (
                    booking_ref, user_id, bay_type, booking_date, 
                    time_slot, participants, extras, booking_price
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.executemany(query, values)
            conn.commit()
            print(f"Inserted {len(batch)} bookings")
        
        return True
    except Error as e:
        print(f"Error inserting bookings: {e}")
        conn.rollback()
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def generate_bookings():
    """Generate and insert bookings for all users"""
    all_bookings = []
    stats = defaultdict(lambda: defaultdict(int))
    
    # Generate 8-10 bookings per user
    for user in users:
        num_bookings = random.randint(8, 10)
        age_group = get_age_group(user["age"])
        
        print(f"Generating {num_bookings} bookings for {user['name']} (age: {user['age']})")
        
        for _ in range(num_bookings):
            # Random date in range
            booking_date = start_date + timedelta(days=random.randint(0, total_days - 1))
            # Random time slot
            time_slot = random.choice(time_slots)
            
            booking = create_booking(user["id"], age_group, booking_date.strftime("%Y-%m-%d"), time_slot)
            all_bookings.append(booking)
            
            # Track stats
            stats[user["id"]]["bookings"] += 1
            stats[user["id"]]["total_price"] += booking["booking_price"]
            stats["bays"][booking["bay_id"]] += 1
    
    # Insert into database
    success = insert_bookings(all_bookings)
    
    # Print statistics
    print("\n=== Booking Generation Statistics ===")
    print(f"Total bookings generated: {len(all_bookings)}")
    print(f"Database insertion {'successful' if success else 'failed'}")
    
    print("\nPer User Stats:")
    for user_id, data in stats.items():
        if user_id == "bays":
            continue
        user = next(u for u in users if u["id"] == user_id)
        avg_price = data["total_price"] / data["bookings"]
        print(f"{user['name']} ({user['age']}): {data['bookings']} bookings, "
              f"Avg price: ₹{avg_price:.2f}, Total: ₹{data['total_price']:.2f}")
    
    print("\nBay Usage:")
    for bay_id, count in stats["bays"].items():
        bay = next(b for b in bays if b["id"] == bay_id)
        print(f"{bay['name']}: {count} bookings")

if __name__ == "__main__":
    generate_bookings()