import requests

base_URL = "http://tem-services.int.janelia.org:8080/render-ws/v1"

def testAPI():
    headers = {
    "Accept": "application/json"
    }
    #tile id with bounding box for each tile in a layer
    owner = "flyTEM"
    project = "FAFB00"
    stack = "v12_align_tps"
    z = 1234.0

    url = 'http://tem-services.int.janelia.org:8080/render-ws/v1/owner/%s/project/%s/stack/%s/z/%d/tileBounds' % (owner, project, stack, z)
    #returns
    # [
    #   {
    #     "minX": 0,
    #     "minY": 0,
    #     "minZ": 0,
    #     "maxX": 0,
    #     "maxY": 0,
    #     "maxZ": 0,
    #     "tileId": "string",
    #     "boundingBoxDefined": false,
    #     "deltaX": 0,
    #     "deltaY": 0
    #   }
    # ]
    r = requests.get(url, headers =  headers)
    # print r.json()


    #intra-layer point matches
    owner = "flyTEM"
    matchCollection = "v12_dmesh"
    groupId = "1234.0"
    #is of parameter type query and data type array[string], not sure how this works
    mergeCollection = {
    "mergeCollection": ["somethign", "some2"]
    }
    # [
    #   {
    #     "pGroupId": "string",
    #     "pId": "string",
    #     "qGroupId": "string",
    #     "qId": "string",
    #     "matches": {
    #       "p": [
    #         [
    #           0
    #         ]
    #       ],
    #       "q": [
    #         [
    #           0
    #         ]
    #       ],
    #       "w": [
    #         0
    #       ]
    #     }
    #   }
    # ]
    url = "http://tem-services.int.janelia.org:8080/render-ws/v1/owner/%s/matchCollection/%s/group/%s/matchesWithinGroup" % (owner, matchCollection, groupId)
    r = requests.get(url, headers =  headers, params = mergeCollection)
    print r.url
    # print r.json()

    #inter-layer point matches is the same as intra-layer point matches

class rcObj:
    def __init__(self, owner, project, stack):
        self.owner = owner
        self.project = project
        self.stack = stack
class pmObj:
    def __init__(self, owner, match_collection):
        self.owner = owner
        self.match_collection = match_collection

#gets zvalues and sectionID for all sections in the specified stack
# [
#   {
#     "sectionId": "string",
#     "z": 0,
#     "tileCount": 0,
#     "minX": 0,
#     "maxX": 0,
#     "minY": 0,
#     "maxY": 0
#   }...
# ]
def getSectionData(owner, project, stack):
    url = "/owner/%s/project/%s/stack/%s/sectionData" % (owner, project, stack)
    url = base_URL + url
    headers = {
    "Accept": "application/json"
    }
    r = requests.get(url, headers =  headers)
    return r.json()

#gets specs for all tiles in a z layer
def getTileSpecs(owner, project, stack, z):
    url = "/owner/%s/project/%s/stack/%s/z/%d/tile-specs" % (owner, project, stack, z)
    url = base_URL + url
    headers = {
    "Accept": "application/json"
    }
    r = requests.get(url, headers =  headers)
    return r.json()

def getTileBounds(owner, project, stack, z):
    url = "/owner/%s/project/%s/stack/%s/z/%d/tileBounds" % (owner, project, stack, z)
    url = base_URL + url
    headers = {
    "Accept": "application/json"
    }
    r = requests.get(url, headers =  headers)
    return r.json()

#gets specs for one tile
def getTileSpec(owner, project, stack, tileId):
    url = "/owner/%s/project/%s/stack/%s/tile/%s/" % (owner, project, stack, tileId)
    url = base_URL + url
    headers = {
    "Accept": "application/json"
    }
    r = requests.get(url, headers =  headers)
    return r.json()


def getStackBounds(owner, project, stack, z):
    url = "/owner/%s/project/%s/stack/%s/z/%d/bounds" % (owner, project, stack, z)
    url = base_URL + url
    headers = {
    "Accept": "application/json"
    }
    r = requests.get(url, headers =  headers)
    return r.json()

#nfirst and nlast are zvalue of sections in rc
#rc and pm are objects with specification for accessing collections of tile-specs and point-patches (required for the API)
#nbr is the number of neighboring sections to consider
#min_points is the minimum number of points between two tiles
#xs_weight is the weight factor for cross-section point matches
#yet to be written
def load_point_matches(nfirst, nlast, rc, pm, nbr = 4, min_points = 0, xs_weight = 1, samplingRate = 1):
    sectionData = getSectionData(rc.owner, rc.project, rc.stack)
    sectionIDs = [val['sectionId'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    zs = [val['z'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    uniqueZs = list(set(zs))
    return None

#returns coordinate data with tile ID for each z layer
def getTileData(nfirst, nlast, rc, pm, samplingRate = 1):
    sectionData = getSectionData(rc.owner, rc.project, rc.stack)
    zs = [val['z'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    uniqueZs = list(set(zs))
    tileData = []
    for z in uniqueZs:
        if ( z % samplingRate == 0 ) :
            layerData = {}
            layerData['z'] = str(z)
            tileBounds = getTileBounds(rc.owner, rc.project, rc.stack, z)
            stackBounds = getStackBounds(rc.owner, rc.project, rc.stack, z)
            # adjust the coordinates of the tiles so that they are centered around (0,0)\
            for tile in tileBounds:
                tile['minX'] = tile['minX'] - 0.5 * (stackBounds['minX'] + stackBounds['maxX'])
                tile['minY'] = tile['minY'] - 0.5 * (stackBounds['minY'] + stackBounds['maxY'])
                tile['maxX'] = tile['maxX'] - 0.5 * (stackBounds['minX'] + stackBounds['maxX'])
                tile['maxY'] = tile['maxY'] - 0.5 * (stackBounds['minY'] + stackBounds['maxY'])
            layerData['tilePosition'] = tileBounds
            tileData.append(layerData)
    return tileData
