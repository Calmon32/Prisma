var fs = require('fs');
var sharp = require('sharp');
var passwordHash = require('password-hash');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = "mongodb://admin:j4D1K3YveJBDcLXe@cluster0-shard-00-00-wwswd.gcp.mongodb.net:27017,cluster0-shard-00-01-wwswd.gcp.mongodb.net:27017,cluster0-shard-00-02-wwswd.gcp.mongodb.net:27017/prisma?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
var assert = require('assert');
var mongo = false;
MongoClient.connect(url, { ssl: true }, function(err, db) {
	if (err) throw err;
	mongo = db;
});

exports.register = function(req,res) {
	var sess = req.session;
	mongo.collection('users').find({ username: req.body.username }).toArray(function(err, docs) {
		if(docs.length == 0) {
			var hashedpass = passwordHash.generate(req.body.password);
			var user = {
					username: req.body.username,
					profPic: 'profile',
					bio: 'This is my Bio!',
					name: req.body.name,
					password: hashedpass,
					email: req.body.email,
					gender: req.body.gender,
					privacy: 'public',
					followers: [],
					following: []
			};
			mongo.collection('users').insertOne( user , function(err, result) {
				mongo.collection('sessions').updateOne(
				    { "_id" : sess.id },
				    {
				      	'$set' : { username: req.body.username, id: user._id.valueOf(), name: req.body.name }
				    }, function(err, results) {
			   	});
			   	res.json({"redirect": "/feed"});
				console.log('Reistered user:' + req.body.username);
			});
		}
		else {
			res.json({"message": "Username Taken."});
		}
	});
};

exports.login = function(req,res) {
	var sess = req.session;
	mongo.collection('users').find({ username: req.body.username }).toArray(function(err, docs) {
		if(docs.length == 1) {
			var correctpass = passwordHash.verify(req.body.password,docs[0].password);
			if(correctpass) {
				mongo.collection('sessions').updateOne(
				    { "_id" : sess.id },
				    {
				      	'$set' : { username: req.body.username, id: docs[0]._id.valueOf(), name: docs[0].name }
				    }, function(err, results) {
				    	res.json({"redirect": '/feed'});
			   	});
	 		}
	 		else {
	 			res.json({"message": 'Username or password wrong.'});
	 		}
		}
		else {
			res.json({"message": 'Username or password wrong.'});
		}
	});
};

exports.feedPage = function(req,res,user) {
	mongo.collection('photos').find().toArray(function(err, docs) {
		if(docs.length > 0) {
			var postsArray = [];
			for (var i = 0; i < docs.length; i++) {
				var liked = "nliked";
				for (var h = 0; h < docs[i].likers.length; h++) {
					if (docs[i].likers[h].id.equals(user.id)){
						liked = "liked";
						break;
					}
				}
				postsArray.push({
							id:docs[i]._id,
							user: docs[i].user,
							tag:docs[i].tag,
							username: docs[i].username,
							liked:liked,
						    likes:docs[i].likers.length, 
						    comments:docs[i].comments.length
						  });
			}
			res.render('feed', { sessname: user.name, username: user.username, userid: user.id, posts: postsArray.reverse() } );
		}
		else {
			res.render('feed', { sessname: user.name, username: user.username, userid: user.id, posts: [] } );
		}
	});
};

exports.profilePage = function(req,res,user) {
	mongo.collection('users').find({ "_id" : new mongodb.ObjectID(user.id) }).toArray(function(err2, docs2) {
		if(docs2.length == 1) {
			mongo.collection('photos').find({'user':user.id}).toArray(function(err, docs) {
				var postsArray = [];
				for (var i = 0; i < docs.length; i++) {
					var liked = "nliked";
					for (var h = 0; h < docs[i].likers.length; h++) {
						if (docs[i].likers[h].id.equals(user.id)){
							liked = "liked";
							break;
						}
					}
					postsArray.push({
							id:docs[i]._id,
							tag:docs[i].tag,
							liked:liked,
						    likes:docs[i].likers.length, 
						    comments:docs[i].comments.length							       
						  });
				}
				res.render('profile', { sessname: user.name, userid: user.id, username: user.username, bio: docs2[0].bio, followingCount: docs2[0].following.length, followersCount: docs2[0].followers.length, postsCount: postsArray.length, posts:postsArray.reverse() } );
			});	
		}
	});
};

