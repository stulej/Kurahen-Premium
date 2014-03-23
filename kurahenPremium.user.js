// ==UserScript==
// @name        Kurahen Premium
// @namespace   karachan.org
// @description Zestaw dodatkowych opcji dla forum młodzieżowo-katolickiego
// @version     1.0
// @include     http://www.karachan.org/*
// @include     http://karachan.org/*
// @exclude     http://www.karachan.org/*/src/*
// @exclude     http://karachan.org/*/src/*
// ==/UserScript==

(function () {
	'use strict';

	// Konfiguracja
	var customBBoardTitle = '/b/ - Random';
	var enableBetterFonts = true; // Podmienia domyślne czcionki na Roboto

	// Zaawansowana konfiguracja
	var bbCodes = ['b', 'i', 'u', 's', 'small', 'code', 'spoiler'];
	var wordfilters = [
		['#nowocioty', 'STAROCIOTY PAMIĘTAJĄ'],
		['#gimbo', 'xD'],
		['#penis', 'pisiorek'],
		['#wagina', 'cipuszka'],
		['#m__b', 'groźny WYKOPEK wykryty'],
		['#Lasoupeauxchoux', 'kapuśniaczek'],
		['#homoś', 'pedał'],
		['#korwinkrulempolski', 'kongres nowej prawicy'],
		['#1%', 'groźny LEWAK wykryty']
	];
	var boardsWithId = ['b', 'fz', 'z'];
	var colors = [
		'#FF8080',
		'#FFDD80',
		'#80FFB7',
		'#80D0FF',
		'#C680FF',
		'#FFAE80',
		'#D5FF80',
		'#80FFFD',
		'#8097FF',
		'#FF80CA',
		"#ff7f7f",
		"#779aef",
		"#b0de6f",
		"#cc66c0",
		"#5cb9a9",
		"#f3bb79",
		"#8d71e2",
		"#6dd168",
		"#be5f7e",
		"#7bc8f6"
	];

	var KurahenPremium = function () {
		var currentBoardName = this.getCurrentBoardName();

		if (currentBoardName === '') {
			return; // We are not on any useful page
		} else if (currentBoardName === 'b') {
			this.changeBoardTitle(customBBoardTitle);
		}
		this.updatePageTitle();
		this.disableNightStyle();
		this.setCookie('regulamin', 'accepted');
		this.insertButtonBar();
		this.replaceEmailFieldWithSelect();
		this.showAllPostersEmails();
		this.fixAllExternalLinks();

		if (boardsWithId.indexOf(currentBoardName) > -1 && this.isCurrentWebpageThread()) {
			this.colorizeAndNamePosters();
		}

		if (enableBetterFonts) {
			this.changeFonts();
		}

		this.threadsWatcher = new ThreadsWatcher();
	};

	KurahenPremium.prototype.changeBoardTitle = function (newTitle) {
		document.title = newTitle;
		document.getElementsByClassName('boardTitle')[0].textContent = newTitle;
	};

	KurahenPremium.prototype.updatePageTitle = function () {
		var page = parseInt(window.location.pathname.split('/')[2]);
		var prefix = '';

		if (this.isCurrentWebpageThread()) {
			prefix = this.getTopicFromFirstPostContent();
		} else if (!isNaN(page)) {
			prefix = 'Strona ' + page;
		}

		if (prefix.length > 0) {
			prefix += ' - ';
		}

		document.title = prefix + document.title;
	};

	KurahenPremium.prototype.setCookie = function (name, value) {
		document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + '; path=/; max-age=2592000';
	};

	KurahenPremium.prototype.changeFonts = function () {
		var newLink = document.createElement('link');
		newLink.href = '//fonts.googleapis.com/css?family=Roboto:400,700&subset=latin,latin-ext';
		newLink.rel = 'stylesheet';
		var existingLink = document.getElementsByTagName('link')[0];
		existingLink.parentNode.insertBefore(newLink, existingLink);
		document.body.style.fontFamily = 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif';
	};

	KurahenPremium.prototype.getCurrentBoardName = function () {
		return window.location.pathname.split('/')[1];
	};

	KurahenPremium.prototype.isCurrentWebpageThread = function () {
		return window.location.pathname.split('/')[2] === 'res';
	};

	KurahenPremium.prototype.getTopicFromFirstPostContent = function () {
		var postMessage = document.querySelector('.thread .postMessage').cloneNode(true);

		var backlinks = postMessage.getElementsByClassName('backlink');
		if (backlinks.length > 0) {
			postMessage.removeChild(backlinks[0]);
		}

		var links = postMessage.getElementsByClassName('postlink');
		for (var i = 0; i < links.length; i++) {
			postMessage.removeChild(links[i]);
		}

		var quoteLinks = postMessage.getElementsByClassName('quotelink');
		for (var j = 0; j < quoteLinks.length; j++) {
			postMessage.removeChild(quoteLinks[i]);
		}

		var postContent = postMessage.textContent;
		return postContent.substr(0, Math.min(postContent.length, 70));
	};

	KurahenPremium.prototype.disableNightStyle = function () {
		var option = document.querySelector('#stylechanger option[value$="night.css"]');
		option.disabled = true;
	};

	KurahenPremium.prototype.replaceEmailFieldWithSelect = function () {
		var emailField = document.querySelector('#postform input[name="email"]');

		var select = document.createElement('select');
		select.name = 'email';
		select.style.margin = '0';
		select.style.width = '236px';
		select.addEventListener('change', function () {
			//noinspection JSPotentiallyInvalidUsageOfThis
			if (this.options[this.selectedIndex].value === 'custom') {
				var textField = document.createElement('input');
				textField.type = 'text';
				textField.className = 'board-input';
				textField.name = 'email';
				select.parentNode.replaceChild(textField, select);
				textField.focus();
			}
		}, false);

		var optionBump = document.createElement('option');
		optionBump.value = '';
		optionBump.selected = true;
		optionBump.textContent = 'Podbij';
		select.appendChild(optionBump);

		var optionSage = document.createElement('option');
		optionSage.value = 'sage';
		optionSage.textContent = 'Saguj';
		select.appendChild(optionSage);

		var optionSpoiler = document.createElement('option');
		optionSpoiler.value = 'spoiler';
		optionSpoiler.textContent = 'Ukryj obrazek';
		select.appendChild(optionSpoiler);

		var optionCustom = document.createElement('option');
		optionCustom.value = 'custom';
		optionCustom.textContent = 'Wpisz własny...';
		select.appendChild(optionCustom);

		emailField.parentNode.replaceChild(select, emailField);
	};

	KurahenPremium.prototype.showAllPostersEmails = function () {
		var postersEmails = document.getElementsByClassName('useremail');

		for (var i = 0; i < postersEmails.length; i++) {
			postersEmails[i].textContent += ' (' + this.parseMailto(postersEmails[i].getAttribute('href')) + ') ';
			postersEmails[i].removeAttribute('href');
		}
	};

	KurahenPremium.prototype.fixAllExternalLinks = function () {
		var links = document.getElementsByClassName('postlink');
		for (var i = 0; i < links.length; i++) {
			links[i].setAttribute('href', links[i].getAttribute('href').replace('https://href.li/?', ''));
			links[i].setAttribute('target', '_blank');
			links[i].setAttribute('rel', 'noreferrer');
		}

		this.inlineVideoAndAudioLinks(links);
	};

	/**
	 * @private
	 */
	KurahenPremium.prototype.parseMailto = function (mailto) {
		return mailto.replace('mailto:', '');
	};

	/**
	 * @private
	 */
	KurahenPremium.prototype.inlineVideoAndAudioLinks = function (links) {
		for (var i = 0; i < links.length; i++) {
			var url = links[i].getAttribute('href');

			if (url.indexOf('youtu') > -1) {
				var urlParameters = url.match(/^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/);
				if (urlParameters === null || urlParameters.length !== 2) {
					continue;
				}

				var youtubeContainer = document.createElement('div');
				youtubeContainer.innerHTML = '<iframe width="560" height="315" src="//www.youtube.com/embed/' +
					urlParameters[1] + '" frameborder="0" allowfullscreen></iframe>';

				if (links[i].nextSibling) {
					links[i].parentNode.insertBefore(youtubeContainer, links[i].nextSibling);
				} else {
					links[i].parentNode.appendChild(youtubeContainer);
				}
				links[i].style.display = 'none';
			} else if (url.indexOf('http://vocaroo.com') > -1) {
				var vocarooId = url.substr(url.length - 12, 12);

				var vocarooContainer = document.createElement('div');
				vocarooContainer.innerHTML = '<embed src="http://vocaroo.com/player.swf?playMediaID=' + vocarooId +
					'&autoplay=0" width="148" height="44" wmode="transparent" type="application/x-shockwave-flash"></embed>';

				if (links[i].nextSibling) {
					links[i].parentNode.insertBefore(vocarooContainer, links[i].nextSibling);
				} else {
					links[i].parentNode.appendChild(vocarooContainer);
				}
				links[i].style.display = 'none';
			}
		}
	};

	KurahenPremium.prototype.colorizeAndNamePosters = function () {
		var postersIds = document.getElementsByClassName("posteruid");
		var postersStats = {};

		var opId;
		for (var i = 0; i < postersIds.length; i++) {
			var posterId = this.parsePosterId(postersIds[i].textContent);
			if (i === 0) {
				opId = posterId;
			}

			postersIds[i].className += ' poster-id-' + posterId;
			if (posterId === opId) {
				postersIds[i].textContent = '\u00a0OP nitki';
			} else {
				postersIds[i].textContent = '\u00a0' + posterId;
			}

			if (isNaN(postersStats[posterId])) {
				postersStats[posterId] = 1;
			} else {
				postersStats[posterId]++;
			}
		}

		var style = document.createElement('style');
		style.type = 'text/css';
		for (var id in postersStats) {
			if (postersStats.hasOwnProperty(id) && postersStats[id] > 1) {
				style.textContent += '.poster-id-' + id + '{color:#000;background-color: ' + this.getNextColor() + ';}';
				style.textContent += '.poster-id-' + id + ':after{content:" (' + postersStats[id] + ' postów)\u00a0"}';
			}
		}
		document.getElementsByTagName('head')[0].appendChild(style);

		var firstPostBar = document.querySelector('.opContainer .postInfo');
		firstPostBar.innerHTML += ' (' + postersIds.length + ' postów od ' + Object.keys(postersStats).length +
			' anonów)';
	};

	/**
	 * @private
	 */
	KurahenPremium.prototype.getNextColor = function () {
		if (colors.length > 0) {
			return colors.shift();
		} else {
			return '#' + Math.random().toString(16).substr(-6); // Random color
		}
	};

	/**
	 * @private
	 */
	KurahenPremium.prototype.parsePosterId = function (text) {
		return text.trim().substr(5, 8).replace(/[\.|\/|\+|\-]/g, '_');
	};

	KurahenPremium.prototype.insertButtonBar = function () {
		var postForm = document.getElementById('postform');
		var textarea = document.querySelector("#postform textarea");
		var buttonBar = document.createElement('div');
		buttonBar.style.textAlign = 'center';

		this.insertTextFormattingButtons(textarea, buttonBar);
		this.insertWordfilterList(textarea, buttonBar);

		postForm.insertBefore(buttonBar, postForm.firstChild);
	};

	/**
	 * @private
	 */
	KurahenPremium.prototype.insertTextFormattingButtons = function (textarea, buttonBar) {
		var onButtonClick = function () {
			var startTag = '[' + this.value + ']';
			var endTag = '[/' + this.value + ']';

			var textBeforeSelection = textarea.value.substring(0, textarea.selectionStart);
			var selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
			var textAfterSelection = textarea.value.substring(textarea.selectionEnd, textarea.value.length);

			textarea.value = textBeforeSelection + startTag + selectedText + endTag + textAfterSelection;

			textarea.focus();
			textarea.selectionStart += startTag.length;
			textarea.selectionEnd = textarea.selectionStart + selectedText.length;
		};

		for (var i = 0; i < bbCodes.length; i++) {
			var button = document.createElement('input');
			button.type = 'button';
			button.value = bbCodes[i];
			button.addEventListener('click', onButtonClick, false);
			buttonBar.appendChild(button);
		}
	};

	/**
	 * @private
	 */
	KurahenPremium.prototype.insertWordfilterList = function (textarea, buttonBar) {
		var wordfiltersSelect = document.createElement('select');

		var defaultOption = document.createElement('option');
		defaultOption.value = '';
		defaultOption.disabled = true;
		defaultOption.selected = true;
		defaultOption.textContent = 'WORDFILTRY';
		wordfiltersSelect.appendChild(defaultOption);

		wordfiltersSelect.addEventListener('change', function () {
			//noinspection JSPotentiallyInvalidUsageOfThis
			var textToInsert = this.options[this.selectedIndex].value;
			var textBeforeEndOfSelection = textarea.value.substring(0, textarea.selectionEnd);
			var textAfterEndOfSelection = textarea.value.substring(textarea.selectionEnd, textarea.value.length);

			textarea.value = textBeforeEndOfSelection + textToInsert + textAfterEndOfSelection;

			textarea.focus();
			textarea.selectionStart = textBeforeEndOfSelection.length + textToInsert.length;
			textarea.selectionEnd = textarea.selectionStart;

			//noinspection JSPotentiallyInvalidUsageOfThis
			this.selectedIndex = 0;
		}, false);

		for (var j = 0; j < wordfilters.length; j++) {
			var option = document.createElement('option');
			option.value = wordfilters[j][0];
			option.textContent = wordfilters[j][1];
			wordfiltersSelect.appendChild(option);
		}

		buttonBar.appendChild(wordfiltersSelect);
	};

	var ThreadsWatcher = function () {
		this.loadWatchedThreads();
		this.insertThreadsListWindow();
		this.addWatchButtonsToPosts();
	};

	ThreadsWatcher.prototype.loadWatchedThreads = function () {
		var item = localStorage.getItem('KurahenPremium_WatchedThreads');
		if (item === null) {
			this.watchedThreads = [];
		} else {
			this.watchedThreads = JSON.parse(item);
		}
	};

	ThreadsWatcher.prototype.saveWatchedThreads = function () {
		localStorage.setItem('KurahenPremium_WatchedThreads', JSON.stringify(this.watchedThreads));
	};

	ThreadsWatcher.prototype.getThreadObject = function (postId) {
		return this.watchedThreads[postId];
	};

	ThreadsWatcher.prototype.threadObjectExists = function (postId) {
		return typeof this.watchedThreads[postId] === 'object';
	};

	ThreadsWatcher.prototype.threadsSize = function () {
		return this.watchedThreads.length;
	};

	ThreadsWatcher.prototype.getWatchedThreadsArray = function () {
		return this.watchedThreads;
	};

	ThreadsWatcher.prototype.insertThreadsListWindow = function () {
		this.threadsListWindow = document.createElement('div');
		this.threadsListWindow.id = 'watcher_box';
		this.threadsListWindow.className = 'movable';
		this.threadsListWindow.style.height = 'auto';
		this.threadsListWindow.style.minHeight = '100px';
		this.threadsListWindow.style.top = '35px';
		this.threadsListWindow.style.left = '4px';

		this.threadsHtmlList = document.createElement('ul');
		this.threadsHtmlList.id = 'watched_list';
		this.threadsListWindow.appendChild(this.threadsHtmlList);

		var threads = this.getWatchedThreadsArray();
		for (var item in threads) {
			if (threads.hasOwnProperty(item)) {
				this.addThreadListWindowEntry(threads[item].id, threads[item].boardName, threads[item].id, -1);
			}
		}

		document.body.appendChild(this.threadsListWindow);
	};

	KurahenPremium.prototype.addThreadListWindowEntry = function (id, boardName, lastReadPostId, unreadPostsNumber) {
		var entry = document.createElement('li');
		entry.id = 'wl_' + boardName + '_' + id;

		var link = document.createElement('a');
		link.href = '/' + boardName + '/res/' + id + '.html#p' + lastReadPostId;
		entry.appendChild(link);

		var unreadPostsSpan = document.createElement('span');
		unreadPostsSpan.className = 'unreadPostsNumber';
		unreadPostsSpan.textContent = '[' + (unreadPostsNumber >= 0 ? unreadPostsNumber : 'Ładowanie...') + '] ';
		link.appendChild(unreadPostsSpan);

		var linkTextSpan = document.createElement('span');
		linkTextSpan.textContent = '>>/' + boardName + '/' + id;
		link.appendChild(linkTextSpan);

		this.threadsHtmlList.appendChild(entry);
	};

	KurahenPremium.prototype.updateThreadListWindowEntry = function (id, boardName, lastReadPostId, unreadPostsNumber) {
		var entry = document.getElementById('wl_' + boardName + '_' + id);
		if (entry === null) {
			this.addThreadListWindowEntry(id, boardName, lastReadPostId, unreadPostsNumber);
			return;
		}

		var link = entry.querySelector('a');
		link.href = '/' + boardName + '/res/' + id + '.html#p' + lastReadPostId;

		var unreadPostsSpan = link.querySelector('.unreadPostsNumber');
		unreadPostsSpan.textContent = '[' + (unreadPostsNumber >= 0 ? unreadPostsNumber : 'Ładowanie...') + '] ';
	};

	KurahenPremium.prototype.removeThreadListWindowEntry = function (id, boardName) {
		var entry = document.getElementById('wl_' + boardName + '_' + id);
		if (entry === null) {
			return;
		}
		this.threadsHtmlList.removeChild(entry);
	};

	ThreadsWatcher.prototype.addWatchButtonsToPosts = function () {
		var postsBars = document.querySelectorAll('.opContainer .postInfo');
		for (var i = 0; i < postsBars.length; i++) {
			var postId = this.parsePostId(postsBars[i]);
			var watchButton = document.createElement('a');
			watchButton.style.cursor = 'pointer';
			watchButton.setAttribute('data-post-id', postId);

			var self = this;
			watchButton.addEventListener('click', function () {
				self.addRemoveWatchedThread(parseInt(this.getAttribute('data-post-id')));
			}, false);

			if (this.threadObjectExists(postId)) {
				watchButton.innerText = ' Nie obserwuj';
			} else {
				watchButton.innerText = ' Obserwuj';
			}

			postsBars[i].appendChild(watchButton);
		}
	};

	ThreadsWatcher.prototype.addRemoveWatchedThread = function (postId) {
		// Add new thread to watchlist
		if (this.threadObjectExists(postId)) {
			// TODO
		} else { // Remove existing thread from watchlist
			// TODO
		}

		this.saveWatchedThreads();
	};

	ThreadsWatcher.prototype.getNumberOfNewPosts = function (boardName, threadId, lastPostId, callback) {
		var request = new XMLHttpRequest();
		request.responseType = 'document';
		request.open('GET', 'http://karachan.org/' + boardName + '/res/' + threadId + '.html', true);
		request.onload = function () {
			// On error
			if (request.status !== 200) {
				callback(boardName, threadId, -1, request.status);
				return;
			}

			// On success
			var postsContainers = request.response.getElementsByClassName('postContainer');
			var numberOfNewPosts = 0;
			for (var i = 0; i < postsContainers.length; i++) {
				//noinspection JSPotentiallyInvalidUsageOfThis
				if (this.parsePostId(postsContainers[i]) === lastPostId) {
					numberOfNewPosts = postsContainers.length - 1 - i;
					break;
				}
			}
			callback(boardName, threadId, numberOfNewPosts, 200);
		};
		request.send();
	};

	/**
	 * @private
	 */
	ThreadsWatcher.prototype.parsePostId = function (htmlElement) {
		return parseInt(htmlElement.id.substr(2));
	};

	// Initialize script
	window.KurahenPremium = new KurahenPremium();
})();
