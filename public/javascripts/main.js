$(document).ready(function () {

	var loc = window.location.href; // returns the full URL

	if (/register/.test(loc)) {
		$('#register').addClass('active');
	} else if (/vote/.test(loc)) {
		$('#vote').addClass('active');
	} else if (/results/.test(loc)) {
		$('#results').addClass('active');
	} else if (/admin/.test(loc)) {
		$('#admin').addClass('active');
	}

	var table_view_btn_flag = true;
	nbFrames = 50;

	$('#table_view_btn').click(function () {
		if (table_view_btn_flag == true) {
			$('#voter_table').hide();
			$('#candidate_table').show();
			table_view_btn_flag = false
		} else {
			$('#voter_table').show();
			$('#candidate_table').hide();
			table_view_btn_flag = true
		}

	});

    navigator.mediaDevices.getUserMedia({video: true})
        .then(mediaStream => {
			console.log("video.srcObject");
			document.querySelector('video').srcObject = mediaStream;
			document.querySelector('video').play();
			console.log(mediaStream.getVideoTracks());
            const track = mediaStream.getVideoTracks()[0];
            imageCapture = []
			for(let i = 0;i<nbFrames;i++) {
				imageCapture.push(new ImageCapture(track));
			}
        })
        .catch(error => console.log(error));

	$("#take_snapshots").click(function () {
		console.log("clicked capture");
        take_snapshots(-1);
		$('#camera, #take_snapshots').hide();
		$('#snapshots').show();
		
		setTimeout(function () {
			addImageToFormRegister();
			$('#register_btn').attr('disabled', false);
		}, 1000)
	});

	$('#register_btn').click(function () {
		$('#cam_col, #reg_col').hide();
		$('#register_row').append(`<div class="col-md-12">
									<div class="jumbotron jumbotron-fluid">
										<div class="container">
											<h1 class="display-4 text-center">Registration Completed</h1>
											<p class="lead text-center">
											Please Wait...
											Downloading your QR Code...
											<div>
												<div class="lds-css ng-scope"><div style="width:100%;height:100%" class="lds-ellipsis"><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div></div>
												</div>
											</div>
											</p>
										</div>
									</div>
								</div>`);
	});
});

var credentials;

var submit_form = function (event) {
	/* $('.lds-spinner').hide();
	var reader = new FileReader();
	reader.onload = function () {
		var output = document.getElementById('qr_img');
		output.src = reader.result;
		QR_Data = reader.result;
		$('#upload_qr').hide();
		$('#submit_qr').show();
		//alert("QR Code Uploaded");
	};
	reader.readAsDataURL(event.target.files[0]); */
	$('#sub_button').hide();
	credentials = { login_id:$('#login_id').val(),
					password:$('#password').val()
				}
	
	$('#cred_login').hide();
	console.log("credentials",credentials);
	submit_qr_func();		

};

var submit_qr_func = function (event) {
	$('#qr_img').hide();
	$('#txtmsg').html(`Capture your face to verify your identity`);
	$('#submit_qr').hide();
	$('#capture_img').show();
	$('#camera').show();
}

var capture_img_func = function (event) {
	$('#camera, #capture_img').hide();
	$('#snapshots').show();
	
	console.log("disabling verify_btn");
	//$("#verify_btn").prop("disabled", true);
	$('#verify_btn').show();
	for(let i = 0;i<nbFrames;i++){
		setTimeout(function () {
				take_snapshots(i);
				if(i == nbFrames - 1){
					//$("#verify_btn").attr("disabled", false);
					$('#verify_btn').attr("onclick","javascript:document.forms[0].submit();");
					$('#verify_btn').addClass("btn-success");
					
				}
            }, i*50);

		//addImageToForm(i);
        /*setTimeout(function () {
            addImageToForm(i);
        }, 1000);*/
	}
	
	/*  setTimeout(function () {
		addImageToForm();
	}, 1000) */
};

 var take_snapshots = function (i) {
 	console.log("take_snapshots");
	var k = i;
	 if(i<0){
		 k = i+1;
	 }
	 imageCapture[k].grabFrame()
        .then(imageBitmap => {
            const canvas = document.querySelector('#snapshots');
			drawCanvas(canvas, imageBitmap);
			if(i!=-1) addImageToForm(i,canvas);
        })
        .catch(error => console.log(error));
}; 

/* var take_snapshots = function (count) {
	setTimeout(function () {
		for (let i=0;i<count ;i++){
			imageCapture.grabFrame()
				.then(imageBitmap => {
					addImageToForm(imageBitmap,i)
				})
				.catch(error => console.log(error));
			}
	}, 1000)	
}; */

function drawCanvas(canvas, img) {
    canvas.width = 160;//getComputedStyle(canvas).width.split('px')[0];
    canvas.height = 120;//getComputedStyle(canvas).height.split('px')[0];
    let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
    let x = (canvas.width - img.width * ratio) / 2;
    let y = (canvas.height - img.height * ratio) / 2;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
        x, y, img.width * ratio, img.height * ratio);
}

var select_snapshot = function () {
	$(".item").removeClass("selected");
	var snapshot = $(this).addClass("selected").data("snapshot");
	snapshot.show();
};

var add_snapshot = function (element) {
	$(element).data("snapshot", this).addClass("item");

	var $container = $("#snapshots").append(element);
	var $camera = $("#camera");
	var camera_ratio = $camera.innerWidth() / $camera.innerHeight();

	var height = $container.height()
	element.style.height = "" + height + "px";
	element.style.width = "" + Math.round(camera_ratio * height) + "px";

	var scroll = $container[0].scrollWidth - $container.innerWidth();
};

 function addImageToForm(i,canvas) {
	//var canvas = $('#snapshots').get(0);
	var imageData = canvas.toDataURL();

	input = document.createElement("input");
	input.name = 'img' + i;
	input.type = "hidden";
	input.filename = input.name;
	input.value = imageData;
	document.getElementsByTagName("form")[0].appendChild(input)

	//document.getElementsByName("avatar")[0].setAttribute("value", imageData);
	//document.getElementsByName("qrdata")[0].setAttribute("value", QR_Data);
};
 
/* function addImageToForm(image,i) {
	//var canvas = $('#snapshots').get(0);
	//var imageData = canvas.toDataURL();
	//document.getElementsByName("avatar")[0].setAttribute("value", imageData);
	var reader = new FileReader();
	reader.getAsFile(image);
	reader.onload = function () {
	input = document.createElement("input");
	input.name = 'img' + i;
	input.type = "hidden";
	input.filename = input.name;
	input.value = reader.result;
	document.getElementsByTagName("form")[0].appendChild(input)
	};
	console.log(reader.result)
	
	
	document.getElementsByName("qrdata")[0].setAttribute("value", QR_Data);
}; */

function addImageToFormRegister() {
	var canvas = $('#snapshots').get(0);
	var imageData = canvas.toDataURL();
	document.getElementsByName("avatar")[0].setAttribute("value", imageData);
	//document.getElementsByName("qrdata")[0].setAttribute("value", QR_Data);
};