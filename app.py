import json
from fastapi import FastAPI, HTTPException
import pandas as pd
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Dict, List, Optional, Any, Callable
from datetime import date, datetime
from agno.agent import Agent 
from agno.team.team import Team
from agno.tools import tool
from agno.models.nvidia import Nvidia
from agno.models.openrouter import OpenRouter
from agno.models.google import Gemini
import os
from dotenv import load_dotenv
from textwrap import dedent
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.storage.sqlite import SqliteStorage
from agno.vectordb.lancedb import LanceDb
from agno.vectordb.search import SearchType
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.embedder.sentence_transformer import SentenceTransformerEmbedder
from fastapi.middleware.cors import CORSMiddleware
import re
import random
import string
import mysql.connector
from mysql.connector import Error

load_dotenv()

NVIDIA_API_KEY="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"
OPENAI_API_KEY="sk-5D1jjhaFkR_mSukjnbq6-2nk6Coojhwot92sLCrHP_91oGWkok16lh6s7e_RNI" # gitleaks:allow
if not NVIDIA_API_KEY:
    raise ValueError("NVIDIA_API_KEY is not set in the environment variables.")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY is not set in the environment variables.")

GEMINI_API_KEY = os.getenv("GENIMI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GENIMI_API_KEY is not set in the environment variables.")

model = Gemini(id="gemini-2.0-flash", api_key="AIzaSyBU8FEf-tVriCDGb3Cw1oa3nM9s3Bhvhbjh")

memory_db = SqliteMemoryDb(
    table_name="memories",
    db_file="memory/memory.db"
)

memory = Memory(db=memory_db)

storage = SqliteStorage(
        table_name="team_sessions", 
        db_file="storage/data.db", 
        auto_upgrade_schema=True
)

vector_db = LanceDb(
    table_name="TeamDB",
    uri="temp/lancedb",
    search_type=SearchType.hybrid,
    embedder=SentenceTransformerEmbedder(id="sentence-transformers/all-MiniLM-L6-v2"),
)

knowledge_base = PDFKnowledgeBase(
    path="./knowledge",
    vector_db=vector_db,
    reader=PDFReader(chunk=True),
)


DB_CONFIG = {
    'host': os.getenv("DB_HOST", "localhost"),
    'port': int(os.getenv("DB_PORT", "3306")),
    'user': os.getenv("DB_USER", "root"),
    'password': os.getenv("DB_PASSWORD", "admin"),
    'database': os.getenv("DB_NAME", "agentdb")
}

