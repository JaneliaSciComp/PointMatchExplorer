from flask import current_app as app
import requests

def getJSONfromURL(url):
    headers = {
    "Accept": "application/json"
    }
    r = requests.get(app.config["BASE_URL"] + url, headers =  headers)
    return r.json()

#gets zvalues and sectionID for all sections in the specified stack
def getSectionData():
    url = "/owner/{}/project/{}/stack/{}/sectionData".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"])
    return getJSONfromURL(url)


#gets specs for all tiles in a z layer
def getTileSpecs(z):
    url = "/owner/{}/project/{}/stack/{}/z/{}/tile-specs".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], z)
    return getJSONfromURL(url)

#gets coordinates for bounding boxes of all tiles in a z layer
def getTileBounds(z):
    url = "/owner/{}/project/{}/stack/{}/z/{}/tileBounds".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], z)
    return getJSONfromURL(url)

#gets specs for one tile
def getTileSpec(tileId):
    url = "/owner/{}/project/{}/stack/{}/tile/{}/".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], tileId)
    return getJSONfromURL(url)

#get bounds for a single stack
def getStackBounds(z):
    url = "/owner/{}/project/{}/stack/{}/z/{}/bounds".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], z)
    return getJSONfromURL(url)

#groupID here is the name of the z-layer as a string
def getMatchesWithinGroup(groupId):
    url = "/owner/{}/matchCollection/{}/group/{}/matchesWithinGroup".format(app.config["OWNER"], app.config["MATCH_COLLECTION"], groupId)
    return getJSONfromURL(url)

def getMatchesOutsideGroup(groupId):
    url = "/owner/{}/matchCollection/{}/group/{}/matchesOutsideGroup".format(app.config["OWNER"], app.config["MATCH_COLLECTION"], groupId)
    return getJSONfromURL(url)

#nfirst and nlast are zvalue of sections in rc
#rc and pm are objects with specification for accessing collections of tile-specs and point-patches (required for the API)
#nbr is the number of neighboring sections to consider
#min_points is the minimum number of points between two tiles
#xs_weight is the weight factor for cross-section point matches
#yet to be written, translated from Khaled's MATLAB code
def load_point_matches(nfirst, nlast, nbr = 4, min_points = 0, xs_weight = 1, samplingRate = 1):
    sectionData = getSectionData()
    sectionIDs = [val['sectionId'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    zs = [val['z'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    uniqueZs = list(set(zs))
    return None

def getUniqueZs(nfirst, nlast):
    sectionData = getSectionData()
    zs = [val['z'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    uniqueZs = list(set(zs))
    uniqueZs.sort()
    return uniqueZs

def getTileCoordinates(z):
    tileBounds = getTileBounds(z)
    stackBounds = getStackBounds(z)
    for tile in tileBounds:
        #translate the coordinates to center around (0,0)
        tile['minX'] = tile['minX'] - 0.5 * (stackBounds['minX'] + stackBounds['maxX'])
        tile['minY'] = tile['minY'] - 0.5 * (stackBounds['minY'] + stackBounds['maxY'])
        tile['maxX'] = tile['maxX'] - 0.5 * (stackBounds['minX'] + stackBounds['maxX'])
        tile['maxY'] = tile['maxY'] - 0.5 * (stackBounds['minY'] + stackBounds['maxY'])
    return tileBounds

def getPointMatches(z):
    pointMatches = {}
    pointMatches["matchesWithinGroup"] = getMatchesWithinGroup(z)
    pointMatches["matchesOutsideGroup"] = getMatchesOutsideGroup(z)
    return pointMatches

#returns coordinate data with tile ID for each z layer
#sampling rate limits the number of layers when the whole stack is generated
def getTileData(nfirst, nlast, samplingRate = 1):
    tileData = []
    for z in getUniqueZs(nfirst, nlast):
        if ( z % samplingRate == 0 ) :
            layerData = {}
            layerData['z'] = str(z)
            layerData['tileCoordinates'] = getTileCoordinates(z)
            layerData['pointMatches'] = getPointMatches(z)
            tileData.append(layerData)
    return tileData
