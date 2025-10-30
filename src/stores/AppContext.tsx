import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, ShowerEntry, UserSettings } from '../types';
import { DatabaseService, ShowerService, SettingsService, MetadataService } from '../lib/database-service';

// Action types
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOWERS'; payload: ShowerEntry[] }
  | { type: 'ADD_SHOWER'; payload: ShowerEntry }
  | { type: 'UPDATE_SHOWER'; payload: { id: string; updates: Partial<ShowerEntry> } }
  | { type: 'DELETE_SHOWER'; payload: string }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'UPDATE_SETTING'; payload: { key: keyof UserSettings; value: UserSettings[keyof UserSettings] } }
  | { type: 'SET_LAST_NOTIFICATION_CHECK'; payload: Date | null }
  | { type: 'SET_ERROR'; payload: string | null };

// Extended app state with loading and error states
interface ExtendedAppState extends AppState {
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ExtendedAppState = {
  showers: [],
  settings: {
    theme: 'system',
    firstDayOfWeek: 0,
    notificationsEnabled: false,
    notificationThresholdDays: 3,
    projectInfo: {
      githubRepo: 'https://github.com/user/shower-tracker',
      author: 'Shower Tracker App'
    }
  },
  lastNotificationCheck: null,
  isLoading: true,
  error: null
};

// Reducer function
function appReducer(state: ExtendedAppState, action: AppAction): ExtendedAppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SHOWERS':
      return { ...state, showers: action.payload };
    
    case 'ADD_SHOWER':
      // Optimize: Since showers are already sorted (newest first) and we're adding at the beginning,
      // only sort if the new shower is not the most recent
      const newShower = action.payload;
      const shouldSort = state.showers.length > 0 && 
        new Date(newShower.timestamp).getTime() < new Date(state.showers[0].timestamp).getTime();
      
      return { 
        ...state, 
        showers: shouldSort
          ? [newShower, ...state.showers].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
          : [newShower, ...state.showers]
      };
    
    case 'UPDATE_SHOWER':
      return {
        ...state,
        showers: state.showers.map(shower =>
          shower.id === action.payload.id
            ? { ...shower, ...action.payload.updates }
            : shower
        )
      };
    
    case 'DELETE_SHOWER':
      return {
        ...state,
        showers: state.showers.filter(shower => shower.id !== action.payload)
      };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.key]: action.payload.value
        }
      };
    
    case 'SET_LAST_NOTIFICATION_CHECK':
      return { ...state, lastNotificationCheck: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: ExtendedAppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app data on mount
  useEffect(() => {
    async function initializeApp() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Initialize database
        await DatabaseService.initialize();

        // Load initial data
        const [showers, settings, lastNotificationCheck] = await Promise.all([
          ShowerService.getAllShowers(),
          SettingsService.getSettings(),
          MetadataService.getLastNotificationCheck()
        ]);

        dispatch({ type: 'SET_SHOWERS', payload: showers });
        dispatch({ type: 'SET_SETTINGS', payload: settings });
        dispatch({ type: 'SET_LAST_NOTIFICATION_CHECK', payload: lastNotificationCheck });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app. Please refresh the page.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    initializeApp();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}