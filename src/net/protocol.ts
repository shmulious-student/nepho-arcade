// JSON control messages exchanged over the WebSocket relay (server/index.mjs). The relay is a
// transparent two-peer forwarder, so the same message union is sent and received by both host and
// guest; only 'create'/'join' are special-cased server-side to assign room codes and slots. Binary
// snapshot/input frames use codec.ts instead — these are the infrequent, human-readable messages.
import type { HeroId } from '../sim/types';

export type Msg =
  | { t: 'create' }
  | { t: 'join'; code: string }
  | { t: 'room'; code: string; slot: number }
  | { t: 'peer'; slot: number; joined: boolean }
  | { t: 'hero'; slot: number; id: HeroId }
  | { t: 'start'; seed: number; level: number; heroes: [HeroId, HeroId | null] }
  | { t: 'sync'; score: [number, number]; credits: number; lives: [number, number] }
  | { t: 'error'; message: string };
