import { useAdminStore } from '../src/features/admin/store/adminStore';

describe('admin store', () => {
  beforeEach(() => {
    useAdminStore.setState({ tourists: useAdminStore.getState().tourists.slice() });
  });

  it('updates a tourist status and notes', () => {
    const tourist = useAdminStore.getState().tourists[0];

    useAdminStore.getState().updateTouristStatus(tourist.id, 'flagged');
    useAdminStore.getState().updateTouristNotes(tourist.id, 'Needs follow-up');

    const updated = useAdminStore.getState().tourists.find((item) => item.id === tourist.id);

    expect(updated?.status).toBe('flagged');
    expect(updated?.notes).toBe('Needs follow-up');
  });
});
