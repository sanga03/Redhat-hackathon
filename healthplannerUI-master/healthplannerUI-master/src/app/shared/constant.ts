export const API_URL = 'https://healthplanner-biplasar-in.osc-sbx-exp-ap-15768375-f72ef11f3ab089a8c677044eb28292cd-0001.us-east.containers.appdomain.cloud';
//export const API_URL = 'http://localhost:8080';

//export const GET_ALL_PATIENT_URL =  "user/get";
//export const CREATE_PATIENT_URL  =  "user/create";
//export const UPDATE_PATIENT_URL  =  "user/update" ;
//export const DELETE_PATIENT_URL  =  "user/delete";
export const GET_ALL_PATIENT_URL =  "healthplanner/get/patient";
export const CREATE_PATIENT_URL  =  "healthplanner/create/patient";
export const UPDATE_PATIENT_URL  =  "healthplanner/update/patient" ;
export const DELETE_PATIENT_URL  =  "healthplanner/delete/patient";

export const GENDER: Array<any> = [
    { option: "Male", value: "Male", checked: false },
    { option: "Female", value: "Female", checked: false }
];

export const MARITAL_STATUS: Array<any> = [
    { option: "Married", value: "Married", checked: false },
    { option: "Unmarried", value: "Unmarried", checked: false }
];

export const DISEASE_TYPE: Array<any> = [
    { name: "None", checked: false },
    { name: "Allergies", checked: false },
    { name: "Anemia", checked: false },
    { name: "Anxiety", checked: false },
    { name: "Arthritis", checked: false },
    { name: "Asthma", checked: false },
    { name: "Cancer - Type", checked: false },
    { name: "COPD (Emphysema)", checked: false },
    { name: "Diabetes", checked: false },
    { name: "Liver Disease", checked: false },
    { name: "Osteoarthritis", checked: false },
    { name: "Osteoporosis", checked: false },
    { name: "Thyroid Disease", checked: false }
];

export const YES_NO: Array<any> = [
    { option: "Yes", value: "Yes", checked: false },
    { option: "No", value: "No", checked: false }
];

export const EXCERCISE_TYPE: Array<any> = [
    { option: "Moderate", value: "Moderate", checked: false },
    { option: "Vigorous", value: "Vigorous", checked: false },
    { option: "Sedentary", value: "Sedentary", checked: false }
];

export const USAGE_TYPE: Array<any> = [
    { option: "No", value: "No", checked: false },
    { option: "Daily", value: "Daily", checked: false },
    { option: "Weekly", value: "Weekly", checked: false },
    { option: "Less", value: "Less", checked: false },
    { option: "Former User", value: "Former User", checked: false }
];

export const ALERGIC_TYPE: Array<any> = [
    { name: "Food", checked: false },
    { name: "Pollen", checked: false },
    { name: "Animals", checked: false },
    { name: "Medication", checked: false }
];

export const DIET_TYPE: Array<any> = [
    { option: "Veg", value: "Veg", checked: false },
    { option: "Non-Veg", value: "Non-Veg", checked: false },
    { option: "Vegan", value: "Vegan", checked: false }
];