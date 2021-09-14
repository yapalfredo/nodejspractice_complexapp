const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res) {
    //No need of 2nd argument, since app res.locals is already implemented in app.js
    //res.render('create-post', {username: req.session.user.username, avatar: req.session.user.avatar})

    res.render('create-post')
}

exports.createPost = function(req, res){
    let post = new Post(req.body);
    console.log(post)
    post.createPost().then(function(){
        res.send("Clicked create button")
    }).catch(function(err){
        res.send(err)
    })
}