exports.userPage = function(req,res,user) {
  	console.log("Someone accessed a User page.");

  	mongo.collection('users').find({ "username": req.params.username }).toArray(function(err2, docs2) {
		if(docs2.length == 1) {
			mongo.collection('photos').find({'user':docs2[0]._id}).toArray(function(err, docs) {
				var postsArray = [];
				for (var i = 0; i < docs.length; i++) {
					var liked = "nliked";
					for (var h = 0; h < docs[i].likers.length; h++) {
						if (docs[i].likers[h].id.equals(user.id)) {
							liked = "liked";
							break;
						}
					}
					postsArray.push({
							id:docs[i]._id,
							liked:liked,
							tag:docs[i].tag,
						    likes:docs[i].likers.length, 
						    comments:docs[i].comments.length							       
						  });
				}
				if (containsObject(user.id, docs2[0].followers)) {
			 		isFollowing = "followed";
			 	}
			 	else {
			 		isFollowing = "nfollowed";
			 	}
			 	res.render('user', { sessname: user.name, username: user.username, userid: user.id, profileUserID: docs2[0]._id, username: docs2[0].username, bio: docs2[0].bio, isFollowing: isFollowing, followingCount: docs2[0].following.length, followersCount: docs2[0].followers.length, postsCount: postsArray.length, name: docs2[0].name, posts:postsArray.reverse() } );
			});	
		}
		else {
			res.redirect('/feed');
		}
	});
};

exports.getUser = function(req, res, next) {
	if (req.url != '/login' & req.url != '/forms' & req.url != '/') {
		var sess = req.session;
		mongo.collection('sessions').find({"_id":sess.id}).toArray(function(err, docs) {
			if (docs.length > 0) {
				if (typeof(docs[0].id) !== 'undefined') {
					req.user = docs[0];
					next();
				}
			    else {
			    	res.redirect('/login');
			    }
			}
			else {
				res.redirect('/login');
			}
		});	
	}
	else {
		if (req.url == '/login') {
			var sess = req.session;
			mongo.collection('sessions').find({"_id":sess.id}).toArray(function(err, docs) {
				if (docs.length > 0) {
					if (typeof(docs[0].id) !== 'undefined') {
						res.redirect('/feed');
					}
				    else {
				    	next();
				    }
				}
				else {
					next();
				}
			});
		}
		else {
			next();
		}
	}
};

exports.logout = function(req,res) {
	var sess = req.session;
	sess.destroy();
	res.redirect('/login');
};

exports.uploadIMG = function(req,res,user) {
	var imgTypes = ['image/jpeg','image/png'];
	var img = req.file;
	if (imgTypes.indexOf(img.mimetype) != -1) {
		var photo = {
			user: user.id,
			username: user.username,
			caption: req.body.caption,
			tag: req.body.tag,
			likers: [],
			comments: []
		};
		mongo.collection('photos').insertOne( photo , function(err, result) {
			assert.equal(null, err);
			var imgdata = fs.readFileSync(img.path);
			sharp(imgdata)
			  .resize(1080, 1080)
			  .toBuffer(function(err, outputBuffer) {
			    fs.writeFile('./html/files/imageDB/' + photo._id + '.jpg', outputBuffer, 'binary', function(err){
			        if (err) throw err;
			    	res.redirect('/profile');
			    	fs.unlink(img.path);
			    })
		  	});
		});
	}
	else {
		res.send('Something went wrong!');
		fs.unlink(img.path);
	}
};

