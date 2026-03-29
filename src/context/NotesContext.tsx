import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { Note } from "../types/Note";

interface NotesContextType {
    notes: Note[];
    loading: boolean;
    createNote: (title: string, content: string, images?: string[], color?: string) => Promise<Note>;
    updateNote: (id: string, title: string, content: string, images?: string[], color?: string) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    togglePin: (id: string) => Promise<void>;
    toggleComplete: (id: string) => Promise<void>;
    getNoteById: (id: string) => Note | undefined;
    searchNotes: (query: string) => Note[];
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const STORAGE_KEY = "@notes_app";

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        if (!loading) {
            saveNotes();
        }
    }, [notes]);

    const loadNotes = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const notesWithDates = parsed.map((note: any) => ({
                    ...note,
                    createdAt: new Date(note.createdAt),
                    updatedAt: new Date(note.updatedAt),
                }));
                setNotes(notesWithDates);
            }
        } catch (error) {
            console.error("Error loading notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveNotes = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (error) {
            console.error("Error saving notes:", error);
        }
    };

    const createNote = async (title: string, content: string, images: string[] = [], color: string = "#FFFFFF"): Promise<Note> => {
        const newNote: Note = {
            id: uuid.v4() as string,
            title: title || "Sin título",
            content,
            images,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false,
            color,
        };
        setNotes((prev) => [newNote, ...prev]);
        return newNote;
    };

    const updateNote = async (id: string, title: string, content: string, images?: string[], color?: string) => {
        setNotes((prev) =>
            prev.map((note) =>
                note.id === id
                    ? {
                        ...note,
                        title: title || "Sin título",
                        content,
                        images: images ?? note.images,
                        color: color ?? note.color,
                        updatedAt: new Date(),
                    }
                    : note
            )
        );
    };

    const deleteNote = async (id: string) => {
        setNotes((prev) => prev.filter((note) => note.id !== id));
    };

    const togglePin = async (id: string) => {
        setNotes((prev) =>
            prev.map((note) =>
                note.id === id ? { ...note, isPinned: !note.isPinned } : note
            )
        );
    };

    const toggleComplete = async (id: string) => {
        setNotes((prev) =>
            prev.map((note) =>
                note.id === id ? { ...note, isCompleted: !note.isCompleted } : note
            )
        );
    };

    const getNoteById = (id: string): Note | undefined => {
        return notes.find((note) => note.id === id);
    };

    const searchNotes = (query: string): Note[] => {
        const lowerQuery = query.toLowerCase();
        return notes.filter(
            (note) =>
                note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery)
        );
    };

    return (
        <NotesContext.Provider
            value={{
                notes,
                loading,
                createNote,
                updateNote,
                deleteNote,
                togglePin,
                toggleComplete,
                getNoteById,
                searchNotes,
            }}
        >
            {children}
        </NotesContext.Provider>
    );
};

export const useNotes = (): NotesContextType => {
    const context = useContext(NotesContext);
    if (!context) {
        throw new Error("useNotes must be used within a NotesProvider");
    }
    return context;
};