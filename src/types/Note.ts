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
}

export type RootStackParamList = {
    Home: undefined;
    NoteEditor: { noteId?: string };
};