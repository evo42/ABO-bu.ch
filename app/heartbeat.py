from sanic import Sanic
from sanic.response import json

app = Sanic(name='heartbeat-a-bu.ch')

@app.route('/')
async def test(request):
    return json({'service': 'a-bu.ch'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)

