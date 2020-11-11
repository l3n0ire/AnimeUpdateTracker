// Trigger injection when user clicks track
document.getElementById("track").addEventListener('click', async function () {
  await chrome.runtime.sendMessage({ action: "track" },
    function (response) {
      let action = response.action;
      document.getElementById("track").innerHTML = action
    });

})

var lastWatched
var allData
var index
var myPort
var showHelp = false
var isBrowsing = false
var currWatching = ''

// get lastWatched and episode data from storage
chrome.storage.sync.get(null, function (result) {
  if (result != {}) {
    allData = result
    if (result['lastWatched'] != undefined) {
      lastWatched = allData['lastWatched']
      index = lastWatched.length - 1
      updateDOM()
      updateBroadcastTimes()
    }
  }

});
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
// broadcast times for each anime
var broadcastTimes = {}
// artwork for each anime
var artwork = {}
// malids for each anime
var malIDs = {}

/**
 * Updates or creates the broadcastTimes object by fetching from API
 * Only invoked when anime is not found in broadcastTimes
 */
function updateBroadcastTimes() {


  let queryName = lastWatched[index]
  // replace spaces with %20
  queryName.replace(" ", "%20")

  // Get malId and artwork for anime by searching by name
  // limit results to 1
  fetch(`https://api.jikan.moe/v3/search/anime?q=${queryName}&limit1`)
    .then(res => res.json())
    .then(data => {
      // should only be one result
      let resultObj = data.results[0]
      // store malid
      malIDs[lastWatched[index]] = resultObj.mal_id
      // store image url 
      artwork[lastWatched[index]] = resultObj.image_url
      // set image
      artworkElement.src = resultObj.image_url

      // get broadcast date
      fetch(`https://api.jikan.moe/v3/anime/${malIDs[lastWatched[index]]}`)
        .then(res => res.json())
        .then(data => {
          // check if its airing
          if (data.airing) {
            // store it in broadcastTimes and update DOM
            let timeStr = data['broadcast']
            let hour = timeStr.substring(timeStr.indexOf(':') - 2, timeStr.indexOf(':'))
            let min = timeStr.substring(timeStr.indexOf(':') + 1, timeStr.indexOf(':') + 3)
            let day = timeStr.substring(0, timeStr.indexOf(' at '))
            hour = parseInt(hour)
            min = parseInt(min)
            let tempDate = new Date()
            let offset = tempDate.getTimezoneOffset();
            // japan is utc +9
            offset = (-9 * 60) - offset
            // offset is in min, convert to ms
            let dummyDate = new Date(days[day].getTime() + (offset + (hour * 60) + min) * (60 * 1000))
            let dayOfWeek = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
            let formattedDate = dayOfWeek[dummyDate.getDay()] + " at " + dummyDate.toLocaleTimeString([], { timeStyle: 'short' })
            broadcastTimes[lastWatched[index]] = formattedDate
            scheduleElement.innerHTML = formattedDate
          }
          // completed series
          else {
            broadcastTimes[lastWatched[index]] = null
            scheduleElement.innerHTML = null
          }
        });
    });
}


/**
 * Update "Last Watched" DOM with latest data
 * 
 * @param {boolean} isDelete optional parameter which indicates if user click delete
 */
function updateDOM(isDelete = false) {
  if (isDelete && index < 0) {
    location.reload()
  }
  else {
    // if anime is not in malIDs get it from api
    if (!(lastWatched[index] in malIDs)) {
      updateBroadcastTimes()
    }
    else {
      // for currently airing update broadcast time
      if (lastWatched[index] in broadcastTimes)
        scheduleElement.innerHTML = broadcastTimes[lastWatched[index]]
      // update artwork
      artworkElement.src = artwork[lastWatched[index]]
    }
    document.querySelector('.sectionLabel').innerHTML = lastWatched[index] == currWatching ? "Currently Watching" : "Last Watched"
    document.getElementById('lastWatched').innerHTML = lastWatched[index]
    let episodeObj = allData[lastWatched[index]]
    document.getElementById('lastWatchedEpisode').innerHTML = episodeObj.episode
    document.getElementById('lastWatchedTime').innerHTML = episodeObj.time
    document.getElementById('lastWatchedTotalTime').innerHTML = episodeObj.totalTime
    document.getElementById('lastWatchedSite').innerHTML = episodeObj.site
  }
}

// update index when user clicks previous or next
document.getElementById("previous").addEventListener('click', function () {
  index = index > 0 ? index - 1 : index
  isBrowsing = true
  updateDOM()
});
document.getElementById("next").addEventListener('click', function () {
  index = index < lastWatched.length - 1 ? index + 1 : index
  isBrowsing = true
  updateDOM()
});

document.getElementById("delete").addEventListener('click', async function () {
  // ask user for confirmation
  let toDelete = confirm("Are you sure you want delete this anime from Last Watched?")
  if (toDelete) {
    // remove the current item from storage
    chrome.storage.sync.remove([lastWatched[index]], function () {
      console.log("deleted from storage")
    });
    // remove the current item from lastWatched
    lastWatched.splice(index, 1)
    console.log(lastWatched)
    // store updated lastWatched in storage
    chrome.storage.sync.set({ ['lastWatched']: lastWatched }, function () {
      console.log("deleted from lastWatched")
    });
    // set index to end of lastWatched array
    index = lastWatched.length - 1
    // update popup DOM 
    updateDOM(true)
  }
});

// trigger resume action in background.js
document.getElementById("resume").addEventListener('click', async function () {
  chrome.runtime.sendMessage({ action: 'resume', title: lastWatched[index] },
    function (response) { });
});

// show help text
document.getElementById("help").addEventListener('click', function () {
  let helpText = document.getElementsByClassName("helpText")
  for (let e of helpText) {
    e.style.display = !showHelp ? "block" : "none"
  }
  showHelp = !showHelp
});

// update "Currently Watching" DOM when message is received from foreground.js 
chrome.runtime.onConnect.addListener(function (port) {
  myPort = port
  console.assert(port.name == "info");
  port.onMessage.addListener(function (msg) {
    currWatching = msg.title
    if (!isBrowsing) {
      // get lastWatched and episode data from storage
      chrome.storage.sync.get(null, function (result) {
        if (result != {}) {
          allData = result
          if (result['lastWatched'] != undefined) {
            lastWatched = allData['lastWatched']
            index = lastWatched.length - 1
            updateDOM()
            updateBroadcastTimes()
          }
        }
      });
    }
  });
});