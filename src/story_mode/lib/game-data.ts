export interface Mission {
  id: string;
  name: string;
  description: string;
  type: string;
  storyIntro?: string;
}

export interface Chapter {
  id: number;
  title: string;
  missions: Mission[];
}

export interface AvatarVariant {
  id: string;
  icon: string;
  colorName: string;
  colorHex: string;
}

export const AVATAR_VARIANTS: AvatarVariant[] = [
  { id: 'cyan', icon: 'layers', colorName: 'Cyber Cyan', colorHex: '#00e5ff' },
  { id: 'green', icon: 'memory', colorName: 'Matrix Green', colorHex: '#00ff88' },
  { id: 'purple', icon: 'api', colorName: 'Neon Purple', colorHex: '#b200ff' },
  { id: 'orange', icon: 'local_fire_department', colorName: 'Plasma Orange', colorHex: '#ff8800' },
  { id: 'magenta', icon: 'adjust', colorName: 'Laser Magenta', colorHex: '#ff00aa' }
];

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'SECTOR 1: THE OUTSKIRTS',
    missions: [
      { id: '1-1', name: 'Gateway Firewall Override', description: 'Reverse the String', type: 'reverse', storyIntro: 'SysAdmin: The Outer Gate uses a basic mirror distortion. Intercept their packet and reverse the sequence to break inside.' },
      { id: '1-2', name: 'Neon Glitch Protocol', description: 'Shift by (+/- X)', type: 'caesar', storyIntro: 'SysAdmin: The street signs are flickering in a pattern. They are linearly shifting characters. Find the frequency delta and realign.' },
      { id: '1-3', name: 'Alleyway Mirror Network', description: 'A-Z, B-Y, C-X and so on', type: 'atbash', storyIntro: 'SysAdmin: A black-market trader is using an inverted alphabet protocol. A maps to Z. Decode their drop location.' },
      { id: '1-4', name: 'Black Market Custom Key', description: 'Create your own mapping', type: 'monoalphabetic', storyIntro: 'SysAdmin: We captured a bespoke frequency map from a local smuggler. Analyze the structure and replace the letters.' },
      { id: '1-5', name: 'Smuggler Number-Tagging', description: '0-9, a-z = 10-35, A-Z = 36-51, .?!, = 52,53,54,55', type: 'fixed-number', storyIntro: 'SysAdmin: They are converting alphanumerics to raw integers to bypass the cargo scanners. We must translate the numerical blocks.' }
    ]
  },
  {
    id: 2,
    title: 'SECTOR 2: THE NEON SLUMS',
    missions: [
      { id: '2-1', name: 'Shadow Protocol Bypass', description: 'Reverse then Shift by (+/- X)', type: 'reverse-caesar', storyIntro: 'SysAdmin: Layered street-level obfuscation. A reversal followed by a standard shift. Unpack it in reverse order.' },
      { id: '2-2', name: 'Synth-Wave Modulation', description: '+/- X, +/- Y alternating', type: 'alternating', storyIntro: 'SysAdmin: The data shift modulates periodically like a synth beat. Track the alternating wave frequency and adjust.' },
      { id: '2-3', name: 'Elevator Depth Charge', description: '+1 then +2 and beyond', type: 'positional', storyIntro: 'SysAdmin: Dynamic shifting based on floor index position. The deeper you go into the slums, the higher the shift.' },
      { id: '2-4', name: 'Vocal Scrambler Module', description: 'Replace Vowels and Spaces with Numbers and Symbols', type: 'vowel-scrambler', storyIntro: 'SysAdmin: Gang leaders are scrambling their voice comms by stripping vowels and assigning distinct symbols.' },
      { id: '2-5', name: 'Rogue Keycard Override', description: 'Say the Key is XIATUV then ABCDE... = XIATUV_BCDEFGHJK...', type: 'keyed-substitution', storyIntro: 'SysAdmin: A stolen VIP keycard alters the alphabet array. We pulled the keyword from their wallet. Implement the substitute.' }
    ]
  },
  {
    id: 3,
    title: 'SECTOR 3: THE CORPORATE GRID',
    missions: [
      { id: '3-1', name: 'Traffic Grid Geometry', description: '((index_of_the_alphabet) + key_number) mod 26', type: 'modular-shift', storyIntro: 'SysAdmin: Corporate data is wrapped using strict modular arithmetic. Calculate the modulo 26 shifts for the transit nodes.' },
      { id: '3-2', name: 'Poly-Auth Terminal', description: '((index_of_the_alphabet) + index_of_key) mod 26', type: 'vignere', storyIntro: 'SysAdmin: MegaCorp Polyalphabetic encryption detected. They use a repeating employee ID keyword to dynamically shift text.' },
      { id: '3-3', name: 'Corporate Vault Equation', description: '(A*(index of alphabet) + B) mod 26', type: 'affine', storyIntro: 'SysAdmin: Their financial vaults map characters to linear algebraic equations. We need to solve for multipliers A and B.' },
      { id: '3-4', name: 'Data Packet Rerouting', description: 'Reorder using a rule', type: 'permutation', storyIntro: 'SysAdmin: Heavy payload fragmentation. The data is all there, but the layout is shuffled. Reconstruct the block routing.' },
      { id: '3-5', name: 'Security Drone Disruption', description: 'ABCDEF -> CBAFED (key = CAT) = (CBA + CAT) + (FED + CAT)', type: 'blocked-rotate', storyIntro: 'SysAdmin: Combat drones divide data into blocks, reverse the rotors, and add a local key. Bring them down.' }
    ]
  },
  {
    id: 4,
    title: 'SECTOR 4: THE SYNDICATE CORE',
    missions: [
      { id: '4-1', name: 'DNA Sequencing Hack', description: 'Full A-Z Random Mapping', type: 'monoalphabetic', storyIntro: 'SysAdmin: Syndicate genetics labs use a full random mapping to obfuscate DNA data. Decrypt the sequence using the intercepted map.' },
      { id: '4-2', name: 'Power Core Collapse', description: '(I_Original + I_Reverse)', type: 'rotate-add', storyIntro: 'SysAdmin: The reactor terminal folds the data structure on top of itself and sums the output. Unfold the grid variables.' },
      { id: '4-3', name: 'Additive Surge Wave', description: '(1,3,5,7) then flip the block', type: 'encrypt-additively', storyIntro: 'SysAdmin: Successive additive operations create a constant changing stream of shifts across the grid. Surf the wave.' },
      { id: '4-4', name: 'Executive Mainframe Bypass', description: 'Encrypt with y = (x^a) mod n', type: 'mini-rsa', storyIntro: 'SysAdmin: The CEO mainframe is protected by asymmetric cryptography. We intercepted the public key. Calculate the private components.' },
      { id: '4-5', name: 'Syndicate Archival Wipe', description: 'Hash 2^n to get 1 root', type: 'merkle', storyIntro: 'SysAdmin: They are securing everything via a Merkle root to prove database state. We need to crack the root hash to wipe their servers.' }
    ]
  }
];
