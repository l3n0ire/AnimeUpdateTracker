// Trigger injection when user clicks track
document.getElementById("track").addEventListener('click',async function(){
    await chrome.runtime.sendMessage({action: "track"},
    function (response) {
        let action = response.action;
        document.getElementById("track").innerHTML=action
    });
    
})

var lastWatched
var allData
var index
var myPort
var showHelp = false

// get lastWatched and episode data from storage
chrome.storage.sync.get(null, function(result){
  if(result!={} && result['lastWatched'] != undefined){
    allData = result
    lastWatched=allData['lastWatched']
    index = lastWatched.length-1
    updateDOM()
  }
});

/**
 * Update "Last Watched" DOM with latest data
 * 
 * @param {boolean} isDelete optional parameter which indicates if user click delete
 */
function updateDOM(isDelete=false){
  if(isDelete && index<0){
    location.reload()
  }
  else{
    document.getElementById('lastWatched').innerHTML=lastWatched[index]
    let episodeObj = allData[lastWatched[index]]
    document.getElementById('lastWatchedEpisode').innerHTML=episodeObj.episode
    document.getElementById('lastWatchedTime').innerHTML=episodeObj.time
    document.getElementById('lastWatchedTotalTime').innerHTML=episodeObj.totalTime
    document.getElementById('lastWatchedSite').innerHTML=episodeObj.site
  }
}

// update index when user clicks previous or next
document.getElementById("previous").addEventListener('click',function(){
  index = index>0 ? index-1:index
  updateDOM()
});
document.getElementById("next").addEventListener('click',function(){
  index = index<lastWatched.length-1 ? index+1:index
  updateDOM()
});

document.getElementById("delete").addEventListener('click',async function(){
  // ask user for confirmation
  let toDelete = confirm("Are you sure you want delete this anime from Last Watched?")
    if(toDelete){
    // remove the current item from storage
    chrome.storage.sync.remove([lastWatched[index]], function(){
      console.log("deleted from storage")
    });
    // remove the current item from lastWatched
    lastWatched.splice(index,1)
    console.log(lastWatched)
    // store updated lastWatched in storage
    chrome.storage.sync.set({['lastWatched']:lastWatched}, function(){
      console.log("deleted from lastWatched")
    });
    // set index to end of lastWatched array
    index = lastWatched.length-1
    // update popup DOM 
    updateDOM(true)
  }
});

// trigger resume action in background.js
document.getElementById("resume").addEventListener('click',async function(){
  chrome.runtime.sendMessage({action:'resume',title:lastWatched[index]},
    function (response) {});
});

// show help text
document.getElementById("help").addEventListener('click',function(){
  let helpText = document.getElementsByClassName("helpText")
  for(let e of helpText){
    e.style.display = !showHelp? "block": "none"
  }
  showHelp=!showHelp
});

// update "Currently Watching" DOM when message is received from foreground.js 
chrome.runtime.onConnect.addListener(function(port) {
    myPort = port
    console.assert(port.name == "info");
    port.onMessage.addListener(function(msg) {
      document.getElementById("title").innerHTML=msg.title;
      document.getElementById("episode").innerHTML=msg.episode;
      document.getElementById("time").innerHTML=msg.time;
      document.getElementById("totalTime").innerHTML=msg.totalTime;
      document.getElementById("site").innerHTML =msg.site
      document.getElementById("track").innerHTML = msg.action
      port.postMessage({status: "ok"});
    });
});