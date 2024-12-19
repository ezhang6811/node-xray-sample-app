
check_if_step_failed_and_exit() {
  if [ $? -ne 0 ]; then
    echo $1
    exit 1
  fi
}

# Install necessary packages and dependencies
npm install
check_if_step_failed_and_exit "Failed to install npm packages."

# Start the application
node app.js &
APP_PID=$!
check_if_step_failed_and_exit "Failed to start the application."

# Wait for the application to start
sleep 5

# Call each endpoint once
curl http://localhost:8080/generate-automatic-traces
check_if_step_failed_and_exit "Failed to generate traffic to endpoint1."

curl http://localhost:8080/generate-manual-traces
check_if_step_failed_and_exit "Failed to generate traffic to endpoint2."

# Stop the application
kill $APP_PID
check_if_step_failed_and_exit "Failed to stop the application."