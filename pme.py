from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash
from pointmatchloading import getTileData


app = Flask(__name__)
app.config.from_object('config')

@app.route('/')
def render():
    # tiledata = getTileData(1, 7062, samplingRate = 50)
    tiledata = getTileData(4, 6)
    return render_template('pme.html', tiledata = tiledata)

if __name__ == '__main__':
    app.run()
