import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    BackHandler,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotes } from "../context/NotesContext";
import { RootStackParamList } from "../types/Note";
import { Image, Dimensions } from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "NoteEditor">;
type RouteProps = RouteProp<RootStackParamList, "NoteEditor">;

const COLORS = [
    "#FFFFFF",
    "#FF9500",
    "#FFCC00",
    "#34C759",
    "#007AFF",
    "#5856D6",
    "#AF52DE",
    "#FF2D55",
];

const NoteEditorScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { createNote, updateNote, getNoteById, deleteNote, togglePin, toggleComplete } = useNotes();

    const noteId = route.params?.noteId;
    const existingNote = noteId ? getNoteById(noteId) : undefined;

    const [title, setTitle] = useState(existingNote?.title || "");
    const [content, setContent] = useState(existingNote?.content || "");
    const [images, setImages] = useState<string[]>(existingNote?.images || []);
    const [selectedColor, setSelectedColor] = useState(existingNote?.color || "#FFFFFF");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);
    const [isCompleted, setIsCompleted] = useState(existingNote?.isCompleted || false);
    const [hasChanges, setHasChanges] = useState(false);
    const [currentNoteId, setCurrentNoteId] = useState(noteId);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const titleRef = useRef(title);
    const contentRef = useRef(content);
    const imagesRef = useRef(images);
    const selectedColorRef = useRef(selectedColor);
    const isPinnedRef = useRef(isPinned);
    const isCompletedRef = useRef(isCompleted);

    useEffect(() => {
        titleRef.current = title;
        contentRef.current = content;
        imagesRef.current = images;
        selectedColorRef.current = selectedColor;
        isPinnedRef.current = isPinned;
        isCompletedRef.current = isCompleted;
    }, [title, content, images, selectedColor, isPinned, isCompleted]);

    const handleSave = useCallback(async () => {
        const currentTitle = titleRef.current;
        const currentContent = contentRef.current;
        const currentImages = imagesRef.current;
        const currentColor = selectedColorRef.current;
        const currentPinned = isPinnedRef.current;
        const currentCompleted = isCompletedRef.current;

        if (!currentTitle.trim() && !currentContent.trim() && currentImages.length === 0) {
            return;
        }

        if (currentNoteId) {
            const note = getNoteById(currentNoteId);
            if (note) {
                await updateNote(currentNoteId, currentTitle, currentContent, currentImages, currentColor);
                if (Boolean(note.isPinned) !== currentPinned) {
                    await togglePin(currentNoteId);
                }
                if (Boolean(note.isCompleted) !== currentCompleted) {
                    await toggleComplete(currentNoteId);
                }
            }
        } else {
            const newNote = await createNote(currentTitle, currentContent, currentImages, currentColor);
            setCurrentNoteId(newNote.id);
            if (currentPinned) {
                await togglePin(newNote.id);
            }
            if (currentCompleted) {
                await toggleComplete(newNote.id);
            }
        }
    }, [currentNoteId, createNote, updateNote, togglePin, toggleComplete, getNoteById]);

    // Auto-save when the user navigates back (back button, iOS swipe, etc.)
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            handleSave();
        });
        return unsubscribe;
    }, [navigation, handleSave]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la galería.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setImages(prev => [...prev, result.assets[0].uri]);
            setHasChanges(true);
        }
    };

    const removeImage = (index: number) => {
        Alert.alert(
            "Eliminar imagen",
            "¿Quieres quitar esta imagen de la nota?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        setImages(prev => prev.filter((_, i) => i !== index));
                        setHasChanges(true);
                    }
                }
            ]
        );
    };

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={pickImage}
                    >
                        <Text style={styles.headerButtonIcon}>🖼️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setIsCompleted(!isCompleted)}
                    >
                        <Text style={styles.headerButtonIcon}>
                            {isCompleted ? "✅" : "⬜"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setIsPinned(!isPinned)}
                    >
                        <Text style={styles.headerButtonIcon}>
                            {isPinned ? "📌" : "📍"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setShowColorPicker(true)}
                    >
                        <Text style={styles.headerButtonIcon}>🎨</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.headerButtonText}>Hecho</Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, isPinned, isCompleted, handleSave]);

    const handleDelete = () => {
        if (!existingNote && !currentNoteId) return;

        Alert.alert(
            "Eliminar nota",
            "¿Estás seguro de que quieres eliminar esta nota?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const idToDelete = currentNoteId || existingNote?.id;
                        if (idToDelete) {
                            await deleteNote(idToDelete);
                        }
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const noteToShow = currentNoteId ? getNoteById(currentNoteId) : existingNote;

    return (
        <View style={[styles.container, { backgroundColor: selectedColor }]}>
            <ScrollView style={styles.scrollView} keyboardDismissMode="on-drag">
                <TextInput
                    ref={titleRef as any}
                    style={styles.titleInput}
                    placeholder="Título"
                    placeholderTextColor="#8E8E93"
                    value={title}
                    onChangeText={(text) => {
                        setTitle(text);
                        setHasChanges(true);
                    }}
                    multiline
                    autoFocus={!existingNote && !currentNoteId}
                />
                <TextInput
                    style={styles.contentInput}
                    placeholder="Empieza a escribir..."
                    placeholderTextColor="#8E8E93"
                    value={content}
                    onChangeText={(text) => {
                        setContent(text);
                        setHasChanges(true);
                    }}
                    multiline
                    textAlignVertical="top"
                />

                {images.length > 0 && (
                    <View style={styles.imageGallery}>
                        {images.map((uri, index) => (
                            <TouchableOpacity
                                key={`${uri}-${index}`}
                                onPress={() => setZoomedImage(uri)}
                                onLongPress={() => removeImage(index)}
                                activeOpacity={0.8}
                                style={styles.imageWrapper}
                            >
                                <Image source={{ uri }} style={styles.noteImage} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {zoomedImage && (
                <Modal
                    visible={!!zoomedImage}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setZoomedImage(null)}
                >
                    <ImageViewer
                        imageUrls={images.map(uri => ({ url: uri }))}
                        index={images.indexOf(zoomedImage)}
                        onCancel={() => setZoomedImage(null)}
                        enableSwipeDown
                        onSwipeDown={() => setZoomedImage(null)}
                        renderHeader={() => (
                            <TouchableOpacity
                                style={styles.closeZoom}
                                onPress={() => setZoomedImage(null)}
                            >
                                <Text style={styles.closeZoomText}>✕</Text>
                            </TouchableOpacity>
                        )}
                        saveToLocalByLongPress={false}
                    />
                </Modal>
            )}

            {noteToShow && (
                <View style={styles.bottomBar}>
                    <Text style={styles.dateText}>
                        {isCompleted ? "✅ Completada" : "📝 Pendiente"} • Creada: {noteToShow.createdAt.toLocaleDateString("es-ES")}
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                    >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={showColorPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowColorPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowColorPicker(false)}
                >
                    <View style={styles.colorPickerContainer}>
                        <Text style={styles.colorPickerTitle}>Color de fondo</Text>
                        <View style={styles.colorGrid}>
                            {COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.selectedColor,
                                    ]}
                                    onPress={() => {
                                        setSelectedColor(color);
                                        setHasChanges(true);
                                        setShowColorPicker(false);
                                    }}
                                >
                                    {selectedColor === color && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    titleInput: {
        fontSize: 28,
        fontWeight: "bold",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        color: "#000",
    },
    contentInput: {
        fontSize: 17,
        paddingHorizontal: 20,
        paddingBottom: 100,
        color: "#000",
        lineHeight: 24,
        minHeight: 300,
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginRight: 8,
    },
    headerButton: {
        padding: 8,
    },
    headerButtonIcon: {
        fontSize: 20,
    },
    headerButtonText: {
        color: "#007AFF",
        fontSize: 17,
        fontWeight: "600",
    },
    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.1)",
    },
    dateText: {
        fontSize: 13,
        color: "#8E8E93",
    },
    deleteButton: {
        padding: 8,
    },
    deleteIcon: {
        fontSize: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    colorPickerContainer: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    colorPickerTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
        textAlign: "center",
    },
    colorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
    },
    colorOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
    selectedColor: {
        borderColor: "#007AFF",
        borderWidth: 3,
    },
    checkmark: {
        fontSize: 20,
        color: "#007AFF",
    },
    imageGallery: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 15,
        gap: 10,
        marginTop: 10,
        paddingBottom: 20,
    },
    imageWrapper: {
        width: "30%",
        aspectRatio: 1,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    noteImage: {
        width: "100%",
        height: "100%",
    },
    zoomBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
        justifyContent: "center",
        alignItems: "center",
    },
    zoomedImage: {
        width: "100%",
        height: "80%",
    },
    closeZoom: {
        position: "absolute",
        top: 60,
        right: 25,
        zIndex: 10,
        padding: 5,
    },
    closeZoomText: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "300",
    },
    zoomHelpText: {
        color: "rgba(255,255,255,0.5)",
        position: "absolute",
        bottom: 50,
        fontSize: 14,
    },
});

export default NoteEditorScreen;