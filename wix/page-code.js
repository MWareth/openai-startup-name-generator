// ============================================================
//  PAGE CODE  — paste into the page that holds the HTML embed
//  (Wix Editor → open the page → Dev Mode / Velo → page code panel)
//
//  Assumes:
//   • Your HTML embed element ID is  #html1   (rename below if different)
//   • A backend file exists at  backend/habits.jsw
//   • Site Members / login is enabled (so data ties to the logged-in member)
// ============================================================
import { getMyDays, saveDay } from 'backend/habits.jsw';
import { currentMember } from 'wix-members-frontend';

$w.onReady(function () {
  const box = $w('#html1');

  box.onMessage(async (event) => {
    const msg = event.data || {};

    // The iframe is ready and asking for the user's saved data
    if (msg.type === 'habits:load') {
      try {
        const member = await currentMember.getMember();
        if (!member) {
          // not logged in → tell the iframe to stay device-only
          box.postMessage({ type: 'habits:local' });
          return;
        }
        const days = await getMyDays();
        const log = {};
        let habits = null;
        days.forEach((d) => {
          if (d.date) log[d.date] = safeParse(d.doneIds, []);
          if (d.habitsJson) habits = safeParse(d.habitsJson, null);
        });
        box.postMessage({ type: 'habits:data', log, habits });
      } catch (e) {
        box.postMessage({ type: 'habits:local' });
      }
    }

    // The iframe wants to persist a day's progress
    if (msg.type === 'habits:save') {
      try {
        await saveDay(
          msg.date,
          JSON.stringify(msg.doneIds || []),
          JSON.stringify(msg.habits || [])
        );
      } catch (e) {
        // ignore — the iframe still has its local copy
      }
    }
  });
});

function safeParse(v, fallback) {
  try { return JSON.parse(v); } catch (e) { return fallback; }
}
