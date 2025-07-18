import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process_user', methods=['POST'])
def process_user():
    data = request.get_json()
    
    if "name" not in data or "age" not in data:
        return jsonify({"error": "Invalid input"}), 400
    
    age = int(data["age"])
    
    if age < 18:
        category = "Minor"
    elif age < 60:
        category = "Adult"
    else:
        category = "Senior Citizen"
    
    response = json.dumps({
        "name": data["name"],
        "category": category
    })
    
    return jsonify(response), 200

def send_user_data():
    url = "http://127.0.0.1:5000/process_user"
    
    user_data = { "name": "Alice", "age": "25" }
    
    response = requests.post(url, json=user_data)
    
    if response.status_code == 200:
        user_info = response.json()
        
        print(f"User {user_info['name']} is classified as: {user_info['category']}")
    
    else:
        print("Error:", response.text)

if __name__ == '__main__':
    app.run(debug=True)

