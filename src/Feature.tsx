import { useMemo, useState } from "react";
import {
  MeshNameInput,
  useNamedPeer,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

export const ENERGY_LEVELS = [
  { value: 0, label: "At capacity", detail: "I need quiet time.", icon: "◌" },
  { value: 1, label: "Low", detail: "Keep it gentle.", icon: "◔" },
  { value: 2, label: "Steady", detail: "I am here, lightly.", icon: "◑" },
  { value: 3, label: "Open", detail: "Happy to connect.", icon: "◕" },
  { value: 4, label: "Charged", detail: "Bring me in!", icon: "●" },
] as const;

export type CheckIn = {
  id: string;
  peerId: string;
  name: string;
  level: number;
  note: string;
  updatedAt: number;
};

const MAX_NOTE_LENGTH = 140;

export function isValidCheckIn(value: unknown): value is CheckIn {
  const entry = value as Partial<CheckIn>;
  return Boolean(
    entry &&
    typeof entry.id === "string" &&
    /^[a-zA-Z0-9_-]{6,128}$/.test(entry.id) &&
    typeof entry.peerId === "string" &&
    /^[a-zA-Z0-9_-]{6,128}$/.test(entry.peerId) &&
    typeof entry.name === "string" &&
    entry.name.trim().length >= 1 &&
    entry.name.length <= 48 &&
    Number.isInteger(entry.level) &&
    (entry.level ?? -1) >= 0 &&
    (entry.level ?? 5) < ENERGY_LEVELS.length &&
    typeof entry.note === "string" &&
    entry.note.length <= MAX_NOTE_LENGTH &&
    Number.isFinite(entry.updatedAt),
  );
}

function levelFor(level: number) {
  return ENERGY_LEVELS[level] ?? ENERGY_LEVELS[2];
}

export function Feature({ room, config }: Props) {
  const { name, setName, myName } = useNamedPeer(config, room);
  const [level, setLevel] = useState(2);
  const [note, setNote] = useState("");
  const checkIns = useSharedCollection<CheckIn>(room, "mesh-social-battery:checkins", {
    validate: isValidCheckIn,
  });
  const entries = useMemo(
    () =>
      [...checkIns.items].sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name)),
    [checkIns.items],
  );
  const mine = room ? checkIns.byId(room.peerId) : undefined;

  const publish = () => {
    if (!room || !myName) return;
    const next: CheckIn = {
      id: room.peerId,
      peerId: room.peerId,
      name: myName.slice(0, 48),
      level,
      note: note.trim().slice(0, MAX_NOTE_LENGTH),
      updatedAt: Date.now(),
    };
    if (mine) checkIns.update(room.peerId, next);
    else checkIns.add(next);
  };

  if (!room) {
    return (
      <main className="battery">
        <h1>How much social energy do you have?</h1>
        <p role="status">Joining your shared check-in room…</p>
      </main>
    );
  }

  return (
    <main className="battery">
      <header className="battery-hero">
        <p className="eyebrow">A low-pressure check-in</p>
        <h1>How much social energy do you have?</h1>
        <p>Share a momentary signal with this room—no accounts, scores, or tracking.</p>
      </header>
      <section className="checkin" aria-labelledby="checkin-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your signal</p>
            <h2 id="checkin-title">Check in when it feels right</h2>
          </div>
          {mine && <span className="saved">Shared</span>}
        </div>
        <MeshNameInput
          value={name}
          onChange={setName}
          ariaLabel="Your display name"
          placeholder="Your name"
          maxLength={48}
          showCounter
          hint="A name helps friends read the room. It is shared only with people in this room."
        />
        <fieldset>
          <legend>Choose your social energy</legend>
          <div className="energy-options">
            {ENERGY_LEVELS.map((option) => (
              <button
                className={`energy-option ${level === option.value ? "selected" : ""}`}
                type="button"
                key={option.value}
                aria-pressed={level === option.value}
                onClick={() => setLevel(option.value)}
              >
                <span aria-hidden="true" className="energy-icon">
                  {option.icon}
                </span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <p className="selection-detail" aria-live="polite">
            {levelFor(level).detail}
          </p>
        </fieldset>
        <label className="note-label">
          A short note <span>(optional)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE_LENGTH))}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="e.g. Up for a walk later"
            rows={3}
          />
        </label>
        <div className="actions">
          <button className="publish" onClick={publish} disabled={!name.trim()}>
            {mine ? "Update my check-in" : "Share my check-in"}
          </button>
          {mine && (
            <button className="quiet" onClick={() => checkIns.remove(room.peerId)}>
              Remove mine
            </button>
          )}
        </div>
      </section>
      <section className="room-list" aria-labelledby="room-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The room</p>
            <h2 id="room-title">
              {entries.length} {entries.length === 1 ? "check-in" : "check-ins"}
            </h2>
          </div>
          <p role="status" aria-live="polite">
            Updates appear here for everyone in this room.
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="empty">
            No signals yet. A first check-in makes it easier for others to join in.
          </p>
        ) : (
          <ol className="checkin-list">
            {entries.map((entry) => {
              const option = levelFor(entry.level);
              return (
                <li key={entry.id}>
                  <span className={`level level-${entry.level}`} aria-hidden="true">
                    {option.icon}
                  </span>
                  <div>
                    <strong>{entry.name}</strong>
                    <p>
                      {option.label} <span>· {option.detail}</span>
                    </p>
                    {entry.note && <blockquote>{entry.note}</blockquote>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <footer className="privacy-note">
        Your check-in is shared directly with this room and stays until you update or remove it. Be
        kind: this is an invitation to respect boundaries, not to interpret them for someone else.
      </footer>
    </main>
  );
}
