import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Button, FlatList, StyleSheet, NativeModules, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';


// Define una interfaz para nuestra estructura de elemento de texto
interface TextItem {
  id: string;
  text: string;
}

export default function Index() {
  // Estado para el input de texto y la lista de textos guardados con tipado adecuado
  const [inputText, setInputText] = useState<string>('');
  const [savedTexts, setSavedTexts] = useState<TextItem[]>([]);

  // Cargar textos guardados desde AsyncStorage cuando el componente se monta
  useEffect(() => {
    loadSavedTexts();
  }, []);

  // Función para cargar textos guardados desde AsyncStorage
  const loadSavedTexts = async () => {
    try {
      const storedTexts = await AsyncStorage.getItem('savedTexts');
      if (storedTexts !== null) {
        setSavedTexts(JSON.parse(storedTexts));
      }
    } catch (error) {
      console.error('Error loading saved texts:', error);
    }
  };

  // Función para guardar datos accesibles por el widget
  const saveTextForWidget = async (texts: TextItem[]) => {
    try {
      // Guardar en AsyncStorage normal
      await AsyncStorage.setItem('savedTexts', JSON.stringify(texts));
      
      // También guardar en SharedPreferences para el widget
      if (Platform.OS === 'android') {
        // Para Android
        const { NativeModules } = require('react-native');
        if (NativeModules.SharedStorage) {
          NativeModules.SharedStorage.set(
            "savedTexts",
            JSON.stringify(texts)
          );
        }
      } else if (Platform.OS === 'ios') {
        // Para iOS
        if (NativeModules.SharedStorage) {
          NativeModules.SharedStorage.set(
            "savedTexts",
            JSON.stringify(texts)
          );
        }
      }
    } catch (error) {
      console.error('Error saving text for widget:', error);
    }
  };

  // Función para guardar un nuevo texto
  const saveText = async () => {
    if (inputText.trim()) {
      // Crear un nuevo objeto de texto con un ID y el texto de entrada
      const newText: TextItem = {
        id: Date.now().toString(),
        text: inputText
      };
      
      // Actualizar el estado con el nuevo texto
      const updatedTexts = [...savedTexts, newText];
      setSavedTexts(updatedTexts);
      
      // Guardar en AsyncStorage y para el widget
      try {
        await saveTextForWidget(updatedTexts);
      } catch (error) {
        console.error('Error saving text:', error);
      }
      
      // Limpiar el campo de entrada
      setInputText('');
    }
  };

  // Función para borrar todos los textos
  const clearAllTexts = () => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que deseas borrar todos los textos?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Borrar Todo",
          onPress: async () => {
            setSavedTexts([]);
            try {
              await saveTextForWidget([]);
            } catch (error) {
              console.error('Error clearing texts:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Función para renderizar cada elemento en la lista con tipado adecuado
  const renderItem = ({ item }: { item: TextItem }) => (
    <View style={styles.item}>
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe algo aquí..."
        />
        <Button title="Guardar" onPress={saveText} />
      </View>
      
      <View style={styles.headerContainer}>
        <Text style={styles.listHeader}>Textos guardados:</Text>
        <Button 
          title="Borrar Todo" 
          onPress={clearAllTexts} 
          color="#FF3B30" 
        />
      </View>

      <FlatList
        data={savedTexts}
        renderItem={renderItem}
        keyExtractor={(item: TextItem) => item.id}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});