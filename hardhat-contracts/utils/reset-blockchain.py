import os

# Cambiar al directorio del proyecto blockchain
blockchain_project = os.path.abspath(os.path.join("..", "interbank-blockchain"))
os.chdir(blockchain_project)

# Comandos adaptados para Windows:
commands = [
    # Limpiar pantalla (esto funciona en CMD)
    "cls",
    # Eliminar la carpeta 'data' (si existe)
    "rmdir /s /q data",
    # Detener todos los contenedores:
    'for /f "tokens=*" %i in (\'docker ps -q\') do docker stop %i',
    # Eliminar todos los contenedores:
    'for /f "tokens=*" %i in (\'docker ps -a -q\') do docker rm %i',
    #Eliminar todas las imágenes:
    'for /f "tokens=*" %i in (\'docker images -q\') do docker rmi %i',
    # Eliminar todas las redes (prune)
    "docker network prune -f"
]

for command in commands:
    os.system(command)
