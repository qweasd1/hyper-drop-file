SESSION_USER_DATA = "SESSION_USER_DATA"

let _store

function escapeShellMeta(path) {
  // only support linux and mac style now
  return path.replace(/(?=[!"#$&'()*,;<=>?[\]^`{|}~ ])/g, '\\')
}

function sendSessionData(uid, data, escaped) {
  return ((dispatch, getState) => {
    dispatch({
      type: SESSION_USER_DATA,
      data,
      effect() {
        // If no uid is passed, data is sent to the active session.
        const targetUid = uid || getState().sessions.activeUid;
        rpc.emit('data', {uid: targetUid, data, escaped});
      }
    });
  })(_store.dispatch, _store.getState);
}

function getCurrentWindow(){
  return window.require('electron').remote.getCurrentWindow()
}



exports.onRendererWindow = (window) => {
  window.document.addEventListener('DOMContentLoaded', () => {

    const dropTargetElement = window.document.querySelector("#hyper") || window.document.querySelector(".hyper_main")

    dropTargetElement.addEventListener("dragover", (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  //
    dropTargetElement.addEventListener("drop", (e) => {
      // e.preventDefault()
      // e.stopPropagation()
      for (let file of e.dataTransfer.files) {
        const hyperConfig = config.getConfig()
        let rewritePath = null
        if("hyperDropFile" in hyperConfig && hyperConfig.hyperDropFile.pathRewriter){
          rewritePath = hyperConfig.hyperDropFile.pathRewriter(file.path,hyperConfig)
        }
        else {
          rewritePath = escapeShellMeta(file.path)
        }
        sendSessionData(null, rewritePath)
        break
      }

      getCurrentWindow().focus()
    })
  })

}



exports.middleware = store => next => action => {
  if (!_store) {
    _store = store
  }
  next(action)
}
