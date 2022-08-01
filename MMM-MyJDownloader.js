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
    username: "",
    password: "",
    name: ""
  },

  requiresVersion: "2.1.0", // Required version of MagicMirror

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function () {
    this.sendSocketNotification("MMM-MyJDownloader-StartInterval", {
      ...this.config
    });
  },

  getHeader: function () {
    return this.config.name;
  },

  getDom: function () {
    console.log(this.downloads);
    if (this.downloads) {
      return this.getDownloadsDom();
    } else {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = this.translate("LOADING");
      return wrapper;
    }
  },

  getDownloadsDom: function () {
    const wrapper = document.createElement("div");
    const totalDownloads = this.getProgressDom(
      this.translate("TOTAL"),
      this.downloads.totalBytes,
      this.downloads.downloadedBytes,
      this.downloads.speed
    );
    wrapper.appendChild(totalDownloads);

    wrapper.appendChild(
      this.createText(this.translate("FINISHED") + this.downloads.packagesDone)
    );

    for (const download of this.downloads.runningDownloads) {
      const downloadDom = this.getProgressDom(
        download.name,
        download.totalBytes,
        download.downloadedBytes,
        download.speed,
        download.totalLinks,
        download.downloadedLinks
      );
      wrapper.appendChild(downloadDom);
    }

    wrapper.appendChild(
      this.createText(
        this.translate("WAITING", { packages: this.downloads.packagesWaiting })
      )
    );

    return wrapper;
  },

  createText: function (text) {
    const wrapper = document.createElement("div");
    wrapper.className = "text xsmall";
    wrapper.innerHTML = text;
    return wrapper;
  },

  getProgressDom: function (
    titleText,
    totalBytes,
    downloadedBytes,
    speed,
    totalLinks,
    downloadedLinks
  ) {
    let wrapper = document.createElement("div");

    let percent = (100 / totalBytes) * downloadedBytes;

    wrapper.appendChild(
      this.getProgressHeader(
        titleText,
        percent,
        speed,
        totalLinks,
        downloadedLinks
      )
    );
    wrapper.appendChild(this.getProgressBar(percent));
    return wrapper;
  },

  getProgressHeader: function (
    titleText,
    percent,
    speed,
    totalLinks,
    downloadedLinks
  ) {
    let headerWrapper = document.createElement("div");
    headerWrapper.className = "progress-header-wrapper";

    let title = document.createElement("div");
    title.className = "progress-title xsmall";
    if (titleText.length > 30) {
      titleText = titleText.substring(0, 30) + "...";
    }
    title.innerHTML = titleText;

    let percentage = document.createElement("div");
    percentage.className = "progress-percentage xsmall";
    percentage.innerHTML = parseFloat(percent).toFixed(2) + "%";

    headerWrapper.appendChild(title);
    headerWrapper.appendChild(percentage);

    if (speed) {
      const speedWrapper = document.createElement("div");
      speedWrapper.innerHTML = speed;
      speedWrapper.className = "progress-speed xsmall";
      headerWrapper.appendChild(speedWrapper);
    }

    if (totalLinks) {
      const linksText = downloadedLinks + "/" + totalLinks;
      const links = document.createElement("div");
      links.innerHTML = linksText;
      links.className = "progress-links xsmall";
      headerWrapper.appendChild(links);
    }

    return headerWrapper;
  },

  getProgressBar: function (percent) {
    let progress = document.createElement("div");
    progress.className = "progress-outer";
    let progressBar = document.createElement("div");
    progressBar.className = "progress-inner";
    progressBar.style.width = percent + "%";
    progress.appendChild(progressBar);
    return progress;
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return ["MMM-MyJDownloader.css"];
  },

  getTranslations: function () {
    return {
      en: "translations/en.json",
      de: "translations/de.json"
    };
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM-MyJDownloader-DownloadData") {
      this.downloads = payload;
      if (
        this.downloads.runningDownloads.length === 0 &&
        this.downloads.packagesDone === 0 &&
        this.downloads.packagesWaiting === 0
      ) {
        this.hide();
      } else {
        this.show();
      }
      this.updateDom();
    }
  }
});