def connect_to_db():
    """Establish database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Database connection failed: {e}")
        return None

def logger_hook(function_name: str, function_call: Callable, arguments: Dict[str, Any]):
    """Hook function that logs tool execution"""
    print(f"Calling {function_name} with arguments: {arguments}")
    result = function_call(**arguments)
    print(f"{function_name} completed with result: {result[:50]}{'...' if len(result) > 50 else ''}")
    return result

def time_to_minutes(time_str: str) -> int:
    """Convert HH:MM time string to minutes since midnight"""
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes

def minutes_to_time(minutes: int) -> str:
    """Convert minutes since midnight to HH:MM time string"""
    hours = minutes // 60
    minutes = minutes % 60
    return f"{hours:02d}:{minutes:02d}"

def parse_extras(extras_str):
    """Parse extras string into food items with quantities."""
    items = {}
    if not extras_str:
        return items
        
    entries = re.findall(r'(\d+)-([^,]+)', extras_str)
    for qty, item in entries:
        try:
            items[item.strip()] = items.get(item.strip(), 0) + int(qty)
        except ValueError:
            continue
    return items

def fetch_available_slots_fn(bay_type: str, date: str) -> str:
    """
    Fetches available time slots for a specific bay type and date.
    
    Args:
        bay_type: Type of bay (golf/cricket/vvip room/football/mega screen/playstation room)
        date: Date in YYYY-MM-DD format
        
    Returns:
        JSON string with available time slots
    """
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    if not re.match(date_pattern, date):
        return "Invalid date format. Expected format: YYYY-MM-DD"
    
    bay_type=bay_type.lower()
    valid_bay_types = ['golf', 'cricket', 'vvip room', 'football', 'mega screen', 'playstation room']
    if bay_type not in valid_bay_types:
        return f"Invalid bay type. Must be one of: {', '.join(valid_bay_types)}"
    
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT time_slot 
            FROM bookings 
            WHERE bay_type = %s 
            AND booking_date = %s
        """
        cursor.execute(query, (bay_type, date))
        existing_bookings = [row[0] for row in cursor.fetchall()]
        
        operating_hours = (10 * 60, 22 * 60)
        
        booked_ranges = []
        for slot in existing_bookings:
            if not re.match(r'^\d{2}:\d{2}-\d{2}:\d{2}$', slot):
                continue
            start_str, end_str = slot.split('-')
            start_min = time_to_minutes(start_str)
            end_min = time_to_minutes(end_str)
            booked_ranges.append((start_min, end_min))
        
        booked_ranges.sort(key=lambda x: x[0])
        
        merged_ranges = []
        if booked_ranges:
            current_start, current_end = booked_ranges[0]
            for start, end in booked_ranges[1:]:
                if start <= current_end:
                    current_end = max(current_end, end)
                else:
                    merged_ranges.append((current_start, current_end))
                    current_start, current_end = start, end
            merged_ranges.append((current_start, current_end))
        
        available_slots = []
        current_time = operating_hours[0] 
        
        for start, end in merged_ranges:
            if current_time < start:
                available_slots.append((
                    current_time,
                    min(start, operating_hours[1])
                ))
            current_time = max(current_time, end)
        
        if current_time < operating_hours[1]:
            available_slots.append((current_time, operating_hours[1]))
        
        formatted_slots = []
        for start_min, end_min in available_slots:
            if end_min - start_min >= 30:
                start_time = minutes_to_time(start_min)
                end_time = minutes_to_time(end_min)
                formatted_slots.append(f"{start_time}-{end_time}")
        
        return json.dumps({
            "bay_type": bay_type,
            "date": date,
            "available_slots": formatted_slots
        })
    
    except Error as e:
        return f"Query failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@tool(
    name="fetch_available_slots",
    description="Fetches available time slots for a bay type on a given date",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook],
)
def fetch_available_slots_tool(bay_type: str, date: str) -> str:
    """
    Fetches available time slots for a specific bay type and date.
    
    Args:
        bay_type: Type of bay (golf/cricket/vvip room/football/mega screen/playstation room)
        date: Date in YYYY-MM-DD format
        
    Returns:
        JSON string with available time slots
    """
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    if not re.match(date_pattern, date):
        return "Invalid date format. Expected format: YYYY-MM-DD"
    
    bay_type=bay_type.lower()
    
    valid_bay_types = ['golf', 'cricket', 'vvip room', 'football', 'mega screen', 'playstation room']
    if bay_type not in valid_bay_types:
        return f"Invalid bay type. Must be one of: {', '.join(valid_bay_types)}"
    
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT time_slot 
            FROM bookings 
            WHERE bay_type = %s 
            AND booking_date = %s
        """
        cursor.execute(query, (bay_type, date))
        existing_bookings = [row[0] for row in cursor.fetchall()]
        
        operating_hours = (10 * 60, 22 * 60)
        
        booked_ranges = []
        for slot in existing_bookings:
            if not re.match(r'^\d{2}:\d{2}-\d{2}:\d{2}$', slot):
                continue
            start_str, end_str = slot.split('-')
            start_min = time_to_minutes(start_str)
            end_min = time_to_minutes(end_str)
            booked_ranges.append((start_min, end_min))
        
        booked_ranges.sort(key=lambda x: x[0])
        
        merged_ranges = []
        if booked_ranges:
            current_start, current_end = booked_ranges[0]
            for start, end in booked_ranges[1:]:
                if start <= current_end:
                    current_end = max(current_end, end)
                else:
                    merged_ranges.append((current_start, current_end))
                    current_start, current_end = start, end
            merged_ranges.append((current_start, current_end))
        
        available_slots = []
        current_time = operating_hours[0]
        
        for start, end in merged_ranges:
            if current_time < start:
                available_slots.append((
                    current_time,
                    min(start, operating_hours[1])
                ))
            current_time = max(current_time, end)
        
        if current_time < operating_hours[1]:
            available_slots.append((current_time, operating_hours[1]))
        
        formatted_slots = []
        for start_min, end_min in available_slots:
            if end_min - start_min >= 30:
                start_time = minutes_to_time(start_min)
                end_time = minutes_to_time(end_min)
                formatted_slots.append(f"{start_time}-{end_time}")
        
        return json.dumps({
            "bay_type": bay_type,
            "date": date,
            "available_slots": formatted_slots
        })
    
    except Error as e:
        return f"Query failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@tool(
    name="get_bay_recommendations",
    description="Recommends activities based on cross-booking patterns using correlation matrix for users with past booking, for new user it recommends based on the age group popularity",
    requires_confirmation=False,
    show_result=True
)
def get_bay_recommendations_tool() -> str:
    """
        Recommends activities based on user's last booked activity using correlation matrix and Popularity Index if user has past booking. For new user it recommends based on the age group popularity

    """
    conn = connect_to_db()
    cursor = conn.cursor()
    user_id=strikin_team.team_session_state["user_details"]["user_id"]
        
    cursor.execute("""
        SELECT bay_type, COUNT(*) AS booking_count
        FROM bookings
        GROUP BY bay_type
    """)
    activity_data = cursor.fetchall()
    
    cursor.execute("""
        SELECT user_id, bay_type, COUNT(*) AS bookings
        FROM bookings
        GROUP BY user_id, bay_type
    """)
    user_activity_matrix = pd.DataFrame(cursor.fetchall(), 
                                       columns=['user_id','bay_type','bookings'])
    
    pivot_table = user_activity_matrix.pivot_table(
        index='user_id', 
        columns='bay_type', 
        values='bookings', 
        fill_value=0
    ) 
    
    correlation_matrix = pivot_table.corr(method='pearson')
    
    cursor.execute("""
        SELECT bay_type 
        FROM bookings 
        WHERE user_id=%s 
        ORDER BY booking_date DESC 
        LIMIT 1
    """, (user_id,))
    last_activity = cursor.fetchone()
    
    if not last_activity:
        cursor.execute("""
        SELECT age 
        FROM users 
        WHERE user_id=%s 
        """, (user_id,))
        row = cursor.fetchone()
        
        if row is not None:
            age = row[0]
        else:
            age = None
        return get_bay_recommendations_by_age_tool(age)
    
    last_activity = last_activity[0]
    
    # recommendations = correlation_matrix[last_activity].sort_values(ascending=False)[1:4]
    
    correlated = correlation_matrix[last_activity].sort_values(ascending=False)
    top_bays = correlated.index.drop(last_activity)[:3].tolist()
    # return json.dumps({
    #     "based_on": last_activity,
    #     "recommendations": recommendations.index.tolist(),
    # })
    
    recommendation_string=f"Interested in {last_activity}, Try out : {top_bays}"
    return recommendation_string

def get_bay_recommendations_by_age_tool(age: int) -> str:
    """
    Recommends activities for new users based on age-based popularity
    
    Args:
        age: User's current age
        
    Returns:
        string with recommended activities and popularity scores
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor(dictionary=True)
        try:
            age = int(age)
        except (TypeError, ValueError):
            age = 21 
            
        age_groups = {
            'Under 18': (0, 17),
            '18-28': (18, 28),
            '29-35': (29, 35),
            '36-41': (36, 41),
            '42+': (42, 120)
        }
        
        user_age_group = '18-28' 
        for group, (min_age, max_age) in age_groups.items():
            if min_age <= age <= max_age:
                user_age_group = group
                break
                
        query = """
            SELECT 
                b.bay_type AS activity,
                COUNT(*) AS booking_count
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE u.age BETWEEN %s AND %s
            GROUP BY b.bay_type
            ORDER BY booking_count DESC
            LIMIT 4
        """
        
        min_age, max_age = age_groups[user_age_group]
        cursor.execute(query, (min_age, max_age))
        results = cursor.fetchall()
        
        if not results:
            cursor.execute("""
                SELECT bay_type AS activity, COUNT(*) AS booking_count
                FROM bookings
                GROUP BY bay_type
                ORDER BY booking_count DESC
                LIMIT 4
            """)
            results = cursor.fetchall()
            user_age_group = "all ages"
        
        booking_counts = [int(row['booking_count']) for row in results]
        max_count = max(booking_counts) if booking_counts else 1
        
        recommendations = []
        for i, result in enumerate(results):
            count = int(result['booking_count'])
            popularity = round(count / max_count * 100)

            recommendations.append(result['activity'])            
            # recommendations.append({
            #     result['activity']
            #     # 'popularity_score': f"{popularity}%",
            #     # 'age_group': user_age_group,
            # })
        
        return f"Try out the bays {recommendations}"
        
    except Error as e:
        return f"Query failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@tool(
    name="get_food_recommendations_by_user",
    description="Recommends food items form the menu based on booking patterns and age group",
    requires_confirmation=False,
    show_result=True
)
def get_menu_recommendations_by_user_tool() -> str:
    """
    Recommends food items based on user's order history or age group popularity.
        
    Returns:
        String with recommended food items
    """
    conn = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor(dictionary=True)
        user_id=strikin_team.team_session_state["user_details"]["user_id"]

        cursor.execute("""
            SELECT extras FROM bookings
            WHERE user_id = %s AND extras IS NOT NULL AND extras != ''
        """, (user_id,))
        user_bookings = cursor.fetchall()
        
        food_counts = {}
        if user_bookings:
            for booking in user_bookings:
                items = parse_extras(booking['extras'])
                for item, qty in items.items():
                    food_counts[item] = food_counts.get(item, 0) + qty
            
            if food_counts:
                sorted_items = sorted(food_counts.items(), key=lambda x: x[1], reverse=True)[:4]
                max_count = sorted_items[0][1] if sorted_items else 1
                
                recommendations = []
                for rank, (item, count) in enumerate(sorted_items, start=1):
                    popularity = round(count / max_count * 100)
                    recommendations.append({
                        'item': item,
                        'popularity_score': f"{popularity}%",
                        'rank': rank,
                        'source': 'user_history'
                    })
                return json.dumps(recommendations, indent=2)
        
        cursor.execute("SELECT age FROM users WHERE user_id = %s", (user_id,))
        user_data = cursor.fetchone()
        age = user_data['age'] if user_data and user_data['age'] is not None else 21
        
        age_groups = {
            'Under 18': (0, 17),
            '18-28': (18, 28),
            '29-35': (29, 35),
            '36-41': (36, 41),
            '42+': (42, 120)
        }
        
        user_age_group = next(
            (group for group, (min_a, max_a) in age_groups.items() 
             if min_a <= age <= max_a),
            '18-28'
        )
        min_age, max_age = age_groups[user_age_group]
        
        cursor.execute("""
            SELECT extras FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            WHERE u.age BETWEEN %s AND %s 
            AND extras IS NOT NULL 
            AND extras != ''
        """, (min_age, max_age))
        age_bookings = cursor.fetchall()
        
        age_food_counts = {}
        for booking in age_bookings:
            items = parse_extras(booking['extras'])
            for item, qty in items.items():
                age_food_counts[item] = age_food_counts.get(item, 0) + qty
        
        if not age_food_counts:
            cursor.execute("""
                SELECT extras FROM bookings
                WHERE extras IS NOT NULL AND extras != ''
            """)
            all_bookings = cursor.fetchall()
            for booking in all_bookings:
                items = parse_extras(booking['extras'])
                for item, qty in items.items():
                    age_food_counts[item] = age_food_counts.get(item, 0) + qty
            user_age_group = "all users"
        
        sorted_items = sorted(age_food_counts.items(), key=lambda x: x[1], reverse=True)[:4]
        max_count = sorted_items[0][1] if sorted_items else 1
        
        recommendations = []
        for rank, (item, count) in enumerate(sorted_items, start=1):
            popularity = round(count / max_count * 100)
            recommendations.append({
                'item': item,
                'popularity_score': f"{popularity}%",
                'rank': rank,
                'source': user_age_group
            })
        
        return json.dumps(recommendations, indent=2)
        
    except Error as e:
        return json.dumps({"error": str(e)})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@tool(
    name="check_availability",
    description="Checks availability of bays for a given date and time slot",
    requires_confirmation=False,
    show_result=False,
    tool_hooks=[logger_hook],
    cache_results=True,
    cache_ttl=300
)
def check_availability_tool(bay_type: str, date: str, time_slot: str) -> str:
    """
    Check bay availability in the database with time slot format.
    
    Args:
        bay_type: Type of bay (golf/cricket/VVIP Room/Football/Mega Screen/PlayStation Room)
        date: Booking date in YYYY-MM-DD format
        time_slot: Time slot in HH:MM-HH:MM format (e.g., '10:00-12:00')
        
    Returns:
        "Available", "Not available", or error message with alternative slots
    """
    time_slot_pattern = r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
    
    if not re.match(time_slot_pattern, time_slot):
        return "Invalid time slot format. Expected format: HH:MM-HH:MM"
    
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    if not re.match(date_pattern, date):
        return "Invalid date format. Expected format: YYYY-MM-DD"
    
    bay_type=bay_type.lower()
    valid_bay_types = ['golf', 'cricket', 'vvip room', 'football', 'mega screen', 'playstation room']
    if bay_type not in valid_bay_types:
        return f"Invalid bay type. Must be one of: {', '.join(valid_bay_types)}"
    
    start_time, end_time = time_slot.split('-')
    start_minutes = time_to_minutes(start_time)
    end_minutes = time_to_minutes(end_time)
    
    if start_minutes >= end_minutes:
        return "Invalid time slot: Start time must be before end time"
    
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT time_slot 
            FROM bookings 
            WHERE bay_type = %s 
            AND booking_date = %s
        """
        cursor.execute(query, (bay_type, date))
        existing_bookings = cursor.fetchall()
        
        input_start_minutes = start_minutes
        input_end_minutes = end_minutes
        
        for booking in existing_bookings:
            existing_slot = booking[0]
            
            if not re.match(time_slot_pattern, existing_slot):
                continue
            
            existing_start, existing_end = existing_slot.split('-')
            existing_start_minutes = time_to_minutes(existing_start)
            existing_end_minutes = time_to_minutes(existing_end)
            
            if (input_start_minutes < existing_end_minutes and 
                input_end_minutes > existing_start_minutes):
                alt_slots = fetch_available_slots_fn(bay_type, date)
                try:
                    slots_data = json.loads(alt_slots)
                    if "available_slots" in slots_data:
                        return (f"Time slot is not available. "
                                f"Alternative slots: {', '.join(slots_data['available_slots'])}")
                except:
                    pass
                return "Time slot is not available. Please try another time."
        
        return "Available"
    except Error as e:
        return f"Query failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            
def check_availability_tool_fn(bay_type: str, date: str, time_slot: str) -> str:
    """
    Check bay availability in the database with time slot format.
    
    Args:
        bay_type: Type of bay (golf/cricket/VVIP Room/Football/Mega Screen/PlayStation Room)
        date: Booking date in YYYY-MM-DD format
        time_slot: Time slot in HH:MM-HH:MM format (e.g., '10:00-12:00')
        
    Returns:
        "Available", "Not available", or error message with alternative slots
    """
    time_slot_pattern = r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
    
    if not re.match(time_slot_pattern, time_slot):
        return "Invalid time slot format. Expected format: HH:MM-HH:MM"
    
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    if not re.match(date_pattern, date):
        return "Invalid date format. Expected format: YYYY-MM-DD"
    
    bay_type=bay_type.lower()
    valid_bay_types = ['golf', 'cricket', 'vvip room', 'football', 'mega screen', 'playstation room']
    if bay_type not in valid_bay_types:
        return f"Invalid bay type. Must be one of: {', '.join(valid_bay_types)}"
    
    start_time, end_time = time_slot.split('-')
    start_minutes = time_to_minutes(start_time)
    end_minutes = time_to_minutes(end_time)
    
    if start_minutes >= end_minutes:
        return "Invalid time slot: Start time must be before end time"
    
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor()
        query = """
            SELECT time_slot 
            FROM bookings 
            WHERE bay_type = %s 
            AND booking_date = %s
        """
        cursor.execute(query, (bay_type, date))
        existing_bookings = cursor.fetchall()
        
        input_start_minutes = start_minutes
        input_end_minutes = end_minutes
        
        for booking in existing_bookings:
            existing_slot = booking[0]
            
            if not re.match(time_slot_pattern, existing_slot):
                continue 
            
            existing_start, existing_end = existing_slot.split('-')
            existing_start_minutes = time_to_minutes(existing_start)
            existing_end_minutes = time_to_minutes(existing_end)
            
            if (input_start_minutes < existing_end_minutes and 
                input_end_minutes > existing_start_minutes):
                alt_slots = fetch_available_slots_fn(bay_type, date)
                try:
                    slots_data = json.loads(alt_slots)
                    if "available_slots" in slots_data:
                        return (f"Time slot is not available. "
                                f"Alternative slots: {', '.join(slots_data['available_slots'])}")
                except:
                    pass
                return "Time slot is not available. Please try another time."
        
        return "Available"
    except Error as e:
        return f"Query failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            
@tool(
    name="create_booking",
    description="Creates a new booking with pricing calculation",
    requires_confirmation=False,
    show_result=False,
    stop_after_tool_call=False,
    tool_hooks=[logger_hook],
    requires_user_input=False,
)
def create_booking_tool(
    transaction_ref: str,
    bay_type: str,
    booking_date: str,
    time_slot: str,
    participants: int,
    food_items: dict,
    booking_price: float,
) -> str:
    """
    Create a new booking with price calculation for both bay and food items.
    
    Args:
        transaction_ref: Transaction reference for the payment
        bay_type: Type of bay
        booking_date: Date in YYYY-MM-DD format
        time_slot: Time slot (e.g., '10:00-12:00')
        participants: Number of participants
        food_items: Dictionary of food items with quantities
        booking_price: Total booking price
        
    Returns:
        Booking reference and Transaction reference number with total price
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor(dictionary=True)
        bay_type = bay_type.lower()
        
        availability=check_availability_tool_fn(bay_type=bay_type, date=booking_date, time_slot=time_slot)

        if availability!='Available':
            return availability
        
        userid=strikin_team.team_session_state["user_details"]["user_id"]
        
        extras_list = []
        
        if food_items:            
            for item, quantity in food_items.items():
                extras_list.append(f"{quantity}- {item}")
        
        extras_str = ", ".join(extras_list) if extras_list else ""
                
        booking_ref = 'STK' + ''.join(random.choices(string.digits, k=9))
        
        query = """
            INSERT INTO bookings (
                booking_ref, transaction_ref, user_id, bay_type, 
                booking_date, time_slot, participants, 
                extras, booking_price
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            booking_ref,
            transaction_ref,
            userid,
            bay_type,
            booking_date,
            time_slot,
            participants,
            extras_str,
            booking_price
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        return (
            f"Booking created! Reference: {booking_ref}\n"
            f"Transaction Reference: {transaction_ref}\n"
            f"Food items: {extras_str}\n"
            f"Total: ₹{booking_price:.2f}"
        )
        
    except Error as e:
        return f"Booking creation failed: {e}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            
@tool(
    name="get_user_bookings",
    description="Fetches all bookings for a specific user",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook],
)
def get_user_bookings_tool() -> str:
    """
    Retrieves all bookings for a user from the database in tabular format
        
    Returns:
        JSON string with booking details
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        user_id=strikin_team.team_session_state["user_details"]["user_id"]
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT booking_ref, bay_type, booking_date, time_slot, participants, extras
            FROM bookings 
            WHERE user_id = %s
            ORDER BY booking_date DESC, time_slot DESC
        """
        cursor.execute(query, (user_id,))
        bookings = cursor.fetchall()
        
        if not bookings:
            return "No bookings found for this user, means they are new user"
            
        for booking in bookings:
            booking['time_slot'] = booking['time_slot'].replace('-', ' to ') if booking['time_slot'] else ""
            
        return json.dumps(bookings, default=str)
    except Error as e:
        return f"Query failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@tool(
    name="get_bay_details",
    description="Fetches all bay types with pricing",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def get_bay_details_tool() -> str:
    """
    Retrieves all available bay types with their pricing and features
    
    Returns:
        JSON string with bay details: name, price_per_hour
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                bay_name AS name,
                price_per_hour AS price
            FROM Bay
            ORDER BY price_per_hour DESC
        """)
        bays = cursor.fetchall()
        
        for bay in bays:
            bay['price'] = float(bay['price'])
        
        return json.dumps(bays, indent=2)
        
    except Error as e:
        return f"Error in getting bays: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@tool(
    name="get_menu_items",
    description="Fetches all food menu items with pricing",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def get_menu_items_tool() -> str:
    """
    Retrieves all food items with their prices
    
    Returns:
        JSON string with menu items: food_item, price
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                food_item AS name,
                price
            FROM Menu
            ORDER BY price DESC
        """)
        menu_items = cursor.fetchall()
        
        for item in menu_items:
            item['price'] = float(item['price'])
        
        return json.dumps(menu_items, indent=2)
        
    except Error as e:
        return f"Error in getting menu: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def get_discounts(
    booking_date: str, 
    booking_amount: float,
    time_slot: str   
) -> dict:
    try:
        booking_date = datetime.strptime(booking_date, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid booking_date format, expected 'YYYY-MM-DD'"}

    try:
        start_str, end_str = time_slot.split('-')
        t0 = datetime.strptime(start_str, "%H:%M")
        t1 = datetime.strptime(end_str,   "%H:%M")
        duration_hours = (t1 - t0).total_seconds() / 3600.0
        if duration_hours <= 0:
            return {"error": "time_slot end must be after start"}
    except Exception:
        return {"error": "Invalid time_slot format, expected 'HH:MM-HH:MM'"}

    conn = connect_to_db()
    if not conn:
        return {"error": "Database connection failed"}
    try:
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT *
              FROM discounts
             WHERE (start_date IS NULL OR start_date <= %s)
               AND (  end_date IS NULL OR   end_date >= %s)
               AND min_booking_amount <= %s
             ORDER BY discount_percentage DESC
             LIMIT 1
        """
        cursor.execute(sql, (booking_date, booking_date, booking_amount))
        table_discounts = cursor.fetchall()

        applied_discounts = []
        remaining = booking_amount

        for d in table_discounts:
            pct = float(d["discount_percentage"])
            savings = remaining * (pct / 100)
            remaining -= savings
            applied_discounts.append({
                "name":       d["discount_name"],
                "percentage": pct
            })

        wd = booking_date.weekday()  
        is_weekend = wd >= 4     
        f = 0.0
        if duration_hours >= 7:
            f = 0.06 if is_weekend else 0.08
        elif duration_hours >= 5:
            f = 0.04 if is_weekend else 0.06
        elif duration_hours >= 3:
            f = 0.02 if is_weekend else 0.03
        elif duration_hours >= 2:
            f = 0.01 if is_weekend else 0.02

        if f > 0:
            savings = remaining * f
            remaining -= savings
            applied_discounts.append({
                "name":       "Duration-based discount",
                "percentage": round(f * 100, 2)
            })

        return {
            "applied_discounts": applied_discounts,
            "final_amount":      round(remaining, 2)
        }

    except Error as e:
        return {"error": f"Database error: {e}"}
    finally:
        cursor.close()
        conn.close()

