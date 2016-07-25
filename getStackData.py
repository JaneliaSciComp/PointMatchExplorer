from flask import current_app as app
import requests
import sys

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

# #gets specs for all tiles in a z layer
# def getTileSpecs(z):
#     url = "/owner/{}/project/{}/stack/{}/z/{}/tile-specs".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], z)
#     return getJSONfromURL(url)
#
# #gets specs for one tile
# def getTileSpec(tileId):
#     url = "/owner/{}/project/{}/stack/{}/tile/{}/".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], tileId)
#     return getJSONfromURL(url)

#gets coordinates for bounding boxes of all tiles in a z layer
def getTileBounds(z):
    url = "/owner/{}/project/{}/stack/{}/z/{}/tileBounds".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], z)
    return getJSONfromURL(url)

#get bounds for a single stack
def getSectionBounds(z):
    url = "/owner/{}/project/{}/stack/{}/z/{}/bounds".format(app.config["OWNER"], app.config["PROJECT"], app.config["STACK"], z)
    return getJSONfromURL(url)

#groupID here is the name of the z-layer as a string
def getMatchesWithinGroup(groupId):
    url = "/owner/{}/matchCollection/{}/group/{}/matchesWithinGroup".format(app.config["OWNER"], app.config["MATCH_COLLECTION"], groupId)
    return getJSONfromURL(url)

def getMatchesOutsideGroup(groupId):
    url = "/owner/{}/matchCollection/{}/group/{}/matchesOutsideGroup".format(app.config["OWNER"], app.config["MATCH_COLLECTION"], groupId)
    return getJSONfromURL(url)

def getSectionsForZ(z):
    sectionData = getSectionData()
    return [val['sectionId'] for val in sectionData if val['z'] == z]

#returns (x,y) that indicates how much the X and Y should be translated to center all of the sections around (0,0)
def calculateTranslation(nfirst, nlast):
    minX = sys.maxint
    minY = sys.maxint
    maxX = 0
    maxY = 0
    for z in range(nfirst, nlast+1):
        sectionBounds = getSectionBounds(z)
        minX = min(minX, sectionBounds['minX'])
        minY = min(minY, sectionBounds['minY'])
        maxX = max(maxX, sectionBounds['maxX'])
        maxY = max(maxY, sectionBounds['maxY'])
    #calculates the center of the bounds of all of the sections combined
    return (0.5*(minX+maxX), 0.5*(minY+maxY))

def getTileCoordinates(z, translation):
    tileBounds = getTileBounds(z)
    for tile in tileBounds:
        tile['minX'] = tile['minX'] - translation[0]
        tile['minY'] = tile['minY'] - translation[1]
        tile['maxX'] = tile['maxX'] - translation[0]
        tile['maxY'] = tile['maxY'] - translation[1]
        tile['tileZ'] = z;
    return {tile['tileId'] : tile for tile in tileBounds}

def getPointMatches(z):
    pointMatches = {}
    matchesWithinGroup = []
    matchesOutsideGroup = []
    for section in getSectionsForZ(z):
        matchesWithinGroup.extend(getMatchesWithinGroup(section))
        matchesOutsideGroup.extend(getMatchesOutsideGroup(section))
    pointMatches["matchesWithinGroup"] = matchesWithinGroup
    pointMatches["matchesOutsideGroup"] = matchesOutsideGroup
    return pointMatches

#returns coordinate data with tile ID for each z layer
#sampling rate limits the number of layers when the whole stack is generated
def getTileData(nfirst, nlast, samplingRate = 1):
    tileData = []
    translation = calculateTranslation(nfirst, nlast)
    for z in range(nfirst, nlast+1):
        if ( z % samplingRate == 0 ) :
            layerData = {}
            layerData['z'] = float(z)
            layerData['tileCoordinates'] = getTileCoordinates(z, translation)
            layerData['pointMatches'] = getPointMatches(z)
            tileData.append(layerData)
    return tileData
