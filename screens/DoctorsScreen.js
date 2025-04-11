import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Linking,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { AppContext } from "../AppContext";

const allDoctors = [
  { id: "1", name: "Dr. Ali Ben Salah", specialty: "Cardiologue", phone: "71210526", address: "Clinique El Amen, Tunis" },
  { id: "2", name: "Dr. Leila Messaoud", specialty: "Pneumologue", phone: "25497277", address: "Hôpital Charles Nicolle" },
  { id: "3", name: "Dr. Karim Haddad", specialty: "Généraliste", phone: "45697525", address: "Centre Médical Ariana" },
  { id: "4", name: "Dr. Mehdi KHLIF", specialty: "Cardiologue", phone: "73228889", address: "Rue Dr Moreau, Sousse" },
  { id: "5", name: "Dr. Moez Ben Sayah", specialty: "Pneumologue", phone: "73202267", address: "Immeuble Élite square, Sousse" },
  { id: "6", name: "Dr. Mohamed H. Lajimi", specialty: "Généraliste", phone: "98402225", address: "7 Av. du 20 Mars 1956, Sousse" },
];

export default function DoctorsScreen() {
  const { language, theme } = useContext(AppContext);
  const [search, setSearch] = useState("");

  const isDark = theme === "dark";
  

  const t = {
    fr: {
      title: "Liste des Médecins",
      search: "Rechercher un médecin...",
      google: "🔎 Voir plus de médecins sur Google",
    },
    en: {
      title: "Doctors List",
      search: "Search for a doctor...",
      google: "🔎 See more doctors on Google",
    },
  }[language];
  const specialtyTranslations = {
  Cardiologue: { fr: "Cardiologue", en: "Cardiologist" },
  Pneumologue: { fr: "Pneumologue", en: "Pulmonologist" },
  Généraliste: { fr: "Généraliste", en: "General Practitioner" },
};


const filtered = allDoctors.filter((d) => {
  const nameMatch = d.name.toLowerCase().includes(search.toLowerCase());
  const specialtyTranslated = specialtyTranslations[d.specialty]?.[language] || d.specialty;
  const specialtyMatch =
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    specialtyTranslated.toLowerCase().includes(search.toLowerCase());

  return nameMatch || specialtyMatch;
});


  return (
    <View style={[styles.container, isDark && { backgroundColor: "#121212" }]}>
      <Text style={[styles.title, isDark && { color: "#fff" }]}>{t.title}</Text>

      <TextInput
        placeholder={t.search}
        placeholderTextColor={isDark ? "#aaa" : "#666"}
        value={search}
        onChangeText={setSearch}
        style={[
          styles.searchInput,
          isDark && {
            backgroundColor: "#1e1e1e",
            color: "#fff",
            borderColor: "#444",
          },
        ]}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, isDark && { backgroundColor: "#1e1e1e" }]}>
            <Text style={[styles.name, isDark && { color: "#fff" }]}>{item.name}</Text>
            <Text style={[styles.specialty, isDark && { color: "#ccc" }]}>
  {specialtyTranslations[item.specialty]?.[language] || item.specialty}
</Text>

            <Text style={[styles.address, isDark && { color: "#aaa" }]}>📍 {item.address}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
              <Text style={[styles.phone, isDark && { color: "#4DA3FF" }]}>📞 {item.phone}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity onPress={() => Linking.openURL("https://www.google.com/search?q=m%C3%A9decins+proches")}>
        <Text style={styles.googleLink}>{t.google}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  specialty: {
    color: "#555",
    marginTop: 2,
  },
  address: {
    marginTop: 5,
    color: "#777",
  },
  phone: {
    marginTop: 5,
    color: "#007AFF",
    fontWeight: "bold",
  },
  googleLink: {
    marginTop: 20,
    textAlign: "center",
    color: "#007AFF",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
});
