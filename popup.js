var lastWatched
var allData
var index
var showHelp = false
var isBrowsing = false
var isDarkModeOn = false;
var isLoading = false;
var isTracking =false;
var currWatching = ''
var broadcastTimes = {}
var artwork = {}
var malIDs = {}

// popup alerts
chrome.storage.local.get(['seenUpdate'],function(result){
  if(!result['seenUpdate']){
    confirm("4anime tracking issue has been fixed. Data will be synced with chrome every minute. Click the cloud button to manually sync")
    chrome.storage.local.set({'seenUpdate':true})
  }

})

// Generate dates
var days = {}
days['Mondays'] = new Date(2020, 10, 09, 0, 0, 0, 0)
days['Tuesdays'] = new Date(2020, 10, 10, 0, 0, 0, 0)
days['Wednesdays'] = new Date(2020, 10, 11, 0, 0, 0, 0)
days['Thursdays'] = new Date(2020, 10, 12, 0, 0, 0, 0)
days['Fridays'] = new Date(2020, 10, 13, 0, 0, 0, 0)
days['Saturdays'] = new Date(2020, 10, 14, 0, 0, 0, 0)
days['Sundays'] = new Date(2020, 10, 15, 0, 0, 0, 0)

var scheduleElement = document.getElementById("schedule")
var artworkElement = document.getElementById("artwork")
var helpText = document.getElementsByClassName("helpText")

chrome.storage.sync.get(null, function (result) {
  console.log(result)
});

/**
 * Gets lastWatched and episode data from storage
 */
async function getDataFromStorage() {
  await chrome.storage.local.get(null, function (result) {
    if (result != {}) {
      allData = result
      if (result['lastWatched'] != undefined) {
        lastWatched = allData['lastWatched']
        index = lastWatched.length - 1
        updateBroadcastTimes()
      }
    }
  });
}

getDataFromStorage()

function toggleLoadingAnimation(){
  isLoading =! isLoading;
  if(isLoading)
  {
    // clear image and lastWatchedSide
    document.querySelector('#artwork').style.display = "none";
    document.querySelector('#lastWatchedContent').style.display = "none";
    document.querySelector(".circleLoader").style.display = "block";
    document.querySelector(".preloadTextAnimation").style.display="block"

  }
  else{
    // hide loading animation and show image + lastWatchedSide
    document.querySelector(".circleLoader").style.display = "none";
    document.querySelector(".preloadTextAnimation").style.display="none"
    document.querySelector('#artwork').style.display = "block";
    document.querySelector('#lastWatchedContent').style.display = "block";
  }


}

/**
 * Updates or creates the broadcastTimes object by fetching from API
 * Invokes updateDOM() to update "Last Watched" DOM
 * 
 *  @param {boolean} isDelete optional parameter which indicates if user clicked delete
 */
async function updateBroadcastTimes(isDelete = false) {

  // refresh DOM if all items are deleted
  if (isDelete && index < 0) {
    location.reload()
  }
  if (lastWatched.length > 0) {
    // set loading animation
    if(!isTracking)
      toggleLoadingAnimation()

    let queryName = lastWatched[index]
    // replace spaces with %20
    queryName.replace(" ", "%20")

    // Get malId and artwork for anime by searching by name
    // limit results to 1
    let res = await fetch(`https://api.jikan.moe/v3/search/anime?q=${queryName}&limit1`)
    let data = await res.json()

    // should only be one result
    let resultObj = data.results[0]
    // store malid
    malIDs[lastWatched[index]] = resultObj.mal_id
    // store image url 
    artwork[lastWatched[index]] = resultObj.image_url

    // get broadcast date
    res = await fetch(`https://api.jikan.moe/v3/anime/${malIDs[lastWatched[index]]}`)
    data = await res.json()

    // check if its airing
    if (data.airing) {
      // convert JST to local time and store in broadcastTimes
      broadcastTimes[lastWatched[index]] = convertJST(data['broadcast'])
    }
    // completed series
    else {
      // should be null since series is completed
      broadcastTimes[lastWatched[index]] = null
      scheduleElement.innerHTML = null
    }
  }
  // update DOM with new data
  updateDOM()
}

