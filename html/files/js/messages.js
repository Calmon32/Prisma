var currentUser = "";

$(document).ready(function () {
    $('.namess').quickfit({max:18, width:150, truncate:true});
    if (currentUser != "") {
        var fun = function() {
            getMessages(currentUser);
        }
        var int = setInterval(fun, 5000);
    }
    $('#imgSelectBg').click(function() {
        popUp.style.display = "none";
        imgSelectBg.style.display = "none";
    });
});

function submitMessage(event,userInput) {
    if(event.keyCode == 13){
        event.preventDefault();
        $.post("/insert", {message: userInput, receiverid: currentUser}, function (data) {
            if (data.message) {
                alert(data.message);
            }
            chatbox.innerHTML += `<div class="right">
                        <p>${userInput}</p>
                        </div>`;
        });
        document.getElementById("messageInput").value = "";
    }
}

function getMessages(user) {
    $.get("/get-message/"+user, function (data) {
        currentUser = user;
        var messages = data.messages;
        chatbox.innerHTML = "";
        for (var i = 0; i < messages.length; i++) {
            var id2 = messages[i].senderId;
            var message = messages[i].message;
            if (id2 == currentUser) {
                var app = `<div class="left">
                        <p>${message}</p>
                        </div>`;
            }
            else {
                var app = `<div class="right">
                        <p>${message}</p>
                        </div>`;
            }
            chatbox.innerHTML += app;
        }
    });
    popUp.style.display = "none";
    imgSelectBg.style.display = "none";
}

function getFriends() {
    $.get("/getfriends", function (data) {
        friends.innerHTML = "";
        for (var i = 0; i < data.friends.length; i++) {
            var id = data.friends[i];
            var app = `<div class="friend3" onclick="getMessages('${id}');$('.chatbox').animate({ scrollTop: $('.chatbox').height() }, 'slow');">
                    <img src="/userProfiles/user${id}.png" onerror="this.onerror=null;this.src='/userProfiles/profile.png';" style="height: 80px; float: left;">
                </div>`;
            friends.innerHTML += app;
        }
    });
    imgSelectBg.style.display = "block";
    popUp.style.display = "block";

}

/*$(document).ready(function ()
{
    $("#searchUser").hide();
}
function searchUser(){
    $(document).ready(function ()
    {
        $("#searchUser").click(function(){
            $("#").slideDown("slow");
        });
        $("#click2").click(function(){
            $("h3").show();
            $("h4").show();
        });
        $("#click3").click(function() {
            alert("Text: " + $("h3").text());
        });
        $("#click4").click(function() {
            alert("Text: " + $("h4").text());
        });
    });
}
*/