export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    images?: string[];
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
    color: string;
    isCompleted?: boolean;
    isChecklistMode?: boolean;
    checklistItems?: ChecklistItem[];
}

export type RootStackParamList = {
    Home: undefined;
    NoteEditor: { noteId?: string };
};