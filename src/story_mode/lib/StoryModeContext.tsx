import React, { createContext, useContext, useState, useEffect } from 'react';
import { AVATAR_VARIANTS, AvatarVariant, CHAPTERS } from './game-data';
import { getStoryProfile, completeMissionOnServer } from './api';
import { useAuth } from '../../context/AuthContext';

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: number;
  icon: string;
}

interface StoryModeContextType {
  operatorName: string;
  selectedAvatar: AvatarVariant;
  completedMissions: Set<string>;
  earnedBadges: Badge[];
  setAvatar: (avatar: AvatarVariant) => void;
  completeMission: (id: string) => Promise<any>;
  progress: number;
  loading: boolean;
  xp: number;
  completedChapters: number[];
}

const StoryModeContext = createContext<StoryModeContextType | undefined>(undefined);

export const StoryModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [operatorName, setOperatorName] = useState('OPERATIVE');
  const [selectedAvatar, _setAvatar] = useState<AvatarVariant>(AVATAR_VARIANTS[0]);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getStoryProfile();
        setOperatorName(data.operatorName);
        const storyData = data.storyData || {};
        setCompletedMissions(new Set(storyData.completedMissions || []));
        setEarnedBadges(storyData.earnedBadges || []);
        
        const savedAvatar = AVATAR_VARIANTS.find(v => v.id === storyData.avatarId) || AVATAR_VARIANTS[0];
        _setAvatar(savedAvatar);
        
        // Use user's current XP
        if (user) setXp(user.xp || 0);
        
        // Update CSS variable
        document.documentElement.style.setProperty('--current-theme-color', savedAvatar.colorHex);
      } catch (err) {
        console.error("Failed to load story profile", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const setAvatar = (avatar: AvatarVariant) => {
    _setAvatar(avatar);
    document.documentElement.style.setProperty('--current-theme-color', avatar.colorHex);
    // Optionally persist to backend
  };

  const checkBadges = (currentMissions: Set<string>) => {
    const newBadges: Badge[] = [...earnedBadges];
    let updated = false;

    CHAPTERS.forEach(chapter => {
      const badgeId = `badge-chap-${chapter.id}`;
      if (!newBadges.find(b => b.id === badgeId)) {
        const allCompleted = chapter.missions.every(m => currentMissions.has(m.id));
        if (allCompleted) {
          newBadges.push({
            id: badgeId,
            name: `Sector ${chapter.id} Master`,
            description: `All protocols in ${chapter.title} neutralized.`,
            earnedAt: Date.now(),
            icon: 'verified'
          });
          updated = true;
        }
      }
    });

    if (updated) {
      setEarnedBadges(newBadges);
      return newBadges;
    }
    return null;
  };

  const completeMission = async (id: string) => {
    try {
      const result = await completeMissionOnServer(id);
      setCompletedMissions(prev => {
        const next: Set<string> = new Set(prev);
        next.add(id);
        checkBadges(next);
        return next;
      });
      if (result.chapterComplete) {
        await refreshUser(); // Update XP on dashboard
      }
      if (user) setXp(user.xp || 0);
      return result;
    } catch (err) {
      console.error("Failed to complete mission on server", err);
    }
  };

  const totalMissions = CHAPTERS.reduce((acc, chap) => acc + chap.missions.length, 0);
  const progress = Math.round((completedMissions.size / totalMissions) * 100);
  const completedChapters = CHAPTERS.filter(chap => chap.missions.every(m => completedMissions.has(m.id))).map(c => c.id);

  return (
    <StoryModeContext.Provider value={{ 
      operatorName, 
      selectedAvatar, 
      completedMissions, 
      earnedBadges, 
      setAvatar, 
      completeMission, 
      progress,
      loading,
      xp,
      completedChapters
    }}>
      {children}
    </StoryModeContext.Provider>
  );
};

export const useStoryMode = () => {
  const context = useContext(StoryModeContext);
  if (!context) throw new Error('useStoryMode must be used within a StoryModeProvider');
  return context;
};
