# Use the official Bun image as a base
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb to the working directory
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of your application code
COPY . .

# Check if config.yml exists, and if not, exit with an error code
RUN [ -f /app/config.yml ] || (echo "config.yml not found!" && exit 1)

# Expose the port the app runs on
EXPOSE 4321

# Command to run the application
CMD ["bun", "start"]