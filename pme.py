from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash
from pointmatchloading import rcObj, pmObj, load_point_matches, getTileData

DEBUG = True

app = Flask(__name__)
app.config.from_object(__name__)

@app.route('/viewboundingbox')
def render():
    rc = rcObj('flyTEM', 'FAFB00', 'v12_align')
    pm = pmObj('flyTEM', 'v12_dmesh')
    bounds = getTileData(501, 501, rc, pm)
    return render_template('pme.html', bounds = bounds)

@app.route('/')
def threejstest():
    rc = rcObj('flyTEM', 'FAFB00', 'v12_align')
    pm = pmObj('flyTEM', 'v12_dmesh')
    tiledata = getTileData(3722, 3722, rc, pm)
    return render_template('3dgridview.html', tiledata = tiledata)

@app.route('/webgltesting')
def webgltesting():
    rc = rcObj('flyTEM', 'FAFB00', 'v12_align')
    pm = pmObj('flyTEM', 'v12_dmesh')
    # tiledata = getTileData(1, 7062, rc, pm, samplingRate = 50)
    tiledata = getTileData(500, 505, rc, pm)
    return render_template('webglTiles.html', tiledata = tiledata)

if __name__ == '__main__':
    app.run()
