import WidgetKit
import SwiftUI

// Modelo para los textos guardados
struct SavedText: Identifiable, Codable {
    let id: String
    let text: String
}

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), savedTexts: [])
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        let savedTexts = fetchSavedTexts()
        return SimpleEntry(date: Date(), configuration: configuration, savedTexts: savedTexts)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        var entries: [SimpleEntry] = []

        let savedTexts = fetchSavedTexts()
        let currentDate = Date()
        let entry = SimpleEntry(date: currentDate, configuration: configuration, savedTexts: savedTexts)
        entries.append(entry)

        return Timeline(entries: entries, policy: .after(Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!))
    }
    
    // Función para obtener los textos guardados del storage compartido
    private func fetchSavedTexts() -> [SavedText] {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.ggg02.resetnativelocale.shared"),
              let savedTextsString = sharedDefaults.string(forKey: "savedTexts"),
              let data = savedTextsString.data(using: .utf8) else {
            return []
        }
        
        do {
            let decodedTexts = try JSONDecoder().decode([SavedText].self, from: data)
            return decodedTexts
        } catch {
            print("Error decoding saved texts: \(error)")
            return []
        }
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let savedTexts: [SavedText]
}

struct myWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading) {
            Text("Textos guardados:")
                .font(.headline)
                .padding(.bottom, 4)
            
            if entry.savedTexts.isEmpty {
                Text("No hay textos guardados")
                    .font(.caption)
                    .foregroundColor(.gray)
            } else {
                // Mostrar solo los 3 primeros textos como máximo
                ForEach(entry.savedTexts.prefix(3)) { text in
                    Text(text.text)
                        .font(.caption)
                        .lineLimit(1)
                        .padding(.vertical, 2)
                }
                
                if entry.savedTexts.count > 3 {
                    Text("+ \(entry.savedTexts.count - 3) más...")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
        .padding()
    }
}

struct myWidget: Widget {
    let kind: String = "myWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            myWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
    myWidget()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley, savedTexts: [])
    SimpleEntry(date: .now, configuration: .starEyes, savedTexts: [
        SavedText(id: "1", text: "Ejemplo de texto 1"),
        SavedText(id: "2", text: "Ejemplo de texto 2")
    ])
}
