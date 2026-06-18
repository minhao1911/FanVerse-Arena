import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Prediction } from '@/context/AppContext';

interface Props {
  prediction: Prediction;
  onSubmit: (id: string, home: number, away: number) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function PredictionCard({ prediction, onSubmit }: Props) {
  const colors = useColors();
  const [homeInput, setHomeInput] = useState('');
  const [awayInput, setAwayInput] = useState('');

  const handleSubmit = () => {
    const h = parseInt(homeInput);
    const a = parseInt(awayInput);
    if (isNaN(h) || isNaN(a)) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(prediction.id, h, a);
    setHomeInput('');
    setAwayInput('');
  };

  const accuracy = prediction.totalPredictions > 0
    ? Math.round((prediction.correctPredictions / prediction.totalPredictions) * 100)
    : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, {
          backgroundColor: prediction.status === 'live' ? colors.danger + '33' :
            prediction.status === 'finished' ? colors.muted + '33' : colors.success + '33'
        }]}>
          {prediction.status === 'live' && <View style={[styles.liveDot, { backgroundColor: colors.danger }]} />}
          <Text style={[styles.statusText, {
            color: prediction.status === 'live' ? colors.danger :
              prediction.status === 'finished' ? colors.muted : colors.success
          }]}>
            {prediction.status === 'live' ? 'LIVE' : prediction.status === 'finished' ? 'FT' : formatDate(prediction.matchDate)}
          </Text>
        </View>
        <Text style={[styles.participants, { color: colors.muted }]}>
          {prediction.totalPredictions.toLocaleString()} predictions
        </Text>
      </View>

      <View style={styles.matchRow}>
        <View style={styles.teamBlock}>
          <Text style={styles.teamFlag}>{prediction.homeFlag}</Text>
          <Text style={[styles.teamName, { color: colors.foreground }]}>{prediction.homeTeam}</Text>
        </View>

        <View style={styles.scoreBlock}>
          {prediction.status === 'finished' ? (
            <View style={styles.finalScore}>
              <Text style={[styles.finalScoreText, { color: colors.foreground }]}>
                {prediction.homeScore} - {prediction.awayScore}
              </Text>
            </View>
          ) : (
            <Text style={[styles.vs, { color: colors.muted }]}>VS</Text>
          )}
        </View>

        <View style={[styles.teamBlock, styles.teamRight]}>
          <Text style={styles.teamFlag}>{prediction.awayFlag}</Text>
          <Text style={[styles.teamName, { color: colors.foreground }]}>{prediction.awayTeam}</Text>
        </View>
      </View>

      {prediction.status === 'upcoming' && (
        prediction.userPrediction ? (
          <View style={[styles.submittedRow, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.submittedText, { color: colors.success }]}>
              Your prediction: {prediction.userPrediction.home} - {prediction.userPrediction.away}
            </Text>
          </View>
        ) : (
          <View style={styles.predRow}>
            <TextInput
              style={[styles.scoreInput, { color: colors.foreground, backgroundColor: colors.cardAlt, borderColor: colors.border }]}
              value={homeInput}
              onChangeText={setHomeInput}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={[styles.dash, { color: colors.muted }]}>—</Text>
            <TextInput
              style={[styles.scoreInput, { color: colors.foreground, backgroundColor: colors.cardAlt, borderColor: colors.border }]}
              value={awayInput}
              onChangeText={setAwayInput}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TouchableOpacity
              style={[styles.predictBtn, { backgroundColor: colors.primary, opacity: (!homeInput || !awayInput) ? 0.5 : 1 }]}
              onPress={handleSubmit}
              disabled={!homeInput || !awayInput}
              activeOpacity={0.8}
            >
              <Text style={styles.predictBtnText}>Predict</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      <TouchableOpacity
        style={[styles.detailsBtn, { borderColor: colors.border }]}
        onPress={() => router.push(`/match/${prediction.id}` as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.detailsBtnText, { color: colors.muted }]}>View Match Details</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  participants: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamBlock: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  teamRight: {
    alignItems: 'center',
  },
  teamFlag: {
    fontSize: 32,
  },
  teamName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  scoreBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  vs: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
  },
  finalScore: {
    alignItems: 'center',
  },
  finalScoreText: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
  },
  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreInput: {
    width: 48,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
  },
  dash: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
  },
  predictBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  predictBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700' as const,
    color: '#000',
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  submittedText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  detailsBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500' as const,
  },
});
