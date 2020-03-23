#!/bin/sh

# docker login rg.fr-par.scw.cloud/abuch -u nologin -p $SCW_SECRET_TOKEN

# @ssh.A-bu.ch -- @a-bu.ch


echo ""
echo "--- init app ---"
echo ""

npm install

# pip3 freeze > requirements.freezed.txt
pip3 install -r ./requirements.freezed.txt

# mkdir -p /home/ubuntu/A-bu.ch/data
