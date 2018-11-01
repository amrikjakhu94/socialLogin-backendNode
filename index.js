const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const indexRoute = require('./routes')

mongoose.connect('mongodb://localhost:27017/socialLogin')
    .then(()=>{
        console.log('Connected to mongoDB')
    }).catch(err => console.error('Could not connect',err));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(indexRoute);

const port = 3000;
app.listen(port, ()=>{
    console.log(`App started at port ${port}`);
});
