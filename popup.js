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
function updateDOM(){
  document.getElementById('lastWatched').innerHTML=lastWatched[index].title
  document.getElementById('lastWatchedEpisode').innerHTML=allData[lastWatched[index].title][episodeIndices[index]].episode
  document.getElementById('lastWatchedTime').innerHTML=allData[lastWatched[index].title][episodeIndices[index]].time
}
document.getElementById("previous").addEventListener('click',function(){
  index = index>0 ? index-1:index
  updateDOM()
});
document.getElementById("next").addEventListener('click',function(){
  index = index<lastWatched.length-1 ? index+1:index
  updateDOM()
});
document.getElementById("resume").addEventListener('click',async function(){
  chrome.runtime.sendMessage({action:'resume',title:lastWatched[index].title, episodeIndex:episodeIndices[index]},
    function (response) {
        console.log(response.action)
    });
});

chrome.runtime.onConnect.addListener(function(port) {
    myPort = port
    console.assert(port.name == "info");
    port.onMessage.addListener(function(msg) {
      document.getElementById("title").innerHTML=msg.title;
      document.getElementById("episode").innerHTML=msg.episode;
      document.getElementById("time").innerHTML=msg.time;
      document.getElementById("track").innerHTML = msg.action
      port.postMessage({status: "ok"});
    });
  });