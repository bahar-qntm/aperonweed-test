/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

const snapshotButton = document.querySelector('button#snapshot');
const videoSelect = document.querySelector('select#videoSource');

const videoElement = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');

//canvas.width = 640;
//canvas.height = 480;

const selectors = [videoSelect];


function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function createBlob(dataURL) {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    var parts = dataURL.split(',');
    var contentType = parts[0].split(':')[1];
    var raw = decodeURIComponent(parts[1]);
    return new Blob([raw], { type: contentType });
  }
  var parts = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;

  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

snapshotButton.onclick = function() {
  canvas.className = videoSelect.value;
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  //var url = "https://aperonncus-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/1fc5c98b-7c0d-4fd3-b41f-4356f78310c9/classify/iterations/Iteration1/image"
  var url = "https://qntm-apim.azure-api.net/KnowYourWeed/classify"
  //var url = "https://qntm-apim.azure-api.net/KnowYourWeed-Backup/classify"
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);

  //xhr.setRequestHeader("Prediction-Key", "8b70c86275ae4765902cdc5a25e84435");
  xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "39ee06e8c47940f78abb8fee0036796a");
  //xhr.setRequestHeader("Content-Type", "application/octet-stream");
  xhr.setRequestHeader("Content-Type", "multipart/form-data");
  //xhr.setRequestHeader("Content-Length", "0");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        console.log(xhr.status);
        console.log(xhr.responseText);
    }};

  document.getElementById("result1").innerHTML = " ";
  document.getElementById("probability").innerHTML = '<p>Doing some magic. . .</p>';
  document.getElementById("result2").innerHTML = " ";
  document.getElementById("result3").innerHTML = " ";
  document.getElementById("result4").innerHTML = " ";
  document.getElementById("result5").innerHTML = " ";
  
 
  const sendBlob = createBlob(canvas.toDataURL());
  xhr.send(sendBlob);
  
  xhr.onreadystatechange = function() { 
    // If the request completed, parse the results
    let response = JSON.parse(xhr.responseText);
    if (xhr.readyState == 4){
      if (xhr.status == 200) {
        document.getElementById("probability").innerHTML = '<b>Color - Probability</b>';
        document.getElementById("result1").innerHTML = '<p> <snap style="font-weight:bold;font-size:1.5em">' + (Number(response.predictions[0].probability).toFixed(2) * 100) + "%" + '</snap><br>' + response.predictions[0].tagName.toUpperCase() + '</p>';
        document.getElementById("result2").innerHTML = '<p> <snap style="font-weight:bold;font-size:1.5em;color:gray">' + (Number(response.predictions[1].probability).toFixed(2) * 100) + "%" + '</snap><br>' + response.predictions[1].tagName.toUpperCase() + '</p>';
        document.getElementById("result3").innerHTML = '<p> <snap style="font-weight:bold;font-size:smaller;color:gray">' + (Number(response.predictions[2].probability).toFixed(2) * 100) + "%" + '</snap><br><snap style="font-weight:normal;font-size:smaller;color:gray">' + response.predictions[2].tagName.toUpperCase() + '</snap></p>';
        document.getElementById("result4").innerHTML = '<p> <snap style="font-weight:bold;font-size:smaller;color:gray">' + (Number(response.predictions[3].probability).toFixed(2) * 100) + "%" + '</snap><br><snap style="font-weight:normal;font-size:smaller;color:gray">' + response.predictions[3].tagName.toUpperCase() + '</snap></p>';
        document.getElementById("result5").innerHTML = '<p> <snap style="font-weight:bold;font-size:smaller;color:gray">' + (Number(response.predictions[4].probability).toFixed(2) * 100) + "%" + '</snap><br><snap style="font-weight:normal;font-size:smaller;color:gray">' + response.predictions[4].tagName.toUpperCase() + '</snap></p>';
      } else {
        document.getElementById("probability").innerHTML = "<b>Error</b>";
        document.getElementById("result1").innerHTML = '';
        document.getElementById("result2").innerHTML = '';
        document.getElementById("result3").innerHTML = '';
        document.getElementById("result4").innerHTML = '';
        document.getElementById("result5").innerHTML = '';
      }
    }
  }
};

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const videoSource = videoSelect.value;
  const constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

videoSelect.onchange = start;

start();
