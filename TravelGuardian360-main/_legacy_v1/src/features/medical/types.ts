export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export type MedicalID = {
  bloodGroup: BloodGroup | null;
  allergies: string[];
  medicalConditions: string[];
  medications: string[];
  updatedAt: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  bloodGroup: BloodGroup | null;
  allergies: string[];
  medicalConditions: string[];
  medications: string[];
  createdAt: string;
  updatedAt: string;
};
