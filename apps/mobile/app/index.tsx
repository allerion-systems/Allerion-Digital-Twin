import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GlassesBleClient, HudCard } from '../lib/glassesBle';

const apiBaseUrl = process.env.EXPO_PUBLIC_ALLERION_API_URL ?? 'http://localhost:8080';

export default function HudHomeScreen() {
  const ble = useMemo(() => new GlassesBleClient(), []);
  const [status, setStatus] = useState('Not connected');
  const [prompt, setPrompt] = useState('Find me the cheapest manufacturable HUD glasses prototype path.');
  const [agentOutput, setAgentOutput] = useState('');

  async function connect() {
    setStatus('Scanning for ALLERION glasses...');
    try {
      const device = await ble.connect();
      setStatus(`Connected to ${device.name ?? 'ALLERION HUD'}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Connection failed');
    }
  }

  async function sendTestHudCard() {
    const card: HudCard = {
      title: 'ALLERION',
      body: 'Prototype HUD online',
      priority: 'normal',
      ttlSeconds: 10,
    };

    await ble.sendHudCard(card);
    setStatus('Sent HUD card to glasses');
  }

  async function runManufacturingAgent() {
    setAgentOutput('Running agent...');
    const response = await fetch(`${apiBaseUrl}/agents/manufacturing/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      setAgentOutput(`Agent failed: ${response.status}`);
      return;
    }

    const data = await response.json();
    setAgentOutput(data.summary);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05070a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <Text style={{ color: 'white', fontSize: 30, fontWeight: '800' }}>ALLERION HUD</Text>
        <Text style={{ color: '#9ca3af', fontSize: 16 }}>
          Pair prototype glasses, send glanceable HUD cards, and run sourcing/manufacturing agents.
        </Text>

        <View style={{ padding: 16, borderRadius: 18, backgroundColor: '#111827', gap: 12 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Device</Text>
          <Text style={{ color: '#cbd5e1' }}>{status}</Text>
          <TouchableOpacity onPress={connect} style={{ padding: 14, borderRadius: 12, backgroundColor: '#2563eb' }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Connect Glasses</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendTestHudCard} style={{ padding: 14, borderRadius: 12, backgroundColor: '#374151' }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Send Test HUD Card</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, borderRadius: 18, backgroundColor: '#111827', gap: 12 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Manufacturing Agent</Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            multiline
            placeholder="Ask the agent to build BOMs, find suppliers, compare prototype paths..."
            placeholderTextColor="#6b7280"
            style={{ color: 'white', minHeight: 110, borderColor: '#374151', borderWidth: 1, borderRadius: 12, padding: 12 }}
          />
          <TouchableOpacity onPress={runManufacturingAgent} style={{ padding: 14, borderRadius: 12, backgroundColor: '#16a34a' }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Run Agent</Text>
          </TouchableOpacity>
          <Text style={{ color: '#e5e7eb', lineHeight: 22 }}>{agentOutput}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
