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
var episodeIndices=[]
var myPort
var showHelp = false
chrome.storage.sync.get(null, function(result){
  if(result!={} && result['lastWatched'] != undefined){
    allData = result
    lastWatched=allData['lastWatched']
    index = lastWatched.length-1
    for(let i=0;i<lastWatched.length;i++){
      episodeIndices.push(allData[lastWatched[i].title].length-1) 
    }
    updateDOM()
  }
});
function updateDOM(isDelete=false){
  console.log(index)
  if(isDelete && index<0){
    location.reload()
  }
  else{
    document.getElementById('lastWatched').innerHTML=lastWatched[index].title
    document.getElementById('lastWatchedEpisode').innerHTML=allData[lastWatched[index].title][episodeIndices[index]].episode
    document.getElementById('lastWatchedTime').innerHTML=allData[lastWatched[index].title][episodeIndices[index]].time
    document.getElementById('lastWatchedTotalTime').innerHTML=allData[lastWatched[index].title][episodeIndices[index]].totalTime
  }
}
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
    chrome.storage.sync.remove([lastWatched[index].title], function(){
      console.log("deleted from storage")
    });
    // remove the current item from lastWatched
    lastWatched.splice(index,1)
    console.log(lastWatched)
    // store updated lastWatched in storage
    chrome.storage.sync.set({['lastWatched']:lastWatched}, function(){
      console.log("deleted from lastWatched")
    });
    index = lastWatched.length-1
    updateDOM(true)
  }
});
document.getElementById("resume").addEventListener('click',async function(){
  chrome.runtime.sendMessage({action:'resume',title:lastWatched[index].title, episodeIndex:episodeIndices[index]},
    function (response) {
        console.log(response.action)
    });
});
document.getElementById("help").addEventListener('click',function(){
  let helpText = document.getElementsByClassName("helpText")
  console.log(helpText)
  for(let e of helpText){
    e.style.display = !showHelp? "block": "none"
  }
  showHelp=!showHelp

});

chrome.runtime.onConnect.addListener(function(port) {
    myPort = port
    console.assert(port.name == "info");
    port.onMessage.addListener(function(msg) {
      document.getElementById("title").innerHTML=msg.title;
      document.getElementById("episode").innerHTML=msg.episode;
      document.getElementById("time").innerHTML=msg.time;
      document.getElementById("totalTime").innerHTML=msg.totalTime;
      document.getElementById("track").innerHTML = msg.action
      port.postMessage({status: "ok"});
    });
  });