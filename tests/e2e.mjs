// End-to-end test over WebView2 CDP. Drives the real UI and checks backend state.
// Run the app with WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333, then
// `node tests/e2e.mjs` (from Windows). Creates real sessions: back up %APPDATA%\com.charan.pomodoro first.
import { mkdirSync, writeFileSync } from "node:fs";

const SHOTS = new URL("./shots/", import.meta.url);
mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error")
    errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
};
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable");

async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(`${expr}\n  -> ${r.result.exceptionDetails.exception?.description}`);
  return r.result.result.value;
}

// Page helpers.
await ev(`
  window.__t = {
    invoke: (cmd, args) => window.__TAURI_INTERNALS__.invoke(cmd, args),
    btn: (text) => [...document.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent).trim().includes(text)),
    click(text) { const b = this.btn(text); if (!b) throw new Error("no button " + text); b.click(); },
    type(el, value) {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    pressOverlay() {
      const o = document.querySelector(".overlay");
      for (const t of ["mousedown", "mouseup"]) o.dispatchEvent(new MouseEvent(t, { bubbles: true, button: 0, screenX: 5, screenY: 5 }));
    },
  };
`);

const state = () => ev(`return await __t.invoke("get_state")`);
const win = () => ev(`return [innerWidth, innerHeight]`);
let passed = 0, failed = 0;
function check(name, cond, detail = "") {
  if (cond) { passed++; console.log("  ✓", name); }
  else { failed++; console.log("  ✗", name, detail); }
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(new URL(`${name}.png`, SHOTS), Buffer.from(r.result.data, "base64"));
}
const step = async (title, fn) => { console.log(title); await fn(); await sleep(700); };

// --- Reset to setup ---
await step("reset", async () => {
  const s = await state();
  if (["picking", "work", "break"].includes(s.phase)) await ev(`await __t.invoke("end_session")`);
  if ((await state()).phase !== "setup") await ev(`await __t.invoke("new_session")`);
  await ev(`await __t.invoke("update_settings", { settings: { ...(await __t.invoke("get_settings")), theme: "forest" } })`);
});
const historyBefore = (await ev(`return (await __t.invoke("get_history")).length`));

await step("setup screen", async () => {
  check("phase is setup", (await state()).phase === "setup");
  await sleep(600);
  await shot("01-setup-empty");
  await ev(`__t.type(document.querySelector("textarea"), "Write the intro section\\nReview lecture notes\\nProblem set 3")`);
  await ev(`const inputs = document.querySelectorAll(".stepper input"); __t.type(inputs[0], "1"); __t.type(inputs[1], "1"); __t.type(inputs[2], "2");`);
  await sleep(300);
  await shot("02-setup-filled");
  check("start enabled with 3 tasks", await ev(`return !__t.btn("Start session").disabled && document.querySelector(".footer-note").textContent`) === "3 tasks");
  await ev(`__t.click("Start session")`);
});

await step("picking", async () => {
  const s = await state();
  check("phase is picking", s.phase === "picking");
  check("3 tasks created", s.session.tasks.length === 3);
  check("config saved", s.session.config.workMinutes === 1 && s.session.config.longBreakEvery === 2, JSON.stringify(s.session.config));
  check("settings remember durations", (await ev(`return (await __t.invoke("get_settings")).lastWorkMinutes`)) === 1);
  await ev(`const i = document.querySelector(".add-task input"); __t.type(i, "Extra task"); await new Promise(r => setTimeout(r, 50)); i.form.requestSubmit();`);
});

await step("add/remove task", async () => {
  check("task added", (await state()).session.tasks.length === 4);
  await shot("03-picking");
  await ev(`__t.click("Remove Extra task")`);
});

await step("pick task → work overlay", async () => {
  check("task removed", (await state()).session.tasks.length === 3);
  await ev(`[...document.querySelectorAll(".task-select")].find(b => b.textContent.includes("Write the intro")).click()`);
});

