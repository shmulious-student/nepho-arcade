// Input bitmask shared by sim, net codec and controls.
export const BTN = {
  LEFT: 1, RIGHT: 2, UP: 4, DOWN: 8, LIGHT: 16, HEAVY: 32, DASH: 64, SPECIAL: 128, BLOCK: 256,
} as const;

export interface InputFrame {
  held: number;
  pressed: number; // buttons newly pressed since the previous frame (edge)
}

export const EMPTY_INPUT: InputFrame = { held: 0, pressed: 0 };

export function makeInput(held: number, pressed = 0): InputFrame {
  return { held, pressed };
}

/** Builds successive InputFrames from raw "held" masks, computing press edges. */
export class InputEdge {
  private prev = 0;
  next(held: number): InputFrame {
    const pressed = held & ~this.prev;
    this.prev = held;
    return { held, pressed };
  }
  reset() { this.prev = 0; }
}
