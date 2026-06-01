const CLIENT_ID =
"1037149829816-1pfh3jaeac5qatteu58qu5gtvdtgfqlr.apps.googleusercontent.com";

const API_KEY =
"AIzaSyBh5SWdw7EUhu7Akcqy6TvF7wP86ZSiddc";

const DISCOVERY_DOC =
"https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

const SCOPES =
"https://www.googleapis.com/auth/drive.file";

const FOLDER_ID =
"1Ejaz210g3TeM46W6up5BtgHNzEWwOnRQ";

let tokenClient;

let gapiInited = false;

let gisInited = false;

/* =========================
   LOAD GAPI
========================= */

function gapiLoaded(){

  gapi.load(
    "client",
    initializeGapiClient
  );

}

/* =========================
   INIT GAPI CLIENT
========================= */

async function initializeGapiClient(){

  try{

    await gapi.client.init({

      apiKey: API_KEY,

      discoveryDocs:[
        DISCOVERY_DOC
      ]

    });

    gapiInited = true;

    console.log(
      "✅ GAPI initialized"
    );

  }catch(error){

    console.error(
      "❌ GAPI INIT ERROR",
      error
    );

  }

}

/* =========================
   LOAD GOOGLE GIS
========================= */

function gisLoaded(){

  try{

    tokenClient =
    google.accounts.oauth2.initTokenClient({

      client_id: CLIENT_ID,

      scope: SCOPES,

      callback:""

    });

    gisInited = true;

    console.log(
      "✅ GIS initialized"
    );

  }catch(error){

    console.error(
      "❌ GIS ERROR",
      error
    );

  }

}

/* =========================
   AUTH GOOGLE
========================= */

async function authenticateGoogle(){

  return new Promise((resolve,reject)=>{

    tokenClient.callback =
    async(resp)=>{

      if(resp.error){

        reject(resp);

        return;

      }

      resolve(resp);

    };

    if(
      gapi.client.getToken() === null
    ){

      tokenClient.requestAccessToken({

        prompt:"consent"

      });

    }else{

      tokenClient.requestAccessToken({

        prompt:""

      });

    }

  });

}

/* =========================
   UPLOAD FILE TO DRIVE
========================= */

async function uploadFileToDrive(file){

  try{

    if(!gapiInited){

      alert(
        "Google API belum siap"
      );

      return;

    }

    if(!gisInited){

      alert(
        "Google Auth belum siap"
      );

      return;

    }

    await authenticateGoogle();

    const metadata = {

      name:file.name,

      mimeType:file.type,

      parents:[
        FOLDER_ID
      ]

    };

    const form =
    new FormData();

    form.append(

      "metadata",

      new Blob(

        [JSON.stringify(metadata)],

        {
          type:"application/json"
        }

      )

    );

    form.append(
      "file",
      file
    );

    const accessToken =
    gapi.client
    .getToken()
    .access_token;

    const response =
    await fetch(

      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",

      {

        method:"POST",

        headers:{

          Authorization:
          "Bearer " + accessToken

        },

        body:form

      }

    );

    const result =
    await response.json();

    console.log(result);

    if(result.id){

      alert(
        "✅ Selfie berhasil upload ke Google Drive"
      );

    }else{

      console.error(result);

      alert(
        "❌ Upload gagal"
      );

    }

  }catch(error){

    console.error(error);

    alert(
      "❌ Error upload Google Drive"
    );

  }

}
