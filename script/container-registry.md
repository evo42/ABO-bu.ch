docker login rg.fr-par.scw.cloud/abuch -u nologin -p $SCW_SECRET_TOKEN

docker pull ubuntu:latest
docker tag ubuntu:latest rg.fr-par.scw.cloud/sofort/ubuntu:latest
docker push rg.fr-par.scw.cloud/sofort/ubuntu:latest

