#!/usr/bin/env python
import sys
sys.path.append('/usr/local/lib/python2.7/dist-packages')
import pprint
import pymongo
from pymongo import MongoClient

#Specify the connection to the mongo database:
client = MongoClient('mongodb://localhost:27017')
db = client['makerauth']
members = db['members']

#Run queries on the 'members' collection, and format the results.
#find() returns a Cursor instance, which allows us to iterate over all matching documents.
#Find all group members.
for member in members.find({"groupName":"Autodesk"}):
	pprint.pprint(member)

#pprint.pprint(collection.find_one({'fullname':'Daniel Perrinez'}))
#result = collection.find_one({"groupName":"Autodesk"})

