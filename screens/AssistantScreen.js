import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { OPENAI_API_KEY } from "@env";
const API_KEY = OPENAI_API_KEY;

export default function AssistantScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!API_KEY) {
      Alert.alert("Erreur", "La clé API OpenAI est manquante.");
      return;
    }

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: newMessages,
        }),
      });

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        console.log("Réponse invalide de l'API:", data);
        Alert.alert("Erreur", "Réponse invalide de l'Assistant.");
        return;
      }

      const assistantReply = data.choices[0].message;
      setMessages([...newMessages, assistantReply]);
    } catch (error) {
      console.log("Erreur GPT:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'appel à l'Assistant.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.role === "user" ? styles.user : styles.assistant,
      ]}
    >
      <Text style={styles.text}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.chatContainer}
      />

      {loading && (
        <ActivityIndicator
          size="small"
          color="#007AFF"
          style={{ marginBottom: 10 }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholder="Écrivez un message..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.sendText}>📤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  chatContainer: {
    padding: 16,
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  assistant: {
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },
  text: {
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    marginRight: 10,
  },
  sendBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    fontSize: 24,
  },
});
