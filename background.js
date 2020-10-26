let pattern = /^https:\/\/anime-update.*\.stream\/view\/.*/
chrome.tabs.onActivated.addListener(tab=>{
    chrome.tabs.get(tab.tabId,tab_info=>{
        //injector(tab_info.url)
        
    })
})
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (tab.active && change.url) {
       // injector(change.url)
    }
});

function injector(url, script){
    console.log(pattern.test(url))

        if(pattern.test(url)){
            
            chrome.tabs.executeScript(null,{file:script},()=>console.log('i injected'))
        }

}
chrome.runtime.onMessage.addListener( async(request,sender,sendResponse)=>{
    let action = request.action
    let response
    if(action === 'track'){
        chrome.tabs.getSelected(null, (tab) => {
            if(pattern.test(tab.url)){
                console.log("ran")
                injector(tab.url,'./foreground.js')
            }
        });
        response ='tracking'
    }
    else if (action === 'resume'){
        chrome.storage.sync.get(null, function(result){
            let id = result[request.title][request.episodeIndex].videoId
            let baseURL = result['baseURL']
            let newURL = baseURL + id
            let timeText = result[request.title][request.episodeIndex].time
            let time = parseInt(timeText.substring(0,timeText.indexOf(":"))) * 60
            time = time + parseInt(timeText.substring(timeText.indexOf(":")+1))
            chrome.tabs.create({ url: newURL }, function (tab){
                // set video to where user last left off
                chrome.tabs.executeScript(tab.id,{code:`setTimeout(function(){ document.getElementsByTagName('video')[0].currentTime=${time};}, 1000);`
                })
                // start tracking
                setTimeout(function(){injector(newURL,'./foreground.js')},1000)

            })
          });
        response ='resumed'

    }
    sendResponse({action:response});
})