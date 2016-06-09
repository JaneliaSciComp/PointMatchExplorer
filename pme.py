from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash
from pointmatchloading import getTileData, getPointMatches


app = Flask(__name__)
app.config.from_object('config')

@app.route('/viewboundingbox')
def render():
    bounds = getTileData(501, 501)
    return render_template('pme.html', bounds = bounds)

@app.route('/')
def threejstest():
    tiledata = getTileData(3722, 3722)
    return render_template('3dgridview.html', tiledata = tiledata)

@app.route('/webgltesting')
def webgltesting():
    # tiledata = getTileData(1, 7062, samplingRate = 50)
    tiledata = getTileData(500, 505)
    # getPointMatches(1, 7000)
    return render_template('webglTiles.html', tiledata = tiledata)

if __name__ == '__main__':
    app.run()
