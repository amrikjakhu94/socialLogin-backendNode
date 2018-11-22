const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const indexRoute = require('./routes')
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');

// mongoose.connect('mongodb://sociallogin-amrik:asd9876543210@ds063859.mlab.com:63859/sociallogin-backend')
mongoose.connect('mongodb://localhost:27017/socialLogin') //For using it in local system...
    .then(()=>{
        console.log('Connected to mongoDB')
    }).catch(err => console.error('Could not connect',err));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true,limit: '50mb',}));

app.use(indexRoute);

//const port = 3000; //For using it in local system...
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`App started at port ${port}`);
});
