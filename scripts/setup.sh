#!/bin/bash

# Global variables
folder_name="os-status-page"
LOCK_FILE="process.lock"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

declare -A menu_options
menu_options[1]="Install|install_process"
menu_options[2]="Start|start_process"
menu_options[3]="Start with Docker|start_with_docker"
menu_options[4]="Stop|stop_process"
menu_options[5]="Upgrade|upgrade_process"
menu_options[6]="Logs|show_logs"
menu_options[7]="Exit|exit_script"

# Function to download the latest release
download_latest_release() {
  animate_loading "Fetching latest release" 2
  response=$(curl -s https://api.github.com/repos/tommy141x/os-status-page/releases/latest)
  tarball_url=$(echo "$response" | sed -n 's/.*"tarball_url": "\(.*\)".*/\1/p')
  echo -e "${BLUE}🔗 Tarball URL:${NC} $tarball_url"

  output_file="latest-release.tar.gz"
  output_dir="$folder_name"

  animate_loading "Downloading tarball" 2
  curl -L -o "$output_file" "$tarball_url"
  echo -e "${GREEN}✅ Download complete:${NC} $output_file"

  mkdir -p "$output_dir"
  animate_loading "Extracting tarball" 2
  tar -xzf "$output_file" -C "$output_dir"

  extracted_dir=$(find "$output_dir" -mindepth 1 -maxdepth 1 -type d)
  if [ -n "$extracted_dir" ]; then
    mv "$extracted_dir"/* "$output_dir"
    rm -rf "$extracted_dir"
    echo -e "${GREEN}📦 Moved contents to:${NC} $output_dir"
  else
    echo -e "${YELLOW}⚠️ No directory found to move.${NC}"
  fi

  echo -e "${GREEN}✅ Extraction and cleanup complete.${NC}"
  rm "$output_file"
  echo -e "${GREEN}🧹 Cleanup complete.${NC}"
}

install_process() {
  clear
  animate_loading "Installing" 2

  # Download and extract the latest release
  download_latest_release

  # Check if Bun is already installed
  if ! command -v bun &> /dev/null; then
    animate_loading "Bun not found. Installing Bun" 2
    curl -fsSL https://bun.sh/install | bash
  else
    echo -e "${GREEN}✅ Bun is already installed.${NC}"
  fi

  # Change directory to the extracted folder
  cd "$folder_name" || { echo -e "${YELLOW}⚠️ Failed to change directory to $folder_name"; exit 1; }
  # Install dependencies with Bun
  bun install

  # Print completion message
  echo -e "${GREEN}✅ Installation complete!${NC}"
  echo -e "${YELLOW}⚠️ Please rename and modify the config file from config.example.yml to config.yml${NC}"
  cd ..
  sleep 3
}

upgrade_process() {
  clear
  animate_loading "Stopping processes" 2
  stop_process
  clear
  animate_loading "Upgrading" 2

  # Check if directory exists
  if [ ! -d "$folder_name" ]; then
      echo -e "${RED}⚠️ Directory $folder_name does not exist. Cannot upgrade.${NC}"
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
  [ -f "$folder_name/scripts/setup.sh" ] && mv "$folder_name/scripts/setup.sh" "setup.sh"

  # Change directory to the extracted folder
  cd "$folder_name" || { echo "Failed to change directory to $folder_name"; exit 1; }
  # Install dependencies with Bun
  bun install

  # Print completion message
  echo -e "${GREEN}✅ Upgrade complete!${NC}"
    echo -e "${YELLOW}⚠️ Please check and update your config file if necessary. Old config file is saved as config.yml.old${NC}"
    cd ..
    sleep 3
  }

start_process() {
  clear
  animate_loading "Starting" 2

  # Check if directory exists
  if [ ! -d "$folder_name" ]; then
      echo -e "${RED}⚠️ Directory $folder_name does not exist. Cannot start.${NC}"
      return
      fi

  # Check if config.yml exists
  if [ ! -f "$folder_name/config.yml" ]; then
    echo -e "${RED}⚠️ config.yml not found. Cannot start.${NC}"
    return
  fi

  # Backup configuration and database
  [ -f "$folder_name/config.yml" ] && cp "$folder_name/config.yml" "$folder_name/config.yml.bak"
  [ -f "$folder_name/statusdb.sqlite" ] && cp "$folder_name/statusdb.sqlite" "$folder_name/statusdb.sqlite.bak"

  cd "$folder_name" || { echo -e "${YELLOW}⚠️ Failed to change directory to $folder_name"; exit 1; }

  # Start the application in the background and redirect output to the log file
  bun start >> "latest.log" 2>&1 &
  local process_pid=$!
  animate_loading "Waiting for API to be ready" 2

  # Save the PID to the lock file
  echo $process_pid > "$LOCK_FILE"
  echo "Process PID: $process_pid" >> "latest.log"

  # Initialize timer and interval variables
  local timeout=30
  local interval=1
  local elapsed=0

  # Check for success indicators in the log file
  while [ $elapsed -lt $timeout ]; do
      if grep -q "http" "latest.log"; then
        echo -e "${GREEN}✅ Application started!${NC}"
        break
      fi
      sleep $interval
      elapsed=$((elapsed + interval))
    done

    if [ $elapsed -ge $timeout ]; then
      # Read the error from the log file
      local error_message=$(cat "latest.log")
      echo -e "${RED}⚠️ Failed to start application. Error: $error_message${NC}"
      kill $process_pid  # Kill the background process if it fails to start
      rm "$LOCK_FILE"  # Clean up the lock file
    fi

    cd ..
    sleep 3
  }

start_with_docker() {
  clear
  animate_loading "Starting with Docker" 2

  # Backup configuration and database
  [ -f "$folder_name/config.yml" ] && cp "$folder_name/config.yml" "$folder_name/config.yml.bak"
  [ -f "$folder_name/statusdb.sqlite" ] && cp "$folder_name/statusdb.sqlite" "$folder_name/statusdb.sqlite.bak"

  # Check if config.yml exists
  if [ ! -f "$folder_name/config.yml" ]; then
  echo -e "${RED}⚠️ config.yml not found. Cannot start.${NC}"
    return
  fi

  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    read -p "Docker is not installed. Would you like to install it? (y/n): " install_docker
    if [[ $install_docker == "y" || $install_docker == "Y" ]]; then
    animate_loading "Installing Docker" 2
      curl -fsSL https://get.docker.com | sh
    else
      echo -e "${RED}⚠️ Docker is required to start the application with Docker."
      return
    fi
  fi

  cd "$folder_name" || { echo -e "${YELLOW}⚠️ Failed to change directory to $folder_name"; exit 1; }

  # Start the application with Docker and redirect output to the log file
  docker compose up >> "latest.log" 2>&1 &
  local docker_pid=$!

  # Save the Docker PID to the lock file
  echo $docker_pid > "$LOCK_FILE"
  echo "Docker PID: $docker_pid" >> "latest.log"

  animate_loading "Waiting for API to be ready" 2

  # Initialize timer and interval variables
  local timeout=30
  local interval=1
  local elapsed=0

  # Check for success indicators in the log file
  while [ $elapsed -lt $timeout ]; do
    if grep -q "http" "latest.log"; then
      echo "${GREEN}✅ Application started with Docker!"
      break
    fi
    sleep $interval
    elapsed=$((elapsed + interval))
  done

  if [ $elapsed -ge $timeout ]; then
    # Read the error from the log file
    local error_message=$(cat "latest.log")
    echo -e "${YELLOW}⚠️ Failed to start application with Docker. Error: $error_message"
    docker compose down  # Stop Docker if it fails to start
    rm "$LOCK_FILE"  # Clean up the lock file
  fi

  cd ..
  sleep 3
}


stop_process() {
  clear
  animate_loading "Stopping" 2

  if command -v docker &> /dev/null; then
    # Docker is installed
    cd "$folder_name" || { echo -e "${YELLOW}⚠️ Failed to change directory to $folder_name"; exit 1; }
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
  sleep 1
}

animate_loading() {
    local message="$1"
    local duration="$2"
    local interval=2  # Interval in tenths of a second (0.2 seconds)
    local dots=""
    local elapsed=0

    while [ $elapsed -lt $((duration * 10)) ]; do
        printf "\033[A\033[K%s%s\n" "$message" "$dots"  # Move cursor up, clear line, print message
        sleep 0.2
        dots+="."
        elapsed=$((elapsed + interval))
        if [ ${#dots} -ge 4 ]; then  # Adjust the number of dots here
            dots=""
        fi
    done
    printf "\n"  # Move to the next line after animation
}

show_logs() {
  clear
  if [ -f "$folder_name/latest.log" ]; then
    less -R "$folder_name/latest.log"
  else
    echo "No logs available."
    read -n 1 -s -r -p "Press any key to continue..."
  fi
}

exit_script() {
  clear
  echo "Exiting..."
  exit 0
}

# Function to display ASCII art
display_ascii() {
  echo -e "${NC}

  ______________  ________  _______    ____  ___   ____________
 / ___/_  __/   |/_  __/ / / / ___/   / __ \/   | / ____/ ____/
 \__ \ / / / /| | / / / / / /\__ \   / /_/ / /| |/ / __/ __/
___/ // / / ___ |/ / / /_/ /___/ /  / ____/ ___ / /_/ / /___
/____//_/ /_/  |_/_/  \____//____/  /_/   /_/  |_\____/_____/

by ${BLUE}Tommy Johnston${NC}
  "
}

# Function to display the menu
display_menu() {
  while true; do
    # Clear the screen and display menu header
    clear
    display_ascii
    echo "Welcome to the Setup Menu! 🚀"

    # Determine process status
       if [ -f "$folder_name/$LOCK_FILE" ]; then
           echo -e "Status: ${GREEN}Running (Healthy) 🟢${NC}"
       else
         echo -e "Status: ${RED}Not Running (No Lock File) 🔴${NC}"
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
}

# Main script
while true; do
  display_menu
done

trap 'exit_script' SIGINT
