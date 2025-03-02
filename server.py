import os
from flask import Flask, request, jsonify
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

SENDGRID_API_KEY = "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"  # Remplace avec ta clé SendGrid

@app.route("/send-email", methods=["POST"])
def send_email():
    data = request.json
    user_email = data.get("user_email")
    control_email = data.get("control_email")
    session_results = data.get("results")

    if not user_email or not control_email or not session_results:
        return jsonify({"error": "Données manquantes"}), 400

    message = Mail(
        from_email="fmoquet@mun.ca",
        to_emails=control_email,
        subject="📩 Résultats de la session",
        plain_text_content=f"""
        Bonjour,

        📌 ID du candidat : {user_email}
        ✅ Résultats de la session : {session_results}

        Cordialement,
        Système de Surveillance des Tests
        """,
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return jsonify({"message": "Email envoyé avec succès !"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

