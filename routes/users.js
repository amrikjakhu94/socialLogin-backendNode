let express = require('express');
let router = express.Router();
let User = require('../models/User');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');

// router.post('/signin',(req,res)=>{
//     console.log(req.body,' request body...');
//     return res.status(200).json(req.body);
// });

// router.post('/signup',(req,res)=>{
//     let email = req.body.email;
//     let password = req.body.password;
//     console.log(req.body,' request body...');
//     //User.findOne()
//     return res.status(200).json(req.body);
// });

router.post('/signup',(req,res)=>{
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({email : email}).then(
        (user) => {
            if(user){
                return res.status(400).json({ User : 'already exits' });
            }
            else{
                createNewUser();
            }
        }
    ).catch((err) => {
        console.error("Error occured ",+err);
    });

    async function createNewUser() {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password,salt);

        const activationNumber = Math.floor(( Math.random() * 546795) + 54 );

        const newUser = new User({
            name : name,
            email : email,
            salt : salt,
            hash : hashed,
            activation : activationNumber
        });
        newUser.save().then(()=>{
        //let link = `http://localhost:3000/verify?id=${activationNumber}&email=${email}`;
        let link = `https://stormy-ravine-20860.herokuapp.com/verify?id=${activationNumber}&email=${email}`;

        //  NodeMailer : To send email
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'idiotfriends04@gmail.com',
              pass: 'aj16112111'
            }
          });
          var mailOptions = {
            from: 'idiotfriends04@gmail.com',
            to: email,
            subject: 'Airtime(social login) account activation link.',
            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify your account.</a>"
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              console.log('Email not sent...error');
            } else {
              console.log('Email sent: ' + info.response);
            }
          });


        return res.status(200).json( { User : ' created'} );
    });
    }

});

router.get('/verify',(req,res)=>{
    //console.log(req.query);
    let email = req.query.email;
    let activationNumber = req.query.id;
    User.findOne({ $and : [{email : email, activation : activationNumber }] }).then(
        user=>{
            User.findOneAndUpdate({ email : email },{ $set : { isverified : true } }).then(
                verfied=>{
                    if(verfied){
                        //let link = 'http://localhost:3000';
                        let link = 'https://stormy-ravine-20860.herokuapp.com/';
                        return res.send('Account verfied...Now you can login to your account.');
                    }
                    else{
                        res.send('Error in account verification.')
                    }
                }
            )
        }
    ).catch()
});

router.post('/signin',(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    if(!email)
        return res.status(422).json({Errors: {Email: "can't be blank"}});
    if(!password)
        return res.status(422).json({Errors: {Password: "can't be blank"}});
    else{
        User.findOne({email : email}).then(
            (user)=>{
                if(user){
                    bcrypt.compare(password, user.hash, (err, result)=> {
                        if(result){
                            if(user.isverified){
                                const token = user.generateAuthToken();
                                res.header('x-auth-token',token).json({ user : user, token : token });
                            }
                            else{
                                res.status(401).json({ auth : 'Account not verified.Check your email to verify your account' })
                            }
                       }
                       else{
                           res.status(401).json({ Message : 'Authentication failed. Invalid Password.'});
                       }
                    });
                }
                else{
                    return res.status(401).json({ Message : 'Authentication failed. User not found.' });
                }
            }
        ).catch((err) => {
            console.error("Error occured ",+err);
        })
    }
});

router.post('/forgotpassword',(req,res)=>{
    let email = req.body.email;
    const activationNumber = Math.floor(( Math.random() * 484216) + 54 );
    User.findOne({email : email }).then(
        user=>{
            if(user){
                User.findOneAndUpdate({ _id : user._id },{ $set : { activation : activationNumber } }).then(
                    setActivationNumber=>{
                        let link = `http://localhost:4200/setnewpassword?id=${activationNumber}&email=${email}`;

                        //  NodeMailer : To send email
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                            user: 'idiotfriends04@gmail.com',
                            pass: 'aj16112111'
                            }
                        });
                        var mailOptions = {
                            from: 'idiotfriends04@gmail.com',
                            to: email,
                            subject: 'Airtime forgot password link.',
                            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify your account.</a>"
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                            console.log(error);
                            console.log('Email not sent...error');
                            } else {
                            console.log('Email sent: ' + info.response);
                            }
                        });

                        return res.status(200).json({sent : 'New password email sent...Click on the link in your email to set new password.'});
                    }
                )
            }
            else{
                res.status(404).json({ Error : 'user not found' })
            }
        }
    ).catch()
});

router.get('/setnewpassword',(req,res)=>{
    //console.log(req.query);
    let email = req.query.email;
    let activationNumber = req.query.id;
    User.findOne({email : email, activation : activationNumber }).then(
        user=>{
            if(user){
                res.status(200).json({ set : "new password now..." });
            }
            else{
                res.status(401).json({unauthorization : 'access.'});
            }
        }
    ).catch()
});

module.exports = router;
