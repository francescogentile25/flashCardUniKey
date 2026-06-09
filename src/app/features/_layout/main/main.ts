import { Component } from '@angular/core';
import { Header } from "../header/header";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-main',
  imports: [
    Header,
    RouterOutlet,
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main{

}
