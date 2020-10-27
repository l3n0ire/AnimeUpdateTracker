let animeUpdate = /^https:\/\/anime-update.*\.stream\/view\/.*/
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
            let url = result[request.title][request.episodeIndex].url
            let timeText = result[request.title][request.episodeIndex].time
            let time = parseInt(timeText.substring(0,timeText.indexOf(":"))) * 60
            time = time + parseInt(timeText.substring(timeText.indexOf(":")+1))
            chrome.tabs.create({ "url": url }, function (tab){
                // set video to where user last left off
                chrome.tabs.executeScript(tab.id,{code:`setTimeout(function(){ document.querySelector('#example_video_1_html5_api').currentTime=${time};}, 1000);`
                })
                // start tracking
                setTimeout(function(){injector('./foreground.js')},1000)

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