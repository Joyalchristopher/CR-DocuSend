import { LightningElement, api, track } from 'lwc';
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
import WARNING_IMAGE from '@salesforce/resourceUrl/WarningIcon';
import UPLOADFILECSS from '@salesforce/resourceUrl/StandardFile';
import qusImage from '@salesforce/resourceUrl/qusimg';
import pageUrl from '@salesforce/resourceUrl/newrecap';
import pageUrlV3 from '@salesforce/resourceUrl/reCAPTCHAv31';
import THANKYOUICON from '@salesforce/resourceUrl/ThankYouIcon'
import isReCAPTCHAValid from '@salesforce/apex/reCAPTCHAv3ServerController.isReCAPTCHAValid';

import uploadFileToS3 from '@salesforce/apex/AwsFileUploadController.uploadFileChunk'
import createFileRecord from '@salesforce/apex/AwsFileUploadController.createFileRecord'
import createRecord from '@salesforce/apex/FormController.createRecord';
import updateFieldInAnotherRecord from '@salesforce/apex/AwsFileUploadController.updateFieldInAnotherRecord';

import { loadStyle } from "lightning/platformResourceLoader";

export default class FileUploader extends LightningElement {
	@api recordId; // The record ID where the files will be uploaded
	@track filetypejpg = false;
	@track uploadfilepoppup = false;
	@track fileeeemulti = [];
	@track latestFile = [];
	@track fileEntries;
	@track updatefile = [];
	@track navigateTo;
	@track limitUpload = false;
	@track thankYouForm = false;
	@track patientForm = true;
	@track lastUploaded = false;
	@track filecount;
	@track downlink;
	@track CountFiles = [];
	@track countFiles = 0;
	@track formToken;
	@track validReCAPTCHA = false;
	@track humanScore = 0; // Initialize human score
	@track navigateToV3 = pageUrlV3;
	@track submitterType;
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
	@track completedCount = 0;
	@track rejectFileName;
	@track uploadedfile = [];
	@track largerfile = [];
	@track isLoading = false;
	@track reupload = false;
	@track errorValue = true;
	@track uploadRecordId = []
	@track CloseUpload = false;
	@track deselectUpload = false;
	@track UploadedName;
	@track bandwidthLow = false;
	@track UploadProgress;

	acceptedFormats = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.gif', 'docx', '.doc', '.bmp', '.xlsx', '.xls', '.tiff', '.tif']; // Accepted file formats
	tickIcon = TICKICON;
	img = qusImage;
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
	picklistOptions = [{ label: 'Patient', value: 'Patient' },
	{ label: 'Caregiver', value: 'Caregiver' },
	{ label: 'Healthcare Provider', value: 'Healthcare Provider' }
	]



	handleDragOver(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
	}

	handleDrop(event) {
		event.preventDefault();
		this.handleFiles(event.dataTransfer.files);
	}

	handleFileChange(event) {
		console.log('sample', event.target.files)
		this.handleFiles(event.target.files);

	}


	constructor() {
		super();
		this.navigateTo = pageUrl;
	}


	handleButtonClick() {
		// Trigger the hidden file input click event
		this.reupload = false;
		this.template.querySelector('input.file-input').click();
	}


	/////////////////////////////////////////////






	connectedCallback() {
		try{
			loadStyle(this, UPLOADFILECSS);

		console.log('eeeeeeee')
		window.addEventListener('message', (e) => {
			if (e.data.action === "getCAPCAH" && e.data.callCAPTCHAResponse === "NOK") {
				console.log("Token not obtained!");
			} else if (e.data.action === "getCAPCAH") {
				this.formToken = e.data.callCAPTCHAResponse;
				isReCAPTCHAValid({ tokenFromClient: this.formToken })
					.then(data => {
						if (data && data.success) {
							this.validReCAPTCHA = true;
							this.humanScore = data.score; // Assign human score from response
							console.log('Human score:', this.humanScore);
						} else {
							this.validReCAPTCHA = false;
							console.error('reCAPTCHA validation failed');
						}
					})
					.catch(error => {
						console.error('Error validating reCAPTCHA:', error);
					});
			}
		});


		if (navigator.connection) {
			this.updateConnectionInfo();

			// Listen for changes in network connection
			navigator.connection.addEventListener('change', this.updateConnectionInfo.bind(this));
		}
		}
		catch(err){
			console.log('error caught',err)	
	}
}

