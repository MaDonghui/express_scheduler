// this file contains scheduler function code

<<<<<<< Updated upstream
/**
 * event format (both db and json)
 * id
 * title
 * start_date
 * end_date
 * type
 * priority
 * details
 */
=======
const google_calender = require("./google.controllers");
const { openDb } = require("../db.js");

const schedulerGetEvents = async (req, res, next) => {
  const uid = req.body.auth.uid;
  const db = await openDb();

  const all_events = await db.all("SELECT * FROM events WHERE owner=?", uid);
  res.send({
    events: all_events,
  });
};

const schedulerNewEvents = async (req, res, next) => {
  const uid = req.body.auth.uid;
  const events = req.body.events;

  console.log("New events", req.body);

  const db = await openDb();

  // insert all events
  events.forEach(async (e) => {
    await db.run(
      `INSERT INTO events 
          (creator, owner, title, creation_date, start_date, end_date, note, event_type, priority, workload, remaining_workload) 
          VALUES ($creator, $owner, $title, $creation_date, $start_date, $end_date, $note, $event_type, $priority, $workload, $remaining_workload)`,
      {
        $creator: uid,
        $owner: uid,
        $title: e.title,
        $creation_date: new Date().toISOString(),
        $start_date: e.start_date,
        $end_date: e.end_date,
        $note: e.note,
        $event_type: e.event_type,
        $priority: e.priority,
        $workload: e.workload,
        $remaining_workload: e.workload,
      },
      (err) => {
        if (err) return console.log("Failed to insert events\n", err);
      }
    );
  });

  // retrieve all events
  const all_events = await db.all("SELECT * FROM events WHERE owner=?", uid);
>>>>>>> Stashed changes

/**
 * expect event json in payload
 * check if event legal
 * return TBD
 */
const schedulerNewEvent = (req, res, next) => {
  res.send('new event!')
};

/**
 * expect event json in payload and event ID
 * check if event legal
 * return TBD
 */
const schedulerUpdateEvent = (req, res, next) => {
  res.send('event updated')
};

/**
 * expect event is
 * check if event legal
 * return TBD
 */
<<<<<<< Updated upstream
const schedulerRemoveEvent = (req, res, next) => {
  res.send('event deleted!');
=======
const schedulerRemoveEvents = async (req, res, next) => {
  const uid = req.body.auth.uid;
  const event_ids = req.body.event_ids;

  const db = await openDb();

  // something wrong here, can't use WHERE IN AND
  event_ids.forEach(async (id) => {
    await db.run(
      `DELETE FROM events WHERE event_id=$event_id AND creator=$creator`,
      {
        $event_id: id,
        $creator: uid,
      },
      (err) => {
        if (err) return console.log("Failed to remove events\n", err);
      }
    );
  });

  // retrieve all events
  const all_events = await db.all("SELECT * FROM events WHERE owner=?", uid);

  res.send({
    events: all_events,
  });
};

const schedulerCreateCourse = async (req, res, next) => {};

const schedulerCreatePlan = async (req, res, next) => {
  const uid = req.body.auth.uid;
  const db = await openDb();
  await db.exec(`DELETE FROM events WHERE event_type = 'focus'`);

  // 1. generate the avaliable time slots for focus sessions to schedule
  // 1.1 find out total plan period slot
  let db_buffer = await db.get(
    `SELECT end_date FROM events WHERE owner = ? ORDER BY end_date DESC;`,
    uid
  );

  let worktime_slots = [
    {
      start_date: Date.now(),
      end_date: new Date(db_buffer.end_date).getTime(),
    },
  ];
  console.log(
    `Planning Period: ${eventPeriodToISOString(worktime_slots[0])}\n`
  );
  // 1.2 generate all offwork_slot from 0AM to 9AM and 6PM to 0AM
  let days_in_between = Math.ceil(
    (worktime_slots[0].end_date - worktime_slots[0].start_date) /
      (1000 * 3600 * 24)
  );

  var midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  var time_buffer = midnight.getTime();
  let offwork_slots = [];
  for (let i = 0; i < days_in_between; i++) {
    let dawn_slot = {
      start_date: time_buffer,
      end_date: (time_buffer += 1000 * 3600 * 9),
    };
    offwork_slots.push(dawn_slot);

    time_buffer += 1000 * 3600 * 9;

    let dusk_slot = {
      start_date: time_buffer,
      end_date: (time_buffer += 1000 * 3600 * 6),
    };
    offwork_slots.push(dusk_slot);
  }

  // 1.3 generate overtime_slots
  var overtime_start = new Date();
  overtime_start.setHours(18, 0, 0, 0);
  var time_buffer = overtime_start.getTime();
  let overtime_slots = [];
  for (let i = 0; i < days_in_between; i++) {
    let overtime = {
      start_date: time_buffer,
      end_date: (time_buffer += 1000 * 3600 * 4),
    };

    var now = new Date();
    if (
      now.getTime() > overtime.start_date &&
      now.getTime() < overtime.end_date
    ) {
      // right now it's between 6pm to 10pm
      overtime.start_date = now.getTime();
      overtime_slots.push(overtime);
    } else if (now.getTime() > overtime.end_date) {
      // right now it's past 10pm
      // omit this overtime session
    } else {
      overtime_slots.push(overtime);
    }

    time_buffer += 1000 * 3600 * 20;
  }

  // 1.4 generate busy_slots from general events
  let busy_slots = [];
  db_buffer = await db.all(
    `SELECT start_date, end_date
     FROM events WHERE owner = ? AND event_type = "general" OR event_type = "academic"  ORDER BY end_date;`,
    [uid]
  );

  for (let index = 0; index < db_buffer.length; index++) {
    let e = db_buffer[index];
    let start_date = new Date(e.start_date);
    let end_date = new Date(e.end_date);

    let slot_buffer = {
      start_date: start_date.getTime(),
      end_date: end_date.getTime(),
    };

    busy_slots.push(slot_buffer);
  }
  console.log("------busy slots");
  for (let index = 0; index < busy_slots.length; index++) {
    console.log(eventPeriodToISOString(busy_slots[index]));
  }

  // 1.5 substract unavaliable slots from total plan period slot
  // 1.5.1 substract offwork slots
  for (let i = 0; i < offwork_slots.length; i++) {
    const unavaliable_slot = offwork_slots[i];

    for (let j = 0; j < worktime_slots.length; ) {
      let avaliable_slot = worktime_slots[j];
      let result = substractTimeSlot(avaliable_slot, unavaliable_slot);

      if (result.length == 0) {
        // remove source and j++
        worktime_slots.splice(j, 1);
        j++;
      } else if (result.length == 1) {
        // replace and j++
        worktime_slots.splice(j, 1, result[0]);
        j++;
      } else if (result.length == 2) {
        // replace and j+2
        worktime_slots.splice(j, 1, result[0], result[1]);
        j = j + 2;
      }
    }
  }

  // 1.5.2 substract busy slots
  for (let i = 0; i < busy_slots.length; i++) {
    const unavaliable_slot = busy_slots[i];

    // off work_time slots
    for (let j = 0; j < worktime_slots.length; ) {
      let avaliable_slot = worktime_slots[j];
      let result = substractTimeSlot(avaliable_slot, unavaliable_slot);

      if (result.length == 0) {
        // remove source and j++
        worktime_slots.splice(j, 1);
        j++;
      } else if (result.length == 1) {
        // replace and j++
        worktime_slots.splice(j, 1, result[0]);
        j++;
      } else if (result.length == 2) {
        // replace and j+2
        worktime_slots.splice(j, 1, result[0], result[1]);
        j = j + 2;
      }
    }

    // off overtime_slots
    for (let j = 0; j < overtime_slots.length; ) {
      let avaliable_slot = overtime_slots[j];
      let result = substractTimeSlot(avaliable_slot, unavaliable_slot);

      if (result.length == 0) {
        // remove source and j++
        overtime_slots.splice(j, 1);
        j++;
      } else if (result.length == 1) {
        // replace and j++
        overtime_slots.splice(j, 1, result[0]);
        j++;
      } else if (result.length == 2) {
        // replace and j+2
        overtime_slots.splice(j, 1, result[0], result[1]);
        j = j + 2;
      }
    }
  }

  console.log("------worktime slots");
  for (let index = 0; index < worktime_slots.length; index++) {
    console.log(eventPeriodToISOString(worktime_slots[index]));
  }
  console.log("------overtime slots");
  for (let index = 0; index < overtime_slots.length; index++) {
    console.log(eventPeriodToISOString(overtime_slots[index]));
  }
  console.log("\n");

  // til this point, free_time_slots and overtime_slots contains all avalibale time slots to focus

  // 2.1 get all academic events
  const academic_events = await db.all(
    `SELECT * FROM events WHERE owner=? AND event_type = "academic" ORDER BY end_date ASC`,
    uid
  );

  // 2.2 sort events in order urgent > workload_density > due_date > Lexicographic order
  academic_events.sort(sortEvents);

  // 2.2 create un-timed focus sessions
  let focus_sessions = [];
  for (let index = 0; index < academic_events.length; index++) {
    let event = academic_events[index];
    focus_sessions.push(createFocusSessions(event));
  }

  // 2.3 assign time slots to all the focus sessions
  // 2.3.1 loop all events based on academic_events order, inner loop find the earilest possible
  for (let i = 0; i < academic_events.length; i++) {
    const event = academic_events[i];
    const event_end_date = new Date(event.end_date);

    // spread focus sessions evenly over days if possible
    const total_days =
      (new Date(event.end_date).getTime() - new Date().getTime()) /
      (1000 * 3600 * 24);

    var midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    var target_day = {
      start_date: midnight.getTime(),
      end_date: midnight.getTime() + 1000 * 3600 * 24,
    };

    // claim focus sessions by day
    for (var day = 0; day < total_days; day++) {
      var daily_workload_remain = Math.ceil(calcWorkloadDensity(event)) * 60;

      // claim enough today
      for (let j = 0; j < focus_sessions[i].length; j++) {
        if (focus_sessions[i][j].status != "pending") {
          // this focus session has been planned
          continue;
        }

        if (daily_workload_remain <= 0) {
          console.log(`Day ${day} has fulfilled\n`);
          break;
        }

        console.log(`\t\t\t${focus_sessions[i][j].title}`);

        // claim worktime on target day
        var result = claimFreeTimeSlot(
          worktime_slots,
          focus_sessions[i][j].workload,
          target_day
        );
        if (
          result.claimed_slot != undefined &&
          result.claimed_slot.end_date <= event_end_date.getTime()
        ) {
          // claim success, set time, decrese daily remaining workload, continue to next event
          focus_sessions[i][j].start_date = new Date(
            result.claimed_slot.start_date
          ).toISOString();
          focus_sessions[i][j].end_date = new Date(
            result.claimed_slot.end_date
          ).toISOString();
          focus_sessions[i][j].status = "normal";
          worktime_slots = result.free_slots;
          daily_workload_remain -= focus_sessions[i][j].workload;
          continue;
        }

        // claim overtime on target day
        var result = claimFreeTimeSlot(
          overtime_slots,
          focus_sessions[i][j].workload,
          target_day
        );
        if (
          result.claimed_slot != undefined &&
          result.claimed_slot.end_date <= event_end_date.getTime()
        ) {
          // claim success, set time, decrese daily remaining workload, continue to next event
          focus_sessions[i][j].start_date = new Date(
            result.claimed_slot.start_date
          ).toISOString();
          focus_sessions[i][j].end_date = new Date(
            result.claimed_slot.end_date
          ).toISOString();
          focus_sessions[i][j].status = "behind";
          overtime_slots = result.free_slots;
          daily_workload_remain -= focus_sessions[i][j].workload;
          continue;
        }

        // claim worktime on anyday
        var result = claimFreeTimeSlot(
          worktime_slots,
          focus_sessions[i][j].workload
        );
        if (
          result.claimed_slot != undefined &&
          result.claimed_slot.end_date <= event_end_date.getTime()
        ) {
          // claim success, set time, decrese daily remaining workload, continue to next event
          focus_sessions[i][j].start_date = new Date(
            result.claimed_slot.start_date
          ).toISOString();
          focus_sessions[i][j].end_date = new Date(
            result.claimed_slot.end_date
          ).toISOString();
          focus_sessions[i][j].status = "behind";
          worktime_slots = result.free_slots;
          daily_workload_remain -= focus_sessions[i][j].workload;
          continue;
        }

        // claim overtime on anyday
        var result = claimFreeTimeSlot(
          overtime_slots,
          focus_sessions[i][j].workload
        );
        if (
          result.claimed_slot != undefined &&
          result.claimed_slot.end_date <= event_end_date.getTime()
        ) {
          // claim success, set time, decrese daily remaining workload, continue to next event
          focus_sessions[i][j].start_date = new Date(
            result.claimed_slot.start_date
          ).toISOString();
          focus_sessions[i][j].end_date = new Date(
            result.claimed_slot.end_date
          ).toISOString();
          focus_sessions[i][j].status = "behind";
          overtime_slots = result.free_slots;
          daily_workload_remain -= focus_sessions[i][j].workload;
          continue;
        }

        // claim failed, no approciate slot found
        focus_sessions[i][j].status = "fail";
      }

      target_day = {
        start_date: target_day.end_date,
        end_date: target_day.end_date + 1000 * 3600 * 24,
      };
    }
  }

  // insert events into db and compose response
  let good_workload = 0;
  let failed_workload = 0;
  let warning_workload = 0;
  for (let i = 0; i < focus_sessions.length; i++) {
    for (let j = 0; j < focus_sessions[i].length; j++) {
      const e = focus_sessions[i][j];

      switch (e.status) {
        case "normal":
          good_workload += e.workload;
          e.start_date = new Date(e.start_date);
          e.end_date = new Date(e.end_date);
          break;
        case "behind":
          warning_workload += e.workload;
          e.start_date = new Date(e.start_date);
          e.end_date = new Date(e.end_date);
          break;
        default:
          failed_workload += e.workload;
          e.start_date = new Date();
          e.end_date = new Date();
          break;
      }

      console.log(`${e.title} : ${e.status}`);

      await db.run(
        `INSERT INTO events 
            (creator, owner, title, creation_date, start_date, end_date, note, event_type, priority, workload, remaining_workload) 
            VALUES ($creator, $owner, $title, $creation_date, $start_date, $end_date, $note, $event_type, $priority, $workload, $remaining_workload)`,
        {
          $creator: uid,
          $owner: uid,
          $title: e.title,
          $creation_date: e.creation_date,
          $start_date: e.start_date.toISOString(),
          $end_date: e.end_date.toISOString(),
          $note: e.note,
          $event_type: e.event_type,
          $priority: e.priority,
          $workload: e.workload,
          $remaining_workload: e.workload,
        },
        (err) => {
          if (err) return console.log("Failed to insert focus sessions\n", err);
        }
      );
    }
  }
  var total_workload = good_workload + warning_workload + failed_workload;

  // 2.4 store all events back to database and record bad events
  const all_events = await db.all("SELECT * FROM events WHERE owner=?", uid);

  res.send({
    confidence: {
      good: good_workload / total_workload,
      warning: warning_workload / total_workload,
      fail: failed_workload / total_workload,
    },
    events: all_events,
  });
>>>>>>> Stashed changes
};


module.exports = {
    schedulerNewEvent,
    schedulerUpdateEvent,
    schedulerRemoveEvent
}