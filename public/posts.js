import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import {getDatabase, ref, get, child} 
from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyD91WOXEuZZFKr3YqjUN7m_hVEpW_8RFxw",
	authDomain: "post-a-problem-spring-2022.firebaseapp.com",
	databaseURL: "https://post-a-problem-spring-2022-default-rtdb.firebaseio.com",
	projectId: "post-a-problem-spring-2022",
	storageBucket: "post-a-problem-spring-2022.appspot.com",
	messagingSenderId: "38461578684",
	appId: "1:38461578684:web:1125dfd7bf60ad98cb1fb9",
	measurementId: "G-LPZ4LGS9X1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const dbRef = ref(getDatabase());


/**
   * Adds a row of data, containing  information about a post
   * @param {int} y Row number
   * @param {string} user Username of original poster
   * @param {string} title Title of the post
   * @param {int} replyAmount Amount of replies this post has
   * @param {string} view Amount of views this post has
   * @param {string} lastReplyDate Date of the last comment, in format MMM DD YYYY
   * @param {string} lastReplyUser Username of the last commenter
*/
function addRow(y, user, title, replyAmount, views, lastReplyDate, lastReplyUser) {
	// Create row for this entry
	const tableRow = document.createElement('div');
	tableRow.className = 'table-row';
	tableRow.id = "table-row" + y;

	// Add status image
	const status = document.createElement('div');
	status.className = 'status';
	status.innerHTML = '<i class="fa fa-fire">';
	
	// Add subject title
	const subjects = document.createElement('div');
	subjects.className = 'subjects';
	subjects.innerHTML = `
		<a href="">${title}</a>
		<br>
		<span>Started by <b><a href="">${user}</a></b> .</span>
	`;

	// Add info about all replies
	const replies = document.createElement('div')
	replies.className = 'replies';
	replies.innerHTML = `${replyAmount} replies <br> ${views} views`;

	// Add info about the last reply (if any)
	const lastReply = document.createElement('div');
	lastReply.className = 'last-reply';
	var text = "By";
	if (lastReplyUser == ""){
		text = "None";
	}
	lastReply.innerHTML = `${lastReplyDate}
		<br>${text} <b><a href="">${lastReplyUser}</a></b>`;

	// Add each div to the row
	tableRow.appendChild(status);
	tableRow.appendChild(subjects);
	tableRow.appendChild(replies);
	tableRow.appendChild(lastReply);
	
	// Add the row to the container of rows
	document.getElementById('container').appendChild(tableRow);
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
		for (var key in record.comments){
			// Store the time this comment was posted
			var postTime = Date.parse(key.date);

			// If this post is newer than the last post found
			if (lastPostTime < postTime){
				// This is the latest post
				lastPostTime = postTime;
				lastPost = key;
			}
		}
		return lastPost;
	}
	return null;
}

/**
   * Fetches post information from Firebase
   * Calls the AddRow function for each post
   * @param query {string} [query=""]
**/
function fetchPosts(query=""){
	console.log("Running");
	// Get petitions from database
	get(child(dbRef, `petitions`)).then((snapshot) => {
		// Check if the petitions exist
		if (snapshot.exists()) {
			// Store each row
			var y = 1;
			// Loop over each petition in the snapshot
		 	snapshot.forEach(function (childSnapshot) {
				// Load data from petition
            	var value = childSnapshot.val();
            	var user = value.username;
				var title = value.petitionTitle;
				var views = value.views;

				// Store data about the latest comment
				var replyAmount = 0;
				var lastReplyDate = "";
				var lastReplyUser = "";

				// Find the latest comment (if any)
				var lastReply = findLastReply(value);
				if (lastReply) {
					// Set the latest comment information
					replyAmount = 0;
					for (var key in value.comments) {
						replyAmount++;
					}
					lastReplyDate = lastReply.date;
					lastReplyUser = lastReply.author;
				}

				// Adds new row of information to posts
				addRow(y, 
				   user, 
				   title, 
				   replyAmount, 
				   views, 
				   lastReplyDate, 
				   lastReplyUser
				);
				y++;
			});
		}
		else {
			console.log("No data available");
			return;
		}
	}).catch((error) => {
		console.error(error);
	});
}


fetchPosts();