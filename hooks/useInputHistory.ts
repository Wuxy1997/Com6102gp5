import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface HistoryItem {
  name: string;
  calories: number;
  duration?: number;
  type: 'nutrition' | 'workout' | 'health';
}

export function useInputHistory() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 从数据库加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/input-history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [session]);

  // 添加历史记录
  const addToHistory = async (item: HistoryItem) => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/input-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        const newItem = await response.json();
        setHistory(prev => {
          const existingIndex = prev.findIndex(
            h => h.name === item.name && h.type === item.type
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newItem;
            return updated;
          }
          return [...prev, newItem];
        });
      }
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  };

  // 查找历史记录
  const findHistory = (name: string, type: 'nutrition' | 'workout' | 'health') => {
    return history.find(item => item.name === name && item.type === type);
  };

  return {
    history,
    isLoading,
    addToHistory,
    findHistory,
  };
} 