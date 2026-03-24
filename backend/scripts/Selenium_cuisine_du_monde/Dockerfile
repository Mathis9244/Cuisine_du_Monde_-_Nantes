# Utiliser une image Python officielle
FROM python:3.13-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires pour PostgreSQL et Selenium
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    gnupg \
    unzip \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Installer Chrome et ChromeDriver pour Selenium
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Installer ChromeDriver
RUN CHROMEDRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE) \
    && wget -O /tmp/chromedriver.zip https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip \
    && unzip /tmp/chromedriver.zip -d /usr/local/bin/ \
    && chmod +x /usr/local/bin/chromedriver \
    && rm /tmp/chromedriver.zip

# Copier requirements.txt et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput || true

# Exposer le port 8000
EXPOSE 8000

# Variables d'environnement par défaut
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=restaurants_api.settings

# Commande pour lancer l'application
# Utilise $PORT pour Render, sinon 8000 par défaut
CMD gunicorn restaurants_api.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
