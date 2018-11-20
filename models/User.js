const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let jwt = require('jsonwebtoken');

const userSchema = Schema({
    name : {
        type : String,
        trim : true
    },
    email : {
        type : String,
        unique : true,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
    },
    image : {
        type : String,
        default : 'http://conferenceoeh.com/wp-content/uploads/profile-pic-dummy.png'
    },
    salt : {
        type : String
    },
    hash : {
        type : String
    },
    provider : {
        type : String,
        default : 'airtime'
    },
    activation : {
        type : Number,
        default : 0
    },
    isverified : {
        type : Boolean,
        default : false
    }
},{ timestamps : true });

userSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({ _id:this._id },'jwtPrimaryKey');
    return token;
}

module.exports = mongoose.model('User',userSchema);
