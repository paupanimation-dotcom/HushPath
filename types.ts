
// Definitive types for Paupalandia RPG

/**
 * Represents a single entry in the player's journal/quest log.
 */
export interface JournalEntry {
  id: string;
  turn: number;
  title: string;
  description: string;
  type: 'location' | 'character' | 'event' | 'combat';
}

/**
 * Represents a single panel in the Story Mode comic view.
 */
export interface StoryPanel {
  id: string;
  turn: number;
  location: string;
  action?: string; // What the user did to trigger this
  narrative: string; // The AI response text
  art?: string; // Snapshot of the scene art at this moment
  timestamp: number;
}

/**
 * Represents the current state of the player in the game world.
 */
export interface PlayerState {
  name: string;
  class: string;
  appearance: string;
  characterDescription: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  gold: number;
  location: string;
  inventory: string[];
  statusEffects: string[];
  turn: number;
  journal: JournalEntry[];
}

/**
 * Represents the structured response from the Gemini model.
 */
export interface GameResponse {
  narrative: string;
  visualDescription?: string;
  visualArt?: string; // New field for direct ASCII data
  mapArt?: string; // New field for ASCII map
  mapCoordinates?: { x: number; y: number }; // Grid coordinates for the map
  playerState: PlayerState;
  suggestedActions: string[];
  requiresChoice: boolean;
  gameOver: boolean;
}

/**
 * Represents a log entry to be displayed in the game console.
 */
export interface LogEntry {
  id: string;
  type: 'narrative' | 'user' | 'ascii' | 'system';
  content: string;
  caption?: string;
  isTyping?: boolean;
}

/**
 * Possible screens/states of the game application.
 */
export enum GameStatus {
  INTRO,
  GENRE_SELECTION,
  CREATION,
  LOADING,
  PLAYING,
  GAME_OVER
}