await step("mini overlay", async () => {
  const s = await state();
  check("phase is work on t1", s.phase === "work" && s.session.currentTaskId === "t1");
  await sleep(500);
  const [w, h] = await win();
  check("window is mini (236×74)", Math.abs(w - 236) <= 2 && Math.abs(h - 74) <= 2, `${w}x${h}`);
  check("mini shows only task + timer", await ev(`return !document.querySelector(".overlay-details") && document.querySelector(".current-task").textContent`) === "Write the intro section");
  await shot("04-mini");
  await ev(`__t.pressOverlay()`);
});

await step("expanded overlay", async () => {
  await sleep(400);
  const [w, h] = await win();
  check("window is expanded (320×268)", Math.abs(w - 320) <= 2 && Math.abs(h - 268) <= 2, `${w}x${h}`);
  check("pinned after click", await ev(`return document.querySelector(".overlay").classList.contains("pinned")`));
  await shot("05-expanded");
  await ev(`document.querySelector(".next-task").click()`);
});

await step("next-task picker", async () => {
  check("picker open with 3 options", (await ev(`return document.querySelectorAll(".next-option").length`)) === 3);
  await shot("06-next-picker");
  await ev(`[...document.querySelectorAll(".next-option")].find(b => b.textContent.includes("Review")).click()`);
});

await step("pause / +5 / resume", async () => {
  check("next task queued", (await state()).session.nextTaskId === "t2");
  check("picker closed", await ev(`return !document.querySelector(".next-picker")`));
  await ev(`__t.click("Pause")`);
  await sleep(400);
  let s = await state();
  check("paused", s.timer.pausedRemaining !== null);
  await shot("07-expanded-paused");
  await ev(`__t.click("Add 5 minutes")`);
  await sleep(300);
  s = await state();
  check("+5 extends duration to 6 min", s.timer.duration === 6 * 60000, s.timer.duration);
  await ev(`__t.click("Resume")`);
  await sleep(300);
  check("resumed", (await state()).timer.pausedRemaining === null);
  await ev(`__t.click("End")`);
  await sleep(200);
  check("end asks to confirm", await ev(`return !!__t.btn("Confirm")`));
  await sleep(3300);
  check("confirm times out", await ev(`return !__t.btn("Confirm") && !!__t.btn("End")`));
  await ev(`__t.click("Skip to break")`);
});

await step("break screen", async () => {
  await sleep(500);
  const s = await state();
  check("phase is break (short)", s.phase === "break" && s.session.pomodoros[0].breakKind === "short");
  check("focus time recorded", s.session.pomodoros[0].focusMs > 0, s.session.pomodoros[0].focusMs);
  const [w, h] = await win();
  check("window is centered card (480×640)", w === 480 && h === 640, `${w}x${h}`);
  await shot("08-break");
  await ev(`__t.click("Finished Write the intro section")`);
  await sleep(500);
  const s2 = await state();
  check("checkbox marks t1 done + pomodoro completed", s2.session.tasks[0].done && s2.session.pomodoros[0].completed === true);
  await shot("09-break-checked");
  await ev(`__t.click("Start now")`);
});

await step("auto-start with queued task", async () => {
  const s = await state();
  check("work auto-started on t2", s.phase === "work" && s.session.currentTaskId === "t2");
  await ev(`await __t.invoke("skip_phase")`);
});

await step("second break is long", async () => {
  const s = await state();
  check("long break after 2nd pomodoro", s.phase === "break" && s.session.pomodoros[1].breakKind === "long" && s.timer.duration === 15 * 60000);
  await shot("10-long-break");
  await ev(`__t.click("End break")`);
});

await step("break without queued task waits", async () => {
  const s = await state();
  check("lands on picking", s.phase === "picking");
  check("unanswered completion → false", s.session.pomodoros[1].completed === false);
  await ev(`[...document.querySelectorAll(".task-select")].find(b => b.textContent.includes("Problem set")).click()`);
});

await step("real timer expiry (≈60s)", async () => {
  check("working on t3", (await state()).session.currentTaskId === "t3");
  for (let i = 0; i < 70 && (await state()).phase === "work"; i++) await sleep(1000);
  const s = await state();
  check("timer thread moved work → break on its own", s.phase === "break");
  const p = s.session.pomodoros[2];
  check("focus ≈ 60s", Math.abs(p.focusMs - 60000) < 1500, p.focusMs);
});

