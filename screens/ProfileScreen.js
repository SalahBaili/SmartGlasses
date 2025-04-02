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
  const { darkMode, language } = useContext(AppContext);

  const [userInfo, setUserInfo] = useState({});
  const [editing, setEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;
  const uid = user?.uid;

  const initialInputs = {
    name: "",
    sex: "",
    age: "",
    height: "",
    weight: "",
    conditions: "", // anciennement "allergies"
  };

  const [inputs, setInputs] = useState(initialInputs);

  useEffect(() => {
    const userRef = ref(database, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        // Migration automatique si "allergies" existe
        if (data.allergies && !data.conditions) {
          update(userRef, { conditions: data.allergies });
        }

        setUserInfo(data);
        setInputs({
          name: data.name || "",
          sex: data.sex || "",
          age: data.age || "",
          height: data.height || "",
          weight: data.weight || "",
          conditions: data.conditions || "",
        });
      }
    });
  }, []);

  const t = {
    fr: {
      name: "Nom",
      sex: "Sexe",
      male: "Homme",
      female: "Femme",
      age: "Âge",
      height: "Taille (cm)",
      weight: "Poids (kg)",
      conditions: "Maladies antécédents",
      edit: "✏️ Modifier le profil",
      save: "💾 Enregistrer",
      enter: "Entrez votre",
    },
    en: {
      name: "Name",
      sex: "Sex",
      male: "Male",
      female: "Female",
      age: "Age",
      height: "Height (cm)",
      weight: "Weight (kg)",
      conditions: "Medical Conditions",
      edit: "✏️ Edit Profile",
      save: "💾 Save",
      enter: "Enter your",
    },
  }[language];

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
    try {
      await update(ref(database, `users/${uid}`), { ...inputs });
      animateSlideOut();
    } catch (error) {
      Alert.alert("Erreur", "Échec de la mise à jour");
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
    }).start(() => setEditing(false));
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

  const renderRow = (label, key, isTextInput = true) => {
    const value = userInfo[key];
    const displayValue =
      typeof value === "object" ? JSON.stringify(value) : value || "—";
    const placeholderText = `${t.enter} ${label.toLowerCase()}`;

    return (
      <View style={styles.infoRow}>
        <Text style={[styles.label, darkMode && { color: "#bbb" }]}>
          🔹 {label}
        </Text>
        {editing && isTextInput ? (
          <TextInput
            value={inputs[key]}
            onChangeText={(text) => setInputs({ ...inputs, [key]: text })}
            style={[
              styles.input,
              darkMode && { backgroundColor: "#222", color: "#fff" },
            ]}
            placeholder={placeholderText}
            placeholderTextColor={darkMode ? "#aaa" : "#888"}
          />
        ) : (
          <Text style={[styles.value, darkMode && { color: "#fff" }]}>
            {displayValue}
          </Text>
        )}
      </View>
    );
  };

  const renderGenderSelector = () => (
    <View style={styles.infoRow}>
      <Text style={[styles.label, darkMode && { color: "#bbb" }]}>🧑‍🤝‍🧑 {t.sex}</Text>
      {editing ? (
        <View style={styles.genderSelector}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              inputs.sex === "male" && styles.genderSelected,
            ]}
            onPress={() => setInputs({ ...inputs, sex: "male" })}
          >
            <Text style={{ color: inputs.sex === "male" ? "#fff" : "#000" }}>
              {t.male}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderOption,
              inputs.sex === "female" && styles.genderSelected,
            ]}
            onPress={() => setInputs({ ...inputs, sex: "female" })}
          >
            <Text style={{ color: inputs.sex === "female" ? "#fff" : "#000" }}>
              {t.female}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[styles.value, darkMode && { color: "#fff" }]}>
          {userInfo.sex === "male"
            ? t.male
            : userInfo.sex === "female"
            ? t.female
            : "—"}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        darkMode && { backgroundColor: "#121212" },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (editing ? pickImage() : openModal())}>
          <Image
            source={
              userInfo.photo
                ? { uri: userInfo.photo }
                : require("../assets/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={[styles.name, darkMode && { color: "#fff" }]}>
          {userInfo.name || "Utilisateur"}
        </Text>
      </View>

      <View
        style={[
          styles.infoSection,
          darkMode && { backgroundColor: "#1e1e1e" },
        ]}
      >
        {renderRow(t.name, "name")}
        {renderGenderSelector()}
        {renderRow(t.age, "age")}
        {renderRow(t.height, "height")}
        {renderRow(t.weight, "weight")}
        {renderRow(t.conditions, "conditions")}
      </View>

      {!editing ? (
        <TouchableOpacity style={styles.editBtn} onPress={animateSlideIn}>
          <Text style={styles.editText}>{t.edit}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>{t.save}</Text>
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
    padding: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ddd",
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
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
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingVertical: 5,
  },
  genderSelector: {
    flexDirection: "row",
    gap: 10,
  },
  genderOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  genderSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  editBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  saveBtn: {
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  editText: {
    color: "#fff",
    fontWeight: "bold",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
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
