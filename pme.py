from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash, jsonify
from getStackData import getTileData

app = Flask(__name__)
app.config.from_pyfile('config.cfg')

@app.route('/')
def render():
    return render_template('pme.html')

@app.route('/getdata')
def getData():
    nfirst = request.args.get('nfirst', 0, type=int)
    nlast = request.args.get('nlast', 0, type=int)
    tiledata = getTileData(nfirst, nlast)
    # tiledata = getTileData(60, 90) #no point matches drawn at all!
    # tiledata = getTileData(4, 9)
    # tiledata = getTileData(1, 7062, samplingRate = 50)
    # tiledata = getTileData(270, 272) #issue: 271 has merged data and the merged tiles are drawn as well, creating overlaps (also causes z-fighting)
    # tiledata = getTileData(500, 502)
    # tiledata = getTileData(3705, 3707) #issue: no inter-layer point matches?
    return jsonify(tiledata = tiledata)


if __name__ == '__main__':
    app.run()
