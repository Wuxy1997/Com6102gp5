import { useState, useEffect } from 'react';

interface HistoryItem {
  name: string;
  calories?: number;
  duration?: number;
  type: 'nutrition' | 'workout' | 'health';
}

export function useInputHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('inputHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 保存历史记录到 localStorage
  useEffect(() => {
    localStorage.setItem('inputHistory', JSON.stringify(history));
  }, [history]);

  // 添加新的历史记录
  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => {
      // 检查是否已存在相同名称的记录
      const existingIndex = prev.findIndex(h => 
        h.name.toLowerCase() === item.name.toLowerCase() && 
        h.type === item.type
      );

      if (existingIndex >= 0) {
        // 更新现有记录
        const newHistory = [...prev];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          ...item
        };
        return newHistory;
      } else {
        // 添加新记录
        return [...prev, item];
      }
    });
  };

  // 根据名称和类型查找历史记录
  const findHistory = (name: string, type: 'nutrition' | 'workout' | 'health') => {
    return history.find(h => 
      h.name.toLowerCase() === name.toLowerCase() && 
      h.type === type
    );
  };

  return {
    history,
    addToHistory,
    findHistory
  };
} 