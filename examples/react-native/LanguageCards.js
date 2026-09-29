import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { createDeck, review } from "./model.js";

export default function LanguageCards() {
  const [deck, setDeck] = useState(() => createDeck());
  const [selectedId, setSelectedId] = useState(() => createDeck()[0].id);
  const selected = deck.find((card) => card.id === selectedId) ?? null;

  function gradeSelected(grade) {
    setDeck((current) =>
      current.map((card) =>
        card.id === selectedId ? review(card, grade) : card,
      ),
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>언어 카드</Text>
      <FlatList
        data={deck}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedId(item.id)} style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>연속 {item.streak}</Text>
          </Pressable>
        )}
      />
      {selected ? (
        <View style={styles.detail}>
          <Text style={styles.name}>{selected.name}</Text>
          <Text>{selected.summary}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => gradeSelected("again")}
              style={styles.button}
            >
              <Text>again</Text>
            </Pressable>
            <Pressable
              onPress={() => gradeSelected("good")}
              style={styles.button}
            >
              <Text>good</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  name: { fontSize: 16, marginBottom: 4 },
  detail: { paddingTop: 16 },
  actions: { flexDirection: "row", marginTop: 8 },
  button: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 8 },
});
