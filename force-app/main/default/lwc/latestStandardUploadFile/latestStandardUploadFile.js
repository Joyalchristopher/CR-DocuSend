import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import TICKICON from '@salesforce/resourceUrl/RE_TickIcon';
import PNG_IMAGE from '@salesforce/resourceUrl/PngImage';
import DOCX_IMAGE from '@salesforce/resourceUrl/DocxImage';
import DOC_IMAGE from '@salesforce/resourceUrl/DocImage';
import PDF_IMAGE from '@salesforce/resourceUrl/PdfImage';
import BMP_IMAGE from '@salesforce/resourceUrl/BmpImage';
import Xlsx_IMAGE from '@salesforce/resourceUrl/XlsxImage';
import XLS_IMAGE from '@salesforce/resourceUrl/XlsImage';
import TXT_IMAGE from '@salesforce/resourceUrl/TxtImage';
import JPEG_IMAGE from '@salesforce/resourceUrl/JpegImage';
import JPG_IMAGE from '@salesforce/resourceUrl/JpgImage';
import TIFF_IMAGE from '@salesforce/resourceUrl/TiffImage';
import TIF_IMAGE from '@salesforce/resourceUrl/TifImage';
import GIF_IMAGE from '@salesforce/resourceUrl/GifImage';
import LOCK_IMAGE from '@salesforce/resourceUrl/LockIcon';
import LIBTA from '@salesforce/resourceUrl/libtayoImg';
import WARNING_IMAGE from '@salesforce/resourceUrl/WarningIcon';
import THANKYOUICON from '@salesforce/resourceUrl/ThankYouIcon'
import QuestionImage from '@salesforce/resourceUrl/qusimg';
import RESOURCE_NAME from '@salesforce/resourceUrl/waricon';
import pageUrlV3 from '@salesforce/resourceUrl/reCAPTCHAv31';

import UPLOAD_FILE_STANDARD from '@salesforce/apex/AwsStandardFile.uploadDocuments'
import CREATE_RECORD from '@salesforce/apex/FormController.createRecord';
import UPDATE_FIELD_RECORD from '@salesforce/apex/AwsFileUploadController.updateFieldInAnotherRecord';
import CARE_PROGRAM_RECORDS from '@salesforce/apex/FormController.getCarePrograms';
import ISRECAPTCHAVALID from '@salesforce/apex/reCAPTCHAv3ServerController.isReCAPTCHAValid';

export default class LatestStandardUploadFile extends NavigationMixin(LightningElement) {
	@track careProgramOptions = [];
	value = '';
	@track errormsg = false;
	@track uploadTemp = false;
	@track careSelection = true;
	@track submiterDetails = false;
	@track submitterType = '';
	@track patientFullName = '';
	@track patientDateOfBirth = '';
	@track submitterFullName = '';
	@track submitterEmail = '';
	@track fullNameErrorMessageValid = false;
	@track fullNameErrorMessage = false;
	@track SubNameErrorMessageValid = false;
	@track SubNameErrorMessage = false;
	@track EmailErrorMessageValid = false;
	@track EmailErrorMessage = false;
	@track DobErrorMessage = false;
	@track DobErrorMessageValid = false;
	@track NoPatient = true;
	@track PatientYes = false;
	@track isButtonDisabled = true;
	@track thankYouForm = false;
	@track boterror = false;
	@track brandImage = ''
	@track brandLogo = false;
	@track formToken;
	@track validReCAPTCHA = false;
	@track humanScore = 0; // Initialize human score
	@track navigateToV3 = pageUrlV3;
	@track errorClass = ''
	@track currentStep = '1';
	@track fileEntries = [];
	@track uploadedfile = []
	@track prepopulated = false;
	@track uploadRecordId = [];
	@track HeadingNotes = true;
	acceptedFormats = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.gif', 'docx', '.doc', '.bmp', '.xlsx', '.xls', '.tiff', '.tif']; // Accepted file formats
	tickIcon = TICKICON;
	Questimg = QuestionImage;
	lockIcon = LOCK_IMAGE;
	warning = WARNING_IMAGE
	pngImage = PNG_IMAGE;
	docxImage = DOCX_IMAGE
	docImage = DOC_IMAGE;
	pdfImage = PDF_IMAGE;
	bmpImage = BMP_IMAGE;
	xlsxImage = Xlsx_IMAGE;
	xlsImage = XLS_IMAGE;
	txtImage = TXT_IMAGE;
	jpegImage = JPEG_IMAGE;
	jpgImage = JPG_IMAGE;
	tiffImage = TIFF_IMAGE;
	tifImage = TIF_IMAGE;
	gifImage = GIF_IMAGE;
	thankYou = THANKYOUICON;
	captchaWindow = null;
	name = '';

