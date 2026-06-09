import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class SpinLoaderService {
  private status: boolean = false;

  startSpinLoader(): void {
    this.status = true;
  }
  stopSpinLoader(): void {
    this.status = false;
  }
  loaderStatus(): boolean {
    return this.status;
  }
}
