const express = require('express')
const router = express.Router()
const {
    ensureAuth,
    ensureGuest
} = require('../middleware/auth')
const Story = require('../models/Story')
const Course = require('../models/Course')

// @desc Login/Landing Page
// @route GET /

router.get('/', ensureGuest, (req, res) => {
    res.render('login', {
        layout: 'login'
    })
})

// @desc Login/Landing Page
// @route GET /

router.get('/courses', ensureAuth, async (req, res) => {
    try {
        const course = await Course.find({}).lean()
        res.render('courses', {
            name: req.user.firstName,
            course,
            layout: 'course'

        })
    } catch (err) {
        console.log(err)
        res.render('error/500')
    }
})

// @desc Dashboard
// @route GET /dashboard

router.get('/course/:id/dashboard', ensureAuth, async (req, res) => {

    try {
        const course = await Course.findById(req.params.id).lean()
        const stories = await Story.find({
            user: req.user.id,
            course: req.params.id
        }).lean()
        res.render('dashboard', {
            name: req.user.firstName,
            stories,
            course
        })
    } catch (err) {
        console.log(err)
        res.render('error/500')
    }


})
module.exports = router