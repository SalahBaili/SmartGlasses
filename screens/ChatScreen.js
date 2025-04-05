import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { OPENAI_API_KEY } from "@env";

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Aucune réponse.";
      setResponse(reply);
    } catch (error) {
      setResponse("❌ Erreur lors de la connexion à l'assistant.");
      console.error(error);
    }

    setLoading(false);
    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>🤖 Assistant Santé</Text>

        <TextInput
          style={styles.input}
          placeholder="Pose ta question ici..."
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <Button
          title={loading ? "Chargement..." : "Envoyer"}
          onPress={sendMessage}
          disabled={loading}
          color="#007AFF"
        />

        {response !== "" && (
          <View style={styles.responseBox}>
            <Text style={styles.label}>Réponse :</Text>
            <Text style={styles.response}>{response}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  inner: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#007AFF",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 15,
    minHeight: 60,
  },
  responseBox: {
    backgroundColor: "#e6f0ff",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  response: {
    fontSize: 16,
    lineHeight: 22,
  },
});
