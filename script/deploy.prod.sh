#!/bin/sh

# docker login rg.fr-par.scw.cloud/abuch -u nologin -p $SCW_SECRET_TOKEN

# @ssh.A-bu.ch -- @a-bu.ch


echo ""
echo "--- init env ---"
echo ""

# npm update
# pip3 update


echo ""
echo "--- build frontend ---"
echo ""

rm -rf ./dist && mkdir ./dist
# npm run build
cp -r ./public/* ./dist/ && cp -r ./public/.well-known ./dist/


echo ""
echo "--- build backend ---"
echo ""

# TODO build / deploy backend


echo ""
echo "--- build docker ---"
echo ""

# build
docker build -t sofort/a-bu.ch:latest .

# tag
docker tag sofort/a-bu.ch:latest rg.fr-par.scw.cloud/sofort/a-bu.ch:latest

# push
docker push rg.fr-par.scw.cloud/sofort/a-bu.ch:latest


echo ""
echo "--- deploy stack to server ---"
echo ""

ssh root@ssh.A-bu.ch 'cd /home/ubuntu/ABO-bu.ch && git stash && git pull && touch ./data/inbox.json'
ssh root@ssh.A-bu.ch 'cd /home/ubuntu/ABO-bu.ch && docker pull rg.fr-par.scw.cloud/sofort/a-bu.ch:latest && docker-compose down && docker-compose up -d'


echo ""
echo "--- well done ---"
echo ""

ssh root@ssh.A-bu.ch 'docker ps'


echo ""
echo ""

