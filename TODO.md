#Top Priority Tasks:

#Access Control 1.0 Release Features:
- [ ] Full documentation on how to setup a development environment.
- [ ] Ability to manage member access by cumulative period purchased (1 month + 3 months + 1 month, ect.). Note month should be defined as 30 days.
	- [ ] Is a member signed up yet? Do we need a que.
	- [ ] When does the clock start for them?
- [ ] Ability to manage member(s) access by 'group' policy.
- [ ] Ability automatically renew member access via paypal subscription.
- [ ] Ability to collect and create member data from an electronic form filled out by members.



###1) Clean up member records
-------------------------------------------
- [ ] Paul Beaudet" }	 - Member
- [ ] PaulBeaudet" }	 - ?
- [ ] Matt Minuti" }	 - Board
- [ ] Mathew Minuti 1" }	 - ?
- [ ] Claude Dupus" }	 - GSWT - change name to Dupuis
```
db.members.update({"fullname":"Claude Dupus"},{$set:{"fullname":"Claude Dupuis"}})
```
- [ ] Daniel berube" }	 - ?
- [ ] Daniel Berube" }	 - Board
- [ ] Patrick O'Brien		 - Autodesk - change name to Jennifer
```
db.members.update({"fullname":"Patrick O'Brien"},{$set:{"fullname":"Jennifer O'Brien"}})
```

###2) Create the GSWT group for:
-------------------------------------------
- [ ] Philip Boileau GSWT
```
db.members.update({"fullname":"Philip Boileau"},{$set:{"groupName":"GSWT"}})
```
- [ ] Woody Magnuson GSWT
```
db.members.update({"fullname":"Woody Magnuson"},{$set:{"groupName":"GSWT"}})
```
- [ ] Claude Dupuis GSWT
```
db.members.update({"fullname":"Claude Dupuis"},{$set:{"groupName":"GSWT"}})
```
- [ ] Ron Marcoux GSWT
```
db.members.update({"fullname":"Ron Marcoux"},{$set:{"groupName":"GSWT"}})
```
###3) Group members will all be updated with the same expiration time:
-------------------------------------------
- [ ] Autodesk (EPOCH 1497992361 == June. 20th 2017)
```
db.members.updateMany({"groupName":"Autodesk"},{$set:{"expirationTime":"1497992361"}},{multi:true})
```
- [ ] GSWT (EPOCH 1509656361 == Nov. 2nd 2017)
```
db.members.updateMany({"groupName":"GSWT"},{$set:{"expirationTime":"1509656361"}},{multi:true})
```
###4) Add new data rows to members document.
-------------------------------------------
- [ ] membershipsubscription : 1/0
- [ ] contractonfile : 1/0 (should be a different collection?)

###5) If member has a membershipsubscription value of 1 they are enabled for auto-renewal.
-------------------------------------------

------------------------------------------------------------------------------------------------------------

#Access Control 2.0 Release Features:
- Access tokens have a written value instead of default number.
- Add CI/CD for access control system.
- Machine access i.e. lathe, band saw, ect.

------------------------------------------------------------------------------------------------------------








### Todo backlog list

Save anything thing labled (optimization) for after MVP ~ minimal viable product

System design decisions:

- [ ] when or how machines will "close" access (suggestion: if member checks in, they are responsible to check out)
- [ ] What is most practical way to register users (suggestion: android app)
- [ ] what protocol should be ultimately used for Machine to Machine (mqtt, websockets, curl) (optimization)

Access point Firmware / Arduino code:

- [ ] Read wifi configuration from SPIFFS file (optimization)
- [ ] Read config for what server to talk to from SPIFFS file (optimization)
- [ ] Maybe read how long to be open for from file? Or from server response?
- [ ] test using websockets or mqtt for access point to access server communication (optimization)
- [ ] remove serial debuging messages (optimization)

Access Server code:

- [x] catch an access attempt
- [x] handle an access attepmt
- [x] schema for data storage
- [x] handle registration a card to the database
- [x] handle access attempt against database entry
- [ ] handle admin access againts hashed password
- [ ] push notify failed access atempts (optimization)
- [ ] Store machineIDs hashes in a db collection (or just ids in plain text)
- [x] handle request against machineID db entries
- [x] Account for membership expirations
- [ ] TLS? (optimization)
- [ ] handle find member request

Interface / Client side: ( cordova has an nfc plug-in that would make card registration much easier in future)

- [x] admin: find member
- [x] admin: show time to expiration for individual members
- [x] admin: add access
- [x] admin: revoke access
- [ ] admin: membership renewal
- [ ] admin: show activity (optimization)
- [ ] member display: show membership expiration
- [ ] mmeber display: Renewal reminder
- [x] put up an actual barier to admin page
- [ ] cordova admin app (optimization)
- [ ] pass push notificationID to server (optimization)

Physical Access point / Hardware:

- [ ] Update board to use better microUSB plug
- [ ] Maybe change LED header to one of the plugs used on the liquidpixels bezel cable, since those worked well.


---

### Basic Design (Backlog)

Idea is to have a system for access control that is affordable to deploy across entry ways and tooling systems (requiring training)

Plan to hit a design requirment MVP before getting too excited about specific tools, protocols, databases, ect.

First version will be no good, honestly there is some reinvention of the wheel going on here, anyhow. This is has been built before, open source with the exact same tool sets and equipment. This is for a makerspace, we will probably re-build this thing (software wise) 5 times just because we can. Everybody get their turn using their favorite tools if they have time. Right now we just need it to work ASAP 

Design requirments (minimal / highest priority features)

 - Card access to building
 - Power failure tolerant (up to 4 hours)
 - On site administration
 - automatic expiration and renewal facilities
 - simple registration/revoke process

Design suggestions

 - Card access to training required equipment
 - Extended power failure tolerance
 - Off site administration
 - access logs
 - nfc smartphone acccess
 - slack intergration
 - dedicated administration app (android: add cards/devices, recieve push updates)
 - Door greeter that shows membership status and renewal reminders

###MVP

just to get started!

- [x] REST node to esp communication
- [x] registration will be done by passing a socket event to admin client of an invalid nfc entry, admin will manually enter member data 
- [x] members will be registered in mongo
- [ ] will install on one door
- [x] server will be in the wild (heroku to test from home, raspi on-site when operational)