await step("tray 'New session' confirmation", async () => {
  await ev(`await __t.invoke("plugin:event|emit", { event: "navigate", payload: "setup" })`);
  await sleep(500);
  check("confirm view shown", await ev(`return document.querySelector(".headline").textContent.includes("fresh")`));
  await shot("11-confirm-new");
  await ev(`__t.click("Keep going")`);
  await sleep(400);
  check("back on break", await ev(`return !!document.querySelector(".break-hero")`));
});

await step("check off all → banner → end", async () => {
  for (const t of ["t2", "t3"]) await ev(`await __t.invoke("set_task_done", { taskId: "${t}", done: true })`);
  await sleep(400);
  check("all-done banner", await ev(`return !!document.querySelector(".banner")`));
  await shot("12-all-done");
  await ev(`document.querySelector(".banner button").click()`);
});

await step("summary", async () => {
  await sleep(500);
  const s = await state();
  check("phase is summary", s.phase === "summary");
  check("stats show 3 pomodoros, 3/3", await ev(`return [...document.querySelectorAll(".stat-value")].map(e => e.textContent).join(",")`).then((v) => v.startsWith("3,") && v.endsWith("3/3")));
  check("history grew by 1", (await ev(`return (await __t.invoke("get_history")).length`)) === historyBefore + 1);
  await shot("13-summary");
  await ev(`__t.click("History")`);
});

await step("history", async () => {
  await sleep(400);
  await ev(`document.querySelector(".history-summary").click()`);
  await sleep(500);
  check("history item expands", await ev(`return !!document.querySelector(".history-details")`));
  await shot("14-history");
  await ev(`__t.click("Back")`);
});

await step("settings", async () => {
  await ev(`await __t.invoke("plugin:event|emit", { event: "navigate", payload: "settings" })`);
  await sleep(500);
  await shot("15-settings");
  const before = await ev(`return await __t.invoke("get_settings")`);
  await ev(`__t.click("Sound")`);
  await sleep(300);
  check("sound toggle persists", (await ev(`return (await __t.invoke("get_settings")).soundEnabled`)) === !before.soundEnabled);
  await ev(`__t.click("Sound")`);
  await ev(`__t.type(document.querySelector(".slider"), "60"); document.querySelector(".slider").dispatchEvent(new Event("change", { bubbles: true }))`);
  await sleep(300);
  check("opacity persists", (await ev(`return (await __t.invoke("get_settings")).overlayOpacity`)) === 0.6);
  await ev(`const b = document.querySelector(".hotkey-button"); b.focus(); b.click(); await new Promise(r => setTimeout(r, 100));
            b.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "k", code: "KeyK", ctrlKey: true, altKey: true }));`);
  await sleep(400);
  check("hotkey re-registers", (await ev(`return (await __t.invoke("get_settings")).hotkey`)) === "Ctrl+Alt+K");
  await ev(`await __t.invoke("update_settings", { settings: { ...(await __t.invoke("get_settings")), hotkey: "${before.hotkey}", overlayOpacity: ${before.overlayOpacity} } })`);
  await ev(`__t.click("Preview in corner")`);
  await sleep(900);
  const [w] = await win();
  check("corner preview shrinks to mini", Math.abs(w - 236) <= 2, w);
  await sleep(4200);
  const [w2] = await win();
  check("preview returns to settings", w2 === 480 && (await ev(`return !!document.querySelector(".theme-grid")`)), w2);
  for (const theme of ["periwinkle", "midnight", "retro", "moon-foam", "playful", "forest"]) {
    await ev(`[...document.querySelectorAll(".theme-option")].find(b => b.textContent.toLowerCase().replace(" ", "-").includes("${theme}")).click()`);
    await sleep(500);
    check(`theme ${theme} saved`, (await ev(`return (await __t.invoke("get_settings")).theme`)) === theme);
    await shot(`16-theme-${theme}`);
  }
  await ev(`__t.click("Back")`);
});

await step("new session from summary", async () => {
  await ev(`__t.click("New session")`);
  await sleep(400);
  check("back to setup", (await state()).phase === "setup");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (errors.length) console.log("Console errors:\n  " + errors.join("\n  "));
ws.close();
