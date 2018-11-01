const express = require('express');
const router = express.Router();
const userRouter = require('./users');

router.get('/',(req,res)=>{
    res.send('Welcome to social login...')
});

router.use(userRouter);

module.exports = router;
