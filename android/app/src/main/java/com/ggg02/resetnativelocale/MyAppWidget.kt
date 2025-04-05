package com.ggg02.resetnativelocale

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONException

class MyAppWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        // Actualiza todos los widgets
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            // Construye la vista del widget
            val views = RemoteViews(context.packageName, R.layout.app_widget)
            
            // Obtiene los textos guardados
            val savedTextsJson = getSavedTexts(context)
            val textListBuilder = StringBuilder()
            
            try {
                val textsArray = JSONArray(savedTextsJson)
                
                if (textsArray.length() == 0) {
                    views.setTextViewText(R.id.text_list, "No hay textos guardados")
                } else {
                    // Limita a mostrar máximo 3 textos
                    val limit = minOf(textsArray.length(), 3)
                    
                    for (i in 0 until limit) {
                        val textObj = textsArray.getJSONObject(i)
                        val text = textObj.getString("text")
                        textListBuilder.append(text).append("\n")
                    }
                    
                    if (textsArray.length() > 3) {
                        textListBuilder.append("+ ").append(textsArray.length() - 3).append(" más...")
                    }
                    
                    views.setTextViewText(R.id.text_list, textListBuilder.toString())
                }
            } catch (e: JSONException) {
                views.setTextViewText(R.id.text_list, "Error al cargar textos")
            }
            
            // Actualiza el widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
        
        private fun getSavedTexts(context: Context): String {
            val sharedPreferences = context.getSharedPreferences(
                    "com.ggg02.resetnativelocale.shared", Context.MODE_PRIVATE)
            return sharedPreferences.getString("savedTexts", "[]") ?: "[]"
        }
    }
}