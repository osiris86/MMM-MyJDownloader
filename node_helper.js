/* Magic Mirror
 * Node Helper: MMM-MyJDownloader
 *
 * By Michael Schmidt
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");


const downloads = {
	packagesDone: 4,
	speed: '1.250 kb/s',
	totalBytes: 123555,
	downloadedBytes: 83833,
	runningDownloads: [{
		name: "Dexter New Blood S01E07 German DL 720p WEB h264-OHD",
		totalLinks: 2,
		downloadedLinks: 1,
		totalBytes: 711,
		downloadedBytes: 210,
		speed: '30 kb/s'
	}, {
		name: "Dexter New Blood S01E08 German DL 720p WEB h264-OHD",
		totalLinks: 2,
		downloadedLinks: 0,
		totalBytes: 711,
		downloadedBytes: 10,
		speed: '240 kb/s'
	}, {
		name: "S02E01 KTr94oze74Q65hj8V6l93dyg9bxSJubo7759KOLde6425Be",
		totalLinks: 4,
		downloadedLinks: 0,
		totalBytes: 711,
		downloadedBytes: 0,
		speed: '240 kb/s'
	}, {
		name: "S02E02 LRn02noq55T85ck7K6n39dbr2ieSJhvg4325UOQbb4056k",
		totalLinks: 4,
		downloadedLinks: 0,
		totalBytes: 711,
		downloadedBytes: 0,
		speed: '240 kb/s'
	}],
	packagesWaiting: 10
}

module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		const self = this
		if (notification === "MMM-MyJDownloader-StartInterval") {
			console.log("Working notification system. Notification:", notification, "payload: ", payload);
			setTimeout(function() {
				self.sendSocketNotification('MMM-MyJDownloader-DownloadData', downloads)
			}, 5000)
		}
	},

	// Example function send notification test
	sendNotificationTest: function(payload) {
		this.sendSocketNotification("MMM-MyJDownloader-NOTIFICATION_TEST", payload);
	},

	// this you can create extra routes for your module
	extraRoutes: function() {
		var self = this;
		this.expressApp.get("/MMM-MyJDownloader/extra_route", function(req, res) {
			// call another function
			values = self.anotherFunction();
			res.send(values);
		});
	},

	// Test another function
	anotherFunction: function() {
		return {date: new Date()};
	}
});
