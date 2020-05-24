import { PatientName } from './patient_name';
import { PostalAddress } from './postal_address';

export class Patient {

    id: String;
    patientName: PatientName;
    postalAddress: PostalAddress;
    dateOfBirth: Date;
    gender: String;
    mailId: String;
    phone: String;
    maritalStatus: String;
    medHistory: String[];
    activity: String;
    tobacoUse: String;
    alchoholUse: String;
    caffineUse: String;
    allergies: String;
    allergicFrom: String[];
    diet: String;
    height: number;
    weight: number;
    bmi: number;
}
