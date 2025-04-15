import { useState, useEffect } from 'react';

interface HistoryItem {
  name: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

interface InputHistory {
  [category: string]: HistoryItem[];
}

const useInputHistory = (category: 'health' | 'work' | 'nutrition') => {
  const [history, setHistory] = useState<InputHistory>({});

  useEffect(() => {
    // Load history from localStorage on mount
    const savedHistory = localStorage.getItem('inputHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => {
      const newHistory = {
        ...prev,
        [category]: [
          ...(prev[category] || []),
          item
        ].filter((value, index, self) => 
          index === self.findIndex(t => t.name === value.name)
        )
      };
      
      // Save to localStorage
      localStorage.setItem('inputHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const findInHistory = (name: string): HistoryItem | undefined => {
    return history[category]?.find(item => item.name.toLowerCase() === name.toLowerCase());
  };

  return {
    addToHistory,
    findInHistory,
    history: history[category] || []
  };
};

export default useInputHistory; 