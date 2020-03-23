#!/usr/bin/env python3

import hashlib
import uuid
import time
import os
import requests
import threading
import datetime
import logging
import urllib.parse
import base64
import psycopg2
import psycopg2.extras
import sys
# import json

from json import dumps, dump, loads, load
from urllib.parse import unquote
from subprocess import check_output
from random import randint
from stdnum import iban
from sanic import Sanic
from sanic import response
from sanic.response import json
from environs import Env
from sqlalchemy import create_engine
from sqlalchemy.sql import update, table, column, select, text

# from sanic_cors import CORS, cross_origin
# from sanic.log import logger
# from PIL import Image
# from databases import Database

logging_format = "[%(asctime)s] %(process)d-%(levelname)s "
logging_format += "%(module)s::%(funcName)s():l%(lineno)d: "
logging_format += "%(message)s"

logging.basicConfig(
    format=logging_format,
    level=logging.INFO
)
log = logging.getLogger()


env = Env()
# Read .env into os.environ
env.read_env()

Settings = {}

pwd = os.path.dirname(os.path.abspath(__file__))

dir_path = os.path.dirname(os.path.realpath(__file__))
app = Sanic(name='a-bu.ch')

# app.config.from_object(Settings)
# app.config['CORS_AUTOMATIC_OPTIONS'] = True

# CORS(app)
# cors = CORS(app, automatic_options=True, resources={r"/v1/*": {"origins": "sepa.digital"}})
# cors = CORS(app, resources={r"/v1/*": {"origins": "*"}})


# DB / App setup
def setup_database():
    @app.listener('after_server_start')
    # conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    async def connect_to_db(*args, **kwargs):
        # TODO .env
        app.db = psycopg2.connect("host='51.158.130.90' port='25120' dbname='abuch' user='' password=''")
        # app.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        return app.db

    @app.listener('after_server_stop')
    async def disconnect_from_db(*args, **kwargs):
        # app.db.close() # TODO disconnect again 
        return True
        #return app.db.disconnect()


# tmp helper
nextDbId = lambda: int(round(time.time() * 10) + randint(10, 1000))

# txUUID = lambda: str(uuid.uuid5(uuid.NAMESPACE_DNS, 'a-bu.ch'))
txUUID = lambda: str(uuid.uuid4())

# App routes
@app.route('/')
def service_handle_request(request):
    return response.redirect('/v1/heartbeat')


@app.route('/v1/heartbeat')
async def service_heartbeat(request):
    return response.json({"status": "up", "service": "a-bu.ch", "time": int(time.time())})

@app.route('/v1/heartbeat/db')
async def service_heartbeat_db(request):

    # setup_database()
    cur = app.db.cursor()
    cur.execute("SELECT * FROM tx")
    app.db.commit()

    msg = ''
    while True:
        row = cur.fetchone()

        if row == None:
            break

        msg = {'tx': [{"reference": row[1]}]}

    #rows = cur.fetchone()
    # return response.json({"status": "up", "service": "db.sepa.digital", "time": int(time.time())})
    return response.json(msg)


@app.route("/inbox", methods=["POST", "GET", 'OPTIONS'])
def post_inbox(request):
    open(pwd + "/../data/inbox.json", "a")

    with open(pwd + "/../data/inbox.json", 'r') as f:
        inbox = load(f)

    if request.json:
        inbox.append(request.json)

    with open(pwd + "/../data/inbox.json", 'w') as f:
        dump(inbox, f)

    if request.json and 'mail' in request.json:
        msg = "Thanks for your message -- we'll get in touch and reply to " + \
            str(request.json['email'])
    elif request.json and 'tel' in request.json:
        msg = "Thanks for your message -- we'll get in touch and call you at " + \
            str(request.json['tel'])
    else:
        msg = "Aloha! What's your message?"

    return json({"status": "success", "message": msg})


@app.route('/v1/iban/<ibanId:[A-z0-9-.]{10,110}>', methods=['GET', 'OPTIONS'])
async def iban_details(request, iban):

    query = "select * from iban where uuid = '" + iban + "'" # TODO SECURITY 

    try:
        # setup_database()

        # engine = create_engine("postgresql://user:pwd@IP:port/db") # , echo=True
        # conn = engine.connect()
        app.db = psycopg2.connect("host='51.158.130.90' port='25120' dbname='iban' user='' password=''")
        cur = app.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query)
        app.db.commit()
    #else:
    except:
        resp = {"status": "error", "message": "error -- no db connection"}
        return response.json(resp)

    txData = None
    while True:
        row = cur.fetchone()

        if row == None:
            break

        txData = row


    print('######### tx:', str(txData))

    if txData is not None:
        log.info("claim / entity data -- %s" % txData['status'] + " - " + str(txData['uuid']))
    else:
        log.info("claim / entity data -- Error not found")

        resp = {"status": "error", "message": "404 Error - no tx found"}

    return response.json(resp)


# run token/api server
if __name__ == '__main__':
    env = Env()
    env.read_env()
    
    # app.config.from_object(Settings)
    # log.info("DEBUG " + str(app.config.DEBUG))
    # setup_database()

    # app.run(host='0.0.0.0', port=8010, workers=4, debug=app.config.DEBUG, access_log=app.config.DEBUG)  # config
    app.run(host='0.0.0.0', port=8010, workers=1, debug=True, access_log=True)  # config


