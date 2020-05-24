import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Location, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from 'src/app/services/patient.service';
import { Patient } from 'src/app/model/patient';
import { GENDER, MARITAL_STATUS, DISEASE_TYPE, EXCERCISE_TYPE, USAGE_TYPE, YES_NO, ALERGIC_TYPE, DIET_TYPE } from '../../shared/constant';

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.css']
})
export class PatientDetailsComponent implements OnInit {

  constructor(
    private activeRoute: ActivatedRoute,
    private service: PatientService,
    private location: Location,
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe) {
  }

  patient: Patient;
  public registerForm: FormGroup;
  public genders = GENDER;
  public marital_status = MARITAL_STATUS;
  public disease_type = DISEASE_TYPE;
  public excercise_type = EXCERCISE_TYPE;
  public tobaco_use_type = USAGE_TYPE;
  public alchohol_use_type = USAGE_TYPE;
  public caffine_use_type = USAGE_TYPE;
  public alergy_yes_no = YES_NO
  public alergy_type = ALERGIC_TYPE;
  public diet_type = DIET_TYPE;
  public suffering = false;

  ngOnInit() {

    this.registerForm = new FormGroup({
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      line1: new FormControl(''),
      line2: new FormControl(''),
      city: new FormControl(''),
      state: new FormControl(''),
      zip: new FormControl(''),
      gender: new FormControl(''),
      dateOfBirth: new FormControl(''),
      mailId: new FormControl(''),
      phone: new FormControl(''),
      maritalStatus: new FormControl(''),
      activity: new FormControl(''),
      tobacoUse: new FormControl(''),
      alchoholUse: new FormControl(''),
      caffineUse: new FormControl(''),
      allergies: new FormControl(''),
      diet: new FormControl(''),
      height: new FormControl(''),
      weight: new FormControl(''),
      bmi: new FormControl('')
    });
    this.registerForm.disable();

    let id: string = this.activeRoute.snapshot.params['id'];
    this.service.getDataById(id).subscribe(
      response => {
        console.log(JSON.stringify(response));
        this.patient = response;
        this.registerForm = new FormGroup({
          firstName: new FormControl(this.patient.patientName.firstName),
          lastName: new FormControl(this.patient.patientName.lastName),
          line1: new FormControl(this.patient.postalAddress.line1),
          line2: new FormControl(this.patient.postalAddress.line2),
          city: new FormControl(this.patient.postalAddress.city),
          state: new FormControl(this.patient.postalAddress.state),
          zip: new FormControl(this.patient.postalAddress.zip),
          gender: new FormControl(this.patient.gender),
          dateOfBirth: new FormControl(this.datePipe.transform(this.patient.dateOfBirth, 'dd-MM-yyyy')),
          mailId: new FormControl(this.patient.mailId),
          phone: new FormControl(this.patient.phone),
          maritalStatus: new FormControl(this.patient.maritalStatus),
          activity: new FormControl(this.patient.activity),
          tobacoUse: new FormControl(this.patient.tobacoUse),
          alchoholUse: new FormControl(this.patient.alchoholUse),
          caffineUse: new FormControl(this.patient.caffineUse),
          allergies: new FormControl(this.patient.allergies),
          diet: new FormControl(this.patient.diet),
          height: new FormControl(this.patient.height),
          weight: new FormControl(this.patient.weight),
          bmi: new FormControl(this.decimalPipe.transform(this.patient.bmi, '1.2-2'))
        });
        this.registerForm.disable();
        if (this.patient.allergies == "Yes")
          this.suffering = true;
        for (var i = 0; i < this.disease_type.length && this.patient.medHistory != undefined; i++) {
          if (this.patient.medHistory.indexOf(this.disease_type[i].name) != -1) {
            this.disease_type[i].checked = true;
          }
        }
        for (var i = 0; i < this.alergy_type.length && this.patient.allergicFrom != undefined; i++) {
          if (this.patient.allergicFrom.indexOf(this.alergy_type[i].name) != -1) {
            this.alergy_type[i].checked = true;
          }
        }
      },
      error => {
      }
    );
  }

  onCancel() {
    this.location.back();
  }

}
