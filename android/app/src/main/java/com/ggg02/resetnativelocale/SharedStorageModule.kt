package com.ggg02.resetnativelocale

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.content.Intent
import android.content.ComponentName
import android.appwidget.AppWidgetManager
import org.json.JSONArray
import org.json.JSONException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SharedStorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "SharedStorageModule"

    override fun getName(): String {
        return "SharedStorage"
    }

    @ReactMethod
    fun set(key: String, value: String) {
        Log.d(TAG, "Guardando en SharedPreferences: key=$key, value=$value")
        val sharedPreferences = reactApplicationContext.getSharedPreferences(
                "com.ggg02.resetnativelocale.shared", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.putString(key, value)
        editor.apply()
        
        // Forzar actualización del widget después de guardar
        try {
            val appWidgetManager = AppWidgetManager.getInstance(reactApplicationContext)
            val componentName = ComponentName(reactApplicationContext, MyAppWidget::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
            
            if (widgetIds.isNotEmpty()) {
                val updateIntent = Intent(reactApplicationContext, MyAppWidget::class.java)
                updateIntent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                reactApplicationContext.sendBroadcast(updateIntent)
                Log.d(TAG, "Broadcast enviado para actualizar widgets con IDs: ${widgetIds.joinToString()}")
            } else {
                Log.d(TAG, "No hay widgets instalados para actualizar")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al intentar actualizar los widgets: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun getWidgetInfo(callback: Callback) {
        try {
            val appWidgetManager = AppWidgetManager.getInstance(reactApplicationContext)
            val componentName = ComponentName(reactApplicationContext, MyAppWidget::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
            
            val sharedPreferences = reactApplicationContext.getSharedPreferences(
                    "com.ggg02.resetnativelocale.shared", Context.MODE_PRIVATE)
            val savedTexts = sharedPreferences.getString("savedTexts", "[]") ?: "[]"
            
            // Análisis básico de los textos guardados para mostrar información útil
            val parsedTexts = try {
                val jsonArray = JSONArray(savedTexts)
                val count = jsonArray.length()
                val sampleTexts = mutableListOf<String>()
                
                for (i in 0 until minOf(count, 3)) {
                    val textObj = jsonArray.getJSONObject(i)
                    sampleTexts.add(textObj.getString("text"))
                }
                
                "Total: $count, Ejemplos: ${sampleTexts.joinToString(", ")}"
            } catch (e: JSONException) {
                "Error al analizar JSON: ${e.message}"
            }
            
            // Calcular siguiente actualización basada en updatePeriodMillis
            val updatePeriodMillis = 1800000 // Este valor debe coincidir con app_widget_info.xml
            val nextUpdateTime = System.currentTimeMillis() + updatePeriodMillis
            val nextUpdateDate = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
                .format(Date(nextUpdateTime))
            
            // Usar WritableMap en lugar de HashMap para compatibilidad con JavaScript
            val info = Arguments.createMap()
            info.putString("widgetIds", widgetIds.joinToString())
            info.putInt("widgetCount", widgetIds.size)
            info.putString("savedTextsRaw", savedTexts)
            info.putString("parsedTexts", parsedTexts)
            info.putString("nextUpdateTime", nextUpdateDate)
            
            callback.invoke(null, info)
        } catch (e: Exception) {
            Log.e(TAG, "Error obteniendo información del widget: ${e.message}", e)
            callback.invoke(e.toString(), null)
        }
    }
}