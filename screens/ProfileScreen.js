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

// Thèmes
const lightTheme = {
  background: "#ffffff",
  card: "#ffffff",
  text: "#000000",
  label: "#888888",
  inputBackground: "#eeeeee",
  buttonText: "#ffffff",
};

const darkTheme = {
  background: "#121212",
  card: "#1e1e1e",
  text: "#ffffff",
  label: "#bbbbbb",
  inputBackground: "#222222",
  buttonText: "#ffffff",
};

export default function ProfileScreen() {
  const { theme, language } = useContext(AppContext);
  const isDark = theme === "dark";
  const colors = isDark ? darkTheme : lightTheme;
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
    conditions: "",
  };

  const [inputs, setInputs] = useState(initialInputs);

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

  useEffect(() => {
    const userRef = ref(database, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
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
    } catch {
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

  const renderRow = (label, key, isTextInput = true) => {
    const value = userInfo[key];
    const displayValue = value || "—";
    const placeholder = `${t.enter} ${label.toLowerCase()}`;

    return (
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: colors.label }]}>🔹 {label}</Text>
        {editing && isTextInput ? (
          <TextInput
            value={inputs[key]}
            onChangeText={(text) => setInputs({ ...inputs, [key]: text })}
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={isDark ? "#aaa" : "#666"}
          />
        ) : (
          <Text style={{ color: colors.text }}>{displayValue}</Text>
        )}
      </View>
    );
  };

  const renderGenderSelector = () => (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: colors.label }]}>🧑‍🤝‍🧑 {t.sex}</Text>
      {editing ? (
        <View style={styles.genderSelector}>
          {["male", "female"].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderOption,
                inputs.sex === gender && styles.genderSelected,
              ]}
              onPress={() => setInputs({ ...inputs, sex: gender })}
            >
              <Text style={{
                color: inputs.sex === gender ? "#fff" : "#000",
                fontWeight: "bold"
              }}>
                {t[gender]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.text }}>
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (editing ? pickImage() : setModalVisible(true))}>
          <Image
            source={
              userInfo.photo
                ? { uri: userInfo.photo }
                : require("../assets/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.text }]}>
          {userInfo.name || "Utilisateur"}
        </Text>
      </View>

      <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
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

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setModalVisible(false)}
        >
          <Animated.Image
            source={
              userInfo.photo
                ? { uri: userInfo.photo }
                : require("../assets/avatar-placeholder.png")
            }
            style={[styles.fullImage, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}
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
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingVertical: 5,
    borderRadius: 5,
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
