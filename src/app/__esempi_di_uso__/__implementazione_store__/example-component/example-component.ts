import { Component, inject, OnInit } from '@angular/core';
import { ExampleComponentStore } from "../store/example-component.store";
import { ExampleComponentWithExtensionStore } from "../store/example-component-with-extension.store";
import { EntityResponse } from "../models/responses/entity.response";
import { JsonPipe } from "@angular/common";

const MOCK_ENTITA: EntityResponse = {
  id: 1,
  propA: 'propA',
  propB: 5,
  propC: true,
  propD: undefined
}

@Component({
  selector: 'app-example-component',
  imports: [
    JsonPipe
  ],
  templateUrl: './example-component.html',
  styleUrl: './example-component.scss',
})
export class ExampleComponent implements OnInit {
  public store = inject(ExampleComponentStore);
  // Se necessario invece dello store semplice
  public withExtensionStore = inject(ExampleComponentWithExtensionStore);

  ngOnInit() {
    // Fa la getAll e le entità sono già disponibili come sotto forma di signal con this.store.entities()
    this.store.getAll$();
  }
}
