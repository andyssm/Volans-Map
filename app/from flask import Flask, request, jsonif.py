from flask import Flask, request, jsonify

app = Flask(__name__)

# Endpoint to receive accelerometer data from the phone
@app.route('/accelerometer', methods=['POST'])
def receive_data():
    data = request.json  # Get JSON data from request
    print("Received Data:", data)
    return jsonify({"message": "Data received", "data": data}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Run on local network
