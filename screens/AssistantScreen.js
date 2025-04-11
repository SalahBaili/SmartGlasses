import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { AppContext } from "../AppContext";

export default function AssistantScreen() {
  const { theme, language } = useContext(AppContext);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = theme === "dark" ? darkTheme : lightTheme;
  const t = translations[language];

  const handleAsk = async () => {
    if (!input.trim()) return;
  
    setLoading(true);
    setResponse("");
  
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  
          Authorization: "Bearer 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", 
          "HTTP-Referer": "https://mon-assistant-ia-mobile.com", // ← URL de ton projet ou app (important pour OpenRouter)
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct", // ou "openai/gpt-3.5-turbo"
          messages: [
            { role: "system", content: "Tu es un assistant intelligent qui parle français." },
            { role: "user", content: input }
          ]
        }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur HTTP ${res.status} : ${errorText}`);
      }
  
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Pas de réponse.";
      setResponse(reply);
    } catch (error) {
      console.error("Erreur OpenRouter :", error);
      setResponse("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
        placeholder={t.placeholder}
        placeholderTextColor={colors.placeholder}
        value={input}
        onChangeText={setInput}
        multiline
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: "#007AFF" }]} onPress={handleAsk}>
        <Text style={styles.buttonText}>{t.ask}</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        response !== "" && (
          <View style={[styles.responseBox, { borderColor: colors.text }]}>
            <Text style={{ color: colors.text }}>{response}</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const lightTheme = {
  background: "#F5F5F5",
  text: "#000",
  inputBg: "#fff",
  placeholder: "#999",
};

const darkTheme = {
  background: "#1c1c1e",
  text: "#f0f0f0",
  inputBg: "#333",
  placeholder: "#888",
};

const translations = {
  fr: {
    title: "Assistant IA",
    placeholder: "Posez une question...",
    ask: "Demander",
  },
  en: {
    title: "AI Assistant",
    placeholder: "Ask a question...",
    ask: "Ask",
  },
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
  },
  button: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  responseBox: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
  },
});
