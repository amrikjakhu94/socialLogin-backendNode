let express = require('express');
let router = express.Router();
let User = require('../models/User');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
let auth = require('../middleware/auth')
let AWS = require('aws-sdk');
let s3 = require('aws-sdk/clients/s3');
let multer = require('multer');
let users_controller = require('./users-controller');
let sharp = require('sharp');
let crypto = require('crypto');
let request = require('request');
// let upload = multer({ dest: 'uploads/' });


// Code that gets form data from frontend and uplaod image on s3 as well ----------
let upload = multer();
var bucket = "bucket-amrik";
var s3Client = new AWS.S3({
    accessKeyId: 'AKIAJL23NLZM6CNNSAJA',
    secretAccessKey: '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'
});
router.post('/uploadimage22',upload.single('image'),(req,res)=>{
    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    console.log(req.body.name); // req.body has the form data
    if (!req.file) {
	//   console.log("No file received");
	  return res.send({success: false});

	} else {
        // console.log(req.file,'99999');
        let userId = "53436546ff534a4234";
        let imageid = getRandomName(userId);
            s3Client.putObject({
                Bucket: bucket,
                Key: imageid,
                ACL: 'public-read',
                Body: req.file.buffer,
                ContentType: 'image/png',
            }, function(err, data) {
                if (err) {
                    console.log('Error while uploading to S3');
                    console.log(err);
                    return res.status(400).json({ error : 'Error in upload' });
                }
                else{
                    let imageUrl = `https://s3.ap-south-1.amazonaws.com/bucket-amrik/${imageid}`;

                    return res.status(200).json({ imageUrl: imageUrl , success : 'Image uploaded' });
                }
            })
        function getRandomName(originalName) {
            return crypto.randomBytes(16).toString('hex') + originalName;
          }
	}
})
// Code ends that gets form data from frontend and uplaod image on s3 as well ----------




// final image upload code --------
// let upload = multer();
// var bucket = "bucket-amrik";
// var s3Client = new AWS.S3({
//     accessKeyId: 'AKIAJL23NLZM6CNNSAJA',
//     secretAccessKey: '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'
// });
// router.post('/uploadfile99',upload.single('amrik'),(req,res)=>{
//     console.log('6666666');
// 	if (!req.file) {
// 	//   console.log("No file received");
// 	  return res.send({success: false});
  
// 	} else {
//         console.log(req.file,'99999');
//         let userId = "53436546ff534a4234";
//         let imageid = getRandomName(userId);
//             s3Client.putObject({
//                 Bucket: bucket,
//                 Key: imageid,
//                 ACL: 'public-read',
//                 Body: req.file.buffer,
//                 ContentType: 'image/png',
//             }, function(err, data) {
//                 if (err) {
//                     console.log('Error while uploading to S3');
//                     console.log(err);
//                     return res.status(400).json({ error : 'Error in uploaded' });
//                 }
//                 else{
//                     let imageUrl = `https://s3.ap-south-1.amazonaws.com/bucket-amrik/${imageid}`;

//                     return res.status(200).json({ imageUrl: imageUrl , success : 'Image uploaded' });
//                 }
//             })
//         function getRandomName(originalName) {
//             return crypto.randomBytes(16).toString('hex') + originalName;
//           }
// 	}
// });
// final image upload code end --------


router.post('/fileupload',users_controller.uploadImage);


// ram's code
let storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './images_uploaded')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-'+ Date.now());
    }
})

//let upload = multer({storage: storage});
const fs = require('fs');

// var bucket = "bucket-amrik";
// var s3Client = new AWS.S3({
//     accessKeyId: 'AKIAJL23NLZM6CNNSAJA',
//     secretAccessKey: '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'
// })

router.post('/upload', upload.single('image'), (req, res)=>{
    // let loggedInUser = req.user._id;
    console.log(req.file,'222222222');
    if(!req.file){
        // console.log("No file received");
        res.status(400).json({ error : 'No file received.' })
    }
    else{
        // console.log("File received");
        let pathname = 
        s3Client.putObject({
            Bucket: bucket,
            Key: req.file.filename,
            ACL: 'public-read',
            Body: fs.readFileSync(req.file.path),
            ContentLength: req.file.size,
            ContentType: req.file.mimetype,
        }, function(err, data){
            if (err) {
                return res.json({error: "Error while uploading image."});
            }
            let imageUrl = "https://s3.ap-south-1.amazonaws.com/"+bucket+"/"+req.file.filename;
            // console.log("image url", imageUrl);
            // let imageObj = { image : imageUrl };
            // User.findByIdAndUpdate( loggedInUser, imageObj ).then(
            //     uploaded=>{
            //         return res.json({success: 'Image uploaded successfully', data: imageUrl });        
            //     }
            // )
            return res.json({success: 'Image uploaded successfully', data: imageUrl });
        })
    }
});

router.get('/upload', function(req, res, next){
    console.log("helllllll");
})
// ram's code end


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
    let confirmpassword = req.body.confirmpassword;
    if(!name){
        return res.status(400).json({error : "Name cannot be blank"});
    }
    if(!email){
        return res.status(400).json({error : "Email cannot be blank"});
    }
    if(!password){
        return res.status(400).json({error : "Password cannot be blank"});
    }
    if(password != confirmpassword){
        return res.status(400).json({error : "Passwords do not match"});
    }
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
        let link = `http://localhost:3000/verify?activationnumber=${activationNumber}&email=${email}`;
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
    let activationNumber = req.query.activationnumber;
    if(!email){
        return res.status(400).json({error : "Email cannot be blank"});
    }
    if(!activationNumber){
        return res.status(400).json({error : "Activation number cannot be blank"});
    }

    User.findOneAndUpdate({ email : email, activation : activationNumber },{ $set : { isverified : true } }).then(
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
                        return res.status(401).json({ error : "Email registered with Google.Try using 'Login with Google' "});
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
                        return res.status(401).json({ error : "Email registered with Facebook.Try using 'Login with Facebook' "});
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
    let id = req.body.id;
    let name = req.body.name;
    let email = req.body.email;
    let image = req.body.image;
    let provider = req.body.provider;
    let token = req.body.token;
    console.log(token,'----');
    if(!name){
        return res.status(422).json({ error : 'Name cannot be blank.' });
    }
    if(!email){
        return res.status(422).json({ error : 'Email cannot be blank.' });
    }
    if(!provider){
        return res.status(422).json({ error : 'Provider cannot be blank.' });
    }
    if(!token){
        return res.status(422).json({ error : 'Token cannot be blank.' });
    }
    else{
        if(provider == 'google'){
            let verifyGoogleUser = 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token='+token;
            request(verifyGoogleUser,function(error,response,body){
                if(response && response.statusCode === 200 ){
                    let info = JSON.parse(body);
                    User.findOne({ socialId : id, email : email }).then(
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
                    });
                }
                else{
                    return res.status(401).json({message : 'You are not a authorized google user'});
                }
                // console.log('body: ', body);
                // console.log('error:', error);
                // console.log('statusCode:', response && response.statusCode);
            });
        }
        if(provider == 'facebook'){
            let verifyFacebookUser = 'https://graph.facebook.com/me?access_token='+token;
            request(verifyFacebookUser,function(error,response,body){
                let info = JSON.parse(body);
                console.log(info,'-----');
                if(info.id == id){
                    User.findOne({ socialId : id, email : email }).then(
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
                    });
                }
                else{
                    return res.status(401).json({message : 'You are not a authorized facebook user'});
                }
            });
        }
    }

    async function createNewUser() {

        const newUser = new User({
            socialId : id,
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
