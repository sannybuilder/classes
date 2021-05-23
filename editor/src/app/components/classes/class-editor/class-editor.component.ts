import { Component, Input } from '@angular/core';

@Component({
  selector: 'scl-class-editor',
  templateUrl: './class-editor.component.html',
  styleUrls: ['./class-editor.component.scss'],
})
export class ClassEditorComponent {
  @Input() className: string;
}
