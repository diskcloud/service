# Function to prompt user for input with a default value
function Prompt-Input {
    param (
        [string]$prompt,
        [string]$default
    )

    if ($default) {
        $input = Read-Host "$prompt [$default]"
        if ([string]::IsNullOrEmpty($input)) {
            return $default
        } else {
            return $input
        }
    } else {
        return Read-Host $prompt
    }
}

# Check if .env.local file already exists
if (-Not (Test-Path .\.env.local)) {
    # Prompt user for values
    $TINIFY_KEY = Prompt-Input "Enter Tinify Key (optional)"
    $INTERNAL_NETWORK_DOMAIN = Prompt-Input "Enter Internal Network Domain" "http://localhost:3000"
    $PUBLIC_NETWORK_DOMAIN = Prompt-Input "Enter Public Network Domain" "http://localhost:3000"
    $SERVER_PORT = Prompt-Input "Enter Server Port" "3000"
    $DIALECT = Prompt-Input "Enter Database Dialect" "mysql"
    $MYSQL_DATABASE = Prompt-Input "Enter MySQL Database Name"
    $MYSQL_HOST = Prompt-Input "Enter MySQL Host"
    $MYSQL_USER = Prompt-Input "Enter MySQL User" "root"
    $MYSQL_PASSWORD = Prompt-Input "Enter MySQL Password"
    $MYSQL_PORT = Prompt-Input "Enter MySQL Port" "3306"
    $REDIS_HOST = Prompt-Input "Enter Redis Host" "127.0.0.1"
    $REDIS_PORT = Prompt-Input "Enter Redis Port" "6379"
    $USER_LOGIN_TOKEN_EXPIRE_TIME = Prompt-Input "Enter User Login Token Expire Time" "3600"
    $JWT_EXPIRES_IN = Prompt-Input "Enter JWT Expiry Time" "1h"
    $JWT_SECRET = Prompt-Input "Enter JWT Secret"

    # Create .env.local file
    $envContent = @"
TINIFY_KEY=$TINIFY_KEY
INTERNAL_NETWORK_DOMAIN=$INTERNAL_NETWORK_DOMAIN
PUBLIC_NETWORK_DOMAIN=$PUBLIC_NETWORK_DOMAIN
SERVER_PORT=$SERVER_PORT
DIALECT=$DIALECT
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_HOST=$MYSQL_HOST
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_PORT=$MYSQL_PORT
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
USER_LOGIN_TOKEN_EXPIRE_TIME=$USER_LOGIN_TOKEN_EXPIRE_TIME
JWT_EXPIRES_IN=$JWT_EXPIRES_IN
JWT_SECRET=$JWT_SECRET
"@

    Set-Content -Path .\.env.local -Value $envContent

    Write-Output ".env.local file has been created successfully."
} else {
    Write-Output ".env.local file already exists. Skipping creation."
}

# Confirm whether to proceed with installation and startup
$proceed = Read-Host "Do you want to proceed with installation and startup? (y/n)"
if ($proceed -ne 'y') {
    Write-Output "Setup completed. Exiting."
    exit
}

# Select package manager
$packageManager = Read-Host "Which package manager do you want to use? (yarn/npm)"
if ($packageManager -eq 'yarn') {
    Write-Output "Using yarn to install dependencies..."
    yarn install
    Write-Output "Starting the application with yarn..."
    yarn prod
} elseif ($packageManager -eq 'npm') {
    Write-Output "Using npm to install dependencies..."
    npm install
    Write-Output "Starting the application with npm..."
    npm run prod
} else {
    Write-Output "Invalid selection. Exiting."
    exit
}
