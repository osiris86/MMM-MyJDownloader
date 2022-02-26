/* Magic Mirror
 * Node Helper: MMM-MyJDownloader
 *
 * By Michael Schmidt
 * MIT Licensed.
 */

const jdownloaderAPI = require('jdownloader-api')
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: async function(notification, payload) {
		if (notification === "MMM-MyJDownloader-StartInterval") {
            console.log('Setting interval')
            this.updateData(payload);
		}
	},

    updateData: async function(payload) {
        console.log('Connecting...')
        await jdownloaderAPI.connect(payload.username, payload.password)
        const devices = await jdownloaderAPI.listDevices()
        for (const device of devices) {
            if (device.name === payload.name) {
                //const packages = await jdownloaderAPI.queryPackages(device.id, '')
                const links = await jdownloaderAPI.queryLinks(device.id)
                console.log('Getting packages')
                const packages = await jdownloaderAPI.queryPackages(device.id, '')
                console.log('Start conversion')
                const pckObj = this.convertToPackagesObject(packages)
                const pckObjWithLinks = this.addLinkInformation(pckObj, links)
                //console.log(singlePackage)
                const runningDownloads = []
                var packagesDone = 0
                var packagesWaiting = 0
                var totalSpeed = 0
                var totalTotalBytes = 0
                var totalDownloadedBytes = 0
                for (const uuid in pckObjWithLinks) {
                    const package = pckObjWithLinks[uuid]
                    totalTotalBytes += package.bytesTotal
                    totalDownloadedBytes += package.bytesLoaded
                    var downloadedLinks = 0
                    var speed = 0
                    var downloadStarted = false
                    for (const link of package.links) {
                        if (link.bytesLoaded > 0) {
                            downloadStarted = true
                        }
                        if (link.finished || link.bytesLoaded >= link.bytesTotal) {
                            downloadedLinks++
                        } else {
                            speed += link.speed
                        }
                    }
                    totalSpeed += speed
                    if (package.links.length !== downloadedLinks && downloadStarted) {
                        var divider = 1000
                        var unit = "KB/s"
                        if (speed > 1000000) {
                            divider = 10000
                            unit = "MB/s"
                        }
                        runningDownloads.push({
                            name: package.name,
                            totalLinks: package.links.length, 
                            downloadedLinks: downloadedLinks,
                            totalBytes: package.bytesTotal,
                            downloadedBytes: package.bytesLoaded,
                            speed: parseFloat(speed/divider).toFixed(2) + " " + unit
                        })
                    } else if (package.links.length === downloadedLinks) {
                        packagesDone++
                    } else {
                        console.log('Anzahl Links: ' + package.links.length)
                        console.log('Downloaded Links: ' + downloadedLinks)
                        console.log('Speed: ' + speed)
                        packagesWaiting++
                    }
                }
                var divider = 1000
                var unit = "KB/s"
                if (speed > 1000000) {
                    divider = 10000
                    unit = "MB/s"
                }
                const downloads = {
                    packagesDone,
                    speed: parseFloat(totalSpeed/divider).toFixed(2) + " " + unit,
                    totalBytes: totalTotalBytes,
                    downloadedBytes: totalDownloadedBytes,
                    runningDownloads,
                    packagesWaiting
                }

                this.sendSocketNotification('MMM-MyJDownloader-DownloadData', downloads)

                const self = this
                setTimeout(function() {
                    self.updateData(payload)
                }, payload.updateInterval)
            }
        }
    },

    convertToPackagesObject: function(packagesArray) {
        const pckObj = {}
        for (const package of packagesArray.data) {
            pckObj[package.uuid] = package
        }
        return pckObj
    },

    addLinkInformation: function(pckObj, links) {
        for (const link of links.data) {
            if (pckObj[link.packageUUID].links) {
                pckObj[link.packageUUID].links.push(link)
            } else {
                pckObj[link.packageUUID].links = [link]
            }
        }
        return pckObj
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
