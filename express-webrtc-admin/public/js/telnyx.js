let client;
let currentCall = null;

var username = localStorage.getItem('telnyx.example.username') || '';
var password = localStorage.getItem('telnyx.example.password') || '';
var calleeNumber = localStorage.getItem('telnyx.example.calleeNumber') || '';
var callerNumber = localStorage.getItem('telnyx.example.callerNumber') || '';
var greeting = localStorage.getItem('telnyx.example.greeting') || '';

/**
 * On document ready auto-fill the input values from the localStorage.
 */
ready(function () {
  document.getElementById('username').value = username;
  document.getElementById('password').value = password;
  document.getElementById('calleeNumber').value = calleeNumber;
  document.getElementById('callerNumber').value = callerNumber;
  resetGreetings();
  setCallbackUrls();
});

function setCallbackUrls () {
  fetch(`/initialization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify({initialization: true})
  })
  .then(response => response.json())
  .then(res => {
    console.log(res)
    return res;
  })
  .catch((error) => {
    console.error('Error:', error);
  })
}

function sendMessage(){
  const messageRequest = {
    from: document.getElementById('messageFromPhoneNumber').value,
    to: document.getElementById('messageToPhoneNumber').value,
    text: document.getElementById('messageText').value
  }
  const messageMedia =  document.getElementById('messageMedia').value;
  if (messageMedia && messageMedia.length > 7) {
    messageRequest.media_url = messageMedia;
  }
  console.log('Sending Message');
  console.log(messageRequest);
  fetch(`/messaging`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(messageRequest)
  })
  .then(response => response.json())
  .then(res => {
    console.log(res)
    return res;
  })
  .catch((error) => {
    console.error('Error:', error);
  })
}


function sendValueToServer(key, value) {
  console.log(`Sending {"${key}": "${value}"}`);
  fetch(`/configuration/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify({value})
  })
  .then(response => response.json())
  .then(res => {
    console.log(res)
    return res;
  })
  .catch((error) => {
    console.error('Error:', error);
  })
}

function getValueFromServer(key) {
  console.log(`fetching {"${key}"}`);
  return fetch(`/configuration/${key}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  })
  .then(response => response.json())
  .then(res => {
    console.log(res)
    return res;
  })
  .catch((error) => {
    console.error('Error:', error);
  })
}

function deleteValueFromServer(key) {
  console.log(`Deleting {"${key}"}`);
  fetch(`/configuration/${key}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
  })
  .then(response => response.json())
  .then(res => {
    console.log(res)
    return res;
  })
  .catch((error) => {
    console.error('Error:', error);
  })
}

function resetGreetings() {
  console.log('Resetting greeting');
  const gatherSentence = "Hello, please press 1 to join the conference.";
  const inboundGreeting = "Hello, thank you for calling, transferring you now.";
  document.getElementById('outboundGreeting').value = gatherSentence;
  document.getElementById('inboundGreeting').value = inboundGreeting;
  sendValueToServer('gatherSentence', gatherSentence);
  sendValueToServer('inboundGreeting', inboundGreeting)
}

function setGreetings() {
  const gatherSentence = document.getElementById('outboundGreeting').value;
  const inboundGreeting = document.getElementById('inboundGreeting').value;
  sendValueToServer('gatherSentence', gatherSentence)
  sendValueToServer('inboundGreeting', inboundGreeting)
}

/**
 * Connect with TelnyxWebRTC.TelnyxRTC creating a client and attaching all the event handler.
 */
function connect() {
  client = new TelnyxWebRTC.TelnyxRTC({
    env: 'production',
    login: document.getElementById('username').value,
    password: document.getElementById('password').value,
    ringtoneFile: './sounds/incoming_call.mp3'
    // iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    // ringbackFile: './sounds/ringback_tone.mp3',
  });
  client.remoteElement = 'remoteAudio';
  client.enableMicrophone();

  client.on('telnyx.ready', function () {
    btnConnect.classList.add('d-none');
    btnDisconnect.classList.remove('d-none');
    connectStatus.innerHTML = 'Connected';

    startCall.disabled = false;
  });

  // Update UI on socket close
  client.on('telnyx.socket.close', function () {
    btnConnect.classList.remove('d-none');
    btnDisconnect.classList.add('d-none');
    connectStatus.innerHTML = 'Disconnected';
  });

  // Handle error...
  client.on('telnyx.error', function (error) {
    console.error('telnyx error:', error);
  });

  client.on('telnyx.notification', handleNotification);

  connectStatus.innerHTML = 'Connecting...';
  client.connect();
  sendSipURIToServer();
}

function sendSipURIToServer() {
  const sipURI = `sip:${document.getElementById('username').value}@sip.telnyx.com`;
  sendValueToServer('sipURI', sipURI)
}

function deleteSipURIFromServer() {
  deleteValueFromServer('sipURI');
}

function disconnect() {
  connectStatus.innerHTML = 'Disconnecting...';
  client.disconnect();
  deleteSipURIFromServer();
  deleteValueFromServer('conferenceId');
}

/**
 * Handle notification from the client.
 */
function handleNotification(notification) {
  switch (notification.type) {
    case 'callUpdate':
      handleCallUpdate(notification.call);
      break;
    case 'userMediaError':
      console.log(
        'Permission denied or invalid audio/video params on `getUserMedia`'
      );
      break;
  }
}

/**
 * Update the UI when the call's state change
 */
function handleCallUpdate(call) {
  currentCall = call;
  console.log(currentCall);
  switch (call.state) {
    case 'new': // Setup the UI
      break;
    case 'trying': // You are trying to call someone and he's ringing now
      break;
    case 'recovering': // Call is recovering from a previous session
      if (confirm('Recover the previous call?')) {
        currentCall.answer();
      } else {
        currentCall.hangup();
      }
      break;
    case 'ringing': // Someone is calling you
      //used to avoid alert block audio play, I delayed to audio play first.
      setTimeout(function () {
        if (confirm('Connect to conference?')) {
          currentCall.answer();
          currentCall.unmuteAudio();
          currentCall.undeaf();
        } else {
          currentCall.hangup();
        }
      }, 1000);
      break;
    case 'active': // Call has become active
      startCall.classList.add('d-none');
      hangupCall.classList.remove('d-none');
      hangupCall.disabled = false;
      break;
    case 'hangup': // Call is over
      startCall.classList.remove('d-none');
      hangupCall.classList.add('d-none');
      hangupCall.disabled = true;
      break;
    case 'destroy': // Call has been destroyed
      currentCall = null;
      break;
  }
}

/**
 * Make a new outbound call
 */
function makeCall() {
  const sipURI = `sip:${document.getElementById('username').value}@sip.telnyx.com`;
  const data = {
    callerName: 'Caller Name',
    from: document.getElementById('callerNumber').value,
    to: document.getElementById('calleeNumber').value, // required!
    sipURI
  };
  console.log(data);
  console.log('Making Call');
  fetch('/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(e => console.log(e));
}

function endConference() {
  fetch('/conferences', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(e => console.log(e));
}

/**
 * Hangup the currentCall if present
 */
function hangup() {
  if (currentCall) {
    console.log('Hangingup call and ending conference');
    currentCall.hangup();
    endConference();
  }
}

function saveInLocalStorage(e) {
  var key = e.target.name || e.target.id;
  localStorage.setItem('telnyx.example.' + key, e.target.value);
}

// jQuery document.ready equivalent
function ready(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    document.attachEvent('onreadystatechange', function () {
      if (document.readyState !== 'loading') {
        callback();
      }
    });
  }
}
