// accessBot.js ~ Copyright 2016 Manchester Makerspace ~ License MIT

var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    init: function(){
        mongo.ose.connect(process.env.MONGODB_URI);                                   // connect to our database
        var Schema = mongo.ose.Schema; var ObjectId = Schema.ObjectId;
        mongo.member = mongo.ose.model('member', new Schema({                         // create user object property
            id: ObjectId,                                                             // unique id of document
            fullname: { type: String, required: '{PATH} is required', unique: true }, // full name of user
            cardID: { type: String, required: '{PATH} is required', unique: true },   // user card id
            status: {type: String, Required: '{PATH} is required'},                   // type of account, admin, mod, ect
            accesspoints: [String],                                                   // points of access member (door, machine, ect)
            expirationTime: {type: Number},                                           // pre-calculated time of expiration
            groupName: {type: String},                                                // potentially member is in a group/partner membership
            groupKeystone: {type: Boolean},                                           // notes who holds expiration date for group
            groupSize: {type: Number},                                                // notes how many members in group given in one
            password: {type: String},                                                 // for admin cards only
            email: {type: String},                                                    // store email of member for prosterity sake
        }));
        mongo.bot = mongo.ose.model('bot', new Schema({
            id: ObjectId,
            machineID: {type: String, required: '{PATH} is required', unique: true},  // unique identifier of point of access
            botName: {type: String, required: '{PATH} is required', unique: true},    // human given name for point of access
            type: {type: String, required: '{PATH} is required'},                     // type (door, tool, kegerator, ect)
        }));
    }
};

var slack = {
    webhook: require('@slack/client').IncomingWebhook, // url to slack intergration called "webhook" can post to any channel as a "bot"
    request: require('request'),                       // needed to make post request to slack api
    token: process.env.SLACK_TOKEN,                    // authentication to post as and invidual (in this case an admin user is needed to inivite new members)
    wh: null,                                          // webhook connection object if successfully connected
    init: function(){                                  // runs only once on server start up (may be we should timeout retrys)
        try {                                          // slack is not a dependancy, will fail softly if no internet or slack
            slack.wh = new slack.webhook(process.env.SLACK_WEBHOOK_URL, { // instantiate webhook (bot) w/ its url and profile
                username: 'doorboto',                  // Name of bot
                channel: 'whos_at_the_space',          // channel that this intergration spams in particular
                iconEmoji: ':robot_face:',             // icon emoji that bot uses for a profile picture
                defaultText: 'domo arigato ka?'        // message that gets sent when no value is passed to send
            });
            slack.wh.send('doorboto started');         // Notes that server just started or restarted
        } catch(e){console.log('no connection to slack:' + e);} // handle not being connected
    },
    send: function(msg){
        try      {slack.wh.send(msg);}                                    // try to send
        catch (e){console.log('slack: No Sendy:'+ msg + ' - Cause:'+ e);} // fail softly if slack or internet is down
    },
    invite: function(email, newMember){
        try { // there are no errors only unexpected results
            var channels = '&channels=C050A22AL,C050A22B2,G2ADCCBAP,C0GB99JUF,C29L2UMDF,C0MHNCXGV,C1M5NRPB5,C14TZJQSY,C1M6THS3E,C1QCBJ5D3';
            // Channels - general, random, who_at_the_space , 36_old_granite, talk_to_the_board, automotive, electronics, rapid p, wood, metal
            var emailReq = '&email=' + email;               // NOTE: has to be a valid email, no + this or that
            var inviteAddress = 'https://slack.com/api/users.admin.invite?token=' + slack.token + emailReq + channels;
            console.log(inviteAddress);
            slack.request.post(inviteAddress, function(error, response, body){
                var msg = 'NOT MADE';                       // default to returning a possible error message
                if(error){slack.failedInvite(error);}       // post request error
                else if (response.statusCode == 200){       // give a good status code
                    body = JSON.parse(body);
                    if(body.ok){                            // check if reponse body ok
                        msg = 'invite pending';             // if true, success!
                    } else {                                // otherwise
                        if(body.error){slack.failedInvite('error ' + body.error);} // log body error
                    }
                } else {                                    // maybe expecting possible 404 not found or 504 timeout
                    slack.failedInvite('other status ' + response.statusCode);   // log different status code
                }
                slack.send(newMember + ' just signed up! Slack invite: ' + msg); // regardless post registration event to whosAtTheSpace
            });
        } catch (e){slack.failedInvite(e);}                                      // fail softly in case there is no connection to outside
    },
    failedInvite: function(error){console.log('slack: invite failed:' + error);} // common fail message
};

