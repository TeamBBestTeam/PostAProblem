import {getDatabase, update, ref, get, child} 
from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";

const auth = getAuth();
const dbRef = ref(getDatabase());

/**
	* Adds post information to page
	* @param values {Object} Snapshot values from Firebase
	* @param postId {string} Unique identifier of the petition
**/
function addPost(values, postId) {
	// Get information from values object
	var petitionText = values.petitionText;
	var petitionTitle = values.petitionTitle;
	var originalPoster = values.username;
	var views = values.views;
	// Count the amount of votes
	var votes = Object.keys(values.votes).length - 1;
	// Generate HTML for post
	var petitionHTML = `
	<div class="body" style="width: 100%">
		<div class="authors">
			<div class="username"><a href="">${originalPoster}</a></div>`
	
	// Get comments (if they exist)
	var comments = values.comments;
	var amountOfComments = 0;
	if (comments !== undefined){
		// Count number of comments
		amountOfComments = Object.keys(comments).length;
	}
	petitionHTML += `
			<div>Replies: <u>${amountOfComments}</u></div>
			<div>Views: <u>${views}</u></div>
		</div>
		<div class="content">
			<h3 style="max-width:600px;
				word-wrap:break-word;">
				${petitionTitle}
			</h3>
			<br>
			<hr>
			<br><br>
			<p style="max-width:600px;
				word-wrap:break-word;">
				${petitionText}
			</p>
			<div class="signingButton">
				<button class="signButton" id="sign">Sign</button>
				<var name="signTotal" id="signTotal">${votes}</var>
			</div>
			<div class="comment"">
				<button id="commentButton">Comment</button>
			</div>
		</div>
	</div>
	<hr><br>
	<h3 style="width: 100%;
		word-wrap:break-word;
		text-align:center;">
	Comments
	</h3>`;
	
	// Add comments
	if (comments !== `undefined`){
		petitionHTML += `<br><hr>`;
		// Display the first ten comments
		for (let i = 0; i < 10 && i < amountOfComments; i++){
			var comment = comments[Object.keys(comments)[i]];
			
			var commentAuthor = comment.author;
			var commentText = comment.commentText;
			var date = comment.date.split(", ")[0];;
			
			var commentHTML = `
			<div class="body" style="width: 100%">
				<div class="authors">
					<div class="username"><a href="">${commentAuthor}</a></div>
				<br><br><hr>
				<div>Date: <u>${date}</u></div>
				</div>
				<div class="content">
					<h3 style="max-width:600px;
						word-wrap:break-word;">
						${commentText}
					</h3>
				<br><br>
			</div></div><hr>`

			petitionHTML += commentHTML;
		}
	}
	petitionHTML += `<div id="commentContainer"></div>`;
	document.getElementById("postLink").innerHTML = petitionTitle;
	document.getElementById("petition").innerHTML = petitionHTML;
	
	// Create a hidden commenting area underneath comments
	document.getElementById("commentContainer").innerHTML = `
		<div classname="table-row">
			<div class="comment-area hide" id="comment-area">
	            <textarea name="comment" id="newCommentArea" placeholder="comment here ... "></textarea>
	            <input type="submit" value="submit" id="submitComment">
        	</div>
		</div>`;
	
	// Allow user to click sign button - signing/unsigning a petition
	var signButton = document.getElementById(`sign`);
	signButton.postId = postId;
	signButton.addEventListener("click", signPetition);

	// Allow user to click comment button - showing comment area
	var commentButton = document.getElementById(`commentButton`);
	signButton.postId = postId;
	commentButton.addEventListener("click", toggleComment);

	

	

}


/**
	* Fetches post information, given a post ID number
	* If post ID is not found, will bring user to the 404 page
	* @param postId {string} Unique identifier for post
**/
function tryFetchPost(postId){
	// Verify the petition exists
	get(child(dbRef, `petitions/${postId}`)).then((snapshot) => {
		if (snapshot.exists()) {
			// Add the post information to the page
			addPost(snapshot.val(), postId);
		} else { 
			alert("Post ID not found");
			// If post is not found - Bring user to 404 page
			console.error(`Post ID Not Found: ${postId}`);
			document.location.href = "404.html";
		}
	}).catch((error) => {
		console.error(error);
	});;
}



