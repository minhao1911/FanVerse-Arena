import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

function getLevelTitle(level: number): string {
  if (level < 5) return 'Rookie';
  if (level < 10) return 'Fan';
  if (level < 15) return 'Ultra';
  if (level < 20) return 'Legend';
  return 'Icon';
}

function getLevelColor(level: number): string {
  if (level < 5) return '#94a3b8';
  if (level < 10) return '#22c55e';
  if (level < 15) return '#3b82f6';
  if (level < 20) return '#a855f7';
  return '#f5a623';
}

export function FanLevelBadge({ level, size = 'md' }: Props) {
  const colors = useColors();
  const color = getLevelColor(level);
  const title = getLevelTitle(level);
  const sz = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color, fontSize: sz }]}>Lv.{level} {title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600' as const,
  },
});
