import { createDrawerNavigator } from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import StatsScreen from "../screens/StatsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { useContext } from "react";
import { AppContext } from "../AppContext";
import { TouchableOpacity, Text } from "react-native";

const Drawer = createDrawerNavigator();

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
            onPress={() => navigation.navigate("Settings")} // 👈 Le nom du screen
            style={{ marginRight: 15 }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        ),
        headerTitleAlign: "center",
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: labels.home }} />
      <Drawer.Screen name="Statistiques" component={StatsScreen} options={{ title: labels.stats }} />
      <Drawer.Screen name="Historique" component={HistoryScreen} options={{ title: labels.history }} />
      <Drawer.Screen name="Profil" component={ProfileScreen} options={{ title: labels.profile }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: labels.settings }} />
    </Drawer.Navigator>
  );
}