var auth = {                                                                  // depends on mongo and sockets: authorization events
    orize: function(success, fail){                                           // takes functions for success and fail cases
        return function(data){                                                // return pointer to funtion that recieves credentials
            mongo.bot.findOne({machineID: data.machine}, auth.foundBot(data, success, fail));
        };                                                                    // first find out which bot we are dealing with
    },
    foundBot: function(data, success, fail){                                  // callback for when a bot is found in db
        return function(error, bot){                                          // return a pointer to this function to keep params in closure
            if(error){fail('finding bot:' + error);}
            else if(bot){ mongo.member.findOne({cardID: data.card}, auth.foundMember(data, success, fail));}
            else {
                sockets.io.emit('regBot', data.machine);                      // signal an interface prompt for registering bots
                fail('not a bot');
            }
        };
    },
    foundMember: function(data, success, fail){                                           // callback for when a member is found in db
        return function(error, member){
            if(error){fail('finding member:' + error);}
            else if (member){
                sockets.io.emit('memberScan', member);                                    // member scan.. just like going to the airport
                if (auth.checkAccess(data.machine, member.accesspoints)){
                    if(member.status === 'Revoked'){
                        fail('Revoked');
                    } else if (member.groupName){                                         // if this member is part of a group membership
                        mongo.member.findOne({groupName: member.groupName, groupKeystone: true}, auth.foundGroup(data, member.fullname, success, fail));
                    } else { auth.checkExpiry(member, member.fullname, success, fail); }  // given no group, no error, and good in standing
                } else {fail('not authorized');}                                          // else no machine match
            } else {
                sockets.io.emit('regMember', {cardID: data.card, machine: data.machine}); // emit reg info to admin
                fail('not a member');                                                     // given them proper credentials to put in db
            }
        };
    },
    foundGroup: function(data, memberName, success, fail){                                // callback for when a group is found in db
        return function(error, group){
            if(error)      { fail('finding group admin:' + error); }
            else if (group){ auth.checkExpiry(group, memberName, success, fail);}
            else           { fail('no group admin');}
        };
    },
    checkExpiry: function(member, memberName, success, fail){
        if(new Date().getTime() > new Date(member.expirationTime).getTime()){ // if membership expired
            fail('expired');                                                  // TODO notify admin of expiration
        } else { success(memberName); }                                       // otherwise, LET THEM IN!!!!
    },
    checkAccess: function(machine, authorized){                               // takes current machine and array of authorized machines
        for(var i = 0; i < authorized.length; i++){                           // against all authorized machines
            if(authorized[i] === machine){return true;}                       // is this member authorized for this machine
        }
        return false;                                                         // given no matches they are not authorized
    }
};

var search = {                 // depends on mongo and sockets
    findAny: function(query){  // not functional yet this will be for listing members
        var cursor = mongo.member.find(query).cursor();
        cursor.on('data', function gotData(member){
            sockets.io.emit('foundMember', member);
        });
        cursor.on('close', function doneListingMembers(){
            console.log('done listing members');
        });
    },
    find: function(query){  // response to member searches in admin client
        mongo.member.findOne({fullname: query}, function(err, member){
            if(err)         { sockets.io.emit('message', 'search issue: ' + err); }
            else if(member) { sockets.io.emit('found', member); }
            else            { sockets.io.emit('message', 'no member with that name, maybe bad spelling?');}
        });
    },
    revokeAll: function(fullname){
        mongo.member.findOne({fullname: fullname}, function(err, member){
            if(err){
                sockets.io.emit('message', 'search issue: ' + err);
            }else if(member){
                member.status = 'Revoked'; // set no acces to anything
                member.save(search.updateCallback('member revoked'));
            } else { sockets.io.emit('message', 'Inconcievable!');}       // you keep using that word...
        });
    },
    renew: function(update){
        mongo.member.findOne({fullname: update.fullname}, function(err, member){
            if(err){sockets.io.emit('message', 'renew issue: ' + err);}   // case of db error, report failure to admin
            else if (member){                                             // case things are going right
                member.expirationTime = update.expirationTime;            // set new expiration time
                member.save(search.updateCallback('renewed membership')); // save and on save note success to admin
            } else { sockets.io.emit('message', 'Inconcievable!');}       // I don't think that word means what you think it means
        });
    },
    updateCallback: function(msg){ // returns a custom callback for save events
        return function(err){
            if(err){ sockets.io.emit('message', 'update issue:' + err); }
            else { sockets.io.emit('message', msg); }
        };
    },
    group: function(groupName){
        mongo.member.findOne({groupName: groupName, groupKeystone: true}, function(error, member){
            if(error){ sockets.io.emit('message', 'find group issue:' + error);}
            else if (member){
                sockets.io.emit('foundGroup', {exist: true, expirationTime: member.expirationTime});
            } else { sockets.io.emit('foundGroup', {exist: false}); }
        });
    }
};

