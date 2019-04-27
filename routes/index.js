var express = require('express');
var router = express.Router();
var multer = require('multer');
var QRCode = require('qrcode');
var helper = require('./../helpers/helper');
var keyConfig = require('./../config');
var QrCode = require('qrcode-reader');
var Jimp = require("jimp");
const fs = require('fs');
var path = require("path");
var rimraf = require("rimraf");
var spawn = require('child_process').spawn;
const { exec } = require('child_process');

var upload = multer({
	dest: 'uploads/'
});

router.get('/', function (req, res, next) {
	res.render('index', {
		JWTData: req.JWTData
	});
});

router.get('/votecandidate', function (req, res, next) {

	if (!req.cookies.votePayload) {
		return res.redirect('/vote');
	}

	var id = req.cookies.votePayload.id;
	var constituency = req.cookies.votePayload.constituency;
	var name = req.cookies.votePayload.name;
	var aadhaar = req.cookies.votePayload.aadhaar;

	res.clearCookie('votePayload');

	req.app.db.models.Candidate.find({
		constituency: constituency
	}, function (err, data) {
		if (err) {
			console.log(err);
			return next(err);
		}
		res.render('votecandidate', {
			JWTData: req.JWTData,
			data: data,
			id: id,
			constituency: constituency,
			name: name,
			aadhaar: aadhaar
		});
	});
});

router.get('/vote', function (req, res, next) {
	res.render('vote', {
		JWTData: req.JWTData
	});
});

router.get('/register', function (req, res, next) {
	console.log("/reg enter");
	res.render('register', {
		JWTData: req.JWTData
	});
});

router.get('/results', function (req, res, next) {
	res.render('results', {
		JWTData: req.JWTData
	});
});

router.get('/test', function (req, res, next) {
	helper.test(5, function (data) {
		res.send(data.toString());
	});
});

router.post('/register', upload.single('avatar'), function (req, res, next) {
	console.log("entered /register");
	var dirimgs = __dirname + '/../images';
	var dir = __dirname + '/../images/people';
	if (!fs.existsSync(dirimgs)) {
		fs.mkdirSync(dirimgs);
		fs.mkdirSync(dir);
	}else if(!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}

	/* var login_dir = dir + '/' + req.body.login_id;
	console.log(login_dir);
	fs.mkdirSync(login_dir); */
	console.log(req.body);
	var data = req.body.avatar.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	var imgPath = dir + '/' + req.body.name + '.png';
	fs.writeFile(imgPath, buf, (err) => {
		// throws an error, you could also catch it here
		//console.log("problem entered");
		if (err) {
			throw err;
		}



		var voterDetails = {
			name: req.body.name,
			aadhaar: req.body.aadhaar,
			image: imgPath,
			hasVoted: false,
			isValid: false,
			constituency: req.body.constituency
		}


		console.log(voterDetails);

		req.app.db.models.Voter.create(voterDetails, function (err, data) {
			if (err) {
				console.log(err);

				fs.unlink(imgPath, function (err) {
					if (err) {
						console.log("problem to delete the image delete it by yourself");
						console.log(err);
					}
				});
				return next(err);
			}

			return res.redirect('/vote');

			/* var voterID = JSON.stringify(data._id);
	
			QRCode.toDataURL(voterID, function (err, url) {
				console.log(url);
				var im = url.split(",")[1];
				var img = new Buffer(im, 'base64');
	
				res.writeHead(200, {
					'Content-Type': 'image/png',
					'Content-Length': img.length,
					'Content-Disposition': 'attachment; filename="Voter_QR.png"'
				});
				res.end(img);
			}) */
		});
	});
});

