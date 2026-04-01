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
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotes } from "../context/NotesContext";
import { Note, RootStackParamList } from "../types/Note";
import { Swipeable } from "react-native-gesture-handler";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

// iOS System Colors
const IOS = {
    background: "#F2F2F7",
    card: "#FFFFFF",
    separator: "#C6C6C8",
    label: "#000000",
    secondaryLabel: "#3C3C43",
    tertiaryLabel: "#3C3C4399",
    placeholderText: "#3C3C4360",
    systemBlue: "#007AFF",
    systemYellow: "#FFD60A",
    systemRed: "#FF3B30",
    systemGreen: "#34C759",
    systemGray: "#8E8E93",
    systemGray5: "#E5E5EA",
    systemGray6: "#F2F2F7",
    groupedBackground: "#F2F2F7",
    secondaryGroupedBackground: "#FFFFFF",
};

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

        const sorted = [...notesToShow].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        const pinned = sorted.filter((n) => n.isPinned);
        const unpinned = sorted.filter((n) => !n.isPinned);
        return { pinned, unpinned };
    }, [notes, searchQuery, showCompleted]);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        }
        if (days === 1) return "Ayer";
        if (days < 7) return date.toLocaleDateString("es-ES", { weekday: "long" });
        return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    };

    const handleDelete = (note: Note) => {
        Alert.alert(
            "Eliminar nota",
            `¿Seguro que quieres eliminar "${note.title}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", style: "destructive", onPress: () => deleteNote(note.id) },
            ]
        );
    };

    const handleBulkDelete = () => {
        Alert.alert(
            "Eliminar notas",
            `¿Seguro que quieres eliminar ${selectedNotes.size} nota${selectedNotes.size !== 1 ? "s" : ""}?`,
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
        if (newSelected.size === 0) setIsSelectionMode(false);
    };

    const renderRightActions = (note: Note) => {
        return (
            <TouchableOpacity
                style={styles.swipeDeleteButton}
                onPress={() => handleDelete(note)}
                activeOpacity={0.85}
            >
                <Text style={styles.swipeDeleteIcon}>🗑</Text>
                <Text style={styles.swipeDeleteText}>Borrar</Text>
            </TouchableOpacity>
        );
    };

    // Reusable color dot for note cards
    const ColorDot = ({ color }: { color: string }) => {
        if (color === "#FFFFFF" || color === "#FFF") return null;
        return <View style={[styles.colorDot, { backgroundColor: color }]} />;
    };

    const renderNoteItemContent = (item: Note) => {
        const isSelected = selectedNotes.has(item.id);
        const cardBg = item.color && item.color !== "#FFFFFF" ? item.color : IOS.card;

        return (
            <TouchableOpacity
                style={[styles.noteItem, { backgroundColor: cardBg }, isSelected && styles.selectedNoteItem]}
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
                delayLongPress={350}
                activeOpacity={0.7}
            >
                <View style={styles.noteItemInnerRow}>
                    {/* Selection checkbox */}
                    {isSelectionMode && (
                        <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Text style={styles.checkboxIcon}>✓</Text>}
                        </View>
                    )}

                    <View style={styles.noteContentWrapper}>
                        {/* Header row */}
                        <View style={styles.noteHeader}>
                            <View style={styles.noteTitleRow}>
                                {/* Complete toggle */}
                                <TouchableOpacity
                                    onPress={() => toggleComplete(item.id)}
                                    style={styles.completeButton}
                                    disabled={isSelectionMode}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <View style={[styles.completeCircle, item.isCompleted && styles.completeCircleDone]}>
                                        {item.isCompleted && <Text style={styles.completeCheckmark}>✓</Text>}
                                    </View>
                                </TouchableOpacity>

                                <Text
                                    style={[
                                        styles.noteTitle,
                                        item.isCompleted && styles.completedTitle,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.title || "Sin título"}
                                </Text>
                            </View>

                            {/* Pin indicator */}
                            {item.isPinned && (
                                <TouchableOpacity
                                    onPress={() => togglePin(item.id)}
                                    disabled={isSelectionMode}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={styles.pinIcon}>📌</Text>
                                </TouchableOpacity>
                            )}
                            {!item.isPinned && !isSelectionMode && (
                                <TouchableOpacity
                                    onPress={() => togglePin(item.id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={[styles.pinIcon, { opacity: 0.25 }]}>📍</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Preview text */}
                        {item.isChecklistMode && item.checklistItems && item.checklistItems.length > 0 ? (
                            <View style={styles.checklistPreview}>
                                {item.checklistItems.slice(0, 2).map((clItem) => (
                                    <View key={clItem.id} style={styles.checklistPreviewRow}>
                                        <View style={[styles.checklistPreviewDot, clItem.checked && styles.checklistPreviewDotChecked]} />
                                        <Text
                                            style={[styles.notePreview, clItem.checked && styles.completedPreview]}
                                            numberOfLines={1}
                                        >
                                            {clItem.text || "Elemento vacío"}
                                        </Text>
                                    </View>
                                ))}
                                {item.checklistItems.length > 2 && (
                                    <Text style={styles.noteDate}>... y {item.checklistItems.length - 2} más</Text>
                                )}
                            </View>
                        ) : (
                            !!item.content && (
                                <Text
                                    style={[styles.notePreview, item.isCompleted && styles.completedPreview]}
                                    numberOfLines={2}
                                >
                                    {item.content}
                                </Text>
                            )
                        )}

                        {/* Footer: date + image thumbnail */}
                        <View style={styles.noteFooter}>
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
                <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
                {data.map((item) => (
                    <View key={item.id}>{renderNoteItem({ item })}</View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={IOS.systemBlue} />
            </View>
        );
    }

    const allNotes = [...filteredNotes.pinned, ...filteredNotes.unpinned];
    const completedCount = notes.filter((n) => n.isCompleted).length;
    const pendingCount = notes.filter((n) => !n.isCompleted).length;

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            {isSelectionMode ? (
                <View style={styles.headerSelection}>
                    <TouchableOpacity
                        onPress={() => { setIsSelectionMode(false); setSelectedNotes(new Set()); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitleSelection}>
                        {selectedNotes.size === 0
                            ? "Seleccionar"
                            : `${selectedNotes.size} seleccionada${selectedNotes.size !== 1 ? "s" : ""}`}
                    </Text>
                    <TouchableOpacity
                        onPress={handleBulkDelete}
                        disabled={selectedNotes.size === 0}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={[
                            styles.deleteButtonText,
                            selectedNotes.size === 0 && styles.deleteButtonDisabled,
                        ]}>
                            Borrar
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {showCompleted ? "Completadas" : "Notas"}
                    </Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setShowSearch(!showSearch)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.iconButtonText}>🔍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconButton, styles.addButtonStyle]}
                            onPress={() => navigation.navigate("NoteEditor", {})}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.addButtonIcon}>＋</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Segment Control ── */}
            <View style={styles.segmentWrapper}>
                <View style={styles.segmentControl}>
                    <TouchableOpacity
                        style={[styles.segment, !showCompleted && styles.segmentActive]}
                        onPress={() => setShowCompleted(false)}
                        disabled={isSelectionMode}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.segmentText, !showCompleted && styles.segmentTextActive]}>
                            Pendientes  {pendingCount > 0 && <Text style={styles.segmentBadge}>{pendingCount}</Text>}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, showCompleted && styles.segmentActive]}
                        onPress={() => setShowCompleted(true)}
                        disabled={isSelectionMode}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.segmentText, showCompleted && styles.segmentTextActive]}>
                            Completadas  {completedCount > 0 && <Text style={styles.segmentBadge}>{completedCount}</Text>}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Search Bar ── */}
            {showSearch && !isSelectionMode && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Text style={styles.searchBarIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar notas..."
                            placeholderTextColor={IOS.systemGray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            returnKeyType="search"
                            clearButtonMode="while-editing"
                        />
                    </View>
                </View>
            )}

            {/* ── Content ── */}
            {allNotes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>{showCompleted ? "✅" : "📝"}</Text>
                    <Text style={styles.emptyTitle}>
                        {showCompleted ? "Sin notas completadas" : "Sin notas"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {showCompleted
                            ? "Las notas completadas aparecerán aquí"
                            : "Toca ＋ para crear tu primera nota"}
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
                            {filteredNotes.pinned.length > 0 && filteredNotes.unpinned.length > 0 && (
                                <Text style={styles.sectionTitle}>OTRAS</Text>
                            )}
                        </>
                    }
                />
            )}

            {/* ── Floating Action Button ── */}
            {!isSelectionMode && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate("NoteEditor", {})}
                    activeOpacity={0.85}
                >
                    <Text style={styles.fabIcon}>＋</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: IOS.groupedBackground,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: IOS.groupedBackground,
    },

    // ── Headers ──
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 12,
        backgroundColor: IOS.groupedBackground,
    },
    headerSelection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 14,
        backgroundColor: IOS.groupedBackground,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: IOS.separator,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: "700",
        color: IOS.label,
        letterSpacing: 0.37,
    },
    headerTitleSelection: {
        fontSize: 17,
        fontWeight: "600",
        color: IOS.label,
    },
    cancelButtonText: {
        fontSize: 17,
        color: IOS.systemBlue,
    },
    deleteButtonText: {
        fontSize: 17,
        color: IOS.systemRed,
        fontWeight: "600",
    },
    deleteButtonDisabled: {
        color: "#FFB3B0",
    },
    headerButtons: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: IOS.systemGray5,
        justifyContent: "center",
        alignItems: "center",
    },
    iconButtonText: {
        fontSize: 16,
    },
    addButtonStyle: {
        backgroundColor: IOS.systemBlue,
    },
    addButtonIcon: {
        fontSize: 22,
        color: "#FFF",
        fontWeight: "300",
        lineHeight: 26,
    },

    // ── Segment Control (iOS-style) ──
    segmentWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: IOS.groupedBackground,
    },
    segmentControl: {
        flexDirection: "row",
        backgroundColor: IOS.systemGray5,
        borderRadius: 9,
        padding: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
    },
    segmentActive: {
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: "500",
        color: IOS.secondaryLabel,
    },
    segmentTextActive: {
        fontWeight: "600",
        color: IOS.label,
    },
    segmentBadge: {
        fontSize: 12,
        color: IOS.systemGray,
    },

    // ── Search ──
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: IOS.systemGray5,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
    },
    searchBarIcon: {
        fontSize: 15,
    },
    searchInput: {
        flex: 1,
        fontSize: 17,
        color: IOS.label,
        padding: 0,
    },

    // ── List ──
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    section: {
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: IOS.systemGray,
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 6,
        paddingHorizontal: 4,
    },

    // ── Note Card ──
    noteItem: {
        backgroundColor: IOS.card,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 9,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedNoteItem: {
        borderWidth: 2,
        borderColor: IOS.systemBlue,
    },
    noteItemInnerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    // Selection checkbox
    checkboxContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: IOS.separator,
        marginRight: 12,
        marginTop: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    checkboxSelected: {
        backgroundColor: IOS.systemBlue,
        borderColor: IOS.systemBlue,
    },
    checkboxIcon: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "700",
    },

    noteContentWrapper: {
        flex: 1,
    },
    noteHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    noteTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 8,
    },

    // Complete circle (iOS-style)
    completeButton: {},
    completeCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: IOS.systemGray,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    completeCircleDone: {
        backgroundColor: IOS.systemGreen,
        borderColor: IOS.systemGreen,
    },
    completeCheckmark: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "700",
    },

    noteTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: IOS.label,
        flex: 1,
        letterSpacing: -0.2,
    },
    completedTitle: {
        textDecorationLine: "line-through",
        color: IOS.systemGray,
    },
    pinIcon: {
        fontSize: 14,
    },
    notePreview: {
        fontSize: 13,
        color: IOS.secondaryLabel,
        lineHeight: 18,
        marginBottom: 8,
        paddingLeft: 28,
    },
    completedPreview: {
        color: IOS.systemGray,
        textDecorationLine: "line-through",
    },

    noteFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: 28,
        marginTop: 2,
    },
    noteDate: {
        fontSize: 12,
        color: IOS.systemGray,
        letterSpacing: -0.1,
    },
    noteImagePreview: {
        width: 40,
        height: 40,
        borderRadius: 7,
        overflow: "hidden",
        backgroundColor: IOS.systemGray5,
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
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
    },
    imageBadgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "700",
    },

    // ── Swipe Delete ──
    swipeDeleteButton: {
        backgroundColor: IOS.systemRed,
        justifyContent: "center",
        alignItems: "center",
        width: 76,
        borderRadius: 12,
        marginBottom: 9,
        marginLeft: 6,
    },
    swipeDeleteIcon: {
        fontSize: 20,
        marginBottom: 2,
    },
    swipeDeleteText: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.2,
    },

    // ── Color Dot ──
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },

    // ── Floating Action Button ──
    fab: {
        position: "absolute",
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: IOS.systemBlue,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: IOS.systemBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 30,
        color: "#FFFFFF",
        fontWeight: "300",
        lineHeight: 34,
        marginTop: -1,
    },

    // ── Empty State ──
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: IOS.label,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: IOS.systemGray,
        textAlign: "center",
        lineHeight: 22,
    },
    // ── Checklist Preview Styles ──
    checklistPreview: {
        marginTop: 2,
        marginBottom: 4,
        paddingLeft: 28,
    },
    checklistPreviewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 1,
    },
    checklistPreviewDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: IOS.systemGray,
    },
    checklistPreviewDotChecked: {
        backgroundColor: IOS.systemGreen,
        borderColor: IOS.systemGreen,
    },
});

export default HomeScreen;