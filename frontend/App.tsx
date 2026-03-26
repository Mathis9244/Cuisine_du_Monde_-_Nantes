
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, Star, ArrowLeft, ExternalLink, Utensils } from 'lucide-react';
import { RESTAURANTS_DATA } from './constants';
import { Restaurant, FriendRating } from './types';
import WheelOfFortune from './components/WheelOfFortune';
import RestaurantList from './components/RestaurantList';
import StarRating from './components/StarRating';
import GooeyNav from './components/GooeyNav';
import ProfileView from './components/ProfileView';
import CountryListView from './components/CountryListView';
import AIResearch from './components/AIResearch';
import { supabase } from './lib/supabase';
import { fetchBackend } from './lib/backendApi';

const MDiv = motion.div as any;

type ViewMode = 'feed' | 'spin' | 'countries' | 'profile' | 'ai';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('feed');
  const [selectedWinner, setSelectedWinner] = useState<Restaurant | null>(null);
  const [ratingTarget, setRatingTarget] = useState<Restaurant | null>(null);
  const [viewAllCountry, setViewAllCountry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<{ id: string; email: string; username: string } | null>(null);
  const [targetProfile, setTargetProfile] = useState<{ name: string; avatar: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'join'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '' });
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS_DATA);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const username =
          (sessionUser.user_metadata?.username as string | undefined) ||
          sessionUser.email?.split('@')[0] ||
          'user';
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          username,
        });
      }
    };
    void syncSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (!sessionUser) {
        setUser(null);
        return;
      }
      const username =
        (sessionUser.user_metadata?.username as string | undefined) ||
        sessionUser.email?.split('@')[0] ||
        'user';
      setUser({
        id: sessionUser.id,
        email: sessionUser.email || '',
        username,
      });
    });
    
    const savedRatings = localStorage.getItem('nwe-ratings-store');
    if (savedRatings) {
      const parsed = JSON.parse(savedRatings);
      const currentUser = user;
      
      if (currentUser) {
        setRestaurants(prev => prev.map(res => {
          if (parsed[res.id]) {
            const hasUserRating = res.friendRatings?.some(fr => fr.name === currentUser.username);
            if (!hasUserRating) {
              const newRating: FriendRating = {
                name: currentUser.username,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
                rating: parsed[res.id]
              };
              return { ...res, friendRatings: [...(res.friendRatings || []), newRating] };
            }
          }
          return res;
        }));
      }
    }
    return () => {
      sub.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === 'join') {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { data: { username: authForm.username } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
      }

      // Optional: verify backend accepts JWT (useful smoke-test).
      await fetchBackend('/auth/me').catch(() => undefined);

      setAuthForm({ email: '', password: '', username: '' });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    void supabase.auth.signOut();
    setCurrentView('feed');
    setViewAllCountry(null);
  };

  const handleRateSuccess = (restaurantId: string, rating: number) => {
    if (!user) return;
    setRestaurants(prev => prev.map(res => {
      if (res.id === restaurantId) {
        const otherRatings = (res.friendRatings || []).filter(fr => fr.name !== user.username);
        const newRating: FriendRating = {
          name: user.username,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
          rating
        };
        return { ...res, friendRatings: [...otherRatings, newRating] };
      }
      return res;
    }));
  };

  const countries = useMemo(() => Array.from(new Set(restaurants.map(r => r.country))).sort(), [restaurants]);

  const filteredRestaurants = useMemo(() => {
    let list = restaurants;
    if (viewAllCountry) list = list.filter(r => r.country === viewAllCountry);
    return list.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, viewAllCountry, restaurants]);

  const handleNav = (label: string) => {
    setViewAllCountry(null);
    setTargetProfile(null);
    if (label === "Feed") setCurrentView('feed');
    else if (label === "Spin") setCurrentView('spin');
    else if (label === "Map") setCurrentView('countries');
    else if (label === "AI") setCurrentView('ai');
    else if (label === "You") {
      if (user) {
        setTargetProfile({ 
          name: user.username, 
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}` 
        });
        setCurrentView('profile');
      }
    }
  };

  const handleProfileView = (profile: { name: string, avatar: string }) => {
    setTargetProfile(profile);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCountrySelect = (country: string) => {
    setViewAllCountry(country);
    setCurrentView('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAtHome = currentView === 'feed' && !viewAllCountry;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#081c1b] flex items-center justify-center p-6 font-sans">
        <MDiv initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">Circle</h1>
            <p className="text-[#cbf3f0]/40 text-sm font-black uppercase tracking-[0.3em]">Verified Access Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {authError && (
              <div className="px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-200 text-xs font-bold tracking-widest">
                {authError}
              </div>
            )}
            {authMode === 'join' && (
              <input 
                required type="text" placeholder="NAME" value={authForm.username} 
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})} 
                className="w-full px-6 py-5 bg-[#0d2624] border border-[#1a3b38] rounded-3xl outline-none focus:border-[#2ec4b6] text-lg font-bold text-white placeholder-white/20 uppercase tracking-widest" 
              />
            )}
            <input 
              required type="email" placeholder="EMAIL" value={authForm.email} 
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})} 
              className="w-full px-6 py-5 bg-[#0d2624] border border-[#1a3b38] rounded-3xl outline-none focus:border-[#2ec4b6] text-lg font-bold text-white placeholder-white/20 uppercase tracking-widest" 
            />
            <input 
              required type="password" placeholder="PASSWORD" value={authForm.password} 
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})} 
              className="w-full px-6 py-5 bg-[#0d2624] border border-[#1a3b38] rounded-3xl outline-none focus:border-[#2ec4b6] text-lg font-bold text-white placeholder-white/20 uppercase tracking-widest" 
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#ff9f1c] text-[#081c1b] py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {authLoading ? '...' : authMode === 'login' ? 'Enter' : 'Join'}
            </button>
          </form>
          <div className="mt-10 text-center">
            <button onClick={() => setAuthMode(authMode === 'join' ? 'login' : 'join')} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cbf3f0]/30 hover:text-white transition-all">
              {authMode === 'join' ? 'Return to Login' : "New Membership"}
            </button>
          </div>
        </MDiv>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081c1b] text-white font-sans selection:bg-[#ff9f1c] selection:text-[#081c1b]">
      <nav className="sticky top-0 z-50 bg-[#081c1b]/80 backdrop-blur-2xl border-b border-[#1a3b38] px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center min-w-[120px]">
          {isAtHome ? (
            <div 
              className="cursor-pointer" 
              onClick={() => handleNav("Feed")}
            >
              <span className="font-black text-base md:text-lg uppercase tracking-widest text-[#ff9f1c]">Circle</span>
            </div>
          ) : (
            <button 
              onClick={() => { handleNav("Feed"); setViewAllCountry(null); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Return</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          <GooeyNav 
            items={[
              { label: "Feed", href: "#" }, 
              { label: "Map", href: "#" }, 
              { label: "Spin", href: "#" },
              { label: "AI", href: "#" },
              { label: "You", href: "#" }
            ]} 
            onNav={handleNav} 
            initialActiveIndex={currentView === 'feed' ? 0 : currentView === 'countries' ? 1 : currentView === 'spin' ? 2 : currentView === 'ai' ? 3 : 4}
          />
          <button onClick={handleLogout} className="text-[#cbf3f0]/40 hover:text-white transition-colors p-2">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="container mx-auto max-w-5xl pt-16 pb-32 px-4 md:px-8">
        <AnimatePresence mode="wait">
          {currentView === 'feed' && (
            <MDiv 
              key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-32"
            >
              <div className="max-w-3xl mx-auto">
                <div className="relative group">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-[#2ec4b6]/40" size={24} />
                  <input 
                    type="text" placeholder="FIND..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-20 pr-10 py-8 bg-[#0d2624] border border-[#1a3b38] rounded-[2.5rem] focus:border-[#2ec4b6] transition-all text-2xl font-black text-white placeholder-[#cbf3f0]/10 uppercase tracking-widest outline-none"
                  />
                </div>
              </div>

              <section id="explore">
                <RestaurantList 
                  restaurants={filteredRestaurants} 
                  onRate={setRatingTarget} 
                  onViewAll={handleCountrySelect}
                  onProfileClick={handleProfileView}
                  isFiltered={!!viewAllCountry}
                />
              </section>
            </MDiv>
          )}

          {currentView === 'spin' && (
            <MDiv key="spin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
               <WheelOfFortune countries={countries} restaurants={restaurants} onResult={setSelectedWinner} />
            </MDiv>
          )}

          {currentView === 'countries' && (
            <MDiv key="countries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
               <CountryListView countries={countries} restaurants={restaurants} onSelectCountry={handleCountrySelect} />
            </MDiv>
          )}

          {currentView === 'ai' && (
            <MDiv key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
               <AIResearch restaurants={restaurants} />
            </MDiv>
          )}

          {currentView === 'profile' && targetProfile && (
            <MDiv key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
               <ProfileView 
                  profile={targetProfile} 
                  restaurants={restaurants} 
                  onBack={() => setCurrentView('feed')} 
                  onRate={setRatingTarget}
                  onProfileClick={handleProfileView}
                />
            </MDiv>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-24 border-t border-[#1a3b38] text-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.6em]">Nantes World Eats Collective</p>
      </footer>

      <AnimatePresence>
        {ratingTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <MDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRatingTarget(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <MDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-[#0d2624] border border-[#1a3b38] rounded-[3rem] p-12 text-center">
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter text-[#ff9f1c]">Rate</h3>
              <p className="text-[#cbf3f0]/40 text-xs font-black mb-10 uppercase tracking-widest">{ratingTarget.name}</p>
              <StarRating 
                restaurantId={ratingTarget.id} 
                onRate={(val) => {
                  handleRateSuccess(ratingTarget.id, val);
                  setTimeout(() => setRatingTarget(null), 800);
                }} 
              />
              <button onClick={() => setRatingTarget(null)} className="mt-12 text-white/20 font-black text-xs uppercase tracking-[0.4em] hover:text-white">Cancel</button>
            </MDiv>
          </div>
        )}

        {selectedWinner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <MDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedWinner(null)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl" />
            <MDiv initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative w-full max-w-lg bg-[#0d2624] border border-[#1a3b38] rounded-[4rem] p-16 text-center shadow-2xl">
              <span className="inline-block px-5 py-2 bg-[#2ec4b6]/10 text-[#2ec4b6] text-[10px] font-black uppercase tracking-[0.5em] rounded-full mb-8">{selectedWinner.country}</span>
              <h2 className="text-6xl font-black text-white tracking-tighter uppercase mb-6 leading-none">{selectedWinner.name}</h2>
              <p className="text-xl text-[#cbf3f0]/80 font-medium mb-12 leading-tight">{selectedWinner.description}</p>
              <div className="flex flex-col gap-4">
                <button onClick={() => { setRatingTarget(selectedWinner); setSelectedWinner(null); }} className="w-full bg-[#ff9f1c] text-[#081c1b] py-6 rounded-3xl font-black text-sm uppercase tracking-[0.4em] active:scale-95 shadow-2xl">Score</button>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedWinner.name} ${selectedWinner.address}`)}`} 
                  target="_blank" rel="noopener noreferrer" 
                  className="w-full border-2 border-white/10 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-3 active:scale-95"
                >
                  Map <ExternalLink size={16} />
                </a>
              </div>
              <button onClick={() => setSelectedWinner(null)} className="mt-10 text-white/10 text-xs font-black uppercase tracking-[0.5em] hover:text-white transition-colors">Dismiss</button>
            </MDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

