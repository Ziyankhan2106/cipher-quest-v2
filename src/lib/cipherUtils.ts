/**
 * Cipher implementation utilities for CipherQuest Lab
 */

export interface CipherMission {
  id: string;
  level: number;
  type: string;
  encryptedText: string;
  originalText: string;
  schemeHint: string; // The encoding scheme (e.g. "Reverse Cipher")
  difficulty: 'easy' | 'medium' | 'hard';
  params?: any;
}

// Basic alphabets
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ciphers = {
  // LVL-1
  reverse: (text: string) => text.split('').reverse().join(''),
  
  caesar: (text: string, shift: number) => {
    return text.split('').map(char => {
      const index = ALPHABET.indexOf(char.toUpperCase());
      if (index === -1) return char;
      let newIndex = (index + shift) % 26;
      if (newIndex < 0) newIndex += 26;
      return ALPHABET[newIndex];
    }).join('');
  },

  atbash: (text: string) => {
    return text.split('').map(char => {
      const index = ALPHABET.indexOf(char.toUpperCase());
      if (index === -1) return char;
      return ALPHABET[25 - index];
    }).join('');
  },

  // LVL-2
  reverseCaesar: (text: string, shift: number) => {
    const reversed = text.split('').reverse().join('');
    return reversed.split('').map(char => {
      const index = ALPHABET.indexOf(char.toUpperCase());
      if (index === -1) return char;
      let newIndex = (index + shift) % 26;
      if (newIndex < 0) newIndex += 26;
      return ALPHABET[newIndex];
    }).join('');
  },

  // LVL-3
  vigenere: (text: string, key: string) => {
    let keyIndex = 0;
    return text.split('').map(char => {
      const index = ALPHABET.indexOf(char.toUpperCase());
      if (index === -1) return char;
      
      const kChar = key[keyIndex % key.length].toUpperCase();
      const kIndex = ALPHABET.indexOf(kChar);
      
      let newIndex = (index + kIndex) % 26;
      keyIndex++;
      return ALPHABET[newIndex];
    }).join('');
  }
};

const WORDS = [
  "MUSTANG", "BATMAN", "CACHE", "ENGINE", "FLASH", "PYTHON", "TURBO", "ROUTER",
  "SUPERMAN", "FIREWALL", "FERRARI", "DATABASE", "AVENGERS", "COMPILER", "PORSCHE", "KERNEL",
  "LAMBORGHINI", "WOLVERINE", "ALGORITHM", "ENCRYPTION", "SPIDERMAN", "BUGATTI", "DEADPOOL",
  "KUBERNETES", "KOENIGSEGG", "IRONMAN", "DECRYPTION", "ASYNCHRONOUS"
];

export function generateMission(level: number, completedCount: number): CipherMission {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const id = `mission_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Decide difficulty based on level and completed missions
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (level >= 3) difficulty = 'hard';
  else if (level >= 2 || completedCount > 5) difficulty = 'medium';

  // Level Logic
  if (level === 1) {
    const types = ['reverse', 'caesar', 'atbash'];
    const type = types[Math.floor(Math.random() * types.length)];
    let encryptedText = "";
    let schemeHint = "";
    
    if (type === 'reverse') {
      encryptedText = ciphers.reverse(word);
      schemeHint = "REVERSE_CIPHER: The bitstream sequence is inverted.";
    } else if (type === 'caesar') {
      const shift = 1 + Math.floor(Math.random() * 5);
      encryptedText = ciphers.caesar(word, shift);
      schemeHint = `CAESAR_MOD_26: Data is shifted by exactly ${shift} positions.`;
    } else {
      encryptedText = ciphers.atbash(word);
      schemeHint = "ATBASH_MIRROR: A matches Z, B matches Y. Classic inversion.";
    }
    
    return { id, level, type, encryptedText, originalText: word, schemeHint, difficulty };
  } else if (level === 2) {
    const shift = 3;
    const encryptedText = ciphers.reverseCaesar(word, shift);
    return {
      id, level, type: 'reverseCaesar', encryptedText, originalText: word,
      schemeHint: "COMPOUND_ENCRYPTION: Reversed bitstream followed by a +3 Caesar shift.", difficulty: 'medium'
    };
  } else {
    // Level 3+
    const key = "CYBER";
    const encryptedText = ciphers.vigenere(word, key);
    return {
      id, level, type: 'vigenere', encryptedText, originalText: word,
      schemeHint: `VIGENERE_POLY: Keyed addition using neural key: ${key}.`, difficulty: 'hard'
    };
  }
}

export function calculateScore(basePoints: number, timeSpent: number, totalTime: number, hintsCount: number): number {
  const timeFactor = Math.max(0.2, (totalTime - timeSpent) / totalTime);
  // Fixed deduction: 50 XP per hint level, but floor at 10 XP
  const hintDeduction = hintsCount * 50;
  return Math.max(10, Math.floor(basePoints * timeFactor) - hintDeduction);
}
