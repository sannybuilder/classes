import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionTreeComponent } from './decision-tree.component';

describe('DecisionTreeComponent', () => {
  let component: DecisionTreeComponent;
  let fixture: ComponentFixture<DecisionTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DecisionTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DecisionTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
