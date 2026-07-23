export type Itinerary = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  emergencyContactIds: string[];
  createdAt: string;
  notes?: string;
};
