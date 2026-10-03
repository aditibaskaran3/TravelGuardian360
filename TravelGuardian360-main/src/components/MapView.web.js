import { t } from '../i18n';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import L from 'leaflet';

import { colors, isLight, radius } from '../utils/constants';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function markerIcon(marker) {
  const color = marker.color || colors.accent;
  const size = marker.self ? 18 : 14;
  const pulse = marker.self ? 'tg-pulse' : marker.pulse ? 'tg-pulse-red' : '';
  const html = `<div class="${pulse}" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>`;
  return L.divIcon({ html, className: '', iconSize: [size + 6, size + 6], iconAnchor: [(size + 6) / 2, (size + 6) / 2] });
}

function popupNode(marker) {
  const el = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = marker.title || '';
  el.appendChild(title);
  if (marker.subtitle) {
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:12px;opacity:.75;margin-top:2px';
    sub.textContent = marker.subtitle;
    el.appendChild(sub);
  }
  return el;
}

/**
 * Interactive map (Leaflet + OpenStreetMap data).
 * markers: [{ id, latitude, longitude, color, title, subtitle, self, pulse }]
 * zones:   [{ id, latitude, longitude, radius_m, color }]
 */
export default function MapView({
  center, zoom = 15, markers = [], zones = [], height = 240, style, interactive = true,
  onMarkerPress, fitMarkers = false, selectedId,
}) {
  const node = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const handler = useRef(onMarkerPress);
  handler.current = onMarkerPress;
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const el = node.current;
    if (!el || map.current) return undefined;
    if (!isLight) el.classList.add('tg-dark-map');
    const instance = L.map(el, {
      center: center ? [center.latitude, center.longitude] : [20.5937, 78.9629],
      zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      attributionControl: true,
    });
    const tiles = L.tileLayer(TILES, { attribution: ATTRIBUTION, subdomains: 'abc', maxZoom: 19 }).addTo(instance);
    let failures = 0;
    tiles.on('tileerror', () => {
      failures += 1;
      if (failures > 3) setTileError(true);
    });
    tiles.on('tileload', () => setTileError(false));
    layer.current = L.layerGroup().addTo(instance);
    map.current = instance;
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(el);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !layer.current) return;
    layer.current.clearLayers();
    zones.forEach((z) => {
      L.circle([z.latitude, z.longitude], {
        radius: z.radius_m, color: z.color, weight: 1, fillColor: z.color, fillOpacity: 0.12,
      }).addTo(layer.current);
    });
    markers.forEach((m) => {
      const mk = L.marker([m.latitude, m.longitude], { icon: markerIcon(m), zIndexOffset: m.self ? 1000 : 0 }).addTo(layer.current);
      if (m.title) mk.bindPopup(popupNode(m));
      mk.on('click', () => handler.current && handler.current(m));
      if (m.id !== undefined && m.id === selectedId && m.title) mk.openPopup();
    });
    if (fitMarkers && markers.length > 1) {
      instance.fitBounds(L.latLngBounds(markers.map((m) => [m.latitude, m.longitude])), { padding: [36, 36], maxZoom: 14 });
    }
  }, [markers, zones, fitMarkers, selectedId]);

  const centerLat = center && center.latitude;
  const centerLon = center && center.longitude;
  useEffect(() => {
    if (map.current && centerLat != null && !fitMarkers) map.current.setView([centerLat, centerLon], map.current.getZoom() || zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLon]);

  return (
    <View style={[styles.wrap, { height }, style]}>
      <View ref={node} style={StyleSheet.absoluteFill} />
      {tileError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{t('Map imagery could not be loaded. Check your connection.')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.mapBg, borderWidth: 1, borderColor: colors.border },
  notice: { position: 'absolute', left: 10, right: 10, bottom: 26, backgroundColor: colors.tabBar, borderRadius: 10, padding: 8, zIndex: 1000 },
  noticeText: { color: colors.caution, fontSize: 12, textAlign: 'center' },
});
