import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
} from "react-native";
import { AppContext } from "../AppContext";

const doctors = [
  { id: "1", name: "Dr. Ali Ben Salah", specialty: "Cardiologue", address: "Clinique El Amen, Tunis. Téléphone : 71 210 526" },
  { id: "2", name: "Dr. Leila Messaoud", specialty: "Pneumologue", address: "Hôpital Charles Nicolle. Téléphone : 25 49 72 77" },
  { id: "3", name: "Dr. Karim Haddad", specialty: "Généraliste", address: "Centre Médical Ariana. Téléphone : 45 69 75 25" },
  { id: "4", name: "Dr. Mehdi KHLIF", specialty: "Cardiologue", address: "Rue Dr Moreau, Sousse. Téléphone : 73 228 889" },
  { id: "5", name: "Dr. Ben Sayah Moez", specialty: "Pneumologue", address: "Clinique El Yosr, Sousse. Téléphone : 73 202 267" },
  { id: "6", name: "Dr. Mohamed Hafedh LAJIMI", specialty: "Généraliste", address: "Sousse. Téléphone : 98 402 225" },
];

const translations = {
  fr: {
    title: "Liste des Médecins",
    search: "🔍 Rechercher...",
    google: "🔎 Voir plus de médecins sur Google",
  },
  en: {
    title: "Doctors List",
    search: "🔍 Search...",
    google: "🔎 Find more doctors on Google",
  },
};

export default function DoctorsScreen() {
  const { language, darkMode } = useContext(AppContext);
  const t = translations[language];
  const [searchText, setSearchText] = useState("");

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const bgColor = darkMode ? "#121212" : "#f9f9f9";
  const textColor = darkMode ? "#fff" : "#000";
  const inputBg = darkMode ? "#1e1e1e" : "#fff";
  const cardBg = darkMode ? "#1f1f1f" : "#fff";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{t.title}</Text>

      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: inputBg,
            color: textColor,
            borderColor: darkMode ? "#333" : "#ccc",
          },
        ]}
        placeholder={t.search}
        placeholderTextColor={darkMode ? "#aaa" : "#555"}
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
            // On cherche un numéro de téléphone dans l'adresse
            const phoneMatch = item.address.match(/(\+?\d[\d\s]+)/);
            const phoneNumber = phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : null;
          
            return (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
                <Text style={{ color: darkMode ? "#ccc" : "#333" }}>{item.specialty}</Text>
                <Text style={[styles.address, { color: darkMode ? "#aaa" : "#555" }]}>
                  📍 {item.address}
                </Text>
          
                {phoneNumber && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${phoneNumber}`)}>
                    <Text style={styles.callText}>📞 Appeler : {phoneMatch[0]}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          
      />

      <TouchableOpacity
        onPress={() => Linking.openURL("https://www.google.com/search?q=m%C3%A9decins+proches")}
      >
        <Text style={styles.googleLink}>{t.google}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  address: {
    marginTop: 5,
  },
  googleLink: {
    marginTop: 20,
    color: "#007AFF",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  callText: {
    marginTop: 8,
    color: "#007AFF",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  
});