	img = RESOURCE_NAME;
	picklistOptions = [{ label: 'Patient', value: 'Patient' },
	{ label: 'Caregiver', value: 'Caregiver' },
	{ label: 'Healthcare Provider', value: 'Healthcare Provider' }
	]






	@wire(CARE_PROGRAM_RECORDS)
	wiredCarePrograms({ error, data }) {
		try {
			if (data) {
				this.careProgramOptions = data.map(program => ({ label: program.Name, value: program.Name }));
			} else if (error) {
				console.error(error);
			}
		}
		catch (err) {
			this.showToast('Error', err.body.message, 'error');
		}

	}

	handleInputChange(event) {
		const field = event.target.name;
		if (field === 'submitterType') {
			this.submitterType = event.target.value;
			if (this.submitterType === 'Patient') {
				this.PatientYes = true;
				this.NoPatient = false;
			} else {
				this.PatientYes = false;
				this.NoPatient = true;
			}
		} else if (field === 'patientFullName') {
			this.patientFullName = event.target.value;
			if (this.patientFullName === '') {
				this.fullNameErrorMessage = true;
				this.fullNameErrorMessageValid = false;
			} else {
				const regexName = /^[a-zA-Z]+$/u;
				if (!regexName.test(this.patientFullName)) {
					this.fullNameErrorMessageValid = true;
					this.fullNameErrorMessage = false;
				} else {
					this.fullNameErrorMessageValid = false;
					this.fullNameErrorMessage = false;
					this.errorClass = '';
				}
			}
		} else if (field === 'patientDateOfBirth') {
			this.patientDateOfBirth = event.target.value;
			const currentDate = new Date();
			const selectedDateObj = new Date(this.patientDateOfBirth);
			if (this.patientDateOfBirth === '') {
				this.DobErrorMessage = true;
				this.DobErrorMessageValid = false;
			} else {
				if (selectedDateObj > currentDate) {
					this.DobErrorMessage = false;
					this.DobErrorMessageValid = true;
				} else {
					this.DobErrorMessage = false;
					this.DobErrorMessageValid = false;
					this.errorClass = '';
				}
			}
		} else if (field === 'submitterFullName') {
			this.submitterFullName = event.target.value;
			if (this.submitterFullName === '') {
				this.SubNameErrorMessage = true;
				this.SubNameErrorMessageValid = false;
			} else {
				const regexName = /^[a-zA-Z]+$/u;
				if (!regexName.test(this.submitterFullName)) {
					this.SubNameErrorMessageValid = true;
					this.SubNameErrorMessage = false;
				} else {
					this.SubNameErrorMessageValid = false;
					this.SubNameErrorMessage = false;
					this.errorClass = '';
				}
			}
		} else if (field === 'submitterEmail') {
			this.submitterEmail = event.target.value;
			if (this.submitterEmail === '') {
				this.EmailErrorMessage = true;
				this.EmailErrorMessageValid = false;
			} else {
				const emailRegex = /^[^ @]+@[^ @]+\.[^ @]+$/u;


				if (!emailRegex.test(this.submitterEmail)) {
					this.EmailErrorMessageValid = true;
					this.EmailErrorMessage = false;
				} else {
					this.EmailErrorMessageValid = false;
					this.EmailErrorMessage = false;
					this.errorClass = '';
				}
			}
		}

		// Check if all fields are valid
		this.checkAllFieldsValid();
	}

	checkAllFieldsValid() {
		const commonValidations =
			this.submitterType &&
			this.patientFullName &&
			this.patientDateOfBirth &&
			this.submitterEmail &&
			!this.fullNameErrorMessage &&
			!this.fullNameErrorMessageValid &&
			!this.DobErrorMessage &&
			!this.DobErrorMessageValid &&
			!this.SubNameErrorMessage &&
			!this.SubNameErrorMessageValid &&
			!this.EmailErrorMessage &&
			!this.EmailErrorMessageValid;

		if (this.PatientYes === true) {
			this.isButtonDisabled = !commonValidations;
		} else {
			const additionalValidation = this.submitterFullName;
			this.isButtonDisabled = !(commonValidations && additionalValidation);
		}
	}






