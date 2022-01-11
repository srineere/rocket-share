const { protected } = require('../middleware/protected');
const { Router } = require('express');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const router = Router();
const User = require('../models/User');
const nodemailer = require("nodemailer");

// router.get('/authenticate', (req, res) => {
//     res.render('welcome');
// });  


// home page
router.get('/home', (req,res) => {
    // const user = await User.findOne(req?.user?._id);
    // try {
    //     if (!user) {
    //         throw Error('Authenticaton Error');
    //     }
        
    //     let userInfo = {
    //         files_created: user.files_created,
    //     }
    //     // console.log('Home',user.email)  
    //     console.log(iser)
    //     return res.render('index', {
    //         user
    //     });
    // } catch (err) {
    //     return res.status(500).render(err.message);
    // }
    let isUser = 0
        if (req.isAuthenticated()) {
            isUser = 1;
        }
    res.render('index',{ isUser });
})

// Dashboard
router.get('/dashboard', protected, async (req, res) => {
    const user = await User.findOne(req?.user?._id);
    try {
        if (!user) {
            throw Error('Authenticaton Error');
        }
        
        let userInfo = {
            files_created: user.files_created,
        }
        const isUser = 1;
        return res.render('dashboard', {
            user: userInfo,
            isUser
        });
    } catch (err) {
        return res.status(500).render(err.message);
    }
});

// share page
router.get('/share', async (req, res, next) => {
    let isUser = 0
        if (req.isAuthenticated()) {
            isUser = 1;
        }
    res.render('share',{isUser})
});


// render show
router.get('/file/:uuid', async (req, res) => {
            const {uuid: id} = req.params;
            const file = await File.findOne({id});
            if (file) {
                const fileInfo = {
                    originalname: file.originalname,
                    size: file.size,
                    url: `${process.env.APP_ROOT_URL}/file/download/${file.id}`
                }
                return res.render('download', {fileInfo});
            } else {
                return res.send('File not found with that UUID');
            }
        })
     .delete('/file/:uuid', async (req, res) => {
        const {uuid: id} = req.params;
        const file = await File.findOne({id});
        const user = await User.findOne(req?.user?._id);
        
        if (!user) {
            return res.status(403).json({
                ok: false,
                msg: 'Not enough authorisation to delete this file'
            });
        }
        
        if (!file) {
            return res.status(404).render({
                ok: false,
                msg: 'No such file exists'
            });
        }
        
        user.files_created.forEach(async (file, index) => {
            if (file.id === id) {
                await user.files_created.splice(index, 1);
                await user.save();
            }
        });
        console.log('file removed from user');
        
        const bucketPath = path.join(__dirname, '..', 'bucket');
        fs.unlinkSync(path.join(bucketPath, file.id));
        console.log('file removed from bucket');
        
        let deletedFile = await File.deleteOne({id});
        if (deletedFile)
            console.log('file removed from database');
        return res.json({ msg: 'File Deleted Succesfully' });
     });

// trigger download
router.get('/file/download/:uuid', async (req, res) => {
    /**
     * Triggers the file download
     * The download is generally trigerred when the download button is clicked on the show/download page
     * Imp: If there is any error trigerring the download then re render the download page itself passing the error into the tempate
     */
    const {uuid: id} = req.params;
    console.log(`Download triggered ${id}`);
    const file = await File.findOne({id});
    console.log(file);
    if (!file) {
        return res.render('download', {
            error: 'Link expired or the file does not exist on this end point'
        });
    }

    const bucketPath = path.join(__dirname, '..', 'bucket');
    const filePath = path.join(bucketPath, file.id);
    fs.stat(filePath, (err, stat) => {
        if (err !== null) {
            if (err.code === 'ENOENT') {
                return res.render('download', {
                    error: 'The requested file was not found in the drive'
                });
            }

            return res.render('download', {
                error: 'something went wrong, try again some time later or contact the support team'
            });
        }
        res.download(filePath, file.originalname);
    });
});

// send mail 
router.post('/share', (req,res) => {
    console.log(req.body)
    const email = req.body.reciever;
    const url = req.body.url;
  
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
        user: 'rshare.do.not.reply@gmail.com',
        pass: 'R-Share007'
        }
    });
    
    var mailOptions = {
        from: 'rshare.do.not.reply@gmail.com',
        to: email,
        subject: 'Sending a file through Rocket Share',
        text: 'Check out this file : ' + url,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        console.log(error);
        } else {
        console.log('Email sent: ' + info.response);
        }
    });
  
    let isUser = 0
    if (req.isAuthenticated()) {
        isUser = 1;
    }
    
    if(isUser)
        res.redirect('/dashboard')
    else
        res.redirect('/share')
})

// logout
router.get('/logout', (req, res) => {
        console.log('logout');
        req.logout();
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
});

// forum
router.get('/forum', (req,res) => {
    let isUser = 0
    if (req.isAuthenticated()) {
        isUser = 1;
    }
    res.render('forum',{isUser});
})

router.use('/users', require('../middleware/dashredirect'), require('./users'));
router.use('/api', require('./api'));

module.exports = router;