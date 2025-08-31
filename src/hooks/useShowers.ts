import { useCallback } from 'react';
import { useAppContext } from '../stores/AppContext';
import { ShowerService } from '../lib/database-service';
import { getTimeDifference, formatTimeSince } from '../lib/utils';
import type { ShowerEntry } from '../types';

export function useShowers() {
  const { state, dispatch } = useAppContext();

  // Add a new shower
  const addShower = useCallback(async (timestamp?: Date, notes?: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const newShower = await ShowerService.addShower(timestamp, notes);
      dispatch({ type: 'ADD_SHOWER', payload: newShower });
      return newShower;
    } catch (error) {
      console.error('Failed to add shower:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to record shower. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  // Update an existing shower
  const updateShower = useCallback(async (id: string, updates: Partial<Omit<ShowerEntry, 'id'>>) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await ShowerService.updateShower(id, updates);
      dispatch({ type: 'UPDATE_SHOWER', payload: { id, updates } });
    } catch (error) {
      console.error('Failed to update shower:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update shower. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  // Delete a shower
  const deleteShower = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await ShowerService.deleteShower(id);
      dispatch({ type: 'DELETE_SHOWER', payload: id });
    } catch (error) {
      console.error('Failed to delete shower:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete shower. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  // Get showers by date range
  const getShowersByDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      return await ShowerService.getShowersByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Failed to get showers by date range:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load shower history. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  // Get the last shower
  const getLastShower = useCallback(() => {
    return state.showers.length > 0 ? state.showers[0] : null;
  }, [state.showers]);

  // Get time since last shower
  const getTimeSinceLastShower = useCallback(() => {
    const lastShower = getLastShower();
    if (!lastShower) return null;
    
    return getTimeDifference(new Date(lastShower.timestamp));
  }, [getLastShower]);

  // Format time since last shower
  const formatTimeSinceLastShower = useCallback(() => {
    const lastShower = getLastShower();
    if (!lastShower) return 'No showers recorded';

    return formatTimeSince(new Date(lastShower.timestamp));
  }, [getLastShower]);

  // Refresh showers from database
  const refreshShowers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const showers = await ShowerService.getAllShowers();
      dispatch({ type: 'SET_SHOWERS', payload: showers });
    } catch (error) {
      console.error('Failed to refresh showers:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh shower data. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  return {
    showers: state.showers,
    isLoading: state.isLoading,
    error: state.error,
    addShower,
    updateShower,
    deleteShower,
    getShowersByDateRange,
    getLastShower,
    getTimeSinceLastShower,
    formatTimeSinceLastShower,
    refreshShowers
  };
}