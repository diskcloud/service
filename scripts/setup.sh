#!/bin/bash

# Function to prompt user for input with a default value
prompt() {
    local varname=$1
    local prompt=$2
    local default=$3
    local value

    if [ -z "$default" ]; then
        read -p "$prompt: " value
    else
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    fi

    echo "$value"
}

# Check if .env.local file already exists
if [ ! -f .env.local ]; then
    # Prompt user for values
    TINIFY_KEY=$(prompt "TINIFY_KEY" "Enter Tinify Key (optional)")
    INTERNAL_NETWORK_DOMAIN=$(prompt "INTERNAL_NETWORK_DOMAIN" "Enter Internal Network Domain" "http://localhost:3000")
    PUBLIC_NETWORK_DOMAIN=$(prompt "PUBLIC_NETWORK_DOMAIN" "Enter Public Network Domain" "http://localhost:3000")
    SERVER_PORT=$(prompt "SERVER_PORT" "Enter Server Port" "3000")
    DIALECT=$(prompt "DIALECT" "Enter Database Dialect" "mysql")
    MYSQL_DATABASE=$(prompt "MYSQL_DATABASE" "Enter MySQL Database Name")
    MYSQL_HOST=$(prompt "MYSQL_HOST" "Enter MySQL Host")
    MYSQL_USER=$(prompt "MYSQL_USER" "Enter MySQL User" "root")
    MYSQL_PASSWORD=$(prompt "MYSQL_PASSWORD" "Enter MySQL Password")
    MYSQL_PORT=$(prompt "MYSQL_PORT" "Enter MySQL Port" "3306")
    REDIS_HOST=$(prompt "REDIS_HOST" "Enter Redis Host" "127.0.0.1")
    REDIS_PORT=$(prompt "REDIS_PORT" "Enter Redis Port" "6379")
    TOKEN_EXPIRE_TIME=$(prompt "TOKEN_EXPIRE_TIME" "Enter User Login Token Expire Time" "86400(1d)")
    JWT_SECRET=$(prompt "JWT_SECRET" "Enter JWT Secret")

    # Create .env.local file
    cat <<EOF > .env.local
TINIFY_KEY=${TINIFY_KEY}
INTERNAL_NETWORK_DOMAIN=${INTERNAL_NETWORK_DOMAIN}
PUBLIC_NETWORK_DOMAIN=${PUBLIC_NETWORK_DOMAIN}
SERVER_PORT=${SERVER_PORT}
DIALECT=${DIALECT}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_HOST=${MYSQL_HOST}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
MYSQL_PORT=${MYSQL_PORT}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
USER_LOGIN_TOKEN_EXPIRE_TIME=${USER_LOGIN_TOKEN_EXPIRE_TIME}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
JWT_SECRET=${JWT_SECRET}
EOF

    echo ".env.local file has been created successfully."
else
    echo ".env.local file already exists. Skipping creation."
fi

# Confirm whether to proceed with installation and startup
read -p "Do you want to proceed with installation and startup? (y/n): " proceed
if [ "$proceed" != "y" ]; then
    echo "Setup completed. Exiting."
    exit 0
fi

# Select package manager
read -p "Which package manager do you want to use? (yarn/npm): " packageManager
if [ "$packageManager" = "yarn" ]; then
    echo "Using yarn to install dependencies..."
    yarn install
    echo "Starting the application with yarn..."
    yarn prod
elif [ "$packageManager" = "npm" ]; then
    echo "Using npm to install dependencies..."
    npm install
    echo "Starting the application with npm..."
    npm run prod
else
    echo "Invalid selection. Exiting."
    exit 1
fi
