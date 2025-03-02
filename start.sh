#!/bin/bash

# Installer les dépendances pour Node.js et Flask
pip install -r requirements.txt
yarn install

# Lancer Flask en arrière-plan
gunicorn --bind 0.0.0.0:5000 server:app &

# Lancer Node.js
yarn start