var register = {
    member: function(registration){                              // registration event
        var member = new mongo.member(registration);             // create member from registration object
        member.save(register.response(registration));            // save method of member scheme: write to mongo!
    },
    bot: function(robot){
        var bot = new mongo.bot(robot);                          // create a new bot w/info recieved from client/admin
        bot.save(register.response);                             // save method of bot scheme: write to mongo!
    },
    response: function(registration){
        return function(error){                                          // callback for member save
            if(error){ sockets.io.emit('message', 'error:' + error); }   // given a write error
            else {
                slack.invite(registration.email, registration.fullname); // invite newly registered member to slack
                sockets.io.emit('message', 'save success');              // show save happened to web app
            }
        }
    }
};

var sockets = {                                                           // depends on register, search, auth: handle socket events
    io: require('socket.io'),
    listen: function(server){
        sockets.io = sockets.io(server);
        sockets.io.on('connection', function(socket){
            socket.on('newMember', register.member);                      // in event of new registration
            socket.on('newBot', register.bot);                            // event new bot is registered
            socket.on('find', search.find);                               // event admin client looks to find a member
            socket.on('revokeAll', search.revokeAll);                     // admin client revokes member privilages
            socket.on('auth', auth.orize(
                function(memberName){
                    sockets.io.to(socket.id).emit('auth', 'a');
                    slack.send(memberName + ' just checked in');
                },
                function(msg){
                    sockets.io.to(socket.id).emit('auth', 'd');
                    slack.send('someone was denied access');
                })); // credentials passed from socket AP
            socket.on('renew', search.renew);                             // renewal is passed from admin client
            socket.on('findGroup', search.group);                         // find to to register under a group
        });
    }
};

var routes = {                                                            // depends on auth: handles routes
    auth: function(req, res){                                             // get route that acccess control machine pings
        var authFunc = auth.orize(
            function(memberName){
                res.status(200).send('a');
                slack.send(memberName + ' just checked in');
            }, // create authorization function
            function(msg){
                res.status(403).send(msg);
                slack.send('someone was denied access');
            });
        authFunc(req.params);                                             // execute auth function against credentials
    },
    admin: function(req, res){                                            // post by potential admin request to sign into system
        if(req.body.fullname === 'admin' && req.body.password === process.env.MASTER_PASS){
            res.render('register', {csrfToken: req.csrfToken()});
        } else { res.send('denied'); }                                    // YOU SHALL NOT PASS
    },
    login: function(req, res){ res.render('signin', {csrfToken: req.csrfToken()}); } // get request to sign into system
};

var cookie = {                                               // Admin authentication / depends on client-sessions
    session: require('client-sessions'),                     // mozilla's cookie library
    ingredients: {                                           // personally I prefer chocolate chips
        cookieName: 'session',                               // guess we could call this something different
        secret: process.env.SESSION_SECRET,                  // do not track secret in version control
        duration: 7 * 24  * 60 * 60 * 1000,                  // cookie times out in x amount of time
    },
    meWant: function(){return cookie.session(cookie.ingredients);}, // nom nom nom!
    decode: function(content){return cookie.session.util.decode(cookie.ingredients, content);},
};

var serve = {                                                // depends on cookie, routes, sockets: handles express server setup
    express: require('express'),                             // server framework library
    parse: require('body-parser'),                           // JSON parsing library
    theSite: function (){                                    // methode call to serve site
        var app = serve.express();                           // create famework object
        var http = require('http').Server(app);              // http server for express framework
        app.set('view engine', 'jade');                      // use jade to template html files, because bad defaults
        app.use(require('compression')());                   // gzipping for requested pages
        app.use(serve.parse.json());                         // support JSON-encoded bodies
        app.use(serve.parse.urlencoded({extended: true}));   // support URL-encoded bodies
        app.use(cookie.meWant());                            // support for cookies (admin auth)
        app.use(require('csurf')());                         // Cross site request forgery tokens (admin auth)
        app.use(serve.express.static(__dirname + '/views')); // serve page dependancies (sockets, jquery, bootstrap)
        var router = serve.express.Router();                 // create express router object to add routing events to
        router.get('/', routes.login);                       // log in page
        router.post('/', routes.admin);                      // request registration page
        if(process.env.TESTING_MA){
            router.get('/:machine/:card', routes.auth);      // authentication route
        }
        app.use(router);                                     // get express to user the routes we set
        sockets.listen(http);                                // listen and handle socket connections
        http.listen(process.env.PORT);                       // listen on specified PORT enviornment variable
    }
};

mongo.init();    // conect to our mongo server
slack.init();    // fire up slack intergration
serve.theSite(); // Initiate site!
