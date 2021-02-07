var url = window.location.href
var site

// initialize vars according to the site
if (url.indexOf('anime-update') >= 0) {
  site = "Anime Update"
  let fullName = document.getElementsByClassName("page_title")[1].innerHTML
  // Values for OVAs and Movies
  var episode = ""
  var episodeNum=""
  var title = fullName
  // Values for an episode of a series
  if (fullName.indexOf('Episode') >= 0) {
    episode = fullName.substring(fullName.indexOf('Episode'), fullName.length)
    episodeNum = fullName.substring(fullName.indexOf('Episode ')+8, fullName.length)
    title = fullName.substring(0, fullName.indexOf('Episode') - 1)
  }

  //console.log("Anime update tracker active")

  let baseURL = 'https://anime-update.com/watch-online/'

  // for some reason hunter x hunter doesn't follow this pattern
  if (fullName.indexOf('Hunter x Hunter') >= 0)
    fullName = fullName.replace('Episode ', '');

  // - in titles causes formatting error
  if (fullName.indexOf('-') >=0)
    fullName = fullName.replace(' - ',' ')

  /* Generate url from fullName */

  fullName = fullName.toLowerCase()
  // remove all special characters
  fullName = fullName.replace(/[^a-zA-Z0-9 ]/g, '')
  // replace ' '  with '-'
  fullName = fullName.replace(/ /g, '-')
  // remove trailing '-'
  url = baseURL + fullName.substring(0, fullName.length - 1)

  // next and previous buttons
  let nextButton = document.querySelector('.glyphicon.glyphicon-arrow-right')
  let previousButton = document.querySelector('.glyphicon.glyphicon-arrow-left')
  nextButton = nextButton != undefined ? nextButton.parentElement : nextButton
  previousButton = previousButton != undefined ? previousButton.parentElement : previousButton
  var toTrackButtons = [nextButton, previousButton]
}
else if (url.indexOf('4anime') >= 0) {
  site = "4anime"
  var title = document.querySelector(".singletitletop a").innerHTML
  var episode = document.querySelectorAll('#titleleft')[1].innerHTML

  //console.log("4anime tracker active")

  // two next and previous buttons for mobile/desktop
  let nextButtons = document.querySelectorAll('.anipager-next a')
  let previousButtons = document.querySelectorAll('.anipager-prev a')
  let episodeButtons = document.querySelectorAll('.episodes li a')
  var toTrackButtons = [...nextButtons, ...previousButtons, ...episodeButtons]
}

// common vars
var time = "00:00"
var totalTime = "00:00"

// check if next episode buttons exists
if (toTrackButtons != undefined) {
  // add an event listener to each button which triggers the nextEpisode event
  for (button of toTrackButtons) {
    if (button != undefined) {
      button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'nextEpisode' }, (response) => { });
      }, false)
    }
  }
}

/**
 * Removes value from arr
 * @param {array} arr The array to remove from
 * @param {string} value The value of the element to be removed
 * @returns {array} The array with value removed
 */
function remover(arr, value) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === value) {
      arr.splice(i, 1)
      //console.log("removed")
    }
  }
  return arr
}

/**
 * Extracts time and totalTime values from a video player with name of videoPlayer
 * 
 * @param {string} videoPlayer The name of the video player 
 */
function setTime(videoPlayer) {
  let timeElement
  let totalTimeElement

  if (videoPlayer == "Video") {
    timeElement = ".plyr__controls__item.plyr__time--current.plyr__time"
    totalTimeElement = ".plyr__controls__item.plyr__time--duration.plyr__time"
  }
  // Other video players wont work because they are iframes
  // Can't get DOM elements of cross-domain iframe
  else if (videoPlayer == "MX") {
    timeElement = ".vjs-current-time-display"
    totalTimeElement = ".vjs-duration-display"
  }
  else if (videoPlayer == "VCDN" || videoPlayer == "Viz") {
    timeElement = ".jw-icon.jw-icon-inline.jw-text.jw-reset.jw-text-elapsed"
    totalTimeElement = ".jw-icon.jw-icon-inline.jw-text.jw-reset.jw-text-duration"

  }
  time = document.querySelector(timeElement).innerHTML
  totalTime = document.querySelector(totalTimeElement).innerHTML

}
/**
 * Gets the link to the next episode if it exists
 * 
 * @returns {string} The next episode link. if link does not exist, then "" is returned
 */
