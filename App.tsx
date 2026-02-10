import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { startNewGame, performAction, getAscii, getPortraitAscii, setGameGenre, getOllamaUrl } from './services/storyEngine';
import { generateAsciiFromPrompt, DEFAULT_SCENE_SETTINGS, DEFAULT_PORTRAIT_SETTINGS } from './services/asciiImageService';
import { GameResponse, GameStatus, LogEntry, PlayerState, StoryPanel } from './types';
import { StatBar } from './components/StatBar';
import { LogEntry as LogEntryComp } from './components/LogEntry';
import { unlockAudio, playBlip } from './components/Typewriter';
import { GenreFrame } from './components/GenreFrame';
import { SceneDisplay } from './components/SceneDisplay';
import { AsciiFrame, AsciiSeparator, VerticalAsciiSeparator } from './components/AsciiBorders';
import { AsciiLoader } from './components/AsciiLoader';
import { InteractiveMap } from './components/InteractiveMap';
import { StoryView } from './components/StoryView';
import { AiSetupOverlay } from './components/AiSetupOverlay';
import { OllamaRequiredOverlay } from './components/OllamaRequiredOverlay';

const INITIAL_PLAYER: PlayerState = {
  name: "Traveler", class: "Unknown", appearance: "Hooded", characterDescription: "A mystery",
  hp: 20, maxHp: 20, mana: 10, maxMana: 10, level: 1, xp: 0, gold: 0, location: "The Void",
  inventory: [], statusEffects: [], turn: 0, journal: []
};

// Cave Face Path ASCII Logo
const ASCII_LOGO = [
"               .    _           .      .    ",
"        .        .-' '-.     .              ",
"             _.-'       '-._      .         ",
"      .     /   _       _   \\          .    ",
"           |   ( )     ( )   |              ",
"           |        |        |    .         ",
"    .      |        ^        |              ",
"            \\      ___      /        .      ",
"             '.   |   |   .'                ",
"       .       '-.|___|.-'      .           ",
"                 /     \\                    ",
"        .       /   |   \\    .              ",
"               /    |    \\        .         ",
"              /     |     \\                 ",
"      .      /      |      \\    .           ",
"            /       |       \\         .     "
].join('\n');

// HUSHPATH Title ASCII - UPDATED FOR CLEARER 'H'
const ASCII_TITLE = [
" _   _   _   _   ____    _   _   ____      _     _____   _   _ ",
"| | | | | | | | / ___|  | | | | |  _ \\    / \\   |_   _| | | | |",
"| |_| | | | | | \\___ \\  | |_| | | |_) |  / _ \\    | |   | |_| |",
"|  _  | | |_| |  ___) | |  _  | |  __/  / ___ \\   | |   |  _  |",
"|_| |_|  \\___/  |____/  |_| |_| |_|    /_/   \\_\\  |_|   |_| |_|"
].join('\n');

