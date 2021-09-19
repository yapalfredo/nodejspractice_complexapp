const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectId
const User = require('./User')

let Follow = function(followedUsername, authorId){
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = function(){
    if (typeof(this.followedUsername) != "string") {this.followedUsername = ""}
}

Follow.prototype.validate = async function(action){
    //Followed Username must exist in the database
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) {
        this.followedId = followedAccount._id
    } else {
        this.errors.push("You cannot follow a user which doesn't exist.")
    }

    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})

    if (action == "create"){
        if (doesFollowAlreadyExist) {
            this.errors.push("You are already following this user.")
        }
    }

    if (action == "delete"){
        if (!doesFollowAlreadyExist) {
            this.errors.push("You can't unfollow someone that you are not following.")
        }
    }

    //should not be able to follow own id
    if (this.followedId.equals(this.authorId)) {this.errors.push("You cannot follow yourself.")}
}

Follow.prototype.create = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")

        if (this.errors.length) {
            reject(this.errors)
        }else {
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
            resolve()
        }
    })
}

Follow.prototype.delete = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")

        if (this.errors.length) {
            reject(this.errors)
        }else {
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
            resolve()
        }
    })
}

Follow.isVisitorFollower = async function(followedId, visitorId){
     let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})
     if (followDoc) {
        return true
     } else {
        return false
     }
}

Follow.getFollowersById = function(id){
    return new Promise(async (resolve, reject) =>{
        try {
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()

            followers = followers.map(function(follower){
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })

            resolve(followers)
        } catch {
            reject()
        }
    })
}

Follow.getFollowingById = function(id){
    return new Promise(async (resolve, reject) =>{
        try {
            let following = await followsCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()

            following = following.map(function(_following){
                let user = new User(_following, true)
                return {username: _following.username, avatar: user.avatar}
            })

            resolve(following)
        } catch {
            reject()
        }
    })
}

Follow.countFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        let followersCount = await followsCollection.countDocuments({followedId: id})
        resolve(followersCount)
    })
}

Follow.countFollowingById = function(id) {
    return new Promise(async (resolve, reject) => {
        let followingCount = await followsCollection.countDocuments({authorId: id})
        resolve(followingCount)
    })
}

module.exports = Follow