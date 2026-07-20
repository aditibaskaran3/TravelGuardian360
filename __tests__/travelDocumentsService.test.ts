import AsyncStorage from '@react-native-async-storage/async-storage';

import { addTravelDocument } from '../src/features/settings/services/travelDocumentsService';

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

  it('stores a photo with the uploaded document entry', async () => {
    const document = await addTravelDocument({
      name: 'Wife Passport',
      ownerName: 'Wife',
      type: 'Passport',
      photoUri: 'file:///tmp/passport.jpg',
    });

    expect(document.photoUri).toBe('file:///tmp/passport.jpg');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