const TAGLINES = [
  "CREATING WORLDS, ONE BAD DECISION AT A TIME.",
  "THE IMAGINATION DEPARTMENT IS OPEN LATE.",
  "UNLIMITED REALITIES. LIMITED COMMON SENSE.",
  "THIS STORY HAS TEETH.",
  "DREAMS, NOW WITH INVENTORY MANAGEMENT.",
  "YOUR WEIRDEST THOUGHTS JUST GOT HOUSING.",
  "WELCOME TO THE UNLIKELY.",
  "SOMETHING BEAUTIFUL IS ABOUT TO GO WRONG.",
  "THE UNKNOWN REQUESTED YOUR ATTENTION.",
  "FANTASY: UNFILTERED.",
  "HORROR: HANDCRAFTED.",
  "TRUTH SOLD SEPARATELY.",
  "REALITY CALLED, WE LET IT RING.",
  "THE LIMITS ARE OFFLINE.",
  "MONSTERS INCLUDED. MORALS NOT INCLUDED.",
  "EXPECT WONDER. PACK REGRET.",
  "THE RULEBOOK IS A SUGGESTION.",
  "EVERY MIRACLE COMES WITH FINE PRINT.",
  "YOUR LUCK HAS ENTERED THE CHAT.",
  "THE VOID HAS A SENSE OF HUMOR.",
  "A SMALL STEP FOR YOU. A BIG MESS FOR EVERYTHING ELSE.",
  "SOMEONE LEFT THE PORTAL UNATTENDED.",
  "THE map WON’T HELP, BUT IT WILL JUDGE.",
  "MAKE BELIEVE, MAKE IT WORSE, MAKE IT LEGENDARY.",
  "THIS UNIVERSE IS UNDER NEW MANAGEMENT.",
  "NARRATIVE INSTABILITY DETECTED.",
  "PROCEEDING WITHOUT A SAFETY NET.",
  "THE BEST IDEAS ARRIVE AFTER MIDNIGHT.",
  "THE WORST IDEAS ARRIVE FIRST.",
  "NOTHING IS IMPOSSIBLE, SOME THINGS ARE JUST RUDE.",
  "YOUR FEARS HAVE UNIONIZED.",
  "YOUR HOPES HAVE WEAPONS NOW.",
  "A FAIRYTALE WITH A CRACKED SCREEN.",
  "THE LEGENDS ARE GLITCHING AGAIN.",
  "THIS SCRIPT WAS NEVER APPROVED.",
  "SUSPICIOUSLY GOOD TIMING.",
  "BEHOLD: THE UNREASONABLE.",
  "THE DARK HAS A PUNCHLINE.",
  "THE LIGHT IS OVERCONFIDENT.",
  "WELCOME TO THE PART THAT WAS CUT.",
  "BONUS CONTENT: EXISTENTIAL DREAD.",
  "SIDE EFFECTS MAY INCLUDE HEROISM.",
  "DOOM WITH A SMILEY FACE.",
  "MYTHOLOGY, BUT WITH RECEIPTS.",
  "ANCIENT EVIL, MODERN INTERFACE.",
  "THE PAST IS PATCHED. THE FUTURE IS BETA.",
  "SOME STORIES SHOULD’VE STAYED SCRATCHED OUT.",
  "THE UNIMAGINABLE IS TAKING WALK-INS.",
  "FATE JUST TURNED ITS HEAD.",
  "THE COSMOS IS MAKING EYE CONTACT.",
  "YOU FOUND THE DOOR BEHIND THE DOOR.",
  "THE DUNGEON IS LISTENING POLITELY.",
  "HEROES WANTED. STABILITY OPTIONAL.",
  "VILLAINS WELCOME. CHARISMA REQUIRED.",
  "THIS QUEST IS UNPAID INTERN WORK.",
  "THE PROPHECY IS A DRAFT.",
  "THE DRAGON FILED A COMPLAINT.",
  "THE SPELLCHECK IS POSSESSED.",
  "A THOUSAND WORLDS, NONE OF THEM NORMAL.",
  "THE IMAGINATION WANTS YOUR PASSWORD.",
  "CURIOSITY: ENABLED.",
  "THE VOID IS REQUESTING A FEATURE UPDATE.",
  "YOUR INNER DEMONS BROUGHT FRIENDS.",
  "THE MIRROR HAS NEW CONTENT.",
  "THIS TALE COMES WITH SHARP CORNERS.",
  "A STORY YOU CAN’T UNTHINK.",
  "SOMETHING OLD IS TRYING TO BE NEW.",
  "SOMETHING NEW IS TRYING TO BE ANCIENT.",
  "THE LEGEND STARTS IN A BAD MOOD.",
  "THE VIBE IS CURSED (AFFECTIONATE).",
  "THE UNIVERSE IS ON AIRPLANE MODE.",
  "THE MONSTER IS VERY “PROBLEM SOLVER” CODED.",
  "THIS REALITY IS SPONSORED BY BAD IDEAS.",
  "STORY SEED: CONTAMINATED.",
  "THE NIGHT SHIFT CLOCKED IN EARLY.",
  "TODAY’S FORECAST: UNLIKELY.",
  "YOUR DESTINY HAS A TYPO.",
  "THE PLOT IS ARMED AND UNSUPERVISED.",
  "THE BACKSTORY IS TOO REAL.",
  "BEAUTY, TERROR, AND A LITTLE BIT OF ADMIN.",
  "THE AFTERLIFE IS CURRENTLY EXPERIENCING HIGH VOLUME.",
  "THIS WORLD RUNS ON VIBES AND POOR DECISIONS.",
  "HAPPINESS AVAILABLE IN LIMITED QUANTITIES.",
  "THE UNSEEN IS DOING GREAT, THANKS FOR ASKING.",
  "THE GODS ARE OFFLINE. TRY AGAIN NEVER.",
  "THE CURSE IS COSMETIC (PROBABLY).",
  "YOUR LEGEND IS LOADING… SLOWLY… ON PURPOSE.",
  "THE NIGHTMARE HAS GOOD TASTE.",
  "THE DREAM IS OVERQUALIFIED.",
  "YOUR INNER CHILD BROUGHT A KNIFE (METAPHORICALLY).",
  "THIS IS WHAT HAPPENS WHEN YOU LET THOUGHTS ROAM FREE.",
  "THE IMPOSSIBLE IS OUT OF OFFICE. LEAVE A MESSAGE.",
  "THE ABSURD IS ACCEPTING APPLICATIONS.",
  "THE WORLD IS READY TO MISUNDERSTAND YOU.",
  "THE UNIVERSE HAS TURNED AUTO-COMPLETE ON.",
  "YOUR WILDEST IDEAS JUST GOT A HEALTH BAR.",
  "THE STRANGEST ENTITIES ARE VERY WELL-MANNERED.",
  "EVERYTHING YOU CAN IMAGINE PLUS THE THINGS YOU CAN’T ADMIT."
];

