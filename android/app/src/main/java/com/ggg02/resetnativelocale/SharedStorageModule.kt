package com.ggg02.resetnativelocale

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SharedStorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SharedStorage"
    }

    @ReactMethod
    fun set(key: String, value: String) {
        val sharedPreferences = reactApplicationContext.getSharedPreferences(
                "com.ggg02.resetnativelocale.shared", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.putString(key, value)
        editor.apply()
    }
}