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
   * @param {string} author Username of original poster
   * @param {string} authorId ID of the author
   * @param {string} title Title of the post
   * @param {int} replyAmount Amount of replies this post has
   * @param {string} view Amount of views this post has
   * @param {string} lastReplyDate Date of the last comment, in format MMM DD YYYY
   * @param {string} lastReplyUser Username of the last commenter
   * @param {string} lastReplyUserId ID of the last commenter
   * @param {string} statusImage Status image for the post
   * @param {string} postId Unique identifier for the post
*/
function addRow(y, author, authorId, title, replyAmount, views, lastReplyDate, lastReplyUser, lastReplyUserId, statusImg, postId) {
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
		<a href="petition.html?id=${postId}">${title}</a>
		<br>
		<span>Started by <b><a href="profile.html?id=${authorId}">${author}</a></b> .</span>
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
		<br>${text} <b><a href="profile.html?id=${lastReplyUserId}">${lastReplyUser}</a></b>`;
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
	if (record.comments){
		// Store the last post information
		var lastPostTime = 0;
		var lastPost = record.comments[Object.values(record.comments).length - 1];
		// Loop over each comment
		for (var n = 0; n < Object.values(record.comments).length; n++){
			// Get the time this comment was posted
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
	if (!record.petitionTitle.toLowerCase().includes(query) && 
		!record.petitionText.toLowerCase().includes(query)){
		// Check if the post has comments
		if (record.comments){
			
			for (var n = 0; n < Object.values(record.comments).length; n++){
				var author = Object.values(record.comments)[n].author.toLowerCase();
				var commentText = Object.values(record.comments)[n].commentText.toLowerCase();
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
	return record.petitionTitle.toLowerCase()
		.includes(query) ? true : false;
}

/**
   * Queries data from a post's content only
   * Checks if the query is included in the post's description
   * @param record {object} petition record in JSON form
   * @param query {string} [query=""] Query to run
   * @return {bool} True if description contains query, otherwise false
**/
function queryByDescription(record, query=""){
	return record.petitionText.toLowerCase()
		.includes(query) ? true : false;
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
   * Fetches post information from Firebase
   * Calls the AddRow function for each post
   * @param query {string} [query=""] Query to run
   * @param queryType {string} [queryType="Everything"] Type of Query to run ("Everything" || "Titles" || "Description")
   * @param startY {int} [startY=1] Post in query to start at
   * @param amountOfPosts {int} [amountOfPosts=10] Amount of posts to display
**/
function fetchPosts(query="", queryType="Everything", startY=1, amountOfPosts=4){
	// Clear current petitions listed on page
	document.getElementById('container').innerHTML = "";
	
	// Get petitions from database
	get(child(dbRef, `petitions`)).then((snapshot) => {
		// Check if the petitions exist
		if (snapshot.exists()) {
			// Store row/petition number in query
			var y = 0;
			var totalPetitions = 0;
			// Count total number of petitions from query
			snapshot.forEach(function (childSnapshot) {totalPetitions++;});
			// Loop over each petition in the snapshot
		 	snapshot.forEach(function (childSnapshot) {	
				// Only display amountOfPosts posts on this page
				if (y >= (startY-1) + amountOfPosts) { 
					return;
				}
				// Only display posts from startY to startY + amountOfPosts
				else if (y >= startY-1) {
					// Load data from petition
	            	var value = childSnapshot.val();
					var postId = childSnapshot.key;
					
	
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
	            	var author = value.username;
					var authorId = value.authorId;
					var title = value.petitionTitle;
					var views = value.views;
					
	
					// Store data about the latest comment
					var replyAmount = 0;
					var lastReplyDate = "";
					var lastReplyUser = "";
					var lastReplyUserId = "";
					var statusImage = "fa fa-frown-o";
					// Find the latest comment (if any)
					var lastReply = findLastReply(value);
					if (lastReply) {
						// Set the latest comment information
						replyAmount = Object.values(value.comments).length;
						lastReplyUser = lastReply.author;

						for (let n = 0; n < replyAmount; n++){
							if (lastReplyUser == Object.values(value.comments)[n].author){
								lastReplyUserId = Object.keys(value.comments)[n];
								break;
							}
						}

						statusImage = getStatusImage(new Date(lastReply.date));
						lastReplyDate = new Date(lastReply.date).toLocaleDateString();
					}
	
					// Adds new row of information to posts
					addRow(y, 
					   author,
					   authorId,
					   title, 
					   replyAmount, 
					   views, 
					   lastReplyDate,
					   lastReplyUser,
					   lastReplyUserId,
					   statusImage,
					   postId
					);
				}
				y++;
			});

			// Add page buttons
			var pages = ``;
			for (let p = 1; p <= totalPetitions / amountOfPosts; p++){
				pages += `<a id="page${p}">${p}</a>`;
			}
			if (pages == ``) { pages = `<a id="page1" href="">1</a>`}
			var containerDiv = document.getElementById("container");
			containerDiv.innerHTML += `<div class="pagination">
                pages: ${pages}
            </div>`;
			// Allow page buttons to be clicked
			for (let p = 1; p <= totalPetitions / amountOfPosts; p++){
				var page = document.getElementById(`page${p}`)
				page.addEventListener("click", function(){
					fetchPosts(query, queryType, ((p-1)*amountOfPosts)+1, amountOfPosts);
				}, false);
			}
		}
		else {
			// No data available
			return;
		}
	}).catch((error) => {
		console.error(error);
	});
}


/**
	* Handles loading data from URL queries and creating search-related events
	* Calls fetchPosts with information passed in the URL
**/
function loadSearch(){
		
	// Store type default query information
	var queryType = "Everything";
	var query = "";
	var url = window.location.href;


	// Allow queries to be parsed
	// Must be in format: .../posts.html?query="query"-by="queryType"
	if (url.includes("posts.html?")){
		if (url.includes("query=") && url.includes("-by=")){
			
			// URL is consistent with format
			const queryString = window.location.search;

			// Parse URL for query information
			query = decodeURI(queryString.split("-")[0].split("query=")[1]);
			queryType = decodeURI(queryString.split("-")[1].split("by=")[1]);
			
			// Fix bad query types:
			if (!["Everything", "Titles", "Descriptions"].includes(queryType)){
				queryType = "Everything";
			}
			
			// If query found, have searchbar and dropdown box store the information
			if (typeof query !== `undefined` && 
				typeof queryType !== `undefined` ) {
					document.getElementById('searchBar').value = query;
					document.getElementById('dropdown').value = queryType;
			}
		}
		else {
			// Query is not in proper format- Bring to 404 page
			console.error(`URL search parameter format mismatch: ${url}`);
			document.location.href = "404.html";
		}
	}
	// Fetch posts
	fetchPosts(query, queryType);
}

loadSearch();