const ALL_GENRES: Record<string, string[]> = {
  "Core Genres": [
    "Action", "Adventure", "Comedy", "Crime", "Drama", "Fantasy", 
    "Horror", "Mystery", "Romance", "Science Fiction (Sci-Fi)", 
    "Thriller", "Western", "War", "Family", "Animation", "Documentary"
  ],
  "Action & Adventure": [
    "Martial arts", "Superhero", "Spy / espionage", "Heist", 
    "Disaster", "Survival", "Military / special ops", "Swashbuckler", 
    "Pirate", "Treasure hunt", "Road adventure"
  ],
  "Comedy": [
    "Dark comedy / black comedy", "Satire", "Parody / spoof", "Slapstick", 
    "Screwball", "Romantic comedy", "Buddy comedy", "Stoner comedy", 
    "Gross-out comedy", "Mockumentary", "Sketch / anthology comedy"
  ],
  "Drama": [
    "Coming-of-age", "Period drama", "Historical drama", "Political drama", 
    "Legal / courtroom drama", "Medical drama", "Sports drama", "Family drama", 
    "Romantic drama", "Crime drama", "Melodrama", "Social-issue drama", "Workplace drama"
  ],
  "Crime & Mystery": [
    "Detective", "Whodunit", "Police procedural", "Gangster / mafia", 
    "Noir / neo-noir", "True crime", "Serial killer", "Conspiracy", 
    "Courtroom / legal thriller"
  ],
  "Horror": [
    "Supernatural horror", "Psychological horror", "Slasher", "Monster", 
    "Creature feature", "Zombie", "Vampire", "Werewolf", "Demonic / possession", 
    "Occult / folk horror", "Body horror", "Found footage", "Haunted house", 
    "Cosmic / Lovecraftian", "Horror comedy", "Giallo"
  ],
  "Thriller": [
    "Psychological thriller", "Political thriller", "Legal thriller", 
    "Spy thriller", "Tech thriller", "Erotic thriller", "Action thriller", 
    "Survival thriller", "Home-invasion thriller"
  ],
  "Sci-Fi": [
    "Space opera", "Hard sci-fi", "Cyberpunk", "Steampunk", 
    "Dystopian / post-apocalyptic", "Time travel", "Alien invasion / first contact", 
    "Military sci-fi", "Techno-thriller", "AI / robot", 
    "Virtual reality / simulation", "Biopunk", "Climate / eco sci-fi"
  ],
  "Fantasy": [
    "Epic / high fantasy", "Dark fantasy", "Urban fantasy", "Sword & sorcery", 
    "Mythic / fairy-tale", "Magical realism", "Portal fantasy"
  ],
  "Romance": [
    "Romantic comedy", "Romantic drama", "Historical romance", "Teen romance", 
    "Tragic romance", "LGBTQ+ romance"
  ],
  "Animation": [
    "2D animation", "3D / CGI", "Stop-motion", "Anime", 
    "Adult animation", "Kids / family animation"
  ],
  "Documentary": [
    "Biographical / portrait", "Nature / wildlife", "Science / technology", 
    "History", "Political / social issues", "True crime documentary", 
    "Sports documentary", "Music documentary", "Travel", 
    "Docudrama / reenactment", "Mockumentary (comedy)"
  ],
  "Other": [
    "Musical", "Music / concert film", "Biopic", "Historical", 
    "Religious / biblical", "Experimental / avant-garde", "Art house", 
    "Anthology", "Short film", "Silent film"
  ],
  "Hybrids": [
    "Action comedy", "Horror comedy", "Sci-fi horror", "Romantic thriller", 
    "Musical comedy/drama", "Fantasy adventure", "Crime thriller", 
    "Mystery thriller", "War drama"
  ]
};

const GENRE_PLACEHOLDERS: Record<string, string> = {
  "High Fantasy": "A weary knight with a rusted shield...",
  "Cyberpunk": "A street samurai with chrome arms and a grudge...",
  "Eldritch Horror": "A private eye clutching a forbidden tome...",
  "Hard Sci-Fi": "A void-miner in a battered exo-suit...",
};

