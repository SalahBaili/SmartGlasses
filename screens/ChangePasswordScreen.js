import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { AppContext } from "../AppContext";

export default function ChangePasswordScreen({ navigation }) {
  const { theme, language } = useContext(AppContext);
  const isDark = theme === "dark";

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert("⚠️", language === "fr" ? "Tous les champs sont requis." : "All fields are required.");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("⚠️", language === "fr" ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
    }

    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, oldPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("✅", language === "fr" ? "Mot de passe modifié avec succès !" : "Password updated successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("❌", language === "fr" ? "Ancien mot de passe incorrect." : "Old password is incorrect.");
    }
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: "#121212" }]}>
      <Text style={[styles.title, isDark && { color: "#fff" }]}>
        {language === "fr" ? "Changer le mot de passe" : "Change Password"}
      </Text>

      <TextInput
        style={[styles.input, isDark && styles.darkInput]}
        placeholder={language === "fr" ? "Ancien mot de passe" : "Old password"}
        placeholderTextColor={isDark ? "#aaa" : "#666"}
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={[styles.input, isDark && styles.darkInput]}
        placeholder={language === "fr" ? "Nouveau mot de passe" : "New password"}
        placeholderTextColor={isDark ? "#aaa" : "#666"}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={[styles.input, isDark && styles.darkInput]}
        placeholder={language === "fr" ? "Confirmer le mot de passe" : "Confirm password"}
        placeholderTextColor={isDark ? "#aaa" : "#666"}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
        <Text style={[styles.btnText, isDark && { color: "#fff" }]}>
          {language === "fr" ? "Enregistrer" : "Save"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  darkInput: {
    backgroundColor: "#222",
    color: "#fff",
    borderColor: "#444",
  },
  btn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
