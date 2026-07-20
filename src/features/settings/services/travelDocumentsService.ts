import { storage, StorageKeys } from '../../../services/storage';

export type TravelDocument = {
  id: string;
  name: string;
  ownerName: string;
  type: string;
  photoUri?: string;
  uploadedAt: string;
  status: string;
};

export async function getTravelDocuments(): Promise<TravelDocument[]> {
  const documents = await storage.getItem<TravelDocument[]>(StorageKeys.travelDocuments);
  return documents ?? [];
}

export async function addTravelDocument(input: Omit<TravelDocument, 'id' | 'uploadedAt' | 'status'> & { status?: string }): Promise<TravelDocument> {
  const existing = await getTravelDocuments();
  const document: TravelDocument = {
    id: `${Date.now()}`,
    name: input.name.trim(),
    ownerName: input.ownerName.trim(),
    type: input.type.trim(),
    photoUri: input.photoUri,
    uploadedAt: new Date().toISOString(),
    status: input.status ?? 'Uploaded • pending verification',
  };

  const nextDocuments = [document, ...existing];
  await storage.setItem(StorageKeys.travelDocuments, nextDocuments);
  return document;
}
