/* global Module */

/* Magic Mirror
 * Module: MMM-MyJDownloader
 *
 * By Michael Schmidt
 * MIT Licensed.
 */

Module.register("MMM-MyJDownloader", {
	defaults: {
		updateInterval: 30000,
		username: '',
		password: '',
		id: ''
	},


	requiresVersion: "2.1.0", // Required version of MagicMirror

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		this.sendSocketNotification("MMM-MyJDownloader-StartInterval", {
			...this.config
		});
	},
	 
	getHeader: function() {
		return "JDownloader@mschmidt"
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function() {
		var self = this;

		var urlApi = "https://jsonplaceholder.typicode.com/posts/1";
		var retry = true;

		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		dataRequest.onreadystatechange = function() {
			console.log(this.readyState);
			if (this.readyState === 4) {
				console.log(this.status);
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		if (this.downloads) {
			return this.getDownloadsDom()
		} else {
			const wrapper = document.createElement('div')
			wrapper.innerHTML = 'LAde'
			return wrapper
		}
		// If this.dataRequest is not empty
		/*if (this.dataRequest) {
			var wrapperDataRequest = document.createElement("div");
			// check format https://jsonplaceholder.typicode.com/posts/1
			wrapperDataRequest.innerHTML = this.dataRequest.title;

			var labelDataRequest = document.createElement("label");
			// Use translate function
			//             this id defined in translations files
			labelDataRequest.innerHTML = this.translate("TITLE");


			wrapper.appendChild(labelDataRequest);
			wrapper.appendChild(wrapperDataRequest);
		}

		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			wrapperDataNotification.innerHTML =  this.translate("UPDATE") + ": " + this.dataNotification.date;

			wrapper.appendChild(wrapperDataNotification);
		}*/
	},

	getDownloadsDom: function() {
		const wrapper = document.createElement('div')
		const totalDownloads = this.getProgressDom('Total', this.downloads.totalBytes, this.downloads.downloadedBytes, this.downloads.speed)
		wrapper.appendChild(totalDownloads)

		wrapper.appendChild(this.createText('Finished Packages: ' + this.downloads.packagesDone))

		for (const download of this.downloads.runningDownloads) {
			const downloadDom = this.getProgressDom(download.name, download.totalBytes, download.downloadedBytes, download.speed, download.totalLinks, download.downloadedLinks)
			wrapper.appendChild(downloadDom)
		}

		wrapper.appendChild(this.createText(this.downloads.packagesWaiting + ' more packages waiting'))

		return wrapper
	},

	createText: function(text) {
		const wrapper = document.createElement('div')
		wrapper.className = 'text'
		wrapper.innerHTML = text
		return wrapper
	},

	getProgressDom: function(titleText, totalBytes, downloadedBytes, speed, totalLinks, downloadedLinks) {
		let wrapper = document.createElement('div')

		let percent = 100 / totalBytes * downloadedBytes

		wrapper.appendChild(this.getProgressHeader(titleText, percent, speed, totalLinks, downloadedLinks))
		wrapper.appendChild(this.getProgressBar(percent))
		return wrapper
	},

	getProgressHeader: function(titleText, percent, speed, totalLinks, downloadedLinks) {
		let headerWrapper = document.createElement('div')
		headerWrapper.className = 'progress-header-wrapper'

		let title = document.createElement('div')
		title.className = 'progress-title'
		if (titleText.length > 30) {
			titleText = titleText.substring(0, 30) + "..."
		}
		title.innerHTML = titleText
		 
		let percentage = document.createElement('div')
		percentage.className = 'progress-percentage'
		percentage.innerHTML = parseFloat(percent).toFixed(2) + '%'

		headerWrapper.appendChild(title)
		headerWrapper.appendChild(percentage)

		if (speed) {
			const speedWrapper = document.createElement('div')
			speedWrapper.innerHTML = speed
			speedWrapper.className = 'progress-speed'
			headerWrapper.appendChild(speedWrapper)
		}

		if (totalLinks) {
			const linksText = downloadedLinks + '/' + totalLinks
			const links = document.createElement('div')
			links.innerHTML = linksText
			links.className = 'progress-links'
			headerWrapper.appendChild(links)
		}

		return headerWrapper
	},

	getProgressBar: function(percent) {
		let progress = document.createElement('div')
		progress.className = 'progress-outer'
		let progressBar = document.createElement('div')
		progressBar.className = 'progress-inner'
		progressBar.style.width = percent + '%'
		progress.appendChild(progressBar)
		return progress
	},

	getScripts: function() {
		return [];
	},

	getStyles: function () {
		return [
			"MMM-MyJDownloader.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-MyJDownloader-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-MyJDownloader-DownloadData") {
			// set dataNotification
			this.downloads = payload;
			this.updateDom();
			console.log(this.downloads)
		}
	},
});