	handleChange(event) {
		this.value = event.detail.value;

		this.brandLogo = true;
		switch (this.value) {
			case 'LIBTAYO Surround':
				this.brandImage = LIBTA;
				break;
			case 'Linvoseltamab':
				this.brandImage = '';
				break;
			case 'option3':
				this.message = 'You selected Option 3';
				break;
			default:
				this.message = 'Unknown option selected';
		}
	}

	connectedCallback() {
		if (typeof window !== 'undefined') {
			this.messageHandler = this.handleMessage.bind(this);
			window.addEventListener?.('message', this.messageHandler);
		}
	}

	disconnectedCallback() {
		if (typeof window !== 'undefined') {
			window.removeEventListener?.('message', this.messageHandler);
		}
	}

	handleMessage(e) {
		if (e.data.action === "getCAPCAH" && e.data.callCAPTCHAResponse === "NOK") {
			console.log("Token not obtained!");
		} else if (e.data.action === "getCAPCAH") {
			this.formToken = e.data.callCAPTCHAResponse;
			ISRECAPTCHAVALID({ tokenFromClient: this.formToken })
				.then(data => {
					if (data && data.success) {
						this.validReCAPTCHA = true;
						this.humanScore = data.score; // Assign human score from response
						console.log('Human score:', this.humanScore);
						if (this.humanScore < 0.5) {

							this.boterror = true;
						}
					} else {
						this.validReCAPTCHA = false;

					}
				})
				.catch(error => {
					console.error('Error validating reCAPTCHA:', error);
				});
		}
	}




	conclick() {
		if (this.value === '') {
			this.errormsg = true;
			return;
		}
		this.careSelection = false;
		this.submiterDetails = true;
		this.currentStep = '2';

	}
	handleBackButtonClick() {
		this.careSelection = true;
		this.submiterDetails = false;
		this.currentStep = '1';
	}
	handleForm() {
		if (this.humanScore < 0.5) {
			return;
		}
		if (this.submitterType === '') {

			if (this.submitterEmail === '') {
				this.EmailErrorMessage = true;
				this.errorClass = 'inputError';
			}
			if (this.patientFullName === '') {
				this.fullNameErrorMessage = true;
				this.errorClass = 'inputError';
			}

			if (this.submitterFullName === '') {
				this.SubNameErrorMessage = true;
				this.errorClass = 'inputError';
			}
			if (this.patientDateOfBirth === '') {
				this.DobErrorMessage = true;
				this.errorClass = 'inputError'
			}
		} else {
			this.EmailErrorMessage = false;
			this.fullNameErrorMessage = false;
			this.EmailErrorMessage = false;
			this.SubNameErrorMessage = false;
			if (this.submitterType === 'Patient') {
				if (this.submitterEmail === '') {
					this.EmailErrorMessage = true;
					this.errorClass = 'inputError';
				}
				if (this.patientFullName === '') {
					this.fullNameErrorMessage = true;
					this.errorClass = 'inputError';
				}
				if (this.patientDateOfBirth === '') {
					this.DobErrorMessage = true;
					this.errorClass = 'inputError';
				}
			}
			else {
				if (this.submitterEmail === '') {
					this.EmailErrorMessage = true;
					this.errorClass = 'inputError';
				}
				if (this.patientFullName === '') {
					this.fullNameErrorMessage = true;
					this.errorClass = 'inputError';
				}
				if (this.submitterFullName === '') {
					this.SubNameErrorMessage = true;
					this.errorClass = 'inputError';
				}
				if (this.patientDateOfBirth === '') {
					this.DobErrorMessage = true;
					this.errorClass = 'inputError';
				}
			}
		}


		if (this.EmailErrorMessage === true || this.DobErrorMessage === true || this.SubNameErrorMessage === true || this.fullNameErrorMessage === true) {
			return;
		}



		this.submiterDetails = false;
		this.uploadTemp = true;
		this.currentStep = '3';



	}
	handleBackButton() {
		this.submiterDetails = true;
		this.uploadTemp = false;
		this.currentStep = '2';
	}

