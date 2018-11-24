let path = require('path');
let formidable = require("formidable");
let handlebars = require('handlebars');
// let mailer = require('../../mailer/mailer');
// let serverCtrl = require('../server/server.controller');
let fs = require('fs');
let randomstring = require("randomstring");
let imageUrl = './images_uploaded';



exports.uploadImage = async function (req, res) {

    var completeFlag = false;
    const form = new formidable.IncomingForm();
    
    form.uploadDir = imageUrl;
    form.keepExtensions = true;
    var pathSeparator = path.sep;

    let count = 0;
    form.on('error', (err) => {
        console.log('error', err);
    });
    form.parse(req, async function (err, fields, files) {
        console.log(files,"==========")
        let multipleUpload = new Promise(async (resolve, reject) => {
            let newImgUrls = [];
            if (Object.keys(files).length > 0) {
                for (var field in files) {
                    var fileType = files[field].type.substring(0, 5);
                    if (fileType == 'image') {
                        if (files[field].path) {
                            var filePATH = `${files[field].path}`.replace('public/','');
                            count++;
                            newImgUrls.push({
                                'name': filePATH
                            })
                            if (count == Object.keys(files).length) {
                                completeFlag = true;
                                resolve(newImgUrls);
                            }
                        }
                    } else {
                        res.json({
                            code: 500,
                            message: "Invalid image format."
                        })
                    }
                }
            }
        });
        let upload = await multipleUpload;
        if (upload && completeFlag) {
           
            res.json({
                code: 200,
                message: "Images upload successfully.",
                data: upload

            })
        } else {
            res.json({
                code: 500,
                message: "An occured while uploading images."
            })
        }
    })
}