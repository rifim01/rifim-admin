const API_URL = "YOUR_GOOGLE_SCRIPT_URL";

let photoData = "";

async function startCamera(){

  const video =
  document.getElementById('video');

  const stream =
  await navigator.mediaDevices.getUserMedia({
    video:{
      facingMode:"user"
    }
  });

  video.srcObject = stream;

}

function capturePhoto(){

  const video =
  document.getElementById('video');

  const canvas =
  document.getElementById('canvas');

  const ctx =
  canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video,0,0);

  photoData =
  canvas.toDataURL('image/jpeg');

  alert('Foto berhasil diambil');

}

function getGPS(){

  navigator.geolocation
  .getCurrentPosition(position=>{

    document.getElementById('lat')
    .innerText =
    position.coords.latitude;

    document.getElementById('lng')
    .innerText =
    position.coords.longitude;

  });

}

async function submitAttendance(){

  alert('Absensi berhasil dikirim');

}
