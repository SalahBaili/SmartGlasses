import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { TouchableOpacity, Text } from "react-native";
import ChatScreen from "../screens/ChatScreen";
import HomeScreen from "../screens/HomeScreen";
import StatsScreen from "../screens/StatsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AssistantScreen from "../screens/AssistantScreen";
import DoctorsScreen from "../screens/DoctorsScreen";

import { AppContext } from "../AppContext";

// Création des navigateurs
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// ⚙️ Ce Stack contiendra Home + Doctors
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Drawer.Screen
  name="Home"
  component={HomeScreen}
  options={{
    headerShown: false, // 👈 cache complètement la barre du haut
  }}
/>

      <Stack.Screen name="Doctors" component={DoctorsScreen} options={{ title: "Médecins" }} />
    </Stack.Navigator>
  );
}

export default function AppDrawer() {
  const { language } = useContext(AppContext);

  const labels = {
    home: language === "fr" ? "Accueil" : "Home",
    stats: language === "fr" ? "Statistiques" : "Statistics",
    history: language === "fr" ? "Historique" : "History",
    profile: language === "fr" ? "Profil" : "Profile",
    settings: language === "fr" ? "Paramètres" : "Settings",
  };

  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={{ marginRight: 15 }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        ),
        headerTitleAlign: "center",
      })}
    >
      {/* Utilisation de MainStack au lieu de Home directement */}
      <Drawer.Screen name="Main" component={MainStack} options={{ title: labels.home }} />
      <Drawer.Screen name="Statistiques" component={StatsScreen} options={{ title: labels.stats }} />
      <Drawer.Screen name="Historique" component={HistoryScreen} options={{ title: labels.history }} />
      <Drawer.Screen name="Profil" component={ProfileScreen} options={{ title: labels.profile }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: labels.settings }} />
      <Drawer.Screen name="Assistant" component={AssistantScreen} options={{ title: "Assistant 🤖" }} />
    </Drawer.Navigator>
  );
}
