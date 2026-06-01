const CLIENT_ID =
"181935617941-5d0cspgdt39kdog72fetn7js0oksskee.apps.googleusercontent.com";

const API_KEY =
"AIzaSyArvTvSNtZK5dlVq1acC9wN9emn9oVQpN8";

const DISCOVERY_DOC =
"https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

const SCOPES =
"https://www.googleapis.com/auth/drive";

const FOLDER_ID =
"1Ejaz210g3TeM46W6up5BtgHNzEWwOnRQ";

let tokenClient;

/* INIT */

window.onload = () => {

  gapi.load(
    "client",
    async()=>{

      await gapi.client.init({

        apiKey: API_KEY,

        discoveryDocs:[
          DISCOVERY_DOC
        ]

      });

    }

  );

  tokenClient =
  google.accounts.oauth2.initTokenClient({

    client_id: CLIENT_ID,

    scope: SCOPES,

    callback:""

  });

};

/* AUTH */

async function authenticateGoogle(){

  return new Promise((resolve,reject)=>{

    tokenClient.callback = (resp)=>{

      if(resp.error){

        reject(resp);

        return;

      }

      resolve(resp);

    };

    tokenClient.requestAccessToken({

      prompt:"consent"

    });

  });

}

/* UPLOAD */

async function uploadFileToDrive(file){

  try{

    await authenticateGoogle();

    const metadata = {

      name:file.name,

      mimeType:file.type,

      parents:[FOLDER_ID]

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
    gapi.client.getToken().access_token;

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

      alert(
        "❌ Upload gagal"
      );

      console.log(result);

    }

  }catch(err){

    console.error(err);

    alert(
      "❌ Error upload Google Drive"
    );

  }

}
