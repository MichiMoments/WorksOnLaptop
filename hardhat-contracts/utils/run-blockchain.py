import os

# Command to change directory

blockchain_project = "../interbank-blockchain"

cd_command = "cd " + blockchain_project

# Command to run docker compose
docker_command = "docker compose up"

# Full command to open a new terminal window and run the commands
#full_command = f'gnome-terminal -- bash -c "{cd_command} && {docker_command}; exec bash"' This command works only for linux
# Command for windows
full_command = (
    f'start powershell -NoExit -Command '
    f'"cd \\"{blockchain_project}\\"; docker compose up"'
)

# Execute the command
os.system(full_command)