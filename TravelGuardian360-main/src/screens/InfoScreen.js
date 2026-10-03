import { t } from '../i18n';
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import Icon from '../components/Icon';
import ScreenContainer from '../components/ScreenContainer';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { useApi } from '../hooks/useApi';
import { travelInfoApi } from '../services/touristService';
import { colors } from '../utils/constants';
import { goBack } from '../utils/nav';

const META = {
  travel: { title: t('Travel Information'), subtitle: t('Getting around and getting set up'), icon: 'map' },
  safety: { title: t('Safety Information'), subtitle: t('Simple habits that keep you safe'), icon: 'shield' },
  emergency: { title: t('Emergency Services'), subtitle: t('Numbers to call in an emergency'), icon: 'phone-call' },
  tourist: { title: t('Tourist Information'), subtitle: t('Places and tips for visitors'), icon: 'compass' },
  help: { title: t('Help and Support'), subtitle: t('Answers and ways to reach us'), icon: 'help-circle' },
};

export default function InfoScreen({ navigation, route }) {
  const category = (route.params && route.params.category) || 'help';
  const meta = META[category] || META.help;
  const info = useApi(() => travelInfoApi.list(category), [category]);

  return (
    <ScreenContainer
      refreshing={false}
      onRefresh={() => info.reload({ silent: true })}
      header={<Header title={meta.title} subtitle={meta.subtitle} onBack={() => goBack(navigation)} />}
    >
      {info.loading && !info.data ? (
        <Loading />
      ) : info.error && !info.data ? (
        <ErrorState message={info.error} onRetry={info.reload} />
      ) : !info.data || info.data.length === 0 ? (
        <EmptyState icon={meta.icon} title={t('Nothing here yet')} message={t('Check back soon.')} />
      ) : (
        info.data.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={styles.top}>
              <View style={styles.icon}><Icon name={category === 'emergency' ? 'phone' : meta.icon} size={18} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                {item.destination ? <Text style={styles.place}>{item.destination}</Text> : null}
              </View>
              {category === 'emergency' && item.phone ? <Text style={styles.number}>{item.phone}</Text> : null}
            </View>
            <Text style={styles.body}>{item.content}</Text>
            {item.phone ? (
              <Button
                title={t('Call {phone}', { phone: item.phone })}
                icon="phone"
                small
                variant={category === 'emergency' ? 'danger' : 'soft'}
                full={false}
                style={{ marginTop: 12 }}
                onPress={() => Linking.openURL(`tel:${item.phone.replace(/[^\d+]/g, '')}`)}
              />
            ) : null}
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  place: { color: colors.accent, fontSize: 12, marginTop: 2, fontWeight: '600' },
  number: { color: colors.text, fontSize: 20, fontWeight: '800' },
  body: { color: colors.textSoft, fontSize: 13, lineHeight: 20, marginTop: 12 },
});