	handleFormSubmit() {
		if (this.humanScore < 0.5) {
			return;
		}

		if (this.submitterType === 'Patient') {
			this.handlePatientSubmit();
		} else {
			this.handleOtherSubmit();
		}
	}

	handlePatientSubmit() {
		console.log('qwerttyuuioopp[p', this.patientFullName);

		if (this.areCommonFieldsValid() && this.patientSpecificFieldsValid()) {
			this.createRecord();
		}
	}

	handleOtherSubmit() {
		if (this.areCommonFieldsValid() && this.otherSpecificFieldsValid()) {
			this.createRecord();
		}
	}

	areCommonFieldsValid() {
		return this.submitterEmail !== null &&
			this.patientDateOfBirth !== '' &&
			this.patientFullName !== '' &&
			this.fullNameErrorMessageValid === false &&
			this.fullNameErrorMessage === false &&
			this.EmailErrorMessageValid === false &&
			this.EmailErrorMessage === false &&
			this.DobErrorMessageValid === false &&
			this.DobErrorMessage === false;
	}

	patientSpecificFieldsValid() {
		return true; // Assuming there are no additional checks for patient-specific fields
	}

	otherSpecificFieldsValid() {
		return this.submitterFullName !== '' &&
			this.SubNameErrorMessageValid === false &&
			this.SubNameErrorMessage === false;
	}

	createRecord() {
		CREATE_RECORD({
			submitterType: this.submitterType,
			patientFullName: this.patientFullName,
			patientDateOfBirth: this.patientDateOfBirth,
			submitterFullName: this.submitterFullName,
			submitterEmail: this.submitterEmail
		})
			.then(newRecordId => {
				console.log('New Record Created, ID:', newRecordId);
				this.showToast('Success', 'Record created successfully!', 'success');

				// Call the method to update the field in another record
				this.updateAnotherRecord(newRecordId);
			})
			.catch(error => {
				console.error('Error creating record:', error);
				this.showToast('Error', 'Error creating record', 'error');
			});
	}


	updateAnotherRecord(newRecordId) {
		this.uploadRecordId.forEach(record => {
			UPDATE_FIELD_RECORD({ relatedRecordId: record, newRecordId: newRecordId })
				.then(() => {
					console.log('Related record updated successfully');
					this.showToast('Success', 'Related record updated successfully!', 'success');
					this.uploadTemp = false;
					this.thankYouForm = true;
					this.HeadingNotes = false;
				})
				.catch(error => {
					console.error('Error updating related record:', error);
					this.showToast('Error', 'Error updating related record', 'error');
				});
		})


	}

	handleFileUpload(event) {
		const uploadedFiles = event.detail.files;
		console.log('qwertyu', uploadedFiles)
		uploadedFiles.forEach(file => {
			this.fileEntries.push(file.contentVersionId);
		});
		console.log('upload', JSON.stringify(this.fileEntries))

		UPLOAD_FILE_STANDARD({ documentIds: this.fileEntries })
			.then(result => {
				if (result) {

					result.forEach(rec => {
						this.uploadRecordId.push(rec.Id);

					})
					console.log('erererere', JSON.stringify(this.uploadRecordId))

					this.showToast('Success', 'Files uploaded successfully', 'success');
					this.prepopulated = true;
					this.uploadedfile = uploadedFiles.map(file => ({
						pngtypes: file.mimeType === 'image/png',
						txttypes: file.mimeType === 'text/plain',
						bmptypes: file.mimeType === 'image/bmp',
						jpgtypes: file.mimeType === 'image/jpeg',
						tifftypes: file.mimeType === 'image/tiff',
						pdftypes: file.mimeType === 'application/pdf',
						docxtypes: file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						doctypes: file.mimeType === 'application/msword',
						xlsxtypes: file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
						xlstypes: file.mimeType === 'application/vnd.ms-excel',
						giftypes: file.mimeType === 'image/gif',
						namesss: file.name,
						close: file.close


					}));
				}
			})
			.catch(error => {
				this.showToast('Error', error.body.message, 'error');
			});
	}

	ReturnHome() {
		if (!import.meta.env.SSR) {
			window.location.reload();
		}
	}


	showToast(title, message, variant) {
		if (!import.meta.env.SSR) {
			const event = new ShowToastEvent({
				title: title,
				message: message,
				variant: variant,
			});
			this.dispatchEvent(event);
		}
	}
}