// Add one entry per typo you catch yourself making.
// "typo"    -> what you actually typed (this is what the player guesses)
//              MUST be exactly 5 letters — the board is fixed at 5 tiles wide.
// "correct" -> what you meant to type (shown in the pop-up, any length is fine)
//
// The game picks one entry per calendar day, in order, and loops back
// to the start once it runs out — so it's fine to only have a handful
// to start with. Add new ones to the bottom whenever you catch a new typo.

const TYPO_LIST = [
  { typo: "gping", correct: "going" },
  { typo: "wrold", correct: "world" },
  { typo: "thier", correct: "their" },
  { typo: "wierd", correct: "weird" },
  { typo: "thnak", correct: "thank" },
  { typo: "makig", correct: "making" },
  { typo: "udate", correct: "update" },
];
