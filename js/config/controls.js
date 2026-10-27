// Oplà touch pads (00-04) and what they do.

export const PAD = { prev: 0, buy: 1, main: 2, next: 4 };

/** Pads used to pick a level-up card, in card order. Pad 02 is kept for the Nova. */
export const UPGRADE_PADS = [0, 1, 3, 4];

/** Hold a pad this long to pick a level-up card, so a stray touch while tilting can't choose. Also in the sketch. */
export const HOLD_MS = 2000;

export const padLabel = n => String(n).padStart(2, '0');

// Where each pad sits as you look at the board. Upright, the pads arc over the top of the
// screen with 00 on the left; held upside down the arc becomes a smile and left/right swap.
const POSITIONS = ['ol', 'il', 'mid', 'ir', 'or'];   // outer-left, inner-left, middle, inner-right, outer-right
export const padPosition = (n, upsideDown) => POSITIONS[upsideDown ? 4 - n : n];
