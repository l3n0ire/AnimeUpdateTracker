
var title = document.getElementsByClassName("page_title")[1].innerHTML
var episode = title.substring(title.indexOf('Episode'),title.length)
title = title.substring(0,title.indexOf('Episode')-1)
console.log("Anime update tracker active")
console.log(episode)
var time ="00:00"
var url = window.location.href
var baseURL = url.substring(0,url.indexOf('view')+5)
var videoId = url.substring(url.indexOf('view')+5, url.length-1)
chrome.storage.sync.set({['baseURL']:baseURL}, function() {
  console.log("stored "+ baseURL)
});

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
    time = document.getElementsByClassName('plyr__controls__item plyr__time--current plyr__time')[0].innerHTML
    console.log(time)
    let toStore=[]
    var toStoreLW=[]
    chrome.storage.sync.get(title, function(series){
      if(series[title] ==  undefined){
        console.log("new")
        toStore.push({"episode":episode,"time":time, "videoId":videoId})
      }
      else{
        // remove existing episode entry
        remover(series[title],'episode',episode)
        // insert new episode
        series[title].push({"episode":episode,"time":time, "videoId":videoId})
        toStore=series[title]
        console.log(series[title])
        console.log("old")
      }
      chrome.storage.sync.set({[title]:toStore}, function() {
        console.log('added ' + title+" "+episode+" "+time)
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
          console.log('last watched ' +title+" "+episode+" "+time)
        });
      });
    });
    
    let port = chrome.runtime.connect({name: "info"});
    port.postMessage({title:title,episode:episode,time:time,action:'tracking'});
    port.onMessage.addListener(function(msg) {
    });
    
    
    
}, 2*1000);
/*
set current time of video (in seconds)
document.getElementsByTagName("video")[0].currentTime=172
*/





