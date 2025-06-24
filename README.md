## Sagra di Castelerro
Pagina del portale della sagra del Salamino d'Asino di Castelferro

# Docker image build
docker build -t maxpetra/castelferro:v1 .

# bruno
# Modificare docker-compose.yaml  inserendo la riga 
image: ironcastle/castelferro:v2
# Docker image build
docker build -t ironcastle/castelferro:v2 .
# andare sul Hub repository e capire se c'e' stata caricata. 
# Aprire: Docker Desktop loggarsi 
# (soluzione che non sembra andare) andare su -IMAGE - HUB REPOSITORY e fare PULL dell'immagine. 
# (soluzione che non sembra andare) aspettare anche 10 min.. 
# Andare nelle Immagini e fare push (dai 3 puntini sul Docker Hub). 
# Si aggiorna il Container. 

# A CASTELFERRO
#   aggiornare Yaml se è il caso
#   lanciare il bat 
#   si aggiorna tutto da solo  

# ...fare partire il container, dovrebbero andare entrambi. 
# ...cancellare i vecchi container. 


# Docker image export
docker save --output castelferro.tar castelferro:v1   

 docker load --input CASTELFERRO.tar