@tool(
    name="get_total_payment",
    description="Calculates the total payment amount for a booking including bay and food costs",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def get_total_payment_tool(
    bay_type: str,
    booking_date: str,
    time_slot: str,
    food_items: dict
) -> str:
    """
    Calculates total payment for bay booking and food items
    
    Args:
        bay_type: Type of bay (cricket, football, etc.)
        booking_date: Date for which the booking is made (2025-07-12)
        time_slot: Booking time slot (e.g., "10:00-12:00")
        food_items: Dictionary of {food_item: quantity}
        
    Returns:
        JSON with bay_cost, food_cost, and total_price
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor(dictionary=True)
        bay_type = bay_type.lower()
        
        cursor.execute("SELECT price_per_hour FROM Bay WHERE bay_name = %s", (bay_type,))
        bay_price_row = cursor.fetchone()
        if not bay_price_row:
            return json.dumps({"error": f"Bay type '{bay_type}' not found"})
        
        start_time, end_time = time_slot.split('-')
        start = datetime.strptime(start_time, "%H:%M")
        end = datetime.strptime(end_time, "%H:%M")
        duration_hours = (end - start).total_seconds() / 3600
        
        bay_price_per_hour = float(bay_price_row['price_per_hour'])
        bay_cost = bay_price_per_hour * duration_hours
        
        food_cost = 0.0
        if food_items:
            cursor.execute("SELECT food_item, price FROM menu")
            menu_map = {}
            for row in cursor.fetchall():
                lower_name = row['food_item'].lower()
                menu_map[lower_name] = float(row['price'])
            
            for item, quantity in food_items.items():
                lower_item = item.lower()
                if lower_item not in menu_map:
                    return json.dumps({
                        "error": f"Food item '{item}' not found",
                        "valid_items": list(menu_map.keys())
                    })
                food_cost += menu_map[lower_item] * quantity
        
        booking_price = bay_cost + food_cost
        
        discounts=get_discounts(booking_date, booking_price, time_slot)
        
        return json.dumps({
            "bay_cost": bay_cost,
            "food_cost": food_cost,
            "original price": booking_price,
            "applied discounts": discounts["applied_discounts"],
            "booking price": discounts["final_amount"]
        }, indent=2)
        
    except Error as e:
        return json.dumps({"error": f"Calculation failed: {str(e)}"})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            
@tool(
    name="process_payment",
    description="Processes a payment and saves transaction details",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def process_payment_tool(
    booking_price: float,
    payment_method: str,
) -> str:
    """
    Saves payment information to the database
    
    Args:
        Booking price: Total booking price
        payment_method: 'card', 'upi', or 'netbanking'
                
    Returns:
        Payment confirmation message
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor()

        transaction_ref = 'TXN' + ''.join(random.choices(string.digits, k=10))
                
        query = """
            INSERT INTO payments (
                transaction_ref, booking_amount, payment_method
            ) VALUES (%s, %s, %s)
        """
        values = (
            transaction_ref,
            booking_price,
            payment_method
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        return f"Payment successful! Transaction ref: {transaction_ref}, Booking price: {booking_price}"
        
    except Error as e:
        return f"Payment processing failed: {e}"
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            
@tool(
    name="handle_feedback",
    description="Stores user feedback in the database with bay type and feedback text",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def handle_feedback_tool(feedback_title: str, feedback: str) -> str:
    """
    Stores user feedback in the feedback_table
    
    Args:
        feedback_title: Short title of the feedback
        feedback: The user's feedback text
        
    Returns:
        Success message or error description
    """
    
    if not feedback_title or not feedback:
        return "Both feedback_title and feedback are required"

    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        
        user_id=strikin_team.team_session_state["user_details"]["user_id"]
        
        cursor = conn.cursor()
        query = """
        INSERT INTO feedback_table (user_id, feedback_title, feedback)
        VALUES (%s, %s, %s)
        """
        cursor.execute(query, (user_id, feedback_title, feedback))
        conn.commit()
        
        return f"Feedback for '{feedback_title}' stored successfully"
        
    except Exception as e:
        return "Failed to store feedback. Please try again later."
    finally:
        if conn:
            conn.close()
@tool(
    name="get_event_details",
    description="Fetches upcoming events occurring after today's date",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def get_event_details_tool() -> str:
    """
    Fetches events from the database where the event date is after today.

    Returns:
        A string containing the list of upcoming events or an appropriate error message.
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"

    try:
        cursor = conn.cursor()
        today = date.today().isoformat()

        query = """
        SELECT event_name, event_description, event_date 
        FROM events
        WHERE event_date > %s 
        ORDER BY event_date ASC
        """
        cursor.execute(query, (today,))
        events = cursor.fetchall()

        if not events:
            return "No upcoming events found."

        response_lines = ["**See you at our Upcoming Events:**"]
        for name, event_date, desc in events:
            response_lines.append(f"\n- **{name}** on {event_date} \n  _{desc}_")

        return "\n".join(response_lines)

    except Exception as e:
        logger_hook(f"Failed to fetch event details: {str(e)}")
        return f"Failed to fetch events: {str(e)}"
    finally:
        if conn:
            conn.close()

@tool(
    name="fetch_future_bookings",
    description="Fetches upcoming bookings for a user that haven't occurred yet",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def fetch_future_bookings_tool() -> list:
    """
    Retrieves future bookings from the database for a specific user
        
    Returns:
        List of dictionaries with booking details or error message
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor(dictionary=True)
        current_time = datetime.now()
        current_date = current_time.date()
        current_time_str = current_time.strftime("%H:%M")
        user_id= strikin_team.team_session_state["user_details"]["user_id"]
        
        query = """
        SELECT booking_ref, bay_type, booking_date, time_slot, 
               participants, extras, booking_price
        FROM bookings 
        WHERE user_id = %s 
            AND (
                booking_date > %s 
                OR (
                    booking_date = %s 
                    AND SUBSTRING_INDEX(time_slot, '-', 1) > %s
                )
            )
        ORDER BY booking_date, SUBSTRING_INDEX(time_slot, '-', 1)
        """
        cursor.execute(query, (user_id, current_date, current_date, current_time_str))
        bookings = cursor.fetchall()
        
        if not bookings:
            return "No upcoming bookings found"
            
        return bookings
        
    except Exception as e:
        logger_hook(f"Failed to fetch bookings: {str(e)}")
        return f"Error retrieving bookings: {str(e)}"
    finally:
        if conn:
            conn.close()
            
@tool(
    name="delete_booking",
    description="Deletes a specific booking and its corresponding payment transaction",
    requires_confirmation=False,
    show_result=True,
    tool_hooks=[logger_hook]
)
def delete_booking_tool(booking_ref: str) -> str:
    """
    Deletes a booking record and its payment transaction from the database
    
    Args:
        booking_ref: Unique reference of the booking to delete
        
    Returns:
        Success message or error description
    """
    conn = connect_to_db()
    if not conn:
        return "Database connection error"
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT transaction_ref FROM bookings WHERE booking_ref = %s", (booking_ref,))
        booking_record = cursor.fetchone()
        
        if not booking_record:
            return "Booking does not exist"
            
        transaction_ref = booking_record[0]
        
        cursor.execute("DELETE FROM bookings WHERE booking_ref = %s", (booking_ref,))
        
        if transaction_ref:
            cursor.execute("DELETE FROM payments WHERE transaction_ref = %s", (transaction_ref,))
        
        conn.commit()
        
        if transaction_ref:
            return f"Booking {booking_ref} and payment {transaction_ref} cancelled successfully"
        else:
            return f"Booking {booking_ref} cancelled successfully (no payment found)"
        
    except Exception as e:
        conn.rollback()
        logger_hook(f"Booking deletion failed: {str(e)}")
        return f"Failed to cancel booking: {str(e)}"
    finally:
        if conn:
            conn.close()
            
booking_agent = Agent(
    name="Booking Agent",
    role="Handles bay and dining reservations",
    model=model,
    description="Manages the complete booking process",
    instructions=dedent(f"""\
        You handle STRIKIN bookings following this workflow:
        
        1. Collect the following data sequentially:
           a) Bay type - Cricket/Football/Golf/VVIP Room/Mega Screen/PlayStation Room
           b) Date (YYYY-MM-DD after today)
           c) Time slot (HH:MM-HH:MM between 10AM-10PM)

        2. Use 'check_availability' tool with bay_type, date, time_slot
        
        3. If available follow the below steps:
           a) Ask participants count
           b) Ask about extras by showing the Menu or recommend menu items using 'Menu Recommendation agent' and ask the quantities for the Menu food items before proceeding
           c) Definetly make the payment using the 'Payment agent' (after making the payment only move to the booking creation)
           d) Use 'create_booking' tool to make the booking
           e) Confirm the pricing from the user
           f) Show confirmation
           
        Rules:
        - Always verify availability
        - If you face any difficulties in the booking make the payment using the 'Payment agent'
        - After taking all details, go to payments using 'Payment agent'
        - Then save the booking details in using the create_booking_tool"""),
    tools=[check_availability_tool, create_booking_tool, fetch_available_slots_tool, get_user_bookings_tool, fetch_future_bookings_tool, get_menu_items_tool],
    markdown=True,
    show_tool_calls=True,
    # memory=memory,
    add_history_to_messages=True,
    # num_history_runs=10,
    add_datetime_to_instructions=True,
)

cancellation_agent = Agent(
    name="Cancellation Agent",
    role="Handles booking cancellations and refunds",
    model=model,
    description="Manages the booking cancellation process from start to finish",
    instructions=dedent("""
        You are a helpful assistant that handles booking cancellations. Follow these steps:
        1. Fetch their upcoming bookings using 'fetch_future_bookings' tool
        2. Present the list of bookings to the user in a numbered format showing:
           - Booking Reference
           - Bay Type
           - Date
           - Time Slot
           - Participants
           - Extras
           - Price
        3. Ask the user to select which booking they want to cancel by entering the booking reference
        4. Use the 'delete_booking' tool with the corresponding booking_ref
        5. After successful cancellation, inform the user:
           "Your booking has been cancelled. Your money will be refunded within 5-6 working days."
        
        Important Rules:
        - Always verify bookings belong to the user
        - If no bookings exist, inform the user immediately
        - Handle errors gracefully and provide clear explanations
        - Never proceed without explicit user confirmation
        - Always show booking details before deletion
        - Confirm successful cancellation with refund timeline
    """),
    tools=[fetch_future_bookings_tool, delete_booking_tool],
    markdown=True,
    show_tool_calls=True,
    add_history_to_messages=True,
    # num_history_runs=10,
    add_datetime_to_instructions=True,
)

payment_agent = Agent(
    name="Payment Agent",
    role="Handles payment processing for bookings",
    model=model,
    description="Manages the payment workflow including calculation and processing",
    instructions=dedent(f"""\
        Handle payment processing with these steps:
        1. Calculate total using 'get_total_payment' tool in rupees and list out the discount applied to the amount
        2. Then present payment options to user to make the payment:
           a) Credit/Debit Card
           b) UPI
           c) Net Banking
           
        3. Collect payment details based on selected method and then proceed:
           - For Card: Ask the Card number, expiry, CVV
           - For UPI: Ask UPI ID
           - For Net Banking: Ask Bank name, user name
           
        4. Finally process payment using 'process_payment' tool
        5. Send payment confirmation to user
        6. Finally complete the booking by using the create_booking_tool
        
        Rules:
        - Always show price breakdown in rupees before payment
        - Collect all the required payment details before confirming the final payment
        - Handle payment failures gracefully
        - Mask sensitive data in confirmation messages"""),
    
    tools=[get_total_payment_tool, process_payment_tool, create_booking_tool],
    markdown=True,
    show_tool_calls=True,
    # memory=memory,
    add_history_to_messages=True,
    # num_history_runs=10,
    add_datetime_to_instructions=True,
)

bay_recommendation_agent = Agent(
    name="Bay Recommendation Agent",
    role="gets the Recommendations for bay types",
    model=model,
    description="gives the bay recommendations based on user history and preferences",
    instructions=dedent(f"""\
        Handles the recommendations for the users
        Give appropriate bay recommendations using get_bay_recommendations_tool
    """),
    tools=[get_bay_recommendations_tool],
    markdown=True,
    # memory=memory,
    add_history_to_messages=True,
    # num_history_runs=10,
    add_datetime_to_instructions=True,
)

menu_recommendation_agent = Agent(
    name="Menu Recommendation Agent",
    role="gets the Recommendations of the menu items",
    model=model,
    description="gives the menu item recommendations based on user history and preferences",
    instructions=dedent(f"""\
        No need to give any other information just give the recommendations.
        Give appropriate menu recommendations using get_menu_recommendations_by_user_tool
        Give the recommendations based on the past preferences, current time of the day.
    """),
    tools=[get_menu_recommendations_by_user_tool],
    markdown=True,
    # memory=memory,
    add_history_to_messages=True,
    # num_history_runs=10,
    add_datetime_to_instructions=True,
)

faq_agent = Agent(
    name="FAQ Agent",
    role="Answers general questions STRIKIN",
    model=model,
    knowledge=knowledge_base,
    search_knowledge=True,
    description="Handles common inquiries like, pricing, Bay types, menu items etc about STRIKIN",
    instructions=dedent(f"""\
        Answer questions about STRIKIN Hyderabad:
        
        General Info:
        - Hours: "10AM-10PM daily"
        - Location: "Gachibowli, Hyderabad"
        - Menu: call the menu_tool
        - Contact: "+91-1234567890"
        
        Answer the available slots related query using the 'fetch_available_slots_tool'
        Answer user's booking related details using the 'get_user_bookings_tool'
        Answer the bays and pricing related information using the 'get_bay_details_tool'
        Answer the menu related information using the 'get_menu_items_tool'
        Answer the queries related to the events using the 'get_event_details_tool'
        
        To get more information about the bay types and their functionalities use the knowledge base.
        Rules:
        - Keep responses to 1-2 sentences
        - Be polite and professional"""),
    tools=[fetch_available_slots_tool, get_user_bookings_tool, get_bay_details_tool, get_menu_items_tool, get_event_details_tool],
    markdown=True,
    # memory=memory,
    add_history_to_messages=True,
    # num_history_runs=10,
    add_datetime_to_instructions=True,
)

strikin_team = Team(
    name="Strikin Team",
    mode="coordinate",
    model=model,
    # reasoning_model=OpenRouter(
    #     id="qwen/qwen3-32b:free",
    #     api_key=OPENROUTER_API_KEY,
    # ),
    members=[booking_agent, bay_recommendation_agent, menu_recommendation_agent, faq_agent, payment_agent, cancellation_agent],
    tools=[handle_feedback_tool],
    description="Orchestrates personalized guest experiences at STRIKIN",
    instructions=dedent("""   
        You are the personal Assistant for STRIKIN guests 
        The current users details are : {user_details}.
        
        ## Workflow:
        1. INITIAL CONTACT:
           - Start with personalized greeting to user
           - Then call the 'Bay recommendation Agent' to recommend the user different bay types
               
        2. REQUEST HANDLING:
           - Booking requests → 'Booking Agent'
           - Payment requests -> 'Payment agent'
           - Bay Recommendations → 'Bay Recommendation Agent'
           - Menu Recommendations -> 'Menu Recommendations Agent'
           - General questions about Bays, Menu items, pricing, bookings, upcoming events and availability → 'FAQ Agent'
           - Cancellation of booking -> 'Cancellation Agent'
           
        3. HANDLE FEEDBACK'S:
            - If the user is frustrated and want to provide feedback regarding any service, use the handle_feedback_tool by passing the feedback_title and the feedback text
            - While handling the feedback's be polite and gather the appropriate feedback
            
        3. RULES:
           - Collect feedback: "How was your experience today?"
           - Give the responses in in a human readable format.
           - Use tabular responses whenever necessary.
           - No need to mention about any of the agents and the internal working while giving the response to the user.
           - Just answer to the user query
        
        4. NOTE:
            - While handling the booking make sure to make the payment and then only complete the booking.
            - there is NO repetations in response. DO NOT directly put the the response of the agent. USE agent response as source for answering user query
            - Only give short and concise responses.
            - make sure that you wont give recommendations between the booking process
            - user input bay name can either be for recommendation or for booking judge that based on context.
            - dont recommend bay unless user asked or initial contact
        
        Use warm, professional language according to user mood and age with occasional emojis.
        
        """),
    add_member_tools_to_system_message=True,
    team_session_state={},
    add_state_in_messages=True,
    enable_agentic_context=True,
    enable_user_memories=True,
    enable_session_summaries=True,
    # show_tool_calls=True,
    share_member_interactions=True,
    # show_members_responses=True,
    memory=memory,
    storage=storage,
    add_history_to_messages=True,
    num_history_runs=20,
    markdown=True,
    debug_mode=True,
    add_datetime_to_instructions=True,
)

app = FastAPI(title="STRIKIN Concierge Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # nosemgrep
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    email: str
    session_id: str

class ChatResponse(BaseModel):
    reply: str
    
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        # print(f"Received message from {req.email}: {req.message} (session_id: {req.session_id})")
        strikin_team.session_id=req.session_id
        # print("BEFORE----------",strikin_team.team_session_state)        
        response = strikin_team.run(req.message, user_id=req.email)
        # print("AFTER----------",strikin_team.team_session_state)
        return ChatResponse(reply=response.messages[-1].content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_session(user_details: Dict[str, Any]):
    # strikin_team.session_id = sessionId
    strikin_team.team_session_state={"user_details" : user_details}

pwd_ctx = CryptContext(schemes=["bcrypt"])

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    age: int
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    

@app.post("/register")
def register(req: RegisterRequest):
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection error")

    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE email = %s", (req.email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return {"status": "failed", "reason": "Email already registered"}

    hashed = hash_password(req.password)
    cursor.execute(
        "INSERT INTO users (name, email, phone_number, age, password) VALUES (%s, %s, %s, %s, %s)",
        (req.name, req.email, req.phone_number, req.age, hashed)
    )
    conn.commit()
    
    user_id = cursor.lastrowid
    
    cursor.close()
    conn.close()
    
    user_details = {
        "user_id": user_id,
        "name": req.name,
        "email": req.email,
        "age": req.age,
    }
    
    update_session(user_details)

    return {"status": "success"}

@app.post("/login")
def login(req: LoginRequest):
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection error")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (req.email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    
    if not user or not verify_password(req.password, user["password"]):
        return {"status": "failed"}
        
    user_details = {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "age": user["age"],
    }
    
    update_session(user_details)

    return {"status": "success", "user_id": user_details["user_id"], "name": user_details["name"], "email": user_details["email"], "age": user_details["age"]}

@app.get("/healthcheck")
def healthcheck():
    return {"status": "success"}
    
if __name__ == "__main__":
    import uvicorn
    # knowledge_base.load(upsert=True)
    uvicorn.run("app:app", port=8000, reload=True)