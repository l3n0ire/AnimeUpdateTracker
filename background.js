let animeUpdate = /^https:\/\/anime-update.*/
let fourAnime = /^https:\/\/4anime\.to.*\//
var sites = { 'animeUpdate': animeUpdate, 'fourAnime': fourAnime }
var nextEpisode = false
var CLIENT_ID
var userAccessToken
var userAuthCode
var codeVerifier

chrome.tabs.onActivated.addListener(tab => {
    chrome.tabs.get(tab.tabId, tab_info => {
    })
})

async function getSecrets(){
    let res = await fetch("https://secrets-rest.herokuapp.com/MAL")
    let data = await res.json()
    CLIENT_ID = data.CLIENT_ID
    codeVerifier = data.CODE_VERIFIER
}

// inject forground.js if current page refresh
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    // if nextEpisode is true then user navigated to next episode
    // start tracking
    if (tab.active && change.url && nextEpisode) {
        injector('./foreground.js')
        nextEpisode = false
    }
    else if(tab.active && change.url && change.url.indexOf("http://localhost/oauth")>=0){
        userAuthCode = change.url.substring(change.url.indexOf("code=")+5)
        // store user auth code
        chrome.storage.sync.set({'userAuthCode':userAuthCode}, function(){
            console.log("saved userAuthCode")
            // close the tab
            chrome.tabs.remove(tab.id)
            getUserAccessToken()
        })

        
    }
});

/**
 * Injects script with name script into the current tab
 * 
 * @param {string} script The name of the script to be injected
 */
function injector(script) {
    chrome.tabs.executeScript(null, { file: script }, () => console.log('i injected'))
}

/**
 * Checks url against the site regex
 * 
 * @param {string} url 
 */
function checkURL(url) {
    for (site in sites) {
        if (sites[site].test(url)) {
            return true
        }
    }
    return false
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    let action = request.action
    let response
    if (action === 'track') {
        // inject foreground.js into the current tab when user clicks "Start Tracking"
        chrome.tabs.getSelected(null, (tab) => {
            if (checkURL(tab.url)) {
                console.log("ran")
                injector('./foreground.js')
            }
        });
        response = 'tracking'
    }
    else if (action === 'resume') {
        chrome.storage.sync.get(null, function (result) {
            let url = result[request.title].url
            let timeText = result[request.title].time

            // convert timeText to time in seconds
            let time = parseInt(timeText.substring(0, timeText.indexOf(":"))) * 60
            time = time + parseInt(timeText.substring(timeText.indexOf(":") + 1))

            let videoElement
            let delay = 1000

            // set appropriate CSS selector for video element
            if (url.indexOf('anime-update') >= 0) {
                videoElement = 'video'
                delay = 2000
            }
            else if (url.indexOf('4anime') >= 0) {
                videoElement = '#example_video_1_html5_api'
            }
            // open episode in new tab
            chrome.tabs.create({ "url": url }, function (tab) {
                // set video to where user last left off
                setTimeout(function () { chrome.tabs.executeScript(null, { code: `document.querySelector('${videoElement}').currentTime=${time}` }) }, delay)
                // start tracking the current episode
                setTimeout(function () { injector('./foreground.js') }, delay)
            })
        });

        response = 'resumed'
    }
    else if (action === 'nextEpisode') {
        // trigger nextEpisode event
        console.log('nextEpisode')
        nextEpisode = true
        response = 'nextEpisode'
    }
    else if (action === 'MALLogin') {
        promptMALLogin()
    }
    else if (action === 'MALLogOut') {
        promptMALLogOut()
    }
    else if (action === 'getUserAccessToken') {
        getUserAuthCode()
    }
    else if(action == 'UpdateMAL'){  
        updateMAL(request.title, request.episode, request.isComplete)
        response = 'MAl updated!'
    }
    sendResponse({ action: response });
})

async function promptMALLogin(){
    if(CLIENT_ID == undefined || codeVerifier == undefined){
        console.log("called")
        await getSecrets();
    }
    let codeChallenge = codeVerifier
    let userAuthURL = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&code_challenge=${codeChallenge}`
    // open episode in new tab
    chrome.tabs.create({ "url": userAuthURL }, function (tab) {

    });
}
async function promptMALLogOut(){
    CLIENT_ID = undefined
    codeVerifier = undefined
    userAccessToken = undefined
    userAuthCode = undefined
    chrome.storage.sync.set({'userAuthCode':null}, function(){
        console.log("logged out")
        chrome.storage.sync.get(['userAuthCode'], function (result) {
            console.log(result['userAuthCode'])
        })
    })
}
async function getUserAuthCode(){
    chrome.storage.sync.get(['userAuthCode'], async function (result) {
        userAuthCode = result['userAuthCode']
        getUserAccessToken()
    });

}

async function getUserAccessToken(){
    // check if userAuthCode Exists
    // check if userAccessToken Exists
    if (userAccessToken == undefined){
        chrome.storage.sync.get(['userAccessToken'], async function (result) {
            console.log(result)
            if(result['userAccessToken'] == undefined){
                let url ="https://myanimelist.net/v1/oauth2/token"
                let params = new URLSearchParams()
                params.append('client_id', CLIENT_ID)
                params.append('client_secret', "")
                params.append('grant_type', 'authorization_code')
                params.append('code', userAuthCode)
                params.append('code_verifier', codeVerifier)
                    
                let res = await fetch(url,{
                    method: 'POST',
                    headers: {
                        'Content-Type':'application/x-www-form-urlencoded'
                    },
                    body: params
                })
                let data = await res.json()
                userAccessToken = data
                chrome.storage.sync.set({'userAccessToken':data}, function(){
                    console.log("saved userAccessToken")
                })
            }
            else{
                userAccessToken = result['userAccessToken']
                console.log("got from storage")
            }
        });
    }
    
}

async function updateMAL(title,episode,isComplete){
    console.log('updateMal ran')
    // update user's MAL
      if(userAccessToken != undefined && userAuthCode != undefined ){
        let access_token = userAccessToken['access_token']
        let queryName = title
        queryName.replace(" ", "%20")

        // get info about anime like id and numEpisodes
        let searchURL = `https://api.myanimelist.net/v2/anime?q=${queryName}&limit=1&fields=id,title,num_episodes`
        
        let res = await fetch(searchURL,{
          headers: {
              'Authorization':`Bearer ${access_token}`,
          },
        })
        let data = await res.json()
        let id = await data.data[0].node.id
        let numEpisodes = await data.data[0].node['num_episodes']
        let malListURL = await `https://api.myanimelist.net/v2/anime/${id}/my_list_status`

        // convert episode string to int
        // Episode_ is 8 characters
        let watchedEpisodes = parseInt(episode.substring(8))

        // set status to completed when user finishes last episode
        let status = numEpisodes>0 && watchedEpisodes == numEpisodes && isComplete? 'completed' : 'watching'
        console.log(data.data[0].node)
  
        let reqBody=new URLSearchParams()
        reqBody.append('status', status)
        reqBody.append('num_watched_episodes', watchedEpisodes)
  
        res = await fetch(malListURL,{
          method: 'PUT',
          headers: {
              'Authorization':`Bearer ${access_token}`,
              'Content-Type':'application/x-www-form-urlencoded'
          },
          body: reqBody
        })
        data = await res.json()
      }
      else
        return 'MAL not updated'
  
  }