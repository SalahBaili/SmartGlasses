import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from "react-native";

import {
  database,
  ref,
  onValue,
  remove,
  update,
  auth,
} from "../firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { AppContext } from "../AppContext";

export default function HistoryScreen() {
  const { darkMode, language } = useContext(AppContext);
  const uid = auth.currentUser?.uid;

  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const t = {
    fr: {
      export: "📤 Exporter",
      back: "⬅️ Retour aux mesures",
      archive: "🗃️ Archiver",
      start: "📅 Début",
      end: "📅 Fin",
      reset: "🔄",
      delete: "🗑️ Supprimer sélection",
      selectAll: "Tout sélectionner",
      deselectAll: "Tout désélectionner",
      selected: "sélectionné(s)",
      none: "Aucune donnée à exporter",
      temp: "Température",
      pulse: "Pouls",
      spo2: "SpO2",
      pin: "📌 Épingler",
      unpin: "📌 Détacher",
      restore: "🔁 Restaurer",
      deleteOne: "🗑️ Supprimer",
      confirmDelete: "Supprimer cet élément ?",
    },
    en: {
      export: "📤 Export",
      back: "⬅️ Back to Measurements",
      archive: "🗃️ Archived",
      start: "📅 Start",
      end: "📅 End",
      reset: "🔄",
      delete: "🗑️ Delete selected",
      selectAll: "Select all",
      deselectAll: "Deselect all",
      selected: "selected",
      none: "Nothing to export",
      temp: "Temperature",
      pulse: "Pulse",
      spo2: "SpO2",
      pin: "📌 Pin",
      unpin: "📌 Unpin",
      restore: "🔁 Restore",
      deleteOne: "🗑️ Delete",
      confirmDelete: "Delete this entry?",
    },
  }[language];

  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    const historyRef = ref(database, `users/${uid}/history`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = Object.entries(data)
          .map(([id, entry]) => ({ id, ...entry }))
          .filter((entry) => (showArchived ? entry.archived : !entry.archived));

        const pinned = items.filter((e) => e.pinned);
        const others = items
          .filter((e) => !e.pinned)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setHistory([...pinned, ...others]);
      } else {
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, [showArchived]);

  useEffect(() => {
    const filtered = history.filter((entry) => {
      const date = new Date(entry.timestamp);
      const afterStart = dateStart ? date >= dateStart : true;
      const beforeEnd = dateEnd ? date <= dateEnd : true;
      return afterStart && beforeEnd;
    });
    setFilteredHistory(filtered);
  }, [history, dateStart, dateEnd]);

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert("Confirmation", `Supprimer ${selectedItems.length} élément(s) ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          selectedItems.forEach((id) =>
            remove(ref(database, `users/${uid}/history/${id}`))
          );
          setSelectedItems([]);
          setSelectionMode(false);
        },
      },
    ]);
  };

  const handleExport = async () => {
    const data = selectedItems.length
      ? filteredHistory.filter((item) => selectedItems.includes(item.id))
      : filteredHistory;

    if (data.length === 0) return Alert.alert(t.none);

    const csv = [
      "Date,Température,SpO2,Pouls",
      ...data.map((e) => {
        const date = formatDate(e.timestamp);
        return `${date},${e.temperature},${e.spo2},${e.pouls}`;
      }),
    ].join("\n");

    const fileUri = FileSystem.documentDirectory + "export.csv";
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  };

  const handleSelectAllToggle = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredHistory.map((item) => item.id));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        darkMode && { backgroundColor: "#1e1e1e" },
        item.pinned && styles.pinned,
        selectedItems.includes(item.id) && styles.selected,
      ]}
      onLongPress={() => {
        setSelectionMode(true);
        if (!selectedItems.includes(item.id)) {
          setSelectedItems((prev) => [...prev, item.id]);
        }
      }}
      onPress={() => {
        if (selectionMode) toggleSelection(item.id);
      }}
    ><Text style={[styles.text, darkMode && styles.textDark]}>
    🕒 {formatDate(item.timestamp)}
  </Text>
  <Text style={[styles.text, darkMode && styles.textDark]}>
    🌡 {item.temperature} °C
  </Text>
  <Text style={[styles.text, darkMode && styles.textDark]}>
    💓 {item.pouls} BPM
  </Text>
  <Text style={[styles.text, darkMode && styles.textDark]}>
    🫁 {item.spo2} %
  </Text>
  

      <View style={styles.actions}>
        {!showArchived ? (
          <>
            <TouchableOpacity
              onPress={() =>
                update(ref(database, `users/${uid}/history/${item.id}`), {
                  pinned: !item.pinned,
                })
              }
            >
              <Text style={styles.actionBtn}>
                {item.pinned ? t.unpin : t.pin}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                update(ref(database, `users/${uid}/history/${item.id}`), {
                  archived: true,
                })
              }
            >
              <Text style={styles.actionBtn}>{t.archive}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={() =>
              update(ref(database, `users/${uid}/history/${item.id}`), {
                archived: false,
              })
            }
          >
            <Text style={[styles.actionBtn, { color: "green" }]}>{t.restore}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() =>
            Alert.alert(t.confirmDelete, "", [
              { text: "Annuler", style: "cancel" },
              {
                text: "Supprimer",
                style: "destructive",
                onPress: () =>
                  remove(ref(database, `users/${uid}/history/${item.id}`)),
              },
            ])
          }
        >
          <Text style={[styles.actionBtn, { color: "red" }]}>{t.deleteOne}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedItems([]);
        }
        Keyboard.dismiss();
      }}
    >
      <View style={[styles.container, darkMode && { backgroundColor: "#121212" }]}>
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => setShowArchived(!showArchived)}
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleText}>
                  {showArchived ? t.back : t.archive}
                </Text>
              </TouchableOpacity>
  
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
                  <Text style={[styles.dateText, darkMode && styles.dateTextDark]}>{t.start}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
                  <Text style={[styles.dateText, darkMode && styles.dateTextDark]}>{t.end}</Text>
                </TouchableOpacity>
                {(dateStart || dateEnd) && (
                  <TouchableOpacity
                    onPress={() => {
                      setDateStart(null);
                      setDateEnd(null);
                    }}
                    style={styles.resetBtn}
                  >
                    <Text style={[styles.dateText, darkMode && styles.dateTextDark]}>{t.reset}</Text>
                  </TouchableOpacity>
                )}
              </View>
  
              {showStartPicker && (
                <DateTimePicker
                  value={dateStart || new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowStartPicker(false);
                    if (date) setDateStart(date);
                  }}
                  themeVariant={darkMode ? "dark" : "light"}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={dateEnd || new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowEndPicker(false);
                    if (date) setDateEnd(date);
                  }}
                  themeVariant={darkMode ? "dark" : "light"}
                />
              )}
  
              {selectionMode && (
                <View>
                  <Text style={[styles.selectedCount, darkMode && styles.selectedCountDark]}>
                    {selectedItems.length} {t.selected}
                  </Text>
                  <TouchableOpacity onPress={handleSelectAllToggle}>
                    <Text style={[{ color: "#007AFF" }, darkMode && { color: "#4DA3FF" }]}>
                      {selectedItems.length === filteredHistory.length ? t.deselectAll : t.selectAll}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
  
        <TouchableOpacity style={styles.exportFixedBtn} onPress={handleExport}>
          <Text style={styles.exportText}>{t.export}</Text>
        </TouchableOpacity>
  
        {selectionMode && selectedItems.length > 0 && (
          <TouchableOpacity style={styles.fab} onPress={handleDeleteSelected}>
            <Text style={{ color: "#fff", fontSize: 20 }}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
  

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  pinned: { borderColor: "#007AFF", borderWidth: 2 },
  selected: { borderColor: "#ff9500", borderWidth: 2 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: { fontWeight: "bold", fontSize: 14 },
  toggleBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  toggleText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  dateBtn: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  resetBtn: {
    backgroundColor: "#ff3b30",
    padding: 8,
    borderRadius: 6,
  },
  dateText: {
    color: "#000",
    fontWeight: "bold",
  },
  dateTextDark: {
    color: "#fff",
  },
  selectedCount: {
    fontWeight: "bold",
    color: "#000",
  },
  selectedCountDark: {
    color: "#fff",
  },
  exportFixedBtn: {
    position: "absolute",
    bottom: 30,
    left: "62%",
    transform: [{ translateX: -80 }],
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 4,
  },
  exportText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "red",
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },

  text: {
    color: "#333",
  },
  textDark: {
    color: "#fff",
  },
  
  
  
});
