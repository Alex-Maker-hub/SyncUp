/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  MessageSquare,
  Bookmark,
  AlertTriangle,
  User,
  PlusCircle,
  Hash,
  Compass,
  Home,
  ShieldCheck,
  Search,
  ChevronRight,
  TrendingUp,
  Smile,
  LogOut,
  Moon,
  Sun,
  Loader2,
  Lock,
  Calendar,
  Zap,
  CheckCircle2,
  Trash2,
  Coffee,
  Globe,
  Plus,
  History,
  Users,
  Share2,
  MessageCircle
} from 'lucide-react';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import { Post, UserSession, Comment, ReactionType, REACTION_MAP, CATEGORIES } from './types';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<'landing' | 'feed' | 'create' | 'explore' | 'profile' | 'admin'>('landing');
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Feed & Filter State
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [currentSort, setCurrentSort] = useState<'recent' | 'trending' | 'comments'>('recent');

  // Interactive Detailed Post Modal / View
  const [detailedPost, setDetailedPost] = useState<Post | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // New Post State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<string>('Reflection');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [newPostError, setNewPostError] = useState('');

  // Authentication Interface State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(`seed-${Math.floor(Math.random() * 1000)}`);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState<'register' | 'login'>('register');

  // Google Authentication simulation states
  const [googleStep, setGoogleStep] = useState<'none' | 'account_select' | 'generating'>('none');
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [recentGoogleEmail, setRecentGoogleEmail] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('syncup_recent_google_email') || '' : '';
  });
  const [recentGoogleName, setRecentGoogleName] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('syncup_recent_google_name') || '' : '';
  });
  // Mood Tracker State
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<'calm' | 'anxious' | 'sad' | 'excited' | 'overwhelmed' | 'peaceful'>('calm');
  const [moodNote, setMoodNote] = useState('');
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);

  // Admin and Moderation Sweep Status
  const [isAdminSweeping, setIsAdminSweeping] = useState(false);
  const [adminSweepResult, setAdminSweepResult] = useState<{ sweptCount: number; flaggedCount: number } | null>(null);
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; admins: number; databaseType: string; activeConnections: number; totalPosts: number } | null>(null);
  const [isLoadingAdminStats, setIsLoadingAdminStats] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  interface ModerationLog {
    id: string;
    action: string;
    details: string;
    adminUsername: string;
    timestamp: string;
  }

  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchAdminStats = async () => {
    setIsLoadingAdminStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setAdminStats(json.data);
      }
    } catch (e) {
      console.error('Failed to load admin metrics:', e);
    } finally {
      setIsLoadingAdminStats(false);
    }
  };

  const fetchModerationLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/moderation-logs');
      const json = await res.json();
      if (json.success && json.data) {
        setModerationLogs(json.data);
      }
    } catch (e) {
      console.error('Failed to load moderation history:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentView === 'admin' && session && session.role === 'admin') {
      fetchAdminStats();
      fetchModerationLogs();
    }
  }, [currentView, session]);

  // 1. Initial configuration load
  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (currentView !== 'landing' && currentView !== 'create' && currentView !== 'admin') {
      fetchPosts();
    }
  }, [currentView, selectedCategory, bookmarksOnly, currentSort]);

  // Fetch Session API
  const fetchSession = async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch('/api/auth/session');
      const json = await res.json();
      if (json.success && json.data) {
        setSession(json.data);
      } else {
        setSession(null);
      }
    } catch (e) {
      console.error('Failed fetching active session:', e);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Fetch Posts API
  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim() !== '') params.append('search', searchQuery);
      if (bookmarksOnly) params.append('bookmarksOnly', 'true');
      params.append('sort', currentSort);
      if (currentView === 'admin') params.append('showFlagged', 'true');

      const res = await fetch(`/api/posts?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPosts(json.data);
      }
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Trigger search on hit enter
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchPosts();
    }
  };

  // Login/Register Anonymous identity
  const handleAuth = async (isManualRandomize = false) => {
    setAuthError('');

    let usernameToPost = authUsername.trim();
    if ((isManualRandomize || usernameToPost === '') && authMethod === 'register') {
      // Create random identity
      const adjs = ['Serene', 'Calm', 'Gentle', 'Quiet', 'Mindful', 'Peaceful', 'Radiant', 'Warm', 'Cozy', 'Dreamy', 'Grateful'];
      const anims = ['Octopus', 'Seastar', 'Panda', 'Koala', 'Deer', 'Fox', 'Sprout', 'Cloud', 'Otter', 'Turtle', 'Rabbit', 'Sparrow'];
      const num = Math.floor(100 + Math.random() * 900);
      usernameToPost = `${adjs[Math.floor(Math.random() * adjs.length)]}${anims[Math.floor(Math.random() * anims.length)]}${num}`;
    }

    if (usernameToPost === '') {
      setAuthError('Please enter an alias to continue.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const endpoint = authMethod === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMethod === 'login'
        ? { username: usernameToPost }
        : { username: usernameToPost, avatarSeed: selectedAvatarSeed };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSession(json.data);
        setShowAuthModal(false);
        setAuthUsername('');
        // After log in, move to Feed immediately
        setCurrentView('feed');
      } else {
        setAuthError(json.error || 'Authentication failure.');
      }
    } catch (err) {
      setAuthError('Connection timed out. Please retry.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleAuth = async (email: string, fullName: string) => {
    setAuthError('');
    setGoogleStep('generating');
    setSelectedGoogleEmail(email);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Save to localStorage so this device remembers this specific user
        if (typeof window !== 'undefined') {
          localStorage.setItem('syncup_recent_google_email', email);
          localStorage.setItem('syncup_recent_google_name', fullName);
          setRecentGoogleEmail(email);
          setRecentGoogleName(fullName);
        }
        // Pause briefly for high aesthetic timing so they can enjoy the model working!
        setTimeout(() => {
          setSession(json.data);
          setGoogleStep('none');
          setShowAuthModal(false);
          // Reroute
          setCurrentView('feed');
        }, 1800);
      } else {
        setAuthError(json.error || 'Google authenticating service offline.');
        setGoogleStep('none');
      }
    } catch (err) {
      setAuthError('Timed out reaching Google authentication server.');
      setGoogleStep('none');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      setCurrentView('landing');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Log Mood Check-in
  const handleMoodCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmittingMood(true);
    try {
      const res = await fetch('/api/auth/update-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          note: moodNote,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSession(json.data);
        setShowMoodModal(false);
        setMoodNote('');
      }
    } catch (err) {
      console.error('Mood registration failed:', err);
    } finally {
      setIsSubmittingMood(false);
    }
  };

  // Bookmark / Save toggle
  const handleToggleBookmark = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/toggle-bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSession(json.data);
        // Sync detailedPost state if open
        if (detailedPost && detailedPost.id === postId) {
          // Note bookmarks changes are on session, posts itself remain the same
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit new story
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      setNewPostError('Story content must be filled out.');
      return;
    }

    setIsSubmittingPost(true);
    setNewPostError('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
          imageUrl: newPostImageUrl,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Clear post parameters
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostImageUrl('');
        // Reroute to Feed to see the new post along with the Gemini comforting feedback!
        setCurrentView('feed');
        setSelectedCategory('all');
        fetchPosts();
      } else {
        setNewPostError(json.error || 'Failed to file SyncUp story.');
      }
    } catch (err) {
      setNewPostError('API dispatch offline. Please try again.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Submit support emotional reaction
  const handleReact = async (postId: string, reactionType: ReactionType, e: React.MouseEvent) => {
    e.stopPropagation();
    // Guests can react too for lightweight instant high-fidelity experience!
    try {
      const res = await fetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        // Adjust client state lists
        setPosts(prev => prev.map(p => (p.id === postId ? json.data : p)));
        if (detailedPost && detailedPost.id === postId) {
          setDetailedPost(json.data);
        }
      }
    } catch (err) {
      console.error('React failed:', err);
    }
  };

  // Report post flag
  const handleReportPost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to flag this story for safety/moderation validation?')) {
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Flagged inappropriate content by community peer' }),
      });
      const json = await res.json();
      if (json.success) {
        alert('This post has been reported and sent to our calm moderation system. Thank you for keeping SyncUp safe.');
        fetchPosts();
      }
    } catch (err) {
      console.error('Report failed:', err);
    }
  };

  // Leave comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedPost || !newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${detailedPost.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentText }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDetailedPost(json.data);
        setNewCommentText('');
        // Sync in main list
        setPosts(prev => prev.map(p => (p.id === detailedPost.id ? json.data : p)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Admin moderation decisions
  const handleModerationDecision = async (postId: string, action: 'approve' | 'delete') => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        alert(action === 'delete' ? 'Story expunged.' : 'Story approved and returned to feed.');
        fetchModerationLogs();
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Gemini Sweep
  const handleGeminiSweep = async () => {
    setIsAdminSweeping(true);
    setAdminSweepResult(null);
    try {
      const res = await fetch('/api/admin/sweep', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setAdminSweepResult(json.data);
        fetchPosts();
        fetchModerationLogs();
        fetchAdminStats();
      } else {
        alert(json.error || 'Moderation sweep encountered an issue.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdminSweeping(false);
    }
  };

  // Admin clear all reported decisions
  const handleClearAllReported = async () => {
    setIsClearingAll(true);
    try {
      const res = await fetch('/api/admin/posts/clear-all-reported', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-all' }),
      });
      const json = await res.json();
      if (json.success) {
        setPosts([]);
        setShowClearAllConfirm(false);
        fetchModerationLogs();
        fetchAdminStats();
      } else {
        alert(json.error || 'Failed to clear reported posts.');
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred while attempting to clear reported posts.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Helper avatar generator using premium aesthetic SVG blocks rather than exterior mock APIs
  const renderAvatar = (seed: string, sizeClass = 'w-10 h-10') => {
    // Generate lovely soft pastel colors matching the calm purple logo UI
    const hues = [260, 280, 325, 200, 180, 220, 340];
    const index = seed ? seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
    const hue = hues[index % hues.length];
    const backgroundGradient = `linear-gradient(135deg, hsl(${hue}, 80%, 75%) 0%, hsl(${(hue + 40) % 360}, 75%, 60%) 100%)`;

    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shadow-inner select-none shrink-0 border border-white/20`}
        style={{ background: backgroundGradient }}
      >
        <span className="text-sm tracking-wide">
          {seed ? seed.slice(-3).replace(/[^a-zA-Z0-9]/g, 'S').toUpperCase() : 'SP'}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden flex flex-col font-sans selection:bg-purple-500/35">
      
      {/* GLOBAL BANNER INTEGRATED CALM GRADIENT */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full glass-effect border-b border-gray-200/50 dark:border-slate-900/50 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <button
            id="logo-button"
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all text-left group cursor-pointer"
          >
            <Logo size="md" />
          </button>

          {/* Desktop Navigation Link Cluster */}
          <nav className="hidden md:flex items-center gap-1.5 font-medium">
            <button
              onClick={() => { setCurrentView('feed'); setSelectedCategory('all'); setBookmarksOnly(false); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                currentView === 'feed' && !bookmarksOnly
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4" />
              Feed
            </button>
            <button
              onClick={() => { setCurrentView('explore'); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                currentView === 'explore'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore By Mood
            </button>
            <button
              onClick={() => {
                if (!session) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('create');
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                currentView === 'create'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Express Story
            </button>
            {session && (
              <button
                onClick={() => { setCurrentView('feed'); setSelectedCategory('all'); setBookmarksOnly(true); }}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  currentView === 'feed' && bookmarksOnly
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Bookmarks
              </button>
            )}
            {session && session.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Moderation Panel
              </button>
            )}
          </nav>

          {/* User Session Interface / Theme controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isLoadingSession ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : session ? (
              <div className="flex items-center gap-2.5">
                {/* Mood Checkin CTA */}
                <button
                  onClick={() => setShowMoodModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 rounded-lg cursor-pointer transition-all"
                >
                  <Smile className="w-3.5 h-3.5" />
                  Check-in Mood
                </button>

                <button
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition"
                  title="View your anonymous dashboard"
                >
                  {renderAvatar(session.avatarSeed, 'w-6 h-6')}
                  <span className="text-xs font-medium max-w-[120px] truncate hidden md:block">
                    {session.username}
                  </span>
                  <div className="flex items-center gap-0.5 bg-orange-500/10 text-orange-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                    <Zap className="w-3 h-3 fill-orange-500 shrink-0" />
                    <span>{session.streak}d</span>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition cursor-pointer"
                  title="Logout anonymous state"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md transition-all duration-300 hover:shadow-purple-500/20 active:scale-95 cursor-pointer"
              >
                Join Anonymously
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MOBILE NAV BOTTOM CAROUSEL INSTEAD OF OVERFLOW MENU */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-slate-900/50 px-4 py-2.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => { setCurrentView('feed'); setSelectedCategory('all'); setBookmarksOnly(false); }}
          className={`flex flex-col items-center gap-1 ${currentView === 'feed' && !bookmarksOnly ? 'text-purple-500' : 'text-gray-400'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home Feed</span>
        </button>
        <button
          onClick={() => { setCurrentView('explore'); }}
          className={`flex flex-col items-center gap-1 ${currentView === 'explore' ? 'text-purple-500' : 'text-gray-400'}`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </button>
        <button
          onClick={() => {
            if (!session) {
              setShowAuthModal(true);
            } else {
              setCurrentView('create');
            }
          }}
          className={`flex flex-col items-center gap-1 ${currentView === 'create' ? 'text-purple-500' : 'text-gray-400'}`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Express</span>
        </button>
        {session && (
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 ${currentView === 'profile' ? 'text-purple-500' : 'text-gray-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium text-center">My Zen</span>
          </button>
        )}
        {session && session.role === 'admin' && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex flex-col items-center gap-1 ${currentView === 'admin' ? 'text-red-500' : 'text-gray-400'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-medium text-center">Moderate</span>
          </button>
        )}
      </div>

      {/* CORE PORTAL MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-12 h-full">
        
        {/* ==================== 1. LANDING PAGE ==================== */}
        {currentView === 'landing' && (
          <section className="flex flex-col items-center justify-center text-center py-10 md:py-16 max-w-4xl mx-auto">
            
            {/* Ambient pulsing visual back-circle */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-purple-500/25 blur-3xl rounded-full w-48 h-48 mx-auto -translate-y-5 animate-pulse" />
              <Logo size="xl" showTagline={false} />
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mt-6 leading-[1.15] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-purple-200 dark:to-slate-100 bg-clip-text text-transparent">
              Your story deserves to be heard<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Share anonymously.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-2xl select-text">
              Share your feelings, experiences and stories anonymously. Connect with people who truly understand. No judgement. No barriers.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                onClick={() => {
                  if (session) {
                    setCurrentView('feed');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                Inhale Calmly & Enter Feed
              </button>
              
              <button
                onClick={() => {
                  setCurrentView('explore');
                }}
                className="w-full sm:w-auto px-8 py-4 font-semibold text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl hover:bg-white dark:hover:bg-slate-900/80 transition-all border border-gray-200 dark:border-slate-800/80 cursor-pointer"
              >
                Explore Quiet Stories
              </button>
            </div>

            {/* HOW SYNCUP WORKS SECTION */}
            <div className="mt-20 md:mt-28 w-full text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                How <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">SyncUp</span> works
              </h2>
              <p className="text-sm text-gray-400 dark:text-zinc-400 font-medium">
                Three simple steps to start your anonymous journey.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left w-full">
                <div className="p-7 rounded-3xl border border-gray-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md hover:border-purple-500/20 transition-all group flex gap-4">
                  <span className="font-mono text-3xl font-extrabold text-purple-600/30 dark:text-purple-400/25 shrink-0 select-none">
                    01
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white transition-colors group-hover:text-purple-500">
                      Sign up anonymously
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Create your account. No real name needed. You get a unique anonymous identity automatically.
                    </p>
                  </div>
                </div>

                <div className="p-7 rounded-3xl border border-gray-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md hover:border-purple-500/20 transition-all group flex gap-4">
                  <span className="font-mono text-3xl font-extrabold text-purple-600/30 dark:text-purple-400/25 shrink-0 select-none">
                    02
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white transition-colors group-hover:text-purple-500">
                      Share your story
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Write what is on your mind. Add an image if you like. Choose a mood category.
                    </p>
                  </div>
                </div>

                <div className="p-7 rounded-3xl border border-gray-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md hover:border-purple-500/20 transition-all group flex gap-4">
                  <span className="font-mono text-3xl font-extrabold text-purple-600/30 dark:text-purple-400/25 shrink-0 select-none">
                    03
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white transition-colors group-hover:text-purple-500">
                      Connect & support
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      React to stories. Leave supportive comments. Build genuine connections.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* EVERYTHING YOU NEED TO CONNECT SECTION */}
            <div className="mt-20 md:mt-28 w-full text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">connect</span>
              </h2>
              <p className="text-sm text-gray-400 dark:text-zinc-400 font-medium">
                Built for people who need a safe space to express themselves without fear.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left w-full">
                <div className="p-7 rounded-3xl border border-gray-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md hover:border-purple-500/20 transition-all group space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                      Connect
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                      Find people who truly understand what you are going through.
                    </p>
                  </div>
                </div>

                <div className="p-7 rounded-3xl border border-gray-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md hover:border-purple-500/20 transition-all group space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                      Chat
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                      Share thoughts, receive support, and never feel alone again.
                    </p>
                  </div>
                </div>

                <div className="p-7 rounded-3xl border border-gray-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md hover:border-purple-500/20 transition-all group space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">
                      Share
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                      Post your story anonymously. No judgment. No names.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE SYSTEM STATS */}
            <div className="mt-16 text-xs text-gray-400 dark:text-gray-500 bg-gray-100/40 dark:bg-slate-900/30 px-5 py-3 rounded-full border border-gray-200/40 dark:border-slate-800/20 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYNCUP CALM SECTOR: ONLINE</span>
              <span>•</span>
              <span>UTC TIMESTAMPS SECURED</span>
            </div>

          </section>
        )}

        {/* ==================== 2. STORIES FEED VIEW ==================== */}
        {currentView === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Feed Left column: filters */}
            <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 space-y-6">
              
              {/* Profile Card Summary */}
              {session && (
                <div className="p-5 rounded-3xl border border-gray-200 dark:border-slate-900 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    {renderAvatar(session.avatarSeed, 'w-12 h-12')}
                    <div className="leading-tight">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">Anonymous Alias</p>
                      <h4 className="font-display font-semibold text-base">{session.username}</h4>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-slate-800" />

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-2xl">
                      <span className="block text-xs text-gray-500 dark:text-zinc-400">Zen Streak</span>
                      <span className="text-lg font-bold text-orange-500 flex items-center justify-center gap-1 mt-0.5">
                        <Zap className="w-4 h-4 fill-orange-500" />
                        {session.streak} Days
                      </span>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-2xl">
                      <span className="block text-xs text-gray-500 dark:text-zinc-400">Journals</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
                        {session.moodHistory.length} Saved
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMoodModal(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <Smile className="w-4 h-4" />
                    Today's Mood Check-in
                  </button>
                </div>
              )}

              {/* Category selector / Quick Links */}
              <div className="p-5 rounded-3xl border border-gray-200 dark:border-slate-900 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                <h3 className="font-display font-semibold text-sm text-gray-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Categories</span>
                  <Hash className="w-4 h-4 text-purple-500" />
                </h3>

                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                      selectedCategory === 'all'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span># All Stories</span>
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        selectedCategory === cat
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/5'
                      }`}
                    >
                      <span># {cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood guidance card */}
              <div className="p-5 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-md relative overflow-hidden text-left">
                <h4 className="font-display font-semibold text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Struggling?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  You are not alone. Expressing feelings anonymously allows you to discharge emotional stress safely. Our community is here to support.
                </p>
                <button
                  onClick={() => {
                    if (!session) setShowAuthModal(true);
                    else setCurrentView('create');
                  }}
                  className="mt-3.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  Write Your Story
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </aside>

            {/* Feed Middle column: post cards */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Mobile and Tablet Horizontal Category Carousel */}
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-none max-w-full">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/10'
                      : 'bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  All Stories
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/10'
                        : 'bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    #{cat}
                  </button>
                ))}
              </div>
              
              {/* Search & Sort utility bar */}
              <div className="p-4 rounded-2xl border border-gray-200/70 dark:border-slate-900 bg-white/75 dark:bg-slate-900/60 backdrop-blur" id="search-bar">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  
                  {/* Search Input */}
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 M-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search confessions, struggles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/60 border border-transparent dark:border-slate-750/30 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Sorting Tabs */}
                  <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto select-none">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0 ml-1">Sort:</span>
                    <button
                      onClick={() => { setCurrentSort('recent'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition ${
                        currentSort === 'recent'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
                          : 'text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Latest
                    </button>
                    <button
                      onClick={() => { setCurrentSort('trending'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition flex items-center gap-1 ${
                        currentSort === 'trending'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
                          : 'text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </button>
                    <button
                      onClick={() => { setCurrentSort('comments'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition ${
                        currentSort === 'comments'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
                          : 'text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Most Discussed
                    </button>
                  </div>

                </div>
              </div>

              {/* Loading Status Indicator */}
              {isLoadingPosts ? (
                <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tuning calm frequency feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-16 rounded-3xl border border-dashed border-gray-200 dark:border-slate-900 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-gray-400">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-semibold text-lg">Silence in SyncUp</h4>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    No matching stories were registered under this search or category filter. Be the first to express your thoughts beautifully.
                  </p>
                  <button
                    onClick={() => {
                      if (!session) setShowAuthModal(true);
                      else setCurrentView('create');
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Share Your Thought Now
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => {
                    const isBookmarked = session?.bookmarks.includes(post.id);
                    return (
                      <article
                        key={post.id}
                        id={`post-card-${post.id}`}
                        onClick={() => setDetailedPost(post)}
                        className="p-5 md:p-6 rounded-3xl border border-gray-200/80 dark:border-slate-900 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-left relative overflow-hidden group hover:border-purple-500/20"
                      >
                        {/* CATEGORY & ACTION HEADER */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 tracking-wider uppercase">
                              {post.category}
                            </span>
                            <span className="text-gray-400 select-none">•</span>
                            <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Bookmark Button */}
                            <button
                              onClick={(e) => handleToggleBookmark(post.id, e)}
                              className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer ${
                                isBookmarked ? 'text-amber-500' : 'text-gray-400'
                              }`}
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>
                            {/* Report Button */}
                            <button
                              onClick={(e) => handleReportPost(post.id, e)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition cursor-pointer"
                              title="Flag as inappropriate"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* ANONYMOUS AUTHOR CHIP */}
                        <div className="flex items-center gap-2.5 mt-4">
                          {renderAvatar(post.avatarSeed, 'w-8 h-8')}
                          <div>
                            <span className="font-display font-bold text-sm text-gray-800 dark:text-white block">
                              {post.username}
                            </span>
                          </div>
                        </div>

                        {/* CONTENT WRAPPER */}
                        <div className="mt-4 space-y-3">
                          <h3 className="font-display font-extrabold text-lg md:text-xl text-gray-900 dark:text-white leading-snug group-hover:text-purple-500 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-full truncate-multiline select-text line-clamp-3">
                            {post.content}
                          </p>

                          {post.imageUrl && (
                            <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mt-3 relative">
                              <img
                                src={post.imageUrl}
                                alt="Ambient Story Visual"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 duration-slow"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>

                        {/* COMPASSIONATE AI GUIDE REFLECTION */}
                        {post.aiReflection && (
                          <div className="mt-5 p-4 rounded-2xl border border-indigo-500/15 bg-slate-50 dark:bg-indigo-950/20 text-[13px] border-l-4 border-l-purple-500 relative">
                            <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[9px] text-purple-600 dark:text-purple-400 font-mono tracking-wider font-bold uppercase select-none">
                              <Sparkles className="w-3.5 h-3.5" />
                              Empathetic Reflection
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 italic pr-24 line-clamp-2 leading-relaxed">
                              &ldquo;{post.aiReflection}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* FOOTER REACTIONS */}
                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                          
                          {/* Empathy Reactions Pill List */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(Object.keys(REACTION_MAP) as ReactionType[]).map(rType => {
                              const details = REACTION_MAP[rType];
                              const count = post.reactions[rType] || 0;
                              const userKey = session ? session.id : "guest-visitor";
                              const hasReacted = post.userReactions && post.userReactions[userKey] === rType;

                              return (
                                <button
                                  key={rType}
                                  onClick={(e) => handleReact(post.id, rType, e)}
                                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                                    hasReacted
                                      ? 'bg-purple-500 text-white border-purple-500'
                                      : `${details.color} border-transparent`
                                  }`}
                                >
                                  <span>{details.emoji}</span>
                                  <span>{details.label}</span>
                                  {count > 0 && <span className="font-bold opacity-90 ml-0.5">{count}</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* Comments total */}
                          <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400 font-medium">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments.length} anonymous responses</span>
                          </div>

                        </div>

                      </article>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==================== 3. EXPRESS STORY / WRITE POST VIEW ==================== */}
        {currentView === 'create' && (
          <section className="max-w-3xl mx-auto py-4">
            
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-extrabold flex items-center gap-2">
                  <PlusCircle className="w-7 h-7 text-purple-500" />
                  Express Quietly
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Draft anonymously. Safe scan is automatically performed. Free self-expression.
                </p>
              </div>

              <button
                onClick={() => setCurrentView('feed')}
                className="text-xs font-semibold px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl transition cursor-pointer"
              >
                Back To Feed
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-slate-900 bg-white dark:bg-slate-900/60 shadow-lg space-y-6 text-left">
              
              {newPostError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold leading-relaxed">
                  {newPostError}
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Struggling to breathe in exam rooms / Letting go of yesterday"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-150 dark:bg-slate-850/60 border border-gray-200 dark:border-slate-850 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Category selector & Optional Image UI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Category Tag (Mandatory)
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-150 dark:bg-slate-850/60 border border-gray-200 dark:border-slate-850 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 select-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}># {cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Tranquil Unsplash Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g., https://images.unsplash.com/photo-1518241353330..."
                    value={newPostImageUrl}
                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-150 dark:bg-slate-850/60 border border-gray-200 dark:border-slate-850 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

              </div>

              {/* Content Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Your Story (Write anonymously...)
                </label>
                <textarea
                  required
                  rows={6}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Express your raw thoughts, emotions, a heavy secret or confession in confidence without any social judgment..."
                  className="w-full px-4 py-3 bg-slate-150 dark:bg-slate-850/60 border border-gray-200 dark:border-slate-850 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-sans"
                />
              </div>

              {/* Safety notice in form footing */}
              <div className="p-4 rounded-2xl border border-purple-500/10 bg-purple-500/5 text-xs text-gray-500 dark:text-gray-400 leading-normal flex items-start gap-2 max-w-2xl">
                <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-700 dark:text-gray-200 block">AI Empathy Guidance Triggered On Submit</span>
                  SyncUp uses the Gemini API to conduct rapid semantic safety checks (censoring suicidal intent or severe hate crimes) while simultaneously generating standard, heartwarming empathetic advice reflections to hold a gentle space for you.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-6 py-3 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="px-7 py-3 text-white font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 active:scale-95"
                >
                  {isSubmittingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Seeking Gemini Reflection...
                    </>
                  ) : (
                    <>
                      <span>Submit Anonymously</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </section>
        )}

        {/* ==================== 4. EXPLORE/MOOD CATEGORIES VIEW ==================== */}
        {currentView === 'explore' && (
          <section className="space-y-8 text-left">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold flex items-center gap-2">
                <Compass className="w-8 h-8 text-purple-500" />
                Explore By Atmosphere
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Filter emotional storytelling feeds by specific behavioral vibes and categories.
              </p>
            </div>

            {/* Aesthetic Grid representation */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Confession', desc: 'Discharging heavy secrets and honest stories.', icon: '🤐', color: 'from-amber-600/10 to-amber-700/5 border-amber-500/20 text-amber-500' },
                { name: 'Struggle', desc: 'Tackling emotional storms, anxious times, and hardship.', icon: '⛈️', color: 'from-blue-600/10 to-blue-700/5 border-blue-500/20 text-blue-500' },
                { name: 'Reflection', desc: 'Slower paced wisdom, lessons, and philosophical logs.', icon: '🕯️', color: 'from-purple-600/10 to-purple-700/5 border-purple-500/20 text-purple-500' },
                { name: 'Gratitude', desc: 'Documenting beautiful, quiet morning joys and teas.', icon: '🍵', color: 'from-emerald-600/10 to-emerald-700/5 border-emerald-500/20 text-emerald-500' },
                { name: 'Dream', desc: 'Sailing plans, creative hopes, and starry horizons.', icon: '🌠', color: 'from-pink-600/10 to-pink-700/5 border-pink-500/20 text-pink-500' },
                { name: 'Celebration', desc: 'Victories, tiny habits formed, positive milestones.', icon: '🎉', color: 'from-rose-600/10 to-rose-700/5 border-rose-500/20 text-rose-500' },
              ].map(item => (
                <button
                  key={item.name}
                  onClick={() => {
                    setSelectedCategory(item.name);
                    setCurrentView('feed');
                  }}
                  className={`p-6 rounded-3xl border text-left bg-gradient-to-br hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between h-44 ${item.color}`}
                >
                  <span className="text-3xl select-none">{item.icon}</span>
                  <div>
                    <h3 className="font-display font-extrabold text-base md:text-lg text-slate-900 dark:text-white group-hover:underline">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-8 rounded-3xl border border-gray-200 dark:border-slate-900 bg-white dark:bg-slate-900/60 shadow-md">
              <h2 className="font-display font-extrabold text-lg flex items-center gap-1.5 mb-2">
                <Heart className="w-5 h-5 text-purple-500" />
                SyncUp Healing Philosophy
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-4xl">
                We believe in non-comparative digital habitats. Under SyncUp, standard social elements such as user followers indices or identity points badges are fully disabled. We strive to recreate a slow, premium emotional decompression card-flow mimicking a private visual journal that encourages mindfulness, quiet focus, and healthy community reactions.
              </p>
            </div>

          </section>
        )}

        {/* ==================== 5. PROFILE / MY DASHBOARD ==================== */}
        {currentView === 'profile' && session && (
          <section className="space-y-8 text-left">
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                {renderAvatar(session.avatarSeed, 'w-16 h-16')}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-display font-extrabold">{session.username}</h1>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider font-bold bg-purple-500/20 text-purple-400 uppercase">
                      {session.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Stay In Sync member since {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Streak Widget */}
              <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 px-5 py-3 rounded-2xl">
                <Zap className="w-8 h-8 text-orange-500 fill-orange-500 animate-bounce" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Your Streak</p>
                  <p className="text-xl font-extrabold text-orange-500 mt-0.5">{session.streak} Mindfulness Days</p>
                </div>
              </div>
            </div>

            {/* Mood Calendar Visual Grid */}
            <div className="p-6 rounded-3xl border border-gray-200 dark:border-slate-900 bg-white dark:bg-slate-900/60 shadow-sm">
              <h2 className="font-display font-extrabold text-base flex items-center gap-2 mb-4">
                <Smile className="w-5 h-5 text-emerald-500" />
                Mood Alignment History
              </h2>

              {session.moodHistory.length === 0 ? (
                <div className="p-10 border border-dashed border-gray-150 dark:border-slate-800 rounded-2xl text-center">
                  <p className="text-sm text-gray-400">No mood check-ins filed yet. Alignment updates help to sustain your streak!</p>
                  <button
                    onClick={() => setShowMoodModal(true)}
                    className="mt-3.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Check-in Mood Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Visual timeline cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {session.moodHistory.slice(-6).map((item, idx) => {
                      const moodColors: Record<string, string> = {
                        calm: 'from-cyan-500/10 to-blue-500/5 text-cyan-500 border-cyan-500/20',
                        anxious: 'from-amber-500/10 to-orange-500/5 text-amber-500 border-amber-500/20',
                        sad: 'from-indigo-500/10 to-purple-500/5 text-indigo-500 border-indigo-500/20',
                        excited: 'from-rose-500/10 to-pink-500/5 text-rose-500 border-rose-500/20',
                        overwhelmed: 'from-red-500/10 to-orange-500/5 text-red-500 border-red-500/20',
                        peaceful: 'from-emerald-500/10 to-teal-500/5 text-emerald-500 border-emerald-500/20',
                      };

                      const col = moodColors[item.mood] || 'from-gray-500/10 to-gray-600/5 text-gray-500 border-gray-500/20';
                      return (
                        <div key={idx} className={`p-4 rounded-2xl border bg-gradient-to-br ${col}`}>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="uppercase tracking-wider"># {item.mood}</span>
                            <span className="font-mono text-[10px] opacity-85">{item.date}</span>
                          </div>
                          {item.note && (
                            <p className="text-xs text-gray-600 dark:text-zinc-300 italic mt-2.5 line-clamp-2">
                              &ldquo;{item.note}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowMoodModal(true)}
                      className="text-xs font-semibold px-4.5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Check-in Another Mood
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Simple static notice */}
            <div className="p-6 rounded-3xl border border-gray-200 dark:border-slate-900 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <h2 className="font-display font-extrabold text-base flex items-center gap-1.5">
                <Bookmark className="w-5 h-5 text-purple-500" />
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setCurrentView('feed'); setSelectedCategory('all'); setBookmarksOnly(true); }}
                  className="px-4.5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Bookmark className="w-4 h-4 text-purple-500" />
                  View Bookmarked Stories
                </button>

                <button
                  onClick={() => { setCurrentView('feed'); setSelectedCategory('all'); setBookmarksOnly(false); }}
                  className="px-4.5 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-4 h-4 text-blue-500" />
                  Browse Collective Feed
                </button>

                {session.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="px-4.5 py-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-red-500" />
                    Open Security Incident Board
                  </button>
                )}
              </div>
            </div>

          </section>
        )}

        {/* ==================== 6. MODERATION/ADMIN PANELS ==================== */}
        {currentView === 'admin' && session && session.role === 'admin' && (
          <section className="space-y-8 text-left">
            
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-red-500" />
                  SyncUp Incident Board
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Approve, dismiss reports, or trigger Gemini safety sweeps directly on the database.
                </p>
              </div>

              {/* Gemini Trigger Sweeper Button */}
              <button
                disabled={isAdminSweeping}
                onClick={handleGeminiSweep}
                className="w-full md:w-auto px-5 py-3 text-xs font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isAdminSweeping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Safe Index...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Moderation Sweep (Gemini)
                  </>
                )}
              </button>
            </div>

            {adminSweepResult && (
              <div className="p-4.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Index sweep complete. Evaluated: {adminSweepResult.sweptCount} items. Flagged: {adminSweepResult.flaggedCount} unsafe stories containing triggers.
              </div>
            )}

            {/* Dashboard metrics area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">Registered Users</p>
                  <p className="text-3xl font-display font-extrabold text-indigo-600 dark:text-indigo-400">
                    {isLoadingAdminStats ? (
                      <Loader2 className="w-6 h-6 animate-spin inline-block text-purple-500 text-sm" />
                    ) : (
                      adminStats?.totalUsers ?? '...'
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Includes {adminStats?.admins ?? '...'} administrators</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm shrink-0">
                  <User className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="space-y-1 overflow-hidden">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">Database Context</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 truncate pr-2" title={adminStats?.databaseType}>
                    {isLoadingAdminStats ? (
                      <Loader2 className="w-4 h-4 animate-spin inline-block text-purple-500 text-sm" />
                    ) : (
                      adminStats?.databaseType ?? 'Loading context...'
                    )}
                  </p>
                  <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                    Connection Active
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">Total Publications</p>
                  <p className="text-3xl font-display font-extrabold text-purple-600 dark:text-purple-400">
                    {isLoadingAdminStats ? (
                      <Loader2 className="w-6 h-6 animate-spin inline-block text-purple-500 text-sm" />
                    ) : (
                      adminStats?.totalPosts ?? '...'
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Synced posts & warnings</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl shadow-sm shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-red-500/10 bg-white dark:bg-slate-900/60 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="font-display font-extrabold text-base flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                  Peer Warning Queue ({posts.length} reported)
                </h2>
                {posts.length > 0 && (
                  <button
                    onClick={() => setShowClearAllConfirm(true)}
                    className="px-4 py-2 hover:bg-red-500/15 border border-red-500/25 dark:border-red-500/35 text-red-600 dark:text-red-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Reported ({posts.length})
                  </button>
                )}
              </div>

              {posts.length === 0 ? (
                <div className="p-16 text-center text-gray-400 border border-dashed border-gray-150 dark:border-slate-800 rounded-3xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto stroke-1" />
                  <p className="text-sm font-semibold mt-4 text-gray-500 dark:text-gray-400">SyncUp is entirely clean!</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">No reports pending moderation review. All systems in perfect emotional synchronization.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div
                      key={post.id}
                      className="p-4 rounded-2xl border border-red-500/20 dark:border-red-950/30 bg-red-500/5 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] font-bold tracking-wider uppercase bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                            Flagged Reason: {post.reportReason || 'Not specified'}
                          </span>
                          <h3 className="font-display font-extrabold text-base mt-2">{post.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Published by @{post.username}</p>
                        </div>

                        {/* Mod buttons */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleModerationDecision(post.id, 'approve')}
                            className="px-3 pl-2.5 py-1.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerationDecision(post.id, 'delete')}
                            className="px-3 pl-2.5 py-1.5 text-[11px] font-semibold bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Expunge
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal max-w-4xl italic p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl">
                        &ldquo;{post.content}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ==================== 6B. AUDIT MODERATION HISTORY TRACE ==================== */}
            <div className="p-6 rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="font-display font-extrabold text-base flex items-center gap-1.5">
                    <History className="w-5 h-5 text-purple-500" />
                    Moderation Account Activity History
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Real-time trace of recent administrative security operations & safety decisions</p>
                </div>
                {isLoadingLogs && <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />}
              </div>

              {moderationLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-400 border border-dashed border-gray-150 dark:border-slate-850 rounded-2xl">
                  <p className="text-xs">No administrative tasks have been logged yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800/40 divide-dashed">
                  {moderationLogs.slice(0, 10).map((log) => {
                    let actionBadgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
                    if (log.action === "Post Expunged" || log.action === "Board Cleared") {
                      actionBadgeColor = "bg-red-500/10 text-red-600 dark:text-red-400";
                    } else if (log.action === "Post Approved") {
                      actionBadgeColor = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
                    } else if (log.action === "Gemini AI Sweep") {
                      actionBadgeColor = "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400";
                    }

                    return (
                      <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-left">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg font-mono text-[9px] font-bold tracking-wider uppercase ${actionBadgeColor}`}>
                              {log.action}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              By @{log.adminUsername}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans mt-1">
                            {log.details}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 select-none sm:pt-1">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full py-8 border-t border-gray-200/50 dark:border-slate-900/50 text-center text-xs text-gray-400 mt-auto select-none font-mono">
        <p>© 2026 SyncUp Technology Inc • "Stay In Sync."</p>
        <p className="mt-1 text-[10px] opacity-70">Secured Anonymous Compartment Network. Empathy powered globally by Gemini Models.</p>
      </footer>

      {/* ==================== ANONYMOUS JOIN AUTH MODAL ==================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative text-left overflow-hidden transition-all duration-350 scrollbar-none">
            
            {/* Ambient glowing orb for AI/Google integration state */}
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${
              googleStep === 'generating' ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'
            }`} />

            <button
              onClick={() => {
                setShowAuthModal(false);
                setGoogleStep('none');
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer z-10"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* STEP 1: INITIAL SELECTION FOR COVER */}
            {googleStep === 'none' && (
              <div className="space-y-5">
                <div className="text-center space-y-1.5 mb-2">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center">
                      <Lock className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">Choose Your Cover</h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400">
                    Join SyncUp safely. Go completely anonymous, or sign in securely with Google to preserve your stats while staying anonymous!
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-xs leading-relaxed rounded-xl">
                    {authError}
                  </div>
                )}

                {/* Google Auth Integration Hook (Preserving Stats but Anonymous!) */}
                <button
                  type="button"
                  onClick={() => setGoogleStep('account_select')}
                  className="w-full py-3.5 px-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center font-semibold text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 active:scale-98 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.47-.84-1.12-1.19-2.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google Account
                </button>

                <div className="flex items-center justify-between py-1">
                  <span className="h-[1px] w-[35%] bg-gray-200 dark:bg-slate-800" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Or use instant pseudonyms</span>
                  <span className="h-[1px] w-[35%] bg-gray-200 dark:bg-slate-800" />
                </div>

                <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-slate-100/50 dark:bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => { setAuthMethod('register'); setAuthError(''); }}
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                      authMethod === 'register'
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Create Alias
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMethod('login'); setAuthError(''); }}
                    className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                      authMethod === 'login'
                        ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Existing Sign In
                  </button>
                </div>

                {/* Avatar Selector Showcase - Only show during Register */}
                {authMethod === 'register' && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Select Visual Energy Aura
                    </label>
                    <div className="flex items-center gap-2.5">
                      {renderAvatar(selectedAvatarSeed, 'w-12 h-12')}
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarSeed(`seed-${Math.floor(Math.random() * 1000)}`)}
                        className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-300 transition cursor-pointer"
                      >
                        Randomize Aura
                      </button>
                    </div>
                  </div>
                )}

                {/* Pseudo input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {authMethod === 'register' ? 'Choose Custom Alias' : 'Enter Registered Alias'}
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    placeholder={authMethod === 'register' ? "e.g. DreamyOtter99 (Leave blank for auto-generate)" : "e.g. QuietModerator"}
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-transparent dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  {authMethod === 'login' && (
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                      💡 Tip: Signing in with aliases containing <strong>admin</strong> or <strong>moderator</strong> (like <em>QuietModerator</em>) auto-grants site dashboard access.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {authMethod === 'register' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAuth(true)}
                        disabled={isAuthenticating}
                        className="px-4 py-3 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center flex items-center justify-center text-slate-600 dark:text-gray-300"
                      >
                        Skip & Randomize
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAuth(false)}
                        disabled={isAuthenticating}
                        className="px-4 py-3 text-white font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md text-xs cursor-pointer transition text-center flex items-center justify-center active:scale-95"
                      >
                        {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Profile'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(false)}
                        className="px-4 py-3 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center flex items-center justify-center text-slate-600 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAuth(false)}
                        disabled={isAuthenticating}
                        className="px-4 py-3 text-white font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md text-xs cursor-pointer transition text-center flex items-center justify-center active:scale-95"
                      >
                        {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: SIMULATED GOOGLE ACCOUNT SELECTOR */}
            {googleStep === 'account_select' && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-gray-800 dark:text-gray-200">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.47-.84-1.12-1.19-2.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="font-display font-bold text-lg">Sign in with Google</span>
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    to continue securely to <strong className="text-purple-500 font-bold">SyncUp</strong>
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* Account choice list */}
                  <div className="rounded-2xl border border-gray-150 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                    
                   {/* Account choice list */}
                  <div className="rounded-2xl border border-gray-150 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {/* 1. Device-specific Account (Dynamic) */}
                    {recentGoogleEmail ? (
                      <button
                        type="button"
                        onClick={() => handleGoogleAuth(recentGoogleEmail, recentGoogleName || recentGoogleEmail.split('@')[0])}
                        className="w-full p-4 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow uppercase">
                            {(recentGoogleName || recentGoogleEmail).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="leading-tight">
                            <h4 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2">
                              {recentGoogleName || recentGoogleEmail.split('@')[0]}
                              <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-normal font-sans">Recent on this Device</span>
                            </h4>
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">{recentGoogleEmail}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ) : (
                      /* If they haven't logged in on this device, prompt them to use the customized form below, or select a mock profile */
                      <div className="p-4 bg-purple-50/20 dark:bg-purple-950/10 text-center text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                        No Google session saved on this device. Use the <strong className="font-bold">Custom Sign In</strong> form below to enter your email.
                      </div>
                    )}

                    {/* 2. Public sandbox profiles */}
                    <button
                      type="button"
                      onClick={() => handleGoogleAuth('anonymous.guide@gmail.com', 'Calm Guide')}
                      className="w-full p-4 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow animate-pulse">
                          CG
                        </div>
                        <div className="leading-tight">
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white">Calm Guide</h4>
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">anonymous.guide@gmail.com</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                    {/* Secondary developer mock account */}
                    <button
                      type="button"
                      onClick={() => handleGoogleAuth('anonymous.guide@gmail.com', 'Calm Guide')}
                      className="w-full p-4 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                          CG
                        </div>
                        <div className="leading-tight">
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white">Calm Guide</h4>
                          <span className="text-[11px] text-gray-500 dark:text-slate-400">anonymous.guide@gmail.com</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Custom email option */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-gray-100 dark:border-slate-800/80 space-y-2.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Use customized testing Account
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="your.email@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customGoogleEmail.trim().includes('@')) {
                            const namePart = customGoogleEmail.split('@')[0];
                            const dispName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                            handleGoogleAuth(customGoogleEmail.trim().toLowerCase(), dispName);
                          } else {
                            alert('Please enter a valid Google email.');
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition"
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setGoogleStep('none')}
                    className="text-xs text-gray-500 dark:text-slate-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer font-medium"
                  >
                    ← Back to custom handle
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DYNAMIC AI NAME GENERATION STAGE (REPRESENTING GROQ API OUTCOME) */}
            {googleStep === 'generating' && (
              <div className="py-8 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
                  <div className="absolute inset-2 bg-purple-500/10 rounded-full animate-pulse" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-emerald-400 flex items-center justify-center shadow-lg relative">
                    <Sparkles className="w-5 h-5 text-white animate-spin duration-300" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Generative Session Alignment</h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                    Authenticating <strong className="text-purple-500">{selectedGoogleEmail}</strong> securely and consulting local model layer to generate an anonymous signature alias.
                  </p>
                </div>

                {/* Simulated Groq execution logs for architectural fidelity */}
                <div className="p-3.5 bg-slate-950/90 dark:bg-black rounded-2xl text-left border border-slate-900 font-mono text-[10px] text-emerald-400 space-y-1.5 shadow-inner leading-relaxed">
                  <div className="flex justify-between">
                    <span className="opacity-60">[STAGE-1] Secure OAuth verified</span>
                    <span className="text-gray-500">done</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">[STAGE-2] Querying LLM Cover generator...</span>
                    <span className="text-purple-400 animate-pulse">active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-40">[STAGE-3] Index uniqueness checked</span>
                    <span className="text-gray-600">pending</span>
                  </div>
                  <div className="text-[9px] text-gray-400 pt-1 pb-0.5 border-t border-slate-900 flex justify-between select-none">
                    <span>ENGINE: GEMINI-3.5-FLASH</span>
                    <span>TEMP: 0.70</span>
                  </div>
                </div>

                <div className="text-xs text-indigo-500 dark:text-indigo-300 font-mono flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Please hold a steady chest breathing rhythm...
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==================== MOOD CHECK-IN MODAL ==================== */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative text-left scrollbar-none">
            
            <button
              onClick={() => setShowMoodModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-1.5 mb-6">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Smile className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">Daily Mood Alignment</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400">
                Log your alignment to keep your mindfulness streak strong.
              </p>
            </div>

            <form onSubmit={handleMoodCheckIn} className="space-y-5">
              
              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'peaceful', label: 'Peaceful 🍵', color: 'border-emerald-500/30 font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15' },
                  { key: 'calm', label: 'Calm 🕯️', color: 'border-cyan-500/30 font-semibold bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/15' },
                  { key: 'excited', label: 'Excited ✨', color: 'border-rose-500/30 font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/15' },
                  { key: 'anxious', label: 'Anxious 🌫️', color: 'border-amber-500/30 font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/15' },
                  { key: 'sad', label: 'Sad 🍂', color: 'border-indigo-500/30 font-semibold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/15' },
                  { key: 'overwhelmed', label: 'Heavy ⛈️', color: 'border-red-500/30 font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/15' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedMood(item.key as any)}
                    className={`p-3 rounded-xl border text-xs text-center cursor-pointer transition ${
                      selectedMood === item.key
                        ? 'ring-2 ring-emerald-500 font-bold scale-[1.03]'
                        : `${item.color}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Mood Reflection Capsule (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Enjoying chamomile tea in the morning quietness"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Streak info banner */}
              <div className="p-3.5 rounded-xl bg-orange-500/5 text-[11px] text-zinc-500 leading-normal border border-orange-500/10 flex items-start gap-1.5">
                <Zap className="w-5 h-5 text-orange-500 fill-orange-500 shrink-0 mt-0.5" />
                <div>
                  Checking in bumps up your streak metrics by 1 day and appends a colorized block onto your historical profile graph grid.
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmittingMood}
                className="w-full py-3.5 font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow cursor-pointer text-xs flex items-center justify-center gap-1 active:scale-95"
              >
                {isSubmittingMood ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sustain Alignment'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ==================== 7. DETAILED STORY VIEW MODAL ==================== */}
      {detailedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto p-5 md:p-7 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative text-left scrollbar-none">
            
            {/* Close */}
            <button
              onClick={() => setDetailedPost(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* HEADER */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 tracking-wider uppercase">
                {detailedPost.category}
              </span>
              <span className="text-gray-400 select-none">•</span>
              <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                {new Date(detailedPost.createdAt).toLocaleDateString()} at {new Date(detailedPost.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mt-4">
              {renderAvatar(detailedPost.avatarSeed, 'w-10 h-10')}
              <div>
                <span className="font-display font-bold text-sm text-gray-800 dark:text-white block">
                  {detailedPost.username}
                </span>
                <span className="block text-[10px] text-gray-400 font-mono">Anonymous Peer</span>
              </div>
            </div>

            {/* BODY CONTENT */}
            <div className="mt-5 space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 dark:text-white leading-tight">
                {detailedPost.title}
              </h2>
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-sans select-text whitespace-pre-wrap">
                {detailedPost.content}
              </p>

              {detailedPost.imageUrl && (
                <div className="w-full h-56 rounded-2xl overflow-hidden relative">
                  <img
                    src={detailedPost.imageUrl}
                    alt="Story Visual representation"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* COMPASSIONATE AI GUIDE REFLECTION */}
            {detailedPost.aiReflection && (
              <div className="mt-5 p-4 rounded-2xl border border-indigo-500/20 bg-slate-50 dark:bg-indigo-950/30 text-xs border-l-4 border-l-purple-500 relative">
                <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[9px] text-purple-600 dark:text-purple-400 font-mono tracking-wider font-bold uppercase select-none">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Reflection
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic pr-24 font-sans leading-relaxed">
                  &ldquo;{detailedPost.aiReflection}&rdquo;
                </p>
              </div>
            )}

            {/* COMMENTS SECTION */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800/80 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Replies ({detailedPost.comments.length})
              </h4>

              {/* Comments stream scroll */}
              <div className="space-y-3.5 max-h-[24vh] overflow-y-auto pr-1">
                {detailedPost.comments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No supportive replies logged yet. Say something soothing to your peer down below.</p>
                ) : (
                  detailedPost.comments.map(c => (
                    <div key={c.id} className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-950 text-xs flex gap-3">
                      {renderAvatar(c.avatarSeed, 'w-7 h-7')}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-gray-800 dark:text-white">{c.username}</span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-zinc-300 leading-normal select-text whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Post comment input form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Draft a soothing, comforting message..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-transparent dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="px-4.5 py-2 text-white bg-purple-600 hover:bg-purple-500 font-bold text-xs rounded-xl cursor-pointer transition flex items-center justify-center min-w-[70px] active:scale-95"
                >
                  {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ==================== CLEAR ALL CONFIRMATION DIALOG ==================== */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl relative text-left overflow-hidden">
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                  Clear Incident Board?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 leading-relaxed">
                  You are about to permanently delete <strong>all ({posts.length})</strong> currently reported and flagged posts from the database. This action is irreversible.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                disabled={isClearingAll}
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-semibold rounded-2xl text-gray-600 dark:text-slate-300 transition cursor-pointer text-center flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                disabled={isClearingAll}
                onClick={handleClearAllReported}
                className="flex-1 py-3 text-white font-semibold bg-red-600 hover:bg-red-500 rounded-2xl shadow-md text-xs cursor-pointer transition text-center flex items-center justify-center active:scale-95 gap-2"
              >
                {isClearingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Clear All
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
