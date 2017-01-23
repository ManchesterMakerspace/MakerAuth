#!/usr/bin/env python
import sys
sys.path.append('/usr/local/lib/python2.7/dist-packages')
import pprint
import pymongo
from pymongo import MongoClient
import datetime
from datetime import timedelta
import re

EPOCH = datetime.datetime.utcfromtimestamp(0)

def unix_time_millis(dt):
	return int(round((dt - EPOCH).total_seconds()*1000))


#===============================   MAIN   ====================================

#Specify the connection to the mongo database:
client = MongoClient('mongodb://localhost:27017')
#client = MongoClient('mongodb://192.168.1.3:27017')

db = client['makerauth']
members = db['members']

#Create a file object to write the reports to.
reportFile = open('membership_report.txt','w')
reportFile.write("=========	MEMBERSHIP REPORT	=========\n")

today = datetime.datetime.now()
todayPretty = today.strftime("%b-%d-%Y")
todayShort = today.strftime("%b-%d")
todayEpoch = unix_time_millis(today)

fromDate = today - timedelta(days=14)
fromDatePretty = fromDate.strftime("%b-%d-%Y")
fromDateShort = fromDate.strftime("%b-%d")
fromDateEpoch = unix_time_millis(fromDate)

reportFile.write("Date Range:	%s -to- %s\n\n" % (fromDatePretty,todayPretty))

#----------------------------------------- Run queries on the 'members' collection, and format the results.
#Total members: (all member records in db)
numTotal = members.count()
reportFile.write("\nTotal Member Records == %s\n"%(numTotal))

#Members gained: (new members in the past 2 weeks)
reportFile.write("\n=========== GAINED =============\n")
numGained = members.count({"startDate":{"$gte":fromDateEpoch}})
reportFile.write("Members Gained since (%s) == %s\n" % (fromDateShort,numGained))
regex_fullname=re.compile(".*fullname.*:\su'([\w\s]*)")
whoGained = members.find({"startDate":{"$gte":fromDateEpoch}},{"_id":0,"fullname":1})
fullName = "NO_NAME"
for member in whoGained:
	#Who are they?
	fullName = regex_fullname.search(str(member)).group(1)
	reportFile.write("%s\n" % (fullName))

#Members lost: (members expired in the past 2 weeks)
reportFile.write("\n=========== LOST =============\n")
numLost = members.count({"expirationTime":{"$gte":fromDateEpoch,"$lte":todayEpoch}})
whoLost = members.find({"expirationTime":{"$gte":fromDateEpoch,"$lte":todayEpoch}},{"_id":0,"fullname":1})
reportFile.write("Members Lost since (%s) == %s\n" % (fromDateShort,numLost))
fullName = "NO_Name" #Keep this here so that we don't accidentally carry over values
for member in whoLost:
	#Who are they?
	fullName = regex_fullname.search(str(member)).group(1)
	reportFile.write("%s\n" % (fullName))

#Members in good standing:
reportFile.write("\n=========== IN GOOD STANDING =============\n")
numGoodStanding = members.count({"expirationTime":{"$gte":todayEpoch}})
reportFile.write("Individual Members in Good Standing == %s\n" % (numGoodStanding))
indvMem = members.find({"expirationTime":{"$gte":todayEpoch}},{"_id":0,"fullname":1})
fullName = "NO_Name"
for member in indvMem:
	#Who are they?
	fullName = regex_fullname.search(str(member))
	reportFile.write("%s\n" % (fullName))


#NOTE: find() returns a Cursor instance, which allows us to iterate over all matching documents.
#Find all group members.
numGM = members.count({"groupName":{"$exists":True , "$ne":""}})
reportFile.write("Group Members in Good Standing == %s\n" % (numGM))
#groupMem = members.find({"expirationTime":{"$gte":todayEpoch,"groupName":{"$exists":True}}},{"_id":0,"fullname":1,"groupName":1})
groupMem = members.find({"groupName":{"$exists":True}},{"_id":0,"fullname":1})
fullName = "NO_Name"
for member in groupMem:
	#Sort by group, who are they?
	fullName = regex_fullname.search(str(member))
	reportFile.write("%s - group = \n" % (fullName))



#How many members have signed a contract?
#How many members are subscription based, 3 month, 1 year, group, ect?


#Close file object when finished.
reportFile.close()
