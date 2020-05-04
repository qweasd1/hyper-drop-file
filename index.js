SESSION_USER_DATA = "SESSION_USER_DATA"

let _store

const WHITESPACE_PATTERN = / |%20/g

const DEFAULTS = {
  DRIVE_PREFIX: '',
  ENABLE_WIN2POSIX: false
};

const hyperDropFileConfig = {}

function win2posix(path) {
  tmpPath = new URL(path).pathname
  drive = tmpPath.match(/^(\/[a-zA-Z])/)[0].toLowerCase()
  tmpPath.replace(/^\/[a-zA-Z]\:/, drive)
  return `${hyperDropFileConfig.DRIVE_PREFIX}${tmpPath.replace(/^\/[a-zA-Z]\:/, drive)}`
}

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
    Object.assign(hyperDropFileConfig, DEFAULTS, config.getConfig().hyperDropFile);      
    const dropTargetElement = window.document.querySelector("#hyper") || window.document.querySelector(".hyper_main")

    dropTargetElement.addEventListener("dragover", (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    window.a=hyperDropFileConfig
    dropTargetElement.addEventListener("drop", (e) => {
      for (let file of e.dataTransfer.files) {
        optimizePath = file.path
        hyperDropFileConfig.ENABLE_WIN2POSIX && (optimizePath = win2posix(file.path))
        sendSessionData(null, escapeWhitepsaceInDirectory(optimizePath))
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
