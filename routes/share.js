const router = require('express').Router();

// router.get('/share',protected, async (req, res, next) => {
//     const user = await User.findOne(req?.user?._id);
//     try {
//         if (!user) {
//             throw Error('Authenticaton Error');
//         }
        
//         let userInfo = {
//             files_created: user.files_created,
//         }
        
//         return res.render('share', {
//             user: userInfo
//         });
//     } catch (err) {
//         return res.status(500).render(err.message);
//     }
//     // res.render('share');
// });

module.exports = router;