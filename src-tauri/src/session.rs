//! Session state machine and timer. Pure logic: time is always passed in as epoch milliseconds.
//!
//! Setup → Picking → Work → Break → (Work if a next task was picked, else Picking) … → Summary

use serde::{Deserialize, Serialize};

pub const MINUTE_MS: u64 = 60_000;
const MAX_TITLE_CHARS: usize = 200;

type Result<T> = std::result::Result<T, String>;

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    Setup,
    Picking,
    Work,
    Break,
    Summary,
}

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "lowercase")]
pub enum BreakKind {
    Short,
    Long,
}

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    pub work_minutes: u32,
    pub break_minutes: u32,
    /// A long break replaces every Nth break; 0 disables long breaks.
    pub long_break_every: u32,
    pub long_break_minutes: u32,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Pomodoro {
    pub task_id: String,
    pub work_started_at: u64,
    pub work_ended_at: Option<u64>,
    pub break_kind: Option<BreakKind>,
    pub break_ended_at: Option<u64>,
    /// Answer to "did you complete it?" during the break; unanswered counts as false.
    pub completed: Option<bool>,
    /// Time actually spent working (excludes pauses; includes extensions).
    #[serde(default)]
    pub focus_ms: u64,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub started_at: u64,
    pub ended_at: Option<u64>,
    pub config: SessionConfig,
    pub tasks: Vec<Task>,
    pub pomodoros: Vec<Pomodoro>,
    pub current_task_id: Option<String>,
    pub next_task_id: Option<String>,
    next_task_seq: u32,
}

impl Session {
    fn task(&self, id: &str) -> Option<&Task> {
        self.tasks.iter().find(|t| t.id == id)
    }

    fn task_mut(&mut self, id: &str) -> Result<&mut Task> {
        self.tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| format!("unknown task {id}"))
    }

    fn open_task(&self, id: &str) -> Result<&Task> {
        match self.task(id) {
            Some(t) if !t.done => Ok(t),
            Some(_) => Err("that task is already done".into()),
            None => Err(format!("unknown task {id}")),
        }
    }

    fn push_task(&mut self, title: &str) -> Result<String> {
        let title: String = title.trim().chars().take(MAX_TITLE_CHARS).collect();
        if title.is_empty() {
            return Err("task title is empty".into());
        }
        self.next_task_seq += 1;
        let id = format!("t{}", self.next_task_seq);
        self.tasks.push(Task {
            id: id.clone(),
            title,
            done: false,
        });
        Ok(id)
    }
}

/// Counts down to `ends_at`, or holds `paused_remaining` while paused.
#[derive(Serialize, Deserialize, Clone, Default, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Timer {
    pub ends_at: Option<u64>,
    pub paused_remaining: Option<u64>,
    /// Total length of the current phase including extensions, for progress display.
    pub duration: u64,
}

impl Timer {
    fn start(now: u64, duration: u64) -> Self {
        Self {
            ends_at: Some(now + duration),
            paused_remaining: None,
            duration,
        }
    }

    pub fn remaining(&self, now: u64) -> u64 {
        match (self.paused_remaining, self.ends_at) {
            (Some(r), _) => r,
            (None, Some(end)) => end.saturating_sub(now),
            (None, None) => 0,
        }
    }

    fn is_running(&self) -> bool {
        self.ends_at.is_some() && self.paused_remaining.is_none()
    }
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum Transition {
    WorkEnded { break_kind: BreakKind },
    BreakEnded { auto_started: bool },
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub phase: Phase,
    pub session: Option<Session>,
    pub timer: Timer,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            phase: Phase::Setup,
            session: None,
            timer: Timer::default(),
        }
    }
}

impl AppState {
    fn expect_phase(&self, allowed: &[Phase]) -> Result<()> {
        if allowed.contains(&self.phase) {
            Ok(())
        } else {
            Err(format!("not allowed during {:?}", self.phase))
        }
    }

    fn session_mut(&mut self) -> Result<&mut Session> {
        self.session.as_mut().ok_or_else(|| "no active session".into())
    }

