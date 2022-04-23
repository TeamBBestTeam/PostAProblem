//NavBar
function hideIconBar(){
    var iconBar = document.getElementById("iconBar");
    var navigation = document.getElementById("navigation");
    iconBar.setAttribute("style", "display:none;");
    navigation.classList.remove("hide");
}

function showIconBar(){
    var iconBar = document.getElementById("iconBar");
    var navigation = document.getElementById("navigation");
    iconBar.setAttribute("style", "display:block;");
    navigation.classList.add("hide");
}

//Comment
function showComment(){
    var commentArea = document.getElementById("comment-area");
    commentArea.classList.remove("hide");
}

//Reply
function showReply(){
    var replyArea = document.getElementById("reply-area");
    replyArea.classList.remove("hide");
}

function petitionSubmit() {
  alert("Your petition has been created.");
  location.href = "index.html";
}


function fetchPosts() {
	searchBtn.removeEventListener("click", fetchPosts);
	// Get search query and type of query
	var search = document.getElementById('searchBar').value;
	var searchType = document.getElementById('dropdown').value;

	window.location = "posts.html";
}

var url = window.location.pathname;
if(url.substring(url.lastIndexOf('/')+1) == 'index.html') {
	var searchBtn = document.getElementById("searchBtn");
	searchBtn.addEventListener("click", fetchPosts);
}