export default function App() {
  const [aiChecked, setAiChecked] = useState(false);
  const [aiReady, setAiReady] = useState(false);

  // AI bootstrap:
  // - Desktop builds: use bundled local installers (AiSetupOverlay).
  // - Web builds (GitHub Pages): require Ollama running locally.
  useEffect(() => {
    (async () => {
      try {
        // Desktop build
        if (window.hushpathDesktop?.aiStatus) {
          const st = await window.hushpathDesktop.aiStatus();
          setAiReady(!!st.ok);
          return;
        }

        // Web build: ping Ollama.
        const url = getOllamaUrl().replace(/\/$/, '');
        const r = await fetch(`${url}/api/tags`, { method: 'GET' });
        setAiReady(r.ok);
      } catch {
        setAiReady(false);
      } finally {
        setAiChecked(true);
      }
    })();
  }, []);

  const hasDesktopAI = !!window.hushpathDesktop?.aiStatus;

  // Important: we must not early-return *after* some hooks have already been conditionally skipped.
  // This wrapper keeps hook order stable and only decides what to render.
  if (hasDesktopAI && !aiChecked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'black',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: 14,
        padding: 16,
      }}>
        Checking local AI components…
      </div>
    );
  }

  // Block the game until AI is available.
  if (aiChecked && !aiReady) {
    // Desktop build
    if (hasDesktopAI) {
      return <AiSetupOverlay onReady={() => setAiReady(true)} />;
    }
    // Web build
    return <OllamaRequiredOverlay onReady={() => setAiReady(true)} />;
  }

  return <AppInner />;
}

