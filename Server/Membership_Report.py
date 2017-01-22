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
	return (dt - EPOCH).total_seconds()


#===============================   MAIN   ====================================

#Specify the connection to the mongo database:
#client = MongoClient('mongodb://localhost:27017')
client = MongoClient('mongodb://192.168.1.3:27017')

db = client['makerauth']
members = db['members']

#Create a file object to write the reports to.
reportFile = open('membership_report.txt','w')
reportFile.write("=========	MEMBERSHIP REPORT	=========\n")

today = datetime.datetime.now()
todayPretty = today.strftime("%m%d%Y")
todayShort = today.strftime("%b-%d")
todayEpoch = unix_time_millis(today)

#fromDate = today - timedelta(days=14)
fromDate = today - timedelta(days=600)
fromDatePretty = fromDate.strftime("%m%d%Y")
fromDateShort = fromDate.strftime("%b-%d")
fromDateEpoch = unix_time_millis(fromDate)

reportFile.write("Date Range:	%s - %s\n\n" % (fromDatePretty,todayPretty))

#Run queries on the 'members' collection, and format the results.
reportFile.write("fromDate == %s\n"%(fromDate))
reportFile.write("fromDateEpoch == %s\n"%(fromDateEpoch))
reportFile.write("EPOCH == %s\n"%(EPOCH))

#Total members: (all member records in db)
numTotal = members.count()
reportFile.write("\nTotal Member Records == %s\n"%(numTotal))

#Members gained: (new members in the past 2 weeks)
numGained = members.count({"startDate":{"$gte":fromDateEpoch}})
reportFile.write("Members Gained since (%s) == %s\n" % (fromDateShort,numGained))
regex_fullname=re.compile(".*fullname.*:\su'([\w\s]*)")
fullName = "NO_NAME"
for member in members.find({"startDate":{"$gte":fromDateEpoch}},{"_id":0,"fullname":1}):
	#Who are they?
	fullName = regex_fullname.search(str(member)).group(1)
	reportFile.write("	%s\n" % (fullName))

#Members lost: (members expired in the past 2 weeks)
numLost = members.count({"expirationTime":{"$gte":fromDateEpoch}})
reportFile.write("Members Lost since (%s) == %s\n" % (todayShort,numLost))
fullName = "NO_Name" #Keep this here so that we don't accidentally carry over values
for member in members.find({"expirationTime":{"$gte":fromDateEpoch}},{"_id":0,"fullname":1}):
	#Who are they?
	fullName = regex_fullname.search(str(member)).group(1)
	reportFile.write("	%s\n" % (fullName))

#Members in good standing:
numGoodStanding = members.count({"expirationTime":{"$gte":todayEpoch}})
reportFile.write("Members in Good Standing == %s\n" % (numGoodStanding))

#NOTE: find() returns a Cursor instance, which allows us to iterate over all matching documents.
#Find all group members.
numGM = members.count({"groupName":{"$exists":True , "$ne":""}})
reportFile.write("Group Members in Good Standing == %s\n" % (numGM))
#for member in members.find({"groupName":{"$exists":True , "$ne":""}}):
#	reportFile.write(str(pprint.pprint(member)))


#How many members have signed a contract?
#How many members are subscription based, 3 month, 1 year, group, ect?


#Close file object when finished.
reportFile.close()
