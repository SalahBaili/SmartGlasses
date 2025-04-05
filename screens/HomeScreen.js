import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { auth, database } from "../firebaseConfig";
import { ref, onValue, push, update, set, get } from "firebase/database";
import { signOut } from "firebase/auth";
import { AppContext } from "../AppContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Accelerometer } from "expo-sensors";

export default function HomeScreen({ navigation }) {
  const { theme, language } = useContext(AppContext);
  const colors = theme === "dark" ? darkTheme : lightTheme;
  const t = translations[language];

  const [userInfo, setUserInfo] = useState({});
  const [data, setData] = useState({ temperature: 0, pouls: 0, spo2: 0 });
  const [avgData, setAvgData] = useState({ temperature: 0, pouls: 0, spo2: 0 });
  const [lastSavedData, setLastSavedData] = useState({});
  const [showBadge, setShowBadge] = useState(false);
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;
  const uid = user?.uid;

  // Shake detector 🚨
  useEffect(() => {
    let lastShakeTime = 0;

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now();
      const speed = Math.sqrt(x * x + y * y + z * z);

      if (speed > 2 && now - lastShakeTime > 2000) {
        lastShakeTime = now;
        handleExportLastFive(); // 👈 export on shake
      }
    });

    Accelerometer.setUpdateInterval(300);

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const handleExportLastFive = async () => {
    Alert.alert(
      t.title, // dynamique selon la langue
      t.message,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.confirm,
          onPress: async () => {
            const historyRef = ref(database, `users/${uid}/history`);
            const snapshot = await get(historyRef);
            if (!snapshot.exists()) return;
  
            const allData = Object.values(snapshot.val())
              .filter((entry) => !entry.archived)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
            const lastFive = allData.slice(0, 5);
  
            const csv = [
              "Date,Température,SpO2,Pouls",
              ...lastFive.map((e) => {
                const d = new Date(e.timestamp);
                const date = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}/${d.getFullYear()}`;
                return `${date},${e.temperature},${e.spo2},${e.pouls}`;
              }),
            ].join("\n");
  
            const fileUri = FileSystem.documentDirectory + "last_five_data.csv";
            await FileSystem.writeAsStringAsync(fileUri, csv, {
              encoding: FileSystem.EncodingType.UTF8,
            });
  
            await Sharing.shareAsync(fileUri);
          },
        },
      ]
    );
  };
  
  

  useEffect(() => {
    if (!uid) return;

    const userRef = ref(database, `users/${uid}`);
    const dataRef = ref(database, `users/${uid}/sensorData`);
    const historyRef = ref(database, `users/${uid}/history`);
    const lastSavedRef = ref(database, `users/${uid}/lastSavedData`);

    let initialLoad = true;

    onValue(lastSavedRef, (snap) => {
      if (snap.exists()) {
        setLastSavedData(snap.val());
      }
    });

    onValue(dataRef, (snap) => {
      if (snap.exists()) {
        const newData = snap.val();
        setData(newData);

        if (initialLoad || !lastSavedData) {
          initialLoad = false;
          return;
        }

        const changed =
          newData.temperature !== lastSavedData.temperature ||
          newData.pouls !== lastSavedData.pouls ||
          newData.spo2 !== lastSavedData.spo2;

        if (changed) {
          const newEntryRef = push(historyRef);
          set(newEntryRef, {
            ...newData,
            timestamp: new Date().toISOString(),
          });

          update(userRef, {
            lastSavedData: newData,
          });

          setLastSavedData(newData);
          setShowBadge(true);
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setTimeout(() => {
              Animated.timing(badgeOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setShowBadge(false));
            }, 2000);
          });
        }
      }
    });

    onValue(userRef, (snap) => {
      if (snap.exists()) {
        setUserInfo(snap.val());
      }
    });

    onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const values = Object.values(snapshot.val()).filter((v) => !v.archived);
        const count = values.length;
        const sum = values.reduce(
          (acc, curr) => ({
            temperature: acc.temperature + (curr.temperature || 0),
            pouls: acc.pouls + (curr.pouls || 0),
            spo2: acc.spo2 + (curr.spo2 || 0),
          }),
          { temperature: 0, pouls: 0, spo2: 0 }
        );
        setAvgData({
          temperature: (sum.temperature / count).toFixed(1),
          pouls: Math.round(sum.pouls / count),
          spo2: Math.round(sum.spo2 / count),
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  const getDisplayName = () => {
    if (userInfo.name) return userInfo.name;
    if (user?.email) return user.email.split("@")[0];
    return "Utilisateur";
  };

  const isAlert = (temp, spo2, pouls) => {
    if (!temp || !spo2 || !pouls) return false;
    return temp > 38 || temp < 35 || spo2 < 90 || pouls < 50 || pouls > 120;
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      {showBadge && (
        <Animated.View style={[styles.badge, { opacity: badgeOpacity, backgroundColor: colors.success }]}>
          <Text style={styles.badgeText}>✅ {t.saved}</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={[styles.welcome, { color: colors.subtext }]}>{t.welcome}</Text>
          <Text style={[styles.username, { color: colors.text }]}>{getDisplayName()}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Profil")}>
          <Image
            source={
              userInfo.photo
                ? { uri: userInfo.photo }
                : require("../assets/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <Card title={t.temperature} value={`${data.temperature} °C`} color="#007AFF" />
        <Card title={t.pulse} value={`${data.pouls} BPM`} color="#FF3B30" />
        <Card title={t.spo2} value={`${data.spo2} %`} color="#34C759" />
      </View>

      <Text style={[styles.subtitle, { color: colors.text }]}>{t.averages}</Text>
      <View style={styles.avgContainer}>
        <Text style={[styles.avgText, { color: colors.text }]}>🌡 {avgData.temperature} °C</Text>
        <Text style={[styles.avgText, { color: colors.text }]}>💓 {avgData.pouls} BPM</Text>
        <Text style={[styles.avgText, { color: colors.text }]}>🫁 {avgData.spo2} %</Text>
      </View>

      {isAlert(data.temperature, data.spo2, data.pouls) && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            ⚠️ {t.alert}{" "}
            <Text
              style={{ color: "#007AFF", textDecorationLine: "underline" }}
              onPress={() => navigation.navigate("Doctors")}
            >
              {t.consult}
            </Text>
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#007AFF" }]} onPress={() => navigation.navigate("Historique")}>
          <Text style={styles.btnText}>📜 {t.history}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#34C759" }]} onPress={() => navigation.navigate("Statistiques")}>
          <Text style={styles.btnText}>📈 {t.stats}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 {t.logout}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const Card = ({ title, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.label}>{title}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
  </View>
);

const lightTheme = {
  background: "#F5F5F5",
  text: "#000",
  subtext: "#555",
  success: "#34C759",
};

const darkTheme = {
  background: "#1c1c1e",
  text: "#f0f0f0",
  subtext: "#aaa",
  success: "#0f0",
};

const translations = {
  fr: {
    home: "Accueil",
    welcome: "Bienvenue",
    temperature: "🌡️ Température",
    pulse: "💓 Pouls",
    spo2: "🫁 SpO2",
    averages: "📊 Moyennes générales",
    alert: "Valeur(s) anormale(s) détectée(s).",
    consult: "Consultez un médecin.",
    history: "Historique",
    stats: "Statistiques",
    logout: "Déconnexion",
    saved: "Mesure enregistrée",
    assistant: "Assistant",
    title: "Alerte !!",
      message: "Voulez-vous exporter les 5 dernières mesures ?",
      cancel: "Annuler",
      confirm: "Exporter",
  },
  en: {
    home: "Home",
    welcome: "Welcome",
    temperature: "🌡️ Temperature",
    pulse: "💓 Pulse",
    spo2: "🫁 SpO2",
    averages: "📊 Averages",
    alert: "Abnormal value(s) detected.",
    consult: "See a doctor.",
    history: "History",
    stats: "Statistics",
    logout: "Logout",
    saved: "Saved",
    assistant: "Assistant",
    title: "Alert",
      message: "Do you want to export the last 5 measurements?",
      cancel: "Cancel",
      confirm: "Export",
  },
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcome: {
    fontSize: 16,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ddd",
  },
  cardContainer: {
    width: "100%",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  avgContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  avgText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  alertBox: {
    backgroundColor: "#FFD2D2",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    marginBottom: 20,
  },
  alertText: {
    color: "#B00020",
    fontWeight: "bold",
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    marginTop: 10,
    gap: 10,
  },
  btn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutBtn: {
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  badge: {
    position: "absolute",
    top: 30,
    backgroundColor: "#34C759",
    padding: 10,
    borderRadius: 8,
    zIndex: 99,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