function getNextEpisodeLink(){
  let nextEpisodeLink = ""
  if(site == 'Anime Update'){
    let linkButtons = document.querySelectorAll('.btn-group a')
    // the next episode button is the third one
    nextEpisodeLink = linkButtons.length == 3? linkButtons[2].href : ""
    if(linkButtons.length>1){
      for(let i=0;i<linkButtons.length;i++){
        if(linkButtons[i].href.indexOf("https://anime-update.com/watch-online/")>=0){
          url = linkButtons[i].href.substring(0,linkButtons[i].href.lastIndexOf('-')+1) + episodeNum;
          break;
        }
      }
    }
  }
  else if(site == '4anime'){
    if(document.querySelector('.anipager-next a') != undefined)
      nextEpisodeLink = document.querySelector('.anipager-next a').href
  }
  return nextEpisodeLink
}

var isMALUpdated = false
var isMALComplete = false
var malUpdateStatus =""

function formatTime(s){
  let m = Math.floor(s/ 60);
  m = (m >= 10) ? m : "0" + m;
  s = Math.floor(s % 60);
  s = (s >= 10) ? s : "0" + s;
  return m + ":" + s;
}

setInterval(async function () {
  let videoElement=""
  

  // get time from video players
  if (site == 'Anime Update') {
    let videoPlayer = document.querySelector(".nav.nav-tabs.hometab .active a").innerHTML
    //console.log("time " + videoPlayer)
    videoElement = document.querySelector('video')
    // sets time and totalTime from video player data 
    setTime(videoPlayer)

  }
  else if (site == '4anime') {
    // set video element
    videoElement = document.querySelector('#example_video_1_html5_api')
    time = formatTime(videoElement.currentTime);
    totalTime = formatTime(videoElement.duration);
    
  }
  // calculate progress
  // -1 means duration is 0
  let progress = videoElement.duration != 0 ? videoElement.currentTime / videoElement.duration : -1

  let toStore
  var toStoreLW = []
  // get next episode link
  let nextEpisodeLink = getNextEpisodeLink()

  // store current episode in storage
  toStore = { "episode": episode, "time": time, "totalTime": totalTime, "url": url, "site": site, "nextEpisodeLink":nextEpisodeLink }
  chrome.storage.local.set({ [title]: toStore }, function () {
    //console.log('added ' + title + " " + episode + " " + time + "/" + totalTime)
  });
  
  // update last watched
  chrome.storage.local.get(['lastWatched'], function (result) {
    if(title){
      if (result['lastWatched'] == undefined) {
        toStoreLW.push(title)
      }
      else {
        // remove existing series entry
        remover(result['lastWatched'], title)
        // insert new series to end of array
        result['lastWatched'].push(title)
        toStoreLW = result['lastWatched']
      }
    
      chrome.storage.local.set({ ['lastWatched']: toStoreLW }, function () {
        console.log('last watched ' + title + " " + episode + " " + time + "/" + totalTime)
        // connect to port info
        let port = chrome.runtime.connect({ name: "info" });

        // pass data for popup.js to display
        port.postMessage({ title: title, episode: episode, time: time, totalTime: totalTime, site: site, malUpdateStatus: malUpdateStatus, action: 'tracking' });
        port.onMessage.addListener(function (msg) { });
      });
  }
  });

  // check if user is logged in
  chrome.storage.local.get(['userAuthCode'], function (result) {
    if(result['userAuthCode']!=undefined){
      // each injection can only update user's MAl once
      // each time a new episode is loaded a new foregroundjs is injected
      if(!isMALUpdated){
        isMALUpdated = true
        chrome.runtime.sendMessage({ action: 'UpdateMAL',title:title,  episode: episode , isComplete:false },
          function (response) {
            malUpdateStatus = response.action
          });
      }
      else if(isMALUpdated && !isMALComplete && progress>0.9){
        isMALComplete = true
        chrome.runtime.sendMessage({ action: 'UpdateMAL',title:title,  episode: episode , isComplete:true },
          function (response) {
            malUpdateStatus = response.action
          });
      }
    }
  });


  

},5 * 1000);







