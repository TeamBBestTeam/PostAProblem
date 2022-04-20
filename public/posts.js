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
   * @param {string} statusImage Status image for the post
*/
function addRow(y, user, title, replyAmount, views, lastReplyDate, lastReplyUser, statusImg) {
	// Create row for this entry
	const tableRow = document.createElement('div');
	tableRow.className = 'table-row';
	tableRow.id = "table-row" + y;

	// Add status image
	const status = document.createElement('div');
	status.className = 'status';
	status.innerHTML = `<i class="${statusImg}"></i>`;
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
   * Queries data from a single post and its comments
   * Checks if the query is included in the post's title, text, or comments
   * @param record {object} petition record in JSON form
   * @param query {string} [query=""] Query to run
   * @return {bool} True if post contains query, otherwise false
**/
function queryEverything(record, query=""){
	// If the query is not found in the post title or text
	if (!record.petitionTitle.includes(query) && 
		!record.petitionText.includes(query)){
		
		// Check if the post has comments
		if (record.comments && record.comments.comment1){
			for (var n = 0; n < Object.values(record.comments).length; n++){
				var author = Object.values(record.comments)[n].author;
				var commentText = Object.values(record.comments)[n].comment;
				// Check comment and comment author for queried text
				if (commentText.includes(query) || 
					author.includes(query)){
					return true;
				}
			}
		}
		return false;
	}
	return true;
}

/**
   * Queries data from a post's title only
   * Checks if the query is included in the post's title
   * @param record {object} petition record in JSON form
   * @param query {string} [query=""] Query to run
   * @return {bool} True if title contains query, otherwise false
**/
function queryByTitle(record, query=""){
	return record.petitionTitle.includes(query) ? true : false;
}

/**
   * Queries data from a post's content only
   * Checks if the query is included in the post's description
   * @param record {object} petition record in JSON form
   * @param query {string} [query=""] Query to run
   * @return {bool} True if description contains query, otherwise false
**/
function queryByDescription(record, query=""){
	return record.petitionText.includes(query) ? true : false;
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
   * Fetches post information from Firebase
   * Calls the AddRow function for each post
   * @param query {string} [query=""] Query to run
   * @param queryType {string} [queryType="Everything"] Type of Query to run ("Everything" || "Titles" || "Description")
   * @param startY {int} [startY=1] Post in query to start at
   * @param amountOfPosts {int} [amountOfPosts=10] Amount of posts to display
**/
function fetchPosts(query="", queryType="Everything", startY=1, amountOfPosts=10){
	// Clear current petitions listed on page
	document.getElementById('container').innerHTML = "";
	
	// Get petitions from database
	get(child(dbRef, `petitions`)).then((snapshot) => {
		// Check if the petitions exist
		if (snapshot.exists()) {
			// Store row/petition number in query
			var y = startY;
			// Loop over each petition in the snapshot
		 	snapshot.forEach(function (childSnapshot) {	
				// Only display amountOfPosts posts on this page
				if (y >= startY + amountOfPosts) { 
					return;
				}
								
				// Load data from petition
            	var value = childSnapshot.val();
				

				// Only display posts that contain the query in selected content
				if (query != ""){
					if (queryType == "Everything" && !queryEverything(value, query)){
						return;
					}
					else if (queryType == "Titles" && !queryByTitle(value, query)){
						return;
					}
					else if (queryType == "Description" && !queryByDescription(value, query)){
						return;
					}
				}
				// Store data about the petition
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
					replyAmount = Object.values(value.comments).length;
					lastReplyDate = lastReply.date;
					lastReplyUser = lastReply.author;
				}
				
				var statusImage = getStatusImage(lastReplyDate);

				// Adds new row of information to posts
				addRow(y, 
				   user, 
				   title, 
				   replyAmount, 
				   views, 
				   lastReplyDate, 
				   lastReplyUser,
				   statusImage
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

/**
   * Fetches information from a query
   * Called when the search button is clicked
   * Calls the fetchPost function with the info in the search box
**/
function fetchPostByQuery(){
	// Get search button from html
	var searchButton = document.getElementById('searchBtn');

	// Remove the clickable event listener (prevents button spamming)
	searchButton.removeEventListener("click", fetchPostByQuery);
	// Get search query and type of query
	var search = document.getElementById('searchBar').value;
	var searchType = document.getElementById('dropdown').value;

	
	// Fetch new posts, update page
	fetchPosts(search, searchType);
	// Allow user to click the button again
	searchButton.addEventListener("click", fetchPostByQuery);
}

// Allow user to click magnifying glass to make query
var searchButton = document.getElementById('searchBtn');
searchButton.addEventListener("click", fetchPostByQuery);


fetchPosts();