/**
   * Signs a petition if not signed, unsigns a petition if previously signed
   * Only allows user to sign petition if signed in, otherwise displays warning prompt
   * @param evt {Object} Event that occured (generated with addEventListener)
**/
function signPetition(evt) {
	// Get post this button is attached to
	var postId = evt.currentTarget.postId;

	// Get the current user
	const user = auth.currentUser;
	// Only allow logged in users to sign
	if (user !== null){
		// Get UID of user
		const uid = auth.currentUser.uid;
		
		// Verify user has not signed the petition
		get(child(dbRef, `/petitions/${postId}`)).then((snapshot) => {
			// If post is found
			if (snapshot.exists()) {
				// Get voters and amount of votes
				var votes = snapshot.val().votes;
				var len = Object.keys(votes).length - 1;

				// Get the signature counter for this post
				var signBtn = document.getElementById(`signTotal`);
				
				// Check if user has not signed the petition
				if (votes[uid] == undefined){
					// Sign the petition
					var updates = {};
					updates[`/petitions/${postId}/votes/${uid}`] = len;
					update(dbRef, updates);

					// Update signature counter
					signBtn.innerHTML = len + 1;
					alert(`Petition signed! You are signer # ${len + 1}`);
				}
				else {
					// Ask user if they'd like to revoke their signature
					if (confirm("Revoke signature?")) {
						// Revoke the signature
						var updates = {};
						updates[`/petitions/${postId}/votes/${uid}`] = null;
						update(dbRef, updates);
						
						// Update signature counter
						signBtn.innerHTML = len - 1;
					}
				}
			}
		});
	}
	else {
		alert("You must be logged in to sign a petition!");
	}
}

//Comments
/**
	* Displays a comment section if hidden, hides if displayed
	* @param evt {Object} Event that occured (generated with addEventListener)
**/
function toggleComment(evt){
	// Get the current user
	const user = auth.currentUser;
	
	// Only allow logged in users to comment
	if (user !== null){
		var commentArea = document.getElementById(`comment-area`);
		var submitCommentButton = document.getElementById(`submitComment`);
		submitCommentButton.postId = evt.currentTarget.postId;
		// Show / hide comment area
		if (commentArea.classList.contains("hide")){
			commentArea.classList.remove("hide");
			// Allow user to submit comment
			submitCommentButton.addEventListener("click", submitComment);
		}
		else {
			// Don't allow user to submit comment
			submitCommentButton.removeEventListener("click", submitComment);
			commentArea.classList.add("hide");
		}		
	}

}


function addComment(postId, username, uid, commentText, date){
	// Check if the comment already exists
	get(child(dbRef, `petitions/${postId}/comments/${uid}`)).then((snapshot) => {
		if (snapshot.exists()){
			// If previous comment exists, ask user if they'd like to overwrite
			var prompt = confirm("Overwrite previous comment?");
			if (!prompt){
				// User selected 'Cancel' - refresh
				window.location.href = window.location.href;
				return;
			}
		}
		// No comment exists OR User selected 'Ok' - Comment on the petition
		var updates = {};
		// Path to the comment in the database
		var path = `/petitions/${postId}/comments/${uid}/`;
		// Update author, commentText, and date keys
		updates[path+`author`] = username;
		updates[path+`commentText`] = commentText;
		updates[path+`date`] = date;

		// Push updates
		update(dbRef, updates);

		alert("Post submitted!");
		// Refresh the page
		window.location.href = window.location.href;
	});
}
/**
	* Submits a comment to the petition
	* Calls the addComment function with the details found for the comment
	* @param evt {Object} Event that occured (generated with addEventListener)
**/
function submitComment(evt){
	// Get the current user
	const user = auth.currentUser;
	var userId = user.uid;
	// Get the post this button is attached to
	var url = window.location.href;
	var postId;
	// Parse URL for postId
	// Must be in format: .../post.html?id="postId"
	if (url.includes("petition.html?") && url.includes("id=")){
		postId = url.split("id=")[1];
	}
	else { return; }
	
	var commentText = document.getElementById("newCommentArea").value;
	// Only allow posts with content inside of them
	if (commentText.length <= 1){
		alert("Your comment is blank!");
	}
	// Only allow logged in users to submit comment
	else if (user !== null){
		var dateTime = new Date(Date.now()).toLocaleString();
		// Check if user has already left a comment
		// Get username from database
		get(child(dbRef, `users/${userId}`)).then((snapshot) => {
			// Check if the petitions exist
			if (snapshot.exists()) {
				var username = snapshot.val().username;
				addComment(
					postId,
					username, 
					userId,
					commentText, 
					dateTime
				);
			}
		});
	}
}

/**
	* Loads a post, given the post information from the URL
	* URL must be in the format .../post.html?id="{postId}"
	* Invalid URLs / incorrect postId's will bring user to the 404 page
**/
function loadPost(){
		
	// Store post and URL information
	var url = window.location.href;
	
	// Parse URL for post information
	// Must be in format: .../post.html?id="postId"
	if (url.includes("petition.html?") && url.includes("id=")){
		// URL is consistent with format
		const queryString = window.location.search;

		// Parse URL for query information
		var postId = decodeURI(queryString.split("id=")[1]);
		
		
		// If postId found, add information based on postId
		if (typeof postId !== `undefined`) {
			// Try loading the post information
			tryFetchPost(postId);
		}
	}
	else {
		alert("URL mismatch");
		// Query is not in proper format- Bring user to 404 page
		console.error(`URL search parameter format mismatch: ${url}`);
		document.location.href = "404.html";
	}
}


loadPost();