router.post('/verifyvoter', upload.any(), function (req, res, next) {
	console.log('Entered post /login');

	req.app.db.models.Voter.findOne({
		name: req.body.login_id,
		aadhaar: req.body.password
	}, function (err, data) {
		if (err) {
			console.log("err");
			console.log(err);
			return next(err);
		}
		console.log("data", data);


		if (data != null) {

			if (data.hasVoted == true || data.isValid == false) {
				// if (false) {
					return res.render('message', {
						message: 'Sorry! You are not allowed to vote.',
						JWTData: req.JWTData
					});
			}

			console.log("data entered");
			var dir = __dirname + '/../images';
			if (!fs.existsSync(dir)) {
				return res.render('message', {
					message: 'Sorry! no voter registered.',
					JWTData: req.JWTData
				});
			}

			var login_dir = dir + '/' + req.body.login_id;
			console.log(login_dir);

			rimraf(login_dir, function () {
				console.log("done");
				var k = 0;

				fs.mkdirSync(login_dir);
				for (let i = 0; i < keyConfig.nbFrames; i++) {

					var data1 = req.body['img' + i].replace(/^data:image\/\w+;base64,/, "");
					var buf = new Buffer(data1, 'base64');

					fs.writeFile(login_dir + '/' + i + '.png', buf, (err) => {
						// throws an error, you could also catch it here

						if (err) {
							throw err;

						}
						console.log('cration of ' + login_dir + '/' + i + '.png')
						k++;
						if (k == 40) {
							console.log(login_dir + "full");
							var py = spawn('python3', ['Intelegent_Lock/ppp_main.py', data.image, login_dir]);//, {stdio: "inherit"})//'../Intelegent_Lock/ppp_main.py' ,data.image , login_dir])

							py.stdout.on('data', function (data1) {
								console.log("aaa")
								console.log('data ' + data1.toString());
								console.log("dataend");
								if (data1 == 'identical faces' || data1 == 'identical faces/n') {
									console.log("endi");

									var voteUrl = '/votecandidate';

									var votePayload = {
										id: data.id,
										constituency: data.constituency,
										name: data.name,
										aadhaar: data.aadhaar
									}

									res.cookie('votePayload', votePayload);

									return res.redirect(voteUrl);
								} else if(data1 == "not identical"){
									console.log("not identical");
									return res.render('message', {
										message: 'Face verification failed. Try again',
										JWTData: req.JWTData
									});
								}
							});
						}
					});
				}
				console.log(data.image);

			});
			console.log(Date.now());
		}else{
			console.log("bad password");
			return res.render('message', {
				message: 'Bad credentials',
				JWTData: req.JWTData
			});
		}
	});


	/* if (data.password == req.body.password) {
		var payload = {
			userType: 'admin',
			firstName: 'Admin'
		};

		var token = req.app.jwt.sign(payload, req.app.jwtSecret);
		// add token to cookie
		res.cookie('token', token);
		res.redirect('/admin');
	} else {
		res.redirect('/admin/login');
	} */



	// strip off the data: url prefix to get just the base64-encoded bytes



	/*var qr = new QrCode();
	var face1, face2;
	var id;

	var buffer = new Buffer(qr_uri.split(",")[1], 'base64');

	console.log("entered");

	Jimp.read(buffer, function (err, image) {
		if (err) {
			console.error(err);
			// TODO handle error
		}

		qr.callback = function (err, value) {
			if (err) {
				console.error(err);
				// TODO handle error
			}

			id = value.result.substr(1).slice(0, -1);

			req.app.db.models.Voter.findById(id, function (err, data) {
				if (err) {
					console.log(err);
				}
				if (data.hasVoted == true || data.isValid == false) {
				// if (false) {
					return res.render('message', {
						message: 'Sorry! You are not allowed to vote.',
						JWTData: req.JWTData
					});
				} else {
					console.log('Entered here');
					console.log(data.image);

					helper.sendImageToMicrosoftDetectEndPoint(data.image, function (responseA) {
						console.log(responseA);
						responseA = JSON.parse(responseA);
						if (responseA.length == 0) {
							return res.render('message', {
								message: 'Face verification failed. Try again',
								JWTData: req.JWTData
							});
						}

						console.log(responseA[0].faceId);

						face1 = responseA[0].faceId;

						helper.sendImageToMicrosoftDetectEndPoint(avatar_uri, function (responseB) {
							console.log(responseB);
							responseB = JSON.parse(responseB);
							if (responseB.length == 0) {
								return res.render('message', {
									message: 'Face verification failed. Try again',
									JWTData: req.JWTData
								});
							}
							face2 = responseB[0].faceId;

							var payload = JSON.stringify({
								faceId1: face1,
								faceId2: face2
							});

							helper.sendImageToMicrosoftVerifyEndPoint(payload, function (response) {
								console.log(response);
								response = JSON.parse(response);
								if (response.isIdentical == true) {
									var voteUrl = '/votecandidate';

									var votePayload = {
										id: id,
										constituency: data.constituency,
										name: data.name,
										aadhaar: data.aadhaar
									}

									res.cookie('votePayload', votePayload);

									return res.redirect(voteUrl);
								} else {
									return res.render('message', {
										message: 'Face verification failed. Try again',
										JWTData: req.JWTData
									});
								}
							});
						});
					});
				}
			});
		};
		qr.decode(image.bitmap);
	});*/
});

router.get('/voteadded/:id', function (req, res, next) {
	req.app.db.models.Voter.findById(req.params.id, function (err, data) {
		if (err) {
			console.log(err);
			return next(err);
		}
		data.hasVoted = true;

		data.save();

		return res.redirect('/');
	});
});

module.exports = router;