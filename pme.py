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
    bounds = load_point_matches(501, 501, rc, pm)
    return render_template('pme.html', bounds = bounds)

@app.route('/')
def threejstest():
    rc = rcObj('flyTEM', 'FAFB00', 'v12_align')
    pm = pmObj('flyTEM', 'v12_dmesh')
    tiledata = load_point_matches(500, 502, rc, pm)
    return render_template('3dgridview.html', tiledata = tiledata)

if __name__ == '__main__':
    app.run()
