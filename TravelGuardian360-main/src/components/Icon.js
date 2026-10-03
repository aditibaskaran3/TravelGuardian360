import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import feather from 'feather-icons';

import { colors } from '../utils/constants';

const SHAPES = { path: Path, line: Line, circle: Circle, polyline: Polyline, polygon: Polygon, rect: Rect, ellipse: Ellipse };
const cache = {};

function parse(name) {
  if (cache[name]) return cache[name];
  const icon = feather.icons[name] || feather.icons.circle;
  const nodes = [];
  const re = /<(\w+)([^>]*?)(?:\/>|>\s*<\/\1>)/g;
  let match;
  while ((match = re.exec(icon.contents))) {
    const props = {};
    const attr = /([\w-]+)="([^"]*)"/g;
    let a;
    while ((a = attr.exec(match[2]))) props[a[1]] = a[2];
    if (SHAPES[match[1]]) nodes.push({ Shape: SHAPES[match[1]], props });
  }
  cache[name] = nodes;
  return nodes;
}

export default function Icon({ name, size = 20, color = colors.text, strokeWidth = 2, style }) {
  const nodes = useMemo(() => parse(name), [name]);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {nodes.map(({ Shape, props }, i) => (
        <Shape key={i} {...props} />
      ))}
    </Svg>
  );
}
