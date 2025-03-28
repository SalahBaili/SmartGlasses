import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { database, ref, onValue } from "../firebaseConfig";
import { captureRef } from "react-native-view-shot";
import { shareAsync } from "expo-sharing";
import * as Print from "expo-print";
import { AppContext } from "../AppContext";

export default function StatsScreen() {
  const { theme, language } = useContext(AppContext);
  const isDark = theme === "dark";

  const [labels, setLabels] = useState([]);
  const [temperatures, setTemperatures] = useState([]);
  const [spo2s, setSpo2s] = useState([]);
  const [pouls, setPouls] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("temperature");
  const [selectedPeriod, setSelectedPeriod] = useState("7j");
  const chartRef = useRef();

  useEffect(() => {
    const historyRef = ref(database, "history");

    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let entries = Object.values(data)
          .filter((item) => !item.archived)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (selectedPeriod === "7j") entries = entries.slice(-7);
        else if (selectedPeriod === "30j") entries = entries.slice(-30);

        const dateLabels = entries.map((e) =>
          new Date(e.timestamp).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
          })
        );

        setLabels(dateLabels);
        setTemperatures(entries.map((e) => e.temperature || 0));
        setPouls(entries.map((e) => e.pouls || 0));
        setSpo2s(entries.map((e) => e.spo2 || 0));
      }
    });

    return () => unsubscribe();
  }, [selectedPeriod]);

  const getData = () => {
    switch (selectedMetric) {
      case "temperature":
        return temperatures;
      case "pouls":
        return pouls;
      case "spo2":
        return spo2s;
      default:
        return [];
    }
  };

  const getColor = () => {
    switch (selectedMetric) {
      case "temperature":
        return "#007AFF";
      case "pouls":
        return "#FF9500";
      case "spo2":
        return "#34C759";
      default:
        return "#000";
    }
  };

  const getLabel = () => {
    switch (selectedMetric) {
      case "temperature":
        return language === "fr" ? "Température (°C)" : "Temperature (°C)";
      case "pouls":
        return language === "fr" ? "Pouls (BPM)" : "Pulse (BPM)";
      case "spo2":
        return language === "fr" ? "SpO2 (%)" : "SpO2 (%)";
    }
  };

  const limitedLabels = labels.map((label, index) => {
    const step = Math.ceil(labels.length / 6);
    return index % step === 0 ? label : "";
  });

  const handleExportPDF = async () => {
    try {
      const uri = await captureRef(chartRef, {
        format: "png",
        quality: 1,
      });

      const html = `
        <html>
          <body style="text-align: center; font-family: Arial">
            <h2>${language === "fr" ? "Rapport SmartGlasses" : "SmartGlasses Report"}</h2>
            <p><strong>${getLabel()}</strong> — ${language === "fr" ? "Période" : "Period"} : ${selectedPeriod.toUpperCase()}</p>
            <img src="${uri}" style="width: 100%; max-width: 500px;" />
          </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await shareAsync(pdfUri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      console.error("Erreur PDF :", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, isDark && { backgroundColor: "#121212" }]}>
      <Text style={[styles.title, isDark && { color: "#fff" }]}>
        {language === "fr" ? "📊 Statistiques des relevés" : "📊 Recorded Statistics"}
      </Text>

      {/* Sélecteur de période */}
      <View style={styles.periodSelector}>
        {["7j", "30j", "tout"].map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setSelectedPeriod(p)}
            style={[
              styles.periodBtn,
              selectedPeriod === p && styles.selectedPeriodBtn,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === p && { color: "#fff" },
              ]}
            >
              {p.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type de mesure */}
      <View style={styles.selector}>
        <TouchableOpacity
          onPress={() => setSelectedMetric("temperature")}
          style={[
            styles.optionBtn,
            selectedMetric === "temperature" && styles.selectedBtn,
          ]}
        >
          <Text style={styles.optionText}>🌡 {language === "fr" ? "Température" : "Temperature"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedMetric("pouls")}
          style={[
            styles.optionBtn,
            selectedMetric === "pouls" && styles.selectedBtn,
          ]}
        >
          <Text style={styles.optionText}>💓 {language === "fr" ? "Pouls" : "Pulse"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedMetric("spo2")}
          style={[
            styles.optionBtn,
            selectedMetric === "spo2" && styles.selectedBtn,
          ]}
        >
          <Text style={styles.optionText}>🫁 SpO2</Text>
        </TouchableOpacity>
      </View>

      {/* Graphique */}
      {labels.length > 0 && getData().length > 0 ? (
        <View ref={chartRef} collapsable={false}>
          <LineChart
            data={{
              labels: limitedLabels,
              datasets: [{ data: getData() }],
              legend: [getLabel()],
            }}
            width={Dimensions.get("window").width - 40}
            height={260}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: isDark ? "#222" : "#fff",
              backgroundGradientTo: isDark ? "#222" : "#fff",
              decimalPlaces: 1,
              color: () => getColor(),
              labelColor: () => (isDark ? "#fff" : "#000"),
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#fff",
              },
            }}
            bezier
            style={{ marginVertical: 20, borderRadius: 16 }}
          />
        </View>
      ) : (
        <Text style={{ marginTop: 20, color: isDark ? "#aaa" : "gray" }}>
          {language === "fr"
            ? "Pas encore de données à afficher."
            : "No data to display yet."}
        </Text>
      )}

      {/* Export PDF */}
      <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
        <Text style={styles.exportText}>
          📤 {language === "fr" ? "Exporter en PDF" : "Export as PDF"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    gap: 10,
  },
  periodBtn: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedPeriodBtn: {
    backgroundColor: "#007AFF",
  },
  periodText: {
    fontWeight: "bold",
    color: "#007AFF",
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },
  optionBtn: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedBtn: {
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontWeight: "bold",
    color: "#fff",
  },
  exportBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 30,
  },
  exportText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
