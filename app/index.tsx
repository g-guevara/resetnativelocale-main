import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Button, FlatList, StyleSheet, NativeModules, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Define una interfaz para nuestra estructura de elemento de texto
interface TextItem {
  id: string;
  text: string;
}

// Interfaz para la información del widget
interface WidgetInfo {
  widgetCount: number;
  widgetIds: string;
  savedTextsRaw: string;
  parsedTexts: string;
  nextUpdateTime: string;
}

export default function Index() {
  // Estado para el input de texto y la lista de textos guardados con tipado adecuado
  const [inputText, setInputText] = useState<string>('');
  const [savedTexts, setSavedTexts] = useState<TextItem[]>([]);
  const [widgetInfo, setWidgetInfo] = useState<WidgetInfo | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('Nunca');

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
        console.log('Textos cargados desde AsyncStorage:', storedTexts);
      }
    } catch (error) {
      console.error('Error loading saved texts:', error);
    }
  };

  // Función para guardar datos accesibles por el widget
  const saveTextForWidget = async (texts: TextItem[]) => {
    try {
      console.log('Guardando textos para el widget:', JSON.stringify(texts));
      
      // Guardar en AsyncStorage normal
      await AsyncStorage.setItem('savedTexts', JSON.stringify(texts));
      
      // También guardar en SharedPreferences para el widget
      if (Platform.OS === 'android') {
        // Para Android
        if (NativeModules.SharedStorage) {
          NativeModules.SharedStorage.set(
            "savedTexts",
            JSON.stringify(texts)
          );
          console.log('Textos guardados en SharedStorage para Android');
          setLastUpdateTime(new Date().toLocaleTimeString());
        } else {
          console.warn('SharedStorage no disponible en Android');
        }
      } else if (Platform.OS === 'ios') {
        // Para iOS
        if (NativeModules.SharedStorage) {
          NativeModules.SharedStorage.set(
            "savedTexts",
            JSON.stringify(texts)
          );
          console.log('Textos guardados en SharedStorage para iOS');
        } else {
          console.warn('SharedStorage no disponible en iOS');
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
        // Actualizamos info del widget después de guardar
        checkWidgetStatus();
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
              // Actualizamos info del widget después de borrar
              checkWidgetStatus();
            } catch (error) {
              console.error('Error clearing texts:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Función para verificar el estado del widget
  const checkWidgetStatus = () => {
    if (Platform.OS === 'android' && NativeModules.SharedStorage && NativeModules.SharedStorage.getWidgetInfo) {
      NativeModules.SharedStorage.getWidgetInfo((error: string, info: WidgetInfo) => {
        if (error) {
          console.error('Error getting widget info:', error);
          Alert.alert('Error', 'No se pudo obtener información del widget: ' + error);
        } else {
          console.log('Widget info:', info);
          setWidgetInfo(info);
        }
      });
    } else {
      console.log('getWidgetInfo no está disponible');
      Alert.alert('No disponible', 'La información del widget solo está disponible en Android');
    }
  };
  
  // Función para forzar la actualización del widget
  const forceWidgetUpdate = async () => {
    if (Platform.OS === 'android' && NativeModules.SharedStorage) {
      try {
        // Volvemos a guardar los datos actuales para forzar una actualización
        await saveTextForWidget(savedTexts);
        setLastUpdateTime(new Date().toLocaleTimeString());
        Alert.alert('Éxito', 'Actualización del widget solicitada');
        // Comprobamos el estado después de la actualización
        setTimeout(checkWidgetStatus, 500);
      } catch (error) {
        console.error('Error updating widget:', error);
        Alert.alert('Error', 'No se pudo actualizar el widget: ' + error);
      }
    }
  };

  // Función para renderizar cada elemento en la lista con tipado adecuado
  const renderItem = ({ item }: { item: TextItem }) => (
    <View style={styles.item}>
      <Text>{item.text}</Text>
    </View>
  );

  // Renderizar el componente principal
  return (
    <SafeAreaView style={styles.container}>
      {/* Input y botón para agregar texto */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe algo aquí..."
        />
        <Button title="Guardar" onPress={saveText} />
      </View>
      
      {/* Encabezado de la lista con botón de borrar */}
      <View style={styles.headerContainer}>
        <Text style={styles.listHeader}>Textos guardados:</Text>
        <Button 
          title="Borrar Todo" 
          onPress={clearAllTexts} 
          color="#FF3B30" 
        />
      </View>

      {/* Lista de textos guardados */}
      <View style={styles.listContainer}>
        <FlatList
          data={savedTexts}
          renderItem={renderItem}
          keyExtractor={(item: TextItem) => item.id}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.emptyList}>No hay textos guardados</Text>}
        />
      </View>
      
      {/* Sección de depuración del Widget */}
      <View style={styles.debugSection}>
        <Text style={styles.debugHeader}>Depuración del Widget</Text>
        <Text style={styles.debugText}>Última actualización: {lastUpdateTime}</Text>
        
        <View style={styles.buttonRow}>
          <View style={styles.button}>
            <Button 
              title="Verificar Estado" 
              onPress={checkWidgetStatus} 
              color="#007AFF"
            />
          </View>
          <View style={styles.button}>
            <Button 
              title="Forzar Actualización" 
              onPress={forceWidgetUpdate} 
              color="#4CD964"
            />
          </View>
        </View>
        
        {widgetInfo && (
          <View style={styles.widgetInfo}>
            <Text style={styles.infoTitle}>Información del Widget:</Text>
            <Text>Cantidad de widgets: {widgetInfo.widgetCount}</Text>
            <Text>IDs de widgets: {widgetInfo.widgetIds || 'Ninguno'}</Text>
            <Text>Próxima actualización: {widgetInfo.nextUpdateTime}</Text>
            <Text style={styles.infoTitle}>Textos guardados:</Text>
            <Text>{widgetInfo.parsedTexts}</Text>
            <Text style={styles.rawJson}>Datos raw: {widgetInfo.savedTextsRaw}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
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
    marginBottom: 5,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    height: 200, // Altura fija para la lista
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  debugSection: {
    marginTop: 10,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  debugHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  widgetInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  rawJson: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
});