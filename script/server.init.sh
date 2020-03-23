# init server

apt-get update
apt-get upgrade

ssh-keygen
cat /root/.ssh/id_rsa.pub

ssh root@ssh.A-bu.ch 'mkdir -p /home/ubuntu && cd /home/ubuntu/ && git clone git@github.com:evo42/ABO-bu.ch.git && mkdir data && touch ./data/inbox.json'