	updateConnectionInfo() {
		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		this.downlink = connection.downlink;
		if (this.downlink < 1) {
			this.bandwidthLow = true;
		} else {
			this.bandwidthLow = false;
		}


	}

	captchaLoadedV3(evt) {
		console.log(evt.target.getAttribute('src') + ' loaded');
	}



	///////////////////////////////////////////






	handleInputChange(event) {
		const field = event.target.name;
		const value = event.target.value;

		if (field === 'submitterType') {
			this.submitterType = value;
			this.PatientYes = this.submitterType === 'Patient';
			this.NoPatient = !this.PatientYes;
			this.checkAllFieldsValid();
			return;
		}

		if (field === 'patientFullName') {
			this.patientFullName = value;
			this.fullNameErrorMessage = !value;
			this.fullNameErrorMessageValid = !/^[a-zA-Z]+$/.test(value) && value;
			this.checkAllFieldsValid();
			return;
		}

		if (field === 'patientDateOfBirth') {
			this.patientDateOfBirth = value;
			const currentDate = new Date();
			const selectedDateObj = new Date(value);

			this.DobErrorMessage = !value;
			this.DobErrorMessageValid = selectedDateObj > currentDate && value;
			this.checkAllFieldsValid();
			return;
		}

		if (field === 'submitterFullName') {
			this.submitterFullName = value;
			this.SubNameErrorMessage = !value;
			this.SubNameErrorMessageValid = !/^[a-zA-Z]+$/.test(value) && value;
			this.checkAllFieldsValid();
			return;
		}

		if (field === 'submitterEmail') {
			this.submitterEmail = value;
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

			this.EmailErrorMessage = !value;
			this.EmailErrorMessageValid = !emailRegex.test(value) && value;
			this.checkAllFieldsValid();
			return;
		}

		this.checkAllFieldsValid();
	}


	checkAllFieldsValid() {
		if (this.PatientYes === true) {
			const allFieldsValid =
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

			this.isButtonDisabled = !allFieldsValid;
		} else {
			const allFieldsValid =
				this.submitterType &&
				this.patientFullName &&
				this.patientDateOfBirth &&
				this.submitterFullName &&
				this.submitterEmail &&
				!this.fullNameErrorMessage &&
				!this.fullNameErrorMessageValid &&
				!this.DobErrorMessage &&
				!this.DobErrorMessageValid &&
				!this.SubNameErrorMessage &&
				!this.SubNameErrorMessageValid &&
				!this.EmailErrorMessage &&
				!this.EmailErrorMessageValid;

			this.isButtonDisabled = !allFieldsValid;
		}

	}