exports.changeProfileIMG = function(req,res,user) {
	var imgTypes = ['image/jpeg','image/png'];
	var img = req.file;
	if (imgTypes.indexOf(img.mimetype) != -1) {
		var imgdata = fs.readFileSync(img.path);
		const triangle = new Buffer('<svg height="1080" width="1080"><polygon points="540,145 0,1080 1080,1080" style="fill:black;stroke:black;stroke-width:1" /></svg>');
		sharp(imgdata)
		  .resize(1080, 1080)
		  .overlayWith(triangle, { cutout: true })
		  .png()
		  .toBuffer(function(err, outputBuffer) {
		    fs.writeFile('./html/files/userProfiles/user' + user.id + '.png', outputBuffer, 'binary', function(err){
		        if (err) throw err;
		    	res.redirect('/profile');
		    	fs.unlink(img.path);
		    })
	  	});
	}
	else {
		res.send('Something went wrong!');
		fs.unlink(img.path);
	}
};

exports.followUser = function(req,res,user,userid) {
	mongo.collection('users').find({ "_id" : new mongodb.ObjectID(userid) }).toArray(function(err, docs) {
	    if(containsObject(user.id,docs[0].followers)) {
	    	res.send({status:200, followed: true});
	    }
	    else {
	    	mongo.collection('users').updateOne(
			    { "_id" : new mongodb.ObjectID(userid) },
			    {
			      	"$push": {
			          "followers": { "id": user.id }
			    	}
			    }, function(err, results) {
			    mongo.collection('users').updateOne(
				    { "_id" : new mongodb.ObjectID(user.id) },
				    {
				      	"$push": {
				          "following": { "id": userid }
				    	}
				    }, function(err, results) {
				    res.send({status:200, followed: true});
			   	});
		   	});
	    }
	});
};

exports.unfollowUser = function(req,res,user,userid) {
	mongo.collection('users').find({ "_id" : new mongodb.ObjectID(userid) }).toArray(function(err, docs) {
	    if(containsObject(user.id,docs[0].followers)) {
	    	mongo.collection('users').updateOne(
			    { "_id" : new mongodb.ObjectID(userid) },
			    {
			      	"$pull": {
			          "followers": { "id": user.id }
			    	}
			    }, function(err, results) {
			    mongo.collection('users').updateOne(
				    { "_id" : new mongodb.ObjectID(user.id) },
				    {
				      	"$pull": {
				          "following": { "id": userid }
				    	}
				    }, function(err, results) {
				    res.send({status:200, followed: false});
			   	});
		   	});
	    }
	    else {
	    	res.send({status:200, followed: false});
	    }
	});
};

exports.likePost = function(req,res,user,photoid) {
	mongo.collection('photos').find({ "_id" : new mongodb.ObjectID(photoid) }).toArray(function(err, docs) {
	    if(containsObject(user.id,docs[0].likers)) {
	    	res.send({status:200, liked:true});
	    }
	    else {
	    	mongo.collection('photos').updateOne(
			    { "_id" : new mongodb.ObjectID(photoid) },
			    {
			      	"$push": {
			          "likers": { "id": user.id }
			    	}
			    }, function(err, results) {
			    res.send({status:200, liked:true});
		   	});
	    }
	});
};

exports.unlikePost = function(req,res,user,photoid) {
	mongo.collection('photos').find({ "_id" : new mongodb.ObjectID(photoid) }).toArray(function(err, docs) {
	    console.log(docs[0].likers);
	    if(containsObject(user.id,docs[0].likers)) {
	    	console.log('unliked');
	    	mongo.collection('photos').updateOne(
			    { "_id" : new mongodb.ObjectID(photoid) },
			    {
			      	"$pull": {
			          "likers": { "id": user.id }
			    	}
			    }, function(err, results) {
			    res.send({status:200, liked:false});
		   	});
	    }
	    else {
	    	res.send({status:200, liked:false});
	    }
	});
};

