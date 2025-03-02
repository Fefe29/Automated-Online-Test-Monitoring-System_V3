#!/bin/bash

echo "Vérification et installation des dépendances..."
pip install -r requirements.txt
yarn install

# Vérifier si un processus utilise le port 5000 (Flask) et 5173 (Node.js) et le tuer
FLASK_PID=$(lsof -t -i:5000)
NODE_PID=$(lsof -t -i:5173)

if [ ! -z "$FLASK_PID" ]; then
    echo "Port 5000 occupé, arrêt du processus Flask ($FLASK_PID)..."
    kill -9 $FLASK_PID
fi

if [ ! -z "$NODE_PID" ]; then
    echo "Port 5173 occupé, arrêt du processus Node.js ($NODE_PID)..."
    kill -9 $NODE_PID
fi

echo "Lancement du serveur Flask..."
gunicorn --bind 0.0.0.0:5000 server:app &

echo "Lancement du serveur Node.js..."
yarn start --host & # Assurez-vous que votre package.json contient "dev": "vite --host"


# Vérifier et configurer Ngrok
if ! command -v ngrok &> /dev/null
then
    echo "🔧 Installation de Ngrok..."
    npm install -g ngrok
fi

# Ajouter un authtoken si ce n'est pas déjà fait
NGROK_TOKEN="2tmAeuFe0SwIhZ34VPlggn6ZkVY_3EuGJDCTepCvavMsRQ2U3"  # Remplace ceci par ton token (voir https://dashboard.ngrok.com/get-started/your-authtoken)

if ! grep -q "$NGROK_TOKEN" ~/.ngrok2/ngrok.yml 2>/dev/null; then
    echo "Ajout du token Ngrok..."
    ngrok authtoken $NGROK_TOKEN
fi

echo "Exposition des ports avec Ngrok..."


# ngrok start --all > /dev/null &
ngrok http 5173 --bind-tls=both > /dev/null &


# Attendre quelques secondes pour que Ngrok démarre
sleep 5

# Récupérer les URLs publiques générées par Ngrok
export FLASK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.proto=="https") | select(.config.addr=="5000") | .public_url')