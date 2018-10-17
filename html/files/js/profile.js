$(document).ready(function() {
	$('.postImage, .comment').click(function(){
		var id = $(this).attr('id');
		$.get("/postdata/" + id, function (data) {
			profileImgg.src = "/userProfiles/user"+data.user+".png";
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
				var name = comm[i].username;
				var app = `<li><img src="/userProfiles/user${id2}.png" class="commmentIcon">
                            <h3>${name}</h3>
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
		uploadPost.style.display = "none";
		uploadProfileIMG.style.display = "none";
		profileImgg.src = "#";
		selectImage.src = "#";
		comments.innerHTML = "";
	});
	$('#uploadImageDiv').click(function() {
		imgSelectBg.style.display = "block";
		uploadPost.style.display = "block";
	});
	$('#postIMG').change(function(){
		 updateIMG(this);
	});
	$('#postIMG2').change(function(){
		 updateIMG2(this);
	});
	$('.profileImg').click(function() {
		imgSelectBg.style.display = "block";
		uploadProfileIMG.style.display = "block";
	});
});

function updateIMG(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			$('#imgPrev').attr('src', e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}
function updateIMG2(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			$('#imgPrev2').attr('src', e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}