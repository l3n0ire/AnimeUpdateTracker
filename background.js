let animeUpdate = /^https:\/\/anime-update.*/
let fourAnime = /^https:\/\/4anime\.to.*\//
var sites ={'animeUpdate':animeUpdate,'fourAnime':fourAnime}
var nextEpisode = false

chrome.tabs.onActivated.addListener(tab=>{
    chrome.tabs.get(tab.tabId,tab_info=>{
        //injector(tab_info.url)
        
    })
})
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (tab.active && change.url && nextEpisode) {
        injector('./foreground.js')
        nextEpisode = false
    }
});

function injector(script){
    chrome.tabs.executeScript(null,{file:script},()=>console.log('i injected'))
}
function checkURL(url){
    for(site in sites){
        // url matches one of the sites
        if(sites[site].test(url)){
            return true
        }
    }
    return false
}
chrome.runtime.onMessage.addListener( async(request,sender,sendResponse)=>{
    let action = request.action
    let response
    if(action === 'track'){
        chrome.tabs.getSelected(null, (tab) => {
            if(checkURL(tab.url)){
                console.log("ran")
                injector('./foreground.js')
            }
        });
        response ='tracking'
    }
    else if (action === 'resume'){
        chrome.storage.sync.get(null, function(result){
            let url = result[request.title].url
            let timeText = result[request.title].time
            let time = parseInt(timeText.substring(0,timeText.indexOf(":"))) * 60
            time = time + parseInt(timeText.substring(timeText.indexOf(":")+1))
            let videoElement
            let delay = 1000
            if(url.indexOf('anime-update')>=0){
                videoElement='video'
                delay = 2000
            }
            else if (url.indexOf('4anime')>=0){
                videoElement = '#example_video_1_html5_api'
            }
            
            chrome.tabs.create({ "url": url }, function (tab){
                // set video to where user last left off
                setTimeout(function(){chrome.tabs.executeScript(null,{code:`document.querySelector('${videoElement}').currentTime=${time}`})}, delay)
                // start tracking
                setTimeout(function(){injector('./foreground.js')}, delay)

            })
          });
        response ='resumed'
    }
    else if(action === 'nextEpisode'){
        console.log('nextEpisode')
        nextEpisode=true
        response='nextEpisode'
    }
    sendResponse({action:response});
})