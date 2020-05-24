import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL, GET_ALL_PATIENT_URL, CREATE_PATIENT_URL, UPDATE_PATIENT_URL, DELETE_PATIENT_URL } from '../shared/constant';
import { Patient } from '../model/patient';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  constructor(private http: HttpClient) { }

  getData(): Observable<any> {
    return this.http.get<any>(`${API_URL}/${GET_ALL_PATIENT_URL}`);
  }

  getDataById(id: String): Observable<any> {
    return this.http.get<any>(`${API_URL}/${GET_ALL_PATIENT_URL}/${id}`);
  }

  saveData(patient: Patient): Observable<any> {
    return this.http.post(`${API_URL}/${CREATE_PATIENT_URL}`, patient, { responseType: 'text' as 'json' });
  }

  updateData(id: String, patient: Patient): Observable<any> {
    return this.http.put(`${API_URL}/${UPDATE_PATIENT_URL}/${id}`, patient);
  }

  deleteData(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${DELETE_PATIENT_URL}/${id}`);
  }
}