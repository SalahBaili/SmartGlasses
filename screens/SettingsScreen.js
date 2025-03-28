import React, { useContext } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import { AppContext } from "../AppContext";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const { theme, setTheme, language, setLanguage } = useContext(AppContext);
  const navigation = useNavigation();

  const isDark = theme === "dark";

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const toggleLanguage = () => setLanguage(language === "fr" ? "en" : "fr");

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>
        {language === "fr" ? "Paramètres" : "Settings"}
      </Text>

      {/* 🌙 Thème */}
      <View style={styles.row}>
        <Text style={[styles.label, isDark && styles.darkText]}>
          {language === "fr" ? "Mode sombre" : "Dark mode"}
        </Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

   

      {/* 🌐 Langue */}
      <View style={styles.row}>
        <Text style={[styles.label, isDark && styles.darkText]}>
          {language === "fr" ? "Langue" : "Language"}
        </Text>
        <TouchableOpacity onPress={toggleLanguage} style={styles.languageBtn}>
          <Text style={styles.languageText}>
            {language === "fr" ? "Français 🇫🇷" : "English 🇬🇧"}
          </Text>
        </TouchableOpacity>
      </View>
         {/* 🔐 Changer mot de passe */}
         <TouchableOpacity
        onPress={() => navigation.navigate("ChangerMotDePasse")}
        style={styles.row}
      >
        <Text style={[styles.label, isDark && styles.darkText]}>
          🔐 {language === "fr" ? "Changer le mot de passe" : "Change password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
  },
  languageBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  languageText: {
    color: "#fff",
    fontWeight: "bold",
  },
  darkText: {
    color: "#fff",
  },
});
