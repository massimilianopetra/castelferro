## Sagra di Castelerro
Pagina del portale della sagra del Salamino d'Asino di Castelferro

# Docker image build
docker build -t maxpetra/castelferro:v1 .

# bruno
# Modificare docker-compose.yaml  inserendo la riga 
image: ironcastle/castelferro:v2
# Docker image build (da qui Visual Studio)
docker build -t ironcastle/castelferro:v2 .
# andare sul Hub repository e capire se c'e' stata caricata. 
# Aprire: Docker Desktop loggarsi 
# (soluzione che non sembra andare) andare su -IMAGE - HUB REPOSITORY e fare PULL dell'immagine. 
# Andare nelle Immagini e fare push (dai 3 puntini sul Docker Hub). 
# Andare su -IMAGE - HUB REPOSITORY e fare PULL dell'immagine. qualcosa fa chiedere PETRA. 
# aprire un cmd (C:\Users\bruno\Desktop\Progetti React\DOCKER\casteleferro) e lanciare il start.bat 
# Si aggiorna il Container. 

# A CASTELFERRO
#   aggiornare Yaml se è il caso (devo aggiornare la versione v3 v4 v5)
#   connetti ad internet il pc della sagra
#   lanciare il bat 
#   si aggiorna tutto da solo  

# ...fare partire il container, dovrebbero andare entrambi. 
# ...cancellare i vecchi container. 


# Docker image export
docker save --output castelferro.tar castelferro:v1   

 docker load --input CASTELFERRO.tar
