# Check if at least one argument was provided
if [ $# -eq 0 ]; then
   echo "ERROR... Usage: $0 <path_to_executable_zip>"
   exit 1
fi

# switch to project
cd ~/proj/Objective-C/Dock-Expose
# switch to Sparkle
cd Pods/Sparkle
# run Sparkle command
./bin/sign_update "$1"
