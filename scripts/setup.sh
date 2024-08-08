#!/bin/bash

# Global variables
folder_name="os-status-page"
LOCK_FILE="process.lock"

declare -A menu_options
menu_options[1]="Install|install_process"
menu_options[2]="Start|start_process"
menu_options[3]="Start with Docker|start_with_docker"
menu_options[4]="Stop|stop_process"
menu_options[5]="Upgrade|upgrade_process"
menu_options[6]="Exit|exit_script"

# Function to download the latest release
download_latest_release() {
  echo "Fetching latest release data..."
  response=$(curl -s https://api.github.com/repos/tommy141x/os-status-page/releases/latest)
  tarball_url=$(echo "$response" | sed -n 's/.*"tarball_url": "\(.*\)".*/\1/p')
  echo "Tarball URL: $tarball_url"

  output_file="latest-release.tar.gz"
  output_dir="$folder_name"

  echo "Downloading tarball..."
  curl -L -o "$output_file" "$tarball_url"
  echo "Download complete: $output_file"

  mkdir -p "$output_dir"
  echo "Extracting tarball..."
  tar -xzf "$output_file" -C "$output_dir"

  extracted_dir=$(find "$output_dir" -mindepth 1 -maxdepth 1 -type d)
  if [ -n "$extracted_dir" ]; then
    mv "$extracted_dir"/* "$output_dir"
    rm -rf "$extracted_dir"
    echo "Moved contents to: $output_dir"
  else
    echo "No directory found to move."
  fi

  echo "Extraction and cleanup complete."
  echo "Deleting tarball..."
  rm "$output_file"
  echo "Cleanup complete."
}

install_process() {
  clear
  echo "Installing..."

  # Download and extract the latest release
  download_latest_release

  # Check if Bun is already installed
  if ! command -v bun &> /dev/null; then
    echo "Bun not found. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
  else
    echo "Bun is already installed."
  fi

  # Change directory to the extracted folder
  cd "$folder_name" || { echo "Failed to change directory to $folder_name"; exit 1; }
  # Install dependencies with Bun
  bun install

  # Print completion message
  echo "Installation complete!"
  echo "Please rename and modify the config file from config.example.yml to config.yml"
  cd ..
}

upgrade_process() {
  clear
  echo "Stopping process..."
  stop_process
  clear
  echo "Upgrading..."

  # Check if directory exists
  if [ ! -d "$folder_name" ]; then
    echo "Directory $folder_name does not exist. Cannot upgrade."
    return
  fi

  # Backup configuration and database
  [ -f "$folder_name/config.yml" ] && mv "$folder_name/config.yml" "config.yml.bak"
  [ -f "$folder_name/statusdb.sqlite" ] && mv "$folder_name/statusdb.sqlite" "statusdb.sqlite.bak"
  [ -f "$folder_name/docker-compose.yml" ] && mv "$folder_name/docker-compose.yml" "docker-compose.yml.bak"

  # Remove the old application folder
  rm -rf "$folder_name"

  # Download and extract the latest release
  download_latest_release

  # Restore the configuration and database
  [ -f "config.yml.bak" ] && mv "config.yml.bak" "$folder_name/config.yml.old"
  [ -f "docker-compose.yml.bak" ] && mv "docker-compose.yml.bak" "$folder_name/docker-compose.yml.old"
  [ -f "statusdb.sqlite.bak" ] && mv "statusdb.sqlite.bak" "$folder_name/statusdb.sqlite"

  # Change directory to the extracted folder
  cd "$folder_name" || { echo "Failed to change directory to $folder_name"; exit 1; }
  # Install dependencies with Bun
  bun install

  # Print completion message
  echo "Upgrade complete!"
  echo "Please check update your config file if necessary. Old config file is saved as config.yml.old"
  cd ..
}

start_process() {
  clear
  echo "Starting..."

  # Check if directory exists
  if [ ! -d "$folder_name" ]; then
    echo "Directory $folder_name does not exist. Cannot start."
    return
  fi

  # Check if config.yml exists
  if [ ! -f "$folder_name/config.yml" ]; then
    echo "config.yml not found. Please create, rename config.example.yml to config.yml and make changes to file."
    return
  fi

  # Backup configuration and database
  [ -f "$folder_name/config.yml" ] && cp "$folder_name/config.yml" "$folder_name/config.yml.bak"
  [ -f "$folder_name/statusdb.sqlite" ] && cp "$folder_name/statusdb.sqlite" "$folder_name/statusdb.sqlite.bak"

  cd "$folder_name" || { echo "Failed to change directory to $folder_name"; exit 1; }

  # Create a temporary file to capture output
  local temp_output_file=$(mktemp)

  # Start the application in the background and redirect output to the temp file
  bun start > "$temp_output_file" 2>&1 &
  local process_pid=$!

  # Save the PID to the lock file
  echo $process_pid > "$LOCK_FILE"
  echo "Process PID: $process_pid" >> "$temp_output_file"

  # Initialize timer and interval variables
  local timeout=30
  local interval=1
  local elapsed=0

  # Check for success indicators in the output file
  while [ $elapsed -lt $timeout ]; do
    if grep -q "http" "$temp_output_file"; then
      echo "Application started!"
      break
    fi
    sleep $interval
    elapsed=$((elapsed + interval))
  done

  if [ $elapsed -ge $timeout ]; then
    # Read the error from the temp file
    local error_message=$(cat "$temp_output_file")
    echo "Failed to start application. Error: $error_message"
    kill $process_pid  # Kill the background process if it fails to start
    rm "$LOCK_FILE"  # Clean up the lock file
  fi

  # Clean up the temporary file
  rm "$temp_output_file"
  cd ..
}

start_with_docker() {
  clear
  echo "Starting with Docker..."

  # Backup configuration and database
  [ -f "$folder_name/config.yml" ] && cp "$folder_name/config.yml" "$folder_name/config.yml.bak"
  [ -f "$folder_name/statusdb.sqlite" ] && cp "$folder_name/statusdb.sqlite" "$folder_name/statusdb.sqlite.bak"

  # Check if config.yml exists
  if [ ! -f "$folder_name/config.yml" ]; then
    echo "config.yml not found. Please rename config.example.yml to config.yml and make changes to the file."
    return
  fi

  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    read -p "Docker is not installed. Would you like to install it? (y/n): " install_docker
    if [[ $install_docker == "y" || $install_docker == "Y" ]]; then
      echo "Installing Docker..."
      curl -fsSL https://get.docker.com | sh
    else
      echo "Docker is required to start the application with Docker."
      return
    fi
  fi

  cd "$folder_name" || { echo "Failed to change directory to $folder_name"; exit 1; }

  # Create a temporary file to capture Docker output
  local temp_output_file=$(mktemp)

  # Start the application with Docker
  docker compose up > "$temp_output_file" 2>&1 &
  local docker_pid=$!

  # Save the Docker PID to the lock file
  echo $docker_pid > "$LOCK_FILE"
  echo "Docker PID: $docker_pid" >> "$temp_output_file"

  # Initialize timer and interval variables
  local timeout=30
  local interval=1
  local elapsed=0

  # Check for success indicators in the output file
  while [ $elapsed -lt $timeout ]; do
    if grep -q "http" "$temp_output_file"; then
      echo "Application started with Docker!"
      break
    fi
    sleep $interval
    elapsed=$((elapsed + interval))
  done

  if [ $elapsed -ge $timeout ]; then
    # Read the error from the temp file
    local error_message=$(cat "$temp_output_file")
    echo "Failed to start application with Docker. Error: $error_message"
    docker compose down  # Stop Docker if it fails to start
    rm "$LOCK_FILE"  # Clean up the lock file
  fi

  # Clean up the temporary file
  rm "$temp_output_file"
  cd ..
}


stop_process() {
  clear
  echo "Stopping..."

  if command -v docker &> /dev/null; then
    # Docker is installed
    cd "$folder_name" || { echo "Failed to change directory to $folder_name"; exit 1; }
      docker compose down
      cd ..
  else
    # Docker is not installed
    echo "Docker not found, skipping Docker stop..."
  fi

  # Check if lock file exists
  if [ -f "$folder_name/$LOCK_FILE" ]; then
    # Read PID from lock file
    local process_pid=$(cat "$folder_name/$LOCK_FILE")
    if [ -n "$process_pid" ]; then
      if ps -p $process_pid > /dev/null; then
        kill $process_pid
        rm "$folder_name/$LOCK_FILE"  # Remove the lock file after stopping the process
      else
        echo "Process with PID $process_pid not found. Removing stale lock file."
        rm "$folder_name/$LOCK_FILE"
      fi
    else
      echo "No PID found in the lock file."
    fi
  else
    echo "No lock file found."
  fi

  echo "Application stopped!"
}

exit_script() {
  clear
  echo "Exiting..."
  exit 0
}

# Function to display ASCII art
display_ascii() {
  echo "

  ______________  ________  _______    ____  ___   ____________
 / ___/_  __/   |/_  __/ / / / ___/   / __ \/   | / ____/ ____/
 \__ \ / / / /| | / / / / / /\__ \   / /_/ / /| |/ / __/ __/
___/ // / / ___ |/ / / /_/ /___/ /  / ____/ ___ / /_/ / /___
/____//_/ /_/  |_/_/  \____//____/  /_/   /_/  |_\____/_____/

by Tommy Johnston
  "
}

# Function to display the menu
display_menu() {
  clear
  display_ascii
  echo "Welcome to the Setup Menu!"

  # Use an infinite loop to update status continuously
  while true; do
    # Clear the screen and display menu header
    clear
    display_ascii
    echo "Welcome to the Setup Menu!"

    # Determine process status
    if [ -f "$folder_name/$LOCK_FILE" ]; then
        echo "Status: Running (Healthy)"
    else
      echo "Status: Not Running (No Lock File)"
    fi

    echo "Please choose an option:"
    keys=("${!menu_options[@]}")
    for ((i=${#keys[@]}-1; i>=0; i--)); do
      key=${keys[i]}
      echo "[$key] ${menu_options[$key]%%|*}"
    done

    # Handle user input
    handle_input

    # Short sleep to reduce CPU usage
    sleep 1
  done
}

# Function to handle user inputs
handle_input() {
  read -n1 -p "Enter your choice [1-${#menu_options[@]}]: " choice
  echo
  if [[ "$choice" -ge 1 && "$choice" -le ${#menu_options[@]} ]]; then
    process_option "$choice"
  else
    echo "Invalid choice. Please try again."
    sleep 1
  fi
}

# Function to process a menu option
process_option() {
  local key="$1"
  local action="${menu_options[$key]#*|}"
  $action
  sleep 3
}

# Main script
while true; do
  display_menu
done
