import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Button, GlassCard } from '../components/ui';
import { Gesture } from '../types';
import { 
  Search, 
  Sparkles, 
  Star, 
  Compass, 
  Heart,
  TrendingUp,
  Award
} from 'lucide-react';

const aslDictionary: Gesture[] = [
  // Alphabet
  { id: 'a', name: 'A', meaning: 'Letter A', category: 'alphabet', difficulty: 'Beginner', description: 'Make a fist, placing your thumb straight up against the side of your index finger.' },
  { id: 'b', name: 'B', meaning: 'Letter B', category: 'alphabet', difficulty: 'Beginner', description: 'Open your palm, keeping all fingers straight and touching, with thumb tucked across your palm.' },
  { id: 'c', name: 'C', meaning: 'Letter C', category: 'alphabet', difficulty: 'Beginner', description: 'Curve all fingers and thumb to form a crescent crescent shape, mimicking the shape of a C.' },
  { id: 'd', name: 'D', meaning: 'Letter D', category: 'alphabet', difficulty: 'Beginner', description: 'Point your index finger straight up. Touch your thumb to the tips of your middle, ring, and pinky fingers.' },
  { id: 'e', name: 'E', meaning: 'Letter E', category: 'alphabet', difficulty: 'Intermediate', description: 'Curl all fingers tightly down towards your palm, tucking your thumb underneath them.' },
  { id: 'f', name: 'F', meaning: 'Letter F', category: 'alphabet', difficulty: 'Beginner', description: 'Touch your index finger tip to your thumb tip. Keep your middle, ring, and pinky fingers extended straight up.' },
  { id: 'g', name: 'G', meaning: 'Letter G', category: 'alphabet', difficulty: 'Intermediate', description: 'Extend your thumb and index finger horizontally parallel to each other, folding other fingers.' },
  { id: 'h', name: 'H', meaning: 'Letter H', category: 'alphabet', difficulty: 'Intermediate', description: 'Extend your index and middle fingers together horizontally. Keep thumb and other fingers folded.' },
  { id: 'i', name: 'I', meaning: 'Letter I', category: 'alphabet', difficulty: 'Beginner', description: 'Keep all fingers in a fist, extending only your pinky finger straight up.' },
  { id: 'k', name: 'K', meaning: 'Letter K', category: 'alphabet', difficulty: 'Intermediate', description: 'Extend your index and middle fingers up. Touch your thumb tip to the middle joint of your middle finger.' },
  { id: 'l', name: 'L', meaning: 'Letter L', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your thumb and index finger straight out to form an L shape. Fold middle, ring, and pinky fingers.' },
  { id: 'o', name: 'O', meaning: 'Letter O', category: 'alphabet', difficulty: 'Beginner', description: 'Curve all fingers to touch your thumb tip, forming a circular letter O profile.' },
  { id: 's', name: 'S', meaning: 'Letter S', category: 'alphabet', difficulty: 'Beginner', description: 'Make a closed fist and wrap your thumb across the front of your folded index and middle fingers.' },
  { id: 'u', name: 'U', meaning: 'Letter U', category: 'alphabet', difficulty: 'Intermediate', description: 'Extend your index and middle fingers straight up, touching each other. Fold other fingers.' },
  { id: 'v', name: 'V', meaning: 'Letter V', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your index and middle fingers straight up, separated in a V shape. Fold other fingers.' },
  { id: 'w', name: 'W', meaning: 'Letter W', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your index, middle, and ring fingers up, separated. Fold your thumb and pinky finger.' },
  { id: 'y', name: 'Y', meaning: 'Letter Y', category: 'alphabet', difficulty: 'Beginner', description: 'Extend your thumb and pinky finger fully out. Fold your index, middle, and ring fingers down.' },

  // Phrases/Words
  { id: 'hello', name: 'Hello', meaning: 'Greeting', category: 'phrases', difficulty: 'Beginner', description: 'With your hand flat, place your index finger near your temple, then wave it slightly outward like a salute.' },
  { id: 'thank_you', name: 'Thank You', meaning: 'Expression of gratitude', category: 'phrases', difficulty: 'Beginner', description: 'Touch the tips of your flat fingers to your chin/lips, then move your hand down and out towards the person.' },
  { id: 'please', name: 'Please', meaning: 'Polite request', category: 'phrases', difficulty: 'Beginner', description: 'Place your flat hand over the center of your chest and move it in a circular clockwise motion.' },
  { id: 'love_you', name: 'I Love You', meaning: 'Affection', category: 'phrases', difficulty: 'Beginner', description: 'Extend your thumb, index, and pinky fingers straight up. Keep your middle and ring fingers folded.' },
  { id: 'yes', name: 'Yes', meaning: 'Affirmative', category: 'words', difficulty: 'Intermediate', description: 'Make a fist (S shape) and tilt it forward and back repeatedly from the wrist, simulating a nodding head.' },
  { id: 'no', name: 'No', meaning: 'Negative', category: 'words', difficulty: 'Intermediate', description: 'Quickly double-tap your index and middle fingers together down onto your thumb tip.' },
];

export const GestureDictionary: React.FC = () => {
  const { setPracticeTarget, setCurrentPage } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'alphabet' | 'words' | 'phrases'>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleStartPractice = (gesture: Gesture) => {
    setPracticeTarget(gesture);
    setCurrentPage('training');
  };

  const filteredGestures = useMemo(() => {
    return aslDictionary.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.meaning.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
      
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchDiff = activeDifficulty === 'all' || item.difficulty === activeDifficulty;

      return matchSearch && matchCat && matchDiff;
    });
  }, [search, activeCategory, activeDifficulty]);

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0">
      
      {/* Search Header */}
      <GlassCard className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold tracking-wide uppercase">ASL Gesture Dictionary</h3>
          <p className="text-[10px] text-white/40 mt-0.5">Explore standard gestures, signs, and practice matching metrics.</p>
        </div>
        
        {/* Search Input bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search letters, words, meanings..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-purple/50 placeholder-white/20"
          />
        </div>
      </GlassCard>

      {/* Categories & Filter Node */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'alphabet', label: 'Alphabet A-Z' },
            { id: 'words', label: 'Common Words' },
            { id: 'phrases', label: 'Phrases' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap tracking-wide border transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-primary-purple/20 border-primary-purple text-white'
                  : 'bg-card-dark border-white/5 text-white/60 hover:text-white hover:border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty Chips */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Levels' },
            { id: 'Beginner', label: 'Beginner' },
            { id: 'Intermediate', label: 'Intermediate' }
          ].map((diff) => (
            <button
              key={diff.id}
              onClick={() => setActiveDifficulty(diff.id as any)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                activeDifficulty === diff.id
                  ? 'bg-secondary-cyan/10 border-secondary-cyan text-secondary-cyan'
                  : 'bg-card-dark border-white/5 text-white/50 hover:text-white'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>

      </div>

      {/* Grid listing */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredGestures.length === 0 ? (
          <div className="text-center py-16">
            <Compass className="h-10 w-10 text-white/20 mx-auto mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-white/70">No signs match your search</h4>
            <p className="text-xs text-white/40 mt-1">Try searching a different phrase or clearing category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGestures.map((item) => {
              const isFav = favorites.includes(item.id);
              const isBeginner = item.difficulty === 'Beginner';

              return (
                <GlassCard key={item.id} className="flex flex-col justify-between gap-4 p-5 hover:border-white/10 hover:bg-card-dark/60">
                  
                  {/* Card top banner */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Gesture graphic outline */}
                      <div className="bg-gradient-to-tr from-primary-purple/10 to-secondary-cyan/10 border border-white/5 p-3.5 rounded-2xl flex items-center justify-center font-black text-white text-lg tracking-wider font-mono shadow-inner select-none">
                        {item.name.length <= 2 ? item.name : item.name[0]}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white tracking-wide">{item.name}</h4>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isBeginner ? 'bg-success-green/10 text-success-green border border-success-green/20' : 'bg-secondary-cyan/10 text-secondary-cyan border border-secondary-cyan/20'
                          }`}>
                            {item.difficulty}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-medium capitalize">{item.category} • {item.meaning}</span>
                      </div>
                    </div>
                    
                    {/* Favorite */}
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className="text-white/40 hover:text-danger-red transition-colors cursor-pointer"
                    >
                      <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-danger-red text-danger-red' : ''}`} />
                    </button>
                  </div>

                  {/* Sign Description */}
                  <p className="text-xs text-white/60 leading-relaxed font-normal flex-1">
                    {item.description}
                  </p>

                  {/* Practice / Action */}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStartPractice(item)}
                    >
                      <Award className="h-4 w-4 mr-1.5" />
                      Practice Sign
                    </Button>
                  </div>

                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
