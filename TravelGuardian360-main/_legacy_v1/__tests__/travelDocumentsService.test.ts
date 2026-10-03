import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addTravelDocument,
  deleteTravelDocument,
} from '../src/features/settings/services/travelDocumentsService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('travel documents service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('stores a document record with its reference number', async () => {
    const document = await addTravelDocument({
      name: 'Wife Passport',
      ownerName: 'Wife',
      type: 'Passport',
      reference: 'P1234567',
    });

    expect(document.reference).toBe('P1234567');
    expect(document.name).toBe('Wife Passport');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('removes a document by id', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue([
      { id: 'a', name: 'Doc A', ownerName: 'Me', type: 'Visa', uploadedAt: 'x', status: 'Saved' },
      { id: 'b', name: 'Doc B', ownerName: 'Me', type: 'Visa', uploadedAt: 'x', status: 'Saved' },
    ]);

    const remaining = await deleteTravelDocument('a');

    expect(remaining.map((d) => d.id)).toEqual(['b']);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
