var url = window.location.href
var site
// initialize vars according to the site
if(url.indexOf('anime-update')>=0){
  site="Anime Update"
  let fullName = document.getElementsByClassName("page_title")[1].innerHTML
  var episode = fullName.substring(fullName.indexOf('Episode'),fullName.length)
  var title = fullName.substring(0,fullName.indexOf('Episode')-1)
  console.log("Anime update tracker active")
  let baseURL = 'https://anime-update.com/watch-online/'
  // for some reason hunter x hunter doesn't follow this pattern
  if (fullName.indexOf('Hunter x Hunter')>=0) 
    fullName=fullName.replace('Episode ','')

  fullName = fullName.toLowerCase()
  // remove all special characters
  fullName = fullName.replace(/[^a-zA-Z0-9 ]/g,'')
  // replace ' '  with '-'
  fullName = fullName.replace(/ /g,'-')
  // remove trailing '-'
  url =baseURL+fullName.substring(0,fullName.length-1)
  // next and previous buttons
  let nextButton = document.querySelector('.glyphicon.glyphicon-arrow-right')
  let previousButton = document.querySelector('.glyphicon.glyphicon-arrow-left')
  nextButton = nextButton != undefined? nextButton.parentElement:nextButton
  previousButton = previousButton != undefined? previousButton.parentElement:previousButton
  var toTrackButtons = [nextButton,previousButton]


}
else if(url.indexOf('4anime')>=0){
  site="4anime"
  var title = document.querySelector(".singletitletop a").innerHTML
  var episode = document.querySelectorAll('#titleleft')[1].innerHTML
  console.log("4anime tracker active")
  // two next and previous buttons for mobile/desktop
  let nextButtons = document.querySelectorAll('.anipager-next a')
  let previousButtons = document.querySelectorAll('.anipager-prev a')
  let episodeButtons = document.querySelectorAll('.episodes li a')
  var toTrackButtons = [...nextButtons,...previousButtons,...episodeButtons]
}
// common vars
var time ="00:00"
var totalTime ="00:00"


// check if next episode buttons exists
if (toTrackButtons != undefined){
  for(button of toTrackButtons){
    if(button != undefined){
      button.addEventListener('click',()=>{
        chrome.runtime.sendMessage({action:'nextEpisode'},(response)=>{});
      },false)
    }
  }
}

function remover(arr,prop,value){
  for(let i = 0;i<arr.length;i++){
    let curr= arr[i]
    if(curr[prop] === value){
      arr.splice(i,1)
      console.log("removed")
    }
  }
  return arr
}

setInterval(function() {
  if(site == 'Anime Update'){
    time = document.getElementsByClassName('plyr__controls__item plyr__time--current plyr__time')[0].innerHTML
    totalTime = document.getElementsByClassName('plyr__controls__item plyr__time--duration plyr__time')[0].innerHTML
  }
  else if(site == '4anime'){
    time = document.querySelector('.vjs-current-time-display').innerHTML
    time = time.substring(time.lastIndexOf('>')+1)
    totalTime = document.querySelector('.vjs-duration-display').innerHTML
    totalTime = totalTime.substring(totalTime.lastIndexOf(' ')+1)
  }
    console.log(time)
    let toStore=[]
    var toStoreLW=[]
    chrome.storage.sync.get(title, function(series){
      if(series[title] ==  undefined){
        console.log("new")
        toStore.push({"episode":episode,"time":time,"totalTime":totalTime, "url":url, "site":site})
      }
      else{
        // remove existing episode entry
        remover(series[title],'episode',episode)
        // insert new episode
        series[title].push({"episode":episode,"time":time,"totalTime":totalTime, "url":url, "site":site})
        toStore=series[title]
        console.log(series[title])
        console.log("old")
      }
      chrome.storage.sync.set({[title]:toStore}, function() {
        console.log('added ' + title+" "+episode+" "+time+"/"+totalTime)
      });
      chrome.storage.sync.get(['lastWatched'], function(result){
        console.log(result['lastWatched'] ==  undefined)
        console.log(result['lastWatched'])
        if(result['lastWatched'] == undefined){
          toStoreLW.push({title:title})
        }
        else{
          // remove existing series entry
          remover(result['lastWatched'],'title',title)
          // insert new series
          result['lastWatched'].push({title:title})
          toStoreLW = result['lastWatched']
          console.log(result['lastWatched'])
        }
        chrome.storage.sync.set({['lastWatched']:toStoreLW}, function() {
          console.log('last watched ' +title+" "+episode+" "+time+"/"+totalTime)
        });
      });
    });
    
    let port = chrome.runtime.connect({name: "info"});
    port.postMessage({title:title, episode:episode, time:time, totalTime:totalTime, site:site, action:'tracking'});
    port.onMessage.addListener(function(msg) {
    });
    
    
    
}, 2*1000);
/*
set current time of video (in seconds)
document.getElementsByTagName("video")[0].currentTime=172
*/





