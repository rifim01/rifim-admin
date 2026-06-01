const CLIENT_ID = "GANTI_DENGAN_CLIENT_ID";
const API_KEY = "AIzaSyBh5SWdw7EUhu7Akcqy6TvF7wP86ZSiddc";

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

const SCOPES = "https://www.googleapis.com/auth/drive.file";

const FOLDER_ID = "1Ejaz210g3TeM46W6up5BtgHNzEWwOnRQ";

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });

  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "",
  });

  gisInited = true;
}

async function authenticateGoogle() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
      }

      resolve(resp);
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  });
}

async function uploadSelfieToDrive(blob, fileName) {
  const metadata = {
    name: fileName,
    mimeType: "image/jpeg",
    parents: [FOLDER_ID],
  };

  const accessToken = gapi.client.getToken().access_token;

  const form = new FormData();

  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    })
  );

  form.append("file", blob);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer " + accessToken,
      }),
      body: form,
    }
  );

  return await response.json();
}
