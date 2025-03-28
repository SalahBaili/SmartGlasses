import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Animated,
  Easing,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { database, ref, update, onValue, auth } from "../firebaseConfig";
import { AppContext } from "../AppContext";

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState({});
  const [nameInput, setNameInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const { darkMode, language } = useContext(AppContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;
  const uid = user?.uid;

  useEffect(() => {
    const userRef = ref(database, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserInfo(data);
        setNameInput(data.name || "");
      }
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      update(ref(database, `users/${uid}`), {
        photo: selectedUri,
      });
    }
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }

    try {
      await update(ref(database, `users/${uid}`), {
        name: nameInput.trim(),
      });
      animateSlideOut();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    }
  };

  const animateSlideIn = () => {
    setEditing(true);
    slideAnim.setValue(-200);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const animateSlideOut = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setEditing(false);
    });
  };

  const openModal = () => {
    setModalVisible(true);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        darkMode && { backgroundColor: "#121212" },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (editing) {
              pickImage();
            } else {
              openModal();
            }
          }}
        >
          <Image
            source={
              userInfo.photo
                ? { uri: userInfo.photo }
                : require("../assets/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>

        {!editing ? (
          <>
            <Text style={[styles.name, darkMode && { color: "#fff" }]}>
              {userInfo.name || (language === "fr" ? "Utilisateur" : "User")}
            </Text>
            <Text style={[styles.email, darkMode && { color: "#ccc" }]}>
              {auth.currentUser?.email}
            </Text>
          </>
        ) : (
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              style={[
                styles.input,
                darkMode && {
                  backgroundColor: "#222",
                  color: "#fff",
                  borderColor: "#666",
                },
              ]}
              placeholder={
                language === "fr" ? "Entrez votre nom" : "Enter your name"
              }
              placeholderTextColor={darkMode ? "#aaa" : "#888"}
            />
          </Animated.View>
        )}
      </View>

      <View
        style={[
          styles.infoSection,
          darkMode && { backgroundColor: "#1e1e1e" },
        ]}
      >
        <View style={styles.infoRow}>
          <Text style={[styles.label, darkMode && { color: "#bbb" }]}>
            👤 {language === "fr" ? "Nom" : "Name"}
          </Text>
          <Text style={[styles.value, darkMode && { color: "#fff" }]}>
            {userInfo.name || "—"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, darkMode && { color: "#bbb" }]}>
            ✉️ Email
          </Text>
          <Text style={[styles.value, darkMode && { color: "#fff" }]}>
            {auth.currentUser?.email}
          </Text>
        </View>
      </View>

      {!editing ? (
        <TouchableOpacity style={styles.editBtn} onPress={animateSlideIn}>
          <Text style={styles.editText}>
            ✏️ {language === "fr" ? "Modifier le profil" : "Edit Profile"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>
            💾 {language === "fr" ? "Enregistrer" : "Save"}
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={closeModal}
          activeOpacity={1}
        >
          <Animated.Image
            source={
              userInfo.photo
                ? { uri: userInfo.photo }
                : require("../assets/avatar-placeholder.png")
            }
            style={[
              styles.fullImage,
              {
                opacity: fadeAnim,
                transform: [{ scale: fadeAnim }],
              },
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ddd",
    marginBottom: 15,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    color: "gray",
  },
  email: {
    fontSize: 16,
    color: "gray",
  },
  input: {
    width: 200,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 18,
    padding: 5,
    textAlign: "center",
    color: "gray",
  },
  infoSection: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    color: "#888",
    marginBottom: 5,
    fontSize: 14,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  editBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  editText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "70%",
    borderRadius: 10,
  },
});
