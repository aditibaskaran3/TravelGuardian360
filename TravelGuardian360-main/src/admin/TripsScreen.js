import { t } from '../i18n';
import React, { useState } from 'react';
import { View } from 'react-native';

import StatusBadge from '../components/StatusBadge';
import { useApi } from '../hooks/useApi';
import { adminApi } from '../services/adminService';
import { formatDate, timeAgo } from '../utils/format';
import AdminLayout from './components/AdminLayout';
import { AsyncBody, Cell, CellSub, DataTable, PageToolbar, useDebounced } from './components/ui';

const TABS = [
  { value: undefined, label: t('All') },
  { value: 'active', label: t('Active') },
  { value: 'upcoming', label: t('Upcoming') },
  { value: 'completed', label: t('Completed') },
];

export default function TripsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(undefined);
  const q = useDebounced(search.trim(), 300);
  const { data, loading, error, reload } = useApi(() => adminApi.trips({ q: q || undefined, status }), [q, status]);

  const columns = [
    {
      key: 'tourist', title: t('Tourist'), flex: 1.4,
      render: (row) => (
        <View>
          <Cell strong>{row.tourist_name}</Cell>
          <CellSub>{row.tourist_email}</CellSub>
        </View>
      ),
    },
    { key: 'destination', title: t('Destination'), flex: 1.2, render: (row) => <Cell>{row.destination}</Cell> },
    { key: 'start', title: t('Start'), width: 110, render: (row) => <Cell>{formatDate(row.start_date)}</Cell> },
    { key: 'end', title: t('End'), width: 110, render: (row) => <Cell>{formatDate(row.end_date)}</Cell> },
    { key: 'status', title: t('Status'), width: 130, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'location', title: t('Current location'), flex: 1.4,
      render: (row) =>
        row.status === 'active' && row.current_location ? (
          <View>
            <Cell>{row.current_location.label || t('Unnamed location')}</Cell>
            <CellSub>{`${timeAgo(row.current_location.recorded_at)} - ${row.current_location.status}`}</CellSub>
          </View>
        ) : null,
    },
  ];

  return (
    <AdminLayout title={t('Trips')} subtitle={t('Every trip planned by tourists, with the live position of active trips.')}>
      <PageToolbar
        search={search}
        onSearch={setSearch}
        placeholder={t('Search tourist or destination')}
        chips={TABS}
        chipValue={status}
        onChip={setStatus}
      />
      <AsyncBody data={data} loading={loading} error={error} onRetry={reload}>
        <DataTable
          columns={columns}
          rows={data || []}
          empty={{
            title: q || status ? t('No trips match your filters') : t('No trips yet'),
            message: q || status ? t('Try a different search or status.') : t('Trips appear here when tourists plan them.'),
          }}
        />
      </AsyncBody>
    </AdminLayout>
  );
}