/**
 * Returns JST broadcast time to converted to local time as a string
 * Input string timeStr and output string are follow the format below
 * [day of week] at XX:XX [AM/PM]
 * 
 * @param {string} timeStr string representing JST broadcast time
 */
function convertJST(timeStr) {

  // parse TimeStr
  let hour = timeStr.substring(timeStr.indexOf(':') - 2, timeStr.indexOf(':'))
  let min = timeStr.substring(timeStr.indexOf(':') + 1, timeStr.indexOf(':') + 3)
  let day = timeStr.substring(0, timeStr.indexOf(' at '))
  hour = parseInt(hour)
  min = parseInt(min)

  // get user's timezone offset
  let tempDate = new Date()
  let offset = tempDate.getTimezoneOffset();

  // japan is utc +9
  offset = (-9 * 60) - offset

  // offset is in min, convert to ms
  let dummyDate = new Date(days[day].getTime() + (offset + (hour * 60) + min) * (60 * 1000))
  let dayOfWeek = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

  return dayOfWeek[dummyDate.getDay()] + " at " + dummyDate.toLocaleTimeString([], { timeStyle: 'short' })

}

/**
 * Update "Last Watched" DOM with latest data
 *  
 */
function updateDOM() {
  if (lastWatched.length > 0) {
    if(isTracking){
      isTracking=false;
    }
    toggleLoadingAnimation();

    // for currently airing update broadcast time
    if (lastWatched[index] in broadcastTimes)
      scheduleElement.innerHTML = broadcastTimes[lastWatched[index]]

    artworkElement.src = artwork[lastWatched[index]]
    document.querySelector('.sectionLabel').innerHTML = lastWatched[index] == currWatching ? "Currently Watching" : "Last Watched"
    document.getElementById('lastWatched').innerHTML = lastWatched[index]
    let episodeObj = allData[lastWatched[index]]
    document.getElementById('lastWatchedEpisode').innerHTML = episodeObj.episode
    document.getElementById('lastWatchedTime').innerHTML = episodeObj.time
    document.getElementById('lastWatchedTotalTime').innerHTML = episodeObj.totalTime
    document.getElementById('lastWatchedSite').innerHTML = episodeObj.site
    if(episodeObj.nextEpisodeLink != undefined && episodeObj.nextEpisodeLink != ""){
      document.getElementById('nextEpisode').style.display = "inline-block"
    }
    else{
      document.getElementById('nextEpisode').style.display = "none"
    }
    
  }
  else {
    // display help text if user is not tracking anything
    for (let e of helpText) {
      e.style.display = "block"
    }
    showHelp = !showHelp
  }

}

// update index when user clicks previous or next
document.getElementById("previous").addEventListener('click', function () {
  index = index > 0 ? index - 1 : index
  isBrowsing = true
  updateBroadcastTimes()
});

document.getElementById("next").addEventListener('click', function () {
  index = index < lastWatched.length - 1 ? index + 1 : index
  isBrowsing = true
  updateBroadcastTimes()
});

// Trigger injection when user clicks track
document.getElementById("track").addEventListener('click', async function () {
  await chrome.runtime.sendMessage({ action: "track" },
    function (response) {
      let action = response.action;
      document.getElementById("track").innerHTML = action
      toggleLoadingAnimation();
      isTracking =true;
    });

})

