var catSelected = "";
var previousSearch = "";


$(document).ready(function() {
	$('.postImage, .comment').click(function(){
		var id = $(this).attr('id');
		$.get("/postdata/" + id, function (data) {
			profileImgg.src = "/userProfiles/user"+data.user+".png";
			profileImgg.setAttribute("onclick","window.location = '/user/'+'" +data.username+ "'");
			selectImage.src = "/imageDB/" + id + ".jpg";
			selectName.innerHTML = data.username;
			tagid.innerHTML = "#"+data.tag;
			description.innerHTML = data.caption;
			likecount.innerHTML = data.likers.length;
			likebtn.className = data.liked;
			likebtn.src = "/images/" + data.liked + ".png";
			likebtn.setAttribute( "onclick", "like(this,'"+id+"');" );
			leaveComment.className = id;
			var comm = data.comments;
			comments.innerHTML = "";
			for (var i = 0; i < comm.length; i++) {
				var id2 = comm[i].id;
				var comment = comm[i].comment;
				var username = comm[i].username;
				var app = `<li><img src="/userProfiles/user${id2}.png" onerror="this.onerror=null;this.src='/userProfiles/profile.png';" class="commmentIcon" onclick="window.location = '/user/${username}'">
                            <h3>${username}</h3>
                            <p>${comment}</p>
                        	</li>`;
				comments.innerHTML += app;
			}
	    });
		imgSelectBg.style.display = "block";
		document.getElementById("imgSelect").style.display = "block";
	});
	$('#imgSelectBg').click(function() {
		imgSelectBg.style.display = "none";
		document.getElementById("imgSelect").style.display = "none";
		profileImgg.src = "#";
		selectImage.src = "#";
		comments.innerHTML = "";
	});
});


function search(){
	x = searchBar.value;
	if (x != previousSearch) {
		previousSearch = x;
		if (x != "") {
			$.post("/search", { search: x }, function (data) {
				foundUsers.innerHTML = "";
				if(data.users.length > 0) {
					$( ".info" ).fadeOut( 200 );
					for (var i = 0; i < data.users.length; i++) {
						var id = data.users[i].id;
						var name = data.users[i].name;
						var username = data.users[i].username;
						var app = `<div class="user" id="${username}">
            						<img src="/userProfiles/user${id}.png" onerror="this.onerror=null;this.src='/userProfiles/profile.png';" class="userIcon">
            						<h3>${name}</h3>
            						<p>${username}</p>
        							</div>`;
        				foundUsers.innerHTML += app;
        				$('.user').click(function() {
							window.location = "/user/" + $(this).attr("id");
						});
					}
				}
				else {
					foundUsers.innerHTML = "<h3 style='margin-top:50px;'>No Users Found</h3>";
				}
			});
		}
		else {
			foundUsers.innerHTML = "";
			$( ".info" ).fadeIn( 200 );
		}
	}
}

function login() {
	var a = document.forms["myForm"]["username"].value;
	var b = document.forms["myForm"]["password"].value;
	var formdata = { username: a, password: b};
	$.post("/login", formdata, function (data) {
		if(data.message) {
			alert(data.message);
		}
		if(data.redirect) {
			window.location = data.redirect;
		}
	});
}

