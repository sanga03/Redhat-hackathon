import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common';
import { PatientService } from 'src/app/services/patient.service';
import { Patient } from 'src/app/model/patient';
import { PatientName } from 'src/app/model/patient_name';
import { PostalAddress } from 'src/app/model/postal_address';
import { GENDER, MARITAL_STATUS, DISEASE_TYPE, EXCERCISE_TYPE, USAGE_TYPE, YES_NO, ALERGIC_TYPE, DIET_TYPE } from '../../shared/constant';
import { MessageBox, MessageBoxButton } from 'src/app/shared/message-box';
import * as moment from 'moment';

@Component({
  selector: 'app-patient-update',
  templateUrl: './patient-update.component.html',
  styleUrls: ['./patient-update.component.css']
})
export class PatientUpdateComponent implements OnInit {

  tomorrow = new Date(); 
  public patientId: String;
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

  constructor(
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    private service: PatientService,
    private location: Location
  ) { }

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
      weight: new FormControl('')
    });

    let id: string = this.activeRoute.snapshot.params['id'];
    this.patientId = id;
    this.service.getDataById(id).subscribe(
      response => {
        this.patient = response;
        this.registerForm = new FormGroup({
          firstName: new FormControl(this.patient.patientName.firstName, [Validators.required, Validators.maxLength(50)]),
          lastName: new FormControl(this.patient.patientName.lastName, [Validators.required, Validators.maxLength(50)]),
          line1: new FormControl(this.patient.postalAddress.line1, [Validators.required, Validators.maxLength(150)]),
          line2: new FormControl(this.patient.postalAddress.line2, [Validators.maxLength(150)]),
          city: new FormControl(this.patient.postalAddress.city, [Validators.required, Validators.maxLength(50)]),
          state: new FormControl(this.patient.postalAddress.state, [Validators.required, Validators.maxLength(50)]),
          zip: new FormControl(this.patient.postalAddress.zip, [Validators.required, Validators.maxLength(6), Validators.pattern("[0-9]{6}")]),
          gender: new FormControl(this.patient.gender, [Validators.required]),
          dateOfBirth: new FormControl(moment(this.patient.dateOfBirth).toDate(), [Validators.required]),
          mailId: new FormControl(this.patient.mailId, [Validators.required, Validators.maxLength(50), Validators.email]),
          phone: new FormControl(this.patient.phone, [Validators.required, Validators.maxLength(10), Validators.pattern("[0-9]{10}")]),
          maritalStatus: new FormControl(this.patient.maritalStatus, [Validators.required]),
          activity: new FormControl(this.patient.activity, [Validators.required]),
          tobacoUse: new FormControl(this.patient.tobacoUse, [Validators.required]),
          alchoholUse: new FormControl(this.patient.alchoholUse, [Validators.required]),
          caffineUse: new FormControl(this.patient.caffineUse, [Validators.required]),
          allergies: new FormControl(this.patient.allergies, [Validators.required]),
          diet: new FormControl(this.patient.diet, [Validators.required]),
          height: new FormControl(this.patient.height, [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')]),
          weight: new FormControl(this.patient.weight, [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')])
        });
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

  public hasError(controlName: string, errorName: string) {
    return this.registerForm.controls[controlName].hasError(errorName);
  }

  public register(registerFormValue) {
    if (this.registerForm.valid) {
      var patient = new Patient;
      patient.id = this.patientId;
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
      if (this.suffering) {
        for (var i = 0; i < this.alergy_type.length; i++) {
          if (this.alergy_type[i].checked)
            patient.allergicFrom.push(this.alergy_type[i].name);
        }
      }
      patient.diet = registerFormValue.diet;
      patient.height = registerFormValue.height;
      patient.weight = registerFormValue.weight;

      this.service.updateData(this.patientId, patient).subscribe(
        response => {
          MessageBox.show(this.dialog, "Alert", 'Successfully updated the reord ' + this.patientId, MessageBoxButton.Ok, "350px");
        },
        error => {
        }
      );
    } else
      MessageBox.show(this.dialog, "Error", 'Some Input data are invalid', MessageBoxButton.Ok, "350px");
  }

  onChange(event) {
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
