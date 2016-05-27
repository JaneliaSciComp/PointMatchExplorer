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

#only returns bounding box data with tile ID for each z layer
def load_point_matches(nfirst, nlast, rc, pm, nbr = 4, min_points = 0, xs_weight = 1):
    sectionData = getSectionData(rc.owner, rc.project, rc.stack)
    #determine the list of section IDs that
    sectionIDs = [val['sectionId'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    zs = [val['z'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    # print len(zs)
    uniqueZs = list(set(zs))
    # print len(uniqueZs)
    # print uniqueZs
    retval = []
    #this only runs once for now
    for z in uniqueZs:
        layerData = {}
        layerData['z'] = str(z)
        # print z
        # tileSpecs = getTileSpecs(rc.owner, rc.project, rc.stack, z)
        # tileIDs = [tile['tileId'] for tile in tileSpecs]
        tileBounds = getTileBounds(rc.owner, rc.project, rc.stack, z)
        stackBounds = getStackBounds(rc.owner, rc.project, rc.stack, z)
        # tileIDsfrombounds = [tile['tileId'] for tile in tileBounds]
        #these are from GET /v1/owner/{owner}/project/{project}/stack/{stack}/z/{z}/bounds
        for tile in tileBounds:
            tile['minX'] = tile['minX'] - stackBounds['minX']
            tile['minY'] = tile['minY'] - stackBounds['minY']
            tile['maxX'] = tile['maxX'] - stackBounds['minX']
            tile['maxY'] = tile['maxY'] - stackBounds['minY']
        layerData['tilePosition'] = tileBounds
        retval.append(layerData)
        # print len(tileIDs)
        # print len(tileIDsfrombounds)
        # print tileIDs
    # print set([x for x in zs if zs.count(x) > 1])
    # 151210090232041025.501.0

    # print sectionIDs
    # print retval
    return retval

def getTileData(nfirst, nlast, rc, pm, nbr = 4, min_points = 0, xs_weight = 1):
    sectionData = getSectionData(rc.owner, rc.project, rc.stack)
    sectionIDs = [val['sectionId'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    zs = [val['z'] for val in sectionData if val['z'] >= nfirst and val['z'] <= nlast]
    uniqueZs = list(set(zs))
    retval = []
    for z in uniqueZs:
        layerData = {}
        layerData['z'] = str(z)
        tileSpecs = getTileSpecs(rc.owner, rc.project, rc.stack, z)
        tileRC = [(tile["layout"]["imageRow"], tile["layout"]["imageCol"]) for tile in tileSpecs]
        layerData['tileGridPositions'] = tileRC
        retval.append(layerData)
    # print retval
    return retval
