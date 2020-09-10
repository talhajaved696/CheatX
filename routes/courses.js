const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const {
    v4: uuidv4
} = require('uuid');


const {
    ensureAuth
} = require('../middleware/auth');
const Story = require('../models/Story');
const Course = require('../models/Course');
const File = require('../models/File');
const { response } = require('express');

// @desc Login/Landing Page
// @route GET /

router.get('/:id/add', ensureAuth, async (req, res) => {
    const course = await Course.findById(req.params.id).lean();
    res.render('stories/add', {
        course,
    });
});


let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    },
});

let upload = multer({
    storage,
    limits: {
        fileSize: 1000000 * 100
    },
}).single('myfile'); //100mb
// Post req to create new story
router.post('/:id/stories', ensureAuth, async (req, res) => {
    try {

        req.body.user = req.user.id;
        req.body.course = req.params.id;
        await Story.create(req.body);
        res.redirect(`/course/${req.params.id}/dashboard`);

    } catch (err) {
        console.log(err);
        res.render('error/500');
    }

});

router.post('/stories/files/:id', async (req, res) => {

    let story = await Story.findById(req.params.id)
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send({
                error: err.message
            });
        }
        const file = new File({
            filename: req.file.filename,
            uuid: uuidv4(),
            path: req.file.path,
            size: req.file.size,
            story: req.params.id
        });
        const response = await file.save();
        let download = `${process.env.APP_BASE_URL}/course/stories/${req.params.id}/files/${response.uuid}`
        await Story.findByIdAndUpdate(req.params.id, { fileLink: download })
        res.redirect(`/course/${story.course}/dashboard`)
    })



})

router.get('/stories/:id/files/:uuid', async (req, res) => {
    // Extract link and get file from storage send download stream
    const file = await File.findOne({
        uuid: req.params.uuid
    });
    // Link expired
    if (!file) {
        return res.render('error/404', {
            error: 'No file Uploadeds.'
        });
    }
    const response = await file.save();
    const filePath = `${__dirname}/../${file.path}`;
    res.download(filePath);
});

router.get('/stories/files/:id', async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).populate('user').lean();

        if (!story) {
            return res.render('error/404');
        }

        res.render('stories/addfile', {
            story,
        });
    }
    catch (err) {
        console.error(err);
        res.render('error/404');
    }

})


// @desc    Show all stories
// @route   GET /stories
router.get('/:id/stories', ensureAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).lean()
        const stories = await Story.find({
            status: 'public',
            course: req.params.id,
        })
            .populate('user')
            .sort({
                createdAt: 'desc',
            })
            .lean();
        const courseId = req.params.id;
        res.render('stories/index', {
            stories,
            course,
            courseId
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});
router.get('/stories/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).populate('user').lean();

        if (!story) {
            return res.render('error/404');
        }

        res.render('stories/show', {
            story,
        });
    } catch (err) {
        console.error(err);
        res.render('error/404');
    }
});

// @desc    Show edit page
// @route   GET /stories/edit/:id
router.get('/stories/edit/:id', ensureAuth, async (req, res) => {
    try {
        const story = await Story.findOne({
            _id: req.params.id,
        }).lean();

        if (!story) {
            return res.render('error/404');
        }

        if (story.user != req.user.id) {
            res.redirect('/stories');
        } else {
            res.render('stories/edit', {
                story,
            });
        }
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});

// @desc    Update story
// @route   PUT /stories/:id
router.put('/stories/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).lean();

        if (!story) {
            return res.render('error/404');
        }

        if (story.user != req.user.id) {
            res.redirect(`/course/${req.params.id}/stories`);
        } else {
            story = await Story.findOneAndUpdate({
                _id: req.params.id,
            },
                req.body, {
                new: true,
                runValidators: true,
            }
            );

            res.redirect(`/course/${story.course}/dashboard`);
        }
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});

// @desc    Delete story
// @route   DELETE /stories/:id
router.delete('/stories/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).lean();

        if (!story) {
            return res.render('error/404');
        }

        if (story.user != req.user.id) {
            res.redirect(`/course/${req.params.id}/stories`);
        } else {
            await Story.remove({
                _id: req.params.id,
            });
            res.redirect(`/course/${story.course}/dashboard`);
        }
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});

// @desc    User stories
// @route   GET /stories/user/:userId
router.get('/:id/user/:userId', ensureAuth, async (req, res) => {
    try {
        const stories = await Story.find({
            user: req.params.userId,
            status: 'public',
            course: req.params.id
        })
            .populate('user')
            .lean();
        const courseId = req.params.id;

        res.render('stories/index', {
            stories,
            courseId
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

module.exports = router;