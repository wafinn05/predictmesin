"""
Flask API — Predictive Maintenance Backend
Deployment for Hugging Face Spaces
"""
import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow CORS from everywhere for simplicity (you can restrict this to your Vercel domain later)
CORS(app)

# ── Load ML artifacts ──────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
model  = joblib.load(os.path.join(BASE, 'bestmodel.pkl'))
scaler = joblib.load(os.path.join(BASE, 'scaler.pkl'))
le     = joblib.load(os.path.join(BASE, 'le.pkl'))

# ── Model metadata (hasil training) ───────────────────────
MODEL_METRICS = {
    "model_name"    : "Random Forest Classifier",
    "n_estimators"  : 100,
    "accuracy"      : 97.55,
    "precision"     : 59.79,
    "recall"        : 85.29,
    "f1_score"      : 70.30,
    "train_samples" : 15458,
    "test_samples"  : 2000,
    "total_records" : 10000,
    "n_features"    : 9,
    "failure_rate"  : 3.39,
    "dataset"       : "AI4I 2020 Predictive Maintenance",
    "smote_applied" : True,
    "split_ratio"   : "80:20"
}

@app.route('/')
def index():
    return jsonify({"status": "PredictMaint API is online."})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)

        machine_type = str(data.get('type', 'M')).strip().upper()
        if machine_type not in ['L', 'M', 'H']:
            machine_type = 'M'

        air_temp     = float(data['air_temp'])
        process_temp = float(data['process_temp'])
        rpm          = float(data['rpm'])
        torque       = float(data['torque'])
        tool_wear    = float(data['tool_wear'])

        # Computed / engineered features
        temp_diff       = round(process_temp - air_temp, 4)
        power_kw        = round(torque * rpm / 9550, 4)
        torque_x_wear   = round(torque * tool_wear, 4)
        type_encoded    = int(le.transform([machine_type])[0])

        # Build & scale feature vector
        features = np.array([[
            air_temp, process_temp, rpm, torque, tool_wear,
            temp_diff, power_kw, torque_x_wear, type_encoded
        ]])
        features_scaled = scaler.transform(features)

        # Predict
        prediction  = int(model.predict(features_scaled)[0])
        proba       = model.predict_proba(features_scaled)[0].tolist()

        return jsonify({
            'success'             : True,
            'prediction'          : prediction,
            'label'               : 'FAILURE' if prediction == 1 else 'NORMAL',
            'probability_normal'  : round(proba[0] * 100, 2),
            'probability_failure' : round(proba[1] * 100, 2),
            'computed_features': {
                'temp_diff'          : temp_diff,
                'power_kw'           : power_kw,
                'torque_x_tool_wear' : torque_x_wear,
                'type_encoded'       : type_encoded
            }
        })

    except KeyError as e:
        return jsonify({'success': False, 'error': f'Missing field: {e}'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/metrics')
def metrics():
    return jsonify(MODEL_METRICS)

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=7860)