    pub fn start_session(&mut self, now: u64, titles: &[String], config: SessionConfig) -> Result<()> {
        self.expect_phase(&[Phase::Setup, Phase::Summary])?;
        if config.work_minutes == 0 || config.break_minutes == 0 || config.long_break_minutes == 0 {
            return Err("durations must be at least 1 minute".into());
        }
        let mut session = Session {
            id: now.to_string(),
            started_at: now,
            ended_at: None,
            config,
            tasks: Vec::new(),
            pomodoros: Vec::new(),
            current_task_id: None,
            next_task_id: None,
            next_task_seq: 0,
        };
        for title in titles.iter().filter(|t| !t.trim().is_empty()) {
            session.push_task(title)?;
        }
        if session.tasks.is_empty() {
            return Err("add at least one task".into());
        }
        self.session = Some(session);
        self.phase = Phase::Picking;
        self.timer = Timer::default();
        Ok(())
    }

    pub fn pick_task(&mut self, now: u64, task_id: &str) -> Result<()> {
        self.expect_phase(&[Phase::Picking])?;
        self.start_work(now, task_id)
    }

    fn start_work(&mut self, now: u64, task_id: &str) -> Result<()> {
        let session = self.session_mut()?;
        session.open_task(task_id)?;
        session.pomodoros.push(Pomodoro {
            task_id: task_id.to_string(),
            work_started_at: now,
            work_ended_at: None,
            break_kind: None,
            break_ended_at: None,
            completed: None,
            focus_ms: 0,
        });
        session.current_task_id = Some(task_id.to_string());
        session.next_task_id = None;
        let duration = u64::from(session.config.work_minutes) * MINUTE_MS;
        self.timer = Timer::start(now, duration);
        self.phase = Phase::Work;
        Ok(())
    }

    pub fn set_next_task(&mut self, task_id: Option<&str>) -> Result<()> {
        self.expect_phase(&[Phase::Work, Phase::Break])?;
        let in_work = self.phase == Phase::Work;
        let session = self.session_mut()?;
        if let Some(id) = task_id {
            session.open_task(id)?;
            if in_work && session.current_task_id.as_deref() == Some(id) {
                return Err("that's the task you're working on".into());
            }
        }
        session.next_task_id = task_id.map(str::to_string);
        Ok(())
    }

    /// Marks a task done/not done. If it's the task of the pomodoro that just finished, this is
    /// also the answer to "did you complete it?".
    pub fn set_task_done(&mut self, task_id: &str, done: bool) -> Result<()> {
        self.expect_phase(&[Phase::Picking, Phase::Work, Phase::Break])?;
        let session = self.session_mut()?;
        session.task_mut(task_id)?.done = done;
        if let Some(last) = session.pomodoros.last_mut() {
            if last.task_id == task_id && last.work_ended_at.is_some() {
                last.completed = Some(done);
            }
        }
        if done && session.next_task_id.as_deref() == Some(task_id) {
            session.next_task_id = None;
        }
        Ok(())
    }

    pub fn add_task(&mut self, title: &str) -> Result<String> {
        self.expect_phase(&[Phase::Picking, Phase::Break])?;
        self.session_mut()?.push_task(title)
    }

    pub fn remove_task(&mut self, task_id: &str) -> Result<()> {
        self.expect_phase(&[Phase::Picking, Phase::Break])?;
        let session = self.session_mut()?;
        if session.pomodoros.iter().any(|p| p.task_id == task_id) {
            return Err("this task already has pomodoros — check it off instead".into());
        }
        let before = session.tasks.len();
        session.tasks.retain(|t| t.id != task_id);
        if session.tasks.len() == before {
            return Err(format!("unknown task {task_id}"));
        }
        if session.next_task_id.as_deref() == Some(task_id) {
            session.next_task_id = None;
        }
        Ok(())
    }

    pub fn pause(&mut self, now: u64) -> Result<()> {
        self.expect_phase(&[Phase::Work, Phase::Break])?;
        if self.timer.is_running() {
            self.timer.paused_remaining = Some(self.timer.remaining(now));
        }
        Ok(())
    }

    pub fn resume(&mut self, now: u64) -> Result<()> {
        self.expect_phase(&[Phase::Work, Phase::Break])?;
        if let Some(remaining) = self.timer.paused_remaining.take() {
            self.timer.ends_at = Some(now + remaining);
        }
        Ok(())
    }

    pub fn extend(&mut self, minutes: u32) -> Result<()> {
        self.expect_phase(&[Phase::Work, Phase::Break])?;
        let extra = u64::from(minutes) * MINUTE_MS;
        self.timer.duration += extra;
        match (&mut self.timer.paused_remaining, &mut self.timer.ends_at) {
            (Some(r), _) => *r += extra,
            (None, Some(end)) => *end += extra,
            (None, None) => {}
        }
        Ok(())
    }

    pub fn skip(&mut self, now: u64) -> Result<Transition> {
        self.expect_phase(&[Phase::Work, Phase::Break])?;
        self.advance(now)
    }

