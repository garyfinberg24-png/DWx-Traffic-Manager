import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { BookingTemplate, TemplateFormData } from '../types/Template';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'lp_booking_templates';

interface TemplateContextValue {
  templates: BookingTemplate[];
  saveTemplate: (data: TemplateFormData) => void;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, data: Partial<TemplateFormData>) => void;
  getTemplate: (id: string) => BookingTemplate | undefined;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);

  // Load templates from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BookingTemplate[];
        // Convert date strings back to Date objects
        const withDates = parsed.map((t) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
        setTemplates(withDates);
      }
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error);
    }
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates to localStorage:', error);
    }
  }, [templates]);

  const saveTemplate = useCallback(
    (data: TemplateFormData) => {
      const newTemplate: BookingTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        ...data,
        createdBy: user?.email || 'unknown',
        createdAt: new Date(),
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    },
    [user]
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTemplate = useCallback((id: string, data: Partial<TemplateFormData>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  }, []);

  const getTemplate = useCallback(
    (id: string) => {
      return templates.find((t) => t.id === id);
    },
    [templates]
  );

  const value: TemplateContextValue = useMemo(
    () => ({
      templates,
      saveTemplate,
      deleteTemplate,
      updateTemplate,
      getTemplate,
    }),
    [templates, saveTemplate, deleteTemplate, updateTemplate, getTemplate]
  );

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
};

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within TemplateProvider');
  }
  return context;
};