function validateForm() {
	var valid = true;
	wrongInput.innerHTML = "";
	wrongInput.style.border = "0";
	var a = document.forms["myForm"]["name"].value;
	var b = document.forms["myForm"]["username"].value;
	var c = document.forms["myForm"]["email"].value;
	var d = document.forms["myForm"]["password"].value;
	var e = document.forms["myForm"]["confirm_password"].value;
	var f = document.forms["myForm"]["gender"].value;
	if (a.length < 8) {
		document.forms["myForm"]["name"].style.border = "1px solid red";
		wrongInput.innerHTML = "<h5><strong>Name too short.</strong></h5>";
		wrongInput.style.border = "1px solid red";
		valid = false;
	}
	else {
		document.forms["myForm"]["name"].style.border = "1px solid white";

	}
	if (b.length < 8) {
		document.forms["myForm"]["username"].style.border = "1px solid red";
		wrongInput.innerHTML += "<h5><strong>Username too short.</strong></h5>";
		wrongInput.style.border = "1px solid red";
		valid = false;
	}
	else {
		document.forms["myForm"]["username"].style.border = "1px solid white";
	}
	if (c == "") {
		document.forms["myForm"]["email"].style.border = "1px solid red";
		valid = false;
	}
	else {
		document.forms["myForm"]["email"].style.border = "1px solid white";
	}
	if (d != e) {
		document.forms["myForm"]["password"].style.border = "1px solid red";
		document.forms["myForm"]["confirm_password"].style.border = "1px solid red";
		wrongInput.innerHTML += "<h5><strong>Passwords do not match.</strong></h5>";
		wrongInput.style.border = "1px solid red";
		valid = false;
	}

	else {
		if (d.length < 8) {
			document.forms["myForm"]["password"].style.border = "1px solid red";
			document.forms["myForm"]["confirm_password"].style.border = "1px solid red";
			wrongInput.innerHTML += "<h5><strong>Password too short.</strong></h5>";
			wrongInput.style.border = "1px solid red";
			valid = false;
		}
		else {
			document.forms["myForm"]["confirm_password"].style.border = "1px solid white";
			document.forms["myForm"]["password"].style.border = "1px solid white";
		}
	}

	/*if (!(d.indexOf('#-%') > -1)) {
	document.getElementById('wrongInput').innerHTML = "<h5><strong>Password must contain a special character</strong></h5";
	document.getElementById("wrongInput").style.border = "1px solid red";
	valid = false;
	}*/
	
	if (valid == true) {
		var formdata = { name: a, username: b.toLowerCase(), email: c.toLowerCase(), password: d, gender: f };
		$.post("/forms", formdata, function (data) {
			if(data.message) {
				alert(data.message);
			}
			if(data.redirect) {
				window.location = data.redirect;
			}
		});
	}
}


function like(x,id) {
	if (x.className == "nliked") { 
		$.post("/like", {photoid: id}, function (data) {
			if (data.liked == true) {
				x.className = "liked";
				x.src = "/images/liked.png";
				window.location.reload();
			}
			else if (data.liked == false) {
				x.className = "nliked";
				x.src = "/images/nliked.png";
				window.location.reload();
			}
			else {
				alert(data.status);
			}
		});
	}
	else if (x.className == "liked") { 
		$.post("/unlike", {photoid: id}, function (data) {
			if (data.liked == true) {
				x.className = "liked";
				x.src = "/images/liked.png";
				window.location.reload();
			}
				else if (data.liked == false) {
				x.className = "nliked";
				x.src = "/images/nliked.png";
				window.location.reload();
			}
			else {
				alert(data.status);
			}
		});
	}
}

function follow(x,id) {
	if (x.className == "nfollowed") { 
		$.post("/follow", {userid: id}, function (data) {
			window.location.reload();
		});
	}
	else if (x.className == "followed") { 
		$.post("/unfollow", {userid: id}, function (data) {
		window.location.reload();
		});
	}
}

function comment(event,mess) {
	if(event.keyCode === 13){
		event.preventDefault();
		$.post("/comment", {photoid: mess.className, comment: mess.value}, function (data) {
			var x = usrinfo.className.split("/");
			var id = x[0];
			var user = x[1];
			var comm = mess.value;
			var app = `<li><img src="/userProfiles/user${id}.png" class="commmentIcon">
                            <h3>${user}</h3>
                            <p>${comm}</p>
                        	</li>`;
			comments.innerHTML += app;
			mess.value = "";
		});
	}
}

function imgSelect(id) {
	imgSelectBg.style.display = "block";
	document.getElementById("imgSelect").style.display = "block";
}

function imgDeselect(id) {
	imgSelectBg.style.display = "none";
	document.getElementById("imgSelect").style.display = "none";
}

function selectCat(box) {
	if (!(catSelected)) {
		box.className = "categorySel";
		$( ".category" ).fadeTo( "slow" , 0.5 );
		catSelected = box.id;
		$(".card:not(."+catSelected+")").fadeOut( "slow" );
	}
	else if (catSelected == box.id) {
		box.className = "category";
		$( ".category" ).fadeTo( "slow" , 1 );
		$( ".card" ).fadeIn( "slow" );
		catSelected = "";
	}
}

function opensettings() {
	imgSelectBg.style.display = "block";
	$( ".profileSettings" ).css("display","block");
}

function closesettings() {
	imgSelectBg.style.display = "none";
	$( ".profileSettings" ).css("display","none");
}