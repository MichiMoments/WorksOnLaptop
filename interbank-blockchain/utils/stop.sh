#!/bin/bash

clear

# Remove data folder
sudo rm -rf data

# Stop all running containers
sudo docker stop $(sudo docker ps -q)

# Remove all containers
sudo docker rm $(sudo docker ps -a -q)

# Remove all networks
sudo docker network prune -f