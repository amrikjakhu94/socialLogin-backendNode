let express = require('express');
let router = express.Router();
let User = require('../models/User');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
let auth = require('../middleware/auth')
let aws = require('aws-sdk');
let s3 = require('aws-sdk/clients/s3');
let multer = require('multer');
let upload = multer({ dest: 'uploads/' });

router.post('/postimage',auth,upload.single('image'),(req,res)=>{
    console.log(req.file,'fileeee');
    if(req.file) {
        return res.status(200).json({ success: 'File received.' });
    }
    else{
        return res.status(400).json({ error: 'No file received.' });
    }
});

router.get('/myprofile',auth,(req,res)=>{
    let loggedInUser = req.user._id;
    User.findById(loggedInUser).then(
        (user)=>{
            if(user){
                return res.status(200).json(user);
            }
        }
    )
});

router.post('/signup',(req,res)=>{
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({email : email}).then(
        (user) => {
            if(user){
                return res.status(400).json({ error : 'User already exits.Try new email.' });
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
        let link = `http://localhost:3000/verify?id=${activationNumber}&email=${email}`;
        // let link = `https://stormy-ravine-20860.herokuapp.com/verify?id=${activationNumber}&email=${email}`;

        //  NodeMailer : To send email
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'idiotfriends04@gmail.com',
              pass: ''
            }
          });
          var mailOptions = {
            from: 'idiotfriends04@gmail.com',
            to: email,
            subject: 'Airtime(social login) account activation link.',
            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify your account.</a>"
          };
          transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                console.log('Email not sent...error');
            }
            else{
                console.log('Email sent: ' + info.response);
            }
          });

        return res.status(200).json( { success : 'New user created successfully.Click on the link in email to verify your account.'} );
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
                        let link = 'http://localhost:3000';
                        // let link = 'https://stormy-ravine-20860.herokuapp.com/';
                        return res.status(200).send('Account verfied...Now you can login to your account.');
                    }
                    else{
                        return res.status(404).json({ error : 'Error in account verification.' })
                    }
                }
            ).catch((err) => {
                console.error("Error occured in account verification ",+err);
            })
        }
    ).catch()
});

router.post('/signin',(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    if(!email)
        return res.status(422).json({ error : 'Email cannot be blank.' });
    if(!password)
        return res.status(422).json({ error : 'Password cannot be blank.' });
    else{
        User.findOne({email : email}).then(
            (user)=>{
                if(user){
                    if(user.provider == 'airtime'){
                        bcrypt.compare(password, user.hash, (err, result)=> {
                            if(result){
                                if(user.isverified){
                                    const token = user.generateAuthToken();
                                    return res.header('x-auth-token',token).json({ user : user, token : token });
                                }
                                else{
                                    return res.status(401).json({ error : 'Account not verified.Check your email to verify your account' })
                                }
                            }
                            else{
                                return res.status(401).json({ error : 'Authentication failed. Invalid Password.'});
                            }
                        });
                    }
                    if(user.provider == 'google'){
                        return res.status(401).json({ error : "Your account is registered with Google.Try login using 'Login with Google' "});
                        // if(user.hash == null){
                        //     console.log(req.body);
                        //     console.log('No password found');
                        //     res.status(400).send({ error : '<h1>GSDFSDFSFFSF<h1>'});
                        // }
                        // else{
                        //     bcrypt.compare(password, user.hash, (err, result)=> {
                        //         if(result){
                        //             if(user.isverified){
                        //                 const token = user.generateAuthToken();
                        //                 return res.header('x-auth-token',token).json({ user : user, token : token });
                        //             }
                        //             else{
                        //                 return res.status(401).json({ error : 'Account not verified.Check your email to verify your account' })
                        //             }
                        //         }
                        //         else{
                        //             return res.status(401).json({ error : 'Authentication failed. Invalid Password.'});
                        //         }
                        //     });
                        // }
                    }
                    if(user.provider == 'facebook'){
                        return res.status(401).json({ error : "Your account is registered with Facebook.Try login using 'Login with Facebook' "});
                    }
                }
                else{
                    return res.status(401).json({ error : 'Authentication failed. User not found.' });
                }
            }
        ).catch((err) => {
            console.error("Error occured ",+err);
        })
    }
});

router.post('/socialsignin',(req,res)=>{
    let name = req.body.name;
    let email = req.body.email;
    let image = req.body.image;
    let provider = req.body.provider;
    if(!email){
        return res.status(422).json({ error : 'Email cannot be blank.' });
    }
    else{
        User.findOne({ email : email }).then(
            (user)=>{
                if(user){
                    const token = user.generateAuthToken();
                    return res.header('x-auth-token',token).json({ user : user, token : token });
                }
                else{
                    createNewUser();
                }
            }
        ).catch((err) => {
            console.error("Error occured ",+err);
        })
    }

    async function createNewUser() {

        const newUser = new User({
            name : name,
            email : email,
            image : image,
            provider : provider,
            isverified : true
        });
        newUser.save().then(
            (newuser)=>{
                const token = newuser.generateAuthToken();
                return res.header('x-auth-token',token).json({ user : newuser, token : token });
        });
    }
});

router.post('/forgotpassword',(req,res)=>{
    let email = req.body.email;
    const activationNumber = Math.floor(( Math.random() * 484216) + 54 );
    User.findOne({email : email }).then(
        (user)=>{
            if(user){
                User.findOneAndUpdate({ _id : user._id },{ $set : { activation : activationNumber } }).then(
                    setActivationNumber=>{
                        let link = `http://localhost:4200/setnewpassword?id=${activationNumber}&email=${email}`;

                        //  NodeMailer : To send email
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                            user: 'idiotfriends04@gmail.com',
                            pass: ''
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

                        return res.status(200).json({success : 'New password email sent...Click on the link in your email to set new password.'});
                    }
                )
            }
            else{
                return res.status(404).json({ error : 'Email not sent,user not found' })
            }
        }
    ).catch((err) => {
        console.error("Error occured ",+err);
    })
});

router.post('/setnewpassword',(req,res)=>{
    //console.log(req.query);
    let email = req.body.email;
    let activationNumber = req.body.id;
    User.findOne({email : email, activation : activationNumber}).then(
        (user)=>{
            if(user){
                return res.status(200).json({ success : "Set new password now..." });
            }
            else{
                return res.status(401).json({ error : 'Unauthorized access.'});
            }
        }
    ).catch((err) => {
        console.error("Error occured ",+err);
    })
});

router.post('/postsetnewpassword',(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    signUserIn();
    
    async function signUserIn(){
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password,salt);
    
        User.findOneAndUpdate({ email : email },{ $set : { salt : salt , hash : hashed } }).then(
            (user)=>{
                if(user){
                    const token = user.generateAuthToken();
                    return res.header('x-auth-token',token).json({ user : user, token : token });
                }
                else{
                    return res.status(401).json({ error : 'Unauthorized access.'});
                }
            }
        ).catch((err) => {
            console.error("Error occured ",+err);
        })
    }
});

module.exports = router;
