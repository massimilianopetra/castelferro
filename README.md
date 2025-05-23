## Sagra di Castelerro

Pagina del portale della sagra del Salamino d'Asino di Castelferro

# Docker image build
docker build -t maxpetra/castelferro:v1 .

# Docker image export
docker save --output castelferro.tar castelferro:v1   

 docker load --input CASTELFERRO.tar

