const jwt = require('jsonwebtoken');

function auth(req,res,next){
    const token = req.header('x-auth-token');
    //console.log(token + '  in auth.js (backend)');
    if(!token){
        return res.status(401).send('Access denied.No token found.');
    }
    else{
        try{
            const decoded = jwt.verify(token,'jwtPrimaryKey');
            req.user = decoded;
            next();
        }
        catch(ex){
            res.status(400).json({ error : 'Invalid token' });
        }
    }
}
module.exports = auth;