function AppInner() {
  const [screen, setScreen] = useState<GameStatus>(GameStatus.INTRO);
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [appearance, setAppearance] = useState('');
  const [portrait, setPortrait] = useState('');
  const [isPortraitLoading, setIsPortraitLoading] = useState(false);
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [storyHistory, setStoryHistory] = useState<StoryPanel[]>([]);
  const [showStory, setShowStory] = useState(false);
  
  // Persistent Scene & Map
  const [sceneArt, setSceneArt] = useState<string>('');
  const [sceneCaption, setSceneCaption] = useState<string>('');
  const [isSceneLoading, setIsSceneLoading] = useState(false);
  const [mapArt, setMapArt] = useState<string>('');
  const [mapCoords, setMapCoords] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Randomly select a tagline on mount
  const randomTagline = useMemo(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)], []);

  const logsEnd = useRef<HTMLDivElement>(null);

  // Load Story from Local Storage on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hushpath_story');
      if (saved) {
        setStoryHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load story history");
    }
  }, []);

  // Save Story to Local Storage whenever it updates
  useEffect(() => {
    if (storyHistory.length > 0) {
      localStorage.setItem('hushpath_story', JSON.stringify(storyHistory));
    }
  }, [storyHistory]);

  // Auto-scroll
  useEffect(() => { 
    if (logsEnd.current) {
        logsEnd.current.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [logs, busy]);

  // Fake Loading Progress Bar
  useEffect(() => {
    if (screen === GameStatus.LOADING) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 99) return 99;
          
          // Much Slower Logic
          const remaining = 100 - prev;
          // Decelerate significantly as it gets closer to 100
          // Minimum increment 0.1, max 0.8
          const increment = Math.max(0.1, remaining / 100); 
          return prev + increment;
        });
      }, 50); // Tick frequently for smoothness, but increment small amounts
      return () => clearInterval(interval);
    }
  }, [screen]);

  const getLoadingBar = (pct: number) => {
    const width = 30; // Characters wide
    const filled = Math.floor((pct / 100) * width);
    const empty = width - filled;
    return `[${"=".repeat(filled)}${" ".repeat(empty)}]`;
  };

  const handleResponse = useCallback(async (res: GameResponse, actionTaken?: string) => {
    setPlayer(res.playerState);
    setActions(res.suggestedActions);

    // 1. Update Persistent Visuals (IMAGE -> ASCII technique)
    // We now expect the model to provide a short 'visualDescription' prompt.
    // If it is empty, we keep the previous scene art.
    let newArt = sceneArt;
    const nextPrompt = (res.visualDescription || "").trim();
    if (nextPrompt.length > 0) {
      setIsSceneLoading(true);
      try {
        const ascii = await generateAsciiFromPrompt(nextPrompt, DEFAULT_SCENE_SETTINGS, "3:2");
        setSceneArt(ascii);
        setSceneCaption(nextPrompt);
        newArt = ascii;
      } catch (e) {
        console.warn('Scene image->ascii failed. Falling back to LLM ASCII.', e);

        // Fallback 1: ask the local text model to draw ASCII directly
        try {
          const fallbackAscii = await getAscii(nextPrompt, '80x30');
          setSceneArt(fallbackAscii);
          setSceneCaption(nextPrompt);
          newArt = fallbackAscii;
        } catch (e2) {
          console.warn('LLM ASCII fallback failed, keeping previous art.', e2);
          // Fallback 2: use any model-provided ASCII if present
          if (res.visualArt && res.visualArt.trim().length > 0) {
            setSceneArt(res.visualArt);
            setSceneCaption(nextPrompt);
            newArt = res.visualArt;
          }
        }
      } finally {
        setIsSceneLoading(false);
      }
    }
    // Update Map if provided, otherwise keep old map
    if (res.mapArt && res.mapCoordinates) {
        setMapArt(res.mapArt);
        setMapCoords(res.mapCoordinates);
    } else if (res.mapArt) {
        setMapArt(res.mapArt);
    }

    // 2. Add Text to Log History
    const newLogs: LogEntry[] = [];
    newLogs.push({ 
        id: `l-${Date.now()}`, 
        type: 'narrative', 
        content: res.narrative, 
        isTyping: true 
    });

    setLogs(prev => [...prev.map(l => ({ ...l, isTyping: false })), ...newLogs]);

    // 3. Save to Story History (Comic Mode)
    const newPanel: StoryPanel = {
      id: `p-${Date.now()}`,
      turn: res.playerState.turn,
      location: res.playerState.location,
      action: actionTaken,
      narrative: res.narrative,
      art: newArt,
      timestamp: Date.now()
    };
    setStoryHistory(prev => [...prev, newPanel]);

    // 4. Handle Portrait - ONLY Update if characterDescription actually changed
    // The Gemini Service has been instructed to only change this string for significant equipment updates
    if (!portrait || (res.playerState.characterDescription && res.playerState.characterDescription !== player.characterDescription)) {
      setIsPortraitLoading(true);
      // Prefer the same image->ascii technique for sharper portraits.
      generateAsciiFromPrompt(
        `Full body standing character, ${res.playerState.characterDescription}, centered`,
        DEFAULT_PORTRAIT_SETTINGS,
        "2:3"
      )
        .then(p => {
          setPortrait(p);
          setIsPortraitLoading(false);
        })
        .catch(() => {
          // Fallback to LLM ASCII if image model fails.
          getPortraitAscii(res.playerState.characterDescription)
            .then(p => setPortrait(p))
            .finally(() => setIsPortraitLoading(false));
        });
    }

    setScreen(res.gameOver ? GameStatus.GAME_OVER : GameStatus.PLAYING);
  }, [player.characterDescription, portrait, sceneArt]);

  const submitAction = async (txt: string) => {
    if (!txt.trim() || busy || screen === GameStatus.LOADING) return;
    
    // Add User Entry with typing enabled
    setLogs(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: txt, isTyping: true }]);
    setInput('');
    setBusy(true);
    
    try {
      const res = await performAction(txt);
      handleResponse(res, txt);
    } catch (e) { 
      setLogs(prev => [...prev, { id: `err-${Date.now()}`, type: 'system', content: "The connection to reality fades... Try again." }]);
      setBusy(false); 
    }
  };

  const handleStartGame = async () => {
    setScreen(GameStatus.LOADING); 
    // Clear history on new game
    setStoryHistory([]);
    localStorage.removeItem('hushpath_story');

    try {
      const res = await startNewGame(appearance);
      handleResponse(res, "Entered the World");
    } catch (e) {
      console.error(e);
      setScreen(GameStatus.GENRE_SELECTION);
      alert("Initialization failed. The world refused to load.");
    }
  };

  // INTRO SCREEN
  if (screen === GameStatus.INTRO) return (
    <GenreFrame>
    <div className="flex flex-col h-full items-center justify-center bg-black p-4 text-center animate-fade-in text-white/90">
      
      <div className="mb-8 select-none pointer-events-none opacity-90 relative text-white">
        {/* Scaled up Logo */}
        <pre className="text-[6px] xs:text-[8px] sm:text-[10px] md:text-[12px] leading-[0.85] whitespace-pre font-mono font-bold">
          {ASCII_LOGO}
        </pre>
      </div>
      
      {/* ASCII TITLE REPLACEMENT - Scaled up */}
      <div className="mb-4 select-none pointer-events-none opacity-90 relative text-white">
        <pre className="text-[7px] xs:text-[9px] sm:text-[11px] md:text-[14px] leading-[0.9] whitespace-pre font-mono font-bold text-center">
            {ASCII_TITLE}
        </pre>
      </div>
      <AsciiSeparator pattern="=~" className="mb-12 text-white/50 opacity-100 max-w-lg"/>

      <p className="text-xl md:text-2xl font-mono italic opacity-60 mb-20 max-w-2xl tracking-wider text-white">
        "{randomTagline}"
      </p>
      
      <div className="flex flex-col gap-8 items-center">
        <button 
          onClick={async () => { await unlockAudio(); setScreen(GameStatus.GENRE_SELECTION); }} 
          className="group font-mono font-normal text-white hover:text-white transition-all uppercase tracking-widest outline-none bg-transparent border-none p-0 cursor-pointer scale-125"
        >
          <AsciiFrame pattern="simple" padX={false}>
            <div className="px-8 py-2 text-xl">ENTER</div>
          </AsciiFrame>
        </button>
      </div>
    </div>
    </GenreFrame>
  );

  // GENRE SELECTION
  if (screen === GameStatus.GENRE_SELECTION) return (
    <GenreFrame>
    <div className="flex flex-col h-full items-center justify-center bg-black p-8 text-white">
      <h2 className="text-4xl md:text-5xl mb-2 font-mono italic">Select Realm</h2>
      <AsciiSeparator pattern="~-" className="mb-16 max-w-md text-white/50 opacity-80"/>
      
      <div className="w-full max-w-2xl mb-12 animate-fade-in">
        <AsciiFrame pattern="simple">
            <div className="relative group bg-black">
            <select 
                className="w-full bg-black text-white font-mono text-2xl md:text-3xl p-6 outline-none appearance-none cursor-pointer focus:bg-white/5"
                onChange={(e) => {
                const g = e.target.value;
                setSelectedGenre(g);
                setGameGenre(g);
                }}
                value={selectedGenre}
            >
                <option value="" disabled>-- Open the Archives --</option>
                {Object.entries(ALL_GENRES).map(([category, genres]) => (
                    <optgroup key={category} label={category} className="bg-black text-white font-mono uppercase tracking-widest">
                    {genres.map(g => <option key={g} value={g} className="font-mono capitalize">{g}</option>)}
                    </optgroup>
                ))}
            </select>
            {/* Custom Arrow */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity text-xl">
                ▼
            </div>
            </div>
        </AsciiFrame>
      </div>

      {selectedGenre && (
        <button 
            onClick={() => setScreen(GameStatus.CREATION)}
            className="mb-16 hover:scale-105 transition-transform animate-fade-in outline-none"
        >
            <AsciiFrame pattern="double" className="bg-white text-black">
                <span className="px-12 py-5 font-mono font-bold text-xl tracking-widest uppercase block">Confirm Selection</span>
            </AsciiFrame>
        </button>
      )}
      
      <div className="w-full max-w-2xl pt-10 border-t border-white/10 animate-fade-in">
        <form 
            onSubmit={(e) => { 
                e.preventDefault(); 
                if(customGenreInput.trim()) { 
                    setGameGenre(customGenreInput.trim());
                    setSelectedGenre(customGenreInput.trim()); 
                    setScreen(GameStatus.CREATION); 
                } 
            }} 
            className="flex flex-col group"
        >
            <div className="flex items-center gap-4 mb-2">
                <span className="font-mono text-lg opacity-40 uppercase tracking-widest whitespace-nowrap group-focus-within:opacity-100 transition-opacity text-white">Custom Genre:</span>
            </div>
            
            <input 
                value={customGenreInput}
                onChange={e => {
                  setCustomGenreInput(e.target.value);
                  playBlip();
                }}
                placeholder="e.g. 1920s Noir Detective..."
                className="w-full bg-transparent outline-none py-3 font-mono italic text-2xl md:text-3xl placeholder:opacity-20 placeholder:italic transition-colors text-white"
            />
            <AsciiSeparator pattern="._" className="text-white/50 group-focus-within:text-white"/>
            
            <div className="flex justify-end mt-4">
                <button type="submit" className="text-3xl hover:scale-125 transition-transform opacity-50 hover:opacity-100 px-2 text-white">
                    →
                </button>
            </div>
        </form>
      </div>
    </div>
    </GenreFrame>
  );

  // CHARACTER CREATION
  if (screen === GameStatus.CREATION) return (
    <GenreFrame>
    <div className="flex flex-col h-full items-center justify-center bg-black p-8 text-white">
      <h2 className="text-4xl mb-4 font-mono italic">Define Your Avatar</h2>
      <div className="text-sm font-mono uppercase opacity-50 mb-10 tracking-widest">{selectedGenre}</div>

      <div className="w-full max-w-2xl">
        <AsciiFrame pattern="simple">
            <div className="flex items-start p-6 bg-black">
            <textarea 
                value={appearance} 
                onChange={e => {
                setAppearance(e.target.value);
                playBlip();
                }} 
                className="bg-transparent w-full outline-none font-mono text-2xl md:text-3xl resize-none h-40 placeholder:italic placeholder:opacity-30 text-white leading-relaxed" 
                placeholder={GENRE_PLACEHOLDERS[selectedGenre] || `Describe your hero in the world of ${selectedGenre}...`}
                autoFocus 
            />
            </div>
        </AsciiFrame>

        <div className="mt-12 flex justify-center">
          <button onClick={handleStartGame} className="outline-none hover:bg-white hover:text-black transition-all text-white">
            <AsciiFrame pattern="double">
                <span className="px-14 py-5 uppercase text-lg font-bold font-mono tracking-widest block">Begin Journey</span>
            </AsciiFrame>
          </button>
        </div>
      </div>
    </div>
    </GenreFrame>
  );

  // LOADING
  if (screen === GameStatus.LOADING) return (
    <GenreFrame>
    <div className="flex flex-col h-full items-center justify-center bg-black p-8">
       <div className="font-mono italic text-3xl md:text-4xl text-white animate-pulse tracking-widest mb-10">Constructing World...</div>
       
       {/* ASCII Progress Bar */}
       <div className="font-mono text-sm md:text-lg text-white whitespace-pre">
          {getLoadingBar(loadingProgress)}
       </div>
       
       <div className="mt-4 font-mono text-xs text-white/50 w-full text-center">
          {Math.floor(loadingProgress)}%
       </div>
    </div>
    </GenreFrame>
  );

  // MAIN GAME
  return (
    <GenreFrame>
    {showStory && <StoryView panels={storyHistory} onClose={() => setShowStory(false)} />}
    
    <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden">
      {/* Top Bar */}
      <header className="px-6 py-2 flex justify-between items-center text-xs font-mono bg-black z-20 tracking-wider text-white border-b border-white/10">
        <div className="opacity-70 uppercase truncate max-w-[50%]">{player.location}</div>
        <div className="opacity-50">TURN {player.turn}</div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANEL (STATS + INVENTORY) */}
        <aside className="w-80 p-6 hidden md:flex flex-col bg-black z-20 h-full overflow-hidden font-mono text-xs border-r border-white/10 shrink-0">
          
          {/* Portrait - CHANGED TO AUTO HEIGHT TO PREVENT CUTTING OFF */}
          <div className="mb-4 shrink-0">
            <AsciiFrame pattern="ornate">
                <div className="w-full flex items-center justify-center bg-black relative p-1 overflow-hidden">
                    {isPortraitLoading ? (
                        <div className="py-12"><AsciiLoader /></div>
                    ) : portrait ? (
                        <pre className="text-[6px] xs:text-[7px] md:text-[8px] leading-[0.8] opacity-90 font-mono text-center whitespace-pre select-none text-white tracking-tighter">
                          {portrait}
                        </pre>
                    ) : (
                        <span className="opacity-20 text-white py-10 block">NO IMAGE</span>
                    )}
                </div>
            </AsciiFrame>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0 text-white">
            <div>
                <h3 className="text-xl font-mono font-normal tracking-wide text-white">{player.name}</h3>
                <p className="opacity-50 mt-1 italic font-mono">{player.class} - Level {player.level}</p>
            </div>
            <div className="space-y-4">
                <StatBar label="Health" value={player.hp} max={player.maxHp} pattern="diagonal" />
                <StatBar label="Mana" value={player.mana} max={player.maxMana} pattern="cross" />
                <StatBar label="Exp" value={player.xp} max={player.level * 100} pattern="dots" />
            </div>
            
            <AsciiSeparator pattern=".-" className="my-6 text-white/30" />
            
            <div className="flex justify-between opacity-80 font-mono italic text-sm mb-6">
                <span>Gold</span><span>{player.gold}</span>
            </div>

            {/* INVENTORY SECTION */}
            <div>
                <h4 className="mb-4 opacity-50 uppercase tracking-widest text-white">Inventory</h4>
                <div className="space-y-3">
                    {player.inventory.length === 0 ? (
                        <div className="opacity-30 italic font-mono text-white">Empty Satchel</div>
                    ) : (
                        player.inventory.map((item, i) => (
                            <AsciiFrame key={i} pattern="simple" padX={false} className="opacity-80">
                                <div className="py-2 px-3 bg-black text-white text-center w-full">{item}</div>
                            </AsciiFrame>
                        ))
                    )}
                </div>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL (VISUAL + LOGS) */}
        <main className="flex-1 flex flex-col h-full bg-black relative min-w-0">
          
          {/* TOP: Fixed Visual Scene */}
          <SceneDisplay art={sceneArt} caption={sceneCaption} isLoading={isSceneLoading || busy} />

          {/* BOTTOM: Scrollable Logs */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar scroll-smooth bg-black">
            {/* RESTORED MAX WIDTH TO 3XL TO FIX RATIO */}
            <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
                {logs.map(l => (
                    <LogEntryComp 
                        key={l.id} 
                        entry={l} 
                        onComplete={() => {
                           // Only unlock if it's a narrative (AI) log that finished typing.
                           // User logs typing finishing should NOT unlock the input (still waiting for AI).
                           if (l.isTyping && l.type === 'narrative' && l.id === logs[logs.length-1].id) {
                               setBusy(false);
                           }
                        }} 
                    />
                ))}
                {busy && (
                    <div className="h-6 opacity-30 mt-4 font-mono text-xs animate-pulse text-white">
                       Thinking...
                    </div>
                )}
                <div ref={logsEnd} className="h-4" />
            </div>
          </div>

        </main>

        {/* RIGHT PANEL (MAP) */}
        <aside className="w-72 p-0 hidden lg:flex flex-col bg-black z-20 overflow-hidden font-mono text-xs text-white border-l border-white/10 shrink-0">
          <div className="px-6 pt-6 pb-3 bg-black z-10">
            <h4 className="opacity-50 uppercase tracking-widest text-white">Region Map</h4>
            <AsciiSeparator pattern="~" className="mt-3 text-white/30" />
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-black w-full">
            <InteractiveMap 
                currentChunk={mapArt} 
                coords={mapCoords} 
                className="w-full h-full"
            />
          </div>
          
          <div className="px-6 py-4 bg-black z-10">
             <AsciiSeparator pattern="-" className="mb-4 text-white/30" />
             <div className="text-[10px] opacity-40 text-center uppercase tracking-widest text-white">
                Sector: {player.location.substring(0, 15)}
                <div className="text-[8px] mt-1">{mapCoords.x}, {mapCoords.y}</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Input Footer */}
      <div className="bg-black z-30 border-t border-white/10 relative">
        <footer className="px-6 pb-6 md:px-8 md:pb-8 pt-4 relative">
            {/* Story Mode Button - Absolute left */}
            <button 
                onClick={() => setShowStory(true)}
                className="absolute left-6 top-6 z-40 outline-none hover:brightness-125"
            >
                <AsciiFrame pattern="simple" padX={false} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                    <span className="text-xs uppercase tracking-widest px-4 py-2 block">[ STORY MODE ]</span>
                </AsciiFrame>
            </button>

            {/* RESTORED MAX WIDTH TO 3XL */}
            <div className="max-w-3xl mx-auto">
            
            {/* Action Buttons */}
            {actions.length > 0 && !busy && (
                <div className="flex flex-wrap gap-3 mb-8 justify-center animate-fade-in font-mono w-full">
                {actions.map((a, i) => (
                    <button key={i} onClick={() => submitAction(a)} className="outline-none group active:scale-95 transition-transform">
                        <AsciiFrame pattern="double" className="text-white/80 group-hover:text-white group-hover:bg-white/10 transition-colors">
                            <span className="px-6 py-3 italic text-lg md:text-xl font-normal block whitespace-nowrap">{a}</span>
                        </AsciiFrame>
                    </button>
                ))}
                </div>
            )}
            
            {/* Input Field */}
            <form onSubmit={e => { e.preventDefault(); submitAction(input); }} className="flex flex-col bg-black">
                <div className="flex items-center pb-2">
                    <span className="mr-6 opacity-50 font-mono text-3xl md:text-4xl text-white">{'>'}</span>
                    <input 
                        value={input} 
                        onChange={e => {
                            setInput(e.target.value);
                            if (e.target.value.length > input.length) playBlip();
                        }} 
                        disabled={busy} 
                        className="flex-1 bg-transparent outline-none font-mono text-white placeholder:opacity-20 placeholder:italic text-2xl md:text-3xl h-16" 
                        placeholder={busy ? "" : "What is your command?"} 
                        autoFocus 
                    />
                </div>
                <AsciiSeparator pattern="=" className="text-white/50" />
            </form>
            </div>
        </footer>
      </div>
    </div>
    </GenreFrame>
  );
}