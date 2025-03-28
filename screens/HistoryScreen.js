import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import { database, ref, onValue, remove, update } from "../firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const formatDate = (date) => {
    if (!date) return "Non définie";
    const d = new Date(date);
    return (
      ("0" + d.getDate()).slice(-2) +
      "/" +
      ("0" + (d.getMonth() + 1)).slice(-2) +
      "/" +
      d.getFullYear()
    );
  };

  useEffect(() => {
    const historyRef = ref(database, "history");
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = Object.entries(data)
          .map(([id, entry]) => ({ id, ...entry }))
          .filter((entry) => (showArchived ? entry.archived : !entry.archived));

        const pinned = items.filter((e) => e.pinned);
        const others = items.filter((e) => !e.pinned).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const sorted = [...pinned, ...others];
        setHistory(sorted);
      }
    });
    return () => unsubscribe();
  }, [showArchived]);

  useEffect(() => {
    const filtered = history.filter((entry) => {
      if (showArchived) return true;
      const date = new Date(entry.timestamp);
      const afterStart = dateStart ? date >= dateStart : true;
      const beforeEnd = dateEnd ? date <= dateEnd : true;
      return afterStart && beforeEnd;
    });
    setFilteredHistory(filtered);
  }, [history, dateStart, dateEnd, showArchived]);

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    Alert.alert(
      "Confirmation",
      `Supprimer ${selectedItems.length} élément(s) ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            selectedItems.forEach((id) =>
              remove(ref(database, `history/${id}`))
            );
            setSelectedItems([]);
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    const dataToExport = selectedItems.length
      ? filteredHistory.filter((item) => selectedItems.includes(item.id))
      : filteredHistory;

    if (dataToExport.length === 0) {
      Alert.alert("Rien à exporter !");
      return;
    }

    const csv = [
      "Date,Température,SpO2,Pouls",
      ...dataToExport.map((e) => {
        const date = formatDate(new Date(e.timestamp));
        return `${date},${e.temperature},${e.spo2},${e.pouls}`;
      }),
    ].join("\n");

    const fileUri = FileSystem.documentDirectory + "historique.csv";
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  };

  const handleSelectAllToggle = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([]);
    } else {
      const allIds = filteredHistory.map((item) => item.id);
      setSelectedItems(allIds);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => {
        setSelectionMode(true);
        if (!selectedItems.includes(item.id)) {
          setSelectedItems((prev) => [...prev, item.id]);
        }
      }}
      onPress={() => {
        if (selectionMode) toggleSelection(item.id);
      }}
      style={[
        styles.card,
        item.pinned && styles.pinned,
        selectedItems.includes(item.id) && styles.selected,
      ]}
    >
      <Text>🕒 {formatDate(new Date(item.timestamp))}</Text>
      <Text>🌡 Température: {item.temperature} °C</Text>
      <Text>💓 Pouls: {item.pouls} BPM</Text>
      <Text>🫁 SpO2: {item.spo2} %</Text>

      <View style={styles.actions}>
        {!showArchived && (
          <>
            <TouchableOpacity onPress={() => update(ref(database, `history/${item.id}`), { pinned: !item.pinned })}>
              <Text style={styles.actionBtn}>{item.pinned ? "📌 Détacher" : "📌 Épingler"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => update(ref(database, `history/${item.id}`), { archived: true })}>
              <Text style={styles.actionBtn}>🗃️ Archiver</Text>
            </TouchableOpacity>
          </>
        )}
        {showArchived && (
          <TouchableOpacity onPress={() => update(ref(database, `history/${item.id}`), { archived: false })}>
            <Text style={[styles.actionBtn, { color: "green" }]}>🔁 Restaurer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Confirmation",
              "Supprimer cette mesure ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer",
                  style: "destructive",
                  onPress: () => remove(ref(database, `history/${item.id}`)),
                },
              ]
            );
          }}
        >
          <Text style={[styles.actionBtn, { color: "red" }]}>🗑️ Supprimer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            {selectionMode && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedItems([]);
                }}
                style={{ height: 40 }}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowArchived(!showArchived)}
              style={styles.toggleBtn}
            >
              <Text style={styles.toggleText}>
                {showArchived ? "⬅️ Retour aux mesures" : "🗃️ Voir les archivées"}
              </Text>
            </TouchableOpacity>

            <View style={styles.dateFilters}>
              <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>📅 Début</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>📅 Fin</Text>
              </TouchableOpacity>
              {(dateStart || dateEnd) && (
                <TouchableOpacity onPress={() => { setDateStart(null); setDateEnd(null); }} style={styles.resetButton}>
                  <Text style={styles.resetText}>🔄</Text>
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
              />
            )}

            {selectionMode && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: "bold" }}>
                  {selectedItems.length} sélectionné(s)
                </Text>
                <TouchableOpacity onPress={handleSelectAllToggle}>
                  <Text style={{ color: "#007AFF" }}>
                    {selectedItems.length === filteredHistory.length
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />

      {selectionMode && selectedItems.length > 0 && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 30,
            right: 20,
            backgroundColor: "red",
            padding: 15,
            borderRadius: 50,
            elevation: 5,
          }}
          onPress={handleDeleteSelected}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
    paddingBottom: 100,
  },
  toggleBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  toggleText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dateFilters: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  dateText: {
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#ff3b30",
    padding: 8,
    borderRadius: 6,
  },
  resetText: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    elevation: 2,
  },
  pinned: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  selected: {
    borderColor: "#ff9500",
    borderWidth: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
