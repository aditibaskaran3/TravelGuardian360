import { t } from '../i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import Button from '../components/Button';
import Input from '../components/Input';
import MapView from '../components/MapView';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import StatusBadge from '../components/StatusBadge';
import { InlineMessage } from '../components/States';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { DEFAULT_CENTER, ZONE_META, colors, radius } from '../utils/constants';
import { coords } from '../utils/format';
import { hasErrors, required, validateCoordinates } from '../utils/validation';
import AdminLayout from './components/AdminLayout';
import {
  AsyncBody, Cell, CellSub, DataTable, Flash, Label, NARROW_BREAKPOINT, PageToolbar, RowActions, useDebounced, useFlash,
} from './components/ui';

const TYPE_OPTIONS = ['safe', 'caution', 'high_risk'];
const EMPTY_FORM = {
  name: '', city: '', latitude: '', longitude: '', radius_m: '500', zone_type: 'safe', safety_level: '80', description: '',
};

function TypeSelector({ value, onChange }) {
  return (
    <View style={styles.typeRow}>
      {TYPE_OPTIONS.map((t) => {
        const meta = ZONE_META[t];
        const active = value === t;
        return (
          <Pressable
            key={t}
            accessibilityRole="button"
            onPress={() => onChange(t)}
            style={[styles.typeOption, active && { borderColor: meta.color, backgroundColor: meta.soft }]}
          >
            <View style={[styles.typeDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.typeText, active && { color: meta.color }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ZoneFormSheet({ visible, zone, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setFormError('');
    setForm(
      zone
        ? {
            name: zone.name || '',
            city: zone.city || '',
            latitude: String(zone.latitude),
            longitude: String(zone.longitude),
            radius_m: String(zone.radius_m),
            zone_type: zone.zone_type,
            safety_level: String(zone.safety_level),
            description: zone.description || '',
          }
        : EMPTY_FORM,
    );
  }, [visible, zone]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const next = {};
    next.name = form.name.trim().length < 2 ? t('Enter a zone name (at least 2 characters).') : '';
    next.latitude = required(form.latitude, t('Latitude'));
    next.longitude = required(form.longitude, t('Longitude'));
    if (!next.latitude && !next.longitude) {
      const coordError = validateCoordinates(form.latitude, form.longitude);
      if (coordError) next[Number.isNaN(Number(form.latitude)) || Math.abs(Number(form.latitude)) > 90 ? 'latitude' : 'longitude'] = coordError;
    }
    const radiusValue = Number(form.radius_m);
    next.radius_m =
      form.radius_m.trim() === '' || !Number.isInteger(radiusValue) || radiusValue < 50 || radiusValue > 50000
        ? t('Radius must be a whole number between 50 and 50000 metres.')
        : '';
    const level = Number(form.safety_level);
    next.safety_level =
      form.safety_level.trim() === '' || !Number.isInteger(level) || level < 0 || level > 100
        ? t('Safety level must be a whole number from 0 to 100.')
        : '';
    setErrors(next);
    setFormError('');
    if (hasErrors(next)) return;

    const payload = {
      name: form.name.trim(),
      city: form.city.trim() || null,
      zone_type: form.zone_type,
      safety_level: level,
      description: form.description.trim() || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius_m: radiusValue,
    };
    setSaving(true);
    try {
      if (zone) await adminApi.updateZone(zone.id, payload);
      else await adminApi.createZone(payload);
      onSaved(zone ? t('{name} was updated.', { name: payload.name }) : t('{name} was created.', { name: payload.name }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} title={zone ? t('Edit safety zone') : t('Add safety zone')} onClose={onClose} wide>
      <InlineMessage tone="warn">{t('Changes apply to tourists immediately.')}</InlineMessage>
      <InlineMessage>{formError}</InlineMessage>
      <Input label={t('Zone name')} value={form.name} onChangeText={set('name')} error={errors.name} icon="map-pin" />
      <Input label={t('City')} value={form.city} onChangeText={set('city')} icon="home" />
      <View style={styles.pair}>
        <Input
          label={t('Latitude')} value={form.latitude} onChangeText={set('latitude')} error={errors.latitude}
          keyboardType="numbers-and-punctuation" style={styles.half} placeholder="28.6139"
        />
        <Input
          label={t('Longitude')} value={form.longitude} onChangeText={set('longitude')} error={errors.longitude}
          keyboardType="numbers-and-punctuation" style={styles.half} placeholder="77.2090"
        />
      </View>
      <Input
        label={t('Radius (metres)')} value={form.radius_m} onChangeText={set('radius_m')} error={errors.radius_m}
        keyboardType="number-pad" hint={t('Area covered around the centre point, 50 to 50000 m.')}
      />
      <Label>{t('Zone type')}</Label>
      <TypeSelector value={form.zone_type} onChange={set('zone_type')} />
      <View style={styles.gap} />
      <Input
        label={t('Safety level (0 to 100)')} value={form.safety_level} onChangeText={set('safety_level')} error={errors.safety_level}
        keyboardType="number-pad" hint={t('Higher is safer.')}
      />
      <Input label={t('Description')} value={form.description} onChangeText={set('description')} multiline maxLength={1000} />
      <View style={styles.formActions}>
        <Button title={t('Cancel')} variant="outline" onPress={onClose} style={styles.flex1} />
        <Button title={zone ? t('Save changes') : t('Create zone')} onPress={save} loading={saving} style={styles.flex1} />
      </View>
    </Sheet>
  );
}

export default function SafetyZonesManagementScreen() {
  const { width } = useWindowDimensions();
  const narrow = width < NARROW_BREAKPOINT;
  const { data, loading, error, reload } = useApi(() => adminApi.zones(), []);
  const [search, setSearch] = useState('');
  const [type, setType] = useState(undefined);
  const q = useDebounced(search.trim().toLowerCase(), 200);
  const [flash, setFlash] = useFlash();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const all = data || [];
  const rows = all.filter(
    (z) =>
      (!type || z.zone_type === type) &&
      (!q || `${z.name} ${z.city || ''}`.toLowerCase().includes(q)),
  );
  const selected = all.find((z) => z.id === selectedId) || null;

  const signature = rows.map((z) => `${z.id}:${z.latitude}:${z.longitude}:${z.radius_m}:${z.zone_type}`).join('|');
  const zones = useMemo(
    () => rows.map((z) => ({ id: z.id, latitude: z.latitude, longitude: z.longitude, radius_m: z.radius_m, color: ZONE_META[z.zone_type]?.color || colors.muted })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );
  const markers = useMemo(
    () =>
      rows.map((z) => ({
        id: z.id,
        latitude: z.latitude,
        longitude: z.longitude,
        color: ZONE_META[z.zone_type]?.color || colors.muted,
        title: z.name,
        subtitle: t('{type} - safety level {level}', { type: ZONE_META[z.zone_type]?.label || z.zone_type, level: z.safety_level }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteZone(deleting.id);
      setFlash('safe', t('{name} was deleted. Tourists no longer see this zone.', { name: deleting.name }));
      if (selectedId === deleting.id) setSelectedId(null);
      setDeleting(null);
      reload({ silent: true });
    } catch (err) {
      setDeleting(null);
      setFlash('danger', err.message);
    } finally {
      setBusy(false);
    }
  };

  const openForm = (zone) => {
    setEditing(zone);
    setFormOpen(true);
  };

  const columns = [
    {
      key: 'name', title: t('Zone'), flex: 1.4,
      render: (z) => (
        <View>
          <Cell strong>{z.name}</Cell>
          <CellSub>{z.city || t('City not set')}</CellSub>
        </View>
      ),
    },
    { key: 'type', title: t('Type'), width: 120, render: (z) => <StatusBadge zone status={z.zone_type} /> },
    { key: 'level', title: t('Safety level'), width: 100, render: (z) => <Cell strong>{`${z.safety_level} / 100`}</Cell> },
    {
      key: 'area', title: t('Location'), flex: 1.2,
      render: (z) => (
        <View>
          <Cell>{coords(z.latitude, z.longitude)}</Cell>
          <CellSub>{t('Radius {n} m', { n: z.radius_m })}</CellSub>
        </View>
      ),
    },
    { key: 'description', title: t('Description'), flex: 1.6, render: (z) => <Cell numberOfLines={3}>{z.description}</Cell> },
    {
      key: 'actions', title: t('Actions'), width: 230,
      render: (z) => (
        <RowActions>
          <Button title={t('Edit')} icon="edit-2" variant="soft" small full={false} onPress={() => openForm(z)} />
          <Button title={t('Delete')} variant="dangerSoft" small full={false} onPress={() => setDeleting(z)} />
        </RowActions>
      ),
    },
  ];

  const typeChips = [
    { value: undefined, label: t('All'), count: all.length },
    ...TYPE_OPTIONS.map((t) => ({ value: t, label: ZONE_META[t].label, count: all.filter((z) => z.zone_type === t).length })),
  ];

  return (
    <AdminLayout
      title={t('Safety Zones')}
      subtitle={t('Zones shown to tourists on their map. Changes apply to tourists immediately.')}
      actions={<Button title={t('Add zone')} icon="plus" small full={false} onPress={() => openForm(null)} />}
    >
      <Flash flash={flash} />
      <PageToolbar
        search={search}
        onSearch={setSearch}
        placeholder={t('Search zone or city')}
        chips={typeChips}
        chipValue={type}
        onChip={setType}
      />
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <MapView
          height={narrow ? 260 : 380}
          zoom={11}
          zones={zones}
          markers={markers}
          fitMarkers={!selected && markers.length > 1}
          center={selected ? { latitude: selected.latitude, longitude: selected.longitude } : markers[0] || DEFAULT_CENTER}
          selectedId={selected ? selected.id : undefined}
          onMarkerPress={(m) => setSelectedId(m.id)}
        />
        <View style={styles.gap} />
        <DataTable
          columns={columns}
          rows={rows}
          onRowPress={(z) => setSelectedId(z.id)}
          rowStyle={(z) => (z.id === selectedId ? styles.selectedRow : null)}
          empty={{
            title: q || type ? t('No zones match your filters') : t('No safety zones yet'),
            message: q || type ? t('Try a different search or type.') : t('Add a zone to mark safe, caution and high risk areas for tourists.'),
          }}
        />
      </AsyncBody>

      <ZoneFormSheet
        visible={formOpen}
        zone={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(message) => {
          setFormOpen(false);
          setFlash('safe', `${message} ${t('Tourists see the change immediately.')}`);
          reload({ silent: true });
        }}
      />
      <ConfirmDialog
        visible={!!deleting}
        danger
        title={t('Delete this safety zone?')}
        message={t('{name} will be removed and tourists will stop seeing it right away. This cannot be undone.', { name: deleting?.name })}
        confirmLabel={t('Delete zone')}
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  gap: { height: 16 },
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeOption: {
    flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, cursor: 'pointer',
  },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeText: { color: colors.textSoft, fontSize: 13, fontWeight: '700' },
  selectedRow: { backgroundColor: colors.accentSoft },
});
