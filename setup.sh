#!/bin/bash

# Exit immediately if a command fails
set -e

echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "📦 Installing basic dependencies..."
sudo apt-get install -y curl wget unzip build-essential git software-properties-common ca-certificates

echo "📦 Installing Node.js 20.x and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "📦 Installing Puppeteer / html-pdf-node dependencies..."
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    lsb-release \
    xdg-utils \
    wget \
    curl \
    unzip \
    libnss3

echo "📦 Installing html-pdf-node..."
npm install -g html-pdf-node

echo "✅ Setup completed! Node.js, npm, and html-pdf-node are installed."
echo "Test with: node -e \"require('html-pdf-node'); console.log('html-pdf-node works!')\""