exports.comment = function(req,res,user,photoid) {
	mongo.collection('photos').find({ "_id" : new mongodb.ObjectID(photoid) }).toArray(function(err, docs) {
	    mongo.collection('photos').updateOne(
		    { "_id" : new mongodb.ObjectID(photoid) },
		    {
		      	"$push": {
		          "comments": { "id": user.id, "username": user.username, "comment":req.body.comment }
		    	}
		    }, function(err, results) {
		    res.send({status:200, liked:true});
		});
	});
};

exports.postdata = function(req,res,user,postid) {
	mongo.collection('photos').find({'_id': new mongodb.ObjectID(postid) }).toArray(function(err, docs) {
		var liked = "nliked";
		for (var h = 0; h < docs[0].likers.length; h++) {
			if (docs[0].likers[h].id.equals(user.id)) {
				liked = "liked";
				break;
			}
		}
		console.log(docs[0].username);
		res.json({ 'id': docs[0]._id, 'user': docs[0].user, 'username':docs[0].username, 'name': docs[0].name, 'caption':docs[0].caption, 'tag':docs[0].tag, 'liked': liked, 'likers': docs[0].likers, 'comments': docs[0].comments });
	});	
};

exports.changeSettings = function(req,res,user) {
	var sess = req.session;
	mongo.collection('users').find({ _id: user.id }).toArray(function(err, docs) {
		var settings = {};
		if (req.body.name != "") {
			settings.name = req.body.name;
			mongo.collection('sessions').updateOne(
				{ "_id" : sess.id },
				{
				  	'$set' : { name: req.body.name }
				}, function(err, results) {
			});
		}
		if (req.body.bio != "") {
			settings.bio = req.body.bio;
		}
		if (req.body.email != "") {
			settings.email = req.body.email;
		}
		if (req.body.gender != undefined) {
			settings.gender = req.body.gender;
		}
		if (req.body.privacy != undefined) {
			settings.privacy = req.body.privacy;
		}
		if (req.body.oldpass != "" & req.body.newpass != "" & req.body.newpass2 != "") {
			var correctpass = passwordHash.verify(req.body.oldpass,docs[0].password);
			if(correctpass) {
				if(req.body.newpass == req.body.newpass2){
					settings.password = passwordHash.generate(req.body.newpass);
				}
			}
			else {
				res.send('Password wrong.');
			}
		}
		mongo.collection('users').updateOne({ "_id" : user.id }, { $set: settings }, function(err, results) {
		    res.redirect('/profile');
		});
	});
};

exports.messagePage = function(req,res,user) {
    console.log("Someone accessed a message page.");
    var messageArray = [];
    mongo.collection('messages').find({ $or : [ { id1 : user.id }, { id2 : user.id } ] }).toArray(function(err, docs){
        if(docs.length > 0){
            for (var i = 0; i < docs.length; i++) {
                var id = "";
                var name = "";
                if (docs[i].id1.equals(user.id)){
                    id = docs[i].id2;
                    name = docs[i].userName2;
                }
                else{
                    id = docs[i].id1;
                    name = docs[i].userName1;
                }
                messageArray.push({
                    id: id,
                    name: name
                });
            }
            res.render('messages', { sessname: req.user.name , userid: req.user.id, messageArray: messageArray } );
        }
        else {
            res.render('messages', { sessname: req.user.name , userid: req.user.id, messageArray: messageArray } );
        }
    });
};

exports.getMsg = function(req,res,user) {
	var key = user.id + "|" + req.params.user;
	var key2 = req.params.user + "|" + user.id;
	mongo.collection('messages').find({ $or : [ { key : key }, { key : key2 } ] }).toArray(function(err, docs) {
		if (docs.length > 0) {
			assert.equal(null, err);
			res.json({"messages": docs[0].messages});
		}
		else {
			res.json({"messages": []});
		}
	});
};

