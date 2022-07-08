/**
 * this controler is for google calendar intergration
 * all schedued events will be pushed onto google calendar for demostration
 */

const fs = require("fs");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const { openDb } = require("../db.js");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CLIENT_CREDENTIALS = JSON.parse(fs.readFileSync("client_secret.json"));

/**
 * When trying to retrieve user's access token, we first remember the session
 * By creating a unique, temporery user identifier pair with user's uid
 * Pass this temp id along with oAuthClient in it's state
 * so when oAuth2 callback uri happens, we will know which user such token belongs to
 * immedetly clear this temp id no matter if oauth success to prevent open token route access
 */

const auth_session = new Map();

// generate auth url, redirect user to it
const googleAuthorize = (req, res, next) => {
  // prepare temp_uid to uid pair for callback identity recognistion
  const temp_id = uuidv4();
  console.log(req.body);
  const uid = req.body.auth.uid;

  auth_session.set(temp_id, uid);

  const { client_secret, client_id, redirect_uris } = CLIENT_CREDENTIALS.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: temp_id,
  });

  console.log(`Google Auth Redirecting Client to\n${authUrl}\n`);

  res.send(authUrl);
  return;
};

// if auth on success, store the access token in db
const googleAuthorizeCallback = async (req, res, next) => {
  const code = req.query.code;
  const uuid = req.query.state;
  const uid = auth_session.get(uuid);

  console.log(`Google Auth: uid: ${uid} code: ${code}\n`);

  const { client_secret, client_id, redirect_uris } = CLIENT_CREDENTIALS.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // exchange code into access token and store in db
  oAuth2Client.getToken(code, async (err, token) => {
    if (err) return console.error("Error retrieving access token", err);

    // update database entry
    const db = await openDb();
    await db.run(
      "INSERT OR REPLACE INTO google_api (uid, token) VALUES (?, ?)",
      [uid, JSON.stringify(token)],
      (err) => {
        if (err) console.log("error storing user access token\n", err);
      }
    );
  });

  // clear auth temp uuid
  auth_session.delete(uuid);

  res.send("Google Authrozied");
  return;
};

// response with calendar id, if doesn't exists, create one first
const googleGetCalendarId = async (req, res, next) => {
  const uid = req.body.auth.uid;

  const db = await openDb();
  const result = await db.get(
    "SELECT calendar_id FROM google_api WHERE uid=?",
    uid
  );

  res.send(result.calendar_id);
};

// create a oAuth2 client with user's credentials
async function createAuthClient(uid) {
  const { client_secret, client_id, redirect_uris } = CLIENT_CREDENTIALS.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const db = await openDb();
  const result = await db.get("SELECT token FROM google_api WHERE uid=?", uid);
  oAuth2Client.setCredentials(JSON.parse(result.token));

  return oAuth2Client;
}

// create a enso calendar on user's google calendar, return calendar ID
const googleCreateCalendar = async (req, res, next) => {
  const uid = req.body.auth.uid;
  const authClient = await createAuthClient(uid);

  const service = google.calendar({ version: "v3", auth: authClient });
  const result = await service.calendars.insert({
    resource: {
      summary: "enso_tester",
    },
  });

  const calendar_id = result.data.id;

  const db = await openDb();
  await db.run("UPDATE google_api SET calendar_id=? WHERE uid=?", [
    calendar_id,
    uid,
  ]);

  res.send(calendar_id);
};

const googleSyncEvents = async (req, res, next) => {
  // create and auth client
  const uid = req.body.auth.uid;
  const authClient = await createAuthClient(uid);
  const calendar = google.calendar({ version: "v3", auth: authClient });

  // get all events
  const db = await openDb();
  const new_events = await db.all("SELECT * FROM events WHERE creator=?", uid);
  const db_result = await db.get(
    "SELECT calendar_id FROM google_api where uid=?",
    uid
  );

  // clear out google calendar
  const resource = await calendar.events.list({
    calendarId: db_result.calendar_id,
    singleEvents: true,
    orderBy: "startTime",
  });
  const old_events = resource.data.items;

  for (let i = 0; i < old_events.length; i++) {
    await calendar.events.delete({
      calendarId: db_result.calendar_id,
      eventId: old_events[i].id,
    });
  }

  // insert new events
  for (let i = 0; i < new_events.length; i++) {
    let e = new_events[i];

    let color = 1;
    if (e.event_type == "focus") color = 2;
    if (e.event_type == "general") color = 8;

    var google_event = {
      summary: e.title,
      description: e.note,
      colorId: color,
      start: {
        dateTime: e.start_date,
        timeZone: "Europe/Amsterdam",
      },
      end: {
        dateTime: e.end_date,
        timeZone: "Europe/Amsterdam",
      },

      reminders: {
        useDefault: true,
      },
    };

    calendar.events.insert(
      {
        auth: authClient,
        calendarId: db_result.calendar_id,
        resource: google_event,
      },
      (err) => {
        if (err) {
          return console.log("failed to sync events to google calendar", err);
        }
      }
    );
  }

  res.send("Successfully Synced Events to Google Calendar");
};

module.exports = {
  googleAuthorize,
  googleAuthorizeCallback,
  googleGetCalendarId,
  googleCreateCalendar,
  googleSyncEvents,
};