    /// Advances the phase if the running timer has run out.
    pub fn tick(&mut self, now: u64) -> Option<Transition> {
        let due = matches!(self.phase, Phase::Work | Phase::Break)
            && self.timer.is_running()
            && self.timer.remaining(now) == 0;
        if due {
            self.advance(now).ok()
        } else {
            None
        }
    }

    fn advance(&mut self, now: u64) -> Result<Transition> {
        match self.phase {
            Phase::Work => {
                let focus = self.timer.duration.saturating_sub(self.timer.remaining(now));
                let session = self.session_mut()?;
                let finished = session.pomodoros.len() as u32;
                let every = session.config.long_break_every;
                let kind = if every > 0 && finished % every == 0 {
                    BreakKind::Long
                } else {
                    BreakKind::Short
                };
                let minutes = match kind {
                    BreakKind::Long => session.config.long_break_minutes,
                    BreakKind::Short => session.config.break_minutes,
                };
                if let Some(p) = session.pomodoros.last_mut() {
                    p.work_ended_at = Some(now);
                    p.focus_ms = focus;
                    p.break_kind = Some(kind);
                    let task_done = session
                        .tasks
                        .iter()
                        .any(|t| t.id == p.task_id && t.done);
                    if task_done {
                        p.completed = Some(true);
                    }
                }
                self.timer = Timer::start(now, u64::from(minutes) * MINUTE_MS);
                self.phase = Phase::Break;
                Ok(Transition::WorkEnded { break_kind: kind })
            }
            Phase::Break => {
                let session = self.session_mut()?;
                if let Some(p) = session.pomodoros.last_mut() {
                    p.break_ended_at = Some(now);
                    p.completed.get_or_insert(false);
                }
                session.current_task_id = None;
                let next = session
                    .next_task_id
                    .clone()
                    .filter(|id| session.open_task(id).is_ok());
                match next {
                    Some(id) => {
                        self.start_work(now, &id)?;
                        Ok(Transition::BreakEnded { auto_started: true })
                    }
                    None => {
                        self.session_mut()?.next_task_id = None;
                        self.timer = Timer::default();
                        self.phase = Phase::Picking;
                        Ok(Transition::BreakEnded { auto_started: false })
                    }
                }
            }
            _ => Err(format!("nothing to advance during {:?}", self.phase)),
        }
    }

    /// Ends the session and returns it for the history.
    pub fn end_session(&mut self, now: u64) -> Result<Session> {
        self.expect_phase(&[Phase::Picking, Phase::Work, Phase::Break])?;
        let phase = self.phase;
        let focus = self.timer.duration.saturating_sub(self.timer.remaining(now));
        let session = self.session_mut()?;
        if let Some(p) = session.pomodoros.last_mut() {
            match phase {
                Phase::Work => {
                    p.work_ended_at = Some(now);
                    p.focus_ms = focus;
                }
                Phase::Break => p.break_ended_at = Some(now),
                _ => {}
            }
            if p.work_ended_at.is_some() {
                p.completed.get_or_insert(false);
            }
        }
        session.ended_at = Some(now);
        session.current_task_id = None;
        session.next_task_id = None;
        let finished = session.clone();
        self.timer = Timer::default();
        self.phase = Phase::Summary;
        Ok(finished)
    }