exports.getFriends = function(req,res,user) {
	mongo.collection('users').find({ "_id" : new mongodb.ObjectID(user.id) }).toArray(function(err, docs) {
		var friends = [];
		for (var i = 0; i < docs[0].following.length; i++) {
			friends.push(docs[0].following[i].id.toString());
		}
		res.json({"friends": friends});
	});
};

exports.insertMsg = function(req,res,user) {
	var item = {
		message: req.body.message,
		senderId: user.id
	};
	var key = user.id + "|" + req.body.receiverid;
	var key2 = req.body.receiverid + "|" + user.id;
	mongo.collection('messages').find({ $or : [ { key : key }, { key : key2 } ] }).toArray(function(err, docs) {
	  	assert.equal(err, null);
	  	if(docs.length > 0){
	  		mongo.collection('messages').updateOne({key:docs[0].key}, { "$push": { "messages": item }}, function(err2, results) {
			    res.send({status:"OK"});
			});
	  	}

	  	else {
	  		mongo.collection('users').find( { "_id" : new mongodb.ObjectID(req.body.receiverid) } ).toArray(function(err2, docs2) {
	  			var room = {key: key, messages: [item], userName1: user.username, id1: user.id, userName2: docs2[0].username, id2: new mongodb.ObjectID(req.body.receiverid) };
		  		mongo.collection("messages").insertOne(room, function(err3, result3) {
					assert.equal(err3, null);
					res.send("OK2");
				});
			});
	  	}
	});
};
exports.search = function(req,res,user) {
	mongo.collection('users').find({"username" : {$regex : req.body.search , $options : 'i' }}).toArray(function(err, docs) {
		mongo.collection('users').find({"name" : {$regex : req.body.search , $options : 'i' }}).toArray(function(err2, docs2) {
		    var users = [];
		    for (var i = 0; i < docs.length; i++) {
		    	var u = {
		    		id: docs[i]._id,
		    		username: docs[i].username,
		    		name: docs[i].name
		    	};
		    	users.push(u);
		    }
		    for (var i = 0; i < docs2.length; i++) {
		    	var u = {
		    		id: docs2[i]._id,
		    		username: docs2[i].username,
		    		name: docs2[i].name
		    	};
		    	if (users.length > 0) {
			    	for (var h = 0; h < users.length; h++) {
			    		if (users[h].username == u.username) {
			    			break;
			    		}
			    		else {
			    			if (h == users.length - 1) {
			    				users.push(u);
			    			}
			    		}
			    	}
			    }
			    else {
			    	users.push(u);
			    }
		    }
		    res.json({"users": users});
		});
	});
};

exports.getTag = function(req,res,user) {
	mongo.collection('photos').find({'tag': req.body.tag }).toArray(function(err, docs) {
		var posts = [];
		for (var i = 0; i < docs.length; i++) {
			var liked = "nliked";
			for (var h = 0; h < docs[i].likers.length; h++) {
				if (docs[i].likers[h].id.equals(user.id)) {
					liked = "liked";
					break;
				}
			}
			var p = {
				id: docs[i]._id,
				user: docs[i].user,
				name: docs[i].name,
				username: docs[i].username,
				liked: liked,
				likers: docs[i].likers.length,
				comments: docs[i].comments.length
			};
			posts.push(p);
		}
		res.json({ 'id': docs[0]._id, 'user': docs[0].user, 'username':docs[0].username, 'name': docs[0].name, 'caption':docs[0].caption, 'tag':docs[0].tag, 'liked': liked, 'likers': docs[0].likers, 'comments': docs[0].comments });
	});	
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
    	console.log(list[i].id,"  ", obj);
        if (list[i].id.equals(obj)) {
        	console.log('True');
            return true;
        }
    }
    console.log('False');
    return false;
}