import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material';
import { PatientService } from 'src/app/services/patient.service';
import { Patient } from 'src/app/model/patient';
import { PatientName } from 'src/app/model/patient_name';
import { PostalAddress } from 'src/app/model/postal_address';
import { GENDER, MARITAL_STATUS, DISEASE_TYPE, EXCERCISE_TYPE, USAGE_TYPE, YES_NO, ALERGIC_TYPE, DIET_TYPE } from '../../shared/constant';
import { MessageBox, MessageBoxButton } from 'src/app/shared/message-box';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-create',
  templateUrl: './patient-create.component.html',
  styleUrls: ['./patient-create.component.css']
})
export class PatientCreateComponent implements OnInit {

  tomorrow = new Date(); 
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

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private service: PatientService,
    private location: Location
  ) { }

  ngOnInit() {

    this.registerForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      lastName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      line1: new FormControl('', [Validators.required, Validators.maxLength(150)]),
      line2: new FormControl('', [Validators.maxLength(150)]),
      city: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      state: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      zip: new FormControl('', [Validators.required, Validators.maxLength(6), Validators.pattern("[0-9]{6}")]),
      gender: new FormControl('', [Validators.required]),
      dateOfBirth: new FormControl('', [Validators.required]),
      mailId: new FormControl('', [Validators.required, Validators.maxLength(50), Validators.email]),
      phone: new FormControl('', [Validators.required, Validators.maxLength(10), Validators.pattern("[0-9]{10}")]),
      maritalStatus: new FormControl('', [Validators.required]),
      activity: new FormControl('', [Validators.required]),
      tobacoUse: new FormControl('', [Validators.required]),
      alchoholUse: new FormControl('', [Validators.required]),
      caffineUse: new FormControl('', [Validators.required]),
      allergies: new FormControl('', [Validators.required]),
      diet: new FormControl('', [Validators.required]),
      height: new FormControl('', [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')]),
      weight: new FormControl('', [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')])
    });

  }

  public hasError(controlName: string, errorName: string) {
    return this.registerForm.controls[controlName].hasError(errorName);
  }

  public register(registerFormValue) {
    if (this.registerForm.valid) {
      var patient = new Patient;
      var patientName = new PatientName;
      patientName.firstName = registerFormValue.firstName;
      patientName.lastName = registerFormValue.lastName;
      patient.patientName = patientName;
      var postalAddress = new PostalAddress;
      postalAddress.line1 = registerFormValue.line1;
      postalAddress.line2 = registerFormValue.line2;
      postalAddress.city = registerFormValue.city;
      postalAddress.state = registerFormValue.state;
      postalAddress.zip = registerFormValue.zip;
      patient.postalAddress = postalAddress;
      patient.gender = registerFormValue.gender;
      patient.dateOfBirth = registerFormValue.dateOfBirth;
      patient.mailId = registerFormValue.mailId;
      patient.phone = registerFormValue.phone;
      patient.maritalStatus = registerFormValue.maritalStatus;
      patient.medHistory = [];
      for (var i = 0; i < this.disease_type.length; i++) {
        if (this.disease_type[i].checked)
          patient.medHistory.push(this.disease_type[i].name);
      }
      patient.activity = registerFormValue.activity;
      patient.tobacoUse = registerFormValue.tobacoUse;
      patient.alchoholUse = registerFormValue.alchoholUse;
      patient.caffineUse = registerFormValue.caffineUse;
      patient.allergies = registerFormValue.allergies;
      patient.allergicFrom = [];
      for (var i = 0; i < this.alergy_type.length; i++) {
        if (this.alergy_type[i].checked)
          patient.allergicFrom.push(this.alergy_type[i].name);
      }
      patient.diet = registerFormValue.diet;
      patient.height = registerFormValue.height;
      patient.weight = registerFormValue.weight;

      this.service.saveData(patient).subscribe(
        response => {
          MessageBox.show(this.dialog, "Alert", 'Successfully added the reord', MessageBoxButton.Ok, "350px")
            .subscribe(result => {
              let url: string = `/home`;
              this.router.navigate([url]);
            });
        },
        error => {
        }
      );
    } else
      MessageBox.show(this.dialog, "Error", 'Some Input data are invalid', MessageBoxButton.Ok, "350px");
  }

  onCancel() {
    this.location.back();
  }

  onChange1(event) {
    for (var i = 0; i < this.disease_type.length; i++) {
      if (this.disease_type[i].name == event.source.value) {
        if (event.checked)
          this.disease_type[i].checked = true;
        else
          this.disease_type[i].checked = false;
        break;
      }
    }
  }

  onChange2(event) {
    for (var i = 0; i < this.alergy_type.length; i++) {
      if (this.alergy_type[i].name == event.source.value) {
        if (event.checked)
          this.alergy_type[i].checked = true;
        else
          this.alergy_type[i].checked = false;
        break;
      }
    }
  }

  showAlergyList(event) {
    if (event.value == "Yes")
      this.suffering = true;
    else
      this.suffering = false;
  }

}
