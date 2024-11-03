import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { twofish } from 'twofish';
import * as Blowfish from 'blowfish';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  // ! ||--------------------------------------------------------------------------------||
  // ! ||                               Member Of Variabels                              ||
  // ! ||--------------------------------------------------------------------------------||
  form = new FormGroup({
    key: new FormControl('', Validators.required),
    algorithm: new FormControl('blowfish'),
    type: new FormControl('encrypt'),
  });

  @ViewChild('inputCsv') inputCsv?: ElementRef;

  teks: ArrayBuffer | string | null = null;
  teskResult: string = '';

  csvFile: File | null = null;

  // ! ||--------------------------------------------------------------------------------||
  // ! ||                                    Algorithm                                   ||
  // ! ||--------------------------------------------------------------------------------||
  twofish(key: string, type?: string) {
    let tf = twofish();
    let keyTransform: number[] = tf.stringToByteArray(key);

    if (type == 'encrypt') {
      let plainText: number[] = tf.stringToByteArray(this.teks);
      let chiperText = tf.encrypt(keyTransform, plainText);
      this.teskResult = this.byteToString(chiperText);
    } else {
      if (!this.teks) return;
      let chiperText = (this.teks as string)
        .split('')
        .map((char) => char.charCodeAt(0));
      let plainText: number[] = tf.decrypt(keyTransform, chiperText);
      this.teskResult = tf.byteArrayToString(plainText.filter((n) => n !== 0));
    }

    this.downloadCSVFile();
  }

  blowfish(key: string, type?: string) {
    let bf = new Blowfish(key);
    if (type == 'encrypt') {
      this.teskResult = this.hexToString(bf.encrypt(this.teks));
    } else {
      this.teskResult = bf.decrypt(this.stringToHex(this.teks as string));
    }

    this.downloadCSVFile();
  }

  // ! ||--------------------------------------------------------------------------------||
  // ! ||                                  Logic Methods                                 ||
  // ! ||--------------------------------------------------------------------------------||
  async submit() {
    await this.readFileSync(this.csvFile);
    let form = this.form.value;

    if (form.algorithm == 'twofish')
      this.twofish(form.key || '', form.type || 'encrypt');
    else this.blowfish(form.key || '', form.type || 'encrypt');

    this.csvFile = null;
    this.inputCsv!.nativeElement.value = '';
  }

  async inputFile(file: Event) {
    if (!file) return;
    const target = file.target as HTMLInputElement;
    this.csvFile = target.files?.[0] || null;
  }

  readFileSync(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve((this.teks = reader.result));
      reader.onerror = () => reject(reader.error);

      reader.readAsText(file);
    });
  }

  byteToString(byte: number[]) {
    return byte.map((num: number) => String.fromCharCode(num)).join('');
  }

  downloadCSVFile() {
    const a = window.document.createElement('a');
    const blob = new Blob([this.teskResult], { type: 'text/csv;' });
    a.href = window.URL.createObjectURL(blob);
    a.download = `${this.form.get(['type'])?.value} ${
      this.form.get(['algorithm'])?.value
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  hexToString(hex: string) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  stringToHex(str: string) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
  }
}
