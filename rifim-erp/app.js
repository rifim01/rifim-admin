```javascript id="z1v5lh"
// ===============================
// RIFIM ERP SYSTEM
// ===============================

// ========================================
// CONFIG
// ========================================

const API_URL =
"https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

const FIREBASE_CONFIG = {

  apiKey: "YOUR_API_KEY",

  authDomain:
  "YOUR_PROJECT.firebaseapp.com",

  databaseURL:
  "https://YOUR_PROJECT.firebaseio.com",

  projectId: "YOUR_PROJECT",

  storageBucket:
  "YOUR_PROJECT.appspot.com",

  messagingSenderId:
  "123456789",

  appId:
  "YOUR_APP_ID"

};

// ========================================
// LOGIN SYSTEM
// ========================================

const USERS = [

  {
    email:"rifim01@adminrifim.org",
    password:"rifim123",
    role:"admin"
  },

  {
    email:"supervisor@rifim.org",
    password:"super123",
    role:"supervisor"
  },

  {
    email:"staff@rifim.org",
    password:"staff123",
    role:"staff"
  }

];

// ========================================
// LOGIN
// ========================================

function login(){

  const email =
  document.getElementById(
    "email"
  ).value;

  const password =
  document.getElementById(
    "password"
  ).value;

  const user =
  USERS.find(
    u =>
    u.email === email &&
    u.password === password
  );

  if(user){

    localStorage.setItem(
      "rifimUser",
      JSON.stringify(user)
    );

    showToast(
      "Login berhasil",
      "success"
    );

    setTimeout(()=>{

      window.location =
      "dashboard.html";

    },1000);

  }else{

    showToast(
      "Email atau password salah",
      "error"
    );

  }

}

// ========================================
// CHECK LOGIN
// ========================================

function checkLogin(){

  const user =
  JSON.parse(
    localStorage.getItem(
      "rifimUser"
    )
  );

  if(!user){

    window.location =
    "index.html";

  }

}

// ========================================
// LOGOUT
// ========================================

function logout(){

  localStorage.removeItem(
    "rifimUser"
  );

  window.location =
  "index.html";

}

// ========================================
// TOGGLE PASSWORD
// ========================================

function togglePassword(){

  const password =
  document.getElementById(
    "password"
  );

  if(password.type === "password"){

    password.type = "text";

  }else{

    password.type = "password";

  }

}

// ========================================
// GPS SYSTEM
// ========================================

function getGPS(){

  if(!navigator.geolocation){

    alert(
      "GPS tidak didukung"
    );

    return;

  }

  navigator.geolocation
  .getCurrentPosition(

    position=>{

      const lat =
      position.coords.latitude;

      const lng =
      position.coords.longitude;

      const accuracy =
      position.coords.accuracy;

      document.getElementById(
        "lat"
      ).innerText = lat;

      document.getElementById(
        "lng"
      ).innerText = lng;

      document.getElementById(
        "accuracy"
      ).innerText =
      accuracy.toFixed(0);

      console.log(
        "GPS:",
        lat,
        lng
      );

    },

    error=>{

      alert(
        "GPS gagal diakses"
      );

    },

    {
      enableHighAccuracy:true
    }

  );

}

// ========================================
// CAMERA SYSTEM
// ========================================

let photoData = "";

async function startCamera(){

  try{

    const video =
    document.getElementById(
      "video"
    );

    const stream =
    await navigator
    .mediaDevices
    .getUserMedia({

      video:{
        facingMode:"user"
      },

      audio:false

    });

    video.srcObject =
    stream;

  }catch(err){

    console.error(err);

    alert(
      "Camera gagal diakses"
    );

  }

}

// ========================================
// CAPTURE PHOTO
// ========================================

function capturePhoto(){

  const video =
  document.getElementById(
    "video"
  );

  const canvas =
  document.getElementById(
    "canvas"
  );

  const ctx =
  canvas.getContext("2d");

  canvas.width =
  video.videoWidth;

  canvas.height =
  video.videoHeight;

  ctx.drawImage(
    video,
    0,
    0
  );

  photoData =
  canvas.toDataURL(
    "image/jpeg"
  );

  showToast(
    "Foto berhasil diambil",
    "success"
  );

}

// ========================================
// SUBMIT ATTENDANCE
// ========================================

async function submitAttendance(){

  const user =
  JSON.parse(
    localStorage.getItem(
      "rifimUser"
    )
  );

  if(!user){

    alert(
      "Silakan login"
    );

    return;

  }

  const attendanceData = {

    email:user.email,

    latitude:
    document.getElementById(
      "lat"
    ).innerText,

    longitude:
    document.getElementById(
      "lng"
    ).innerText,

    photo:photoData,

    timestamp:
    new Date().toISOString()

  };

  console.log(
    attendanceData
  );

  showToast(
    "Absensi berhasil dikirim",
    "success"
  );

}

// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(
  message,
  type="success"
){

  const toast =
  document.createElement(
    "div"
  );

  toast.className =
  `toast ${type}`;

  toast.innerText =
  message;

  document.body
  .appendChild(toast);

  setTimeout(()=>{

    toast.classList.add(
      "show"
    );

  },100);

  setTimeout(()=>{

    toast.remove();

  },3000);

}

// ========================================
// DARK MODE
// ========================================

function toggleDarkMode(){

  document.body
  .classList.toggle(
    "dark"
  );

  localStorage.setItem(

    "rifimTheme",

    document.body.classList
    .contains("dark")
    ? "dark"
    : "light"

  );

}

// ========================================
// LOAD THEME
// ========================================

function loadTheme(){

  const theme =
  localStorage.getItem(
    "rifimTheme"
  );

  if(theme === "dark"){

    document.body.classList
    .add("dark");

  }

}

// ========================================
// INIT
// ========================================

document.addEventListener(

  "DOMContentLoaded",

  ()=>{

    loadTheme();

  }

);

// ========================================
// SERVICE WORKER
// ========================================

if("serviceWorker" in navigator){

  navigator.serviceWorker
  .register(
    "service-worker.js"
  )

  .then(()=>{

    console.log(
      "Service Worker Registered"
    );

  });

}
```
