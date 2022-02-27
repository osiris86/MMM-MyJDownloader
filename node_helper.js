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
            this.updateData(payload);
		}
	},

    updateData: async function(payload) {
        console.log('MMM-MyJDownloader - updating data')
        try {
            await jdownloaderAPI.connect(payload.username, payload.password)
            const devices = await jdownloaderAPI.listDevices()
            for (const device of devices) {
                if (device.name === payload.name) {
                    const links = await jdownloaderAPI.queryLinks(device.id)
                    const packages = await jdownloaderAPI.queryPackages(device.id, '')
                    const pckObj = this.convertToPackagesObject(packages)
                    const pckObjWithLinks = this.addLinkInformation(pckObj, links)
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
                            runningDownloads.push({
                                name: package.name,
                                totalLinks: package.links.length, 
                                downloadedLinks: downloadedLinks,
                                totalBytes: package.bytesTotal,
                                downloadedBytes: package.bytesLoaded,
                                speed: this.convertSpeed(speed)
                            })
                        } else if (package.links.length === downloadedLinks) {
                            packagesDone++
                        } else {
                            packagesWaiting++
                        }
                    }
                    
                    const downloads = {
                        packagesDone,
                        speed: this.convertSpeed(totalSpeed),
                        totalBytes: totalTotalBytes,
                        downloadedBytes: totalDownloadedBytes,
                        runningDownloads,
                        packagesWaiting
                    }

                    console.log('MMM-MyJDownloader - data loaded')
                    this.sendSocketNotification('MMM-MyJDownloader-DownloadData', downloads)
                }
            }
        } catch (e) {
            console.log('MMM-MyJDownloader - data could not be loaded. This happens sometimes')
        }

        const self = this
        setTimeout(function() {
            self.updateData(payload)
        }, payload.updateInterval)
    },

    convertSpeed: function(speed) {
        var divider = 1000
        var unit = "KB/s"
        if (speed > 1000000) {
            divider = 10000
            unit = "MB/s"
        }
        return parseFloat(speed/divider).toFixed(2) + " " + unit
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
});
