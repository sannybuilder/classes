import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassEditorComponent } from './class-editor.component';

describe('ClassEditorComponent', () => {
  let component: ClassEditorComponent;
  let fixture: ComponentFixture<ClassEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
