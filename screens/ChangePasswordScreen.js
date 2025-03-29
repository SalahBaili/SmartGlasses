import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { AppContext } from "../AppContext";

export default function ChangePasswordScreen({ navigation }) {
  const { theme, language } = useContext(AppContext);
  const isDark = theme === "dark";

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert(
        "⚠️",
        language === "fr"
          ? "Tous les champs sont requis."
          : "All fields are required."
      );
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert(
        "⚠️",
        language === "fr"
          ? "Les mots de passe ne correspondent pas."
          : "Passwords do not match."
      );
    }

    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, oldPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert(
        "✅",
        language === "fr"
          ? "Mot de passe modifié avec succès !"
          : "Password updated successfully!"
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "❌",
        language === "fr"
          ? "Ancien mot de passe incorrect."
          : "Old password is incorrect."
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#fff" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
        {language === "fr"
          ? "Changer le mot de passe"
          : "Change Password"}
      </Text>

      {/* Ancien mot de passe */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? "#222" : "#f1f1f1",
            borderColor: isDark ? "#444" : "#ccc",
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
          placeholder={
            language === "fr" ? "Ancien mot de passe" : "Old password"
          }
          placeholderTextColor={isDark ? "#aaa" : "#666"}
          secureTextEntry={!showOld}
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <TouchableOpacity onPress={() => setShowOld(!showOld)}>
          <Text style={styles.eye}>{showOld ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {/* Nouveau mot de passe */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? "#222" : "#f1f1f1",
            borderColor: isDark ? "#444" : "#ccc",
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
          placeholder={
            language === "fr" ? "Nouveau mot de passe" : "New password"
          }
          placeholderTextColor={isDark ? "#aaa" : "#666"}
          secureTextEntry={!showNew}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
          <Text style={styles.eye}>{showNew ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmer le mot de passe */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? "#222" : "#f1f1f1",
            borderColor: isDark ? "#444" : "#ccc",
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
          placeholder={
            language === "fr"
              ? "Confirmer le mot de passe"
              : "Confirm password"
          }
          placeholderTextColor={isDark ? "#aaa" : "#666"}
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Text style={styles.eye}>{showConfirm ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
        <Text style={styles.btnText}>
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eye: {
    fontSize: 18,
    marginLeft: 10,
  },
  btn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
