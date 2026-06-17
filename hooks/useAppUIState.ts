import { useState, useCallback } from "react";
import { Restaurant } from "@/lib/types";

export type ViewMode =
  | "feed"
  | "spin"
  | "wheel"
  | "wheel-result"
  | "map"
  | "profile"
  | "ai";

export type FeedFilter = "all" | "top" | "reviews" | "website";

interface AppUIState {
  currentView: ViewMode;
  ratingTarget: Restaurant | null;
  viewAllCountry: string | null;
  wheelCountry: string | null;
  authOpen: boolean;
  authMode: "login" | "join";
  mobileNavOpen: boolean;
  feedFilter: FeedFilter;
  feedSearchDraft: string;
  feedSearchQuery: string;
  explorerSearchDraft: string;
  explorerSearchQuery: string;
  targetProfile: { name: string; avatar: string } | null;
}

const initialState: AppUIState = {
  currentView: "feed",
  ratingTarget: null,
  viewAllCountry: null,
  wheelCountry: null,
  authOpen: false,
  authMode: "login",
  mobileNavOpen: false,
  feedFilter: "all",
  feedSearchDraft: "",
  feedSearchQuery: "",
  explorerSearchDraft: "",
  explorerSearchQuery: "",
  targetProfile: null,
};

export function useAppUIState() {
  const [state, setState] = useState<AppUIState>(initialState);

  const setCurrentView = useCallback((view: ViewMode) => {
    setState((prev) => ({ ...prev, currentView: view }));
  }, []);

  const setRatingTarget = useCallback((target: Restaurant | null) => {
    setState((prev) => ({ ...prev, ratingTarget: target }));
  }, []);

  const setViewAllCountry = useCallback((country: string | null) => {
    setState((prev) => ({ ...prev, viewAllCountry: country }));
  }, []);

  const setWheelCountry = useCallback((country: string | null) => {
    setState((prev) => ({ ...prev, wheelCountry: country }));
  }, []);

  const setAuthOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, authOpen: open }));
  }, []);

  const setAuthMode = useCallback((mode: "login" | "join") => {
    setState((prev) => ({ ...prev, authMode: mode }));
  }, []);

  const setMobileNavOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, mobileNavOpen: open }));
  }, []);

  const setFeedFilter = useCallback((filter: FeedFilter) => {
    setState((prev) => ({ ...prev, feedFilter: filter }));
  }, []);

  const setFeedSearchDraft = useCallback((query: string) => {
    setState((prev) => ({ ...prev, feedSearchDraft: query }));
  }, []);

  const setFeedSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, feedSearchQuery: query }));
  }, []);

  const setExplorerSearchDraft = useCallback((query: string) => {
    setState((prev) => ({ ...prev, explorerSearchDraft: query }));
  }, []);

  const setExplorerSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, explorerSearchQuery: query }));
  }, []);

  const setTargetProfile = useCallback(
    (profile: { name: string; avatar: string } | null) => {
      setState((prev) => ({ ...prev, targetProfile: profile }));
    },
    [],
  );

  return {
    state,
    setCurrentView,
    setRatingTarget,
    setViewAllCountry,
    setWheelCountry,
    setAuthOpen,
    setAuthMode,
    setMobileNavOpen,
    setFeedFilter,
    setFeedSearchDraft,
    setFeedSearchQuery,
    setExplorerSearchDraft,
    setExplorerSearchQuery,
    setTargetProfile,
  };
}
