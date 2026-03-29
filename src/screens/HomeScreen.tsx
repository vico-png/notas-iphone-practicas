import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotes } from "../context/NotesContext";
import { Note, RootStackParamList } from "../types/Note";
import { Swipeable } from "react-native-gesture-handler";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { notes, loading, deleteNote, togglePin, toggleComplete, searchNotes } = useNotes();
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    
    // Selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

    const filteredNotes = useMemo(() => {
        let notesToShow = showCompleted
            ? notes.filter((n) => n.isCompleted)
            : notes.filter((n) => !n.isCompleted);

        if (searchQuery.trim()) {
            notesToShow = searchNotes(searchQuery).filter((n) =>
                showCompleted ? n.isCompleted : !n.isCompleted
            );
        }

        const pinned = notesToShow.filter((n) => n.isPinned);
        const unpinned = notesToShow.filter((n) => !n.isPinned);
        return { pinned, unpinned };
    }, [notes, searchQuery, showCompleted]);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Hoy";
        if (days === 1) return "Ayer";
        if (days < 7) return `Hace ${days} días`;
        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
        });
    };

    const handleDelete = (note: Note) => {
        Alert.alert(
            "Eliminar nota",
            `¿Estás seguro de que quieres eliminar "${note.title}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => deleteNote(note.id),
                },
            ]
        );
    };

    const handleBulkDelete = () => {
        Alert.alert(
            "Eliminar notas",
            `¿Estás seguro de que quieres eliminar las ${selectedNotes.size} notas seleccionadas?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        for (const id of Array.from(selectedNotes)) {
                            await deleteNote(id);
                        }
                        setSelectedNotes(new Set());
                        setIsSelectionMode(false);
                    },
                },
            ]
        );
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedNotes);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedNotes(newSelected);
        if (newSelected.size === 0) {
            setIsSelectionMode(false);
        }
    };

    const renderRightActions = (note: Note) => {
        return (
            <TouchableOpacity
                style={styles.swipeDeleteButton}
                onPress={() => handleDelete(note)}
            >
                <Text style={styles.swipeDeleteIcon}>🗑️</Text>
                <Text style={styles.swipeDeleteText}>Borrar</Text>
            </TouchableOpacity>
        );
    };

    const renderNoteItemContent = (item: Note) => {
        const isSelected = selectedNotes.has(item.id);
        return (
            <TouchableOpacity
                style={[
                    styles.noteItem, 
                    { backgroundColor: item.color },
                    isSelectionMode && isSelected && styles.selectedNoteItem
                ]}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleSelection(item.id);
                    } else {
                        navigation.navigate("NoteEditor", { noteId: item.id });
                    }
                }}
                onLongPress={() => {
                    if (!isSelectionMode) {
                        setIsSelectionMode(true);
                        const newSelected = new Set(selectedNotes);
                        newSelected.add(item.id);
                        setSelectedNotes(newSelected);
                    }
                }}
                delayLongPress={300}
                activeOpacity={0.9}
            >
                <View style={styles.noteItemInnerRow}>
                    {isSelectionMode && (
                        <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
                            <Text style={styles.checkboxIcon}>{isSelected ? "✓" : ""}</Text>
                        </View>
                    )}
                    <View style={styles.noteContentWrapper}>
                        <View style={styles.noteHeader}>
                            <View style={styles.noteTitleContainer}>
                                <TouchableOpacity
                                    onPress={() => toggleComplete(item.id)}
                                    style={styles.completeButton}
                                    disabled={isSelectionMode}
                                >
                                    <Text style={styles.completeIcon}>
                                        {item.isCompleted ? "✅" : "⬜"}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[styles.noteTitle, item.isCompleted && styles.completedText]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => togglePin(item.id)}
                                style={styles.pinButton}
                                disabled={isSelectionMode}
                            >
                                <Text style={styles.pinIcon}>
                                    {item.isPinned ? "📌" : "📍"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.notePreview, item.isCompleted && styles.completedText]} numberOfLines={2}>
                            {item.content}
                        </Text>
                        <View style={styles.noteContentFooter}>
                            <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
                            {item.images && item.images.length > 0 && (
                                <View style={styles.noteImagePreview}>
                                    <Image source={{ uri: item.images[0] }} style={styles.thumbnail} />
                                    {item.images.length > 1 && (
                                        <View style={styles.imageBadge}>
                                            <Text style={styles.imageBadgeText}>+{item.images.length - 1}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderNoteItem = ({ item }: { item: Note }) => {
        if (isSelectionMode) {
            return renderNoteItemContent(item);
        }
        return (
            <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
                {renderNoteItemContent(item)}
            </Swipeable>
        );
    };

    const renderSection = (title: string, data: Note[]) => {
        if (data.length === 0) return null;
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {data.map((item) => (
                    <View key={item.id}>{renderNoteItem({ item })}</View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const allNotes = [...filteredNotes.pinned, ...filteredNotes.unpinned];
    const completedCount = notes.filter((n) => n.isCompleted).length;
    const pendingCount = notes.filter((n) => !n.isCompleted).length;

    return (
        <View style={styles.container}>
            {isSelectionMode ? (
                <View style={styles.headerSelection}>
                    <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedNotes(new Set()); }}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitleSelection}>
                        {selectedNotes.size} sel.
                    </Text>
                    <TouchableOpacity onPress={handleBulkDelete} disabled={selectedNotes.size === 0}>
                        <Text style={[styles.deleteButtonText, selectedNotes.size === 0 && styles.deleteButtonDisabled]}>Borrar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {showCompleted ? "Completadas" : "Notas"}
                    </Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={() => setShowSearch(!showSearch)}
                        >
                            <Text style={styles.searchIcon}>🔍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate("NoteEditor", {})}
                        >
                            <Text style={styles.addIcon}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, !showCompleted && styles.activeTab]}
                    onPress={() => setShowCompleted(false)}
                    disabled={isSelectionMode}
                >
                    <Text style={[styles.tabText, !showCompleted && styles.activeTabText]}>
                        Pendientes ({pendingCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, showCompleted && styles.activeTab]}
                    onPress={() => setShowCompleted(true)}
                    disabled={isSelectionMode}
                >
                    <Text style={[styles.tabText, showCompleted && styles.activeTabText]}>
                        Completadas ({completedCount})
                    </Text>
                </TouchableOpacity>
            </View>

            {showSearch && !isSelectionMode && (
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar notas..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                </View>
            )}

            {allNotes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>
                        {showCompleted ? "✅" : "📝"}
                    </Text>
                    <Text style={styles.emptyTitle}>
                        {showCompleted ? "No hay notas completadas" : "No hay notas pendientes"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {showCompleted
                            ? "Las notas que marques como completadas aparecerán aquí"
                            : "Toca el botón + para crear tu primera nota"}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={allNotes}
                    renderItem={renderNoteItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <>
                            {renderSection("Fijadas", filteredNotes.pinned)}
                            {filteredNotes.pinned.length > 0 &&
                                filteredNotes.unpinned.length > 0 && (
                                    <Text style={styles.sectionTitle}>Otras</Text>
                                )}
                        </>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: "#F5F5F5",
    },
    headerSelection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: "#F5F5F5",
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#000",
    },
    headerTitleSelection: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000",
    },
    cancelButtonText: {
        fontSize: 17,
        color: "#007AFF",
    },
    deleteButtonText: {
        fontSize: 17,
        color: "#FF3B30",
        fontWeight: "600",
    },
    deleteButtonDisabled: {
        color: "#FFB3B0",
    },
    headerButtons: {
        flexDirection: "row",
        gap: 12,
    },
    searchButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFD60A",
        justifyContent: "center",
        alignItems: "center",
    },
    searchIcon: {
        fontSize: 18,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FFD60A",
        justifyContent: "center",
        alignItems: "center",
    },
    addIcon: {
        fontSize: 24,
        fontWeight: "300",
        color: "#000",
    },
    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#E5E5EA",
        alignItems: "center",
    },
    activeTab: {
        backgroundColor: "#007AFF",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#8E8E93",
    },
    activeTabText: {
        color: "#FFF",
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchInput: {
        backgroundColor: "#FFF",
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#8E8E93",
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 8,
    },
    noteItem: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedNoteItem: {
        borderWidth: 2,
        borderColor: "#007AFF",
    },
    noteItemInnerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    checkboxContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#C7C7CC",
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    checkboxSelected: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    checkboxIcon: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "bold",
    },
    noteContentWrapper: {
        flex: 1,
    },
    noteHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    noteTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    completeButton: {
        padding: 4,
        marginRight: 8,
    },
    completeIcon: {
        fontSize: 18,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        flex: 1,
    },
    completedText: {
        textDecorationLine: "line-through",
        color: "#8E8E93",
    },
    pinButton: {
        padding: 4,
    },
    pinIcon: {
        fontSize: 16,
    },
    notePreview: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
        marginBottom: 8,
    },
    noteDate: {
        fontSize: 12,
        color: "#8E8E93",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: "#8E8E93",
        textAlign: "center",
    },
    swipeDeleteButton: {
        backgroundColor: "#FF3B30",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        height: "100%",
        borderRadius: 12,
        marginBottom: 8,
        marginLeft: 8,
    },
    swipeDeleteIcon: {
        fontSize: 24,
        color: "#FFF",
        marginBottom: 4,
    },
    swipeDeleteText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "600",
    },
    noteContentFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    noteImagePreview: {
        width: 44,
        height: 44,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#E5E5EA",
        position: "relative",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    imageBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    imageBadgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "bold",
    },
});

export default HomeScreen;