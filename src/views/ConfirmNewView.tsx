import { DECOR, Screen } from "../components/Screen";
import { api } from "../lib/api";

/** Asked when "New session" is chosen from the tray while a session is running. */
export function ConfirmNewView({ onDone }: { onDone: () => void }) {
  const confirm = async () => {
    try {
      await api.endSession();
      await api.newSession();
    } catch (e) {
      console.error(e);
    }
    onDone();
  };

  return (
    <Screen
      decor={DECOR.summary}
      overline="New session"
      footer={
        <>
          <button className="m3-button filled large" onClick={confirm}>
            End & start new
          </button>
          <button className="m3-button text" onClick={onDone}>
            Keep going
          </button>
        </>
      }
    >
      <h1 className="headline">
        Start
        <br />
        fresh?
      </h1>
      <p className="body-large muted">
        Your current session ends now and is saved to history.
      </p>
    </Screen>
  );
}
