import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { AppContext } from "../AppContext";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { darkMode, language } = useContext(AppContext);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert(
        language === "fr" ? "Erreur" : "Error",
        language === "fr" ? "Veuillez entrer un email." : "Please enter an email."
      );
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        language === "fr" ? "Succès" : "Success",
        language === "fr"
          ? "Un lien de réinitialisation a été envoyé à votre adresse email."
          : "A reset link has been sent to your email."
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.title, darkMode && styles.darkText]}>
        {language === "fr" ? "Réinitialiser le mot de passe" : "Reset Password"}
      </Text>

      <Text style={[styles.description, darkMode && styles.darkText]}>
        {language === "fr"
          ? "Entrez votre adresse email pour recevoir un lien de réinitialisation."
          : "Enter your email to receive a reset link."}
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, darkMode && styles.darkInput]}
        keyboardType="email-address"
        placeholderTextColor={darkMode ? "#aaa" : "#666"}
      />

      <TouchableOpacity style={styles.button} onPress={handlePasswordReset} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {language === "fr" ? "Envoyer le lien" : "Send Link"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.backText, darkMode && styles.darkText]}>
          🔙 {language === "fr" ? "Retour à la connexion" : "Back to Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 30,
    justifyContent: "center",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    color: "#000",
  },
  darkInput: {
    backgroundColor: "#222",
    color: "#fff",
    borderColor: "#555",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "bold",
  },
  darkText: {
    color: "#fff",
  },
});
