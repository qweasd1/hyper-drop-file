SESSION_USER_DATA = "SESSION_USER_DATA"

let _store

const WHITESPACE_PATTERN = / /g

function escapeWhitepsaceInDirectory(path) {
  // only support linux and mac style now
  return path.replace(WHITESPACE_PATTERN,"\\ ")
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
        sendSessionData(null, escapeWhitepsaceInDirectory(file.path))
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
