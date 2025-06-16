## Sagra di Castelerro
Pagina del portale della sagra del Salamino d'Asino di Castelferro

# Docker image build
docker build -t maxpetra/castelferro:v1 .

# bruno
# Modificare docker-compose.yaml  inserendo la riga 
image: ironcastle/castelferro:v2
# Docker image build
docker build -t ironcastle/castelferro:v2 .
# Aprire: Docker Desktop
# Andare nelle Immagini e fare push (dai 3 puntini sul Docker Hub). 
# Si aggiorna il Container. 

# ...fare partire il container, dovrebbero andare entrambi. 
# ...cancellare i vecchi container. 


# Docker image export
docker save --output castelferro.tar castelferro:v1   

 docker load --input CASTELFERRO.tar
