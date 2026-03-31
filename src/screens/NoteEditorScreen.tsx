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
    Image,
    Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotes } from "../context/NotesContext";
import { RootStackParamList } from "../types/Note";
import ImageViewer from "react-native-image-zoom-viewer";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "NoteEditor">;
type RouteProps = RouteProp<RootStackParamList, "NoteEditor">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// iOS system colors
const IOS = {
    background: "#F2F2F7",
    card: "#FFFFFF",
    separator: "#C6C6C8",
    label: "#000000",
    secondaryLabel: "#3C3C43",
    systemBlue: "#007AFF",
    systemRed: "#FF3B30",
    systemGreen: "#34C759",
    systemGray: "#8E8E93",
    systemGray4: "#D1D1D6",
    systemGray5: "#E5E5EA",
    systemGray6: "#F2F2F7",
};

// iOS-inspired color palette for note backgrounds
const NOTE_COLORS: { label: string; value: string }[] = [
    { label: "Blanco",    value: "#FFFFFF" },
    { label: "Arena",     value: "#FFF9F0" },
    { label: "Amarillo",  value: "#FFF3C4" },
    { label: "Verde",     value: "#D4F5E2" },
    { label: "Azul",      value: "#D0E8FF" },
    { label: "Lila",      value: "#E8D8FF" },
    { label: "Rosa",      value: "#FFD6E7" },
    { label: "Naranja",   value: "#FFE4CC" },
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
    const [currentNoteId, setCurrentNoteId] = useState(noteId);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Refs for auto-save
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
        const t = titleRef.current;
        const c = contentRef.current;
        const img = imagesRef.current;
        const col = selectedColorRef.current;
        const pin = isPinnedRef.current;
        const comp = isCompletedRef.current;

        if (!t.trim() && !c.trim() && img.length === 0) return;

        if (currentNoteId) {
            const note = getNoteById(currentNoteId);
            if (note) {
                await updateNote(currentNoteId, t, c, img, col);
                if (Boolean(note.isPinned) !== pin) await togglePin(currentNoteId);
                if (Boolean(note.isCompleted) !== comp) await toggleComplete(currentNoteId);
            }
        } else {
            const newNote = await createNote(t, c, img, col);
            setCurrentNoteId(newNote.id);
            if (pin) await togglePin(newNote.id);
            if (comp) await toggleComplete(newNote.id);
        }
    }, [currentNoteId, createNote, updateNote, togglePin, toggleComplete, getNoteById]);

    // Auto-save on back navigation
    useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", () => {
            handleSave();
        });
        return unsubscribe;
    }, [navigation, handleSave]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la galería.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 1,
        });
        if (!result.canceled) {
            setImages((prev) => [...prev, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        Alert.alert("Quitar imagen", "¿Quieres quitar esta imagen de la nota?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Quitar",
                style: "destructive",
                onPress: () => setImages((prev) => prev.filter((_, i) => i !== index)),
            },
        ]);
    };

    // Header buttons
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={styles.headerBtn} onPress={pickImage} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.headerBtnIcon}>🖼️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => setIsCompleted((v) => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <View style={[styles.headerCircle, isCompleted && styles.headerCircleDone]}>
                            {isCompleted && <Text style={styles.headerCircleCheck}>✓</Text>}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => setIsPinned((v) => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.headerBtnIcon}>{isPinned ? "📌" : "📍"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => setShowColorPicker(true)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        {/* 4-quadrant palette icon */}
                        <View style={styles.paletteBtn}>
                            <View style={styles.paletteInner}>
                                <View style={[styles.paletteQ, styles.paletteTopLeft,  { backgroundColor: "#FFD60A" }]} />
                                <View style={[styles.paletteQ, styles.paletteTopRight, { backgroundColor: "#34C759" }]} />
                                <View style={[styles.paletteQ, styles.paletteBotLeft,  { backgroundColor: "#007AFF" }]} />
                                <View style={[styles.paletteQ, styles.paletteBotRight, { backgroundColor: "#FF6B81" }]} />
                            </View>
                            {/* ring showing current color */}
                            <View style={[styles.paletteRing, { borderColor: selectedColor === "#FFFFFF" ? "#C6C6C8" : selectedColor }]} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerDoneBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.headerDoneText}>Listo</Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, isPinned, isCompleted, selectedColor, handleSave]);

    const handleDelete = () => {
        if (!existingNote && !currentNoteId) return;
        Alert.alert("Eliminar nota", "¿Seguro que quieres eliminar esta nota?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    const id = currentNoteId || existingNote?.id;
                    if (id) await deleteNote(id);
                    navigation.goBack();
                },
            },
        ]);
    };

    const noteToShow = currentNoteId ? getNoteById(currentNoteId) : existingNote;
    const noteBackground = selectedColor === "#FFFFFF" ? IOS.background : selectedColor;

    return (
        <View style={[styles.container, { backgroundColor: noteBackground }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <TextInput
                    style={styles.titleInput}
                    placeholder="Título"
                    placeholderTextColor={IOS.systemGray}
                    value={title}
                    onChangeText={setTitle}
                    multiline
                    autoFocus={!existingNote && !currentNoteId}
                    selectionColor={IOS.systemBlue}
                />

                {/* Divider */}
                <View style={styles.divider} />

                {/* Content */}
                <TextInput
                    style={styles.contentInput}
                    placeholder="Empieza a escribir aquí..."
                    placeholderTextColor={IOS.systemGray}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    selectionColor={IOS.systemBlue}
                />

                {/* Image gallery */}
                {images.length > 0 && (
                    <View style={styles.imageGallery}>
                        {images.map((uri, index) => (
                            <TouchableOpacity
                                key={`${uri}-${index}`}
                                onPress={() => setZoomedImage(uri)}
                                onLongPress={() => removeImage(index)}
                                activeOpacity={0.85}
                                style={styles.imageWrapper}
                            >
                                <Image source={{ uri }} style={styles.noteImage} />
                                <View style={styles.imageOverlay} />
                            </TouchableOpacity>
                        ))}
                        {/* Add image tile */}
                        <TouchableOpacity
                            onPress={pickImage}
                            style={styles.addImageTile}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.addImageIcon}>＋</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Full-screen image viewer */}
            {zoomedImage && (
                <Modal
                    visible={!!zoomedImage}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setZoomedImage(null)}
                >
                    <ImageViewer
                        imageUrls={images.map((uri) => ({ url: uri }))}
                        index={images.indexOf(zoomedImage)}
                        onCancel={() => setZoomedImage(null)}
                        enableSwipeDown
                        onSwipeDown={() => setZoomedImage(null)}
                        renderHeader={() => (
                            <TouchableOpacity
                                style={styles.closeZoom}
                                onPress={() => setZoomedImage(null)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <View style={styles.closeZoomCircle}>
                                    <Text style={styles.closeZoomText}>✕</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        saveToLocalByLongPress={false}
                    />
                </Modal>
            )}

            {/* Bottom bar */}
            {noteToShow && (
                <View style={styles.bottomBar}>
                    <Text style={styles.dateText}>
                        Editada{" "}
                        {noteToShow.updatedAt.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                        })}
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}
                    >
                        <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Color picker modal */}
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
                    <View style={styles.colorSheet}>
                        {/* Handle */}
                        <View style={styles.sheetHandle} />
                        <Text style={styles.colorSheetTitle}>Color de la nota</Text>

                        <View style={styles.colorGrid}>
                            {NOTE_COLORS.map(({ label, value }) => (
                                <TouchableOpacity
                                    key={value}
                                    onPress={() => {
                                        setSelectedColor(value);
                                        setShowColorPicker(false);
                                    }}
                                    activeOpacity={0.8}
                                    style={styles.colorOptionWrapper}
                                >
                                    <View
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: value },
                                            selectedColor === value && styles.colorOptionSelected,
                                        ]}
                                    >
                                        {selectedColor === value && (
                                            <Text style={styles.colorCheckmark}>✓</Text>
                                        )}
                                    </View>
                                    <Text style={styles.colorLabel}>{label}</Text>
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
    scrollContent: {
        paddingBottom: 40,
    },

    // ── Text inputs ──
    titleInput: {
        fontSize: 26,
        fontWeight: "700",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        color: IOS.label,
        letterSpacing: -0.5,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: IOS.separator,
        marginHorizontal: 20,
        marginBottom: 6,
    },
    contentInput: {
        fontSize: 17,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 100,
        color: IOS.label,
        lineHeight: 25,
        minHeight: 280,
    },

    // ── Header buttons ──
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginRight: 4,
    },
    headerBtn: {
        padding: 7,
        justifyContent: "center",
        alignItems: "center",
    },
    headerBtnIcon: {
        fontSize: 19,
    },
    headerCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: IOS.systemGray,
        justifyContent: "center",
        alignItems: "center",
    },
    headerCircleDone: {
        backgroundColor: IOS.systemGreen,
        borderColor: IOS.systemGreen,
    },
    headerCircleCheck: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "700",
    },
    colorDotBtn: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: IOS.systemGray4,
    },
    paletteBtn: {
        width: 26,
        height: 26,
        justifyContent: "center",
        alignItems: "center",
    },
    paletteInner: {
        width: 22,
        height: 22,
        borderRadius: 11,
        overflow: "hidden",
        flexDirection: "row",
        flexWrap: "wrap",
    },
    paletteQ: {
        width: 11,
        height: 11,
    },
    paletteTopLeft:  { borderTopLeftRadius: 11 },
    paletteTopRight: { borderTopRightRadius: 11 },
    paletteBotLeft:  { borderBottomLeftRadius: 11 },
    paletteBotRight: { borderBottomRightRadius: 11 },
    paletteRing: {
        position: "absolute",
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: IOS.systemGray4,
    },
    headerDoneBtn: {
        backgroundColor: IOS.systemBlue,
        borderRadius: 14,
        paddingHorizontal: 13,
        paddingVertical: 6,
        marginLeft: 4,
    },
    headerDoneText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
    },

    // ── Image Gallery ──
    imageGallery: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 16,
        gap: 8,
        marginTop: 8,
        paddingBottom: 20,
    },
    imageWrapper: {
        width: (SCREEN_WIDTH - 48) / 3,
        aspectRatio: 1,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: IOS.systemGray5,
    },
    noteImage: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.02)",
    },
    addImageTile: {
        width: (SCREEN_WIDTH - 48) / 3,
        aspectRatio: 1,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: IOS.systemGray4,
        justifyContent: "center",
        alignItems: "center",
    },
    addImageIcon: {
        fontSize: 28,
        color: IOS.systemGray,
        fontWeight: "300",
    },

    // ── Image Zoom ──
    closeZoom: {
        position: "absolute",
        top: 54,
        right: 20,
        zIndex: 10,
    },
    closeZoomCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(80,80,80,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeZoomText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
    },

    // ── Bottom bar ──
    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: IOS.separator,
        backgroundColor: "rgba(255,255,255,0.85)",
    },
    dateText: {
        fontSize: 13,
        color: IOS.systemGray,
        letterSpacing: -0.1,
    },
    deleteButton: {
        padding: 4,
    },
    deleteIcon: {
        fontSize: 18,
    },

    // ── Color Sheet ──
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    colorSheet: {
        backgroundColor: IOS.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 44,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: IOS.systemGray4,
        alignSelf: "center",
        marginBottom: 16,
    },
    colorSheetTitle: {
        fontSize: 17,
        fontWeight: "600",
        textAlign: "center",
        color: IOS.label,
        marginBottom: 20,
    },
    colorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
    },
    colorOptionWrapper: {
        alignItems: "center",
        gap: 6,
    },
    colorOption: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        borderColor: IOS.systemGray4,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    colorOptionSelected: {
        borderColor: IOS.systemBlue,
        borderWidth: 2.5,
    },
    colorCheckmark: {
        fontSize: 22,
        color: IOS.systemBlue,
        fontWeight: "700",
    },
    colorLabel: {
        fontSize: 11,
        color: IOS.systemGray,
        fontWeight: "500",
    },
});

export default NoteEditorScreen;