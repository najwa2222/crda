# Utilisation d'une image de base avec Node.js
FROM node:14

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source dans l'image
COPY . .

# Commande par défaut pour démarrer l'application
CMD ["npm", "start"]