    pub fn new_session(&mut self) -> Result<()> {
        self.expect_phase(&[Phase::Setup, Phase::Summary])?;
        *self = AppState::default();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const CONFIG: SessionConfig = SessionConfig {
        work_minutes: 25,
        break_minutes: 5,
        long_break_every: 2,
        long_break_minutes: 15,
    };

    fn started(titles: &[&str]) -> AppState {
        let mut s = AppState::default();
        let titles: Vec<String> = titles.iter().map(|t| t.to_string()).collect();
        s.start_session(0, &titles, CONFIG).unwrap();
        s
    }

    fn session(s: &AppState) -> &Session {
        s.session.as_ref().unwrap()
    }

    #[test]
    fn start_requires_a_task_and_skips_blank_lines() {
        let mut s = AppState::default();
        assert!(s.start_session(0, &["  ".into()], CONFIG).is_err());
        let s = started(&["a", "", "  b  "]);
        assert_eq!(s.phase, Phase::Picking);
        let titles: Vec<_> = session(&s).tasks.iter().map(|t| t.title.as_str()).collect();
        assert_eq!(titles, ["a", "b"]);
    }

    #[test]
    fn work_ends_into_break_and_waits_without_next_task() {
        let mut s = started(&["a", "b"]);
        s.pick_task(0, "t1").unwrap();
        assert_eq!(s.tick(25 * MINUTE_MS - 1), None);
        assert_eq!(
            s.tick(25 * MINUTE_MS),
            Some(Transition::WorkEnded { break_kind: BreakKind::Short })
        );
        assert_eq!(s.phase, Phase::Break);
        assert_eq!(
            s.tick(30 * MINUTE_MS),
            Some(Transition::BreakEnded { auto_started: false })
        );
        assert_eq!(s.phase, Phase::Picking);
        // Unanswered completion counts as not done.
        assert_eq!(session(&s).pomodoros[0].completed, Some(false));
        assert!(!session(&s).tasks[0].done);
    }

    #[test]
    fn break_auto_starts_when_next_task_picked() {
        let mut s = started(&["a", "b"]);
        s.pick_task(0, "t1").unwrap();
        s.set_next_task(Some("t2")).unwrap();
        s.skip(MINUTE_MS).unwrap();
        s.set_task_done("t1", true).unwrap();
        assert_eq!(
            s.skip(2 * MINUTE_MS),
            Ok(Transition::BreakEnded { auto_started: true })
        );
        assert_eq!(s.phase, Phase::Work);
        assert_eq!(session(&s).current_task_id.as_deref(), Some("t2"));
        assert_eq!(session(&s).pomodoros[0].completed, Some(true));
    }

    #[test]
    fn cannot_queue_current_or_done_task() {
        let mut s = started(&["a", "b"]);
        s.pick_task(0, "t1").unwrap();
        assert!(s.set_next_task(Some("t1")).is_err());
        s.set_task_done("t2", true).unwrap();
        assert!(s.set_next_task(Some("t2")).is_err());
    }

    #[test]
    fn every_nth_break_is_long() {
        let mut s = started(&["a"]);
        s.pick_task(0, "t1").unwrap();
        s.skip(1).unwrap();
        s.skip(2).unwrap();
        s.pick_task(3, "t1").unwrap();
        assert_eq!(s.skip(4), Ok(Transition::WorkEnded { break_kind: BreakKind::Long }));
        assert_eq!(s.timer.duration, 15 * MINUTE_MS);
    }

    #[test]
    fn pause_resume_and_extend_keep_remaining_time() {
        let mut s = started(&["a"]);
        s.pick_task(0, "t1").unwrap();
        s.pause(10 * MINUTE_MS).unwrap();
        assert_eq!(s.tick(60 * MINUTE_MS), None);
        assert_eq!(s.timer.remaining(60 * MINUTE_MS), 15 * MINUTE_MS);
        s.extend(5).unwrap();
        s.resume(60 * MINUTE_MS).unwrap();
        assert_eq!(s.timer.remaining(60 * MINUTE_MS), 20 * MINUTE_MS);
        assert_eq!(s.timer.duration, 30 * MINUTE_MS);
        // Paused time doesn't count as focus.
        s.tick(80 * MINUTE_MS);
        assert_eq!(session(&s).pomodoros[0].focus_ms, 30 * MINUTE_MS);
    }

    #[test]
    fn remove_only_unworked_tasks() {
        let mut s = started(&["a", "b"]);
        s.pick_task(0, "t1").unwrap();
        s.skip(1).unwrap();
        assert!(s.remove_task("t1").is_err());
        s.set_next_task(Some("t2")).unwrap();
        s.remove_task("t2").unwrap();
        assert_eq!(session(&s).next_task_id, None);
    }

    #[test]
    fn long_titles_are_capped() {
        let s = started(&[&"x".repeat(5000)]);
        assert_eq!(session(&s).tasks[0].title.chars().count(), MAX_TITLE_CHARS);
    }

    #[test]
    fn end_session_closes_the_open_pomodoro() {
        let mut s = started(&["a"]);
        s.pick_task(0, "t1").unwrap();
        let done = s.end_session(MINUTE_MS).unwrap();
        assert_eq!(s.phase, Phase::Summary);
        assert_eq!(done.ended_at, Some(MINUTE_MS));
        assert_eq!(done.pomodoros[0].work_ended_at, Some(MINUTE_MS));
        assert_eq!(done.pomodoros[0].completed, Some(false));
        assert_eq!(done.pomodoros[0].focus_ms, MINUTE_MS);
        s.new_session().unwrap();
        assert_eq!(s, AppState::default());
    }
}
