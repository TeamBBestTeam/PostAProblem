import {getDatabase, update, ref, get, child} 
from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";

// Initialize Firebase
const dbRef = ref(getDatabase());
const auth = getAuth();
/**
   * Signs a petition if not signed, unsigns a petition if previously signed
   * Only allows user to sign petition if signed in, otherwise displays warning prompt
   * @param postNumber {int} Post number on page (from top to bottom, starting at 1)
   * @param postId {string} Unique identifier of the post
**/
function signPetition(postNumber, postId) {
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
				var signBtn = document.getElementById(`signTotal${postNumber}`);
				
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

/**
	* Verifies if a user's information is complete on profileEdit.html
	* If the user is missing information, will redirect them to profileEdit page
	* @param user {Object} User to lookup
**/
void verifyUserInfoExists(user) {
	get(child(dbRef, `users/${user.uid}`)).then((snapshot) => {
		// Check if the user exists
		if (snapshot.exists()) {
			var values = snapshot.val();
			if (
				values.country === undefined || 
				values.firstname === undefined || 
				values.lastname === undefined || 
				values.username === undefined ){
				// User is missing profile information!
				// Redirect to edit profile page
				window.location = "profileEdit.html";
			}
		}
		else {
			// Snapshot for user not found- redirect to login page
			window.location = "login.html";
		}
	});
}






//Comments

/**
	* Displays a comment section if hidden, hides if displayed
   	* @param postNumber {int} Post number on page (from top to bottom, starting at 1)
    * @param postId {string} Unique identifier for post
**/
function toggleComment(postNumber, postId){
	// Get the current user
	const user = auth.currentUser;

	// Only allow logged in users to comment
	if (user !== null){
		verifyUserInfoExists(user);
		var commentArea = document.getElementById(`comment-area${postNumber}`);
		var submitCommentButton = document.getElementById(`submitComment${postNumber}`);

		// Show / hide comment area
		if (commentArea.classList.contains("hide")){
			commentArea.classList.remove("hide");
			// Allow user to submit comment
			submitCommentButton.addEventListener("click", function(){
				submitComment(postNumber, postId);
			}, false);
			
		}
		else {
			// Do not allow user to submit comment
			var clearedElement = submitCommentButton.cloneNode(true);
			submitCommentButton.parentNode.replaceChild(clearedElement, submitCommentButton);
			commentArea.classList.add("hide");
		}		
	}
}
/**
	* Adds a comment to the database file
	* Overwrites previous posts by the user
	* @param postId {string} ID of the post to add
	* @param username {string} Author of the comment
	* @param uid {string} Unique user ID number
	* @param commentText {string} Contains the text for a comment
	* @param date {string} Local representation of the current date and time
**/
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
    * @param postNumber {int} Post number on page (from top to bottom, starting at 1)
   	* @param postId {string} Unique identifier of the post
**/
function submitComment(postNumber, postId){
	// Get the current user
	const user = auth.currentUser;
	var userId = user.uid;
	var commentText = document.getElementById(`comment${postNumber}`).value;
	// Only allow posts with content inside of them
	if (commentText.length <= 1){
		alert("Your comment is blank!");
	}
	// Only allow logged in users to submit comment
	else if (user !== null){
		var dateTime = new Date().toUTCString();
		// Check if user has already left a comment
		// Get username from database
		get(child(dbRef, `users/${userId}`)).then((snapshot) => {
			// Check if the user exists
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
   * Fetches status picture from images, given the date of the last reply
   * @param {Date} Date of last reply
   * @return {string} filename of status icon image
**/
function getStatusImage(lastReplyDate){
	const hoursElapsed = (new Date().getTime() - lastReplyDate.getTime()) / 3600000;

	if (hoursElapsed < 6){
		// In the last 6 hours
		return "fa fa-rocket";
	}
	else if (hoursElapsed < 24){
		// In the last 24 hours
		return "fa fa-fire";
	}
	else if (hoursElapsed < 168){
		// In the last week
		return "fa fa-book";
	}
	// Longer than a week
	return "fa fa-frown-o";
}

/**
   * Adds post information to the page
   * @param y {int} Row number, from top-to-bottom of page
   * @param postId {string} Unique identifier for post
   * @param user {string} Author of the post
   * @param title {string} Title of the post
   * @param text {string} Content in the post
   * @param replyAmount {int} Number of replies to this post
   * @param views {int} Number of views for this post
   * @param votes {int} Number of signatures this post has
   * @param statusImage {string} Image to display on this post
**/
function addPost(y, postId, author, authorId, title, text, replyAmount, views, votes, statusImage){
	var container = document.getElementById("container");

	// Add row containing post information
	const tableRow = document.createElement('div');
	tableRow.className = 'table-row';
	tableRow.id = "table-row" + y;

	// Generate HTML for this post
	var postHTML = `<div class="body" style="width: 100%">
                <div class="authors">
                    <div class="username"><a href="profile.html?id=${authorId}">${author}</a></div>
                    <div>Status</div>
                    <i class="${statusImage}" style="font-size: 40px; margin-top: 10px; margin-bottom: 10px;"></i>
                    <div>Replies: <u>${replyAmount}</u></div>
                    <div>Views: <u>${views}</u></div>
                </div>
                <div class="content">
                    <h3 style="max-width:600px;
    word-wrap:break-word;"><a href="petition.html?id=${postId}">${title}</a></h3>
                    <br>
					<hr>
                    <br><br>
                    <p style="max-width:600px;
    word-wrap:break-word;">${text}</p>
                    <div class="signingButton">
                        <button class="signButton" id="sign${y}">Sign</button>
                        <var name="signTotal" id="signTotal${y}">${votes}</var>
                    </div>
                    <div class="comment"">
                        <button id="commentButton${y}">Comment</button>
                    </div>
                </div>
            </div>
		<br><br>`
	
	// Add HTML content to this row
	tableRow.innerHTML = postHTML;
	
	// Create a hidden commenting area underneath row
	var comment = document.createElement('div');
	comment.classname = 'table-row';
	comment.innerHTML = `<div class="comment-area hide" id="comment-area${y}">
            <textarea name="comment" id="comment${y}" placeholder="comment here ... "></textarea>
            <input type="submit" value="submit" id="submitComment${y}">
        </div>`;
	
	// Add table and commenting area to the container
	container.appendChild(tableRow);
	container.appendChild(comment);

	// Allow user to click sign button
	var signButton = document.getElementById(`sign${y}`);

	signButton.addEventListener("click", function(){
		signPetition(y, postId);
	}, false);
	
	
	// Allow user to click comment button
	var commentButton = document.getElementById(`commentButton${y}`);
	commentButton.addEventListener("click", function(){
		toggleComment(y, postId);
	}, false);
}

/**
   * Fetches last comment in a petition record
   * Returns null if no comment is found
   * @param record {object} petition record in JSON form
   * @return {object|null} latest comment to the input petition or null
**/
function findLastReply(record) {
	// Verify there are comments in this petition
	if (record.comments){
		// Store the last post information
		var lastPostTime = 0;
		var lastPost = record.comments[Object.values(record.comments).length - 1];
		// Loop over each comment
		for (var n = 0; n < Object.values(record.comments).length; n++){
			// Store the time this comment was posted
			var postTime = Date.parse(Object.values(record.comments)[n].date);
			// If this post is newer than the last post found
			if (lastPostTime < postTime){
				// This is the latest post
				lastPostTime = postTime;
				lastPost = Object.values(record.comments)[n];
			}
		}
		return lastPost;
	}
	return null;
}

/**
   * Fetches 3 posts from Firebase's realtime database
   * Calls the addPost function for each post
   * @param amountToShow {int} [amountToShow=3] Amount of posts to display
**/
function fetchFeaturedPosts(amountToShow=3){
	
	// Get petitions from database
	get(child(dbRef, `petitions`)).then((snapshot) => {
		// Check if the petitions exist
		if (snapshot.exists()) {
			// Store row/petition number in query
			var y = 0;
			
			// Loop over each petition in the snapshot
		 	snapshot.forEach(function (childSnapshot) {			
				// Only show amountToShow number of posts
				if (y >= amountToShow){ return; }
				// Load data from petition
            	var value = childSnapshot.val();
				var postId = childSnapshot.key;
				
				// Store data about the petition
            	var author = value.username;
				var authorId = value.authorId;
				var title = value.petitionTitle;
				var text = value.petitionText;
				var views = value.views;
				var votes = Object.keys(value.votes).length - 1;

				// Store data about the latest comment
				var replyAmount = 0;
				var lastReplyDate = new Date(0);
				// Find the latest comment (if any)
				var lastReply = findLastReply(value);

				if (lastReply) {
					// Set the latest comment information
					replyAmount = Object.values(value.comments).length;
					lastReplyDate = new Date(lastReply.date);
				}
				
				var statusImage = getStatusImage(lastReplyDate);
				
				// Adds new row of information to posts
				addPost(y,
					postId,
					author, 
					authorId,
					title, 
					text,
					replyAmount, 
					views,
					votes,
					statusImage
				);
				y++;
			});
		}
		else {
			// No data available
			return;
		}
	}).catch((error) => {
		console.error(error);
	});
}


fetchFeaturedPosts();