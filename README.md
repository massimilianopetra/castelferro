## Sagra di Castelerro

# bruno
# Modificare docker-compose.yaml  inserendo la riga 
image: ironcastle/castelferro:v5
# Docker image build (da qui Visual Studio)
 docker build -t ironcastle/castelferro:v34 .      
# andare sul Hub repository e capire se c'e' stata caricata. 
# Aprire: Docker Desktop loggarsi 
# (soluzione che non sembra andare) andare su -IMAGE - HUB REPOSITORY e fare PULL dell'immagine. 
# Andare nelle Immagini e fare push (dai 3 puntini sul Docker Hub). 
# Andare su -IMAGE - HUB REPOSITORY e fare PULL dell'immagine. qualcosa fa chiedere PETRA. 
# aprire un cmd (C:\Users\bruno\Desktop\Progetti React\DOCKER\casteleferro) e lanciare il start.bat 
# Si aggiorna il Container. 

# A CASTELFERRO
#   devo aggiornare la versione v3 v4 v5)
#   connetti ad internet il pc della sagra
#   lanciare il bat 
#   si aggiorna tutto da solo  
# ...fare partire il container, dovrebbero andare entrambi. 
# ...cancellare i vecchi container. 
s

# Docker image export
docker save --output castelferro.tar castelferro:v1   
docker load --input CASTELFERRO.tar

# Per pulire la cache di docker:
docker builder prune -f

# PER SALVARE 
- Crtl-s SALVA 
- Crtl-c ESCO DALL'ESECUZUIONE
- git add . 
- git commit -m "aggiornamento"
- git push

# MENTRE PER scariare 
- git pull 
# se hai fatto dekke modifiche per cui non puoi fare la pull il comando per non considerale è 

# PER FAR LOGGARE IL DOCKER DESKTOP docker login
# DOWNLOAD DI UNA IMMAGINE docker scout quickview ironcastle/castelferro:v41
(Apri Docker Desktop  - IMAGE - MY HUB - e cerca l-immagine e poi fai PULL  )

