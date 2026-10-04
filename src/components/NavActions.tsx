import { Icon } from "./Icon";
import type { OverlayView } from "../lib/types";

/** History + settings icon buttons for card headers. */
export function NavActions({ onOpen }: { onOpen: (view: OverlayView) => void }) {
  return (
    <>
      <button className="icon-button standard" aria-label="History" onClick={() => onOpen("history")}>
        <Icon name="history" size={20} />
      </button>
      <button className="icon-button standard" aria-label="Settings" onClick={() => onOpen("settings")}>
        <Icon name="tune" size={20} />
      </button>
    </>
  );
}
