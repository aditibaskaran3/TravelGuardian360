import { t } from '../../i18n';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import Icon from '../../components/Icon';
import Input from '../../components/Input';
import { EmptyState, ErrorState, InlineMessage, Loading } from '../../components/States';
import { colors, radius } from '../../utils/constants';

export const NARROW_BREAKPOINT = 900;

/* ------------------------------------------------------------------ hooks */

export function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/** Calls the latest callback on an interval while the component is mounted. */
export function usePolling(callback, ms) {
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** Transient success/error message for mutations. */
export function useFlash(timeout = 6000) {
  const [flash, setFlashState] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const setFlash = (tone, text) => {
    clearTimeout(timer.current);
    setFlashState(text ? { tone, text } : null);
    if (text && tone !== 'danger') timer.current = setTimeout(() => setFlashState(null), timeout);
  };
  return [flash, setFlash];
}

export function Flash({ flash, style }) {
  if (!flash) return null;
  return <InlineMessage tone={flash.tone} style={style}>{flash.text}</InlineMessage>;
}

/* ------------------------------------------------------------------ layout pieces */

/** Shows loading / error only when there is nothing to display yet; keeps previous data during refreshes. */
export function AsyncBody({ data, loading, error, onRetry, children }) {
  if (loading && !data) return <Loading style={styles.stateBox} />;
  if (error && !data) return <ErrorState message={error} onRetry={onRetry} style={styles.stateBox} />;
  return (
    <>
      {error ? <InlineMessage tone="warn">{t('Showing the last loaded data.')} {error}</InlineMessage> : null}
      {children}
    </>
  );
}

export function SectionCard({ title, subtitle, right, children, style, tone, padded = true }) {
  return (
    <View
      style={[
        styles.section,
        tone === 'danger' && { borderColor: colors.danger, backgroundColor: colors.dangerTint },
        style,
      ]}
    >
      {title || right ? (
        <View style={styles.sectionHead}>
          <View style={styles.flex1}>
            {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
            {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      <View style={padded ? styles.sectionBody : null}>{children}</View>
    </View>
  );
}

export function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({ label, children, style }) {
  return (
    <View style={[styles.field, style]}>
      <Label>{label}</Label>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={styles.fieldValue}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function FieldGrid({ children }) {
  return <View style={styles.fieldGrid}>{children}</View>;
}

export function RowActions({ children, style }) {
  return <View style={[styles.rowActions, style]}>{children}</View>;
}

export function Cell({ children, muted, strong, numberOfLines = 2 }) {
  return (
    <Text style={[styles.cell, muted && styles.cellMuted, strong && styles.cellStrong]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function CellSub({ children }) {
  return <Text style={styles.cellSub} numberOfLines={1}>{children}</Text>;
}

export function Pill({ text, color = colors.muted, soft = colors.cardAlt }) {
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ toolbar & chips */

export function FilterChips({ options, value, onChange }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            {o.count != null ? (
              <View style={[styles.chipCount, active && styles.chipCountActive]}>
                <Text style={[styles.chipCountText, active && styles.chipTextActive]}>{o.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function PageToolbar({ search, onSearch, placeholder = t('Search'), chips, chipValue, onChip, right }) {
  return (
    <View style={styles.toolbar}>
      {onSearch ? (
        <View style={styles.searchWrap}>
          <Input
            value={search}
            onChangeText={onSearch}
            placeholder={placeholder}
            icon="search"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : null}
      {chips ? <FilterChips options={chips} value={chipValue} onChange={onChip} /> : null}
      {right ? <View style={styles.toolbarRight}>{right}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ data table */

function renderValue(col, row) {
  const out = col.render ? col.render(row) : row[col.key];
  if (out == null || out === '') return <Cell muted>—</Cell>;
  if (typeof out === 'string' || typeof out === 'number') return <Cell>{out}</Cell>;
  return out;
}

const minWidthOf = (col) => col.width || 130 * (col.flex || 1);

/**
 * columns: [{ key, title, render(row), width, flex }]. A column with key "actions" is rendered
 * without a label in the stacked card layout.
 */
export function DataTable({
  columns, rows, onRowPress, empty, keyExtractor = (r) => r.id, rowStyle, breakpoint = NARROW_BREAKPOINT,
}) {
  const { width } = useWindowDimensions();
  const narrow = width < breakpoint;

  if (!rows || rows.length === 0) {
    return (
      <View style={styles.table}>
        <EmptyState icon="inbox" title={empty?.title || t('Nothing to show')} message={empty?.message} />
      </View>
    );
  }

  if (narrow) {
    const [primary, ...rest] = columns;
    return (
      <View style={styles.cardList}>
        {rows.map((row) => {
          const extra = rowStyle ? rowStyle(row) : null;
          const body = (
            <>
              <View style={styles.rowCardHead}>{renderValue(primary, row)}</View>
              {rest.map((col) =>
                col.key === 'actions' ? (
                  <View key={col.key} style={styles.rowCardActions}>{renderValue(col, row)}</View>
                ) : (
                  <View key={col.key} style={styles.rowCardLine}>
                    <Text style={styles.rowCardLabel}>{col.title}</Text>
                    <View style={styles.rowCardValue}>{renderValue(col, row)}</View>
                  </View>
                ),
              )}
            </>
          );
          return onRowPress ? (
            <Pressable key={keyExtractor(row)} onPress={() => onRowPress(row)} style={[styles.rowCard, extra]}>
              {body}
            </Pressable>
          ) : (
            <View key={keyExtractor(row)} style={[styles.rowCard, extra]}>{body}</View>
          );
        })}
      </View>
    );
  }

  const totalMin = columns.reduce((sum, c) => sum + minWidthOf(c), 0);
  const cellStyle = (col) => (col.width ? { width: col.width } : { flex: col.flex || 1, minWidth: minWidthOf(col) });
  return (
    <View style={styles.table}>
      <ScrollView horizontal contentContainerStyle={styles.tableScroll}>
        <View style={{ flexGrow: 1, minWidth: totalMin }}>
          <View style={styles.thead}>
            {columns.map((col) => (
              <View key={col.key} style={[styles.th, cellStyle(col)]}>
                <Text style={styles.thText} numberOfLines={1}>{col.key === 'actions' ? '' : col.title}</Text>
              </View>
            ))}
          </View>
          {rows.map((row, i) => {
            const extra = rowStyle ? rowStyle(row) : null;
            const content = columns.map((col) => (
              <View key={col.key} style={[styles.td, cellStyle(col)]}>{renderValue(col, row)}</View>
            ));
            const style = [styles.tr, i === rows.length - 1 && styles.trLast, extra];
            return onRowPress ? (
              <Pressable key={keyExtractor(row)} onPress={() => onRowPress(row)} style={({ hovered }) => [...style, hovered && styles.trHover]}>
                {content}
              </Pressable>
            ) : (
              <View key={keyExtractor(row)} style={style}>{content}</View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ stat card */

export function StatCard({ label, value, icon, color = colors.accent, hint, onPress, style }) {
  const body = (
    <>
      <View style={styles.statTop}>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
        {icon ? (
          <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
            <Icon name={icon} size={16} color={color} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value ?? '—'}</Text>
      {hint ? <Text style={styles.statHint} numberOfLines={2}>{hint}</Text> : null}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={[styles.stat, style]}>{body}</Pressable>
  ) : (
    <View style={[styles.stat, style]}>{body}</View>
  );
}

export function StatGrid({ children }) {
  return <View style={styles.statGrid}>{children}</View>;
}

/* ------------------------------------------------------------------ charts */

function useWidth() {
  const [w, setW] = useState(0);
  const onLayout = (e) => setW(Math.floor(e.nativeEvent.layout.width));
  return [w, onLayout];
}

/** data: [{ label, value, color? }] */
export function BarChart({ data, height = 200, color = colors.accent }) {
  const [w, onLayout] = useWidth();
  const items = data || [];
  const max = Math.max(1, ...items.map((d) => d.value || 0));
  const top = Math.max(2, Math.ceil(max / 2) * 2);
  const left = 30;
  const right = 6;
  const padTop = 20;
  const padBottom = 26;
  const plotH = height - padTop - padBottom;
  const plotW = Math.max(0, w - left - right);
  const slot = items.length ? plotW / items.length : 0;
  const barW = Math.min(44, slot * 0.58);
  const ticks = [0, top / 2, top];
  const y = (v) => padTop + plotH - (v / top) * plotH;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {ticks.map((t) => (
            <React.Fragment key={t}>
              <Line x1={left} x2={w - right} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} />
              <SvgText x={left - 6} y={y(t) + 4} fill={colors.muted} fontSize={11} textAnchor="end">{t}</SvgText>
            </React.Fragment>
          ))}
          {items.map((d, i) => {
            const cx = left + slot * i + slot / 2;
            const h = ((d.value || 0) / top) * plotH;
            return (
              <React.Fragment key={`${d.label}-${i}`}>
                <Rect x={cx - barW / 2} y={padTop + plotH - h} width={barW} height={Math.max(h, 0)} rx={4} fill={d.color || color} />
                <SvgText x={cx} y={y(d.value || 0) - 6} fill={colors.text} fontSize={12} fontWeight="700" textAnchor="middle">
                  {d.value || 0}
                </SvgText>
                <SvgText x={cx} y={height - 8} fill={colors.muted} fontSize={11} textAnchor="middle">{d.label}</SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

/** data: [{ label, value, color }] */
export function DonutChart({ data, size = 140, centerLabel = t('Total') }) {
  const items = data || [];
  const total = items.reduce((s, d) => s + (d.value || 0), 0);
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={styles.donutRow}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        {total > 0
          ? items.map((d) => {
              const len = ((d.value || 0) / total) * circ;
              const node = len > 0 ? (
                <Circle
                  key={d.label}
                  cx={c}
                  cy={c}
                  r={r}
                  stroke={d.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${c} ${c})`}
                />
              ) : null;
              offset += len;
              return node;
            })
          : null}
        <SvgText x={c} y={c + 2} fill={colors.text} fontSize={22} fontWeight="700" textAnchor="middle">{total}</SvgText>
        <SvgText x={c} y={c + 18} fill={colors.muted} fontSize={11} textAnchor="middle">{centerLabel}</SvgText>
      </Svg>
      <View style={styles.legend}>
        {items.map((d) => (
          <View key={d.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.legendValue}>
              {d.value || 0}
              {total > 0 ? <Text style={styles.legendPct}>{`  ${Math.round(((d.value || 0) / total) * 100)}%`}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  stateBox: { paddingVertical: 60 },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sectionSub: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  sectionBody: { padding: 16 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  field: { minWidth: 160, flexGrow: 1, flexBasis: 160, marginBottom: 12 },
  fieldValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  cell: { color: colors.text, fontSize: 13, lineHeight: 18 },
  cellMuted: { color: colors.muted },
  cellStrong: { fontWeight: '700' },
  cellSub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },

  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 },
  searchWrap: { flexGrow: 1, flexBasis: 240, maxWidth: 420 },
  searchInput: { marginBottom: 0 },
  toolbarRight: { marginLeft: 'auto', flexDirection: 'row', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 38, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, cursor: 'pointer',
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.textSoft, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  chipCount: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  chipCountActive: { backgroundColor: 'rgba(76,141,255,0.22)' },
  chipCountText: { color: colors.muted, fontSize: 11, fontWeight: '700' },

  table: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tableScroll: { flexGrow: 1 },
  thead: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { paddingHorizontal: 12, paddingVertical: 11 },
  thText: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  trLast: { borderBottomWidth: 0 },
  trHover: { backgroundColor: colors.cardAlt },
  td: { paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center' },
  cardList: { gap: 10 },
  rowCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  rowCardHead: { marginBottom: 2 },
  rowCardLine: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowCardLabel: { width: 96, color: colors.muted, fontSize: 12, paddingTop: 1 },
  rowCardValue: { flex: 1 },
  rowCardActions: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexGrow: 1, flexBasis: 180, minWidth: 150, backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '600', flex: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 30, fontWeight: '800', marginTop: 10 },
  statHint: { color: colors.muted, fontSize: 12, marginTop: 4 },

  donutRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  legend: { flex: 1, minWidth: 140, gap: 9 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { flex: 1, color: colors.textSoft, fontSize: 13 },
  legendValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  legendPct: { color: colors.muted, fontWeight: '500', fontSize: 12 },
});
