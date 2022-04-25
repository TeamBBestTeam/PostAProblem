import {getDatabase, update, ref, get, child} 
from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js";

// Initialize Firebase
const dbRef = ref(getDatabase());
const auth = getAuth();
/**
   * Signs a petition if not signed, unsigns a petition if previously signed
   * Only allows user to sign petition if signed in, otherwise displays warning prompt
   * @param evt {Object} Event that occured (generated with addEventListener)
**/
function signPetition(evt) {
	// Get post this button is attached to
	var postNumber = evt.currentTarget.postNumber;
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

//Comments
/**
	* Displays a comment section if hidden, hides if displayed
	* @param evt {Object} Event that occured (generated with addEventListener)
**/
function toggleComment(evt){
	// Get post this comment button is attached to
	var postNumber = evt.currentTarget.postNumber;
	// Get the current user
	const user = auth.currentUser;

	// Only allow logged in users to comment
	if (user !== null){
		var commentArea = document.getElementById(`comment-area${postNumber}`);
		// Show / hide comment area
		if (commentArea.classList.contains("hide")){
			commentArea.classList.remove("hide");
		}
		else {
			commentArea.classList.add("hide");
		}		
	}

}

/**
   * Fetches status picture from images, given the date of the last reply
   * @param {Date} [lastReplyDate=0] Date of last reply (in Unix time)
   * @return {string} filename of status icon image
**/
function getStatusImage(lastReplyDate=0){
	const today = new Date();

	if (lastReplyDate > today.getDate() - 1/4){
		// In the last 6 hours
		return "fa fa-rocket";
	}
	else if (lastReplyDate > today.getDate() - 1){
		// Since yesterday
		return "fa fa-fire";
	}
	else if (lastReplyDate > today.getDate() - 7){
		// In the last week
		return "fa fa-book";
	}
	// Longer than a week
	return "fa fa-frown-o";
}

/**
   * Adds post information to the page
**/
function addPost(y, postId, user, title, text, replyAmount, views, votes, statusImage){
	var container = document.getElementById("container");
//
	// Add row containing post information
	const tableRow = document.createElement('div');
	tableRow.className = 'table-row';
	tableRow.id = "table-row" + y;

	// Generate HTML for this post
	var postHTML = `<div class="body" style="width: 100%">
                <div class="authors">
                    <div class="username"><a href="">${user}</a></div>
                    <div>Status</div>
                    <i class="${statusImage}" style="font-size: 40px; margin-top: 10px; margin-bottom: 10px;"></i>
                    <div>Replies: <u>${replyAmount}</u></div>
                    <div>Views: <u>${views}</u></div>
                </div>
                <div class="content">
                    <h3 style="max-width:600px;
    word-wrap:break-word;">${title}</h3>
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
            <textarea name="comment" id="" placeholder="comment here ... "></textarea>
            <input type="submit" value="submit">
        </div>`;
	
	// Add table and commenting area to the container
	container.appendChild(tableRow);
	container.appendChild(comment);

	// Allow user to click sign button
	var signButton = document.getElementById(`sign${y}`);
	signButton.postNumber = y;
	signButton.postId = postId;
	signButton.addEventListener("click", signPetition);
	
	
	// Allow user to click comment button
	var commentButton = document.getElementById(`commentButton${y}`);
	commentButton.postNumber = y;
	commentButton.postId = postId;
	commentButton.addEventListener("click", toggleComment);
}

/**
   * Fetches last comment in a petition record
   * Returns null if no comment is found
   * @param record {object} petition record in JSON form
   * @return {object|null} latest comment to the input petition or null
**/
function findLastReply(record) {
	// Verify there are comments in this petition
	if (record.comments && record.comments.comment1){
		// Store the last post information
		var lastPostTime = 0;
		var lastPost = record.comments.comment1;
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
   * Fetches 3 random posts from Firebase's realtime database
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
            	var user = value.username;
				var title = value.petitionTitle;
				var text = value.petitionText;
				var views = value.views;
				var votes = Object.keys(value.votes).length - 1;

				// Store data about the latest comment
				var replyAmount = 0;
				var lastReplyDate = "";
				// Find the latest comment (if any)
				var lastReply = findLastReply(value);
				if (lastReply) {
					// Set the latest comment information
					replyAmount = Object.values(value.comments).length;
					lastReplyDate = lastReply.date;
					lastReplyUser = lastReply.author;
				}
				
				var statusImage = getStatusImage(lastReplyDate);
				
				// Adds new row of information to posts
				addPost(y,
					postId,
					user, 
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