	handleFormSubmit() {
		if (this.humanScore < 0.5) {
			return;
		}
		if (this.submitterType === 'Patient') {
			console.log('qwerttyuuioopp[p', this.patientFullName)
			if (this.submitterEmail !== null && this.patientDateOfBirth !== '' && this.patientFullName !== '' && this.fullNameErrorMessageValid === false && this.fullNameErrorMessage === false && this.EmailErrorMessageValid === false && this.EmailErrorMessage === false && this.DobErrorMessageValid === false && this.DobErrorMessage === false) {
				createRecord({
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
		} else {
			if (this.submitterEmail !== null && this.patientDateOfBirth !== '' && this.patientFullName !== '' && this.submitterFullName !== '' && this.fullNameErrorMessageValid === false && this.fullNameErrorMessage === false && this.EmailErrorMessageValid === false && this.EmailErrorMessage === false && this.DobErrorMessageValid === false && this.DobErrorMessage === false && this.SubNameErrorMessageValid === false && this.SubNameErrorMessage === false) {
				createRecord({
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
		}

	}

	updateAnotherRecord(newRecordId) {
		this.uploadRecordId.forEach(record => {
			updateFieldInAnotherRecord({ relatedRecordId: record, newRecordId: newRecordId })
				.then(() => {
					console.log('Related record updated successfully');
					this.showToast('Success', 'Related record updated successfully!', 'success');
					this.patientForm = false;
					this.thankYouForm = true;
				})
				.catch(error => {
					console.error('Error updating related record:', error);
					this.showToast('Error', 'Error updating related record', 'error');
				});
		})


	}
	//////////////////////////////////////////


	handleFiles(fileList) {
		// Clear previous file entries and queues
		this.fileeeemulti = [];
		this.fileEntriesQueue = [];

		const newFiles = Array.from(fileList);
		console.log('New files:', newFiles);
		this.countFiles = this.countFiles + newFiles.length;

		if (this.countFiles > 10) {
			this.limitUpload = true;
			this.showToast('error', 'Only upload 10 files', 'error');
			return;
		}
		// if (this.countFiles === 10) {
		//     this.countFiles = 0;
		// }


		const newFileNames = newFiles.map(file => file.name);
		const existingFileNames = this.uploadedfile.map(file => file.namesss);

		const duplicates = newFileNames.filter(name => existingFileNames.includes(name));
		if (duplicates.length > 0) {
			this.showToast('error', `Duplicate files found: ${duplicates.join(', ')}`, 'error');
			return;
		}

		const fileEntries = [];
		newFiles.forEach((file, index) => {
			const reader = new FileReader();
			reader.onload = async () => {
				const files = new Blob([reader.result], { type: 'application/pdf' });
				console.log('rrrrrr', files)

				const text = await files.text();
				console.log('rreeeerrrr', text)
				// Check if the text content indicates encryption
				const isEncrypted = text.includes("/Encrypt") || text.includes("<<") || text.includes(">>");
				console.log("isEncrypted", isEncrypted);

				const newFileEntry = {
					Id: `${file.name}-${index}`, // Generate a unique Id for each file
					pngtypes: file.type === 'image/png',
					txttypes: file.type === 'text/plain',
					bmptypes: file.type === 'image/bmp',
					jpgtypes: file.type === 'image/jpeg',
					tifftypes: file.type === 'image/tiff',
					pdftypes: file.type === 'application/pdf',
					docxtypes: file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					doctypes: file.type === 'application/msword',
					xlsxtypes: file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					xlstypes: file.type === 'application/vnd.ms-excel',
					giftypes: file.type === 'image/gif',
					namesss: file.name,
					sizeee: file.size,
					mbSize: this.convertBytesToMB(file.size),
					error: false,
					progress: 0,
					close: false,
					tick: false,
					base64: reader.result.split(',')[1] // Remove the Base64 prefix
				};


				fileEntries.push(newFileEntry);

				// Check if all files have been processed
				if (fileEntries.length === newFiles.length) {
					this.fileeeemulti = fileEntries;
					this.filecount = this.fileeeemulti.length;
					this.uploadfilepoppup = true;
					setTimeout(() => {
						try {
							this.simulateFileUpload(this.fileeeemulti);
						} catch (err) {
							this.showToast('Error', err.body.message, 'error');
						} 
					}, 500);
					
				}
			};

			reader.readAsDataURL(file);
		});


	}

	closeUploadLimit() {
		this.limitUpload = false;
	}
	async simulateFileUpload(fileEntries) {
		this.fileEntriesQueue = [...fileEntries];
		console.log('File entries queue:', this.fileEntriesQueue);
		await this.uploadNextFile();
	}

	async uploadNextFile() {
		if (this.fileEntriesQueue.length === 0) {
			return;
		}
	
		const file = this.fileEntriesQueue.shift();
		console.log('Uploading file:', file);
	
		const updateProgress = () => {
			if (file.progress < 100) {
				file.progress += 25;
				console.log('Current progress:', file.progress);
	
				const progressBar = this.template.querySelector(`[data-id="${file.Id}"] .myBar`);
				if (progressBar) {
					progressBar.style.width = file.progress + "%";
				} else {
					console.error('Progress bar element not found');
					return;
				}
	
				// Start the next file upload when the current file reaches 50% progress
				if (file.progress === 50 && this.fileEntriesQueue.length > 0) {
					this.uploadNextFile();
				}
	
				setTimeout(() => {
					try {
						updateProgress();
					} catch (err) {
						this.showToast('Error', err.message || 'An unknown error occurred', 'error');
					}       
				}, 500); // Schedule the next update
			} else {
				const isFileSizeValid = file.sizeee <= 31457280;
			const progressBar = this.template.querySelector(`[data-id="${file.Id}"] .myBar`);
			if (progressBar) {
				progressBar.style.width = 100 + "%";
			}
			console.log('File size valid:', isFileSizeValid);
	
			if (!isFileSizeValid) {
				// File is too large
				file.progress = 100;
				file.close = false;
				file.tick = false;
				file.error = true;
				if (progressBar) {
					progressBar.style.backgroundColor = 'red'; // Indicate error with red color
				}
			} else {
				file.progress = 100;
				file.close = true;
				file.tick = true;
				this.checkProgressCompletion();
			}
	
			this.fileeeemulti = [...this.fileeeemulti];
			console.log('Updated fileeeemulti:', this.fileeeemulti);
			}
		};
	
	
		updateProgress(); // Start the progress updates
	}
	
	
	



	convertBytesToMB(bytes) {
		const megabytes = bytes / (1024 * 1024);
		return megabytes.toFixed(1);
	}


	checkProgressCompletion() {
		const completedFiles = this.fileeeemulti.filter(file => file.progress === 100).length;
		this.completedCount = completedFiles;
		console.log(`${this.completedCount} records have reached 100% progress.`);
		return this.completedCount;
	}

	crossEvent(event) {
		this.rejectFileName = event.currentTarget.dataset.id;
		this.deselectUpload = true;
	}
	UploadRemove() {
		this.fileeeemulti = this.fileeeemulti.filter(file => file.Id !== this.rejectFileName);
		this.deselectUpload = false;
		if (this.fileeeemulti.length === 0) {
			this.uploadfilepoppup = false;
		}
	}
	deslectUploadCross() {
		this.deselectUpload = false;
	}








	closeUploadFiles() {
		this.CloseUpload = true;
	}
	closeUploadCross() {
		this.CloseUpload = false;
	}




	generateUniqueFileName(originalName) {
		const timestamp = Date.now();
		return `${timestamp}-${originalName}`;
	}

	doneClickUpload() {
		if (this.humanScore < 0.5) {
			return;
		}
		console.log('eessssssssssssssse')

		console.log('Final file data:', JSON.stringify(this.fileeeemulti));

		this.uploadfilepoppup = false;
		console.log('fgfgfgf', this.uploadfilepoppup)

		// Create a deep clone of each file object in the array to ensure no proxy issues
		this.updatefile = this.fileeeemulti.map(file => ({ ...file }));
		console.log('Copied file array:', this.updatefile);
		this.largerfile = this.updatefile.filter(file => file.sizeee >= 31457280);

		console.log(this.largerfile.length, 'largerfile')
		// Filter files based on size
		this.updatefile = this.updatefile.filter(file => file.sizeee <= 31457280);
		console.log('Filtered file array:', this.updatefile);

		// Combine the filtered new files with the existing uploaded files
		const uploadedfiles = [...(this.uploadedfile || []), ...this.updatefile];
		console.log('Combined file array:', uploadedfiles);
		console.log('daiii')
		// Update the uploaded file list and set the flag
		this.uploadedfile = uploadedfiles.map(file => ({
			pngtypes: file.pngtypes,
			txttypes: file.txttypes,
			bmptypes: file.bmptypes,
			jpgtypes: file.jpgtypes,
			tifftypes: file.tifftypes,
			pdftypes: file.pdftypes,
			docxtypes: file.docxtypes,
			doctypes: file.doctypes,
			xlsxtypes: file.xlsxtypes,
			xlstypes: file.xlstypes,
			giftypes: file.giftypes,
			namesss: file.namesss,
			sizeee: file.sizeee,
			mbSize: file.mbSize,
			error: file.error,
			progress: file.progress,
			close: file.close,
			tick: file.tick,
			base64: file.base64
		}));
		console.log('fftyteytey', this.uploadedfile)
		this.lastUploaded = true;
		this.UploadProgress = true;

		console.log('this.lastUploaded', this.lastUploaded)
		console.log('adhi', this.uploadedfile.length)
		this.uploadedfile.forEach(file => {
			const chunkSize = 3.5 * 1024 * 1024; // 3.5 MB
			const totalChunks = Math.ceil(file.base64.length / chunkSize);
			const uniqueFileName = this.generateUniqueFileName(file.namesss);
			console.log('uniqueFileName', uniqueFileName)




			const uploadChunk = (chunkIndex) => {
				if (chunkIndex >= totalChunks) {
					this.showToast('Success', 'All files uploaded and records created successfullysssss.', 'success');



					return;
				}
				setTimeout(() => {
					try {
						this.progressBarUpload = this.template.querySelector(`.myBarUpload`);
					} catch (err) {
						this.showToast('Error', err.body.message, 'error');
					} 
				}, 100);

				const start = chunkIndex * chunkSize;
				const end = Math.min((chunkIndex + 1) * chunkSize, file.base64.length);
				const chunk = file.base64.substring(start, end);

				uploadFileToS3({
					base64Data: chunk,
					fileName: uniqueFileName,
					isLastChunk: chunkIndex === totalChunks - 1
				}).then(s3Url => {
					if (chunkIndex === totalChunks - 1) {

						// const valueName = s3Url.split('/').pop();
						// this.UploadedName.push(valueName)
						// console.log('this.UploadedName',this.UploadedName);  
						return createFileRecord({ fileUrl: s3Url, fileName: file.namesss });
					} 
						return Promise.resolve();
					
				}).catch(error => {
					this.showToast('Error', 'Error uploading file: ' + error.body.message, 'error');
					return Promise.resolve();
				}).then(recordId => {

					console.log('trewqqqqq', recordId)
					this.uploadRecordId.push(recordId);
					this.uploadRecordIdOnly = this.uploadRecordId.filter(record => record !== null);
					console.log('eteerterte', this.uploadRecordIdOnly.length)
					const uploadProgressValue = 100 * this.uploadRecordIdOnly.length / this.uploadedfile.length;
					this.progressBarUpload.style.width = uploadProgressValue + "%";
					if (this.uploadedfile.length === this.uploadRecordIdOnly.length) {
						this.UploadProgress = false;
					}

					if (chunkIndex === totalChunks - 1) {
						if (this.largerfile.length > 0) {
							this.reupload = true;
						}

					}

					uploadChunk(chunkIndex + 1);
				}).catch(error => {
					this.showToast('Error', 'Error uploading file: ' + error.body.message, 'error');

				});
			};

			if (file.base64 && file.namesss) {
				console.log('kkkkkkkkkkkkk')
				uploadChunk(0);
			} else {
				this.showToast('Error', 'Please select a file to upload.', 'error');

			}
		});



	}


	handleBackButtonClick() {


	}

	showToast(title, message, variant) {
		const event = new ShowToastEvent({
			title: title,
			message: message,
			variant: variant,
		});
		this.dispatchEvent(event);
	}
}