document.getElementById("delete").addEventListener('click', async function () {
  // disable delete for currWatching and empty last watched
  if (lastWatched[index] != currWatching && lastWatched.length > 0) {
    // ask user for confirmation
    let toDelete = confirm("Are you sure you want delete this anime from Last Watched?")
    if (toDelete) {
      // remove the current item from storage
      chrome.storage.local.remove([lastWatched[index]], function () {
        //console.log("deleted from storage")
      });
      // remove the current item from lastWatched
      lastWatched.splice(index, 1)
      console.log(lastWatched)
      // store updated lastWatched in storage
      chrome.storage.local.set({ ['lastWatched']: lastWatched }, function () {
        //console.log("deleted from lastWatched")
      });
      // set index to end of lastWatched array
      index = lastWatched.length - 1
      // update popup DOM 
      updateBroadcastTimes(true)
    }
  }
});

// trigger resume action in background.js
document.getElementById("resume").addEventListener('click', async function () {
  // disable delete for currWatching and empty last watched
  if (lastWatched[index] != currWatching && lastWatched.length > 0) {
    chrome.runtime.sendMessage({ action: 'resume', title: lastWatched[index] },
      function (response) { });
  }
});

document.getElementById("nextEpisode").addEventListener('click', () => {
  let url = allData[lastWatched[index]].nextEpisodeLink;
  chrome.tabs.create({ "url": url }, function (tab) {});
  chrome.runtime.sendMessage({ action: 'nextEpisode' }, (response) => { });
}, false)


// Login button Text
chrome.storage.local.get(['userAuthCode'], function (result) {
  //console.log(result['userAuthCode'])
  document.getElementById("MAL").innerHTML =  result['userAuthCode'] != undefined ? "Log Out": "Login"
  if(result['userAuthCode'] != undefined){
    chrome.runtime.sendMessage({ action: 'getUserAccessToken'},
    function (response) { });
  }

});

// Login button
document.getElementById("MAL").addEventListener('click', async function () {
  let elem = document.getElementById("MAL")
  if(elem.innerHTML == "Login"){
    chrome.runtime.sendMessage({ action: 'MALLogin'},
      function (response) { });
  }
  else if(elem.innerHTML == "Log Out"){
    // ask user for confirmation
    let toLogout = confirm("Are you sure you want to Log Out?")
    if(toLogout){
    chrome.runtime.sendMessage({ action: 'MALLogOut'},
      function (response) {
        elem.innerHTML="Login"
       });
    }
  }
  
});


// show help text
document.getElementById("help").addEventListener('click', function () {
  for (let e of helpText) {
    e.style.display = !showHelp ? "block" : "none"
  }
  showHelp = !showHelp
});

// check if isDarkModeOn exists
// if not set it to false
chrome.storage.local.get(["isDarkModeOn"], function(result){
  if(result['isDarkModeOn'] == undefined){
    chrome.storage.local.set({"isDarkModeOn":false});
  }
  else{
    isDarkModeOn = result['isDarkModeOn']
  }
  toggleDarkMode();
});


// darkmode 
document.getElementById("darkMode").addEventListener('click', async function () {
  isDarkModeOn = ! isDarkModeOn
  toggleDarkMode();
  chrome.storage.local.set({"isDarkModeOn":isDarkModeOn});
});
function toggleDarkMode(){
  if(isDarkModeOn)
    document.querySelector(".container").classList.add("darkmode");
  else{
    document.querySelector(".container").classList.remove("darkmode");
  }
}

// chrome storage sync (cloud)
document.getElementById("cloud").addEventListener('click',async function(){
  chrome.storage.local.get(null, function (result) {
    if(result!={}){
        chrome.storage.sync.set(result, function(res){
          alert('Synced storage!')
        })
    }
  });

})

// update "Currently Watching" DOM when message is received from foreground.js 
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name == "info");
  port.onMessage.addListener(function (msg) {
    currWatching = msg.title
    document.getElementById("track").innerHTML = msg.action
    if(msg.malUpdateStatus!="")
      document.getElementById("malUpdateStatus").innerHTML = msg.malUpdateStatus
    if (!isBrowsing) {
      // get lastWatched and episode data from storage
      getDataFromStorage()
    }
  });
});

