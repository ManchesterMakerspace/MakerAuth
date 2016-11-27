
var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    init: function(db_uri){
        mongo.ose.connect(db_uri);                                                    // connect to our database
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
        mongo.payments = mongo.ose.model('payments', new Schema({
            id: ObjectId,
            firstname: {type: String, required: '{PATH} is required'},
            lastname: {type: String, required: '{PATH} is required'},
            email: {type: String, required: '{PATH} is required'},
            paidFor: {type: String, required: '{PATH} is required'},
            amount: {type: Number, required: '{PATH} is required'},
            dateOfPurchase: {type: Number, required: '{PATH} is required'},
        }));
    }
};

module.exports = mongo;
